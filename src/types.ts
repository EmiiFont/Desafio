export type GameState = {
  board: number[][];
  playerOrder: number[];
  currentTurnIdx: number;
  currentPlayerId: number;
  waitingForRoll: boolean;
  waitingForAnswer: boolean;
  gameOver?: boolean;
  winner?: any;
};

export type Category = {
  id: number;
  name: string;
  color: string;
  emoji: string;
};

export type GamePlayer = {
  id: number;
  name: string;
  color: string;
  position: [number, number];
  km: number;
  isBot?: boolean;
  botLevel?: number;
};

export type GameLobbyState = {
  lobbyId: string;
  players: GamePlayer[];
  message: string;
  ready: boolean;
};

export type Message = {
  type: string;
  data: any;
};

export type LobbyStateMessage = {
  lobbyId: string;
  players: GamePlayer[];
  ready: boolean;
  message: string;
};

export type GameStartMessage = {
  board: number[][];
  players: GamePlayer[];
  playerOrder: number[];
  currentPlayerId: number;
  waitingForRoll: boolean;
};

export type RollDiceMessage = {
  playerId: number;
};

export type DiceResultMessage = {
  playerId: number;
  categoryId: number;
  category: {
    id: number;
    name: string;
    color: string;
    emoji: string;
  };
};

export type Question = {
  id: string;
  description: string;
  answer: number;
  options: string[];
  categoryId: number;
};

export type QuestionMessage = {
  question: Question;
  timeLimit: number;
};

export type SubmitAnswerMessage = {
  playerId: number;
  answer: number;
  answerType: string;
};

export type AnswerResultMessage = {
  playerId: number;
  correct: boolean;
  kmChange: number;
  newKm: number;
  newPosition: [number, number];
  nextPlayer?: GamePlayer;
  message: string;
};

export type TurnChangeMessage = {
  nextPlayer: GamePlayer;
  message: string;
};

export type GameOverMessage = {
  winner: GamePlayer;
  message: string;
};