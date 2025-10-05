import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

import coin from '../assets/coin.png';

export type CoinsProps = {
  variant: 'expanded' | 'compact';
  onClick?: () => void;
  coins: number;
  breakActive?: boolean;
  isAccruing?: boolean;
  coinIntervalMs: number;
};

export const Coins = ({
  variant,
  onClick,
  coins,
  breakActive = false,
  isAccruing = false,
  coinIntervalMs,
}: CoinsProps) => {
  const isCompact = variant === 'compact';
  const isInteractive = typeof onClick === 'function';
  const syncedCoinsRef = useRef(coins);
  const syncedAtRef = useRef<number>(Date.now());
  const [displayCoins, setDisplayCoins] = useState(coins);

  useEffect(() => {
    syncedCoinsRef.current = coins;
    syncedAtRef.current = Date.now();
    setDisplayCoins(coins);
  }, [coins]);

  useEffect(() => {
    const canSmooth =
      variant === 'expanded' &&
      !breakActive &&
      isAccruing &&
      Number.isFinite(coinIntervalMs) &&
      coinIntervalMs > 0;

    if (!canSmooth) {
      syncedCoinsRef.current = coins;
      syncedAtRef.current = Date.now();
      setDisplayCoins(coins);
      return;
    }

    const intervalMs = 50;
    const timer = window.setInterval(() => {
      const base = syncedCoinsRef.current;
      const elapsed = Date.now() - syncedAtRef.current;
      const estimated = base + elapsed / coinIntervalMs;
      setDisplayCoins(estimated);
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [variant, breakActive, isAccruing, coins, coinIntervalMs]);

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
          'w-full rounded-3xl border border-primary/30 bg-card backdrop-blur-sm shadow-primary transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
          isCompact ? 'px-6 py-3' : 'p-10 shadow-lg',
          isInteractive ? 'cursor-pointer' : 'cursor-default',
          breakActive ? 'text-amber-300' : 'text-primary'
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
            <span className="uppercase tracking-[0.35em] text-sm">
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
