'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { Brain, BarChart3, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onLogout: () => void;
}

export function Navbar({ onLogout }: NavbarProps) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-dark-navy dark:text-white hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-primary-blue rounded-lg flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <span>180IQ</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/progress"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              pathname === '/progress'
                ? "bg-primary-blue/10 text-primary-blue"
                : "text-slate-600 dark:text-slate-400 hover:text-primary-blue hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Progress</span>
          </Link>
          <ThemeToggle />
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
