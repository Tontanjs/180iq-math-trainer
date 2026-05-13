import { create, all } from 'mathjs';
import { Question, SessionSettings, Operation } from './types';

const math = create(all);

function randomInt(digits: number): number {
  if (digits <= 0) digits = 1;
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOperation(ops: Operation[]): string {
  const filtered = ops.filter(o => o !== 'mixed');
  const pool = filtered.length ? filtered : ['+', '-', '×', '÷'];
  return pool[Math.floor(Math.random() * pool.length)] as string;
}

export function generateQuestion(settings: SessionSettings): Question {
  const { digits, numTerms, operations } = settings;
  const ops: Operation[] = operations.includes('mixed')
    ? (['+', '-', '×', '÷'] as Operation[])
    : operations;

  const terms: number[] = [];
  const opList: string[] = [];

  // Generate first term
  terms.push(randomInt(digits));

  for (let i = 1; i < numTerms; i++) {
    const op = pickOperation(ops);
    let num = randomInt(digits);

    // For division, make it clean
    if (op === '÷') {
      // num is the divisor, ensure it divides the previous value cleanly
      const divisors = [2, 3, 4, 5, 6, 7, 8, 9, 10].filter(d => d < Math.pow(10, digits));
      const divisor = divisors[Math.floor(Math.random() * divisors.length)];
      // Make previous term a multiple of divisor
      const multiple = Math.floor(randomInt(digits) / divisor) || 1;
      terms[terms.length - 1] = multiple * divisor;
      num = divisor;
    }

    terms.push(num);
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
