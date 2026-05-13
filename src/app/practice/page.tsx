'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { SessionSettings, Operation } from '@/lib/types';
import { setPendingSession } from '@/lib/storage';
import { Zap, Settings2, Trophy, ChevronLeft, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

const TIME_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: 'None', value: null },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: '2m', value: 120 },
  { label: '3m', value: 180 },
];

const TERM_OPTIONS: Array<3 | 5 | 7 | 10> = [3, 5, 7, 10];

const ALL_OPS: Operation[] = ['+', '-', '×', '÷', 'mixed'];
const OP_LABELS: Record<Operation, string> = {
  '+': 'Addition +',
  '-': 'Subtraction −',
  '×': 'Multiply ×',
  '÷': 'Division ÷',
  'mixed': 'Mixed ✦',
};

function getDifficulty(settings: SessionSettings): { label: string; color: string; score: number } {
  let score = 0;
  score += settings.digits * 15;
  score += settings.numTerms * 5;
  score += settings.operations.filter(o => o !== 'mixed').length * 5;
  if (settings.timeLimit !== null) score += Math.max(0, (120 - settings.timeLimit) / 10);

  if (score <= 25) return { label: 'Easy', color: 'text-green-600 bg-green-100', score };
  if (score <= 50) return { label: 'Medium', color: 'text-amber-600 bg-amber-100', score };
  if (score <= 75) return { label: 'Hard', color: 'text-orange-600 bg-orange-100', score };
  return { label: 'Expert', color: 'text-red-600 bg-red-100', score };
}

const DEFAULT_QUICK: SessionSettings = {
  digits: 2,
  numTerms: 3,
  operations: ['+', '-', '×', '÷'],
  timeLimit: null,
  questionCount: 10,
  mode: 'quick',
};

const DEFAULT_CHALLENGE: SessionSettings = {
  digits: 4,
  numTerms: 5,
  operations: ['+', '-', '×', '÷'],
  timeLimit: 60,
  questionCount: 20,
  mode: 'challenge',
};

function PracticeSetupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = (searchParams.get('mode') || 'custom') as 'quick' | 'custom' | 'challenge';

  const defaultSettings: SessionSettings =
    mode === 'quick' ? DEFAULT_QUICK :
    mode === 'challenge' ? DEFAULT_CHALLENGE :
    {
      digits: 2,
      numTerms: 3,
      operations: ['+', '-'],
      timeLimit: null,
      questionCount: 10,
      mode: 'custom',
    };

  const [settings, setSettings] = useState<SessionSettings>(defaultSettings);

  const isQuick = mode === 'quick';
  const difficulty = getDifficulty(settings);

  const toggleOp = (op: Operation) => {
    setSettings(prev => {
      const has = prev.operations.includes(op);
      if (op === 'mixed') {
        return { ...prev, operations: has ? [] : ['mixed'] };
      }
      let ops = has
        ? prev.operations.filter(o => o !== op)
        : [...prev.operations.filter(o => o !== 'mixed'), op];
      if (ops.length === 0) ops = [op];
      return { ...prev, operations: ops };
    });
  };

  const handleStart = () => {
    setPendingSession(settings);
    router.push('/training');
  };

  const modeIcon = mode === 'quick' ? Zap : mode === 'challenge' ? Trophy : Settings2;
  const ModeIcon = modeIcon;

  const modeLabel =
    mode === 'quick' ? 'Quick Practice' :
    mode === 'challenge' ? 'Challenge Mode' :
    'Custom Training';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="rounded-full">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center",
            mode === 'quick' ? 'bg-blue-100 text-[#0F75BC]' :
            mode === 'challenge' ? 'bg-orange-100 text-orange-600' :
            'bg-purple-100 text-purple-600'
          )}>
            <ModeIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#153B5C] dark:text-white">{modeLabel}</h1>
            <p className="text-xs text-slate-400">Configure your training session</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 space-y-6">

        {/* Digits */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Digits per number
            </label>
            <span className="text-lg font-bold text-[#0F75BC] bg-blue-50 dark:bg-blue-900/20 px-3 py-0.5 rounded-lg">
              {settings.digits}d
            </span>
          </div>
          <Slider
            min={1}
            max={6}
            step={1}
            value={settings.digits}
            onValueChange={(v) => setSettings(prev => ({ ...prev, digits: typeof v === 'number' ? v : (v as number[])[0] }))}
            disabled={isQuick}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>1 digit (0-9)</span>
            <span>6 digits (100000+)</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Example: {
              settings.digits === 1 ? '7 + 3' :
              settings.digits === 2 ? '37 + 48' :
              settings.digits === 3 ? '372 + 481' :
              settings.digits === 4 ? '3721 + 4812' :
              settings.digits === 5 ? '37215 + 48126' :
              '372158 + 481263'
            }
          </div>
        </div>

        {/* Number of Terms */}
        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 block mb-3">
            Number of terms
          </label>
          <div className="flex gap-2 flex-wrap">
            {TERM_OPTIONS.map(n => (
              <button
                key={n}
                onClick={() => setSettings(prev => ({ ...prev, numTerms: n }))}
                disabled={isQuick}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-all border",
                  settings.numTerms === n
                    ? "bg-[#0F75BC] text-white border-[#0F75BC] shadow-sm"
                    : "bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-[#0F75BC] hover:text-[#0F75BC]",
                  isQuick && "opacity-50 cursor-not-allowed"
                )}
              >
                {n} terms
              </button>
            ))}
          </div>
        </div>

        {/* Operations */}
        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 block mb-3">
            Operations
          </label>
          <div className="flex gap-2 flex-wrap">
            {ALL_OPS.map(op => (
              <button
                key={op}
                onClick={() => toggleOp(op)}
                disabled={isQuick}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-all border",
                  settings.operations.includes(op)
                    ? "bg-[#153B5C] text-white border-[#153B5C] shadow-sm"
                    : "bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-[#153B5C]",
                  isQuick && "opacity-50 cursor-not-allowed"
                )}
              >
                {OP_LABELS[op]}
              </button>
            ))}
          </div>
        </div>

        {/* Time Limit */}
        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 block mb-3">
            Time limit per question
          </label>
          <div className="flex gap-2 flex-wrap">
            {TIME_OPTIONS.map(({ label, value }) => (
              <button
                key={label}
                onClick={() => setSettings(prev => ({ ...prev, timeLimit: value }))}
                disabled={isQuick}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-all border",
                  settings.timeLimit === value
                    ? "bg-[#0F75BC] text-white border-[#0F75BC] shadow-sm"
                    : "bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-[#0F75BC]",
                  isQuick && "opacity-50 cursor-not-allowed"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Question Count */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Number of questions
            </label>
            <span className="text-lg font-bold text-[#0F75BC] bg-blue-50 dark:bg-blue-900/20 px-3 py-0.5 rounded-lg">
              {settings.questionCount}
            </span>
          </div>
          <Slider
            min={5}
            max={50}
            step={5}
            value={settings.questionCount}
            onValueChange={(v) => setSettings(prev => ({ ...prev, questionCount: typeof v === 'number' ? v : (v as number[])[0] }))}
            disabled={isQuick}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>5 (quick)</span>
            <span>50 (marathon)</span>
          </div>
        </div>

        {/* Difficulty display */}
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Estimated difficulty</span>
          </div>
          <span className={cn("text-sm font-bold px-3 py-1 rounded-lg", difficulty.color)}>
            {difficulty.label}
          </span>
        </div>
      </div>

      {/* Start Button */}
      <Button
        onClick={handleStart}
        className="w-full h-14 text-lg font-bold rounded-2xl bg-[#0F75BC] hover:bg-blue-700 text-white shadow-lg transition-all hover:-translate-y-0.5"
      >
        <Zap className="h-5 w-5 mr-2" />
        Start Training
      </Button>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
        <div className="text-slate-400">Loading...</div>
      </div>
    }>
      <PracticeSetupInner />
    </Suspense>
  );
}
