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
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { SkipForward, CheckCircle, Clock, Zap } from 'lucide-react';

type Phase = 'loading' | 'question' | 'feedback' | 'complete';

function calcScore(correct: boolean, skipped: boolean, timeTaken: number, streak: number): number {
  if (skipped) return -10;
  if (!correct) return 0;
  let s = 100;
  if (timeTaken < 3000) s += 30;
  if (streak >= 5) s += 20 * Math.floor(streak / 5);
  return s;
}

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
  const [lastResult, setLastResult] = useState<{ correct: boolean; answer: number } | null>(null);
  const [keyboardTarget, setKeyboardTarget] = useState<'answer' | 'working'>('answer');
  const [injectedKey, setInjectedKey] = useState('');
  const answerRef = useRef<HTMLInputElement>(null);
  const workingRef = useRef<HTMLTextAreaElement>(null);

  // Use a ref to hold the skip function so timer callback can call it
  const handleSkipRef = useRef<() => void>(() => {});

  const currentQuestion = questions[currentIdx];
  const totalQuestions = questions.length;

  // Timer for countdown mode — uses ref so it doesn't need to be in deps
  const handleTimerExpire = useCallback(() => {
    handleSkipRef.current();
  }, []);

  const { timeLeft, running: timerRunning, start: startTimer, reset: resetTimer } = useTimer(
    settings?.timeLimit ?? 60,
    handleTimerExpire
  );

  // Stopwatch for time tracking per question
  const { elapsed, start: startStopwatch, stop: stopStopwatch, reset: resetStopwatch } = useStopwatch();

  useEffect(() => {
    const s = getPendingSession<SessionSettings>();
    if (!s) { router.push('/practice'); return; }
    setSettings(s);
    const qs = generateQuestions(s);
    setQuestions(qs);
    setPhase('question');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase === 'question' && questions.length > 0) {
      setAnswer('');
      setSteps([]);
      resetStopwatch();
      startStopwatch();
      if (settings?.timeLimit) {
        resetTimer();
        startTimer();
      }
      setTimeout(() => answerRef.current?.focus(), 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIdx]);

  const finishSession = useCallback((finalResults: QuestionResult[], finalScore: number, finalMaxStreak: number) => {
    clearPendingSession();
    const correctRes = finalResults.filter(r => r.correct).length;
    const totalRes = finalResults.length;
    const accuracy = totalRes > 0 ? (correctRes / totalRes) * 100 : 0;
    const avgTime = totalRes > 0
      ? finalResults.reduce((a, r) => a + r.timeTaken, 0) / totalRes
      : 0;

    const session: TrainingSession = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      settings: settings!,
      results: finalResults,
      score: finalScore,
      accuracy,
      avgTime,
      maxStreak: finalMaxStreak,
    };
    saveSession(session);
    router.push('/results');
  }, [settings, router]);

  const handleSubmit = useCallback(() => {
    if (!currentQuestion || phase !== 'question') return;
    stopStopwatch();
    const timeTaken = elapsed;
    const parsed = evaluateExpression(answer);
    const correct = parsed !== null && Math.abs(parsed - currentQuestion.answer) < 0.01;

    const newStreak = correct ? streak + 1 : 0;
    const newMaxStreak = Math.max(maxStreak, newStreak);
    const pts = calcScore(correct, false, timeTaken, streak);
    const newScore = score + pts;
    const newCorrect = correctCount + (correct ? 1 : 0);

    const result: QuestionResult = {
      question: currentQuestion,
      userAnswer: answer,
      correct,
      timeTaken,
      skipped: false,
      steps,
    };

    const newResults = [...results, result];

    setStreak(newStreak);
    setMaxStreak(newMaxStreak);
    setScore(newScore);
    setCorrectCount(newCorrect);
    setLastResult({ correct, answer: currentQuestion.answer });
    setResults(newResults);
    setPhase('feedback');

    setTimeout(() => {
      if (currentIdx + 1 >= totalQuestions) {
        finishSession(newResults, newScore, newMaxStreak);
      } else {
        setCurrentIdx(i => i + 1);
        setPhase('question');
        setLastResult(null);
      }
    }, 1200);
  }, [currentQuestion, phase, stopStopwatch, elapsed, answer, streak, maxStreak, score, correctCount, results, steps, currentIdx, totalQuestions, finishSession]);

  const handleSkip = useCallback(() => {
    if (!currentQuestion || phase !== 'question') return;
    stopStopwatch();
    const timeTaken = elapsed;

    const result: QuestionResult = {
      question: currentQuestion,
      userAnswer: answer,
      correct: false,
      timeTaken,
      skipped: true,
      steps,
    };

    const newStreak = 0;
    const newResults = [...results, result];
    const newScore = Math.max(0, score - 10);

    setStreak(newStreak);
    setScore(newScore);
    setLastResult({ correct: false, answer: currentQuestion.answer });
    setResults(newResults);
    setPhase('feedback');

    setTimeout(() => {
      if (currentIdx + 1 >= totalQuestions) {
        finishSession(newResults, newScore, maxStreak);
      } else {
        setCurrentIdx(i => i + 1);
        setPhase('question');
        setLastResult(null);
      }
    }, 1200);
  }, [currentQuestion, phase, stopStopwatch, elapsed, answer, steps, results, score, currentIdx, totalQuestions, finishSession, maxStreak]);

  // Keep skip ref up to date
  useEffect(() => {
    handleSkipRef.current = handleSkip;
  }, [handleSkip]);

  const handleKeyboard = (key: string) => {
    if (key === 'BACKSPACE') {
      if (keyboardTarget === 'answer') {
        setAnswer(prev => prev.slice(0, -1));
      } else {
        setInjectedKey('BACKSPACE');
      }
    } else {
      if (keyboardTarget === 'answer') {
        setAnswer(prev => prev + key);
      } else {
        setInjectedKey(key);
      }
    }
  };

  const handleKeyboardSubmit = () => handleSubmit();

  const progressPct = totalQuestions > 0 ? (currentIdx / totalQuestions) * 100 : 0;

  if (phase === 'loading' || !settings || !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#0F75BC] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400">Preparing questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Top bar: progress + score */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Question {currentIdx + 1} of {totalQuestions}</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>
        <ScorePanel score={score} streak={streak} correct={correctCount} total={currentIdx} />
      </div>

      {/* Timer */}
      {settings.timeLimit && (
        <div className={cn(
          "flex items-center gap-2 justify-center px-4 py-2 rounded-xl text-sm font-bold transition-colors",
          timeLeft <= 10
            ? "bg-red-100 dark:bg-red-900/20 text-red-600"
            : timeLeft <= 30
            ? "bg-amber-100 dark:bg-amber-900/20 text-amber-600"
            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
        )}>
          <Clock className="h-4 w-4" />
          <span>{timeLeft}s</span>
          {timerRunning && (
            <div className="flex-1 max-w-32 bg-white/50 dark:bg-slate-700/50 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full transition-all duration-1000"
                style={{
                  width: `${(timeLeft / settings.timeLimit!) * 100}%`,
                  backgroundColor: timeLeft <= 10 ? '#EF4444' : timeLeft <= 30 ? '#F59E0B' : '#0F75BC',
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Question */}
      <div className={cn(
        "transition-all duration-300",
        phase === 'feedback' ? "opacity-70 scale-[0.98]" : "opacity-100 scale-100"
      )}>
        <QuestionDisplay
          question={currentQuestion}
          questionNumber={currentIdx + 1}
          totalQuestions={totalQuestions}
        />
      </div>

      {/* Feedback overlay */}
      {phase === 'feedback' && lastResult && (
        <div className={cn(
          "text-center py-3 px-6 rounded-2xl font-bold text-lg",
          lastResult.correct
            ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
            : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
        )}>
          {lastResult.correct
            ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Correct! +{calcScore(true, false, elapsed, streak - 1)} pts
              </span>
            )
            : <span>✗ Answer was: <strong>{lastResult.answer}</strong></span>
          }
        </div>
      )}

      {/* Answer Input */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 space-y-4">
        {/* Working area */}
        <SmartWorkingArea
          onStepsChange={setSteps}
          externalInput={keyboardTarget === 'working' ? injectedKey : ''}
          onExternalInputConsumed={() => setInjectedKey('')}
          textareaRef={workingRef}
        />

        {/* Answer box */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => { setKeyboardTarget('answer'); answerRef.current?.focus(); }}
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-md transition-colors",
                keyboardTarget === 'answer'
                  ? "bg-[#0F75BC] text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-500"
              )}
            >
              Answer
            </button>
            <button
              onClick={() => { setKeyboardTarget('working'); workingRef.current?.focus(); }}
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-md transition-colors",
                keyboardTarget === 'working'
                  ? "bg-[#0F75BC] text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-500"
              )}
            >
              Working
            </button>
          </div>
          <div className="flex gap-2">
            <input
              ref={answerRef}
              type="text"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              onFocus={() => setKeyboardTarget('answer')}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSubmit();
              }}
              placeholder="Your answer..."
              className={cn(
                "flex-1 text-2xl font-bold px-4 py-3 rounded-xl border-2 outline-none transition-all",
                "bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder:text-slate-300",
                phase === 'feedback'
                  ? lastResult?.correct
                    ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                    : "border-red-400 bg-red-50 dark:bg-red-900/20"
                  : "border-slate-200 dark:border-slate-600 focus:border-[#0F75BC]"
              )}
              disabled={phase === 'feedback'}
            />
            <Button
              onClick={handleSubmit}
              disabled={phase === 'feedback' || !answer.trim()}
              className="px-5 h-auto rounded-xl bg-[#0F75BC] hover:bg-blue-700 text-white font-bold text-base"
            >
              <Zap className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Skip */}
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            disabled={phase === 'feedback'}
            className="text-slate-400 hover:text-red-500 text-xs"
          >
            <SkipForward className="h-3.5 w-3.5 mr-1" />
            Skip (−10 pts)
          </Button>
          <div className="text-xs text-slate-400">
            {streak >= 3 && <span className="text-orange-500 font-semibold">🔥 {streak} streak!</span>}
          </div>
        </div>
      </div>

      {/* Math Keyboard */}
      <MathKeyboard onKey={handleKeyboard} onSubmit={handleKeyboardSubmit} />
    </div>
  );
}
