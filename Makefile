client:
	@go build -o bin/client client/main.go
	@./bin/client

server:
	@go build -o bin/cmd cmd/main.go
	@./bin/cmd