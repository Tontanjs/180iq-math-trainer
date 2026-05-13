'use client';
import { Question } from '@/lib/types';
import { cn } from '@/lib/utils';

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
}

export function QuestionDisplay({ question, questionNumber, totalQuestions }: QuestionDisplayProps) {
  return (
    <div className="text-center">
      <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mb-2">
        Question {questionNumber} of {totalQuestions}
      </p>
      <div className={cn(
        "inline-block bg-gradient-to-br from-primary-blue/5 to-dark-navy/5 dark:from-primary-blue/10 dark:to-dark-navy/10",
        "border border-primary-blue/20 dark:border-primary-blue/30 rounded-2xl px-8 py-6"
      )}>
        <p className="text-4xl sm:text-5xl md:text-6xl font-bold text-dark-navy dark:text-white tracking-tight select-none">
          {question.display} = <span className="text-primary-blue">?</span>
        </p>
      </div>
    </div>
  );
}
