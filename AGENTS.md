# AGENTS.md - Codebase Guidelines for Agentic Coding

This document provides guidelines for agents working on this codebase.

## Project Overview

This is a Go-based multiplayer trivia race game with:
- **Backend**: Go server with WebSocket (gorilla/websocket) handling game logic, lobby management, and questions
- **Frontend**: SolidJS + Vite app in `src/`, built to `dist/` and served by Go
- **Legacy Frontend**: Alpine.js static client in `client/` (not canonical)
- **Database**: SQLite via `github.com/mattn/go-sqlite3` for lobby persistence
- **Game**: 2-4 player trivia race to 42km using a spiral board

## Project Structure

```
Desafio/
├── cmd/main.go           # Server entry point with static file serving
├── server/
│   ├── server.go         # WebSocket handling, lobby management
│   ├── game_logic.go     # Game rules, dice, position calculation
│   └── types.go          # Data models, message types, sample questions
├── src/                  # SolidJS frontend source (canonical)
├── dist/                 # Built SolidJS assets served by Go
├── client/               # Legacy Alpine.js client (non-canonical)
├── Makefile              # Build and run commands
└── go.mod
```

## Build Commands

```bash
# Build server
make build

# Run server (serves frontend at http://localhost:8000)
make server

# Run Go test client
make client

# Run with hot reload (Go only)
make dev

# Run tests
make test

# Run single test
make test TEST=TestFunctionName

# Run with race detection
make test-race

# Check test coverage
make coverage

# Lint code
make lint

# Format code
make fmt

# Vet code
make vet

# All-in-one check
make check

# Clean build artifacts
make clean
```

## Running the Full Stack

```bash
# Terminal 1: Start server
make server

# Open browser at http://localhost:8000
# WebSocket endpoint: ws://localhost:8000/ws
```

## Frontend Tech Stack

- **SolidJS**: Canonical UI implementation (Vite build to `dist/`)
- **Legacy Alpine.js** (v3.x): Kept in `client/` for reference/testing
- **Vanilla CSS**: Shared colorful/child-friendly design
- **WebSocket**: Real-time communication with server

## Code Style Guidelines

### Imports

Organize imports in three groups separated by blank lines:
1. Standard library
2. External dependencies
3. Local imports

```go
import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"

	"desafio/server"
)
```

### Naming Conventions

- **Packages**: lowercase, concise, no underscores
- **Types**: PascalCase (e.g., `GameLobby`, `GamePlayer`)
- **Variables**: camelCase (e.g., `playerId`, `lobbyId`)
- **Constants**: PascalCase for exported, camelCase for unexported
- **Interfaces**: Add "er" suffix when appropriate (e.g., `Repositoryer`)

### Error Handling

- Use `log.Printf` for logging errors in handlers
- Return errors from functions when caller should handle them
- Check errors immediately after calls
- Use `defer` for cleanup

```go
// Good
conn, err := upgrade.Upgrade(w, r, nil)
if err != nil {
	log.Printf("Failed to upgrade connection: %v", err)
	return
}
defer conn.Close()
```

### Structs and JSON

- Use JSON tags for all exported fields
- Tag format: `json:"fieldName"` (camelCase in JSON, PascalCase in Go)
- Keep structs focused and small

```go
type GamePlayer struct {
	Id       int       `json:"id"`
	Name     string    `json:"name"`
	Color    string    `json:"color"`
	Position []int     `json:"position"`
	Km       int       `json:"km"`
}
```

### WebSocket Patterns

- Use `gorilla/websocket` for WebSocket connections
- Always defer `conn.Close()` after successful upgrade
- Handle messages in a loop for persistent connections
- Use `ReadJSON` and `WriteJSON` for message serialization

```go
for {
	msg, err := conn.ReadMessage()
	if err != nil {
		log.Printf("Read error: %v", err)
		break
	}
	// process message
}
```

### Concurrency

- Use `sync.Mutex` for protecting shared state
- Use goroutines for handling multiple clients
- Always handle potential race conditions with `-race` flag

```bash
go test -race ./...
go build -race -o bin/server ./cmd
```

### Constants

Group related constants using `const` blocks:

