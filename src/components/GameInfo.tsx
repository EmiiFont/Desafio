import { createSignal, createEffect, onCleanup } from 'solid-js';

export type GameInfoProps = {
  gameState: any;
  myPlayerId: number | null;
  getCurrentPlayerName: () => string;
  players: any[];
  rollDice: () => void;
  diceAnimating: boolean;
};

export function GameInfo(props: GameInfoProps) {
  return (
    <div class="game-info-bar">
      <div class="turn-info">
        <Show when={props.gameState && props.gameState.waitingForRoll && props.myPlayerId === props.gameState.currentPlayerId}>
          <div class="your-turn-banner">
            🎲 Your Turn! Roll the dice!
          </div>
        </Show>
        <Show when={props.gameState && !(props.gameState.waitingForRoll && props.myPlayerId === props.gameState.currentPlayerId)}>
          <div class="other-turn-banner">
            Waiting for {props.getCurrentPlayerName()}...
          </div>
        </Show>
      </div>
    </div>
  );
}