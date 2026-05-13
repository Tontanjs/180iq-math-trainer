'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import { DailyStats } from '@/lib/types';

interface WeeklyChartProps {
  data: DailyStats[];
  type?: 'bar' | 'line';
  dataKey?: string;
  color?: string;
  label?: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
}

export function WeeklyChart({
  data,
  type = 'bar',
  dataKey = 'accuracy',
  color = '#0F75BC',
  label = 'Accuracy %',
}: WeeklyChartProps) {
  const chartData = data.map(d => ({
    ...d,
    date: formatDate(d.date),
    avgTimeSec: Math.round(d.avgTime / 1000),
  }));

  const CustomTooltip = ({ active, payload, label: tooltipLabel }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 shadow-lg text-sm">
          <p className="font-medium text-slate-600 dark:text-slate-300">{tooltipLabel}</p>
          <p className="font-bold text-primary-blue">
            {payload[0].value}
            {dataKey === 'accuracy' ? '%' : dataKey === 'avgTimeSec' ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  if (type === 'line') {
    return (
      <div className="w-full h-48">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">{label}</p>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ fill: color, r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full h-48">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">{label}</p>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
