export type Operation = '+' | '-' | '×' | '÷' | 'mixed';

export interface SessionSettings {
  digits: number;          // 1-6
  numTerms: 3 | 5 | 7 | 10;
  operations: Operation[];
  timeLimit: number | null; // seconds
  questionCount: number;
  mode: 'quick' | 'custom' | 'challenge';
}

export interface Question {
  id: string;
  display: string;         // e.g. "37 + 48"
  answer: number;
}

export interface WorkingStep {
  input: string;
  isValid: boolean | null;
  feedback: string;
  parsed: string;
}

export interface QuestionResult {
  question: Question;
  userAnswer: string;
  correct: boolean;
  timeTaken: number;   // ms
  skipped: boolean;
  steps: WorkingStep[];
}

export interface TrainingSession {
  id: string;
  date: string;          // ISO
  settings: SessionSettings;
  results: QuestionResult[];
  score: number;
  accuracy: number;
  avgTime: number;       // ms
  maxStreak: number;
}

export interface DailyStats {
  date: string;
  accuracy: number;
  questionsAnswered: number;
  avgTime: number;
  streak: number;
}

export type PuzzleDifficulty = 'easy' | 'normal' | 'hard' | 'expert';

export interface PuzzleResult {
  id: string;
  date: string;
  numbers: number[];
  target: number;
  difficulty: PuzzleDifficulty;
  userFormula: string;
  result: number | null;
  deviation: number;
  pointsEarned: number;
  isExact: boolean;
  timeTaken: number; // seconds
  skipped: boolean;
  solution: string;
}
