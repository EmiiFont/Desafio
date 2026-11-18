import { createSignal, For } from 'solid-js';

export type BoardProps = {
  board: number[][];
  players: any[];
};

export function GameBoard(props: BoardProps) {
  const getCellStyle = (categoryId: number) => {
    const colors = {
      1: 'background: linear-gradient(145deg, #FF6B6B, #ee5a5a);',
      2: 'background: linear-gradient(145deg, #4ECDC4, #3dbdb5);',
      3: 'background: linear-gradient(145deg, #95E1D3, #84d0c2);',
      4: 'background: linear-gradient(145deg, #DDA0DD, #cc8fcc);',
      5: 'background: linear-gradient(145deg, #FFE66D, #ffd93d);',
      6: 'background: linear-gradient(145deg, #F7D794, #f5c778);'
    };
    return colors[categoryId] || colors[1];
  };

  const getCellKm = (row: number, col: number) => {
    const totalCells = 25;
    const centerIndex = 24;
    const outerToInner = [0, 1, 2, 3, 4, 3, 2, 1, 0, 1, 2, 3, 4, 3, 2, 1, 0, 1, 2, 3, 4, 3, 2, 1, 0];
    const index = row * 5 + col;
    const stepsFromOuter = centerIndex - index;
    const km = Math.floor(stepsFromOuter * (42 / 24));
    
    if (row === 2 && col === 2) return '🏁';
    return km + 'km';
  };

  const getPlayersAt = (row: number, col: number) => {
    return props.players.filter((p: any) => {
      if (!p.position || p.position.length < 2) return false;
      return p.position[0] === row && p.position[1] === col;
    });
  };

  return (
    <div class="board-container">
      <div class="spiral-board">
        <For each={props.board}>
          {(row: number[], rowIndex: number) => (
            <div class="board-row">
              <For each={row}>
                {(cell: number, colIndex: number) => (
                  <div
                    class={`board-cell ${rowIndex === 2 && colIndex === 2 ? 'cell-center' : ''} ${rowIndex === 2 && colIndex === 2 ? 'cell-finish' : ''}`}
                    style={getCellStyle(cell)}
                  >
                    <span class="cell-km">{getCellKm(rowIndex, colIndex)}</span>
                    <div class="cell-players">
                      <For each={getPlayersAt(rowIndex, colIndex)}>
                        {(player: any) => (
                          <div
                            class="player-token"
                            style={`background-color: ${player.color}`}
                            title={player.name}
                          >
                            <span>{player.name.charAt(0)}</span>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                )}
              </For>
            </div>
          )}
        </For>
      </div>
      <div class="finish-label">🏁 42km</div>
    </div>
  );
}