package server

import (
	"log"
	"math/rand"
	"time"
)

func SampleQuestions() map[int][]Question {
	return map[int][]Question{
		CategoryMexico: {
			{Id: "m1", Description: "What is the capital of Mexico?", Answer: 1, Options: []string{"Guadalajara", "Mexico City", "Monterrey"}, CategoryId: CategoryMexico},
			{Id: "m2", Description: "What is the most populated city in Mexico?", Answer: 0, Options: []string{"Mexico City", "Guadalajara", "Monterrey"}, CategoryId: CategoryMexico},
			{Id: "m3", Description: "In what year did Mexico gain its independence?", Answer: 1, Options: []string{"1810", "1821", "1848"}, CategoryId: CategoryMexico},
			{Id: "m4", Description: "What is the longest river in Mexico?", Answer: 2, Options: []string{"Lerma", "Usumacinta", "Rio Grande"}, CategoryId: CategoryMexico},
			{Id: "m5", Description: "What Mexican dish was UNESCO recognized as Intangible Heritage?", Answer: 0, Options: []string{"Mexican cuisine", "Tequila", "Mariachi"}, CategoryId: CategoryMexico},
			{Id: "m6", Description: "What is the name of Mexico's largest pyramid?", Answer: 1, Options: []string{"El Castillo", "Chichén Itzá", "Teotihuacán"}, CategoryId: CategoryMexico},
		},
		CategoryWorldHistory: {
			{Id: "h1", Description: "In what year did World War II end?", Answer: 2, Options: []string{"1943", "1944", "1945"}, CategoryId: CategoryWorldHistory},
			{Id: "h2", Description: "Who was the first emperor of Rome?", Answer: 0, Options: []string{"Augustus", "Julius Caesar", "Nero"}, CategoryId: CategoryWorldHistory},
			{Id: "h3", Description: "What year was the Declaration of Independence signed?", Answer: 1, Options: []string{"1775", "1776", "1777"}, CategoryId: CategoryWorldHistory},
			{Id: "h4", Description: "Who discovered America in 1492?", Answer: 1, Options: []string{"Amerigo Vespucci", "Christopher Columbus", "Ferdinand Magellan"}, CategoryId: CategoryWorldHistory},
			{Id: "h5", Description: "What empire built the Colosseum?", Answer: 2, Options: []string{"Greek", "Persian", "Roman"}, CategoryId: CategoryWorldHistory},
			{Id: "h6", Description: "In what year did the Berlin Wall fall?", Answer: 0, Options: []string{"1989", "1990", "1991"}, CategoryId: CategoryWorldHistory},
		},
		CategoryWorldGeography: {
			{Id: "g1", Description: "What is the largest ocean on Earth?", Answer: 1, Options: []string{"Atlantic", "Pacific", "Indian"}, CategoryId: CategoryWorldGeography},
			{Id: "g2", Description: "What is the longest river in the world?", Answer: 2, Options: []string{"Amazon", "Yangtze", "Nile"}, CategoryId: CategoryWorldGeography},
			{Id: "g3", Description: "What is the smallest country in the world?", Answer: 0, Options: []string{"Vatican City", "Monaco", "San Marino"}, CategoryId: CategoryWorldGeography},
			{Id: "g4", Description: "What is the highest mountain in the world?", Answer: 1, Options: []string{"K2", "Mount Everest", "Kangchenjunga"}, CategoryId: CategoryWorldGeography},
			{Id: "g5", Description: "What is the largest continent?", Answer: 0, Options: []string{"Asia", "Africa", "North America"}, CategoryId: CategoryWorldGeography},
			{Id: "g6", Description: "What country has the most people?", Answer: 1, Options: []string{"India", "China", "USA"}, CategoryId: CategoryWorldGeography},
		},
		CategoryArtsSports: {
			{Id: "a1", Description: "Who painted the Mona Lisa?", Answer: 0, Options: []string{"Leonardo da Vinci", "Michelangelo", "Raphael"}, CategoryId: CategoryArtsSports},
			{Id: "a2", Description: "In soccer, how many players are on each team?", Answer: 1, Options: []string{"9", "11", "10"}, CategoryId: CategoryArtsSports},
			{Id: "a3", Description: "Which country won the 2018 FIFA World Cup?", Answer: 2, Options: []string{"Germany", "Argentina", "France"}, CategoryId: CategoryArtsSports},
			{Id: "a4", Description: "Who wrote 'Romeo and Juliet'?", Answer: 0, Options: []string{"William Shakespeare", "Charles Dickens", "Jane Austen"}, CategoryId: CategoryArtsSports},
			{Id: "a5", Description: "What sport uses a shuttlecock?", Answer: 1, Options: []string{"Tennis", "Badminton", "Squash"}, CategoryId: CategoryArtsSports},
			{Id: "a6", Description: "How many Grand Slam tennis tournaments are there per year?", Answer: 2, Options: []string{"3", "4", "5"}, CategoryId: CategoryArtsSports},
		},
		CategoryScienceTech: {
			{Id: "s1", Description: "What is the chemical symbol for gold?", Answer: 1, Options: []string{"Go", "Au", "Ag"}, CategoryId: CategoryScienceTech},
			{Id: "s2", Description: "What planet is known as the Red Planet?", Answer: 0, Options: []string{"Mars", "Venus", "Jupiter"}, CategoryId: CategoryScienceTech},
			{Id: "s3", Description: "What is the largest organ in the human body?", Answer: 1, Options: []string{"Heart", "Skin", "Liver"}, CategoryId: CategoryScienceTech},
			{Id: "s4", Description: "How many bones are in the adult human body?", Answer: 0, Options: []string{"206", "208", "210"}, CategoryId: CategoryScienceTech},
			{Id: "s5", Description: "What gas do plants absorb from the atmosphere?", Answer: 0, Options: []string{"Carbon dioxide", "Oxygen", "Nitrogen"}, CategoryId: CategoryScienceTech},
			{Id: "s6", Description: "What is the speed of light in vacuum (approx)?", Answer: 1, Options: []string{"200,000 km/s", "300,000 km/s", "400,000 km/s"}, CategoryId: CategoryScienceTech},
		},
		CategoryGeneralCulture: {
			{Id: "c1", Description: "How many days are in a leap year?", Answer: 1, Options: []string{"365", "366", "364"}, CategoryId: CategoryGeneralCulture},
			{Id: "c2", Description: "What is the largest mammal in the world?", Answer: 0, Options: []string{"Blue whale", "Elephant", "Giraffe"}, CategoryId: CategoryGeneralCulture},
			{Id: "c3", Description: "In what year did the first iPhone launch?", Answer: 2, Options: []string{"2005", "2006", "2007"}, CategoryId: CategoryGeneralCulture},
			{Id: "c4", Description: "What is the national animal of Australia?", Answer: 1, Options: []string{"Koala", "Kangaroo", "Platypus"}, CategoryId: CategoryGeneralCulture},
			{Id: "c5", Description: "How many continents are there on Earth?", Answer: 0, Options: []string{"7", "6", "5"}, CategoryId: CategoryGeneralCulture},
			{Id: "c6", Description: "What is the hardest natural substance on Earth?", Answer: 2, Options: []string{"Gold", "Iron", "Diamond"}, CategoryId: CategoryGeneralCulture},
		},
	}
}

