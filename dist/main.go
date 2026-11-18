package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type GameClient struct {
	conn     *websocket.Conn
	PlayerId int
	GameId   uuid.UUID
}

type PlayerState struct {
	Position []int
}

type PlayerAnswer struct {
	QuestionId string `json:"questionId"`
	Answer     int    `json:"answer"`
}

type PlayerMove struct {
	PlayerId int
	Position []int
	Steps    int
}

type GameStart struct {
	Board            [][]int `json:"board"`
	PlayerTurn       int     `json:"playerTurn"`
	WaitingForPlayer bool    `json:"waitingForPlayer"`
}

type Message struct {
	Type   string    `json:"type"`
	Data   []byte    `json:"data"`
	GameId uuid.UUID `json:"gameId"`
}

func NewGameClient(conn *websocket.Conn, playerId int, gameId uuid.UUID) *GameClient {
	return &GameClient{
		conn:     conn,
		PlayerId: playerId,
		GameId:   uuid.New(),
	}
}

func main() {
	fmt.Println("Client starting...")

	dialer := websocket.Dialer{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}

	conn, _, err := dialer.Dial("ws://localhost:8000/ws", nil)
	if err != nil {
		panic(err)
	}

	defer conn.Close()
	gameId := uuid.New()

	go func() {
		var msg Message
		var gameStart GameStart
		for {
			if err := conn.ReadJSON(&msg); err != nil {
				fmt.Println("WS read error", err)
				break
			}
			fmt.Println("Received message", msg)
			json.Unmarshal(msg.Data, &gameStart)
			fmt.Println("GameStart", gameStart)
			fmt.Printf("receiving message we dont know: %d \n", msg.Type)
		}
	}()

	for {
		// x := rand.Intn(20)
		// y := rand.Intn(20)
		// state := PlayerState{
		// 	Position: []int{x, y},
		// }
		//b, err := json.Marshal(state)
		if err != nil {
			log.Fatal(err)
		}

		c := NewGameClient(conn, 1, gameId)

		firstPlayerJson, err := json.Marshal(c)

		if err != nil {
			panic(err)
		}

		firstPlayer := Message{
			Type: "joinLobby",
			Data: firstPlayerJson,
		}
		fmt.Println("sending message", firstPlayer)
		c.conn.WriteJSON(firstPlayer)

		time.Sleep(time.Second * 15)
		// playerMove := PlayerMove {
		// 	PlayerId: 1,
		// 	Position: []int{x, y},
		// 	Steps: rand.Intn(6),
		// }

		// playerMoveJson, err := json.Marshal(playerMove)
		// if err != nil {
		// 	log.Fatal(err)
		// }

		// msg := Message{
		// 	Type: "playerMove",
		// 	Data: playerMoveJson,
		// }

		time.Sleep(time.Second)

		// playerAnswer := PlayerAnswer{
		// 	QuestionId: "1",
		// 	Answer:     rand.Intn(4),
		// }

		// playerAnswerJson, err := json.Marshal(state)
		// if err != nil {
		// 	log.Fatal(err)
		// }

		// msg := Message{
		// 	Type: "playerAnswer",
		// 	Data: playerAnswerJson,
		// }
		secondPlayer := NewGameClient(conn, 2, gameId)
		seconPlayerJson, err := json.Marshal(secondPlayer)
		if err != nil {
			panic(err)
		}
		msg := Message{
			Type: "joinLobby",
			Data: seconPlayerJson,
		}
		if err := conn.WriteJSON(msg); err != nil {
			log.Fatal(err)
		}
		time.Sleep(time.Second * 10)
	}
}
