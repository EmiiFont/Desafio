package server

import (
	"reflect"
	"testing"
)

func TestCalculateKmChange(t *testing.T) {
	tests := []struct {
		name       string
		answerType string
		correct    bool
		expected   int
	}{
		{"direct correct", "direct", true, 2},
		{"multiple correct", "multiple", true, 1},
		{"direct wrong", "direct", false, 0},
		{"multiple wrong", "multiple", false, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := CalculateKmChange(tt.answerType, tt.correct)
			if got != tt.expected {
				t.Fatalf("got %d, want %d", got, tt.expected)
			}
		})
	}
}

func TestValidateAnswer(t *testing.T) {
	question := &Question{
		Id:          "q1",
		Description: "Test question",
		Answer:      1,
		Options:     []string{"A", "B", "C"},
		CategoryId:  CategoryMexico,
	}

	if !ValidateAnswer(question, 1) {
		t.Fatal("expected answer to be correct")
	}
	if ValidateAnswer(question, 2) {
		t.Fatal("expected answer to be incorrect")
	}
}

func TestGenerateSpiralBoard_SizeAndCategories(t *testing.T) {
	board := GenerateSpiralBoard(5)
	if len(board) != 5 {
		t.Fatalf("expected 5 rows, got %d", len(board))
	}
	for i := range board {
		if len(board[i]) != 5 {
			t.Fatalf("expected 5 cols on row %d, got %d", i, len(board[i]))
		}
	}

	for r := range board {
		for c := range board[r] {
			value := board[r][c]
			if value < 1 || value > 6 {
				t.Fatalf("cell (%d,%d) out of range: %d", r, c, value)
			}
		}
	}
}

func TestCalculateSpiralPosition_StartAndFinish(t *testing.T) {
	start := calculateSpiralPosition(0)
	if !reflect.DeepEqual(start, []int{0, 0}) {
		t.Fatalf("start position got %v, want %v", start, []int{0, 0})
	}

	finish := calculateSpiralPosition(42)
	if !reflect.DeepEqual(finish, []int{2, 2}) {
		t.Fatalf("finish position got %v, want %v", finish, []int{2, 2})
	}

	mid := calculateSpiralPosition(10)
	if mid[0] < 0 || mid[0] >= 5 || mid[1] < 0 || mid[1] >= 5 {
		t.Fatalf("mid position out of bounds: %v", mid)
	}
}

func TestGetNextPlayer_Rotates(t *testing.T) {
	lobby := &GameLobby{
		Players: map[int]*GamePlayer{
			1: {Id: 1, Name: "A"},
			2: {Id: 2, Name: "B"},
			3: {Id: 3, Name: "C"},
		},
		GameState: &GameState{
			PlayerOrder:     []int{1, 2, 3},
			CurrentTurnIdx:  0,
			CurrentPlayerId: 1,
		},
	}

	next := lobby.GetNextPlayer()
	if next == nil || next.Id != 2 {
		t.Fatalf("first next player got %v, want 2", next)
	}

	next = lobby.GetNextPlayer()
	if next == nil || next.Id != 3 {
		t.Fatalf("second next player got %v, want 3", next)
	}

	next = lobby.GetNextPlayer()
	if next == nil || next.Id != 1 {
		t.Fatalf("third next player got %v, want 1", next)
	}
}
