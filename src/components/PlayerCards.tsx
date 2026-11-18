import { createSignal, Show } from 'solid-js';

export type PlayerCardsProps = {
  players: any[];
  gameOver: boolean;
  gameState: any;
  getGameProgress: () => number;
};

export function PlayerCards(props: PlayerCardsProps) {
  const getGameProgress = () => {
    if (!props.gameState || !props.players.length) return 0;
    const totalKm = props.players.reduce((sum, p: any) => sum + (p.km || 0), 0);
    const maxKm = props.players.length * 42;
    return Math.round((totalKm / maxKm) * 100);
  };

  return (
    <div class="player-cards">
      <For each={props.players}>
        {(player: any) => (
          <div class={`player-card ${props.gameState && props.gameState.currentPlayerId === player.id ? 'active-turn' : ''}`} style={`border-color: ${player.color}`}>
            <div class="player-card-header">
              <span class="player-token-small" style={`background-color: ${player.color}`}></span>
              <span>{player.name}</span>
              <Show when={player.isBot}>
                <span class="bot-indicator">🤖 Lv.{player.botLevel || 2}</span>
              </Show>
            </div>
            <div class="player-km">
              <span>{player.km || 0}</span> km
            </div>
            <div class="km-progress">
              <div
                class="km-progress-fill"
                style={`width: ${(player.km || 0) / 42 * 100}%; background-color: ${player.color}`}
              ></div>
            </div>
          </div>
        )}
      </For>
    </div>
  );
}