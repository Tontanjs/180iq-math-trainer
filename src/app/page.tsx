'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap, Settings2, Trophy, BarChart3, Target, Flame, Clock, BookOpen, ChevronRight, Brain } from 'lucide-react';
import { ModeCard } from '@/components/dashboard/ModeCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { getSessions, getTodayStats, getCurrentStreak } from '@/lib/storage';
import { TrainingSession } from '@/lib/types';

export default function Dashboard() {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [todayStats, setTodayStats] = useState({ accuracy: 0, questionsAnswered: 0, avgTime: 0, streak: 0 });
  const [dayStreak, setDayStreak] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const s = getSessions();
    setSessions(s);
    setTodayStats(getTodayStats());
    setDayStreak(getCurrentStreak());
  }, []);

  const totalQuestions = sessions.reduce((acc, s) => acc + s.results.length, 0);
  const overallAccuracy = sessions.length
    ? Math.round(sessions.reduce((acc, s) => acc + s.accuracy, 0) / sessions.length)
    : 0;

  const recentSessions = [...sessions].reverse().slice(0, 5);

  const modes = [
    {
      title: 'Quick Practice',
      description: '10 questions, 2-digit numbers, all operations. Perfect for a quick warm-up.',
      icon: Zap,
      href: '/practice?mode=quick',
      color: 'text-white',
      gradient: 'bg-gradient-to-br from-primary-blue to-blue-600 border-blue-500',
    },
    {
      title: 'Custom Training',
      description: 'Set your own difficulty, operations, time limit, and question count.',
      icon: Settings2,
      href: '/practice?mode=custom',
      color: 'text-white',
      gradient: 'bg-gradient-to-br from-purple-600 to-purple-800 border-purple-500',
    },
    {
      title: 'Challenge Mode',
      description: 'Push your limits with 7+ digit numbers and strict time pressure.',
      icon: Trophy,
      href: '/practice?mode=challenge',
      color: 'text-white',
      gradient: 'bg-gradient-to-br from-orange-500 to-orange-700 border-orange-400',
      badge: 'Hard',
    },
    {
      title: '180IQ Puzzle',
      description: 'Use 4–5 numbers to reach a target. Combine with +, −, ×, ÷ and more.',
      icon: Brain,
      href: '/puzzle',
      color: 'text-white',
      gradient: 'bg-gradient-to-br from-violet-600 to-violet-800 border-violet-500',
      badge: 'New',
    },
    {
      title: 'Progress Report',
      description: 'View charts, accuracy trends, weak areas, and session history.',
      icon: BarChart3,
      href: '/progress',
      color: 'text-white',
      gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-700 border-emerald-400',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2 bg-primary-blue/10 text-primary-blue px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
          <Zap className="h-4 w-4" />
          Mental Math Training
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#153B5C] dark:text-white mb-3 tracking-tight">
          180IQ Mental Math
          <span className="block text-[#0F75BC]">Trainer</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-md mx-auto">
          Master numbers. Sharpen your mind.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link
            href="/practice?mode=quick"
            className="inline-flex items-center gap-2 bg-[#0F75BC] text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:-translate-y-0.5"
          >
            <Zap className="h-4 w-4" />
            Start Training
          </Link>
          <Link
            href="/progress"
            className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-6 py-3 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-600"
          >
            <BarChart3 className="h-4 w-4" />
            View Progress
          </Link>
        </div>
      </div>

      {/* Daily Stats */}
      {mounted && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Today&apos;s Stats
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              title="Accuracy"
              value={`${Math.round(todayStats.accuracy)}%`}
              subtitle="today"
              icon={Target}
              color="blue"
            />
            <StatCard
              title="Day Streak"
              value={dayStreak}
              subtitle="days in a row"
              icon={Flame}
              color="amber"
            />
            <StatCard
              title="Avg Time"
              value={todayStats.avgTime > 0 ? `${(todayStats.avgTime / 1000).toFixed(1)}s` : '—'}
              subtitle="per question"
              icon={Clock}
              color="purple"
            />
            <StatCard
              title="Questions"
              value={totalQuestions}
              subtitle="all time"
              icon={BookOpen}
              color="green"
            />
          </div>
        </div>
      )}

      {/* Mode Cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
          Choose Mode
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modes.map(mode => (
            <ModeCard key={mode.title} {...mode} />
          ))}
        </div>
      </div>

      {/* Recent Sessions */}
      {mounted && recentSessions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Recent Sessions
            </h2>
            <Link href="/progress" className="text-xs text-[#0F75BC] hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            {recentSessions.map((session) => {
              const date = new Date(session.date);
              const ops = session.settings.operations.join(', ');
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between px-4 py-3 border-b border-slate-50 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      session.accuracy >= 80 ? 'bg-green-100 text-green-700' :
                      session.accuracy >= 60 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {Math.round(session.accuracy)}%
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {session.results.length} questions · {session.settings.digits}d · {ops}
                      </p>
                      <p className="text-xs text-slate-400">
                        {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#0F75BC]">{session.score} pts</p>
                    <p className="text-xs text-slate-400">{(session.avgTime / 1000).toFixed(1)}s avg</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Global stats */}
      {mounted && sessions.length > 0 && (
        <div className="bg-gradient-to-r from-[#153B5C] to-[#0F75BC] rounded-2xl p-5 text-white">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">All Time</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-extrabold">{sessions.length}</p>
              <p className="text-xs text-white/60 mt-0.5">Sessions</p>
            </div>
            <div className="text-center border-x border-white/20">
              <p className="text-2xl font-extrabold">{totalQuestions}</p>
              <p className="text-xs text-white/60 mt-0.5">Questions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-extrabold">{overallAccuracy}%</p>
              <p className="text-xs text-white/60 mt-0.5">Accuracy</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
