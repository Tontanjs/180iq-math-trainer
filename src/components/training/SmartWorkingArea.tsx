'use client';
import { useState, useRef, KeyboardEvent } from 'react';
import { parseAndValidateStep } from '@/lib/mathParser';
import { WorkingStep } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle } from 'lucide-react';

interface SmartWorkingAreaProps {
  onStepsChange?: (steps: WorkingStep[]) => void;
  externalInput?: string;
  onExternalInputConsumed?: () => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export function SmartWorkingArea({
  onStepsChange,
  externalInput,
  onExternalInputConsumed,
  textareaRef: externalRef,
}: SmartWorkingAreaProps) {
  const [steps, setSteps] = useState<WorkingStep[]>([]);
  const [currentLine, setCurrentLine] = useState('');
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef || internalRef;

  // Handle external keyboard injections
  const prevExternalInput = useRef('');
  if (externalInput && externalInput !== prevExternalInput.current) {
    prevExternalInput.current = externalInput;
    if (externalInput === 'BACKSPACE') {
      setCurrentLine(prev => prev.slice(0, -1));
    } else {
      setCurrentLine(prev => prev + externalInput);
    }
    onExternalInputConsumed?.();
  }

  const submitLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const result = parseAndValidateStep(trimmed);
    const newSteps = [...steps, result];
    setSteps(newSteps);
    setCurrentLine('');
    onStepsChange?.(newSteps);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitLine(currentLine);
    }
  };

  return (
    <div className="w-full">
      <div className="text-xs text-slate-400 dark:text-slate-500 mb-2 font-medium uppercase tracking-wide">
        Working Area <span className="normal-case font-normal">(press Enter to validate each step)</span>
      </div>

      {/* Completed steps chips */}
      {steps.length > 0 && (
        <div className="mb-2 flex flex-col gap-1">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-mono border",
                step.isValid === true
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300"
                  : step.isValid === false
                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
                  : "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
              )}
            >
              {step.isValid === true && <CheckCircle2 className="h-4 w-4 text-success shrink-0" />}
              {step.isValid === false && <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
              <span className="flex-1">{step.input}</span>
              <span className={cn(
                "text-xs",
                step.isValid === true ? "text-green-600 dark:text-green-400" : "text-red-500"
              )}>
                {step.feedback}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <textarea
        ref={textareaRef as React.RefObject<HTMLTextAreaElement>}
        value={currentLine}
        onChange={e => setCurrentLine(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a step, e.g. 37 × 2 = 74, then press Enter..."
        rows={2}
        className={cn(
          "w-full resize-none font-mono text-sm px-3 py-2 rounded-lg border outline-none transition-colors",
          "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600",
          "text-slate-800 dark:text-white placeholder:text-slate-400",
          "focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
        )}
      />

      {steps.length > 0 && (
        <button
          onClick={() => { setSteps([]); setCurrentLine(''); onStepsChange?.([]); }}
          className="text-xs text-slate-400 hover:text-red-500 mt-1 transition-colors"
        >
          Clear working
        </button>
      )}
    </div>
  );
}
