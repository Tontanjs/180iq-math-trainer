import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'amber' | 'purple';
  className?: string;
}

const colorMap = {
  blue: 'bg-blue-50 dark:bg-blue-900/20 text-primary-blue',
  green: 'bg-green-50 dark:bg-green-900/20 text-success',
  amber: 'bg-amber-50 dark:bg-amber-900/20 text-warning',
  purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
};

export function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', className }: StatCardProps) {
  return (
    <div className={cn(
      "bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm",
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorMap[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
