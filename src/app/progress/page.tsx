'use client';
import { useEffect, useState } from 'react';
import { getSessions, getDailyStats, getCurrentStreak, clearAllData } from '@/lib/storage';
import { TrainingSession, DailyStats } from '@/lib/types';
import { WeakAreasList } from '@/components/progress/WeakAreasList';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Trophy, Target, BookOpen, Flame, Trash2, ChevronLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
      <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">{title}</h2>
      {children}
    </div>
  );
}

const tooltipStyle = {
  contentStyle: { background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 },
};

function MiniChart({ data, dataKey, color, unit = '' }: {
  data: object[]; dataKey: string; color: string; unit?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 5, right: 8, left: -28, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 9 }} />
        <YAxis tick={{ fontSize: 9 }} />
        <Tooltip {...tooltipStyle} formatter={(v) => [`${v}${unit}`]} />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ fill: color, r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function MiniBar({ data, dataKey, color, unit = '' }: {
  data: object[]; dataKey: string; color: string; unit?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 5, right: 8, left: -28, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 9 }} />
        <YAxis tick={{ fontSize: 9 }} />
        <Tooltip {...tooltipStyle} formatter={(v) => [`${v}${unit}`]} />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Improvement insight ───────────────────────────────────────────────────────

function getInsight(sessions: TrainingSession[]): { text: string; trend: 'up' | 'down' | 'flat' } | null {
  if (sessions.length < 4) return null;
  const recent = sessions.slice(-3);
  const older  = sessions.slice(-6, -3);
  if (older.length < 2) return null;

  const recentAcc  = recent.reduce((a, s) => a + s.accuracy, 0) / recent.length;
  const olderAcc   = older.reduce((a, s) => a + s.accuracy, 0)  / older.length;
  const recentSpd  = recent.reduce((a, s) => a + s.avgTime, 0)  / recent.length / 1000;
  const olderSpd   = older.reduce((a, s) => a + s.avgTime, 0)   / older.length  / 1000;
  const accDelta   = recentAcc - olderAcc;
  const spdDelta   = ((olderSpd - recentSpd) / olderSpd) * 100;

  if (accDelta >= 5)
    return { text: `🎯 Accuracy up ${Math.round(accDelta)}% compared to your previous sessions`, trend: 'up' };
  if (spdDelta >= 10)
    return { text: `⚡ Speed improved ${Math.round(spdDelta)}% — you're answering faster`, trend: 'up' };
  if (accDelta <= -5)
    return { text: `📚 Accuracy dipped ${Math.round(-accDelta)}% — slow down and focus`, trend: 'down' };
  if (spdDelta <= -10)
    return { text: `⏱ Taking ${Math.round(-spdDelta)}% longer per question lately`, trend: 'down' };
  return { text: '✨ Steady performance — keep up the consistent practice!', trend: 'flat' };
}

// ── Weakest area ──────────────────────────────────────────────────────────────

