'use client';
import { useEffect, useState } from 'react';
import { getSessions, getDailyStats, getCurrentStreak, clearAllData } from '@/lib/storage';
import { TrainingSession, DailyStats } from '@/lib/types';
import { WeeklyChart } from '@/components/progress/WeeklyChart';
import { WeakAreasList } from '@/components/progress/WeakAreasList';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Trophy, Target, BookOpen, Flame, Trash2, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProgressPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSessions(getSessions());
    setDailyStats(getDailyStats());
    setCurrentStreak(getCurrentStreak());
  }, []);

  const last7Days = dailyStats.slice(-7);
  const last7WithAvgTime = last7Days.map(d => ({ ...d, avgTimeSec: Math.round(d.avgTime / 1000) }));

  const totalSessions = sessions.length;
  const totalQuestions = sessions.reduce((acc, s) => acc + s.results.length, 0);
  const overallAccuracy = sessions.length
    ? Math.round(sessions.reduce((acc, s) => acc + s.accuracy, 0) / sessions.length)
    : 0;
  const bestStreak = sessions.reduce((max, s) => Math.max(max, s.maxStreak), 0);

  const handleReset = () => {
    clearAllData();
    setSessions([]);
    setDailyStats([]);
    setCurrentStreak(0);
    setShowConfirm(false);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#0F75BC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="rounded-full">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#153B5C] dark:text-white">Progress Report</h1>
          <p className="text-sm text-slate-400">{totalSessions} sessions tracked</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm text-center">
          <Trophy className="h-5 w-5 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalSessions}</p>
          <p className="text-xs text-slate-400 mt-0.5">Sessions</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm text-center">
          <BookOpen className="h-5 w-5 text-[#0F75BC] mx-auto mb-1" />
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalQuestions}</p>
          <p className="text-xs text-slate-400 mt-0.5">Questions</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm text-center">
          <Target className="h-5 w-5 text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{overallAccuracy}%</p>
          <p className="text-xs text-slate-400 mt-0.5">Accuracy</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm text-center">
          <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{bestStreak}</p>
          <p className="text-xs text-slate-400 mt-0.5">Best Streak</p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-2">No data yet</h3>
          <p className="text-slate-400 text-sm mb-4">Complete some training sessions to see your progress</p>
          <Button onClick={() => router.push('/practice?mode=quick')} className="bg-[#0F75BC] text-white hover:bg-blue-700">
            Start Training
          </Button>
        </div>
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">Weekly Accuracy</h2>
              <WeeklyChart
                data={last7Days}
                type="bar"
                dataKey="accuracy"
                color="#0F75BC"
                label=""
              />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">Speed Trend (seconds)</h2>
              <WeeklyChart
                data={last7WithAvgTime}
                type="line"
                dataKey="avgTimeSec"
                color="#16A34A"
                label=""
              />
            </div>
          </div>

          {/* Weak Areas */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">Accuracy by Operation</h2>
            <WeakAreasList sessions={sessions} />
          </div>

          {/* Recent sessions table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Session History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30">
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-500 text-xs">Date</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-500 text-xs">Mode</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-slate-500 text-xs">Questions</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-slate-500 text-xs">Accuracy</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-slate-500 text-xs">Score</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-slate-500 text-xs">Avg Time</th>
                  </tr>
                </thead>
                <tbody>
                  {[...sessions].reverse().slice(0, 20).map(session => {
                    const date = new Date(session.date);
                    return (
                      <tr key={session.id} className="border-b border-slate-50 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                          {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            session.settings.mode === 'quick' ? 'bg-blue-100 text-blue-700' :
                            session.settings.mode === 'challenge' ? 'bg-orange-100 text-orange-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {session.settings.mode}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{session.results.length}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${
                            session.accuracy >= 80 ? 'text-green-600' :
                            session.accuracy >= 60 ? 'text-amber-600' :
                            'text-red-500'
                          }`}>
                            {Math.round(session.accuracy)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-[#0F75BC]">{session.score}</td>
                        <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">
                          {(session.avgTime / 1000).toFixed(1)}s
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Reset button */}
      <div className="flex justify-end pb-4">
        <Button
          variant="outline"
          onClick={() => setShowConfirm(true)}
          className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Reset All Data
        </Button>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset All Data?</DialogTitle>
            <DialogDescription>
              This will permanently delete all your training sessions, progress, and statistics. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              onClick={handleReset}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              Yes, Delete Everything
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
