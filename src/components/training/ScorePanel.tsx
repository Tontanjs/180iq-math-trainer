'use client';
import { Flame, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScorePanelProps {
  score: number;
  streak: number;
  correct: number;
  total: number;
}

export function ScorePanel({ score, streak, correct, total }: ScorePanelProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap justify-end">
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-3 py-2 shadow-sm flex items-center gap-2">
        <Star className="h-4 w-4 text-warning fill-warning" />
        <span className="font-bold text-slate-800 dark:text-white">{score}</span>
        <span className="text-xs text-slate-400">pts</span>
      </div>
      <div className={cn(
        "rounded-xl px-3 py-2 shadow-sm flex items-center gap-2",
        streak >= 3
          ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700"
          : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
      )}>
        <Flame className={cn("h-4 w-4", streak >= 3 ? "text-orange-500 fill-orange-400" : "text-slate-400")} />
        <span className={cn("font-bold", streak >= 3 ? "text-orange-600 dark:text-orange-400" : "text-slate-800 dark:text-white")}>
          {streak}
        </span>
        <span className="text-xs text-slate-400">streak</span>
      </div>
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-3 py-2 shadow-sm">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          <span className="text-success font-bold">{correct}</span>
          <span className="text-slate-400">/{total}</span>
        </span>
      </div>
    </div>
  );
}
