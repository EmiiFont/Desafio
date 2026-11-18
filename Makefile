.PHONY: client server build test lint fmt serve clean run-client run-server

# Build commands
build:
	go build -o bin/cmd cmd/main.go

build-client:
	go build -o bin/client client/main.go

# Run server (with static file serving)
server: build
	@echo "Starting game server on ws://localhost:8000/ws and http://localhost:8000"
	@go run cmd/main.go

# Run client (Go test client)
client: build-client
	@./bin/client

# Serve frontend with live reload (requires air and live-server)
serve:
	@echo "Install tools first: go install github.com/cosmtrek/air@latest && npm install -g live-server"
	@echo "Run frontend at http://localhost:3000"
	@live-server client/ --port=3000 --host=0.0.0.0 &

# Run with hot reload (Go only)
dev:
	@air

# Test commands
test:
	go test ./...

test-single:
	go test -v -run $(TEST) ./...

test-race:
	go test -race ./...

coverage:
	go test -coverprofile=coverage.out ./...
	go tool cover -func=coverage.out

# Lint and format
lint:
	golint ./...

fmt:
	gofmt -w server/ client/ cmd/

vet:
	go vet ./...

check: build test vet

# Clean
clean:
	rm -rf bin/
	rm -f coverage.out