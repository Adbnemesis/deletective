import { DurableObject } from 'cloudflare:workers';
import type { Credentials, Settings } from '../../packages/shared/types';
import { activePlayers, addPlayer, cleanText, createRoom, GameError, getPlayer, IDLE_TTL, DISCONNECT_GRACE, migrateHost, react, readyNext, rematch, removePlayer, requireHost, ROOM_TTL, settingsFrom, setConnected, startGame, submit, tick, viewFor, vote, type Player, type Room } from '../../packages/game-core/engine';
import { dailyPrompt } from '../../content/prompts';

type Env = { ROOMS: DurableObjectNamespace<GameRoom>; GATES: DurableObjectNamespace<AbuseGate>; ASSETS: Fetcher; PUBLIC_SITE_URL?: string; ENVIRONMENT?: string };
type SocketMeta = { playerId?: string; openedAt: number; windowAt: number; count: number; invalid: number };
const json = (data:unknown,status=200) => Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'}});
const errorResponse = (e:unknown) => json({error:e instanceof GameError?e.message:'The server could not complete that. Please try again.'},e instanceof GameError?400:500);
async function digest(value:string) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(b=>b.toString(16).padStart(2,'0')).join(''); }
function token() { return [...crypto.getRandomValues(new Uint8Array(32))].map(b=>b.toString(16).padStart(2,'0')).join(''); }
function roomCode() { const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';return [...crypto.getRandomValues(new Uint8Array(8))].map(b=>alphabet[b%alphabet.length]).join(''); }
async function body(request:Request):Promise<Record<string,unknown>> {
  if(Number(request.headers.get('Content-Length')??0)>4096)throw new GameError('That request is too large.');
  const reader=request.body?.getReader();let text='';let bytes=0;const decoder=new TextDecoder();
  if(reader)for(;;){const {value,done}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>4096){await reader.cancel();throw new GameError('That request is too large.');}text+=decoder.decode(value,{stream:true});}
  text+=decoder.decode();let value;try{value=JSON.parse(text);}catch{throw new GameError('Send a valid JSON request.');}if(!value||typeof value!=='object'||Array.isArray(value))throw new GameError('Invalid request.');return value;
}
async function newPlayer(data:Record<string,unknown>,now:number) { const secret=token();const player:Player={id:crypto.randomUUID(),name:cleanText(data.name,20,'Name'),avatar:Number.isInteger(data.avatar)&&Number(data.avatar)>=0&&Number(data.avatar)<8?Number(data.avatar):0,tokenHash:await digest(secret),score:0,connected:false,disconnectedAt:now,joinedAt:now};return {player,secret}; }
function originAllowed(request:Request,env:Env) { const origin=request.headers.get('Origin');if(!origin)return true;const allowed=[new URL(request.url).origin];if(env.PUBLIC_SITE_URL)try{allowed.push(new URL(env.PUBLIC_SITE_URL).origin);}catch{}if(new URL(request.url).hostname==='localhost'||new URL(request.url).hostname==='127.0.0.1')allowed.push('http://localhost:4321','http://localhost:8787','http://localhost:4173','http://127.0.0.1:4321','http://127.0.0.1:8787','http://127.0.0.1:4173');return allowed.includes(origin); }
async function gate(request:Request,env:Env,kind:string,limit:number) { const ip=request.headers.get('CF-Connecting-IP')??'local';const key=await digest(`${kind}:${ip}`);const response=await env.GATES.get(env.GATES.idFromName(key)).fetch(new Request('https://gate.internal/',{method:'POST',body:JSON.stringify({limit})}));if(!response.ok)throw new GameError('Too many requests. Wait a minute and try again.'); }
export default {
  async fetch(request:Request,env:Env):Promise<Response>{
    const url=new URL(request.url);
    try {
      if(url.pathname.startsWith('/api/')) {
        if(!originAllowed(request,env))return json({error:'This origin is not allowed.'},403);
        if(url.pathname==='/api/health')return json({ok:true,service:'deletective-realtime'});
        if(url.pathname==='/api/daily') {
          const date=new Date().toISOString().slice(0,10);const full=dailyPrompt(date);const {example,...prompt}=full;
          if(request.method==='GET')return json({date,prompt});
          if(request.method==='POST'){await gate(request,env,'daily',30);const data=await body(request);if(data.date!==date)throw new GameError('A new daily challenge is ready. Refresh and try today’s prompt.');const answer=cleanText(data.text,240);return json({date,prompt,example,answer,completed:true});}
          return json({error:'Method not allowed.'},405);
        }
        if(url.pathname==='/api/rooms'&&request.method==='POST') {
          await gate(request,env,'create',10);const data=await body(request);const settings=settingsFrom(data.settings??{});const now=Date.now();const {player,secret}=await newPlayer(data,now);
          for(let i=0;i<3;i++){const code=roomCode();const response=await env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(new Request('https://room.internal/init',{method:'POST',body:JSON.stringify({code,player,settings,now})}));if(response.ok)return json({code,playerId:player.id,token:secret} satisfies Credentials,201);}
          return json({error:'Could not create a room. Try again.'},503);
        }
        const match=url.pathname.match(/^\/api\/rooms\/([A-Z2-9]{8})\/(join|ws)$/i);
        if(match) {
          const code=match[1].toUpperCase();if(match[2]==='join'&&request.method==='POST')await gate(request,env,'join',30);
          else if(match[2]==='ws')await gate(request,env,'connect',120);
          else return json({error:'Method not allowed.'},405);
          return await env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(request);
        }
        return json({error:'Room not found. Check the eight-character code.'},404);
      }
      const assetUrl=new URL(request.url);
      if(/^\/room\//.test(url.pathname))assetUrl.pathname='/room';
      let response=await env.ASSETS.fetch(new Request(assetUrl,request));
      const headers=new Headers(response.headers);
      headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','same-origin');headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');headers.set('X-Frame-Options','DENY');
      headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' ws://localhost:* ws://127.0.0.1:*; media-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
      if(url.pathname.startsWith('/room')){headers.set('X-Robots-Tag','noindex, nofollow, noarchive');headers.set('Cache-Control','no-store');}
      return new Response(response.body,{status:response.status,headers});
    }catch(e){return errorResponse(e);}
  }
} satisfies ExportedHandler<Env>;

