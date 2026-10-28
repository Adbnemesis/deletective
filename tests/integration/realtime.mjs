/** Real HTTP + independent WebSocket clients against Wrangler / deployed staging. No simulated state. */
import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL??'http://127.0.0.1:8787';
const runIP=`127.0.${Math.floor(Math.random()*240)}.${Math.floor(Math.random()*240)}`;
let checks=0;
const sockets=[];
const pass=(name)=>{checks++;console.log(`PASS ${name}`);};
async function api(path,data,extra={}){const r=await fetch(base+path,{method:data?'POST':'GET',headers:{'Content-Type':'application/json','CF-Connecting-IP':runIP,...extra},body:data?JSON.stringify(data):undefined});return{status:r.status,body:await r.json()};}
async function client(credentials){
 const ws=new WebSocket(`${base.replace(/^http/,'ws')}/api/rooms/${credentials.code}/ws`);sockets.push(ws);const inbox=[];let state;
 ws.addEventListener('message',event=>{const message=JSON.parse(event.data);inbox.push(message);if(message.type==='state')state=message.state;});
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 ws.send(JSON.stringify({type:'auth',token:credentials.token}));
 const result={ws,credentials,inbox,get state(){return state;},send(data){ws.send(JSON.stringify(data));},async wait(predicate,timeout=12000){const end=Date.now()+timeout;while(Date.now()<end){if(predicate(state,inbox))return state;await new Promise(r=>setTimeout(r,25));}throw new Error(`Timed out waiting in ${state?.phase??'auth'}`);}};
 await result.wait(s=>s?.you===credentials.playerId);return result;
}
async function room(mode,count,rounds=1){const created=await api('/api/rooms',{name:'Player 0',avatar:0,settings:{mode,rounds,writingSeconds:30}});assert.equal(created.status,201);const clients=[await client(created.body)];for(let i=1;i<count;i++){const joined=await api(`/api/rooms/${created.body.code}/join`,{name:`Player ${i}`,avatar:i%8});assert.equal(joined.status,201);clients.push(await client(joined.body));}await clients[0].wait(s=>s.players.filter(p=>p.connected).length===count);return clients;}
async function all(clients,predicate){return Promise.all(clients.map(c=>c.wait(predicate)));}
async function next(clients){for(const c of clients)c.send({type:'next'});}
async function write(clients,text='The toaster has hired a lawyer'){for(const [i,c]of clients.entries())c.send({type:'submit',text:`${text} ${i}`,roundId:c.state.roundId});await all(clients,s=>s?.phase==='reveal');}
try{
 assert.equal((await api('/api/health')).body.ok,true);pass('Worker health');
 const invalid=await api('/api/rooms/XXXXXXXX/join',{name:'Nobody'});assert.equal(invalid.status,404);pass('invalid room handled');
 const duo=await room('duo',2);const [a,b]=duo;
 b.send({type:'start'});await b.wait((s,inbox)=>inbox.some(m=>m.type==='error'&&m.message.includes('host')));pass('guest cannot start');
 a.send({type:'start'});await all(duo,s=>s?.phase==='writing');
 a.send({type:'submit',text:'An extremely secret goldfish confession',roundId:a.state.roundId});await b.wait(s=>s?.players.find(p=>p.id===a.credentials.playerId)?.submitted);assert(!JSON.stringify(b.inbox).includes('goldfish confession'));assert.equal(b.state.answers.length,0);pass('unpublished answer absent from all other-client frames');
 b.send({type:'submit',text:'I sold the elevator to a magician',roundId:b.state.roundId});await all(duo,s=>s?.phase==='reveal');assert.equal(a.state.answers.length,2);assert.equal(b.state.answers.length,2);pass('two real clients independently submit and synchronize reveal');
 const saved=a.credentials;a.ws.close();const returned=await client(saved);await returned.wait(s=>s?.answers.length===2);assert.equal(returned.state.you,saved.playerId);pass('authenticated reconnect restores answer and player identity');
 await next([returned,b]);await all([returned,b],s=>s?.phase==='results');assert.equal(returned.state.sharedScore,200);await next([returned,b]);await all([returned,b],s=>s?.phase==='complete');returned.send({type:'rematch'});await all([returned,b],s=>s?.phase==='lobby');returned.send({type:'start'});await all([returned,b],s=>s?.phase==='writing');await write([returned,b]);pass('duo results, complete and functional rematch');
 for(const count of [3,6]){
  const party=await room('party',count);party[0].send({type:'start'});await all(party,s=>s?.phase==='writing');await write(party);
  assert(party[0].state.answers.every(answer=>!answer.authorId&&!answer.author));party[0].send({type:'report',answerId:party[0].state.answers[0].id,roundId:party[0].state.roundId});await party[0].wait((s,log)=>log.some(m=>m.type==='notice'&&m.message.includes('reported a revealed answer')));assert(!party[0].inbox.filter(m=>m.type==='notice').some(m=>m.message.includes('Player ')));await next(party);await all(party,s=>s?.phase==='voting');
  const first=party[0];first.send({type:'vote',answerId:first.state.answers.find(answer=>answer.own).id,roundId:first.state.roundId});await first.wait((s,log)=>log.some(m=>m.type==='error'&&m.message.includes('own answer')));
  first.send({type:'vote',answerId:first.state.answers.find(answer=>!answer.own).id,roundId:first.state.roundId});await first.wait(s=>s?.players.find(p=>p.id===s.you)?.voted);first.send({type:'vote',answerId:first.state.answers.find(answer=>!answer.own).id,roundId:first.state.roundId});await first.wait((s,log)=>log.some(m=>m.type==='error'&&m.message.includes('already voted')));
  for(const c of party.slice(1))c.send({type:'vote',answerId:c.state.answers.find(answer=>!answer.own).id,roundId:c.state.roundId});await all(party,s=>s?.phase==='results');assert.equal(first.state.players.reduce((sum,p)=>sum+p.score,0),count*100);assert(first.state.answers.every(answer=>answer.authorId));pass(`${count}-player party: anonymous answers, self-vote and duplicate protection, authoritative scores`);
  for(const c of party)c.ws.close();
 }
 const couples=await room('couples',2);couples[0].send({type:'start'});await all(couples,s=>s?.phase==='writing');assert(couples[0].state.prompt);await write(couples);pass('couples: two-player tailored prompt and reveal');for(const c of couples)c.ws.close();
 const chain=await room('chain',3,2);chain[0].send({type:'start'});await all(chain,s=>s?.phase==='reactions');const roles=chain[0].state.players.filter(p=>p.role==='reaction').map(p=>p.id);const reactionClients=chain.filter(c=>roles.includes(c.credentials.playerId));const writer=chain.find(c=>!roles.includes(c.credentials.playerId));
 reactionClients[0].send({type:'reaction',text:'My grandma just ordered a forklift',roundId:chain[0].state.roundId});await reactionClients[1].wait(s=>s?.players.find(p=>p.id===reactionClients[0].credentials.playerId)?.submitted);assert(!JSON.stringify(reactionClients[1].inbox).includes('ordered a forklift'));reactionClients[1].send({type:'reaction',text:'Why is there glitter in the soup?',roundId:chain[0].state.roundId});await all(chain,s=>s?.phase==='writing');assert.equal(writer.state.prompt.messages.length,2);writer.send({type:'submit',text:'The family restaurant is now a disco',roundId:writer.state.roundId});await all(chain,s=>s?.phase==='reveal');await next(chain);await all(chain,s=>s?.phase==='results');assert.equal(chain[0].state.sharedScore,300);await next(chain);await all(chain,s=>s?.phase==='reactions');const nextRoles=chain[0].state.players.filter(p=>p.role==='reaction').map(p=>p.id);assert.notDeepEqual(roles,nextRoles);pass('reaction chain: isolated roles, hidden reactions, reconstruction, participation and role rotation');
 chain[2].send({type:'leave'});await chain[0].wait(s=>s?.phase==='lobby'&&s.players.length===2);pass('mid-round leave adapts to minimum count');
 const unauthorized=new WebSocket(`${base.replace(/^http/,'ws')}/api/rooms/${chain[0].credentials.code}/ws`);await new Promise((resolve,reject)=>{unauthorized.addEventListener('open',()=>unauthorized.send(JSON.stringify({type:'auth',token:'0'.repeat(64)})));unauthorized.addEventListener('close',event=>{try{assert.equal(event.code,4001);resolve();}catch(e){reject(e);}});unauthorized.addEventListener('error',reject);});pass('invalid WebSocket credential rejected');
 const remaining=chain[1];chain[0].ws.close();await remaining.wait(s=>s?.hostId===remaining.credentials.playerId,35000);pass('host migrates after disconnect grace');
 const daily=await api('/api/daily');assert.equal(daily.body.date,new Date().toISOString().slice(0,10));assert(!JSON.stringify(daily.body).includes('example'));assert.equal((await api('/api/daily',{date:daily.body.date,text:'<script>alert(1)</script>'})).status,400);const complete=await api('/api/daily',{date:daily.body.date,text:'The ducks have taken over the finance department'});assert.equal(complete.body.completed,true);assert(complete.body.example);assert.equal((await api('/api/daily',{date:'1999-01-01',text:'Old day'})).status,400);pass('server-authoritative daily challenge, example disclosure, unsafe input and date validation');
 const foreign=await api('/api/rooms',{name:'Attacker'},{Origin:'https://evil.example'});assert.equal(foreign.status,403);pass('cross-origin room creation denied');
 console.log(`\n${checks} real integration checks passed.`);
}catch(error){console.error(error);process.exitCode=1;}finally{for(const ws of sockets)try{ws.close();}catch{}}
