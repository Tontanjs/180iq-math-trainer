'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SessionSettings, Operation, NumberType, PlaceValue } from '@/lib/types';
import { setPendingSession } from '@/lib/storage';
import { Zap, Settings2, Trophy, ChevronLeft, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Config ────────────────────────────────────────────────────────────────────

const TIME_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: 'Off',  value: null },
  { label: '10s',  value: 10   },
  { label: '20s',  value: 20   },
  { label: '30s',  value: 30   },
  { label: '60s',  value: 60   },
];

const TERM_OPTIONS: Array<3 | 5 | 7 | 10> = [3, 5, 7, 10];
const SESSION_SIZES = [10, 20, 30] as const;

const ALL_OPS: Operation[] = ['+', '-', '×', '÷', 'mixed'];
const OP_LABELS: Record<Operation, string> = {
  '+': 'Addition +',
  '-': 'Subtraction −',
  '×': 'Multiply ×',
  '÷': 'Division ÷',
  'mixed': 'Mixed ✦',
};

const NUMBER_TYPES: Array<{ value: NumberType | null; label: string; sub: string }> = [
  { value: null,    label: 'Auto',   sub: 'use digit setting' },
  { value: 'single', label: 'Single', sub: '1–9'  },
  { value: 'double', label: 'Double', sub: '10–99' },
  { value: 'mixed',  label: 'Mixed',  sub: '1–99'  },
];

const PLACE_VALUES: Array<{ value: PlaceValue | null; label: string; sub: string }> = [
  { value: null,        label: 'Off',       sub: '' },
  { value: 'ones',      label: 'Ones',      sub: '1–9'        },
  { value: 'tens',      label: 'Tens',      sub: '10–90'      },
  { value: 'hundreds',  label: 'Hundreds',  sub: '100–900'    },
  { value: 'thousands', label: 'Thousands', sub: '1000–9000'  },
];

// ── Difficulty ────────────────────────────────────────────────────────────────

