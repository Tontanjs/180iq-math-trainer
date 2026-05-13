'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSessions } from '@/lib/storage';
import { TrainingSession } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, SkipForward, Trophy, Zap, Clock, RotateCcw, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

function AnimatedCounter({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return <span>{count}</span>;
}

export default function ResultsPage() {
  const router = useRouter();
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const sessions = getSessions();
    if (sessions.length > 0) {
      setSession(sessions[sessions.length - 1]);
    } else {
      router.push('/');
    }
  }, [router]);

  if (!mounted || !session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#0F75BC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { results, score, accuracy, avgTime, maxStreak } = session;
  const correctCount = results.filter(r => r.correct).length;
  const skippedCount = results.filter(r => r.skipped).length;
  const wrongAnswers = results.filter(r => !r.correct && !r.skipped);

  const correctResults = results.filter(r => r.correct);
  const bestQuestion = correctResults.length
    ? correctResults.reduce((a, b) => a.timeTaken < b.timeTaken ? a : b)
    : null;
  const badResults = results.filter(r => !r.correct);
  const worstQuestion = badResults.length
    ? badResults.reduce((a, b) => a.timeTaken > b.timeTaken ? a : b)
    : null;

  const grade =
    accuracy >= 90 ? { label: 'Excellent!', color: 'text-green-600', emoji: '🏆' } :
    accuracy >= 75 ? { label: 'Great Job!', color: 'text-blue-600', emoji: '🎯' } :
    accuracy >= 60 ? { label: 'Good Work', color: 'text-amber-600', emoji: '💪' } :
    { label: 'Keep Practicing', color: 'text-red-500', emoji: '📚' };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Score hero */}
      <div className="text-center py-8 bg-gradient-to-br from-[#153B5C] to-[#0F75BC] rounded-3xl text-white shadow-xl">
        <div className="text-4xl mb-2">{grade.emoji}</div>
        <h1 className="text-xl font-bold text-white/80 mb-1">{grade.label}</h1>
        <div className="text-6xl font-extrabold tracking-tight">
          <AnimatedCounter target={score} />
          <span className="text-2xl font-normal text-white/60 ml-2">pts</span>
        </div>
        <div className="mt-4 flex justify-center gap-6 text-white/70 text-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              <AnimatedCounter target={Math.round(accuracy)} />%
            </p>
            <p className="text-xs mt-0.5">Accuracy</p>
          </div>
          <div className="border-x border-white/20 px-6 text-center">
            <p className="text-2xl font-bold text-white">
              {(avgTime / 1000).toFixed(1)}s
            </p>
            <p className="text-xs mt-0.5">Avg Time</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">
              <AnimatedCounter target={maxStreak} />
            </p>
            <p className="text-xs mt-0.5">Max Streak</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-slate-800 dark:text-white">{correctCount}</p>
          <p className="text-xs text-slate-400">Correct</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
          <XCircle className="h-5 w-5 text-red-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-slate-800 dark:text-white">{wrongAnswers.length}</p>
          <p className="text-xs text-slate-400">Wrong</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
          <SkipForward className="h-5 w-5 text-slate-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-slate-800 dark:text-white">{skippedCount}</p>
          <p className="text-xs text-slate-400">Skipped</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-700 shadow-sm">
          <Trophy className="h-5 w-5 text-amber-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-slate-800 dark:text-white">{results.length}</p>
          <p className="text-xs text-slate-400">Total</p>
        </div>
      </div>

      {/* Best / Worst highlights */}
      {(bestQuestion || worstQuestion) && (
        <div className="grid grid-cols-2 gap-3">
          {bestQuestion && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Fastest Correct</span>
              </div>
              <code className="text-sm font-mono font-bold text-slate-800 dark:text-white block truncate">
                {bestQuestion.question.display} = {bestQuestion.question.answer}
              </code>
              <div className="flex items-center gap-1 mt-1.5 text-emerald-600 dark:text-emerald-400">
                <Clock className="h-3 w-3" />
                <span className="text-xs font-semibold">{(bestQuestion.timeTaken / 1000).toFixed(1)}s</span>
              </div>
            </div>
          )}
          {worstQuestion && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Clock className="h-4 w-4 text-rose-400" />
                <span className="text-xs font-semibold text-rose-500 dark:text-rose-400 uppercase tracking-wide">
                  {worstQuestion.skipped ? 'Skipped' : worstQuestion.timedOut ? 'Timed Out' : 'Slowest Wrong'}
                </span>
              </div>
              <code className="text-sm font-mono font-bold text-slate-800 dark:text-white block truncate">
                {worstQuestion.question.display} = {worstQuestion.question.answer}
              </code>
              <div className="flex items-center gap-1 mt-1.5 text-rose-500 dark:text-rose-400">
                <Clock className="h-3 w-3" />
                <span className="text-xs font-semibold">{(worstQuestion.timeTaken / 1000).toFixed(1)}s</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* All results with review */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
          Question Review
        </h2>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500 dark:text-slate-400 text-xs">#</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500 dark:text-slate-400 text-xs">Question</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-slate-500 dark:text-slate-400 text-xs">Your Answer</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-slate-500 dark:text-slate-400 text-xs">Correct</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-slate-500 dark:text-slate-400 text-xs">Time</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => (
                  <tr
                    key={r.question.id}
                    className={cn(
                      "border-b border-slate-50 dark:border-slate-700 last:border-0",
                      r.correct ? "hover:bg-green-50/30 dark:hover:bg-green-900/10" :
                      r.skipped ? "hover:bg-slate-50 dark:hover:bg-slate-700/30" :
                      "hover:bg-red-50/30 dark:hover:bg-red-900/10"
                    )}
                  >
                    <td className="px-4 py-3 text-slate-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-700 dark:text-slate-200">
                      {r.question.display} = ?
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {r.skipped ? (
                        <span className="text-slate-400 text-xs italic">skipped</span>
                      ) : (
                        <span className={r.correct ? "text-green-600 dark:text-green-400 font-semibold" : "text-red-500 line-through"}>
                          {r.userAnswer || '—'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-700 dark:text-slate-200">
                      {r.question.answer}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-400">
                      {(r.timeTaken / 1000).toFixed(1)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pb-4">
        <Button
          onClick={() => router.push('/practice?mode=' + session.settings.mode)}
          className="flex-1 h-12 bg-[#0F75BC] hover:bg-blue-700 text-white font-semibold rounded-xl"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Play Again
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/')}
          className="flex-1 h-12 rounded-xl"
        >
          <Home className="h-4 w-4 mr-2" />
          Home
        </Button>
      </div>
    </div>
  );
}
