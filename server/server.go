package server

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type Client struct {
	conn     *websocket.Conn
	PlayerId int
	Lobby    *Lobby
}

type Lobby struct {
	Id      uuid.UUID       `json:"id"`
	Clients map[int]*Client `json:"clients"`
}

type Message struct {
	Type string `json:"type"`
	Data string `json:"data"`
}

type PlayerJoin struct {
	PlayerId int `json:"playerId"`
}

type PlayerMove struct {
	PlayerId int   `json:"playerId"`
	Position []int `json:"position"`
	Steps    int   `json:"steps"`
}

type GameStart struct {
	Board            [][]int   `json:"board"`
	LobbyId          uuid.UUID `json:"lobbyId"`
	PlayerTurn       int       `json:"playerTurn"`
	WaitingForPlayer bool      `json:"waitingForPlayer"`
	PlayerId         int       `json:"playerId"`
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
	//message types
	JoinLobbyMessage = "joinLobby"
	MoveMessage      = "move"
	StartGameMessage = "startGame"
	boardSize        = 5
)

var (
	upgrade = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin:     func(r *http.Request) bool { return true },
	}
	lobbyMutex sync.Mutex
)

func createLobby(lobbies map[uuid.UUID]*Lobby) *Lobby {
	lobbyMutex.Lock()
	defer lobbyMutex.Unlock()

	lobbyID := uuid.New()

	lobby := &Lobby{
		Id:      lobbyID,
		Clients: make(map[int]*Client),
	}

	lobbies[lobbyID] = lobby
	return lobby
}

func handleWebsocket(lobbies map[uuid.UUID]*Lobby, lobbyId string, repositories *Repositories, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrade.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}
	defer conn.Close()

	var lobby *Lobby
	if lobbyId == "" {
		lobby = createLobby(lobbies)
	} else {
		lobby = lobbies[uuid.MustParse(lobbyId)]
		if lobby == nil {
			fmt.Println("Lobby not found")
			return
		}
	}

	// send the client their player id
	// new client connected send them the current game state
	playerId := rand.Intn(10)
	client := &Client{
		conn:     conn,
		PlayerId: playerId,
	}
	lobby.Clients[playerId] = client

	if err != nil {
		log.Printf("Failed to write message to client: %v", err)
		return
	}
	// Create a channel to track the closing of the connection
	// this is to make sure the connection stays open until we want to close it
	// using gorutines and channels to handle multiple clients
	//closeChan := make(chan bool)

	lobby.handleClient(client, repositories)
	//<-closeChan

	// Clean up client and close the connection
	//delete(lobby.Clients, client.PlayerId)
	//conn.Close()
}

func (lobby *Lobby) handleClient(client *Client, repositories *Repositories) {
	defer func() {
		//close(closeChan)
		client.conn.Close()
		delete(lobby.Clients, client.PlayerId)
	}()

	for {
		som, b, err := client.conn.ReadMessage()
		var msg Message
		if err != nil {
			log.Printf("Failed to read message from client: %v", err)
			break
		}
		log.Print(som)
		err = json.Unmarshal(b, &msg)
		if err != nil {
			log.Printf("Failed to unmarshal message from client: %v", err)
		}
		log.Printf("Received message from client: %s", msg.Type)
		lobby.broadcast(msg, repositories)
	}
}

type Repositories struct {
	QuestionRepository *QuestionRepository
}

func initRepositories(db *sql.DB) *Repositories {
	return &Repositories{
		QuestionRepository: NewQuestionRepository(db),
	}
}

func initDbConnection() *sql.DB {
	connStr := os.Getenv("SUPABASE_CONN")
	// Connect to database
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
	db.Ping()
	defer db.Close()

	return db
}

func SetupServer() {
	lobbies := make(map[uuid.UUID]*Lobby)
	db := initDbConnection()
	repositories := initRepositories(db)

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		lobbyId := r.URL.Query().Get("lobbyId")
		// if lobbyId == "" {
		// 	log.Printf("No lobby id provided")
		// 	return
		// }
		handleWebsocket(lobbies, lobbyId, repositories, w, r)
	})
}