export class AbuseGate extends DurableObject<Env> {
  async fetch(request:Request) { const {limit}=await request.json() as {limit:number};const now=Date.now();let window=await this.ctx.storage.get<{at:number;count:number}>('window');if(!window||now-window.at>=60000)window={at:now,count:0};if(window.count>=limit)return json({error:'Rate limited.'},429);window.count++;await this.ctx.storage.put('window',window);await this.ctx.storage.setAlarm(window.at+60000);return json({ok:true}); }
  async alarm(){await this.ctx.storage.deleteAll();await this.ctx.storage.deleteAlarm();}
}
export class GameRoom extends DurableObject<Env> {
  room:Room|undefined;
  constructor(ctx:DurableObjectState,env:Env){
    super(ctx,env);
    ctx.blockConcurrencyWhile(async()=>{
      this.room=await ctx.storage.get<Room>('room');
      if(!this.room)return;
      // Hibernation preserves sockets. A process/runtime restart may not: reconcile
      // persisted presence so a vanished socket cannot remain a connected player.
      const present=new Set(ctx.getWebSockets().filter(ws=>ws.readyState===1).map(ws=>(ws.deserializeAttachment() as SocketMeta)?.playerId));
      let changed=false;for(const player of this.room.players){if(player.removed)continue;const connected=present.has(player.id);if(player.connected!==connected){player.connected=connected;player.disconnectedAt=connected?null:Date.now();changed=true;}}
      if(changed)await this.persist();
    });
  }
  async fetch(request:Request):Promise<Response>{
    try{
      const path=new URL(request.url).pathname;
      if(path==='/init'&&request.method==='POST'){if(this.room)return json({error:'Room exists.'},409);const {code,player,settings,now}=await request.json() as {code:string;player:Player;settings:Settings;now:number};this.room=createRoom(code,player,settings,now);await this.persist();return json({ok:true});}
      if(!this.room){if(request.body)await body(request);return json({error:'Room not found or expired. Create a new one.'},404);}
      tick(this.room,Date.now());if(this.room.expired){await this.expire();return json({error:'This room expired. Create a fresh room.'},410);}
      if(path.endsWith('/join')&&request.method==='POST'){const data=await body(request);const {player,secret}=await newPlayer(data,Date.now());addPlayer(this.room,player);this.room.updatedAt=Date.now();await this.persist();this.broadcast();return json({code:this.room.code,playerId:player.id,token:secret} satisfies Credentials,201);}
      if(path.endsWith('/ws')){
        if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return json({error:'A WebSocket connection is required.'},426);
        if(this.ctx.getWebSockets().length>=24)return json({error:'Too many connections. Close extra tabs and try again.'},429);
        const pair=new WebSocketPair();const client=pair[0],server=pair[1];this.ctx.acceptWebSocket(server);server.serializeAttachment({openedAt:Date.now(),windowAt:Date.now(),count:0,invalid:0} satisfies SocketMeta);await this.schedule();return new Response(null,{status:101,webSocket:client});
      }
      return json({error:'Not found.'},404);
    }catch(e){return errorResponse(e);}
  }
  async webSocketMessage(ws:WebSocket,message:string|ArrayBuffer){
    const now=Date.now();const meta=ws.deserializeAttachment() as SocketMeta;
    try{
      if(!this.room){ws.close(4004,'Room expired');return;}
      tick(this.room,now);if(this.room.expired){await this.expire();return;}
      if(typeof message!=='string'||message.length>2048)throw new GameError('Invalid message size.');
      if(now-meta.windowAt>10000){meta.windowAt=now;meta.count=0;}meta.count++;if(meta.count>35){ws.close(4008,'Too many actions');return;}ws.serializeAttachment(meta);
      let data:Record<string,unknown>;try{data=JSON.parse(message);}catch{throw new GameError('Invalid message.');}if(!data||typeof data!=='object'||Array.isArray(data))throw new GameError('Invalid action.');
      if(!meta.playerId){
        if(data.type!=='auth'||typeof data.token!=='string'||!/^[a-f0-9]{64}$/.test(data.token)){ws.close(4001,'Invalid session');return;}
        const hash=await digest(data.token);const player=this.room.players.find(p=>p.tokenHash===hash&&!p.removed);if(!player){ws.close(4001,'Invalid session');return;}
        for(const socket of this.ctx.getWebSockets())if(socket!==ws&&(socket.deserializeAttachment() as SocketMeta)?.playerId===player.id)socket.close(4002,'Connected in another tab');
        meta.playerId=player.id;ws.serializeAttachment(meta);setConnected(this.room,player.id,true,now);migrateHost(this.room,now);await this.persist();this.broadcast();return;
      }
      const id=meta.playerId;getPlayer(this.room,id);
      if(data.type==='ping'){ws.send(JSON.stringify({type:'pong',serverNow:now}));return;}
      switch(data.type){
        case 'start':startGame(this.room,id,now);break;
        case 'submit':submit(this.room,id,data.text,data.roundId,false,now);break;
        case 'reaction':submit(this.room,id,data.text,data.roundId,true,now);break;
        case 'vote':vote(this.room,id,data.answerId,data.roundId,now);break;
        case 'react':react(this.room,id,data.answerId,data.emoji,data.roundId,now);break;
        case 'next':readyNext(this.room,id,now);break;
        case 'rematch':rematch(this.room,id,now);break;
        case 'settings':requireHost(this.room,id);if(this.room.phase!=='lobby')throw new GameError('Settings lock when the game starts.');const settings=settingsFrom(data.settings,this.room.settings);if(activePlayers(this.room).length>(settings.mode==='duo'||settings.mode==='couples'?2:10))throw new GameError('This mode has room for two players.');this.room.settings=settings;break;
        case 'kick':requireHost(this.room,id);if(data.playerId===id)throw new GameError('Use Leave to leave the room.');getPlayer(this.room,String(data.playerId));removePlayer(this.room,String(data.playerId),now);for(const socket of this.ctx.getWebSockets())if((socket.deserializeAttachment() as SocketMeta)?.playerId===data.playerId)socket.close(4003,'Removed by host');break;
        case 'leave':removePlayer(this.room,id,now);ws.close(1000,'Left room');break;
        case 'report':if(data.roundId!==this.room.roundId||!this.room.answers.some(a=>a.id===data.answerId)||!['reveal','voting','results','complete'].includes(this.room.phase))throw new GameError('That answer is not available to report.');for(const socket of this.ctx.getWebSockets())if((socket.deserializeAttachment() as SocketMeta)?.playerId===this.room.hostId)socket.send(JSON.stringify({type:'notice',message:'A player reported a revealed answer. Review the round and use your player controls if needed.'}));ws.send(JSON.stringify({type:'notice',message:'The host has been notified. You can also hide this player’s answers on your device.'}));return;
        default:throw new GameError('Unknown action.');
      }
      this.room.updatedAt=now;await this.persist();this.broadcast();
    }catch(e){meta.invalid++;ws.serializeAttachment(meta);if(meta.invalid>=10){ws.close(4008,'Too many invalid actions');return;}ws.send(JSON.stringify({type:'error',message:e instanceof GameError?e.message:'That action failed. Try again.'}));if(this.room){await this.persist();this.broadcast();}}
  }
  async webSocketClose(ws:WebSocket,_code:number,_reason:string,_wasClean:boolean){await this.disconnected(ws);}
  async webSocketError(ws:WebSocket,_error:unknown){await this.disconnected(ws);}
  async disconnected(ws:WebSocket){if(!this.room)return;const meta=ws.deserializeAttachment() as SocketMeta;if(meta?.playerId){const remaining=this.ctx.getWebSockets().some(s=>s!==ws&&(s.deserializeAttachment() as SocketMeta)?.playerId===meta.playerId&&s.readyState===1);const player=this.room.players.find(p=>p.id===meta.playerId&&!p.removed);if(player&&!remaining){setConnected(this.room,player.id,false,Date.now());await this.persist();this.broadcast();}}}
  broadcast(){if(!this.room)return;for(const ws of this.ctx.getWebSockets()){const meta=ws.deserializeAttachment() as SocketMeta;if(meta?.playerId&&this.room.players.some(p=>p.id===meta.playerId&&!p.removed))try{ws.send(JSON.stringify({type:'state',state:viewFor(this.room,meta.playerId,Date.now())}));}catch{}}}
  async persist(){if(this.room)await this.ctx.storage.put('room',this.room);await this.schedule();}
  async schedule(){if(!this.room)return;const now=Date.now();const times=[this.room.createdAt+ROOM_TTL,this.room.updatedAt+IDLE_TTL];if(this.room.deadline)times.push(this.room.deadline);const host=this.room.players.find(p=>p.id===this.room!.hostId&&!p.removed);if(host&&!host.connected&&host.disconnectedAt!==null&&host.disconnectedAt+DISCONNECT_GRACE>now)times.push(host.disconnectedAt+DISCONNECT_GRACE);for(const ws of this.ctx.getWebSockets()){const meta=ws.deserializeAttachment() as SocketMeta;if(!meta?.playerId&&ws.readyState===1)times.push((meta?.openedAt??now)+5000);}await this.ctx.storage.setAlarm(Math.max(now+10,Math.min(...times)));}
  async alarm(){if(!this.room)return;const now=Date.now();for(const ws of this.ctx.getWebSockets()){const meta=ws.deserializeAttachment() as SocketMeta;if(!meta?.playerId&&now-(meta?.openedAt??0)>=5000)ws.close(4001,'Authentication timed out');}tick(this.room,now);if(this.room.expired){await this.expire();return;}await this.persist();this.broadcast();}
  async expire(){for(const ws of this.ctx.getWebSockets())try{ws.close(4004,'Room expired');}catch{}this.room=undefined;await this.ctx.storage.deleteAll();await this.ctx.storage.deleteAlarm();}
}