function getDifficulty(s: SessionSettings) {
  let score = 0;
  score += s.digits * 15;
  score += s.numTerms * 5;
  score += s.operations.filter(o => o !== 'mixed').length * 5;
  if (s.timeLimit !== null) score += Math.max(0, (60 - s.timeLimit) / 6);
  if (s.placeValue === 'thousands') score += 20;
  if (s.placeValue === 'hundreds') score += 10;
  if (score <= 25) return { label: 'Easy',   color: 'text-emerald-600 bg-emerald-100' };
  if (score <= 50) return { label: 'Medium',  color: 'text-amber-600 bg-amber-100'   };
  if (score <= 75) return { label: 'Hard',    color: 'text-orange-600 bg-orange-100'  };
  return              { label: 'Expert',  color: 'text-red-600 bg-red-100'       };
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_QUICK: SessionSettings = {
  digits: 2, numTerms: 3, operations: ['+', '-', '×', '÷'],
  timeLimit: null, questionCount: 10, mode: 'quick',
};
const DEFAULT_CHALLENGE: SessionSettings = {
  digits: 4, numTerms: 5, operations: ['+', '-', '×', '÷'],
  timeLimit: 30, questionCount: 20, mode: 'challenge',
};

// ── Toggle button helper ──────────────────────────────────────────────────────

function ToggleBtn({
  active, onClick, disabled, children, className,
}: {
  active: boolean; onClick: () => void; disabled?: boolean;
  children: React.ReactNode; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-3 py-2 rounded-lg text-sm font-semibold transition-all border',
        active
          ? 'bg-[#0F75BC] text-white border-[#0F75BC] shadow-sm'
          : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-[#0F75BC] hover:text-[#0F75BC]',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      {children}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 block mb-3">
      {children}
    </label>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function PracticeSetupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = (searchParams.get('mode') || 'custom') as 'quick' | 'custom' | 'challenge';

  const defaultSettings: SessionSettings =
    mode === 'quick'     ? DEFAULT_QUICK :
    mode === 'challenge' ? DEFAULT_CHALLENGE :
    { digits: 2, numTerms: 3, operations: ['+', '-'], timeLimit: null, questionCount: 10, mode: 'custom' };

  const [settings, setSettings] = useState<SessionSettings>(defaultSettings);

  const isQuick = mode === 'quick';
  const isChallenge = mode === 'challenge';
  const isLocked = isQuick || isChallenge;
  const difficulty = getDifficulty(settings);

  const set = (patch: Partial<SessionSettings>) =>
    setSettings(prev => ({ ...prev, ...patch }));

  const toggleOp = (op: Operation) => {
    setSettings(prev => {
      const has = prev.operations.includes(op);
      if (op === 'mixed') return { ...prev, operations: has ? [] : ['mixed'] };
      let ops = has
        ? prev.operations.filter(o => o !== op)
        : [...prev.operations.filter(o => o !== 'mixed'), op];
      if (ops.length === 0) ops = [op];
      return { ...prev, operations: ops };
    });
  };

  const modeLabel =
    mode === 'quick'     ? 'Quick Practice' :
    mode === 'challenge' ? 'Challenge Mode'  :
    'Custom Training';
  const ModeIcon = mode === 'quick' ? Zap : mode === 'challenge' ? Trophy : Settings2;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center',
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

        {/* ① Session Size */}
        <div>
          <SectionLabel>Session size</SectionLabel>
          <div className="flex gap-3">
            {SESSION_SIZES.map(n => (
              <button
                key={n}
                onClick={() => set({ questionCount: n })}
                disabled={isLocked}
                className={cn(
                  'flex-1 py-4 rounded-xl text-center font-bold text-lg transition-all border-2',
                  settings.questionCount === n
                    ? 'bg-[#0F75BC] text-white border-[#0F75BC] shadow-md scale-105'
                    : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-[#0F75BC]',
                  isLocked && 'opacity-50 cursor-not-allowed scale-100',
                )}
              >
                {n}
                <span className="block text-xs font-normal opacity-70 mt-0.5">questions</span>
              </button>
            ))}
          </div>
        </div>

        {/* ② Number Type */}
        <div>
          <SectionLabel>Number type</SectionLabel>
          <div className="flex gap-2 flex-wrap">
            {NUMBER_TYPES.map(({ value, label, sub }) => (
              <ToggleBtn
                key={String(value)}
                active={settings.numberType === value}
                onClick={() => set({ numberType: value, placeValue: value ? null : settings.placeValue })}
                disabled={isLocked}
              >
                <span>{label}</span>
                {sub && <span className="block text-xs font-normal opacity-70">{sub}</span>}
              </ToggleBtn>
            ))}
          </div>
        </div>

        {/* ③ Place Value */}
        <div>
          <SectionLabel>Place value focus</SectionLabel>
          <div className="flex gap-2 flex-wrap">
            {PLACE_VALUES.map(({ value, label, sub }) => (
              <ToggleBtn
                key={String(value)}
                active={settings.placeValue === value}
                onClick={() => set({ placeValue: value, numberType: value ? null : settings.numberType })}
                disabled={isLocked}
              >
                <span>{label}</span>
                {sub && <span className="block text-xs font-normal opacity-70">{sub}</span>}
              </ToggleBtn>
            ))}
          </div>
        </div>

        {/* ④ Digits (hidden when numberType or placeValue overrides) */}
        {!settings.numberType && !settings.placeValue && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Digits per number</SectionLabel>
              <span className="text-lg font-bold text-[#0F75BC] bg-blue-50 dark:bg-blue-900/20 px-3 py-0.5 rounded-lg">
                {settings.digits}d
              </span>
            </div>
            <input
              type="range" min={1} max={6} step={1}
              value={settings.digits}
              onChange={e => set({ digits: Number(e.target.value) })}
              disabled={isLocked}
              className="w-full accent-[#0F75BC]"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>1 digit (0–9)</span>
              <span>6 digits (100000+)</span>
            </div>
          </div>
        )}

        {/* ⑤ Terms */}
        <div>
          <SectionLabel>Number of terms</SectionLabel>
          <div className="flex gap-2 flex-wrap">
            {TERM_OPTIONS.map(n => (
              <ToggleBtn key={n} active={settings.numTerms === n} onClick={() => set({ numTerms: n })} disabled={isLocked}>
                {n} terms
              </ToggleBtn>
            ))}
          </div>
        </div>

        {/* ⑥ Operations */}
        <div>
          <SectionLabel>Operations</SectionLabel>
          <div className="flex gap-2 flex-wrap">
            {ALL_OPS.map(op => (
              <button
                key={op}
                onClick={() => toggleOp(op)}
                disabled={isLocked}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all border',
                  settings.operations.includes(op)
                    ? 'bg-[#153B5C] text-white border-[#153B5C] shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-[#153B5C]',
                  isLocked && 'opacity-50 cursor-not-allowed'
                )}
              >
                {OP_LABELS[op]}
              </button>
            ))}
          </div>
        </div>

        {/* ⑦ Countdown timer */}
        <div>
          <SectionLabel>Countdown timer per question</SectionLabel>
          <div className="flex gap-2 flex-wrap">
            {TIME_OPTIONS.map(({ label, value }) => (
              <ToggleBtn
                key={label}
                active={settings.timeLimit === value}
                onClick={() => set({ timeLimit: value })}
                disabled={isQuick}
              >
                {label}
              </ToggleBtn>
            ))}
          </div>
        </div>

        {/* Difficulty badge */}
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Estimated difficulty</span>
          </div>
          <span className={cn('text-sm font-bold px-3 py-1 rounded-lg', difficulty.color)}>
            {difficulty.label}
          </span>
        </div>
      </div>

      {/* Start */}
      <button
        onClick={() => { setPendingSession(settings); router.push('/training'); }}
        className="w-full h-14 text-lg font-bold rounded-2xl bg-[#0F75BC] hover:bg-blue-700 text-white shadow-lg transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
      >
        <Zap className="h-5 w-5" />
        Start {settings.questionCount} Questions
      </button>
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
