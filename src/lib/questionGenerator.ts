import { create, all } from 'mathjs';
import { Question, SessionSettings, Operation, PlaceValue, NumberType } from './types';

const math = create(all);

// ── Number generation ────────────────────────────────────────────────────────

function randomInt(digits: number): number {
  if (digits <= 0) digits = 1;
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const PLACE_RANGES: Record<PlaceValue, [number, number, number]> = {
  ones:      [1,    9,    1],     // min, max, step
  tens:      [10,   90,   10],
  hundreds:  [100,  900,  100],
  thousands: [1000, 9000, 1000],
};

function placeValueNum(pv: PlaceValue): number {
  const [min, max, step] = PLACE_RANGES[pv];
  const count = (max - min) / step + 1;
  return min + Math.floor(Math.random() * count) * step;
}

function pickNum(settings: SessionSettings): number {
  if (settings.placeValue) return placeValueNum(settings.placeValue);
  if (settings.numberType) {
    const t = settings.numberType as NumberType;
    if (t === 'single') return Math.floor(Math.random() * 9) + 1;
    if (t === 'double') return Math.floor(Math.random() * 90) + 10;
    // mixed
    return Math.random() < 0.5
      ? Math.floor(Math.random() * 9) + 1
      : Math.floor(Math.random() * 90) + 10;
  }
  return randomInt(settings.digits);
}

// ── Division helpers ─────────────────────────────────────────────────────────

function cleanDivisors(pv: PlaceValue | null | undefined): number[] {
  if (pv === 'thousands') return [2, 4, 5, 8, 10];
  if (pv === 'hundreds')  return [2, 4, 5, 10, 25];
  if (pv === 'tens')      return [2, 5, 10];
  return [2, 3, 4, 5, 6, 7, 8, 9, 10];
}

function makeDivisionPair(settings: SessionSettings): [number, number] {
  if (settings.placeValue) {
    const pv = settings.placeValue;
    const [min, max, step] = PLACE_RANGES[pv];
    const divisors = cleanDivisors(pv);
    const divisor = divisors[Math.floor(Math.random() * divisors.length)];
    // Build list of valid multiples-of-step that are divisible by divisor
    const candidates: number[] = [];
    for (let n = min; n <= max; n += step) {
      if (n % divisor === 0) candidates.push(n);
    }
    const dividend = candidates.length
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : min;
    return [dividend, divisor];
  }
  // Default: existing approach
  const digits = settings.digits;
  const divisors = [2, 3, 4, 5, 6, 7, 8, 9, 10].filter(d => d < Math.pow(10, digits));
  const divisor = divisors[Math.floor(Math.random() * divisors.length)];
  const multiple = Math.floor(randomInt(digits) / divisor) || 1;
  return [multiple * divisor, divisor];
}

// ── Operation pick ───────────────────────────────────────────────────────────

function pickOperation(ops: Operation[]): string {
  const filtered = ops.filter(o => o !== 'mixed');
  const pool = filtered.length ? filtered : ['+', '-', '×', '÷'];
  return pool[Math.floor(Math.random() * pool.length)] as string;
}

// ── Main generator ───────────────────────────────────────────────────────────

export function generateQuestion(settings: SessionSettings): Question {
  const ops: Operation[] = settings.operations.includes('mixed')
    ? (['+', '-', '×', '÷'] as Operation[])
    : settings.operations;

  const terms: number[] = [];
  const opList: string[] = [];

  terms.push(pickNum(settings));

  for (let i = 1; i < settings.numTerms; i++) {
    const op = pickOperation(ops);

    if (op === '÷') {
      const [dividend, divisor] = makeDivisionPair(settings);
      terms[terms.length - 1] = dividend;
      terms.push(divisor);
    } else {
      terms.push(pickNum(settings));
    }

    opList.push(op);
  }

  // Build expression
  let expr = String(terms[0]);
  for (let i = 0; i < opList.length; i++) {
    const mathOp = opList[i] === '×' ? '*' : opList[i] === '÷' ? '/' : opList[i];
    expr += ` ${mathOp} ${terms[i + 1]}`;
  }

  let answer: number;
  try {
    const result = math.evaluate(expr);
    answer = Math.round(result * 1000) / 1000;
  } catch {
    answer = 0;
  }

  const display = expr.replace(/\*/g, '×').replace(/\//g, '÷');
  return { id: crypto.randomUUID(), display, answer };
}

export function generateQuestions(settings: SessionSettings): Question[] {
  return Array.from({ length: settings.questionCount }, () => generateQuestion(settings));
}
