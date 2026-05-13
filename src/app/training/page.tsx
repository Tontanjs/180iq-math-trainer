'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SessionSettings, Question, QuestionResult, WorkingStep, TrainingSession } from '@/lib/types';
import { getPendingSession, clearPendingSession, saveSession } from '@/lib/storage';
import { generateQuestions } from '@/lib/questionGenerator';
import { evaluateExpression } from '@/lib/mathParser';
import { useTimer, useStopwatch } from '@/hooks/useTimer';
import { QuestionDisplay } from '@/components/training/QuestionDisplay';
import { SmartWorkingArea } from '@/components/training/SmartWorkingArea';
import { MathKeyboard } from '@/components/training/MathKeyboard';
import { ScorePanel } from '@/components/training/ScorePanel';
import { cn } from '@/lib/utils';
import { SkipForward, CheckCircle, Zap } from 'lucide-react';

type Phase = 'loading' | 'question' | 'feedback' | 'complete';
type FeedbackKind = 'correct' | 'wrong' | 'skipped' | 'timeout';

function calcScore(correct: boolean, skipped: boolean, timedOut: boolean, timeTaken: number, streak: number): number {
  if (skipped) return -10;
  if (timedOut || !correct) return 0;
  let s = 100;
  if (timeTaken < 3000) s += 30;
  if (streak >= 5) s += 20 * Math.floor(streak / 5);
  return s;
}

// ── Countdown ring ────────────────────────────────────────────────────────────

