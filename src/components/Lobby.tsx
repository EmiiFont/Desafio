import { Show } from 'solid-js';

export type LobbyState = {
  lobbyId: string;
  players: any[];
  message: string;
  ready: boolean;
};

export interface LobbyProps {
  createLobby: () => void;
  joinLobby: () => void;
  startGame: () => void;
  startSinglePlayerTest: () => void;
  quickJoinTest: () => void;
  createTestGame: () => void;
  toggleDebugPanel: () => void;
  players: any[];
  connected: boolean;
  lobbyId: string;
  lobbyIdInput: string;
  setLobbyIdInput: (value: string) => void;
  playerName: string;
  setPlayerName: (value: string) => void;
  myPlayerId: number | null;
  message?: string;
  gameState?: any;
}

export function LobbyComponent(props: LobbyProps) {
  return (
    <div class="lobby-container">
      <div class="lobby-card">
        <h2>🎮 Game Lobby</h2>

        <div class="lobby-section">
          <input
            type="text"
            value={props.playerName}
            onInput={(e) => props.setPlayerName(e.currentTarget.value)}
            placeholder="Your name"
            class="input-field"
          />
        </div>

        <div class="lobby-section">
          <button onClick={props.createLobby} class="btn btn-primary btn-large">
            ✨ Create New Lobby
          </button>
        </div>

        <div class="divider">
          <span>or</span>
        </div>

        <div class="lobby-section">
          <input
            type="text"
            id="lobbyIdInput"
            value={props.lobbyIdInput}
            onInput={(e) => props.setLobbyIdInput(e.currentTarget.value)}
            placeholder="Enter Lobby ID"
            class="input-field"
          />
          <button onClick={props.joinLobby} class="btn btn-secondary">
            🎯 Join Lobby
          </button>
        </div>

        <Show when={props.lobbyId}>
          <div class="lobby-info">
            <p>Your Lobby ID:</p>
            <code class="lobby-id">{props.lobbyId}</code>
            <button 
              onClick={() => navigator.clipboard.writeText(props.lobbyId)}
              class="btn btn-small"
            >
              📋 Copy ID
            </button>
            <p class="lobby-status">{props.message}</p>
          </div>
        </Show>

        <Show when={props.players.length > 0}>
          <div class="players-list">
            <h3>Players ({props.players.length}/4)</h3>
            {props.players.map((player: any) => (
              <div class="player-item" style={`border-color: ${player.color}`}>
                <span class="player-color" style={`background-color: ${player.color}`}></span>
                <span>{player.name}</span>
                <Show when={props.connected && props.myPlayerId === player.id}>
                  <span class="turn-indicator">🎲 Your Turn!</span>
                </Show>
              </div>
            ))}
          </div>

          <Show when={props.players.length >= 2 && !props.gameState}>
            <button onClick={props.startGame} class="btn btn-success btn-large">
              🚀 Start Game!
            </button>
          </Show>
        </Show>

        {/* Test Controls */}
        <div class="test-controls">
          <h4>🧪 Testing</h4>
          <div class="test-buttons">
            <button onClick={props.toggleDebugPanel} class="btn btn-test">
              🐛 Debug Panel
            </button>
            <button onClick={props.quickJoinTest} class="btn btn-test">
              🎯 Quick Demo Join
            </button>
            <button onClick={props.createTestGame} class="btn btn-test">
              🆕 Create Test Game
            </button>
            <button onClick={props.startSinglePlayerTest} class="btn btn-test">
              🎯 Single Player Test
            </button>
          </div>
          <p class="test-hint">Use these buttons for quick testing</p>
        </div>
      </div>
    </div>
  );
}