package main

import (
	"desafio/server"
	"io"
	"log"
	"net/http"
)

func main() {

	//configure env variables
	server.SetupServer()

	// Hello world, the web server
	helloHandler := func(w http.ResponseWriter, req *http.Request) {
		io.WriteString(w, "Hello, world!\n")
	}

	// getQuestionHandler := func(w http.ResponseWriter, req *http.Request) {
	// 	opt := []int{1, 2}
	// 	questionNas := Question{Answer: "Emilio", Id: "1", Ask: "What's your name", Options: opt}
	// 	marshalled, _ := json.Marshal(questionNas)
	// 	fmt.Println(string(marshalled))
	// 	io.WriteString(w, string(marshalled))
	// }
	http.HandleFunc("/hello", helloHandler)
	//http.HandleFunc("/getQuestion", getQuestionHandler)
	//log.Println("Listing for requests at http://localhost:8000/hello")
	log.Println("Starting game server... on port 8000")
	err := http.ListenAndServe(":8000", nil)
	if err != nil {
		log.Fatal("Error starting server:", err)
	}
}
