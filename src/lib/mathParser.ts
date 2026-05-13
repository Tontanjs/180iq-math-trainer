import { create, all } from 'mathjs';
import { WorkingStep } from './types';

const math = create(all);

export function parseAndValidateStep(input: string): WorkingStep {
  const trimmed = input.trim();
  if (!trimmed) return { input, isValid: null, feedback: '', parsed: '' };

  // Check if it contains "=" — treat as equation to verify
  const eqIdx = trimmed.lastIndexOf('=');
  if (eqIdx !== -1) {
    const lhs = trimmed.slice(0, eqIdx).trim();
    const rhs = trimmed.slice(eqIdx + 1).trim();
    if (!lhs || !rhs) {
      return { input, isValid: null, feedback: '', parsed: '' };
    }
    const mathLhs = lhs.replace(/×/g, '*').replace(/÷/g, '/');
    const mathRhs = rhs.replace(/×/g, '*').replace(/÷/g, '/');
    try {
      const lhsVal = math.evaluate(mathLhs);
      const rhsVal = math.evaluate(mathRhs);
      const ok = Math.abs(Number(lhsVal) - Number(rhsVal)) < 0.0001;
      return {
        input,
        isValid: ok,
        feedback: ok
          ? `✓ Correct: ${lhsVal} = ${rhsVal}`
          : `✗ Incorrect: ${lhsVal} ≠ ${rhsVal}`,
        parsed: String(lhsVal),
      };
    } catch (e) {
      return { input, isValid: false, feedback: `Parse error: ${(e as Error).message}`, parsed: '' };
    }
  }

  // Just an expression — evaluate it
  const mathExpr = trimmed.replace(/×/g, '*').replace(/÷/g, '/');
  try {
    const val = math.evaluate(mathExpr);
    return { input, isValid: true, feedback: `= ${val}`, parsed: String(val) };
  } catch (e) {
    return { input, isValid: false, feedback: `Cannot parse: ${(e as Error).message}`, parsed: '' };
  }
}

export function evaluateExpression(expr: string): number | null {
  try {
    const mathExpr = expr.replace(/×/g, '*').replace(/÷/g, '/');
    const result = math.evaluate(mathExpr);
    return Number(result);
  } catch { return null; }
}
