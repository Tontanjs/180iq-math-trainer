'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Timer, Lightbulb, ChevronRight, RotateCcw, Home, Keyboard, Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  generatePuzzle, validateFormula, realtimeEval,
  Puzzle, ValidationResult, DIFFICULTY_LABELS,
} from '@/lib/puzzleGenerator';
import { savePuzzleResult, getPuzzleResults } from '@/lib/storage';
import { PuzzleDifficulty, PuzzleResult } from '@/lib/types';

type Phase = 'select' | 'playing' | 'result';

type Action =
  | { type: 'tile'; tileIndex: number; value: string }
  | { type: 'op'; value: string };

const TILE_COLORS = [
  'bg-rose-500 border-rose-600 shadow-rose-300/50',
  'bg-orange-500 border-orange-600 shadow-orange-300/50',
  'bg-amber-500 border-amber-600 shadow-amber-300/50',
  'bg-emerald-500 border-emerald-600 shadow-emerald-300/50',
  'bg-violet-500 border-violet-600 shadow-violet-300/50',
];

function formatTime(s: number): string {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

export default function PuzzlePage() {
  const [phase, setPhase] = useState<Phase>('select');
  const [difficulty, setDifficulty] = useState<PuzzleDifficulty>('normal');
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);

  // Playing state
  const [inputMode, setInputMode] = useState<'type' | 'buttons'>('type');
  const [typeFormula, setTypeFormula] = useState('');
  const [buttonActions, setButtonActions] = useState<Action[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typeInputRef = useRef<HTMLInputElement>(null);

  // Live eval
  const [liveResult, setLiveResult] = useState<number | null>(null);

  // Result state
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [skipped, setSkipped] = useState(false);

  // Session
  const [sessionPoints, setSessionPoints] = useState(0);
  const [puzzlesPlayed, setPuzzlesPlayed] = useState(0);
  const [allTimeCount, setAllTimeCount] = useState(0);

  useEffect(() => {
    setAllTimeCount(getPuzzleResults().length);
  }, []);

  // Derived
  const buttonFormula = buttonActions.map(a => a.value).join('');
  const activeFormula = inputMode === 'type' ? typeFormula : buttonFormula;
  const usedTileIndices = new Set(
    buttonActions
      .filter((a): a is Extract<Action, { type: 'tile' }> => a.type === 'tile')
      .map(a => a.tileIndex),
  );

  // Timer
  useEffect(() => {
    if (phase !== 'playing') {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // Live eval
  useEffect(() => {
    setLiveResult(puzzle ? realtimeEval(activeFormula) : null);
  }, [activeFormula, puzzle]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  function startPuzzle(diff: PuzzleDifficulty) {
    const p = generatePuzzle(diff);
    setPuzzle(p);
    setDifficulty(diff);
    setElapsed(0);
    setTypeFormula('');
    setButtonActions([]);
    setInputMode('type');
    setLiveResult(null);
    setValidation(null);
    setSkipped(false);
    setPhase('playing');
    setTimeout(() => typeInputRef.current?.focus(), 100);
  }

  function handleSubmit() {
    if (!puzzle) return;
    stopTimer();
    const vr = validateFormula(activeFormula, puzzle.numbers, puzzle.target, elapsed);
    setValidation(vr);
    setSkipped(false);

    const result: PuzzleResult = {
      id: Math.random().toString(36).slice(2),
      date: new Date().toISOString(),
      numbers: puzzle.numbers,
      target: puzzle.target,
      difficulty,
      userFormula: activeFormula,
      result: vr.result,
      deviation: vr.deviation,
      pointsEarned: vr.pointsEarned,
      isExact: vr.isExact,
      timeTaken: elapsed,
      skipped: false,
      solution: puzzle.solution,
    };
    savePuzzleResult(result);
    setSessionPoints(p => p + vr.pointsEarned);
    setPuzzlesPlayed(p => p + 1);
    setAllTimeCount(c => c + 1);
    setPhase('result');
  }

  function handleGiveUp() {
    if (!puzzle) return;
    stopTimer();
    const result: PuzzleResult = {
      id: Math.random().toString(36).slice(2),
      date: new Date().toISOString(),
      numbers: puzzle.numbers,
      target: puzzle.target,
      difficulty,
      userFormula: activeFormula,
      result: null,
      deviation: Infinity,
      pointsEarned: 0,
      isExact: false,
      timeTaken: elapsed,
      skipped: true,
      solution: puzzle.solution,
    };
    savePuzzleResult(result);
    setPuzzlesPlayed(p => p + 1);
    setAllTimeCount(c => c + 1);
    setSkipped(true);
    setValidation(null);
    setPhase('result');
  }

  // Button mode handlers
  function handleTileClick(index: number, value: number) {
    if (usedTileIndices.has(index)) return;
    setButtonActions(prev => [...prev, { type: 'tile', tileIndex: index, value: String(value) }]);
  }

  function handleOpClick(op: string) {
    if (op === 'BACKSPACE') {
      setButtonActions(prev => prev.slice(0, -1));
    } else if (op === 'CLEAR') {
      setButtonActions([]);
    } else {
      setButtonActions(prev => [...prev, { type: 'op', value: op }]);
    }
  }

  function handleTypeChange(value: string) {
    const normalized = value.replace(/\*/g, '×').replace(/\//g, '÷');
    setTypeFormula(normalized);
  }

  function handleModeSwitch(mode: 'type' | 'buttons') {
    if (mode === 'type') {
      setTypeFormula(buttonFormula);
      setButtonActions([]);
    } else {
      setButtonActions([]);
      setTypeFormula('');
    }
    setInputMode(mode);
    if (mode === 'type') setTimeout(() => typeInputRef.current?.focus(), 50);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  // SELECT phase
  if (phase === 'select') {
    const difficulties: PuzzleDifficulty[] = ['easy', 'normal', 'hard', 'expert'];
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-[#153B5C] dark:text-white">180IQ Puzzle</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Use all numbers to reach the target</p>
          </div>
        </div>

        {/* Stats bar */}
        {(allTimeCount > 0 || puzzlesPlayed > 0) && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 text-center">
              <p className="text-2xl font-extrabold text-[#0F75BC]">{allTimeCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Puzzles attempted</p>
            </div>
            {sessionPoints > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 text-center">
                <p className="text-2xl font-extrabold text-amber-500">{sessionPoints}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Points this session</p>
              </div>
            )}
          </div>
        )}

        <div>
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Choose Difficulty
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {difficulties.map(diff => {
              const cfg = DIFFICULTY_LABELS[diff];
              return (
                <button
                  key={diff}
                  onClick={() => startPuzzle(diff)}
                  className={cn(
                    'relative overflow-hidden rounded-2xl p-5 text-left border transition-all duration-200',
                    'hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0',
                    `bg-gradient-to-br ${cfg.gradient}`,
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{cfg.emoji}</span>
                    <ChevronRight className="h-5 w-5 text-white/60 group-hover:text-white" />
                  </div>
                  <h3 className="font-bold text-white text-xl mt-2">{cfg.label}</h3>
                  <p className="text-white/80 text-sm mt-0.5">{cfg.desc}</p>
                  <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs text-white/70">
                    <span>Numbers: {cfg.numbers}</span>
                    <span>Target: {cfg.target}</span>
                    <span>{cfg.tiles}</span>
                    <span>Ops: {cfg.ops}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* How to play */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2">How to play</h3>
          <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
            <li>• Use ALL given numbers exactly once</li>
            <li>• Combine them with operators to reach the target</li>
            <li>• Example: [9, 4, 7, 2] → target 55 → <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded text-xs">9×7−4+2</code></li>
            <li>• Exact match = 100 pts · Speed bonus up to +50 pts</li>
            <li>• Within ±5 = 50 pts · Within ±10 = 20 pts</li>
          </ul>
        </div>
      </div>
    );
  }

  // PLAYING phase
  if (phase === 'playing' && puzzle) {
    const isExactLive = liveResult !== null && puzzle && Math.abs(liveResult - puzzle.target) < 0.001;
    const isCloseLive = liveResult !== null && puzzle && !isExactLive && Math.abs(liveResult - puzzle.target) <= 5;
    const showPower = difficulty === 'hard' || difficulty === 'expert';
    const showFactorial = difficulty === 'expert';

    const ops = [
      { sym: '+', cls: 'bg-slate-600 hover:bg-slate-500 dark:bg-slate-600 dark:hover:bg-slate-500' },
      { sym: '−', cls: 'bg-slate-600 hover:bg-slate-500 dark:bg-slate-600 dark:hover:bg-slate-500', val: '-' },
      { sym: '×', cls: 'bg-slate-600 hover:bg-slate-500 dark:bg-slate-600 dark:hover:bg-slate-500' },
      { sym: '÷', cls: 'bg-slate-600 hover:bg-slate-500 dark:bg-slate-600 dark:hover:bg-slate-500' },
      ...(showPower ? [{ sym: '^', cls: 'bg-purple-700 hover:bg-purple-600' }] : []),
      ...(showFactorial ? [{ sym: '!', cls: 'bg-rose-700 hover:bg-rose-600' }] : []),
      { sym: '(', cls: 'bg-slate-500 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600' },
      { sym: ')', cls: 'bg-slate-500 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600' },
    ];

    return (
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPhase('select')}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2">
            <Timer className="h-4 w-4 text-slate-500" />
            <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-lg tabular-nums">
              {formatTime(elapsed)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {sessionPoints > 0 && (
              <span className="text-sm font-bold text-amber-500">{sessionPoints} pts</span>
            )}
            <button
              onClick={handleGiveUp}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-rose-500 transition-colors px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <Lightbulb className="h-4 w-4" />
              Give Up
            </button>
          </div>
        </div>

        {/* Target */}
        <div className="text-center bg-gradient-to-br from-[#153B5C] to-[#0F75BC] rounded-3xl p-8 text-white shadow-xl">
          <p className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-1">Target</p>
          <p className="text-7xl sm:text-8xl font-extrabold tracking-tight">{puzzle.target}</p>
          <p className="text-white/60 text-sm mt-2">
            Use all {puzzle.numbers.length} numbers to make this
          </p>
        </div>

        {/* Number tiles */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {puzzle.numbers.map((num, i) => {
            const isUsed = inputMode === 'buttons' && usedTileIndices.has(i);
            const isClickable = inputMode === 'buttons';
            return (
              <button
                key={i}
                onClick={() => handleTileClick(i, num)}
                disabled={isUsed || !isClickable}
                className={cn(
                  'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-b-4 font-extrabold text-2xl sm:text-3xl',
                  'transition-all duration-150 shadow-lg select-none',
                  isClickable && !isUsed
                    ? `${TILE_COLORS[i % TILE_COLORS.length]} text-white hover:-translate-y-1 hover:shadow-xl active:translate-y-0.5 active:border-b-2 cursor-pointer`
                    : isUsed
                    ? 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50'
                    : `${TILE_COLORS[i % TILE_COLORS.length]} text-white cursor-default`,
                )}
              >
                {num}
              </button>
            );
          })}
        </div>

        {/* Formula area */}
        <div className={cn(
          'rounded-2xl border-2 transition-all duration-200',
          isExactLive
            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
            : isCloseLive
            ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800',
        )}>
          <div className="flex items-center px-4 py-3 gap-3">
            <div className="flex-1 min-w-0">
              {inputMode === 'type' ? (
                <input
                  ref={typeInputRef}
                  value={typeFormula}
                  onChange={e => handleTypeChange(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="w-full text-2xl font-mono bg-transparent outline-none text-slate-800 dark:text-white placeholder-slate-300 dark:placeholder-slate-600"
                  placeholder="Type formula…"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              ) : (
                <div className="text-2xl font-mono text-slate-800 dark:text-white min-h-[2rem] break-all">
                  {buttonFormula || (
                    <span className="text-slate-300 dark:text-slate-600">Tap tiles and operators…</span>
                  )}
                </div>
              )}
            </div>
            {liveResult !== null && (
              <div className={cn(
                'shrink-0 text-base font-bold px-3 py-1.5 rounded-xl tabular-nums',
                isExactLive
                  ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40'
                  : isCloseLive
                  ? 'text-amber-600 bg-amber-100 dark:bg-amber-900/40'
                  : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700',
              )}>
                = {Number.isInteger(liveResult) ? liveResult : liveResult.toFixed(2)}
                {isExactLive && ' ✓'}
              </div>
            )}
          </div>
        </div>

        {/* Input mode toggle */}
        <div className="flex items-center justify-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit mx-auto">
          <button
            onClick={() => handleModeSwitch('type')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              inputMode === 'type'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
            )}
          >
            <Keyboard className="h-4 w-4" />
            Type
          </button>
          <button
            onClick={() => handleModeSwitch('buttons')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              inputMode === 'buttons'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
            )}
          >
            <Grid3X3 className="h-4 w-4" />
            Buttons
          </button>
        </div>

        {/* Button mode keyboard */}
        {inputMode === 'buttons' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 space-y-3">
            {/* Operators */}
            <div className="flex flex-wrap gap-2 justify-center">
              {ops.map(op => (
                <button
                  key={op.sym}
                  onClick={() => handleOpClick(op.val ?? op.sym)}
                  className={cn(
                    'w-12 h-12 rounded-xl text-white font-bold text-lg transition-colors',
                    op.cls,
                  )}
                >
                  {op.sym}
                </button>
              ))}
              <button
                onClick={() => handleOpClick('BACKSPACE')}
                className="w-14 h-12 rounded-xl bg-slate-400 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-bold transition-colors text-xl"
              >
                ⌫
              </button>
              <button
                onClick={() => handleOpClick('CLEAR')}
                className="px-4 h-12 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-sm transition-colors"
              >
                Clear
              </button>
            </div>

            {/* Number tiles (tap again) */}
            <div className="flex items-center justify-center gap-2 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-700">
              {puzzle.numbers.map((num, i) => {
                const isUsed = usedTileIndices.has(i);
                return (
                  <button
                    key={i}
                    onClick={() => handleTileClick(i, num)}
                    disabled={isUsed}
                    className={cn(
                      'w-12 h-12 rounded-xl border-b-4 font-extrabold text-xl transition-all duration-100',
                      isUsed
                        ? 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-400 opacity-50 cursor-not-allowed'
                        : `${TILE_COLORS[i % TILE_COLORS.length]} text-white hover:-translate-y-0.5 active:translate-y-0 cursor-pointer`,
                    )}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          className={cn(
            'w-full h-14 rounded-2xl font-bold text-lg transition-all shadow-lg',
            'hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0',
            isExactLive
              ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
              : 'bg-[#0F75BC] hover:bg-blue-600 text-white',
          )}
        >
          {isExactLive ? '✓ Submit — Exact Match!' : 'Submit Answer →'}
        </button>
      </div>
    );
  }

  // RESULT phase
  if (phase === 'result' && puzzle) {
    const cfg = DIFFICULTY_LABELS[difficulty];
    const isValid = validation?.valid && validation.numbersMatch;

    let resultLabel = '';
    let resultColor = '';
    if (skipped) {
      resultLabel = 'You gave up';
      resultColor = 'text-slate-500';
    } else if (!validation?.numbersMatch) {
      resultLabel = 'Invalid — wrong numbers used';
      resultColor = 'text-rose-500';
    } else if (validation?.isExact) {
      resultLabel = '🎯 Exact Match!';
      resultColor = 'text-emerald-500';
    } else if (validation && validation.deviation <= 5) {
      resultLabel = `Close! Off by ${validation.deviation.toFixed(1)}`;
      resultColor = 'text-amber-500';
    } else if (validation && validation.deviation <= 10) {
      resultLabel = `Near! Off by ${validation.deviation.toFixed(1)}`;
      resultColor = 'text-orange-500';
    } else if (validation) {
      resultLabel = `Off by ${validation.deviation.toFixed(1)}`;
      resultColor = 'text-rose-500';
    }

    return (
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPhase('select')}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-extrabold text-[#153B5C] dark:text-white">Result</h2>
          <span className={cn('text-sm font-semibold px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700', cfg.color)}>
            {cfg.label}
          </span>
        </div>

        {/* Puzzle recap */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Target</span>
            <span className="text-3xl font-extrabold text-[#153B5C] dark:text-white">{puzzle.target}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Numbers</span>
            <div className="flex gap-1.5">
              {puzzle.numbers.map((n, i) => (
                <span key={i} className={cn('w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm', TILE_COLORS[i % TILE_COLORS.length].split(' ')[0])}>
                  {n}
                </span>
              ))}
            </div>
          </div>

          {!skipped && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide shrink-0">Your formula</span>
              <div className="text-right">
                <code className="font-mono text-base text-slate-700 dark:text-slate-200">{activeFormula || '—'}</code>
                {validation?.result !== null && validation?.result !== undefined && (
                  <span className="ml-2 text-slate-500">= {validation.result}</span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Time</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{formatTime(elapsed)}</span>
          </div>
        </div>

        {/* Result banner */}
        <div className={cn(
          'rounded-2xl p-5 text-center',
          validation?.isExact
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-400'
            : skipped || !isValid
            ? 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'
            : 'bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-400',
        )}>
          <p className={cn('text-2xl font-extrabold', resultColor)}>{resultLabel}</p>
          {isValid && !skipped && (
            <div className="mt-3 space-y-1 text-sm">
              {validation.basePoints > 0 && (
                <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
                  <span>Base points:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">+{validation.basePoints}</span>
                </div>
              )}
              {validation.speedBonus > 0 && (
                <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
                  <span>Speed bonus ({formatTime(elapsed)}):</span>
                  <span className="font-bold text-amber-500">+{validation.speedBonus}</span>
                </div>
              )}
              <div className="flex items-center justify-center gap-2 text-base font-extrabold mt-2">
                <span className="text-slate-700 dark:text-slate-200">Total:</span>
                <span className="text-[#0F75BC]">+{validation.pointsEarned} pts</span>
              </div>
            </div>
          )}
          {(skipped || !isValid) && !skipped && (
            <p className="text-sm text-slate-500 mt-1">{validation?.error}</p>
          )}
        </div>

        {/* Hint solution */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">One valid solution</span>
          </div>
          <code className="text-xl font-mono font-bold text-[#153B5C] dark:text-white">
            {puzzle.solution} = {puzzle.target}
          </code>
        </div>

        {/* Session total */}
        {sessionPoints > 0 && (
          <div className="bg-gradient-to-r from-[#153B5C] to-[#0F75BC] rounded-2xl p-4 text-white flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">Session total</p>
              <p className="text-2xl font-extrabold">{sessionPoints} pts</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/70">Puzzles played</p>
              <p className="text-2xl font-extrabold">{puzzlesPlayed}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => startPuzzle(difficulty)}
            className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-[#0F75BC] hover:bg-blue-600 text-white font-bold transition-all hover:-translate-y-0.5 shadow-lg"
          >
            <RotateCcw className="h-4 w-4" />
            New Puzzle
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
