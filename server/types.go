package server

import (
	"math/rand"

	"github.com/google/uuid"
)

type GamePlayer struct {
	Id       int    `json:"id"`
	Name     string `json:"name"`
	Color    string `json:"color"`
	Position []int  `json:"position"`
	Km       int    `json:"km"`
	IsBot    bool   `json:"isBot"`
	BotLevel int    `json:"botLevel"`
}

type GameLobby struct {
	Id        uuid.UUID           `json:"id"`
	Players   map[int]*GamePlayer `json:"players"`
	GameState *GameState          `json:"gameState"`
	TestMode  bool                `json:"testMode"`
	BotSpeed  int                 `json:"botSpeed"`
}

type GameState struct {
	Board            [][]int     `json:"board"`
	PlayerOrder      []int       `json:"playerOrder"`
	CurrentTurnIdx   int         `json:"currentTurnIdx"`
	CurrentPlayerId  int         `json:"currentPlayerId"`
	CurrentQuestion  *Question   `json:"currentQuestion"`
	WaitingForRoll   bool        `json:"waitingForRoll"`
	WaitingForAnswer bool        `json:"waitingForAnswer"`
	GameOver         bool        `json:"gameOver"`
	Winner           *GamePlayer `json:"winner"`
}

type Category struct {
	Id    int    `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color"`
	Emoji string `json:"emoji"`
}

type Question struct {
	Id          string   `json:"id"`
	Description string   `json:"description"`
	Answer      int      `json:"answer"`
	Options     []string `json:"options"`
	CategoryId  int      `json:"categoryId"`
}

const (
	CategoryMexico = iota + 1
	CategoryWorldHistory
	CategoryWorldGeography
	CategoryArtsSports
	CategoryScienceTech
	CategoryGeneralCulture
)

var Categories = []Category{
	{Id: CategoryMexico, Name: "Mexico", Color: "#FF6B6B", Emoji: "🇲🇽"},
	{Id: CategoryWorldHistory, Name: "World History", Color: "#4ECDC4", Emoji: "📜"},
	{Id: CategoryWorldGeography, Name: "World Geography", Color: "#95E1D3", Emoji: "🌍"},
	{Id: CategoryArtsSports, Name: "Arts, Sports & Entertainment", Color: "#DDA0DD", Emoji: "🎭"},
	{Id: CategoryScienceTech, Name: "Science & Technology", Color: "#FFE66D", Emoji: "🔬"},
	{Id: CategoryGeneralCulture, Name: "General Culture", Color: "#F7D794", Emoji: "🎯"},
}

const (
	MsgCreateLobby    = "createLobby"
	MsgJoinLobby      = "joinLobby"
	MsgLobbyState     = "lobbyState"
	MsgGameStart      = "gameStart"
	MsgRollDice       = "rollDice"
	MsgDiceResult     = "diceResult"
	MsgQuestion       = "question"
	MsgSubmitAnswer   = "submitAnswer"
	MsgAnswerResult   = "answerResult"
	MsgTurnChange     = "turnChange"
	MsgGameOver       = "gameOver"
	MsgError          = "error"
	MsgEnableTestMode = "enableTestMode"
	MsgBotAction      = "botAction"
)

const (
	BotSpeedSlow    = 3000
	BotSpeedNormal  = 1500
	BotSpeedFast    = 500
	BotSpeedInstant = 100
)

type CreateLobbyMessage struct {
	PlayerName string `json:"playerName"`
}

type JoinLobbyMessage struct {
	LobbyId    string `json:"lobbyId"`
	PlayerName string `json:"playerName"`
}

type LobbyStateMessage struct {
	LobbyId string        `json:"lobbyId"`
	Players []*GamePlayer `json:"players"`
	Ready   bool          `json:"ready"`
	Message string        `json:"message"`
}

type GameStartMessage struct {
	Board           [][]int       `json:"board"`
	Players         []*GamePlayer `json:"players"`
	PlayerOrder     []int         `json:"playerOrder"`
	CurrentPlayerId int           `json:"currentPlayerId"`
	WaitingForRoll  bool          `json:"waitingForRoll"`
}

type RollDiceMessage struct {
	PlayerId int `json:"playerId"`
}

type DiceResultMessage struct {
	PlayerId   int      `json:"playerId"`
	CategoryId int      `json:"categoryId"`
	Category   Category `json:"category"`
}

type QuestionMessage struct {
	Question  Question `json:"question"`
	TimeLimit int      `json:"timeLimit"`
}

type SubmitAnswerMessage struct {
	PlayerId   int    `json:"playerId"`
	Answer     int    `json:"answer"`
	AnswerType string `json:"answerType"`
}

type AnswerResultMessage struct {
	PlayerId    int         `json:"playerId"`
	Correct     bool        `json:"correct"`
	KmChange    int         `json:"kmChange"`
	NewKm       int         `json:"newKm"`
	NewPosition []int       `json:"newPosition"`
	NextPlayer  *GamePlayer `json:"nextPlayer"`
	Message     string      `json:"message"`
}

type TurnChangeMessage struct {
	NextPlayer *GamePlayer `json:"nextPlayer"`
	Message    string      `json:"message"`
}

type GameOverMessage struct {
	Winner  *GamePlayer `json:"winner"`
	Message string      `json:"message"`
}

type ErrorMessage struct {
	Message string `json:"message"`
}

type EnableTestModeMessage struct {
	Enabled  bool `json:"enabled"`
	BotSpeed int  `json:"botSpeed"`
}

type BotActionMessage struct {
	PlayerId int    `json:"playerId"`
	Action   string `json:"action"`
	Delay    int    `json:"delay"`
}

type QuestionRepository struct {
	Questions map[int][]Question
}

func NewQuestionRepository() *QuestionRepository {
	return &QuestionRepository{
		Questions: SampleQuestions(),
	}
}

func (q *QuestionRepository) GetQuestion(categoryId int) *Question {
	questions := q.Questions[categoryId]
	if len(questions) == 0 {
		return nil
	}
	randIndex := rand.Intn(len(questions))
	return &questions[randIndex]
}

var PlayerColors = []string{"#FF6B6B", "#4ECDC4", "#95E1D3", "#DDA0DD"}
