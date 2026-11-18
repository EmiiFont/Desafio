function game() {
    return {
        ws: null,
        connected: false,
        view: 'lobby',
        lobbyId: '',
        lobbyIdInput: '',
        playerName: '',
        players: [],
        lobbyMessage: 'Enter a lobby ID or create a new one',
        gameStarted: false,
        board: [],
        gameState: null,
        myPlayerId: null,

        currentQuestion: null,
        currentCategory: null,
        showQuestion: false,
        timer: 20,
        timerInterval: null,
        answerType: 'multiple',
        selectedAnswer: null,
        directAnswer: '',
        answerSubmitted: false,
        answerResult: null,

        showTurnChange: false,
        turnChangeMessage: '',

        gameOver: false,
        winner: null,
        winnerMessage: '',

        diceAnimating: false,
        errorMessage: null,

        testMode: false,
        botSpeed: 1500,
        debugPanel: false,
        debugLog: [],
        maxDebugLog: 50,

        init() {
            setTimeout(() => {
                this.connectWebSocket();
            }, 500);
            document.addEventListener('keydown', (e) => this.handleKeydown(e));
        },

        handleKeydown(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.key.toLowerCase()) {
                case 'r':
                    if (this.isMyTurn()) this.rollDice();
                    break;
                case 's':
                    if (this.players.length >= 2 && !this.gameStarted) this.startGame();
                    break;
                case 'b':
                    if (this.lobbyId && this.players.length < 4) this.addBotPlayer();
                    break;
                case 'd':
                    this.toggleDebugPanel();
                    break;
                case 'escape':
                    this.debugPanel = false;
                    break;
            }
        },

        connectWebSocket(lobbyId = null) {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            let wsUrl = `${protocol}//${window.location.host}/ws`;
            
            if (lobbyId) {
                wsUrl += `?lobbyId=${lobbyId}`;
            }

            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.close();
            }

            console.log('Connecting to WebSocket:', wsUrl);
            this.ws = new WebSocket(wsUrl);
            
            let connected = false;

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.connected = true;
                connected = true;
            };

            this.ws.onclose = (event) => {
                console.log('WebSocket disconnected', event.code, event.reason);
                this.connected = false;
                if (!connected && this.lobbyId) {
                    setTimeout(() => {
                        console.log('Retrying connection...');
                        this.connectWebSocket(this.lobbyId);
                    }, 2000);
                } else {
                    setTimeout(() => {
                        if (!this.lobbyId) {
                            this.connectWebSocket();
                        }
                    }, 3000);
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                connected = false;
            };

            this.ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    this.logDebug(`← ${msg.type}`, msg.data);
                    this.handleMessage(msg);
                } catch (e) {
                    console.error('Failed to parse message:', e);
                }
            };
        },

        logDebug(action, data) {
            const timestamp = new Date().toLocaleTimeString();
            this.debugLog.unshift({ timestamp, action, data: JSON.stringify(data).substring(0, 200) });
            if (this.debugLog.length > this.maxDebugLog) {
                this.debugLog.pop();
            }
        },

        handleMessage(msg) {
            console.log('Received:', msg);
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                return;
            }

            switch (msg.type) {
                case 'lobbyState':
                    this.handleLobbyState(msg.data);
                    break;
                case 'gameStart':
                    this.handleGameStart(msg.data);
                    break;
                case 'diceResult':
                    this.handleDiceResult(msg.data);
                    break;
                case 'question':
                    this.handleQuestion(msg.data);
                    break;
                case 'answerResult':
                    this.handleAnswerResult(msg.data);
                    break;
                case 'turnChange':
                    this.handleTurnChange(msg.data);
                    break;
                case 'gameOver':
                    this.handleGameOver(msg.data);
                    break;
                case 'error':
                    this.showError(msg.data.message);
                    break;
            }
        },

        sendMessage(type, data) {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type, data }));
            } else {
                console.warn('WebSocket not ready, cannot send:', type);
                this.showError('Connection not ready. Please try again.');
            }
        },

        createLobby() {
            this.playerName = this.playerName || 'Player';
            this.lobbyMessage = 'Creating lobby...';
            this.sendMessage('createLobby', { playerName: this.playerName });
        },

        joinLobby() {
            if (!this.lobbyIdInput) {
                this.showError('Please enter a lobby ID');
                return;
            }
            this.playerName = this.playerName || 'Player';
            this.lobbyId = this.lobbyIdInput;
            this.lobbyMessage = 'Joining lobby...';
            this.connectWebSocket(this.lobbyId);
        },

        handleLobbyState(data) {
            if (data.lobbyId && !this.lobbyId) {
                this.lobbyId = data.lobbyId;
            }
            this.players = data.players || [];
            this.lobbyMessage = data.message;

            if (this.players.length > 0 && this.myPlayerId === null) {
                this.myPlayerId = this.players[this.players.length - 1].id;
            }
        },

        startGame() {
            if (this.players.length < 2) {
                this.showError('Need at least 2 players to start');
                return;
            }
            this.sendMessage('startGame', {});
        },

        handleGameStart(data) {
            console.log('Game Started!', data);
            this.view = 'game';
            this.gameStarted = true;
            this.board = data.board;
            this.gameState = {
                currentPlayerId: data.currentPlayerId,
                waitingForRoll: data.waitingForRoll,
                waitingForAnswer: false
            };
            this.players = data.players;

            if (this.myPlayerId === null && this.players.length > 0) {
                this.myPlayerId = this.players[0].id;
            }
            console.log('View set to game, players:', this.players.length);
        },

        rollDice() {
            if (!this.gameState?.waitingForRoll || this.myPlayerId !== this.gameState.currentPlayerId) {
                return;
            }
            this.diceAnimating = true;
            this.sendMessage('rollDice', { playerId: this.myPlayerId });

            setTimeout(() => {
                this.diceAnimating = false;
            }, 1000);
        },

        handleDiceResult(data) {
            this.gameState.waitingForRoll = false;
            this.currentCategory = this.getCategoryById(data.categoryId);
        },

        handleQuestion(data) {
            this.currentQuestion = data.question;
            this.gameState.waitingForAnswer = true;
            this.showQuestion = true;
            this.timer = data.timeLimit || 20;
            this.answerType = 'multiple';
            this.selectedAnswer = null;
            this.directAnswer = '';
            this.answerSubmitted = false;
            this.answerResult = null;

            this.startTimer();
        },

        startTimer() {
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }
            this.timerInterval = setInterval(() => {
                this.timer--;
                if (this.timer <= 0) {
                    this.handleTimeout();
                }
            }, 1000);
        },

        handleTimeout() {
            clearInterval(this.timerInterval);
            if (!this.answerSubmitted) {
                this.submitAnswer(-1);
            }
        },

        submitAnswer(index) {
            if (this.answerSubmitted) return;
            this.answerSubmitted = true;
            clearInterval(this.timerInterval);

            this.sendMessage('submitAnswer', {
                playerId: this.myPlayerId,
                answer: index,
                answerType: this.answerType
            });
        },

        submitDirectAnswer() {
            if (!this.directAnswer || this.answerSubmitted) return;

            const options = this.currentQuestion.options;
            let index = -1;

            for (let i = 0; i < options.length; i++) {
                if (options[i].toLowerCase().trim() === this.directAnswer.toLowerCase().trim()) {
                    index = i;
                    break;
                }
            }

            this.submitAnswer(index);
        },

        handleAnswerResult(data) {
            this.showQuestion = false;
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }

            this.answerResult = {
                correct: data.correct,
                message: data.message
            };

            const player = this.players.find(p => p.id === data.playerId);
            if (player) {
                player.km = data.newKm;
                player.position = data.newPosition;
            }

            if (data.nextPlayer) {
                this.gameState.currentPlayerId = data.nextPlayer.id;
            }

            if (data.correct && data.newKm > 0) {
                this.showTurnChangeNotification(`${player.name} advanced ${data.kmChange}km!`);
            }
        },

        handleTurnChange(data) {
            this.gameState.waitingForRoll = true;
            this.gameState.currentPlayerId = data.nextPlayer.id;

            const nextPlayer = this.players.find(p => p.id === data.nextPlayer.id);
            if (nextPlayer) {
                this.showTurnChangeNotification(`It's ${nextPlayer.name}'s turn!`);
            }
        },

        showTurnChangeNotification(message) {
            this.turnChangeMessage = message;
            this.showTurnChange = true;
            setTimeout(() => {
                this.showTurnChange = false;
            }, 3000);
        },

        handleGameOver(data) {
            this.gameOver = true;
            this.winner = data.winner;
            this.winnerMessage = data.message;
            this.showQuestion = false;
        },

        resetGame() {
            this.view = 'lobby';
            this.gameStarted = false;
            this.gameOver = false;
            this.winner = null;
            this.board = [];
            this.gameState = null;
            this.currentQuestion = null;
            this.lobbyId = '';
            this.lobbyIdInput = '';
        },

        getCurrentPlayerName() {
            const player = this.players.find(p => p.id === this.gameState?.currentPlayerId);
            return player?.name || 'Unknown';
        },

        getCategoryById(id) {
            const categories = [
                { id: 1, name: 'Mexico', color: '#FF6B6B', emoji: '🇲🇽' },
                { id: 2, name: 'World History', color: '#4ECDC4', emoji: '📜' },
                { id: 3, name: 'World Geography', color: '#95E1D3', emoji: '🌍' },
                { id: 4, name: 'Arts, Sports & Entertainment', color: '#DDA0DD', emoji: '🎭' },
                { id: 5, name: 'Science & Technology', color: '#FFE66D', emoji: '🔬' },
                { id: 6, name: 'General Culture', color: '#F7D794', emoji: '🎯' }
            ];
            return categories.find(c => c.id === id);
        },

        getCellStyle(categoryId) {
            const colors = {
                1: 'background: linear-gradient(145deg, #FF6B6B, #ee5a5a);',
                2: 'background: linear-gradient(145deg, #4ECDC4, #3dbdb5);',
                3: 'background: linear-gradient(145deg, #95E1D3, #84d0c2);',
                4: 'background: linear-gradient(145deg, #DDA0DD, #cc8fcc);',
                5: 'background: linear-gradient(145deg, #FFE66D, #ffd93d);',
                6: 'background: linear-gradient(145deg, #F7D794, #f5c778);'
            };
            return colors[categoryId] || colors[1];
        },

        getCellKm(row, col) {
            const totalCells = 25;
            const centerIndex = 24;
            const outerToInner = [0, 1, 2, 3, 4, 3, 2, 1, 0, 1, 2, 3, 4, 3, 2, 1, 0, 1, 2, 3, 4, 3, 2, 1, 0];

            const index = row * 5 + col;
            const stepsFromOuter = centerIndex - index;
            const km = Math.floor(stepsFromOuter * (42 / 24));

            if (row === 2 && col === 2) return '🏁';

            return km + 'km';
        },

        getPlayersAt(row, col) {
            return this.players.filter(p => {
                if (!p.position || p.position.length < 2) return false;
                return p.position[0] === row && p.position[1] === col;
            });
        },

        showError(message) {
            this.errorMessage = message;
            setTimeout(() => {
                this.errorMessage = null;
            }, 5000);
        },

        canStartGame() {
            return this.players && this.players.length >= 2 && !this.gameStarted;
        },

        waitForConnection(callback, retries = 10) {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                callback();
            } else if (retries > 0) {
                this.lobbyMessage = `Connecting... (${retries})`;
                setTimeout(() => this.waitForConnection(callback, retries - 1), 500);
            } else {
                this.showError('Could not connect to server.');
                this.lobbyMessage = 'Connection failed.';
            }
        },

        // Test/Quick Join Methods
        quickJoin() {
            const testLobbyId = 'test-' + Math.random().toString(36).substr(2, 8);
            const testNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
            this.playerName = testNames[Math.floor(Math.random() * testNames.length)] + ' (Test)';
            this.lobbyId = testLobbyId;
            this.connectWebSocket(this.lobbyId);
        },

        addBotPlayer() {
            if (!this.lobbyId || this.players.length >= 4) return;
            const botNames = ['Bot-Alpha', 'Bot-Beta', 'Bot-Gamma', 'Bot-Delta'];
            const usedNames = this.players.map(p => p.name);
            const availableBot = botNames.find(n => !usedNames.some(un => un.includes(n.split('-')[1])));

            const botId = Math.floor(Math.random() * 100000);
            const botName = availableBot || 'Bot-' + (this.players.length + 1);

            this.sendMessage('joinLobby', {
                lobbyId: this.lobbyId,
                playerName: botName
            });
        },

        autoStartGame() {
            if (this.players.length >= 2) {
                this.sendMessage('startGame', {});
            }
        },

        quickJoinTest() {
            this.playerName = this.playerName || 'Test Player';
            this.lobbyId = '00000000-0000-0000-0000-000000000001';
            this.connectWebSocket(this.lobbyId);
        },

        createTestGame() {
            this.playerName = this.playerName || 'Test Host';
            this.lobbyMessage = 'Creating test game...';
            this.connectWebSocket();
            
            this.waitForConnection(() => {
                const botNames = ['Bot-Alpha', 'Bot-Beta', 'Bot-Gamma'];
                botNames.forEach((name, i) => {
                    setTimeout(() => {
                        this.sendMessage('joinLobby', {
                            lobbyId: this.lobbyId,
                            playerName: name
                        });
                    }, (i + 1) * 500);
                });
                
                setTimeout(() => {
                    this.sendMessage('startGame', {});
                    this.logDebug('autoStartGame', {});
                }, 2500);
            });
        },

        startSinglePlayerTest() {
            this.playerName = this.playerName || 'Player';
            this.lobbyMessage = 'Initializing single-player...';
            this.connectWebSocket();
            
            this.waitForConnection(() => {
                this.lobbyMessage = 'Starting game...';
                this.sendMessage('enableTestMode', {
                    enabled: true,
                    botSpeed: this.botSpeed
                });
                this.logDebug('enableTestMode', { enabled: true, botSpeed: this.botSpeed });
            });
        },

        setBotSpeed(speed) {
            this.botSpeed = speed;
            if (this.testMode) {
                this.sendMessage('enableTestMode', {
                    enabled: true,
                    botSpeed: this.botSpeed
                });
                this.logDebug('updateBotSpeed', { botSpeed: this.botSpeed });
            }
        },

        addBot(level = 2) {
            this.sendMessage('addBot', { level });
            this.logDebug('addBot', { level });
        },

        toggleDebugPanel() {
            this.debugPanel = !this.debugPanel;
        },

        clearDebugLog() {
            this.debugLog = [];
        },

        isMyTurn() {
            return this.gameState && this.gameState.waitingForRoll && 
                   this.myPlayerId === this.gameState.currentPlayerId &&
                   !this.isMyTurnBot();
        },

        isMyTurnBot() {
            const player = this.players.find(p => p.id === this.myPlayerId);
            return player && player.isBot;
        },

        getCurrentPlayer() {
            return this.players.find(p => p.id === this.gameState?.currentPlayerId);
        },

        getGameProgress() {
            if (!this.gameStarted || !this.players.length) return 0;
            const totalKm = this.players.reduce((sum, p) => sum + (p.km || 0), 0);
            const maxKm = this.players.length * 42;
            return Math.round((totalKm / maxKm) * 100);
        },

        getPlayerStatus(player) {
            if (player.isBot) return `🤖 Bot (Lv.${player.botLevel || 2})`;
            if (player.id === this.myPlayerId) return '👤 You';
            return '👥 Player';
        }
    };
}
