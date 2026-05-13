'use client';
import { TrainingSession } from '@/lib/types';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface WeakAreasListProps {
  sessions: TrainingSession[];
}

const OP_LABELS: Record<string, string> = {
  '+': 'Addition',
  '-': 'Subtraction',
  '×': 'Multiplication',
  '÷': 'Division',
  'mixed': 'Mixed',
};

export function WeakAreasList({ sessions }: WeakAreasListProps) {
  const opStats: Record<string, { correct: number; total: number }> = {};

  for (const session of sessions) {
    for (const result of session.results) {
      // Detect operation from display
      const display = result.question.display;
      let op = '+';
      if (display.includes('÷')) op = '÷';
      else if (display.includes('×')) op = '×';
      else if (display.includes(' - ')) op = '-';
      else if (display.includes(' + ')) op = '+';

      if (!opStats[op]) opStats[op] = { correct: 0, total: 0 };
      opStats[op].total++;
      if (result.correct) opStats[op].correct++;
    }
  }

  const areas = Object.entries(opStats)
    .map(([op, { correct, total }]) => ({
      op,
      label: OP_LABELS[op] || op,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      total,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);

  if (areas.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 dark:text-slate-500">
        <p className="text-sm">Complete some sessions to see weak areas</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {areas.map(area => (
        <div key={area.op} className="flex items-center gap-3">
          <div className="w-28 text-sm font-medium text-slate-600 dark:text-slate-300 shrink-0">
            {area.label}
          </div>
          <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${area.accuracy}%`,
                backgroundColor: area.accuracy >= 80 ? '#16A34A' : area.accuracy >= 60 ? '#F59E0B' : '#EF4444',
              }}
            />
          </div>
          <div className="flex items-center gap-1 w-16 justify-end shrink-0">
            {area.accuracy >= 70
              ? <TrendingUp className="h-3 w-3 text-success" />
              : <TrendingDown className="h-3 w-3 text-red-500" />
            }
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{area.accuracy}%</span>
          </div>
          <div className="text-xs text-slate-400 w-12 shrink-0">{area.total} q</div>
        </div>
      ))}
    </div>
  );
}
