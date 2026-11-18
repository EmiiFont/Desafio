package server

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	_ "github.com/mattn/go-sqlite3"
)

type Client struct {
	conn     *websocket.Conn
	PlayerId int
	Lobby    *GameLobby
}

type Message struct {
	Type string `json:"type"`
	Data string `json:"data"`
}

type Pool struct {
	Clients map[uuid.UUID][]*Client
}

func NewPool() *Pool {
	return &Pool{
		Clients: make(map[uuid.UUID][]*Client),
	}
}

const (
	boardSize = 5
)

var (
	upgrade = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin:     func(r *http.Request) bool { return true },
	}
	lobbyMutex  sync.Mutex
	lobbies     = make(map[uuid.UUID]*GameLobby)
	clientConns = make(map[int]*websocket.Conn)
	clientMutex sync.Mutex
	repo        = NewQuestionRepository()
	db          *sql.DB
	dbMutex     sync.RWMutex
)

func createLobby() *GameLobby {
	lobbyMutex.Lock()
	defer lobbyMutex.Unlock()

	lobbyID := uuid.New()
	lobby := &GameLobby{
		Id:      lobbyID,
		Players: make(map[int]*GamePlayer),
	}
	lobbies[lobbyID] = lobby

	if db != nil {
		SaveLobby(lobby)
	}

	return lobby
}

func getLobby(id uuid.UUID) *GameLobby {
	lobbyMutex.Lock()
	defer lobbyMutex.Unlock()
	return lobbies[id]
}

func handleWebsocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrade.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}
	defer conn.Close()

	lobbyIdStr := r.URL.Query().Get("lobbyId")

	var lobby *GameLobby
	if lobbyIdStr == "" {
		lobby = createLobby()
	} else {
		lobbyId, err := uuid.Parse(lobbyIdStr)
		if err != nil {
			log.Printf("Invalid lobby ID: %v", err)
			sendError(conn, "Invalid lobby ID")
			return
		}
		lobby = getLobby(lobbyId)
		if lobby == nil {
			sendError(conn, "Lobby not found")
			return
		}
	}

	playerId := rand.Intn(100000)
	client := &Client{
		conn:     conn,
		PlayerId: playerId,
		Lobby:    lobby,
	}

	lobby.Players[playerId] = &GamePlayer{
		Id:       playerId,
		Name:     fmt.Sprintf("Player %d", playerId%1000),
		Color:    PlayerColors[len(lobby.Players)%len(PlayerColors)],
		Position: []int{0, 0},
		Km:       0,
	}

	clientMutex.Lock()
	clientConns[playerId] = conn
	clientMutex.Unlock()

	log.Printf("Player %d joined lobby %s", playerId, lobby.Id)

	sendLobbyStateToClient(lobby, conn, playerId)

	go lobby.handleClient(client)
}

func (lobby *GameLobby) handleClient(client *Client) {
	defer func() {
		clientMutex.Lock()
		delete(clientConns, client.PlayerId)
		clientMutex.Unlock()
		client.conn.Close()
		delete(lobby.Players, client.PlayerId)
		broadcastLobbyState(lobby)
	}()

	for {
		_, data, err := client.conn.ReadMessage()
		var msg Message
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error for player %d: %v", client.PlayerId, err)
			}
			break
		}
		err = json.Unmarshal(data, &msg)
		if err != nil {
			log.Printf("Failed to unmarshal message: %v", err)
			continue
		}
		log.Printf("Received message: %s", msg.Type)
		lobby.handleMessage(client, msg)
	}
}