function getWeakestOp(sessions: TrainingSession[]): string | null {
  const opStats: Record<string, { correct: number; total: number }> = {};
  for (const s of sessions) {
    for (const r of s.results) {
      const d = r.question.display;
      const op = d.includes('÷') ? '÷' : d.includes('×') ? '×' : d.includes(' - ') ? '-' : '+';
      if (!opStats[op]) opStats[op] = { correct: 0, total: 0 };
      opStats[op].total++;
      if (r.correct) opStats[op].correct++;
    }
  }
  const OP_NAMES: Record<string, string> = { '+': 'Addition', '-': 'Subtraction', '×': 'Multiplication', '÷': 'Division' };
  const areas = Object.entries(opStats)
    .filter(([, { total }]) => total >= 5)
    .map(([op, { correct, total }]) => ({ op, acc: Math.round((correct / total) * 100) }))
    .sort((a, b) => a.acc - b.acc);
  if (!areas.length || areas[0].acc >= 80) return null;
  return `${OP_NAMES[areas[0].op] ?? areas[0].op} (${areas[0].acc}% accuracy)`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

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

  const handleReset = () => {
    clearAllData(); setSessions([]); setDailyStats([]); setCurrentStreak(0); setShowConfirm(false);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#0F75BC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalSessions  = sessions.length;
  const totalQuestions = sessions.reduce((a, s) => a + s.results.length, 0);
  const overallAcc     = totalSessions ? Math.round(sessions.reduce((a, s) => a + s.accuracy, 0) / totalSessions) : 0;
  const bestStreak     = sessions.reduce((m, s) => Math.max(m, s.maxStreak), 0);

  // Chart data
  const last7Days  = dailyStats.slice(-7).map(d => ({
    date:    fmtDate(d.date),
    acc:     Math.round(d.accuracy),
    speed:   +(d.avgTime / 1000).toFixed(1),
    questions: d.questionsAnswered,
  }));
  const last7Sessions = [...sessions].slice(-7).map((s, i) => ({
    session: `#${sessions.length - 6 + i}`,
    score: s.score,
  }));

  const insight   = getInsight(sessions);
  const weakestOp = getWeakestOp(sessions);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#153B5C] dark:text-white">Progress Report</h1>
          <p className="text-sm text-slate-400">{totalSessions} sessions tracked</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Trophy,   color: 'text-amber-500',   val: totalSessions,  label: 'Sessions'  },
          { icon: BookOpen, color: 'text-[#0F75BC]',   val: totalQuestions, label: 'Questions' },
          { icon: Target,   color: 'text-green-500',   val: `${overallAcc}%`, label: 'Accuracy' },
          { icon: Flame,    color: 'text-orange-500',  val: bestStreak,     label: 'Best Streak' },
        ].map(({ icon: Icon, color, val, label }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm text-center">
            <Icon className={cn('h-5 w-5 mx-auto mb-1', color)} />
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{val}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-12 text-center">
          <Target className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-2">No data yet</h3>
          <p className="text-slate-400 text-sm mb-4">Complete some training sessions to see your progress</p>
          <button onClick={() => router.push('/practice?mode=quick')}
            className="px-5 py-2 bg-[#0F75BC] text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
            Start Training
          </button>
        </div>
      ) : (
        <>
          {/* Insight banner */}
          {insight && (
            <div className={cn(
              'flex items-center gap-3 px-5 py-4 rounded-2xl border font-medium text-sm',
              insight.trend === 'up'   ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' :
              insight.trend === 'down' ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400' :
              'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
            )}>
              {insight.trend === 'up'   ? <TrendingUp className="h-5 w-5 shrink-0" /> :
               insight.trend === 'down' ? <TrendingDown className="h-5 w-5 shrink-0" /> :
               <Minus className="h-5 w-5 shrink-0" />}
              {insight.text}
            </div>
          )}

          {/* Weak area focus */}
          {weakestOp && (
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-sm font-medium">
              <span className="text-lg">⚠️</span>
              <span>Focus area: <strong>{weakestOp}</strong> needs more practice</span>
            </div>
          )}

          {/* 4 Charts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ChartCard title="Daily Accuracy %">
              <MiniChart data={last7Days} dataKey="acc" color="#0F75BC" unit="%" />
            </ChartCard>
            <ChartCard title="Avg Time per Question (s)">
              <MiniChart data={last7Days} dataKey="speed" color="#16A34A" unit="s" />
            </ChartCard>
            <ChartCard title="Questions per Day">
              <MiniBar data={last7Days} dataKey="questions" color="#8B5CF6" />
            </ChartCard>
            <ChartCard title="Score per Session (last 7)">
              <MiniBar data={last7Sessions} dataKey="score" color="#F59E0B" />
            </ChartCard>
          </div>

          {/* Weak areas */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">Accuracy by Operation</h2>
            <WeakAreasList sessions={sessions} />
          </div>

          {/* Session history */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Session History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30">
                    {['Date', 'Mode', 'Questions', 'Accuracy', 'Score', 'Avg Time'].map(h => (
                      <th key={h} className={cn('px-4 py-2.5 font-semibold text-slate-500 text-xs', h === 'Date' || h === 'Mode' ? 'text-left' : 'text-right')}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...sessions].reverse().slice(0, 20).map(s => {
                    const d = new Date(s.date);
                    return (
                      <tr key={s.id} className="border-b border-slate-50 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                          {d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                            s.settings.mode === 'quick'     ? 'bg-blue-100 text-blue-700' :
                            s.settings.mode === 'challenge' ? 'bg-orange-100 text-orange-700' :
                            'bg-purple-100 text-purple-700')}>
                            {s.settings.mode}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{s.results.length}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn('font-semibold',
                            s.accuracy >= 80 ? 'text-green-600' : s.accuracy >= 60 ? 'text-amber-600' : 'text-red-500')}>
                            {Math.round(s.accuracy)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-[#0F75BC]">{s.score}</td>
                        <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">
                          {(s.avgTime / 1000).toFixed(1)}s
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

      {/* Reset */}
      <div className="flex justify-end pb-4">
        <button onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 px-4 py-2 text-red-500 border border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 text-sm font-medium transition-colors">
          <Trash2 className="h-4 w-4" />
          Reset All Data
        </button>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset All Data?</DialogTitle>
            <DialogDescription>
              This will permanently delete all training sessions, progress, and statistics.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <button onClick={handleReset} className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors">
              Yes, Delete Everything
            </button>
            <button onClick={() => setShowConfirm(false)} className="flex-1 py-2 border border-slate-200 dark:border-slate-600 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-200">
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