func handlePlayerJoined(playerJoin *PlayerJoin, clients map[int]*Client, lobbyId uuid.UUID) {
	var boardState Message
	var gameStart GameStart

	//make an 2d int array
	boardArray := make([][]int, boardSize)

	for i := 0; i < 5; i++ {
		boardArray[i] = make([]int, boardSize)
	}

	for row := 0; row < len(boardArray); row++ {
		for col := 0; col < len(boardArray[0]); col++ {
			questionType := rand.Intn(3) + 1
			boardArray[row][col] = questionType
		}
	}

	gameStart = GameStart{Board: boardArray,
		PlayerTurn: 1, WaitingForPlayer: false, LobbyId: lobbyId, PlayerId: playerJoin.PlayerId}
	if len(clients) == 1 {
		gameStart.WaitingForPlayer = true
	}

	gameStartJson, err := json.Marshal(gameStart)

	if err != nil {
		log.Printf("Failed to marshal game start: %v", err)
	}
	boardState = Message{
		Type: "loadBoard",
		Data: string(gameStartJson),
	}

	for currentClient := range clients {
		err := clients[currentClient].conn.WriteJSON(boardState)
		if err != nil {
			log.Printf("Failed to write message to client: %v", err)
		}
	}

}

func handlePlayerMove(playerMove *PlayerMove, lobby *Lobby) {
	var boardState Message

	newPosition := calculatePlayerPositionInBoard(playerMove)
	playerMove.Position = newPosition
	bodyJson, err := json.Marshal(playerMove)

	if err != nil {
		log.Printf("Failed to marshal game start: %v", err)
	}
	boardState = Message{
		Type: "playerMove",
		Data: string(bodyJson),
	}
	for currentClient := range lobby.Clients {
		err := lobby.Clients[currentClient].conn.WriteJSON(boardState)
		if err != nil {
			log.Printf("Failed to write message to client: %v", err)
		}
	}
}

// send message to all clients in the pool and gameId
func (lobby *Lobby) broadcast(message Message, repositories *Repositories) error {
	switch message.Type {
	case JoinLobbyMessage:
		var playerJoin PlayerJoin
		err := json.Unmarshal([]byte(message.Data), &playerJoin)
		if err != nil {
			log.Printf("Failed to unmarshal message from client: %v", err)
		}
		handlePlayerJoined(&playerJoin, lobby.Clients, lobby.Id)

	case MoveMessage:
		//return board state to player and player turn.
		var playerMove PlayerMove
		err := json.Unmarshal([]byte(message.Data), &playerMove)
		if err != nil {
			log.Printf("Failed to unmarshal message from client: %v", err)
		}
		handlePlayerMove(&playerMove, lobby)
	}
	// if message.Type == "playerMove" {
	// 	//return board state to player and player turn.
	// 	//retrieve question from database and show to player
	// 	//fmt.Println(message.Body)
	// 	fmt.Println("Message type is player question")
	// 	question := Message{
	// 		Type: "playerMove",
	// 		Data: "Player",
	// 	} //repositories.QuestionRepository.GetQuestion()
	// 	for currentClient := range clients {
	// 		if clients[currentClient].PlayerId == message.PlayerId {
	// 			err := clients[currentClient].conn.WriteJSON(question)
	// 			if err != nil {
	// 				log.Printf("Failed to write message to client: %v", err)
	// 			}
	// 		}
	// 	}
	// }

	// //if message type is player answer
	// if message.Type == "playerAnswer" {
	// 	fmt.Println("Message type is player answer")
	// 	//get question from database and check if answer is correct
	// 	//if answer is correct, verify game end condition and send message to player
	// 	//if answer is incorrect, send message to player change turn
	// 	//if game end condition is met, send message to player
	// 	for currentClient := range clients {
	// 		if clients[currentClient].PlayerId == message.PlayerId {
	// 			err := clients[currentClient].conn.WriteJSON(message)
	// 			if err != nil {
	// 				log.Printf("Failed to write message to client: %v", err)
	// 			}
	// 		}
	// 	}
	// }

	// for currentClient := range clients {
	// 	err := clients[currentClient].conn.WriteJSON(message)
	// 	if err != nil {
	// 		log.Printf("Failed to write message to client: %v", err)
	// 	}
	// }
	return nil
}

// move player in a spiral pattern in the board based on the number of steps
func calculatePlayerPositionInBoard(playerMove *PlayerMove) []int {
	steps := playerMove.Steps
	playerPosition := playerMove.Position

	colLimit := boardSize - 1
	rowLimit := boardSize - 1
	// starting positions
	left := playerPosition[1]
	up := playerPosition[0]

	for steps > 0 {
		for i := left; i <= colLimit && steps >= 0; i++ {
			playerPosition[1] = i
			steps--
		}
		for i := up + 1; i <= rowLimit && steps >= 0; i++ {
			playerPosition[0] = i
			steps--
		}

		if up != rowLimit {
			for i := colLimit - 1; i >= left && steps >= 0; i-- {
				playerPosition[1] = i
				steps--
			}
		}

		if left != colLimit {
			for i := rowLimit - 1; i > up && steps >= 0; i-- {
				playerPosition[0] = i
				steps--
			}
		}
		left++
		colLimit--
		up++
		rowLimit--
	}
	return playerPosition
}
