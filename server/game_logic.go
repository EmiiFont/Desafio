package server

import (
	"database/sql"

	_ "github.com/lib/pq"
)

type Category struct {
	Id   string `json:"id"`
	Name string `json:"name"`
}

type Question struct {
	Id          string `json:"id"`
	Description string `json:"description"`
	Answer      int    `json:"answer"`
	//Options     []int    `json:"options"`
	Category Category `json:"category"`
}

type QuestionOption struct {
	Id         string `json:"id"`
	QuestionId string `json:"questionId"`
	Option     string `json:"option"`
	IsAnswer   bool   `json:"isAnswer"`
}

type Answer struct {
	Id           string `json:"id"`
	UserId       string `json:"userId"`
	QuestionId   string `json:"questionId"`
	TimeToAnswer int    `json:"timeToAnswer"`
	WasCorrect   bool   `json:"wasCorrect"`
}

type Player struct {
	Id       string `json:"id"`
	Name     string `json:"name"`
	Position []int  `json:"position"`
}

type Game struct {
	Id      string   `json:"id"`
	Players []Player `json:"players"`
	Date    string   `json:"date"`
}

const (
	//question types
	MultipleChoice = "multipleChoice"
	TrueFalse      = "trueFalse"
	Image          = "image"
)

type QuestionRepository struct {
	db *sql.DB
}

func NewQuestionRepository(db *sql.DB) *QuestionRepository {
	return &QuestionRepository{
		db: db,
	}
}

func (q *QuestionRepository) GetQuestion() error {
	// var description string
	// rows, err := db.Query("SELECT description FROM questions")
	// defer rows.Close()
	// if err != nil {
	// 	log.Fatalln(err)
	// 	log.Println("An error occured")
	// }
	// for rows.Next() {
	// 	rows.Scan(&description)
	// 	log.Printf("Row number %s", description)
	// }
	return nil
}

func AnswerQuestion(questionId int, answer int) bool {
	//get question from database
	//compare answer
	//return result
	questionExample := Question{Answer: 1, Id: "1", Description: "What's your name"}

	if questionExample.Answer == answer {
		return true
	} else {
		return false
	}
}
