import { evaluate as mathEvaluate } from 'mathjs';
import { PuzzleDifficulty } from './types';

export interface Puzzle {
  id: string;
  numbers: number[];
  target: number;
  difficulty: PuzzleDifficulty;
  solution: string; // display format (×, ÷)
}

export interface ValidationResult {
  valid: boolean;
  result: number | null;
  error: string | null;
  numbersMatch: boolean;
  basePoints: number;
  speedBonus: number;
  pointsEarned: number;
  isExact: boolean;
  deviation: number;
}

interface DifficultyConfig {
  minCount: number;
  maxCount: number;
  min: number;
  max: number;
  targetMin: number;
  targetMax: number;
  binOps: string[];
  useFactorial: boolean;
}

const CONFIGS: Record<PuzzleDifficulty, DifficultyConfig> = {
  easy:   { minCount: 4, maxCount: 4, min: 1, max: 9,  targetMin: 1, targetMax: 50,  binOps: ['+', '-', '*', '/'],           useFactorial: false },
  normal: { minCount: 4, maxCount: 5, min: 1, max: 25, targetMin: 1, targetMax: 100, binOps: ['+', '-', '*', '/'],            useFactorial: false },
  hard:   { minCount: 5, maxCount: 5, min: 1, max: 50, targetMin: 1, targetMax: 500, binOps: ['+', '-', '*', '/', '^'],       useFactorial: false },
  expert: { minCount: 5, maxCount: 5, min: 1, max: 99, targetMin: 1, targetMax: 999, binOps: ['+', '-', '*', '/', '^'],       useFactorial: true  },
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function safeEval(expr: string): number | null {
  try {
    const normalized = expr.replace(/×/g, '*').replace(/÷/g, '/');
    const result = mathEvaluate(normalized);
    if (typeof result !== 'number' || !isFinite(result) || isNaN(result)) return null;
    return result;
  } catch {
    return null;
  }
}

function extractNumbers(formula: string): number[] {
  const clean = formula.replace(/!/g, '');
  const matches = clean.match(/\d+/g);
  return matches ? matches.map(Number) : [];
}

function buildFormula(nums: number[], ops: string[], useFactorial: boolean): string {
  const n = nums.length;
  const terms = nums.map((num) => {
    if (useFactorial && num >= 2 && num <= 5 && Math.random() < 0.2) {
      return `${num}!`;
    }
    return String(num);
  });

  if (n === 4) {
    const r = Math.random();
    if (r < 0.2) return `(${terms[0]}${ops[0]}${terms[1]})${ops[1]}(${terms[2]}${ops[2]}${terms[3]})`;
    if (r < 0.4) return `(${terms[0]}${ops[0]}${terms[1]}${ops[1]}${terms[2]})${ops[2]}${terms[3]}`;
    if (r < 0.6) return `${terms[0]}${ops[0]}(${terms[1]}${ops[1]}${terms[2]})${ops[2]}${terms[3]}`;
    if (r < 0.8) return `${terms[0]}${ops[0]}(${terms[1]}${ops[1]}(${terms[2]}${ops[2]}${terms[3]}))`;
    return terms.map((t, i) => i < ops.length ? t + ops[i] : t).join('');
  }

  if (n === 5) {
    const r = Math.random();
    if (r < 0.2) return `(${terms[0]}${ops[0]}${terms[1]})${ops[1]}(${terms[2]}${ops[2]}${terms[3]})${ops[3]}${terms[4]}`;
    if (r < 0.4) return `(${terms[0]}${ops[0]}${terms[1]}${ops[1]}${terms[2]})${ops[2]}(${terms[3]}${ops[3]}${terms[4]})`;
    if (r < 0.6) return `${terms[0]}${ops[0]}((${terms[1]}${ops[1]}${terms[2]})${ops[2]}${terms[3]})${ops[3]}${terms[4]}`;
    if (r < 0.8) return `${terms[0]}${ops[0]}${terms[1]}${ops[1]}(${terms[2]}${ops[2]}${terms[3]})${ops[3]}${terms[4]}`;
    return terms.map((t, i) => i < ops.length ? t + ops[i] : t).join('');
  }

  return terms.map((t, i) => i < ops.length ? t + ops[i] : t).join('');
}

export function generatePuzzle(difficulty: PuzzleDifficulty): Puzzle {
  const cfg = CONFIGS[difficulty];

  for (let attempt = 0; attempt < 500; attempt++) {
    const count = randInt(cfg.minCount, cfg.maxCount);

    const numbers: number[] = [];
    for (let i = 0; i < count; i++) {
      numbers.push(randInt(cfg.min, cfg.max));
    }

    const ops: string[] = [];
    for (let i = 0; i < count - 1; i++) {
      ops.push(cfg.binOps[Math.floor(Math.random() * cfg.binOps.length)]);
    }

    const perm = shuffle([...numbers]);
    const formula = buildFormula(perm, ops, cfg.useFactorial);

    const result = safeEval(formula);
    if (result === null) continue;
    if (Math.abs(result - Math.round(result)) > 0.001) continue;
    const target = Math.round(result);
    if (target < cfg.targetMin || target > cfg.targetMax) continue;

    // Verify extracted numbers match what we generated
    const formulaNums = extractNumbers(formula);
    const sorted1 = [...formulaNums].sort((a, b) => a - b);
    const sorted2 = [...numbers].sort((a, b) => a - b);
    if (sorted1.join(',') !== sorted2.join(',')) continue;

    const displayFormula = formula.replace(/\*/g, '×').replace(/\//g, '÷');

    return {
      id: Math.random().toString(36).slice(2, 9),
      numbers: shuffle(numbers),
      target,
      difficulty,
      solution: displayFormula,
    };
  }

  return { id: 'fallback', numbers: [2, 3, 4, 5], target: 14, difficulty, solution: '2+3+4+5' };
}

export function validateFormula(
  formula: string,
  givenNumbers: number[],
  target: number,
  elapsedSeconds: number,
): ValidationResult {
  const empty: ValidationResult = {
    valid: false, result: null, error: null, numbersMatch: false,
    basePoints: 0, speedBonus: 0, pointsEarned: 0, isExact: false, deviation: Infinity,
  };

  if (!formula.trim()) {
    return { ...empty, error: 'Enter a formula using all numbers' };
  }

  const formulaNums = extractNumbers(formula);
  const sorted1 = [...formulaNums].sort((a, b) => a - b);
  const sorted2 = [...givenNumbers].sort((a, b) => a - b);
  const numbersMatch = sorted1.join(',') === sorted2.join(',');

  if (!numbersMatch) {
    const msg = formulaNums.length < givenNumbers.length
      ? `Use all ${givenNumbers.length} numbers exactly once`
      : formulaNums.length > givenNumbers.length
      ? `Too many numbers — use only: ${givenNumbers.join(', ')}`
      : `Wrong numbers — must use: ${givenNumbers.join(', ')}`;
    return { ...empty, numbersMatch: false, error: msg };
  }

  const result = safeEval(formula);
  if (result === null) {
    return { ...empty, numbersMatch, error: 'Invalid expression — check your formula' };
  }

  const deviation = Math.abs(result - target);
  const isExact = deviation < 0.001;

  let basePoints = 0;
  if (isExact) basePoints = 100;
  else if (deviation <= 5) basePoints = 50;
  else if (deviation <= 10) basePoints = 20;

  let speedBonus = 0;
  if (basePoints > 0) {
    if (elapsedSeconds < 15) speedBonus = 50;
    else if (elapsedSeconds < 30) speedBonus = 30;
  }

  return {
    valid: true, result, error: null, numbersMatch,
    basePoints, speedBonus, pointsEarned: basePoints + speedBonus,
    isExact, deviation: isExact ? 0 : deviation,
  };
}

export function realtimeEval(formula: string): number | null {
  if (!formula.trim()) return null;
  return safeEval(formula);
}

export const DIFFICULTY_LABELS: Record<PuzzleDifficulty, { label: string; emoji: string; desc: string; numbers: string; tiles: string; target: string; ops: string; color: string; gradient: string }> = {
  easy:   { label: 'Easy',   emoji: '🟢', desc: 'Perfect for beginners', numbers: '1–9',   tiles: '4 tiles',   target: '1–50',   ops: '+ − × ÷',         color: 'text-emerald-600', gradient: 'from-emerald-500 to-emerald-700 border-emerald-400' },
  normal: { label: 'Normal', emoji: '🔵', desc: 'A solid challenge',     numbers: '1–25',  tiles: '4–5 tiles', target: '1–100',  ops: '+ − × ÷',         color: 'text-blue-600',    gradient: 'from-blue-500 to-blue-700 border-blue-400' },
  hard:   { label: 'Hard',   emoji: '🟠', desc: 'Stretch your brain',    numbers: '1–50',  tiles: '5 tiles',   target: '1–500',  ops: '+ − × ÷ ^',       color: 'text-orange-600',  gradient: 'from-orange-500 to-orange-700 border-orange-400' },
  expert: { label: 'Expert', emoji: '🔴', desc: 'For true 180IQ minds',  numbers: '1–99',  tiles: '5 tiles',   target: '1–999',  ops: '+ − × ÷ ^ !',     color: 'text-rose-600',    gradient: 'from-rose-500 to-rose-700 border-rose-400' },
};
