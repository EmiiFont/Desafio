import { 
  GameState, 
  GamePlayer, 
  Question, 
  DiceResultMessage, 
  QuestionMessage, 
  AnswerResultMessage,
  TurnChangeMessage,
  GameOverMessage
} from './types';

export const BOARD_SIZE = 5;

export const CATEGORIES = [
  { id: 1, name: 'Mexico', color: '#FF6B6B', emoji: '🇲🇽' },
  { id: 2, name: 'World History', color: '#4ECDC4', emoji: '📜' },
  { id: 3, name: 'World Geography', color: '#95E1D3', emoji: '🌍' },
  { id: 4, name: 'Arts, Sports & Entertainment', color: '#DDA0DD', emoji: '🎭' },
  { id: 5, name: 'Science & Technology', color: '#FFE66D', emoji: '🔬' },
  { id: 6, name: 'General Culture', color: '#F7D794', emoji: '🎯' }
];

export const MOCK_QUESTIONS: Record<number, Question[]> = {
  1: [
    { id: "m1", description: "What is the capital of Mexico?", answer: 1, options: ["Guadalajara", "Mexico City", "Monterrey"], categoryId: 1 },
    { id: "m2", description: "What is the most populated city in Mexico?", answer: 0, options: ["Mexico City", "Guadalajara", "Monterrey"], categoryId: 1 },
    { id: "m3", description: "In what year did Mexico gain its independence?", answer: 1, options: ["1810", "1821", "1848"], categoryId: 1 },
    { id: "m4", description: "What is the longest river in Mexico?", answer: 2, options: ["Lerma", "Usumacinta", "Rio Grande"], categoryId: 1 },
    { id: "m5", description: "What Mexican dish was UNESCO recognized as Intangible Heritage?", answer: 0, options: ["Mexican cuisine", "Tequila", "Mariachi"], categoryId: 1 },
    { id: "m6", description: "What is the name of Mexico's largest pyramid?", answer: 1, options: ["El Castillo", "Chichén Itzá", "Teotihuacán"], categoryId: 1 },
  ],
  2: [
    { id: "h1", description: "In what year did World War II end?", answer: 2, options: ["1943", "1944", "1945"], categoryId: 2 },
    { id: "h2", description: "Who was the first emperor of Rome?", answer: 0, options: ["Augustus", "Julius Caesar", "Nero"], categoryId: 2 },
    { id: "h3", description: "What year was the Declaration of Independence signed?", answer: 1, options: ["1775", "1776", "1777"], categoryId: 2 },
    { id: "h4", description: "Who discovered America in 1492?", answer: 1, options: ["Amerigo Vespucci", "Christopher Columbus", "Ferdinand Magellan"], categoryId: 2 },
    { id: "h5", description: "What empire built the Colosseum?", answer: 2, options: ["Greek", "Persian", "Roman"], categoryId: 2 },
    { id: "h6", description: "In what year did the Berlin Wall fall?", answer: 0, options: ["1989", "1990", "1991"], categoryId: 2 },
  ],
  3: [
    { id: "g1", description: "What is the largest ocean on Earth?", answer: 1, options: ["Atlantic", "Pacific", "Indian"], categoryId: 3 },
    { id: "g2", description: "What is the longest river in the world?", answer: 2, options: ["Amazon", "Yangtze", "Nile"], categoryId: 3 },
    { id: "g3", description: "What is the smallest country in the world?", answer: 0, options: ["Vatican City", "Monaco", "San Marino"], categoryId: 3 },
    { id: "g4", description: "What is the highest mountain in the world?", answer: 1, options: ["K2", "Mount Everest", "Kangchenjunga"], categoryId: 3 },
    { id: "g5", description: "What is the largest continent?", answer: 0, options: ["Asia", "Africa", "North America"], categoryId: 3 },
    { id: "g6", description: "What country has the most people?", answer: 1, options: ["India", "China", "USA"], categoryId: 3 },
  ],
  4: [
    { id: "a1", description: "Who painted the Mona Lisa?", answer: 0, options: ["Leonardo da Vinci", "Michelangelo", "Raphael"], categoryId: 4 },
    { id: "a2", description: "In soccer, how many players are on each team?", answer: 1, options: ["9", "11", "10"], categoryId: 4 },
    { id: "a3", description: "Which country won the 2018 FIFA World Cup?", answer: 2, options: ["Germany", "Argentina", "France"], categoryId: 4 },
    { id: "a4", description: "Who wrote 'Romeo and Juliet'?", answer: 0, options: ["William Shakespeare", "Charles Dickens", "Jane Austen"], categoryId: 4 },
    { id: "a5", description: "What sport uses a shuttlecock?", answer: 1, options: ["Tennis", "Badminton", "Squash"], categoryId: 4 },
    { id: "a6", description: "How many Grand Slam tennis tournaments are there per year?", answer: 2, options: ["3", "4", "5"], categoryId: 4 },
  ],
  5: [
    { id: "s1", description: "What is the chemical symbol for gold?", answer: 1, options: ["Go", "Au", "Ag"], categoryId: 5 },
    { id: "s2", description: "What planet is known as the Red Planet?", answer: 0, options: ["Mars", "Venus", "Jupiter"], categoryId: 5 },
    { id: "s3", description: "What is the largest organ in the human body?", answer: 1, options: ["Heart", "Skin", "Liver"], categoryId: 5 },
    { id: "s4", description: "How many bones are in the adult human body?", answer: 0, options: ["206", "208", "210"], categoryId: 5 },
    { id: "s5", description: "What gas do plants absorb from the atmosphere?", answer: 0, options: ["Carbon dioxide", "Oxygen", "Nitrogen"], categoryId: 5 },
    { id: "s6", description: "What is the speed of light in vacuum (approx)?", answer: 1, options: ["200,000 km/s", "300,000 km/s", "400,000 km/s"], categoryId: 5 },
  ],
  6: [
    { id: "c1", description: "How many days are in a leap year?", answer: 1, options: ["365", "366", "364"], categoryId: 6 },
    { id: "c2", description: "What is the largest mammal in the world?", answer: 0, options: ["Blue whale", "Elephant", "Giraffe"], categoryId: 6 },
    { id: "c3", description: "In what year did the first iPhone launch?", answer: 2, options: ["2005", "2006", "2007"], categoryId: 6 },
    { id: "c4", description: "What is the national animal of Australia?", answer: 1, options: ["Koala", "Kangaroo", "Platypus"], categoryId: 6 },
    { id: "c5", description: "How many continents are there on Earth?", answer: 0, options: ["7", "6", "5"], categoryId: 6 },
    { id: "c6", description: "What is the hardest natural substance on Earth?", answer: 2, options: ["Gold", "Iron", "Diamond"], categoryId: 6 },
  ]
};

