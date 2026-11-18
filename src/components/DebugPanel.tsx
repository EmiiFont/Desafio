import { createSignal, Show } from 'solid-js';

export type DebugPanelProps = {
  show: boolean;
  toggleDebugPanel: () => void;
  clearDebugLog: () => void;
  debugLog: Array<{timestamp: string, action: string, data: string}>;
  testMode: boolean;
  botSpeed: number;
  setBotSpeed: (speed: number) => void;
  addBot: () => void;
  lobbyId: string;
  myPlayerId: number | null;
  gameState: any;
  players: any[];
  getGameProgress: () => number;
  currentPlayer: any;
};

export function DebugPanel(props: DebugPanelProps) {
  return (
    <Show when={props.show}>
      <div class="debug-panel">
        <div class="debug-header">
          <h4>🐛 Debug Panel</h4>
          <button onClick={props.toggleDebugPanel} class="close-btn">&times;</button>
        </div>
        
        <div class="debug-section">
          <h5>Bot Speed</h5>
          <div class="speed-controls">
            <button 
              onClick={() => props.setBotSpeed(3000)}
              class={`btn btn-speed ${props.botSpeed === 3000 ? 'active' : ''}`}
            >🐌 Slow</button>
            <button 
              onClick={() => props.setBotSpeed(1500)}
              class={`btn btn-speed ${props.botSpeed === 1500 ? 'active' : ''}`}
            >🚶 Normal</button>
            <button 
              onClick={() => props.setBotSpeed(500)}
              class={`btn btn-speed ${props.botSpeed === 500 ? 'active' : ''}`}
            >🏃 Fast</button>
            <button 
              onClick={() => props.setBotSpeed(100)}
              class={`btn btn-speed ${props.botSpeed === 100 ? 'active' : ''}`}
            >⚡ Instant</button>
          </div>
        </div>

        <div class="debug-section">
          <h5>Game State</h5>
          <div class="debug-info">
            <p><strong>Lobby ID:</strong> <code>{props.lobbyId.substring(0, 8) + '...'}</code></p>
            <p><strong>Your ID:</strong> <code>{props.myPlayerId}</code></p>
            <p><strong>Players:</strong> <span>{props.players.length}</span></p>
            <p><strong>Game Started:</strong> <span>{props.gameState ? 'Yes' : 'No'}</span></p>
            <p><strong>Waiting For:</strong> <span>{props.gameState?.waitingForRoll ? 'Roll' : (props.gameState?.waitingForAnswer ? 'Answer' : 'None')}</span></p>
            <p><strong>Current Player:</strong> <span>{props.gameState?.currentPlayerId}</span></p>
            <p><strong>Progress:</strong> <span>{props.getGameProgress()}</span>%</p>
          </div>
        </div>

        <div class="debug-section">
          <div class="debug-header-inline">
            <h5>Event Log</h5>
            <button onClick={props.clearDebugLog} class="btn btn-small">Clear</button>
          </div>
          <div class="debug-log">
            <For each={props.debugLog}>
              {(entry, index) => (
                <div class="log-entry">
                  <span class="log-time">{entry.timestamp}</span>
                  <span class="log-action">{entry.action}</span>
                </div>
              )}
            </For>
            <Show when={props.debugLog.length === 0}>
              <div class="log-empty">No events yet</div>
            </Show>
          </div>
        </div>

        <div class="debug-section">
          <h5>Keyboard Shortcuts</h5>
          <div class="shortcuts-list">
            <p><kbd>R</kbd> Roll dice (your turn)</p>
            <p><kbd>S</kbd> Start game</p>
            <p><kbd>B</kbd> Add bot player</p>
            <p><kbd>D</kbd> Toggle debug panel</p>
            <p><kbd>Esc</kbd> Close debug panel</p>
          </div>
        </div>
      </div>
    </Show>
  );
}