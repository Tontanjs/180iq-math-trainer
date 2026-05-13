import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
  gradient: string;
  badge?: string;
}

export function ModeCard({ title, description, icon: Icon, href, color, gradient, badge }: ModeCardProps) {
  return (
    <Link href={href} className="group block">
      <div className={cn(
        "relative overflow-hidden rounded-2xl p-5 h-full border transition-all duration-300",
        "hover:shadow-lg hover:-translate-y-0.5",
        gradient
      )}>
        {badge && (
          <span className="absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
            {badge}
          </span>
        )}
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-white/20",
          color
        )}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h3 className="font-bold text-white text-lg leading-tight">{title}</h3>
        <p className="text-white/80 text-sm mt-1 leading-relaxed">{description}</p>
        <div className="mt-3 flex items-center gap-1 text-white/70 text-xs font-medium group-hover:text-white transition-colors">
          <span>Start now</span>
          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </div>
      </div>
    </Link>
  );
}