```go
const (
	CategoryMexico = iota + 1
	CategoryWorldHistory
	CategoryWorldGeography
	CategoryArtsSports
	CategoryScienceTech
	CategoryGeneralCulture
)

const (
	MsgCreateLobby  = "createLobby"
	MsgJoinLobby    = "joinLobby"
	MsgLobbyState   = "lobbyState"
	MsgGameStart    = "gameStart"
	MsgRollDice     = "rollDice"
	MsgDiceResult   = "diceResult"
	MsgQuestion     = "question"
	MsgSubmitAnswer = "submitAnswer"
	MsgAnswerResult = "answerResult"
	MsgTurnChange   = "turnChange"
	MsgGameOver     = "gameOver"
	MsgError        = "error"
)
```

## Game Rules

**Objective**: First player to reach exactly 42km wins.

**Core Mechanics**:
- 2-4 players per lobby
- Turn order: counterclockwise
- Direct answer → +2km if correct
- Multiple-choice (A/B/C) → +1km if correct
- Wrong answer → no movement

**Question Categories** (determined by dice roll 1-6):
1. Mexico
2. World History
3. World Geography
4. Arts, Sports & Entertainment
5. Science & Technology
6. General Culture

**Special Rules**:
- 20 seconds to answer (timer starts after question display)
- -1km penalty for answering on behalf of another player
- Server acts as referee (reads questions, validates answers)

## WebSocket Message Protocol

| Direction | Type | Payload |
|-----------|------|---------|
| C→S | `createLobby` | `{playerName}` |
| C→S | `joinLobby` | `{lobbyId, playerName}` |
| S→C | `lobbyState` | `{lobbyId, players[], ready, message}` |
| S→C | `gameStart` | `{board, players[], playerOrder, currentPlayerId, waitingForRoll}` |
| C→S | `rollDice` | `{playerId}` |
| S→C | `diceResult` | `{playerId, categoryId, category}` |
| S→C | `question` | `{question, timeLimit}` |
| C→S | `submitAnswer` | `{playerId, answer, answerType}` |
| S→C | `answerResult` | `{playerId, correct, kmChange, newKm, newPosition, message}` |
| S→C | `turnChange` | `{nextPlayer, message}` |
| S→C | `gameOver` | `{winner, message}` |

## Data Models

### Lobby
```go
type GameLobby struct {
	Id        uuid.UUID
	Players   map[int]*GamePlayer
	GameState *GameState
}
```

### GameState
```go
type GameState struct {
	Board           [][]int
	PlayerOrder     []int
	CurrentTurnIdx  int
	CurrentPlayerId int
	CurrentQuestion *Question
	WaitingForRoll  bool
	WaitingForAnswer bool
	GameOver        bool
	Winner          *GamePlayer
}
```

### Player
```go
type GamePlayer struct {
	Id       int
	Name     string
	Color    string
	Position []int  // [row, col] on board
	Km       int    // 0-42
}
```

## Testing

- Create `_test.go` files for tests
- Use table-driven tests when appropriate
- Test file placement: same directory as tested code
- Test naming: `TestFunctionName_ExpectedBehavior`

```go
func TestCalculatePosition(t *testing.T) {
	tests := []struct {
		name     string
		km       int
		expected []int
	}{
		{"start", 0, []int{0, 0}},
		{"some progress", 10, []int{2, 3}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := calculateSpiralPosition(tt.km)
			if !reflect.DeepEqual(result, tt.expected) {
				t.Errorf("got %v, want %v", result, tt.expected)
			}
		})
	}
}
```

## Environment Variables

- Use `github.com/joho/godotenv` for local development
- Load at startup: `godotenv.Load()`
- Use `os.Getenv` to retrieve values (e.g., `SUPABASE_CONN`)

## VSCode Configuration

See `.vscode/launch.json` for debug configurations.

## Key Files

- `server/server.go` - WebSocket handling, lobby management
- `server/game_logic.go` - Game rules, dice, spiral position calculation
- `server/types.go` - Data models, message types, sample questions (6 categories × 6 questions)
- `cmd/main.go` - Server startup with static file serving
- `src/` - SolidJS game UI (canonical)
- `dist/` - Built frontend served by Go
- `client/index.html` - Legacy Alpine.js game UI
- `client/js/game.js` - Legacy client-side game state management
- `client/css/style.css` - Shared colorful child-friendly styling