function CountdownRing({ timeLeft, totalTime }: { timeLeft: number; totalTime: number }) {
  const R = 26;
  const circ = 2 * Math.PI * R;
  const pct = Math.max(0, timeLeft / totalTime);
  const color = timeLeft <= 5 ? '#EF4444' : timeLeft <= Math.ceil(totalTime * 0.33) ? '#F59E0B' : '#0F75BC';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="72" height="72" className="-rotate-90" aria-hidden>
        <circle cx="36" cy="36" r={R} fill="none" stroke="#e2e8f0" strokeWidth="5" className="dark:stroke-slate-700" />
        <circle
          cx="36" cy="36" r={R} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={circ}
          strokeDashoffset={circ - circ * pct}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
        />
      </svg>
      <span className={cn(
        'absolute text-xl font-extrabold tabular-nums',
        timeLeft <= 5 ? 'text-red-500' : timeLeft <= Math.ceil(totalTime * 0.33) ? 'text-amber-500' : 'text-[#153B5C] dark:text-white'
      )}>
        {timeLeft}
      </span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TrainingPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SessionSettings | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [phase, setPhase] = useState<Phase>('loading');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [steps, setSteps] = useState<WorkingStep[]>([]);
  const [feedbackKind, setFeedbackKind] = useState<FeedbackKind | null>(null);
  const [feedbackAnswer, setFeedbackAnswer] = useState<number | null>(null);
  const [keyboardTarget, setKeyboardTarget] = useState<'answer' | 'working'>('answer');
  const [injectedKey, setInjectedKey] = useState('');
  const answerRef = useRef<HTMLInputElement>(null);
  const workingRef = useRef<HTMLTextAreaElement>(null);
  const handleSkipRef = useRef<() => void>(() => {});
  const handleTimeUpRef = useRef<() => void>(() => {});

  const currentQuestion = questions[currentIdx];
  const totalQuestions = questions.length;
  const progressPct = totalQuestions > 0 ? ((currentIdx) / totalQuestions) * 100 : 0;

  const handleTimerExpire = useCallback(() => { handleTimeUpRef.current(); }, []);

  const { timeLeft, running: timerRunning, start: startTimer, reset: resetTimer } = useTimer(
    settings?.timeLimit ?? 30,
    handleTimerExpire
  );
  const { elapsed, start: startStopwatch, stop: stopStopwatch, reset: resetStopwatch } = useStopwatch();

  useEffect(() => {
    const s = getPendingSession<SessionSettings>();
    if (!s) { router.push('/practice'); return; }
    setSettings(s);
    setQuestions(generateQuestions(s));
    setPhase('question');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase === 'question' && questions.length > 0) {
      setAnswer('');
      setSteps([]);
      setFeedbackKind(null);
      resetStopwatch();
      startStopwatch();
      if (settings?.timeLimit) { resetTimer(); startTimer(); }
      setTimeout(() => answerRef.current?.focus(), 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIdx]);

  const finishSession = useCallback((finalResults: QuestionResult[], finalScore: number, finalMaxStreak: number) => {
    clearPendingSession();
    const correctRes = finalResults.filter(r => r.correct).length;
    const total = finalResults.length;
    const session: TrainingSession = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      settings: settings!,
      results: finalResults,
      score: finalScore,
      accuracy: total > 0 ? (correctRes / total) * 100 : 0,
      avgTime: total > 0 ? finalResults.reduce((a, r) => a + r.timeTaken, 0) / total : 0,
      maxStreak: finalMaxStreak,
    };
    saveSession(session);
    router.push('/results');
  }, [settings, router]);

  const advance = useCallback((newResults: QuestionResult[], newScore: number, newMaxStreak: number) => {
    setTimeout(() => {
      if (currentIdx + 1 >= totalQuestions) {
        finishSession(newResults, newScore, newMaxStreak);
      } else {
        setCurrentIdx(i => i + 1);
        setPhase('question');
        setFeedbackKind(null);
      }
    }, 1400);
  }, [currentIdx, totalQuestions, finishSession]);

  const handleSubmit = useCallback(() => {
    if (!currentQuestion || phase !== 'question') return;
    stopStopwatch();
    const timeTaken = elapsed;
    const parsed = evaluateExpression(answer);
    const correct = parsed !== null && Math.abs(parsed - currentQuestion.answer) < 0.01;
    const newStreak = correct ? streak + 1 : 0;
    const newMaxStreak = Math.max(maxStreak, newStreak);
    const pts = calcScore(correct, false, false, timeTaken, streak);
    const newScore = score + pts;
    const result: QuestionResult = { question: currentQuestion, userAnswer: answer, correct, timeTaken, skipped: false, steps };
    const newResults = [...results, result];

    setStreak(newStreak);
    setMaxStreak(newMaxStreak);
    setScore(newScore);
    setCorrectCount(c => c + (correct ? 1 : 0));
    setFeedbackKind(correct ? 'correct' : 'wrong');
    setFeedbackAnswer(currentQuestion.answer);
    setResults(newResults);
    setPhase('feedback');
    advance(newResults, newScore, newMaxStreak);
  }, [currentQuestion, phase, stopStopwatch, elapsed, answer, streak, maxStreak, score, results, steps, advance]);

  const handleSkip = useCallback(() => {
    if (!currentQuestion || phase !== 'question') return;
    stopStopwatch();
    const result: QuestionResult = {
      question: currentQuestion, userAnswer: answer,
      correct: false, timeTaken: elapsed, skipped: true, steps,
    };
    const newScore = Math.max(0, score - 10);
    const newResults = [...results, result];
    setStreak(0);
    setScore(newScore);
    setFeedbackKind('skipped');
    setFeedbackAnswer(currentQuestion.answer);
    setResults(newResults);
    setPhase('feedback');
    advance(newResults, newScore, maxStreak);
  }, [currentQuestion, phase, stopStopwatch, elapsed, answer, steps, results, score, maxStreak, advance]);

  const handleTimeUp = useCallback(() => {
    if (!currentQuestion || phase !== 'question') return;
    stopStopwatch();
    const result: QuestionResult = {
      question: currentQuestion, userAnswer: answer,
      correct: false, timeTaken: elapsed, skipped: false, timedOut: true, steps,
    };
    const newResults = [...results, result];
    setStreak(0);
    setFeedbackKind('timeout');
    setFeedbackAnswer(currentQuestion.answer);
    setResults(newResults);
    setPhase('feedback');
    advance(newResults, score, maxStreak);
  }, [currentQuestion, phase, stopStopwatch, elapsed, answer, steps, results, score, maxStreak, advance]);

  useEffect(() => { handleSkipRef.current = handleSkip; }, [handleSkip]);
  useEffect(() => { handleTimeUpRef.current = handleTimeUp; }, [handleTimeUp]);

  const handleKeyboard = (key: string) => {
    if (key === 'BACKSPACE') {
      if (keyboardTarget === 'answer') setAnswer(p => p.slice(0, -1));
      else setInjectedKey('BACKSPACE');
    } else {
      if (keyboardTarget === 'answer') setAnswer(p => p + key);
      else setInjectedKey(key);
    }
  };

  if (phase === 'loading' || !settings || !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#0F75BC] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400">Preparing questions…</p>
        </div>
      </div>
    );
  }

  const feedbackColors: Record<FeedbackKind, string> = {
    correct: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
    wrong:   'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
    skipped: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
    timeout: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold">Question {currentIdx + 1} / {totalQuestions}</span>
          <ScorePanel score={score} streak={streak} correct={correctCount} total={currentIdx} />
        </div>
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0F75BC] rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {/* Per-question dots */}
        <div className="flex gap-0.5 overflow-hidden">
          {questions.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors duration-300',
                i < results.length
                  ? results[i]?.correct ? 'bg-emerald-400' : results[i]?.timedOut ? 'bg-amber-400' : results[i]?.skipped ? 'bg-slate-300' : 'bg-red-400'
                  : i === currentIdx ? 'bg-[#0F75BC]' : 'bg-slate-100 dark:bg-slate-800'
              )}
            />
          ))}
        </div>
      </div>

      {/* Countdown ring (centered, shown when timer active) */}
      {settings.timeLimit && (
        <div className="flex items-center justify-center">
          <CountdownRing
            timeLeft={timerRunning || phase === 'question' ? timeLeft : 0}
            totalTime={settings.timeLimit}
          />
        </div>
      )}

      {/* Question */}
      <div className={cn('transition-all duration-300', phase === 'feedback' ? 'opacity-70 scale-[0.98]' : '')}>
        <QuestionDisplay question={currentQuestion} questionNumber={currentIdx + 1} totalQuestions={totalQuestions} />
      </div>

      {/* Feedback */}
      {phase === 'feedback' && feedbackKind && (
        <div className={cn('text-center py-3 px-6 rounded-2xl font-bold text-lg', feedbackColors[feedbackKind])}>
          {feedbackKind === 'correct' && (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Correct! +{calcScore(true, false, false, elapsed, streak - 1)} pts
            </span>
          )}
          {feedbackKind === 'wrong' && (
            <span>✗ Answer was: <strong>{feedbackAnswer}</strong></span>
          )}
          {feedbackKind === 'skipped' && (
            <span>Skipped — answer: <strong>{feedbackAnswer}</strong></span>
          )}
          {feedbackKind === 'timeout' && (
            <span>⏱ Time&apos;s Up! Answer: <strong>{feedbackAnswer}</strong></span>
          )}
        </div>
      )}

      {/* Input area */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 space-y-4">
        <SmartWorkingArea
          onStepsChange={setSteps}
          externalInput={keyboardTarget === 'working' ? injectedKey : ''}
          onExternalInputConsumed={() => setInjectedKey('')}
          textareaRef={workingRef}
        />

        <div>
          <div className="flex items-center gap-2 mb-2">
            {(['answer', 'working'] as const).map(t => (
              <button key={t} onClick={() => { setKeyboardTarget(t); (t === 'answer' ? answerRef : workingRef).current?.focus(); }}
                className={cn('text-xs font-semibold px-2 py-0.5 rounded-md capitalize transition-colors',
                  keyboardTarget === t ? 'bg-[#0F75BC] text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500')}
              >{t}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              ref={answerRef}
              type="text"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              onFocus={() => setKeyboardTarget('answer')}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
              placeholder="Your answer…"
              className={cn(
                'flex-1 text-2xl font-bold px-4 py-3 rounded-xl border-2 outline-none transition-all',
                'bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder:text-slate-300',
                phase === 'feedback'
                  ? feedbackKind === 'correct'
                    ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                    : feedbackKind === 'timeout'
                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-red-400 bg-red-50 dark:bg-red-900/20'
                  : 'border-slate-200 dark:border-slate-600 focus:border-[#0F75BC]'
              )}
              disabled={phase === 'feedback'}
            />
            <button
              onClick={handleSubmit}
              disabled={phase === 'feedback' || !answer.trim()}
              className="px-5 rounded-xl bg-[#0F75BC] hover:bg-blue-700 disabled:opacity-40 text-white font-bold transition-colors"
            >
              <Zap className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={handleSkip}
            disabled={phase === 'feedback'}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 disabled:opacity-40 transition-colors"
          >
            <SkipForward className="h-3.5 w-3.5" />
            Skip (−10 pts)
          </button>
          <div className="text-xs text-slate-400">
            {streak >= 3 && <span className="text-orange-500 font-semibold">🔥 {streak} streak!</span>}
          </div>
        </div>
      </div>

      <MathKeyboard onKey={handleKeyboard} onSubmit={handleSubmit} />
    </div>
  );
}
