import { useCallback, useEffect, useRef, useState } from 'react';

import { Timer } from './components/Timer';
import { Coins } from './components/Coins';
import { Button } from './components/ui/button';
import { Counter } from './components/ui/counter';
import { Popup } from './components/ui/popup';
import { Settings } from './components/Settings';
import { SettingsIcon } from 'lucide-react';

const MINUTE = 60 * 1000;

const App = () => {
  const [focusMinutes, setFocusMinutes] = useState(25);
  const sessionLengthMs = focusMinutes * MINUTE;
  const [deadline, setDeadline] = useState(
    () => new Date(Date.now() + sessionLengthMs)
  );
  const [timeRemaining, setTimeRemaining] = useState(() =>
    Math.max(0, sessionLengthMs)
  );
  const [paused, setPaused] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [activePanel, setActivePanel] = useState<'timer' | 'coins'>('timer');
  const [coinBank, setCoinBank] = useState(0);
  const sessionCoinsRef = useRef(0);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [minutesPerCoin, setMinutesPerCoin] = useState(1);
  const coinIntervalMs =
    minutesPerCoin <= 0
      ? Number.POSITIVE_INFINITY
      : minutesPerCoin * MINUTE;
  const maxSessionCoins = sessionLengthMs / coinIntervalMs;
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>(() => {
      if (
        typeof window === 'undefined' ||
        typeof Notification === 'undefined'
      ) {
        return 'denied';
      }

      return Notification.permission;
    });

  const totalSeconds = Math.max(0, Math.floor(timeRemaining / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  const dynamicTitle = `${minutes}:${seconds} - Coindoro${
    mode === 'break' ? ' (Break)' : ''
  }`;

  const defaultTitleRef = useRef<string | undefined>(undefined);
  const previousTimeRef = useRef(timeRemaining);
  const lastTickRef = useRef<number | null>(null);
  const shopWasRunningRef = useRef(false);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    if (defaultTitleRef.current === undefined) {
      defaultTitleRef.current = document.title;
    }

    document.title = dynamicTitle;
  }, [dynamicTitle]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    return () => {
      if (defaultTitleRef.current !== undefined) {
        document.title = defaultTitleRef.current;
      }
    };
  }, []);

  useEffect(() => {
    if (timeRemaining <= 0 && !paused) {
      setPaused(true);
    }
  }, [paused, timeRemaining]);

  useEffect(() => {
    if (paused) {
      lastTickRef.current = null;
      return;
    }

    const tick = () => {
      const now = Date.now();
      const previous = lastTickRef.current;
      lastTickRef.current = now;

      const remaining = Math.max(0, deadline.getTime() - now);
      setTimeRemaining(remaining);

      if (mode === 'work' && previous !== null) {
        const deltaMs = now - previous;

        if (
          deltaMs > 0 &&
          Number.isFinite(coinIntervalMs) &&
          coinIntervalMs > 0
        ) {
          const currentSessionCoins = sessionCoinsRef.current;
          const deltaCoins = deltaMs / coinIntervalMs;

          if (deltaCoins > 0) {
            const nextSessionCoins = Math.min(
              maxSessionCoins,
              currentSessionCoins + deltaCoins
            );
            const increment = nextSessionCoins - currentSessionCoins;

            if (increment > 0) {
              sessionCoinsRef.current = nextSessionCoins;
              setCoinBank((previousBank) => previousBank + increment);
            }
          }
        }
      }
    };

    tick();

    const intervalId = window.setInterval(tick, 1000);

    return () => {
      window.clearInterval(intervalId);
      lastTickRef.current = null;
    };
  }, [deadline, paused, mode, maxSessionCoins, coinIntervalMs]);

  useEffect(() => {
    sessionCoinsRef.current = Math.min(
      sessionCoinsRef.current,
      maxSessionCoins
    );
  }, [maxSessionCoins]);

  const scheduleTimer = useCallback((durationMs: number) => {
    const nextDeadline = new Date(Date.now() + durationMs);
    setDeadline(nextDeadline);
    setTimeRemaining(Math.max(0, nextDeadline.getTime() - Date.now()));
  }, []);

  const startWorkSession = useCallback(
    (options?: { autoStart?: boolean }) => {
      const autoStart = options?.autoStart ?? true; // TODO: Configuration menu
      scheduleTimer(sessionLengthMs);
      setMode('work');
  sessionCoinsRef.current = 0;
      lastTickRef.current = null;
      setPaused(!autoStart);
    },
    [scheduleTimer, sessionLengthMs]
  );

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      setNotificationPermission('denied');
      return 'denied' as NotificationPermission;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission;
    }

    setNotificationPermission(Notification.permission);
    return Notification.permission;
  }, []);

  const handleToggleTimer = () => {
    if (mode === 'break') {
      return;
    }

    if (paused && notificationPermission === 'default') {
      void requestNotificationPermission();
    }

    setPaused((previous) => {
      const next = !previous;
      setDeadline(new Date(Date.now() + Math.max(0, timeRemaining)));
      return next;
    });
  };

  const handleOpenShop = () => {
    shopWasRunningRef.current = !paused && timeRemaining > 0;

    if (!paused) {
      setPaused(true);
    }

    setIsShopOpen(true);
  };

  const handleCloseShop = () => {
    setIsShopOpen(false);

    const shouldResume = shopWasRunningRef.current && timeRemaining > 0;
    shopWasRunningRef.current = false;

    if (shouldResume) {
      setDeadline(new Date(Date.now() + Math.max(0, timeRemaining)));
      setPaused(false);
    }
  };

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
  };

  const handleRestart = () => {
  sessionCoinsRef.current = 0;
    lastTickRef.current = null;
    startWorkSession();
  };

  const handleEndBreak = () => {
    startWorkSession({ autoStart: false });
  };

  useEffect(() => {
    if (mode === 'break' && timeRemaining <= 0) {
      startWorkSession({ autoStart: false });
    }
  }, [mode, timeRemaining, startWorkSession]);

  useEffect(() => {
    const previous = previousTimeRef.current;

    if (
      typeof window !== 'undefined' &&
      typeof Notification !== 'undefined' &&
      previous > 0 &&
      timeRemaining <= 0
    ) {
      const notify = async () => {
        let permission = notificationPermission;

        if (permission === 'default') {
          permission = await requestNotificationPermission();
        }

        if (permission === 'granted') {
          const title =
            mode === 'break' ? 'Break finished' : 'Focus session complete';
          const body =
            mode === 'break'
              ? 'Break time is over. Ready to get back to the grind?'
              : 'Good stuff, your focus timer just hit zero. Select a new work or fun timer!';

          new Notification(title, {
            body,
            tag: 'coindoro-timer-complete',
          });
        }
      };

      void notify();
    }

    previousTimeRef.current = timeRemaining;
  }, [
    timeRemaining,
    mode,
    notificationPermission,
    requestNotificationPermission,
  ]);

  const isBreakMode = mode === 'break';
  const isFinished = mode === 'work' && timeRemaining <= 0;
  const buttonLabel = paused ? 'Start' : 'Pause';
  const isTimerExpanded = activePanel === 'timer';
  const breakCost = minutesPerCoin <= 0 ? Number.POSITIVE_INFINITY : breakMinutes / minutesPerCoin;
  const canPurchaseBreak =
    breakMinutes > 0 && Number.isFinite(breakCost) && breakCost <= coinBank;
  const accruesCoins = mode === 'work' && !paused && timeRemaining > 0;

  const handlePurchaseBreak = () => {
    if (!canPurchaseBreak || isBreakMode) {
      return;
    }

    const breakDurationMs = breakMinutes * MINUTE;

    if (breakDurationMs <= 0) {
      return;
    }

    setCoinBank((previous) => Math.max(0, previous - breakCost));
    scheduleTimer(breakDurationMs);
    setMode('break');
  sessionCoinsRef.current = 0;
    lastTickRef.current = null;
    setPaused(false);
    setActivePanel('timer');
    setBreakMinutes(0);
    setIsShopOpen(false);
    shopWasRunningRef.current = false;
  };

  return (
    <div
      className={`flex min-h-screen w-full flex-col text-foreground transition-colors duration-700 ${
        isBreakMode ? 'bg-orange-900' : 'bg-background'
      }`}
    >
      <header className="flex justify-end px-6 py-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleOpenSettings}
          aria-label="Open settings"
        >
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="flex flex-col items-center gap-6">
          <Coins
            variant={isTimerExpanded ? 'compact' : 'expanded'}
            onClick={
              isTimerExpanded ? () => setActivePanel('coins') : undefined
            }
            coins={coinBank}
            breakActive={isBreakMode}
            isAccruing={accruesCoins}
            coinIntervalMs={coinIntervalMs}
          />
          <Timer
            timeRemaining={timeRemaining}
            variant={isTimerExpanded ? 'expanded' : 'compact'}
            onClick={
              isTimerExpanded ? undefined : () => setActivePanel('timer')
            }
            mode={mode}
          />
          <div className="flex items-center gap-3">
            {isBreakMode ? (
              <Button onClick={handleEndBreak} variant="destructive">
                End Break
              </Button>
            ) : !isFinished ? (
              <Button onClick={handleToggleTimer} variant="default">
                {buttonLabel}
              </Button>
            ) : (
              <Button onClick={handleRestart} variant="secondary">
                Restart
              </Button>
            )}
            <Button variant="secondary" onClick={handleOpenShop}>
              Shop
            </Button>
          </div>
        </div>
      </main>
      <Popup
        open={isShopOpen}
        onClose={handleCloseShop}
        eyebrow="Shop" /* Apparently this is called an eyebrow. Who would've thunk! */
      >
        <div className="space-y-6 text-sm leading-relaxed">
          <p>You look like you could use a break!</p>
          {isBreakMode && (
            <div className="rounded-2xl border border-amber-400/40 bg-amber-950/40 px-4 py-3 text-xs uppercase tracking-[0.3em] text-amber-200">
              Break active — timer is counting down
            </div>
          )}
          <div className="rounded-3xl border border-primary/20 p-4 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-primary">
                <span>Balance</span>
                <span>{coinBank.toFixed(2)} coins</span>
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-xs uppercase tracking-[0.3em] text-primary">
                  Break length (minutes)
                </label>
                <Counter
                  value={breakMinutes}
                  onChange={(next) => setBreakMinutes(next)}
                  min={0}
                  step={1}
                />
              </div>
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-primary">
                <span>Cost</span>
                <span>{breakCost.toFixed(2)} coins</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="default"
              className="px-6"
              disabled={!canPurchaseBreak || isBreakMode}
              onClick={handlePurchaseBreak}
            >
              {isBreakMode ? 'Break in progress' : 'Purchase break'}
            </Button>
          </div>
        </div>
      </Popup>
      <Settings
        open={isSettingsOpen}
        onClose={handleCloseSettings}
        focusMinutes={focusMinutes}
        onFocusMinutesChange={setFocusMinutes}
        minutesPerCoin={minutesPerCoin}
        onMinutesPerCoinChange={setMinutesPerCoin}
      />
    </div>
  );
};

export default App;
