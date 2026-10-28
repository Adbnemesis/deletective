export type Mode = 'duo' | 'couples' | 'party' | 'chain';
export type Phase = 'lobby' | 'intro' | 'reactions' | 'writing' | 'reveal' | 'voting' | 'results' | 'complete';
export type Prompt = {
  id: string; category: string; modes: string[]; title?: string;
  messages: { sender: string; text: string }[]; deletedIndex: number;
  example: string; constraint?: string; [key: string]: unknown;
};
export type Settings = { mode: Mode; rounds: number; writingSeconds: number; category: string; familyFriendly: boolean };
export type PlayerView = { id: string; name: string; avatar: number; score: number; connected: boolean; submitted: boolean; voted: boolean; ready: boolean; role: 'reaction' | 'writer' };
export type AnswerView = { id: string; text: string; own: boolean; authorId?: string; author?: string; votes?: number; reactions: Record<string, number> };
export type RoomView = {
  code: string; phase: Phase; settings: Settings; hostId: string; you: string;
  players: PlayerView[]; round: number; deadline: number | null; serverNow: number;
  prompt: Pick<Prompt, 'id' | 'category' | 'messages' | 'deletedIndex' | 'constraint' | 'title'> | null;
  answers: AnswerView[]; ownSubmission: string | null; ownReaction: string | null;
  roundId: string; sharedScore: number; notice?: string;
  history: { round: number; prompt: RoomView['prompt']; answers: AnswerView[] }[];
};
export type Credentials = { code: string; playerId: string; token: string };
export type ClientAction =
  | { type: 'auth'; token: string }
  | { type: 'start' | 'next' | 'rematch' | 'leave' | 'ping'; requestId?: string }
  | { type: 'submit' | 'reaction'; text: string; roundId: string; requestId?: string }
  | { type: 'vote'; answerId: string; roundId: string; requestId?: string }
  | { type: 'react'; answerId: string; emoji: string; roundId: string; requestId?: string }
  | { type: 'kick'; playerId: string; requestId?: string }
  | { type: 'settings'; settings: Partial<Settings>; requestId?: string }
  | { type: 'report'; answerId: string; roundId: string; requestId?: string };
export type ServerMessage = { type: 'state'; state: RoomView } | { type: 'error'; message: string } | { type: 'pong'; serverNow: number } | { type: 'notice'; message: string };
export type DailyView = { date: string; prompt: Pick<Prompt, 'id' | 'category' | 'messages' | 'deletedIndex' | 'constraint' | 'title'>; example?: string };
