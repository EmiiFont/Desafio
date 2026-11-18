import { createSignal, onCleanup, onMount, Show } from 'solid-js';
import { GameBoard } from './components/GameBoard';
import { PlayerCards } from './components/PlayerCards';
import { DebugPanel } from './components/DebugPanel';
import { GameInfo } from './components/GameInfo';
import { QuestionModal } from './components/QuestionModal';
import { GameOverModal } from './components/GameOverModal';
import { TurnNotification } from './components/TurnNotification';
import { LobbyComponent } from './components/Lobby';
import {
  type GameState,
  type GamePlayer,
  type Question,
  type Category,
  type LobbyStateMessage,
  type GameStartMessage,
  type DiceResultMessage,
  type QuestionMessage,
  type AnswerResultMessage,
  type TurnChangeMessage,
  type GameOverMessage
} from './types';

export default function App() {
  const [view, setView] = createSignal<'lobby' | 'game'>('lobby');
  const [players, setPlayers] = createSignal<GamePlayer[]>([]);
  const [gameState, setGameState] = createSignal<GameState | null>(null);
  const [board, setBoard] = createSignal<number[][]>([]);
  const [myPlayerId, setMyPlayerId] = createSignal<number | null>(null);
  const [lobbyId, setLobbyId] = createSignal('');
  const [lobbyIdInput, setLobbyIdInput] = createSignal('');
  const [playerName, setPlayerName] = createSignal('');
  const [lobbyMessage, setLobbyMessage] = createSignal('Enter a lobby ID or create a new one');
  const [connected, setConnected] = createSignal(false);
  const [currentQuestion, setCurrentQuestion] = createSignal<Question | null>(null);
  const [currentCategory, setCurrentCategory] = createSignal<Category | null>(null);
  const [showQuestion, setShowQuestion] = createSignal(false);
  const [timer, setTimer] = createSignal(20);
  const [answerType, setAnswerType] = createSignal<'multiple' | 'direct'>('multiple');
  const [selectedAnswer, setSelectedAnswer] = createSignal<number | null>(null);
  const [directAnswer, setDirectAnswer] = createSignal('');
  const [answerSubmitted, setAnswerSubmitted] = createSignal(false);
  const [answerResult, setAnswerResult] = createSignal<{correct: boolean, message: string} | null>(null);
  const [gameOver, setGameOver] = createSignal(false);
  const [winner, setWinner] = createSignal<GamePlayer | null>(null);
  const [winnerMessage, setWinnerMessage] = createSignal('');
  const [diceAnimating, setDiceAnimating] = createSignal(false);
  const [errorMessage, setErrorMessage] = createSignal('');
  const [testMode, setTestMode] = createSignal(false);
  const [botSpeed, setBotSpeed] = createSignal(1500);
  const [debugPanel, setDebugPanel] = createSignal(false);
  const [debugLog, setDebugLog] = createSignal<Array<{timestamp: string, action: string, data: string}>>([]);
  const [turnNotification, setTurnNotification] = createSignal('');

  let ws: WebSocket | null = null;
  let timerInterval: number | null = null;
  let reconnectTimeout: number | null = null;

  const logDebug = (action: string, data: any) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLog(prev => {
      const newLog = { timestamp, action, data: JSON.stringify(data).substring(0, 200) };
      return [newLog, ...prev].slice(0, 50);
    });
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => {
      setErrorMessage('');
    }, 5000);
  };

  const connectWebSocket = (targetLobbyId?: string) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsUrl = `${protocol}//${window.location.host}/ws`;
    if (targetLobbyId) {
      wsUrl += `?lobbyId=${targetLobbyId}`;
    }

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }

    ws = new WebSocket(wsUrl);
    let hasConnected = false;

    ws.onopen = () => {
      setConnected(true);
      hasConnected = true;
    };

    ws.onclose = () => {
      setConnected(false);
      if (reconnectTimeout) {
        window.clearTimeout(reconnectTimeout);
      }
      if (!hasConnected && targetLobbyId) {
        reconnectTimeout = window.setTimeout(() => {
          connectWebSocket(targetLobbyId);
        }, 2000);
      } else if (!targetLobbyId) {
        reconnectTimeout = window.setTimeout(() => {
          connectWebSocket();
        }, 3000);
      }
    };

    ws.onerror = () => {
      hasConnected = false;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        logDebug(`← ${msg.type}`, msg.data);
        handleMessage(msg);
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    };
  };

  const sendMessage = (type: string, data: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, data }));
      logDebug(`→ ${type}`, data);
    } else {
      console.warn('WebSocket not ready, cannot send:', type);
      showError('Connection not ready. Please try again.');
    }
  };

  const waitForConnection = (callback: () => void, retries = 10) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      callback();
    } else if (retries > 0) {
      setLobbyMessage(`Connecting... (${retries})`);
      setTimeout(() => waitForConnection(callback, retries - 1), 500);
    } else {
      showError('Could not connect to server.');
      setLobbyMessage('Connection failed.');
    }
  };

  const handleMessage = (msg: { type: string; data: any }) => {
    switch (msg.type) {
      case 'lobbyState':
        handleLobbyState(msg.data as LobbyStateMessage);
        break;
      case 'gameStart':
        handleGameStart(msg.data as GameStartMessage);
        break;
      case 'diceResult':
        handleDiceResult(msg.data as DiceResultMessage);
        break;
      case 'question':
        handleQuestion(msg.data as QuestionMessage);
        break;
      case 'answerResult':
        handleAnswerResult(msg.data as AnswerResultMessage);
        break;
      case 'turnChange':
        handleTurnChange(msg.data as TurnChangeMessage);
        break;
      case 'gameOver':
        handleGameOver(msg.data as GameOverMessage);
        break;
      case 'error':
        showError(msg.data?.message || 'Server error');
        break;
    }
  };

  const handleLobbyState = (data: LobbyStateMessage) => {
    if (data.lobbyId && !lobbyId()) {
      setLobbyId(data.lobbyId);
    }
    setPlayers(data.players || []);
    setLobbyMessage(data.message || '');

    if (data.players?.length && myPlayerId() === null) {
      const nameMatch = data.players.find(p => p.name === playerName());
      setMyPlayerId(nameMatch?.id ?? data.players[data.players.length - 1].id);
    }
  };

  const handleGameStart = (data: GameStartMessage) => {
    setView('game');
    setBoard(data.board);
    setPlayers(data.players);

    const currentIdx = data.playerOrder.indexOf(data.currentPlayerId);
    setGameState({
      board: data.board,
      playerOrder: data.playerOrder,
      currentTurnIdx: currentIdx >= 0 ? currentIdx : 0,
      currentPlayerId: data.currentPlayerId,
      waitingForRoll: data.waitingForRoll,
      waitingForAnswer: false
    });

    if (myPlayerId() === null && data.players.length > 0) {
      setMyPlayerId(data.players[0].id);
    }
  };

  const handleDiceResult = (data: DiceResultMessage) => {
    setGameState(prev => prev ? ({
      ...prev,
      waitingForRoll: false,
      waitingForAnswer: true
    }) : prev);
    setCurrentCategory(data.category);
  };

  const handleQuestion = (data: QuestionMessage) => {
    setCurrentQuestion(data.question);
    setShowQuestion(true);
    setTimer(data.timeLimit || 20);
    setAnswerType('multiple');
    setSelectedAnswer(null);
    setDirectAnswer('');
    setAnswerSubmitted(false);
    setAnswerResult(null);
    startTimer();
  };

  const handleAnswerResult = (data: AnswerResultMessage) => {
    setShowQuestion(false);
    if (timerInterval) {
      window.clearInterval(timerInterval);
    }

    setAnswerResult({
      correct: data.correct,
      message: data.message
    });

    setPlayers(prev => prev.map(p => {
      if (p.id === data.playerId) {
        return { ...p, km: data.newKm, position: data.newPosition };
      }
      return p;
    }));

    const player = players().find(p => p.id === data.playerId);
    if (data.correct && data.kmChange > 0 && player) {
      showTurnNotification(`${player.name} advanced ${data.kmChange}km!`);
    }

    setGameState(prev => prev ? ({
      ...prev,
      waitingForAnswer: false
    }) : prev);
  };

  const handleTurnChange = (data: TurnChangeMessage) => {
    const idx = gameState()?.playerOrder.indexOf(data.nextPlayer.id) ?? 0;
    setGameState(prev => prev ? ({
      ...prev,
      waitingForRoll: true,
      currentPlayerId: data.nextPlayer.id,
      currentTurnIdx: idx >= 0 ? idx : 0
    }) : prev);
    showTurnNotification(`It's ${data.nextPlayer.name}'s turn!`);
  };

  const handleGameOver = (data: GameOverMessage) => {
    setGameOver(true);
    setWinner(data.winner);
    setWinnerMessage(data.message);
    setShowQuestion(false);
  };

  const createLobby = () => {
    const name = playerName() || 'Player';
    setPlayerName(name);
    setLobbyMessage('Creating lobby...');
    waitForConnection(() => {
      sendMessage('createLobby', { playerName: name });
    });
  };

  const joinLobby = () => {
    if (!lobbyIdInput()) {
      showError('Please enter a lobby ID');
      return;
    }
    const name = playerName() || 'Player';
    setPlayerName(name);
    setLobbyId(lobbyIdInput());
    setLobbyMessage('Joining lobby...');
    connectWebSocket(lobbyIdInput());
    waitForConnection(() => {
      sendMessage('joinLobby', { lobbyId: lobbyIdInput(), playerName: name });
    });
  };

  const startGame = () => {
    if (players().length < 2) {
      setErrorMessage('Need at least 2 players to start');
      return;
    }
    sendMessage('startGame', {});
  };

  const startSinglePlayerTest = () => {
    setLobbyMessage('Initializing single-player...');
    connectWebSocket();
    waitForConnection(() => {
      setTestMode(true);
      sendMessage('enableTestMode', { enabled: true, botSpeed: botSpeed() });
      logDebug('enableTestMode', { enabled: true, botSpeed: botSpeed() });
    });
  };

  const quickJoinTest = () => {
    setLobbyIdInput('00000000-0000-0000-0000-000000000001');
    joinLobby();
  };

  const createTestGame = () => {
    setLobbyMessage('Creating test game...');
    connectWebSocket();
    waitForConnection(() => {
      sendMessage('createLobby', { playerName: playerName() || 'Host' });
      setTimeout(() => {
        sendMessage('addBot', { level: 2 });
        sendMessage('addBot', { level: 2 });
        sendMessage('addBot', { level: 2 });
      }, 400);
      setTimeout(() => {
        sendMessage('startGame', {});
      }, 1200);
    });
  };

  const rollDice = () => {
    if (!gameState()?.waitingForRoll || myPlayerId() !== gameState()?.currentPlayerId) {
      return;
    }
    setDiceAnimating(true);
    sendMessage('rollDice', { playerId: myPlayerId() });
    setTimeout(() => {
      setDiceAnimating(false);
    }, 1000);
  };

  const startTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = window.setInterval(() => {
      setTimer(prev => {
        if (prev <= 0) {
          if (timerInterval) clearInterval(timerInterval);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  onCleanup(() => {
    if (timerInterval) clearInterval(timerInterval);
    if (reconnectTimeout) window.clearTimeout(reconnectTimeout);
    if (ws) ws.close();
  });

  const handleTimeout = () => {
    if (!answerSubmitted()) {
      submitAnswer(-1);
    }
  };

  const submitAnswer = (answerIndex: number) => {
    if (answerSubmitted()) return;
    setAnswerSubmitted(true);
    if (timerInterval) clearInterval(timerInterval);
    setTimer(0);
    setSelectedAnswer(answerIndex);

    sendMessage('submitAnswer', {
      playerId: myPlayerId(),
      answer: answerIndex,
      answerType: answerType()
    });
  };

  const submitDirectAnswer = () => {
    if (!directAnswer() || answerSubmitted()) return;
    const options = currentQuestion()?.options || [];
    const answer = directAnswer().toLowerCase().trim();
    const matchedIndex = options.findIndex(opt => opt.toLowerCase().trim() === answer);
    setAnswerType('direct');
    submitAnswer(matchedIndex);
  };

  const getCurrentPlayerName = () => {
    const player = players().find(p => p.id === gameState()?.currentPlayerId);
    return player?.name || 'Unknown';
  };

  const showTurnNotification = (message: string) => {
    setTurnNotification(message);
    setTimeout(() => {
      setTurnNotification('');
    }, 3000);
  };

  const isMyTurn = () => {
    return gameState()?.waitingForRoll && myPlayerId() === gameState()?.currentPlayerId;
  };

  const toggleDebugPanel = () => {
    setDebugPanel(!debugPanel());
  };

  const clearDebugLog = () => {
    setDebugLog([]);
  };

  const getGameProgress = () => {
    if (!gameState() || players().length === 0) return 0;
    const totalKm = players().reduce((sum, p) => sum + (p.km || 0), 0);
    const maxKm = players().length * 42;
    return Math.round((totalKm / maxKm) * 100);
  };

  const setBotSpeedAndSync = (speed: number) => {
    setBotSpeed(speed);
    if (testMode()) {
      sendMessage('enableTestMode', { enabled: true, botSpeed: speed });
      logDebug('updateBotSpeed', { botSpeed: speed });
    }
  };

  const addBot = (level = 2) => {
    sendMessage('addBot', { level });
    logDebug('addBot', { level });
  };

  const resetGame = () => {
    setView('lobby');
    setGameOver(false);
    setWinner(null);
    setWinnerMessage('');
    setBoard([]);
    setGameState(null);
    setCurrentQuestion(null);
    setShowQuestion(false);
    setAnswerResult(null);
    setAnswerSubmitted(false);
    setSelectedAnswer(null);
    setDirectAnswer('');
    setAnswerType('multiple');
    setPlayers([]);
    setLobbyId('');
    setLobbyIdInput('');
    setLobbyMessage('Enter a lobby ID or create a new one');
    setMyPlayerId(null);
    setTestMode(false);
    if (ws) {
      ws.close();
      ws = null;
    }
    connectWebSocket();
  };

  const handleKeydown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

    switch (e.key.toLowerCase()) {
      case 'r':
        if (isMyTurn()) rollDice();
        break;
      case 's':
        if (players().length >= 2 && !gameState()) startGame();
        break;
      case 'b':
        if (lobbyId() && players().length < 4) addBot();
        break;
      case 'd':
        toggleDebugPanel();
        break;
      case 'escape':
        setDebugPanel(false);
        break;
    }
  };

  onMount(() => {
    const timeout = window.setTimeout(() => {
      connectWebSocket();
    }, 500);
    window.addEventListener('keydown', handleKeydown);

    onCleanup(() => {
      window.clearTimeout(timeout);
      window.removeEventListener('keydown', handleKeydown);
    });
  });

  return (
    <div class="app-container">
      <Show when={view() === 'lobby'}>
        <LobbyComponent 
          createLobby={createLobby}
          joinLobby={joinLobby}
          startGame={startGame}
          startSinglePlayerTest={startSinglePlayerTest}
          quickJoinTest={quickJoinTest}
          createTestGame={createTestGame}
          toggleDebugPanel={toggleDebugPanel}
          players={players()}
          connected={connected()}
          lobbyId={lobbyId()}
          lobbyIdInput={lobbyIdInput()}
          setLobbyIdInput={setLobbyIdInput}
          playerName={playerName()}
          setPlayerName={setPlayerName}
          myPlayerId={myPlayerId()}
          message={lobbyMessage()}
          gameState={gameState()}
        />
      </Show>

      <Show when={view() === 'game'}>
        <GameInfo 
          gameState={gameState()}
          myPlayerId={myPlayerId()}
          getCurrentPlayerName={getCurrentPlayerName}
          players={players()}
          rollDice={rollDice}
          diceAnimating={diceAnimating()}
        />
        
        <div class="game-main">
          <GameBoard 
            board={board()}
            players={players()}
          />
          
          <PlayerCards 
            players={players()}
            gameOver={gameOver()}
            gameState={gameState()}
            getGameProgress={getGameProgress}
          />
        </div>

        <Show when={gameState()?.waitingForRoll && (myPlayerId() === gameState()?.currentPlayerId || testMode())}>
          <div class="dice-section">
            <button 
              class="btn btn-dice" 
              classList={{ 'dice-rolling': diceAnimating() }}
              onClick={rollDice}
              disabled={diceAnimating()}
            >
              <Show when={!diceAnimating()} fallback={<span>Rolling...</span>}>
                <span>🎲 Roll Dice</span>
              </Show>
            </button>
          </div>
        </Show>

        <QuestionModal
          show={showQuestion()}
          question={currentQuestion()}
          category={currentCategory()}
          timer={timer()}
          submitAnswer={submitAnswer}
          submitDirectAnswer={submitDirectAnswer}
          answerType={answerType()}
          setAnswerType={setAnswerType}
          directAnswer={directAnswer()}
          setDirectAnswer={setDirectAnswer}
          selectedAnswer={selectedAnswer()}
          answerResult={answerResult()}
          answerSubmitted={answerSubmitted()}
        />

        <TurnNotification message={turnNotification()} />

        <Show when={gameOver()}>
          <GameOverModal 
            show={gameOver()}
            winner={winner()}
            winnerMessage={winnerMessage()}
            resetGame={resetGame}
          />
        </Show>
      </Show>

      <DebugPanel
        show={debugPanel()}
        toggleDebugPanel={toggleDebugPanel}
        clearDebugLog={clearDebugLog}
        debugLog={debugLog()}
        testMode={testMode()}
        botSpeed={botSpeed()}
        setBotSpeed={setBotSpeedAndSync}
        addBot={() => addBot()}
        lobbyId={lobbyId()}
        myPlayerId={myPlayerId()}
        gameState={gameState()}
        players={players()}
        getGameProgress={getGameProgress}
        currentPlayer={players().find(p => p.id === gameState()?.currentPlayerId)}
      />

      <div class={`connection-status ${connected() ? 'connected' : 'disconnected'}`}>
        <span>{connected() ? '🟢 Connected' : '🔴 Disconnected'}</span>
      </div>

      <Show when={errorMessage()}>
        <div class="error-toast">
          <span>{errorMessage()}</span>
          <button onClick={() => setErrorMessage('')} class="close-btn">&times;</button>
        </div>
      </Show>
    </div>
  );
}
