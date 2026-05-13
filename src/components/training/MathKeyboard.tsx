'use client';
import { cn } from '@/lib/utils';
import { Delete } from 'lucide-react';

interface MathKeyboardProps {
  onKey: (key: string) => void;
  onSubmit?: () => void;
}

const NUMBER_KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0'];
const OPERATOR_KEYS = ['+', '-', '×', '÷', '^', '!', '(', ')'];

export function MathKeyboard({ onKey, onSubmit }: MathKeyboardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-3 shadow-sm">
      <div className="text-xs text-slate-400 dark:text-slate-500 text-center mb-2 font-medium uppercase tracking-wide">
        Math Keyboard
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {/* Numbers - 3 per row */}
        <div className="col-span-3 grid grid-cols-3 gap-1.5">
          {NUMBER_KEYS.map(key => (
            <button
              key={key}
              onClick={() => onKey(key)}
              className={cn(
                "h-10 rounded-lg font-semibold text-sm transition-all active:scale-95",
                "bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600",
                "text-slate-700 dark:text-white hover:bg-primary-blue hover:text-white hover:border-primary-blue",
                key === '0' && 'col-span-1'
              )}
            >
              {key}
            </button>
          ))}
          {/* Backspace */}
          <button
            onClick={() => onKey('BACKSPACE')}
            className={cn(
              "h-10 rounded-lg font-semibold text-sm transition-all active:scale-95",
              "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800",
              "text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500",
              "flex items-center justify-center"
            )}
          >
            <Delete className="h-4 w-4" />
          </button>
          {/* Submit / equals */}
          <button
            onClick={onSubmit}
            className={cn(
              "h-10 rounded-lg font-bold text-sm transition-all active:scale-95",
              "bg-success border border-success",
              "text-white hover:bg-green-600",
              "flex items-center justify-center"
            )}
          >
            ✓
          </button>
        </div>

        {/* Operators */}
        <div className="col-span-2 grid grid-cols-2 gap-1.5">
          {OPERATOR_KEYS.map(key => (
            <button
              key={key}
              onClick={() => onKey(key)}
              className={cn(
                "h-10 rounded-lg font-bold text-sm transition-all active:scale-95",
                "bg-dark-navy dark:bg-slate-600 border border-dark-navy dark:border-slate-500",
                "text-white hover:bg-primary-blue hover:border-primary-blue"
              )}
            >
              {key}
            </button>
          ))}
          {/* Dot and space */}
          <button
            onClick={() => onKey('.')}
            className={cn(
              "h-10 rounded-lg font-bold text-sm transition-all active:scale-95",
              "bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600",
              "text-slate-700 dark:text-white hover:bg-primary-blue hover:text-white"
            )}
          >
            .
          </button>
          <button
            onClick={() => onKey('=')}
            className={cn(
              "h-10 rounded-lg font-bold text-sm transition-all active:scale-95",
              "bg-primary-blue/10 dark:bg-primary-blue/20 border border-primary-blue/30",
              "text-primary-blue hover:bg-primary-blue hover:text-white"
            )}
          >
            =
          </button>
        </div>
      </div>
    </div>
  );
}