func (lobby *GameLobby) handleMessage(client *Client, msg Message) {
	switch msg.Type {
	case "setName":
		var data map[string]string
		json.Unmarshal([]byte(msg.Data), &data)
		if player, ok := lobby.Players[client.PlayerId]; ok {
			player.Name = data["name"]
		}
		broadcastLobbyState(lobby)

	case MsgCreateLobby:
		var data CreateLobbyMessage
		json.Unmarshal([]byte(msg.Data), &data)
		if player, ok := lobby.Players[client.PlayerId]; ok {
			player.Name = data.PlayerName
		}
		broadcastLobbyState(lobby)

	case MsgJoinLobby:
		var data JoinLobbyMessage
		json.Unmarshal([]byte(msg.Data), &data)
		if player, ok := lobby.Players[client.PlayerId]; ok {
			player.Name = data.PlayerName
		}
		broadcastLobbyState(lobby)

	case MsgEnableTestMode:
		var data EnableTestModeMessage
		json.Unmarshal([]byte(msg.Data), &data)
		lobby.TestMode = data.Enabled
		lobby.BotSpeed = data.BotSpeed
		if data.Enabled {
			for i := 0; i < 3; i++ {
				lobby.AddBotPlayer(2)
			}
			broadcastLobbyState(lobby)

			if len(lobby.Players) >= 2 {
				go func() {
					time.Sleep(500 * time.Millisecond)
					startGame(lobby)
				}()
			}
		}

	case "addBot":
		var data map[string]int
		json.Unmarshal([]byte(msg.Data), &data)
		level := data["level"]
		if level <= 0 {
			level = 2
		}
		bot := lobby.AddBotPlayer(level)
		log.Printf("Added bot %s (level %d) to lobby %s", bot.Name, level, lobby.Id)
		broadcastLobbyState(lobby)
		if db != nil {
			SaveLobby(lobby)
		}

	case "startGame":
		if len(lobby.Players) >= 2 {
			startGame(lobby)
		}

	case MsgRollDice:
		var data RollDiceMessage
		json.Unmarshal([]byte(msg.Data), &data)
		if data.PlayerId == lobby.GameState.CurrentPlayerId {
			handleRollDice(lobby, data.PlayerId)
		}

	case MsgSubmitAnswer:
		var data SubmitAnswerMessage
		json.Unmarshal([]byte(msg.Data), &data)
		handleSubmitAnswer(lobby, data)
	}
}

func startGame(lobby *GameLobby) {
	playerOrder := make([]int, 0, len(lobby.Players))
	for id := range lobby.Players {
		playerOrder = append(playerOrder, id)
	}

	for i := range playerOrder {
		j := rand.Intn(i + 1)
		playerOrder[i], playerOrder[j] = playerOrder[j], playerOrder[i]
	}

	board := GenerateSpiralBoard(boardSize)

	lobby.GameState = &GameState{
		Board:           board,
		PlayerOrder:     playerOrder,
		CurrentTurnIdx:  0,
		CurrentPlayerId: playerOrder[0],
		WaitingForRoll:  true,
	}

	for _, player := range lobby.Players {
		player.Position = []int{0, 0}
		player.Km = 0
	}

	gameStartMsg := GameStartMessage{
		Board:           board,
		Players:         getPlayerList(lobby),
		PlayerOrder:     playerOrder,
		CurrentPlayerId: playerOrder[0],
		WaitingForRoll:  true,
	}

	broadcastToLobby(lobby, MsgGameStart, gameStartMsg)

	if db != nil {
		SaveLobby(lobby)
	}

	if lobby.TestMode {
		firstPlayer := lobby.Players[playerOrder[0]]
		if firstPlayer.IsBot {
			delay := BotSpeedNormal
			if lobby.BotSpeed > 0 {
				delay = lobby.BotSpeed
			}
			lobby.ScheduleBotTurn(firstPlayer.Id, delay)
		}
	}
}

func handleRollDice(lobby *GameLobby, playerId int) {
	result := lobby.RollDice(playerId)
	lobby.GameState.WaitingForRoll = false
	lobby.GameState.WaitingForAnswer = true

	broadcastToLobby(lobby, MsgDiceResult, result)

	questionMsg := lobby.GetQuestion(result.CategoryId, repo)
	lobby.GameState.CurrentQuestion = &questionMsg.Question

	broadcastToLobby(lobby, MsgQuestion, questionMsg)

	if db != nil {
		SaveLobby(lobby)
	}

	currentPlayer := lobby.Players[playerId]
	if lobby.TestMode && currentPlayer.IsBot {
		delay := BotSpeedNormal
		if lobby.BotSpeed > 0 {
			delay = lobby.BotSpeed
		}
		lobby.ScheduleBotTurn(playerId, delay)
	}
}