var BotNames = []string{"Bot-Alpha", "Bot-Beta", "Bot-Gamma", "Bot-Delta"}

func (lobby *GameLobby) AddBotPlayer(botLevel int) *GamePlayer {
	botId := rand.Intn(100000)
	botName := BotNames[len(lobby.Players)%len(BotNames)]

	player := &GamePlayer{
		Id:       botId,
		Name:     botName,
		Color:    PlayerColors[len(lobby.Players)%len(PlayerColors)],
		Position: []int{0, 0},
		Km:       0,
		IsBot:    true,
		BotLevel: botLevel,
	}

	lobby.Players[botId] = player
	return player
}

func (lobby *GameLobby) GetBotDecision(player *GamePlayer, question *Question) (int, string) {
	correctChance := 0.0

	switch player.BotLevel {
	case 1:
		correctChance = 0.3 // Easy bot - 30% correct
	case 2:
		correctChance = 0.6 // Medium bot - 60% correct
	case 3:
		correctChance = 0.9 // Hard bot - 90% correct
	default:
		correctChance = 0.5
	}

	if rand.Float64() < correctChance {
		return question.Answer, "direct"
	}

	wrongAnswers := []int{0, 1, 2}
	for i := len(wrongAnswers) - 1; i > 0; i-- {
		j := rand.Intn(i + 1)
		wrongAnswers[i], wrongAnswers[j] = wrongAnswers[j], wrongAnswers[i]
	}

	for _, wrong := range wrongAnswers {
		if wrong != question.Answer {
			return wrong, "direct"
		}
	}

	return 0, "direct"
}

