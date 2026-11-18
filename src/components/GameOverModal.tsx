import { createSignal, Show } from 'solid-js';

export type GameOverModalProps = {
  show: boolean;
  winner: any;
  winnerMessage: string;
  resetGame: () => void;
};

export function GameOverModal(props: GameOverModalProps) {
  return (
    <Show when={props.show}>
      <div class="modal-overlay">
        <div class="modal game-over-modal">
          <h2>🏆 Game Over!</h2>
          <div class="winner-display">
            <div class="winner-token" style={`background-color: ${props.winner?.color || '#667eea'}`}>
              <span>{props.winner?.name?.charAt(0) || '?'}</span>
            </div>
            <h3>{props.winner?.name}</h3>
            <p>Wins the race!</p>
          </div>
          <p class="congrats-message">{props.winnerMessage}</p>
          <button onClick={props.resetGame} class="btn btn-primary btn-large">
            🔄 Play Again
          </button>
        </div>
      </div>
    </Show>
  );
}