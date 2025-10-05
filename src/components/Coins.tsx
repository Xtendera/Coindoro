import { useCallback, useEffect, useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

import coin from '../assets/coin.png';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

const clampRemaining = (remaining: number, sessionDuration: number) =>
  Math.max(0, Math.min(sessionDuration, remaining));

const coinsFromRemaining = (remaining: number, sessionDuration: number) => {
  const clamped = clampRemaining(remaining, sessionDuration);
  const elapsed = sessionDuration - clamped;
  if (sessionDuration <= 0) {
    return 0;
  }

  return Math.max(0, elapsed / FIVE_MINUTES_MS);
};

export type CoinsProps = {
  variant: 'expanded' | 'compact';
  onClick?: () => void;
  timeRemaining: number;
  sessionDuration: number;
  deadline: Date;
  paused: boolean;
  baseCoins: number;
};

export const Coins = ({
  variant,
  onClick,
  timeRemaining,
  sessionDuration,
  deadline,
  paused,
  baseCoins,
}: CoinsProps) => {
  const isCompact = variant === 'compact';
  const isInteractive = typeof onClick === 'function';

  // IG useMemo is useless bcs I am using react router but ill do it anyways.
  const deadlineTimestamp = useMemo(() => deadline.getTime(), [deadline]);

  const staticSessionCoins = useMemo(() => {
    const remaining = paused
      ? clampRemaining(timeRemaining, sessionDuration)
      : clampRemaining(deadlineTimestamp - Date.now(), sessionDuration);

    return coinsFromRemaining(remaining, sessionDuration);
  }, [paused, timeRemaining, sessionDuration, deadlineTimestamp]);

  const targetCoinsTotal = baseCoins + staticSessionCoins;

  const [displayCoins, setDisplayCoins] = useState(targetCoinsTotal);

  useEffect(() => {
    setDisplayCoins(targetCoinsTotal);
  }, [targetCoinsTotal]);

  const computeLiveCoins = useCallback(() => {
    const liveRemaining = clampRemaining(
      deadlineTimestamp - Date.now(),
      sessionDuration
    );

    return baseCoins + coinsFromRemaining(liveRemaining, sessionDuration);
  }, [deadlineTimestamp, sessionDuration, baseCoins]);

  // Calculate fractional coins if u are in the big view
  useEffect(() => {
    if (variant !== 'expanded' || paused) {
      return;
    }

    let frameId: number | undefined;

    const tick = () => {
      const coinsValue = computeLiveCoins();
      setDisplayCoins(coinsValue);

      const remaining = clampRemaining(
        deadlineTimestamp - Date.now(),
        sessionDuration
      );

      if (remaining > 0 && !paused) {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      if (frameId !== undefined) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [variant, paused, computeLiveCoins, deadlineTimestamp, sessionDuration]);

  const compactCoins = Math.floor(displayCoins);
  const expandedCoins = displayCoins;

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
          'w-full rounded-3xl border border-primary/30 bg-card text-primary backdrop-blur-sm shadow-lg transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
          isCompact ? 'px-6 py-3' : 'p-10',
          isInteractive ? 'cursor-pointer' : 'cursor-default'
        )}
      >
        {isCompact ? (
          <div className="flex items-center justify-center gap-3">
            <span className="uppercase tracking-[0.35em] text-xs md:text-sm">
              Coins
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg md:text-xl font-semibold text-foreground">
                {compactCoins}
              </span>
              <img
                className="h-6 w-6 object-contain"
                src={coin}
                alt="Coin icon"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-6">
            <span className="uppercase tracking-[0.35em] text-sm text-primary">
              Coins
            </span>
            <div className="flex items-center gap-4">
              <span className="font-mono text-6xl md:text-7xl font-semibold text-foreground">
                {expandedCoins.toFixed(6)}
              </span>
              <img
                className="h-10 w-10 object-contain"
                src={coin}
                alt="Coin icon"
              />
            </div>
          </div>
        )}
      </button>
    </div>
  );
};