func (lobby *GameLobby) ScheduleBotTurn(playerId int, delay int) {
	go func() {
		time.Sleep(time.Duration(delay) * time.Millisecond)

		lobbyMutex.Lock()
		if lobby.GameState == nil || lobby.GameState.GameOver {
			lobbyMutex.Unlock()
			return
		}

		if lobby.GameState.CurrentPlayerId != playerId {
			lobbyMutex.Unlock()
			return
		}

		player := lobby.Players[playerId]
		if player == nil || !player.IsBot {
			lobbyMutex.Unlock()
			return
		}

		if lobby.GameState.WaitingForRoll {
			lobbyMutex.Unlock()
			lobby.handleBotRollDice(playerId)
		} else if lobby.GameState.WaitingForAnswer && lobby.GameState.CurrentQuestion != nil {
			answer, answerType := lobby.GetBotDecision(player, lobby.GameState.CurrentQuestion)
			lobbyMutex.Unlock()
			lobby.handleBotSubmitAnswer(playerId, answer, answerType)
		} else {
			lobbyMutex.Unlock()
		}
	}()
}

func (lobby *GameLobby) handleBotRollDice(playerId int) {
	handleRollDice(lobby, playerId)
}

func (lobby *GameLobby) handleBotSubmitAnswer(playerId int, answer int, answerType string) {
	data := SubmitAnswerMessage{
		PlayerId:   playerId,
		Answer:     answer,
		AnswerType: answerType,
	}
	handleSubmitAnswer(lobby, data)
}

func (lobby *GameLobby) RollDice(playerId int) *DiceResultMessage {
	categoryId := rand.Intn(6) + 1
	category := Categories[categoryId-1]
	return &DiceResultMessage{
		PlayerId:   playerId,
		CategoryId: categoryId,
		Category:   category,
	}
}

func (lobby *GameLobby) GetQuestion(categoryId int, repo *QuestionRepository) *QuestionMessage {
	question := repo.GetQuestion(categoryId)
	if question == nil {
		question = &Question{
			Id:          "default",
			Description: "Sample question",
			Answer:      0,
			Options:     []string{"A", "B", "C"},
			CategoryId:  categoryId,
		}
	}
	return &QuestionMessage{
		Question:  *question,
		TimeLimit: 20,
	}
}

func ValidateAnswer(question *Question, answer int) bool {
	return question.Answer == answer
}

func CalculateKmChange(answerType string, correct bool) int {
	if !correct {
		return 0
	}
	if answerType == "direct" {
		return 2
	}
	return 1
}

func (lobby *GameLobby) GetNextPlayer() *GamePlayer {
	if lobby.GameState == nil {
		return nil
	}
	lobby.GameState.CurrentTurnIdx++
	if lobby.GameState.CurrentTurnIdx >= len(lobby.GameState.PlayerOrder) {
		lobby.GameState.CurrentTurnIdx = 0
	}
	lobby.GameState.CurrentPlayerId = lobby.GameState.PlayerOrder[lobby.GameState.CurrentTurnIdx]
	return lobby.Players[lobby.GameState.CurrentPlayerId]
}

func CheckWinCondition(player *GamePlayer) bool {
	return player.Km >= 42
}

func GenerateSpiralBoard(size int) [][]int {
	board := make([][]int, size)
	for i := 0; i < size; i++ {
		board[i] = make([]int, size)
	}

	left, right := 0, size-1
	top, bottom := 0, size-1
	category := 1

	for left <= right && top <= bottom {
		for i := left; i <= right; i++ {
			board[top][i] = category
			category++
			if category > 6 {
				category = 1
			}
		}
		top++

		for i := top; i <= bottom; i++ {
			board[i][right] = category
			category++
			if category > 6 {
				category = 1
			}
		}
		right--

		if top <= bottom {
			for i := right; i >= left; i-- {
				board[bottom][i] = category
				category++
				if category > 6 {
					category = 1
				}
			}
			bottom--
		}

		if left <= right {
			for i := bottom; i >= top; i-- {
				board[i][left] = category
				category++
				if category > 6 {
					category = 1
				}
			}
			left++
		}
	}

	log.Printf("Generated board with categories cycling 1-6")
	return board
}
