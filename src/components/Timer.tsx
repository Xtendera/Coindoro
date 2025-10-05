import { useMemo } from 'react';
import type { SVGProps } from 'react';

import { cn } from '@/lib/utils';

const SECOND = 1000;

export type TimerProps = {
  timeRemaining: number;
  variant: 'expanded' | 'compact';
  onClick?: () => void;
  mode?: 'work' | 'break';
};

const ClockIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const Timer = ({
  timeRemaining,
  variant,
  onClick,
  mode = 'work',
}: TimerProps) => {
  const timeLeft = useMemo(() => {
    const total = Math.max(0, timeRemaining);

    return {
      raw: timeRemaining,
      totalSeconds: Math.floor(total / SECOND),
    };
  }, [timeRemaining]);

  const minutesDisplay = Math.floor(timeLeft.totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const secondsDisplay = (timeLeft.totalSeconds % 60)
    .toString()
    .padStart(2, '0');

  const isCompact = variant === 'compact';
  const isInteractive = typeof onClick === 'function';
  const isFinished = timeLeft.raw <= 0;
  const isBreakMode = mode === 'break';

  const activeLabel = isBreakMode ? 'Break time!' : 'Work time!';
  const finishedLabel = isBreakMode ? 'Break over!' : 'Time over!';
  const compactLabel = isBreakMode ? 'Break' : 'Work';

  const accentClass = isBreakMode ? 'text-amber-300' : 'text-primary';

  const expandedContent = isFinished ? (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className={`flex items-center justify-center gap-3 ${accentClass}`}>
        <span className="uppercase tracking-[0.35em] text-sm">
          {finishedLabel}
        </span>
      </div>
      <div className="font-mono text-6xl md:text-7xl font-semibold text-foreground">
        00:00
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className={`flex items-center justify-center gap-3 ${accentClass}`}>
        <ClockIcon className={`h-8 w-8 ${accentClass}`} />
        <span className="uppercase tracking-[0.35em] text-sm">
          {activeLabel}
        </span>
      </div>

      <div className="font-mono text-6xl md:text-7xl font-semibold text-foreground">
        {minutesDisplay}:{secondsDisplay}
      </div>
    </div>
  );

  const compactContent = (
    <div className="flex items-center justify-center gap-3">
      <ClockIcon className={`h-5 w-5 ${accentClass}`} />
      <span
        className={`uppercase tracking-[0.35em] text-xs md:text-sm ${accentClass}`}
      >
        {compactLabel}
      </span>
      <span className="font-mono text-lg md:text-xl font-semibold text-foreground">
        {minutesDisplay}:{secondsDisplay}
      </span>
    </div>
  );

  return (
    <div
      className={cn(
        'mx-auto w-full transition-all duration-300 ease-in-out',
        isCompact ? 'max-w-sm scale-95' : 'max-w-md scale-100'
      )}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={!isInteractive}
        className={cn(
          'w-full rounded-3xl border border-primary/30 bg-card text-primary backdrop-blur-sm shadow-primary transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
          isCompact ? 'px-6 py-3' : 'p-10 shadow-lg',
          isInteractive ? 'cursor-pointer' : 'cursor-default'
        )}
      >
        {isCompact ? compactContent : expandedContent}
      </button>
    </div>
  );
};