export function generateSpiralBoard(size: number): number[][] {
  const board = Array(size).fill(0).map(() => Array(size).fill(0));
  let left = 0;
  let right = size - 1;
  let top = 0;
  let bottom = size - 1;
  let category = 1;

  while (left <= right && top <= bottom) {
    for (let i = left; i <= right; i++) {
      board[top][i] = category;
      category = (category % 6) + 1;
    }
    top++;

    for (let i = top; i <= bottom; i++) {
      board[i][right] = category;
      category = (category % 6) + 1;
    }
    right--;

    if (top <= bottom) {
      for (let i = right; i >= left; i--) {
        board[bottom][i] = category;
        category = (category % 6) + 1;
      }
      bottom--;
    }

    if (left <= right) {
      for (let i = bottom; i >= top; i--) {
        board[i][left] = category;
        category = (category % 6) + 1;
      }
      left++;
    }
  }
  return board;
}

export function calculateSpiralPosition(km: number): [number, number] {
  if (km === 0) return [0, 0];

  const stepsPerKm = 24.0 / 42.0;
  let steps = Math.floor(km * stepsPerKm);
  
  const size = BOARD_SIZE;
  let colLimit = size - 1;
  let rowLimit = size - 1;
  let left = 0;
  let up = 0;
  
  const pos: [number, number] = [0, 0];
  
  while (steps > 0) {
    for (let i = left; i <= colLimit && steps >= 0; i++) {
      pos[1] = i;
      steps--;
      if (steps === 0) return pos;
    }
    for (let i = up + 1; i <= rowLimit && steps >= 0; i++) {
      pos[0] = i;
      steps--;
      if (steps === 0) return pos;
    }
    if (up !== rowLimit) {
      for (let i = colLimit - 1; i >= left && steps >= 0; i--) {
        pos[1] = i;
        steps--;
        if (steps === 0) return pos;
      }
    }
    if (left !== colLimit) {
      for (let i = rowLimit - 1; i > up && steps >= 0; i--) {
        pos[0] = i;
        steps--;
        if (steps === 0) return pos;
      }
    }
    left++;
    colLimit--;
    up++;
    rowLimit--;
  }
  return pos;
}

export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function getQuestion(categoryId: number): Question {
  const questions = MOCK_QUESTIONS[categoryId] || MOCK_QUESTIONS[1];
  return questions[Math.floor(Math.random() * questions.length)];
}

export function validateAnswer(question: Question, answer: number): boolean {
  return question.answer === answer;
}

export function calculateKmChange(answerType: string, correct: boolean): number {
  if (!correct) return 0;
  return answerType === 'direct' ? 2 : 1;
}

export function createMockPlayer(id: number, name: string, isBot: boolean = false, botLevel: number = 2): GamePlayer {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
  return {
    id,
    name,
    color: colors[id % colors.length],
    position: [0, 0],
    km: 0,
    isBot,
    botLevel
  };
}

export function checkWinCondition(player: GamePlayer): boolean {
  return player.km >= 42;
}

export function botDecision(botLevel: number = 2, question: Question): { answer: number, type: string } {
  let correctChance = 0.5;
  switch (botLevel) {
    case 1: correctChance = 0.3; break;
    case 2: correctChance = 0.6; break;
    case 3: correctChance = 0.9; break;
  }

  if (Math.random() < correctChance) {
    return { answer: question.answer, type: 'direct' };
  }

  // Pick a wrong answer
  const wrongAnswers = [0, 1, 2].filter(a => a !== question.answer);
  return { 
    answer: wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)], 
    type: 'direct' 
  };
}
