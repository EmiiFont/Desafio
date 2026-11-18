import { render, screen } from '@testing-library/solid-js';
import { describe, it, expect } from 'vitest';
import App from '../src/App';

describe('App Component', () => {
  it('renders without crashing', () => {
    render(() => <App />);
    
    // Check if main container exists
    const appContainer = document.querySelector('.app-container');
    expect(appContainer).toBeTruthy();
  });

  it('shows lobby view initially', () => {
    render(() => <App />);
    
    // Check if lobby elements are present
    expect(screen.getByText('🎮 Game Lobby')).toBeTruthy();
    expect(screen.getByText('Quick Game')).toBeTruthy();
  });

  it('renders all imported components', async () => {
    render(() => <App />);
    
    // Wait for components to load
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if no undefined component errors occur
    const errorElements = document.querySelectorAll('[data-testid="error"]');
    expect(errorElements.length).toBe(0);
  });
});

describe('Component Imports', () => {
  it('LobbyComponent imports correctly', async () => {
    const { LobbyComponent } = await import('../src/components/Lobby');
    expect(LobbyComponent).toBeDefined();
    
    render(() => <LobbyComponent 
      createLobby={() => {}}
      joinLobby={() => {}}
      startGame={() => {}}
      startSinglePlayerTest={() => {}}
      quickJoinTest={() => {}}
      createTestGame={() => {}}
      toggleDebugPanel={() => {}}
      players={[]}
      connected={false}
      lobbyId=""
      myPlayerId={null}
    />);
    
    expect(screen.getByText('🎮 Game Lobby')).toBeTruthy();
  });

  it('GameBoard imports correctly', async () => {
    const { GameBoard } = await import('../src/components/GameBoard');
    expect(GameBoard).toBeDefined();
    
    render(() => <GameBoard board={[]} players={[]} />);
    
    const board = document.querySelector('.game-board');
    expect(board).toBeTruthy();
  });

  it('PlayerCards imports correctly', async () => {
    const { PlayerCards } = await import('../src/components/PlayerCards');
    expect(PlayerCards).toBeDefined();
    
    render(() => <PlayerCards players={[]} currentPlayerId={null} />);
    
    expect(document.querySelector('.player-cards')).toBeTruthy();
  });
});