func handleSubmitAnswer(lobby *GameLobby, data SubmitAnswerMessage) {
	if !lobby.GameState.WaitingForAnswer || data.PlayerId != lobby.GameState.CurrentPlayerId {
		return
	}

	question := lobby.GameState.CurrentQuestion
	correct := ValidateAnswer(question, data.Answer)
	kmChange := CalculateKmChange(data.AnswerType, correct)

	player := lobby.Players[data.PlayerId]
	player.Km += kmChange

	if player.Km > 42 {
		player.Km = 42
	}

	newPos := calculateSpiralPosition(player.Km)
	player.Position = newPos

	result := AnswerResultMessage{
		PlayerId:    data.PlayerId,
		Correct:     correct,
		KmChange:    kmChange,
		NewKm:       player.Km,
		NewPosition: newPos,
		Message:     fmt.Sprintf("%s answer! %s", map[bool]string{true: "Correct", false: "Wrong"}[correct], getKmMessage(kmChange)),
	}

	broadcastToLobby(lobby, MsgAnswerResult, result)

	if CheckWinCondition(player) {
		gameOverMsg := GameOverMessage{
			Winner:  player,
			Message: fmt.Sprintf("%s wins the race!", player.Name),
		}
		lobby.GameState.GameOver = true
		lobby.GameState.Winner = player
		broadcastToLobby(lobby, MsgGameOver, gameOverMsg)

		if db != nil {
			SaveLobby(lobby)
		}
		return
	}

	lobby.GameState.WaitingForAnswer = false

	nextPlayer := lobby.GetNextPlayer()
	turnMsg := TurnChangeMessage{
		NextPlayer: nextPlayer,
		Message:    fmt.Sprintf("It's %s's turn!", nextPlayer.Name),
	}
	lobby.GameState.WaitingForRoll = true
	lobby.GameState.CurrentPlayerId = nextPlayer.Id

	broadcastToLobby(lobby, MsgTurnChange, turnMsg)

	if db != nil {
		SaveLobby(lobby)
	}

	if lobby.TestMode && nextPlayer.IsBot && !lobby.GameState.GameOver {
		delay := BotSpeedNormal
		if lobby.BotSpeed > 0 {
			delay = lobby.BotSpeed
		}
		lobby.ScheduleBotTurn(nextPlayer.Id, delay)
	}
}

func getKmMessage(km int) string {
	switch km {
	case 2:
		return "Moved 2km (direct answer)"
	case 1:
		return "Moved 1km (multiple choice)"
	default:
		return "No movement"
	}
}

func calculateSpiralPosition(km int) []int {
	if km == 0 {
		return []int{0, 0}
	}

	stepsPerKm := 24.0 / 42.0
	totalSteps := int(float64(km) * stepsPerKm)
	steps := totalSteps

	size := boardSize
	colLimit := size - 1
	rowLimit := size - 1
	left, up := 0, 0

	pos := []int{0, 0}

	for steps > 0 {
		for i := left; i <= colLimit && steps >= 0; i++ {
			pos[1] = i
			steps--
			if steps == 0 {
				return pos
			}
		}
		for i := up + 1; i <= rowLimit && steps >= 0; i++ {
			pos[0] = i
			steps--
			if steps == 0 {
				return pos
			}
		}
		if up != rowLimit {
			for i := colLimit - 1; i >= left && steps >= 0; i-- {
				pos[1] = i
				steps--
				if steps == 0 {
					return pos
				}
			}
		}
		if left != colLimit {
			for i := rowLimit - 1; i > up && steps >= 0; i-- {
				pos[0] = i
				steps--
				if steps == 0 {
					return pos
				}
			}
		}
		left++
		colLimit--
		up++
		rowLimit--
	}
	return pos
}

func sendLobbyState(lobby *GameLobby, targetConn *websocket.Conn) {
	players := getPlayerList(lobby)
	state := LobbyStateMessage{
		LobbyId: lobby.Id.String(),
		Players: players,
		Ready:   len(players) >= 2,
		Message: getLobbyMessage(len(players)),
	}

	if targetConn != nil {
		sendMessage(targetConn, MsgLobbyState, state)
	} else {
		broadcastLobbyState(lobby)
	}
}

func sendLobbyStateToClient(lobby *GameLobby, conn *websocket.Conn, playerId int) {
	players := getPlayerList(lobby)
	state := LobbyStateMessage{
		LobbyId: lobby.Id.String(),
		Players: players,
		Ready:   len(players) >= 2,
		Message: getLobbyMessage(len(players)),
	}
	sendMessage(conn, MsgLobbyState, state)
}

func broadcastLobbyState(lobby *GameLobby) {
	players := getPlayerList(lobby)
	state := LobbyStateMessage{
		LobbyId: lobby.Id.String(),
		Players: players,
		Ready:   len(players) >= 2,
		Message: getLobbyMessage(len(players)),
	}

	for playerId := range lobby.Players {
		sendToPlayer(playerId, MsgLobbyState, state)
	}

	if db != nil {
		SaveLobby(lobby)
	}
}

func getPlayerList(lobby *GameLobby) []*GamePlayer {
	players := make([]*GamePlayer, 0, len(lobby.Players))
	for _, p := range lobby.Players {
		players = append(players, p)
	}
	return players
}

func getLobbyMessage(count int) string {
	switch count {
	case 0:
		return "Waiting for players..."
	case 1:
		return "Waiting for more players..."
	case 2, 3, 4:
		return fmt.Sprintf("%d player(s) ready. Press Start!", count)
	default:
		return "Lobby full"
	}
}

func broadcastToLobby(lobby *GameLobby, msgType string, data interface{}) {
	for playerId := range lobby.Players {
		sendToPlayer(playerId, msgType, data)
	}
}

