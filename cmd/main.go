package main

import (
	"log"
	"net/http"

	"desafio/server"

	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: Error loading .env file:", err)
	}

	// Initialize database
	if err := server.InitDatabase(); err != nil {
		log.Printf("Error initializing database: %v", err)
	}

	server.SetupServer()

	// Serve SolidJS frontend from dist directory
	fs := http.FileServer(http.Dir("./dist"))
	http.Handle("/", fs)

	log.Println("Starting game server on http://localhost:8000")
	log.Println("WebSocket endpoint: ws://localhost:8000/ws")
	log.Println("Frontend (SolidJS): http://localhost:8000")

	err = http.ListenAndServe(":8000", nil)
	if err != nil {
		log.Fatal("Error starting server:", err)
	}
}
