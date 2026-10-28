import type { AnswerView, Mode, Phase, PlayerView, Prompt, RoomView, Settings } from '../shared/types';
import { pickPrompt } from '../../content/prompts';

export const ROOM_TTL = 2 * 60 * 60 * 1000;
export const IDLE_TTL = 30 * 60 * 1000;
export const DISCONNECT_GRACE = 30_000;
export const EMOJIS = ['😂', '😮', '😭', '🤔', '💀', '💡'];
export class GameError extends Error {}
export type Player = { id: string; name: string; avatar: number; tokenHash: string; score: number; connected: boolean; disconnectedAt: number | null; joinedAt: number; removed?: boolean };
export type Answer = { id: string; playerId: string; text: string };
export type Room = { code: string; settings: Settings; hostId: string; phase: Phase; players: Player[]; createdAt: number; updatedAt: number; round: number; roundId: string; deadline: number | null; prompt: Prompt | null; usedPrompts: string[]; participants: string[]; reactionWriters: string[]; reactions: Record<string, string>; answers: Answer[]; votes: Record<string, string>; emoji: Record<string, Record<string, string>>; ready: string[]; sharedScore: number; history: RoomView['history']; notice?: string; expired?: boolean };
export const defaultSettings: Settings = { mode: 'duo', rounds: 5, writingSeconds: 60, category: 'all', familyFriendly: true };
export function cleanText(value: unknown, max: number, label = 'Message'): string {
  if (typeof value !== 'string') throw new GameError(`${label} must be text.`);
  const text = value.normalize('NFKC').replace(/[\u0000-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text || text.length > max) throw new GameError(`${label} must contain 1–${max} characters.`);
  if (/<\/?[a-z][^>]*>|https?:\/\/|www\./i.test(text)) throw new GameError('Please use plain text without links or markup.');
  return text;
}
export function settingsFrom(value: unknown, existing = defaultSettings): Settings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new GameError('Invalid room settings.');
  const data = value as Record<string, unknown>; const settings = { ...existing };
  if (data.mode !== undefined) { if (!['duo', 'couples', 'party', 'chain'].includes(data.mode as string)) throw new GameError('Choose a valid game mode.'); settings.mode = data.mode as Mode; }
  if (data.rounds !== undefined) { if (!Number.isInteger(data.rounds) || Number(data.rounds) < 1 || Number(data.rounds) > 10) throw new GameError('Choose 1–10 rounds.'); settings.rounds = Number(data.rounds); }
  if (data.writingSeconds !== undefined) { if (![30,45,60,90].includes(Number(data.writingSeconds))) throw new GameError('Choose a 30, 45, 60, or 90 second timer.'); settings.writingSeconds = Number(data.writingSeconds); }
  if (data.category !== undefined) { if (typeof data.category !== 'string' || data.category.length > 30 || !/^[a-z-]+$/.test(data.category)) throw new GameError('Choose a valid category.'); settings.category = data.category; }
  if (data.familyFriendly !== undefined && typeof data.familyFriendly !== 'boolean') throw new GameError('Invalid family setting.');
  // All launch prompts are family curated; false only disables the basic language filter.
  if (typeof data.familyFriendly === 'boolean') settings.familyFriendly = data.familyFriendly;
  return settings;
}
export function minPlayers(mode: Mode) { return mode === 'party' || mode === 'chain' ? 3 : 2; }
export function maxPlayers(mode: Mode) { return mode === 'party' || mode === 'chain' ? 10 : 2; }
export function activePlayers(room: Room) { return room.players.filter(p => !p.removed); }
export function createRoom(code: string, player: Player, settings: Settings, now: number): Room {
  return { code, settings, hostId: player.id, phase: 'lobby', players: [player], createdAt: now, updatedAt: now, round: 0, roundId: '', deadline: null, prompt: null, usedPrompts: [], participants: [], reactionWriters: [], reactions: {}, answers: [], votes: {}, emoji: {}, ready: [], sharedScore: 0, history: [] };
}
export function getPlayer(room: Room, playerId: string) { const p = room.players.find(x => x.id === playerId && !x.removed); if (!p) throw new GameError('Your session is no longer in this room.'); return p; }
export function requireHost(room: Room, playerId: string) { getPlayer(room, playerId); if (room.hostId !== playerId) throw new GameError('Only the host can do that.'); }
export function addPlayer(room: Room, player: Player) {
  if (room.phase !== 'lobby') throw new GameError('This game has started. Ask your friends to finish or rematch.');
  if (room.players.length >= 100) throw new GameError('This room has reached its session limit. Create a fresh room.');
  if (activePlayers(room).length >= maxPlayers(room.settings.mode)) throw new GameError('This room is full.');
  if (activePlayers(room).some(p => p.name.toLocaleLowerCase() === player.name.toLocaleLowerCase())) throw new GameError('That name is taken in this room. Try another.');
  room.players.push(player);
}
export function setConnected(room: Room, id: string, connected: boolean, now: number) { const p = getPlayer(room, id); p.connected = connected; p.disconnectedAt = connected ? null : now; if (connected) room.updatedAt = now; }
export function migrateHost(room: Room, now: number) {
  const current = room.players.find(p => p.id === room.hostId && !p.removed);
  if (!current || (!current.connected && current.disconnectedAt !== null && now - current.disconnectedAt >= DISCONNECT_GRACE)) { const next = activePlayers(room).find(p => p.connected); if (next) { room.hostId = next.id; room.notice = `${next.name} is the host now.`; } }
}
export function removePlayer(room: Room, id: string, now: number) {
  const p = getPlayer(room, id); p.removed = true; p.connected = false; p.disconnectedAt = now;
  room.participants = room.participants.filter(x => x !== id); room.ready = room.ready.filter(x => x !== id);
  migrateHost(room, now);
  if (!['lobby','complete'].includes(room.phase) && room.participants.length < minPlayers(room.settings.mode)) { room.phase = 'lobby'; room.deadline = null; room.prompt = null; room.answers = []; room.reactions = {}; room.votes = {}; room.notice = 'A player left. Invite someone to continue with a new round.'; }
  else advanceIfReady(room, now);
}
export function newRound(room: Room, now: number) {
  const players = activePlayers(room).filter(p => p.connected);
  if (players.length < minPlayers(room.settings.mode)) { room.phase = 'lobby'; room.deadline = null; room.notice = 'Waiting for enough connected players.'; return; }
  room.round++; room.roundId = crypto.randomUUID(); room.participants = players.map(p => p.id); room.reactionWriters = [];
  room.reactions = {}; room.answers = []; room.votes = {}; room.emoji = {}; room.ready = []; delete room.notice;
  if (room.settings.mode === 'chain') {
    const start = ((room.round - 1) * 2) % room.participants.length;
    room.reactionWriters = [room.participants[start], room.participants[(start + 1) % room.participants.length]];
    room.prompt = { id: `chain-${room.round}`, category: 'reaction-chain', modes: ['chain'], messages: [], deletedIndex: 0, example: '', title: 'Build the chaos' };
  } else { room.prompt = pickPrompt({ mode: room.settings.mode, category: room.settings.category, usedIds: room.usedPrompts, seed: Math.floor(Math.random() * 0x7fffffff) }) as Prompt; room.usedPrompts.push(room.prompt.id); }
  room.phase = 'intro'; room.deadline = now + 3000;
}
export function startGame(room: Room, id: string, now: number) { requireHost(room,id); if (room.phase !== 'lobby') throw new GameError('The game has already started.'); if (activePlayers(room).filter(p=>p.connected).length < minPlayers(room.settings.mode)) throw new GameError(`You need ${minPlayers(room.settings.mode)} connected players to start.`); newRound(room,now); }
function writers(room: Room) { return room.participants.filter(id => !room.reactionWriters.includes(id)); }
export function submit(room: Room, id: string, text: unknown, roundId: unknown, reaction: boolean, now: number) {
  getPlayer(room,id); checkRound(room,roundId,now); if (!room.participants.includes(id)) throw new GameError('You are not playing this round.');
  const value = cleanText(text, reaction ? 160 : 240);
  if (room.settings.familyFriendly && /\b(fuck|shit|cunt|nigger|faggot)\w*\b/i.test(value)) throw new GameError('Keep this room family friendly. Please rephrase.');
  if (reaction) { if (room.phase !== 'reactions' || !room.reactionWriters.includes(id)) throw new GameError('It is not your reaction-writing turn.'); if (room.reactions[id]) throw new GameError('Your reaction is already locked.'); room.reactions[id] = value; }
  else { if (room.phase !== 'writing' || !writers(room).includes(id)) throw new GameError('It is not your writing turn.'); if (room.answers.some(a => a.playerId === id)) throw new GameError('Your answer is already locked.'); room.answers.push({ id: crypto.randomUUID(), playerId: id, text: value }); }
  advanceIfReady(room,now);
}
export function checkRound(room: Room, roundId: unknown, now: number) { if (roundId !== room.roundId) throw new GameError('That action belongs to an earlier round.'); if (room.deadline !== null && now >= room.deadline) throw new GameError('Time is up.'); }
export function vote(room: Room,id:string,answerId:unknown,roundId:unknown,now:number) {
  getPlayer(room,id); checkRound(room,roundId,now); if(room.phase!=='voting'||!room.participants.includes(id))throw new GameError('Voting is not open.');
  if(room.votes[id])throw new GameError('You have already voted.'); const answer = room.answers.find(a=>a.id===answerId); if(!answer)throw new GameError('Choose a valid answer.'); if(answer.playerId===id)throw new GameError('You cannot vote for your own answer.'); room.votes[id]=answer.id; advanceIfReady(room,now);
}
export function react(room:Room,id:string,answerId:unknown,emoji:unknown,roundId:unknown,now:number) {
  getPlayer(room,id); if(roundId!==room.roundId)throw new GameError('That round is over.'); if(!['reveal','voting','results','complete'].includes(room.phase))throw new GameError('Reactions open at the reveal.'); if(!room.answers.some(a=>a.id===answerId)||!EMOJIS.includes(emoji as string))throw new GameError('Choose a valid reaction.'); const map=room.emoji[String(answerId)]??={}; map[id]=String(emoji);
}
function lockReactions(room:Room,now:number) {
  const submitted = room.reactionWriters.filter(id=>room.reactions[id]);
  if(submitted.length<2){ room.notice='Not enough reactions arrived. Try a fresh round.'; finishRound(room,now); return; }
  if(room.prompt) room.prompt.messages=submitted.map((id,i)=>({sender:i===0?'Sam':'Alex',text:room.reactions[id]}));
  room.phase='writing'; room.deadline=now+room.settings.writingSeconds*1000;
}
function lockAnswers(room:Room,now:number) { room.answers.sort((a,b)=>a.id.localeCompare(b.id)); room.phase='reveal'; room.deadline=now+Math.max(4000,room.answers.length*2200); room.ready=[]; }
function eligibleVoters(room:Room) { return room.participants.filter(id=>room.answers.some(a=>a.playerId!==id)); }
function finishRound(room:Room,now:number) {
  if(room.phase==='results')return;
  const competitive=(room.settings.mode==='party'||room.settings.mode==='chain')&&room.answers.length>=2;
  for(const player of room.players){ const authored=room.answers.some(a=>a.playerId===player.id); const reaction=!!room.reactions[player.id]; const received=Object.values(room.votes).filter(v=>room.answers.some(a=>a.id===v&&a.playerId===player.id)).length;
    player.score+=competitive?received*100:(authored||reaction?100:0);
  }
  if(!competitive)room.sharedScore+=room.answers.length*100+Object.keys(room.reactions).length*100;
  room.phase='results';room.deadline=now+8000;room.ready=[];
  room.history.push({round:room.round,prompt:publicPrompt(room),answers:answerViews(room,'',true)});
  if(room.history.length>10)room.history.shift();
}
export function advanceIfReady(room:Room,now:number) {
  if(room.phase==='reactions'&&room.reactionWriters.every(id=>!!room.reactions[id]))lockReactions(room,now);
  else if(room.phase==='writing'&&writers(room).every(id=>room.answers.some(a=>a.playerId===id)))lockAnswers(room,now);
  else if(room.phase==='voting'&&eligibleVoters(room).every(id=>!!room.votes[id]))finishRound(room,now);
}
export function readyNext(room:Room,id:string,now:number) { getPlayer(room,id); if(!['reveal','results'].includes(room.phase))throw new GameError('You cannot continue yet.'); if(!room.ready.includes(id))room.ready.push(id); const required=room.participants.filter(id=>room.players.find(p=>p.id===id)?.connected); if(required.length&&required.every(id=>room.ready.includes(id)))transition(room,now); }
export function transition(room:Room,now:number) {
  room.ready=[];
  switch(room.phase){
    case 'intro':room.phase=room.settings.mode==='chain'?'reactions':'writing';room.deadline=now+room.settings.writingSeconds*1000;break;
    case 'reactions':lockReactions(room,now);break;
    case 'writing':lockAnswers(room,now);break;
    case 'reveal':if((room.settings.mode==='party'||room.settings.mode==='chain')&&room.answers.length>=2){room.phase='voting';room.deadline=now+20000;}else finishRound(room,now);break;
    case 'voting':finishRound(room,now);break;
    case 'results':if(room.round>=room.settings.rounds){room.phase='complete';room.deadline=null;}else newRound(room,now);break;
  }
}
export function tick(room:Room,now:number) { if(room.expired||now>=room.createdAt+ROOM_TTL||now>=room.updatedAt+IDLE_TTL){room.expired=true;return;} migrateHost(room,now); if(room.deadline!==null&&now>=room.deadline)transition(room,now); }
export function rematch(room:Room,id:string,now:number) { requireHost(room,id);if(room.phase!=='complete')throw new GameError('Finish this session before rematching.');room.round=0;room.phase='lobby';room.deadline=null;room.history=[];room.sharedScore=0;room.prompt=null;room.answers=[];room.reactions={};room.votes={};room.ready=[]; for(const p of room.players)p.score=0; room.updatedAt=now; }
function publicPrompt(room:Room):RoomView['prompt'] { if(!room.prompt)return null; const p=room.prompt; return {id:p.id,title:p.title,category:p.category,messages:p.messages,deletedIndex:p.deletedIndex,constraint:p.constraint}; }
function answerViews(room:Room,id:string,authors:boolean):AnswerView[]{return room.answers.map(a=>({id:a.id,text:a.text,own:a.playerId===id,...(authors?{authorId:a.playerId,author:room.players.find(p=>p.id===a.playerId)?.name??'Player',votes:Object.values(room.votes).filter(v=>v===a.id).length}:{}),reactions:Object.values(room.emoji[a.id]??{}).reduce((r,e)=>({...r,[e]:(r[e]??0)+1}),{} as Record<string,number>)}));}
export function viewFor(room:Room,id:string,now:number):RoomView { getPlayer(room,id); const show=['reveal','voting','results','complete'].includes(room.phase); const authors=['results','complete'].includes(room.phase)||!['party','chain'].includes(room.settings.mode);
  return {code:room.code,settings:room.settings,hostId:room.hostId,you:id,phase:room.phase,round:room.round,roundId:room.roundId,deadline:room.deadline,serverNow:now,prompt:publicPrompt(room),players:activePlayers(room).map(p=>({id:p.id,name:p.name,avatar:p.avatar,score:p.score,connected:p.connected,submitted:room.phase==='reactions'?!!room.reactions[p.id]:room.answers.some(a=>a.playerId===p.id),voted:!!room.votes[p.id],ready:room.ready.includes(p.id),role:room.reactionWriters.includes(p.id)?'reaction':'writer'})),answers:show?answerViews(room,id,authors):[],ownSubmission:room.answers.find(a=>a.playerId===id)?.text??null,ownReaction:room.reactions[id]??null,sharedScore:room.sharedScore,history:room.history,notice:room.notice};
}