func sendToPlayer(playerId int, msgType string, data interface{}) {
	clientMutex.Lock()
	conn, ok := clientConns[playerId]
	clientMutex.Unlock()

	if !ok || conn == nil {
		return
	}

	msg := map[string]interface{}{
		"type": msgType,
		"data": data,
	}

	clientMutex.Lock()
	if err := conn.WriteJSON(msg); err != nil {
		log.Printf("Failed to send message to player %d: %v", playerId, err)
		delete(clientConns, playerId)
		clientMutex.Unlock()
	} else {
		clientMutex.Unlock()
	}
}

func sendWebSocketMessage(playerId int, lobby *GameLobby, msg interface{}) {
	sendToPlayer(playerId, "", msg)
}

func getClientConn(playerId int, lobby *GameLobby) *websocket.Conn {
	clientMutex.Lock()
	defer clientMutex.Unlock()
	return clientConns[playerId]
}

func sendJSON(conn *websocket.Conn, data interface{}) {
	if conn != nil {
		conn.WriteJSON(data)
	}
}

func sendMessage(conn *websocket.Conn, msgType string, data interface{}) {
	if conn == nil {
		return
	}
	conn.WriteJSON(map[string]interface{}{
		"type": msgType,
		"data": data,
	})
}

func sendError(conn *websocket.Conn, message string) {
	sendMessage(conn, MsgError, ErrorMessage{Message: message})
}

func SetupServer() {
	log.Println("Initializing database...")
	if err := InitDatabase(); err != nil {
		log.Printf("Warning: Failed to initialize database: %v", err)
	}

	lobbies = make(map[uuid.UUID]*GameLobby)
	repo = NewQuestionRepository()
	log.Println("Loading lobbies from database...")

	if db != nil {
		if err := LoadLobbiesFromDB(); err != nil {
			log.Printf("Warning: Failed to load lobbies from database: %v", err)
		} else {
			for id, lobby := range lobbies {
				lobbies[id] = lobby
				log.Printf("Restored lobby %s with %d players", id.String(), len(lobby.Players))
			}
		}
	}

	demoLobbyId := uuid.MustParse("00000000-0000-0000-0000-000000000001")
	demoLobby := &GameLobby{
		Id:      demoLobbyId,
		Players: make(map[int]*GamePlayer),
	}
	lobbies[demoLobbyId] = demoLobby

	if db != nil {
		SaveLobby(demoLobby)
		log.Printf("Saved demo lobby to database")
	}

	log.Println("Demo lobby ID: 00000000-0000-0000-0000-000000000001")

	http.HandleFunc("/ws", handleWebsocket)
	log.Println("WebSocket handler registered")

	log.Println("Game server ready on ws://localhost:8000/ws")
}

// Database functions
func InitDatabase() error {
	var err error
	db, err = sql.Open("sqlite3", "./game_state.db")
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	// Create tables
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS lobbies (
			id TEXT PRIMARY KEY,
			created_at INTEGER,
			lobby_data TEXT
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create tables: %w", err)
	}

	log.Println("Database initialized successfully")
	return nil
}

func SaveLobby(lobby *GameLobby) error {
	if db == nil {
		return nil
	}

	dbMutex.Lock()
	defer dbMutex.Unlock()

	lobbyJSON, err := json.Marshal(lobby)
	if err != nil {
		log.Printf("Failed to marshal lobby for database: %v", err)
		return err
	}

	now := time.Now().Unix()
	_, err = db.Exec(
		"INSERT OR REPLACE INTO lobbies (id, created_at, lobby_data) VALUES (?, ?, ?)",
		lobby.Id.String(), now, string(lobbyJSON),
	)
	if err != nil {
		log.Printf("Failed to save lobby to database: %v", err)
		return err
	}

	log.Printf("Saved lobby %s to database", lobby.Id.String())
	return nil
}

func LoadLobbiesFromDB() error {
	if db == nil {
		return nil
	}

	rows, err := db.Query("SELECT id, created_at, lobby_data FROM lobbies ORDER BY created_at DESC")
	if err != nil {
		log.Printf("Failed to load lobbies from database: %v", err)
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var id string
		var createdAt int64
		var lobbyData string

		if err := rows.Scan(&id, &createdAt, &lobbyData); err != nil {
			log.Printf("Failed to scan lobby row: %v", err)
			continue
		}

		var lobby GameLobby
		if err := json.Unmarshal([]byte(lobbyData), &lobby); err != nil {
			log.Printf("Failed to unmarshal lobby data for %s: %v", id, err)
			continue
		}

		lobbies[lobby.Id] = &lobby
		log.Printf("Loaded lobby %s from database", lobby.Id.String())
	}

	if err := rows.Err(); err != nil {
		log.Printf("Error iterating lobby rows: %v", err)
	}

	return nil
}
