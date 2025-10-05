import { useCallback, useEffect, useRef, useState } from 'react';

import { Timer } from './components/Timer';
import { Coins } from './components/Coins';
import { Button } from './components/ui/button';
import { Popup } from './components/ui/popup';

const MINUTE = 60 * 1000;
const SESSION_LENGTH_MS = MINUTE * 25;
const COIN_INTERVAL_MS = 5 * 60 * 1000;
const COINS_PER_BREAK_MINUTE = 1;

const App = () => {
  const [deadline, setDeadline] = useState(
    () => new Date(Date.now() + SESSION_LENGTH_MS)
  );
  const [timeRemaining, setTimeRemaining] = useState(() =>
    Math.max(0, deadline.getTime() - Date.now())
  );
  const [paused, setPaused] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [activePanel, setActivePanel] = useState<'timer' | 'coins'>('timer');
  const [coinBank, setCoinBank] = useState(150);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>(() => {
      if (typeof window === 'undefined' || typeof Notification === 'undefined') {
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

  const scheduleTimer = useCallback((durationMs: number) => {
    const nextDeadline = new Date(Date.now() + durationMs);
    setDeadline(nextDeadline);
    setTimeRemaining(Math.max(0, nextDeadline.getTime() - Date.now()));
  }, []);

  const startWorkSession = useCallback(
    (options?: { autoStart?: boolean }) => {
      const autoStart = options?.autoStart ?? true; // TODO: Configuration menu
      scheduleTimer(SESSION_LENGTH_MS);
      setMode('work');
      setPaused(!autoStart);
    },
    [scheduleTimer]
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

  const handleRestart = () => {
    const coinsEarned = Math.max(
      0,
      (SESSION_LENGTH_MS - timeRemaining) / COIN_INTERVAL_MS
    );

    if (coinsEarned > 0) {
      setCoinBank((previous) => previous + coinsEarned);
    }

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
          const title = mode === 'break' ? 'Break finished' : 'Focus session complete';
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
  }, [timeRemaining, mode, notificationPermission, requestNotificationPermission]);

  const isBreakMode = mode === 'break';
  const isFinished = mode === 'work' && timeRemaining <= 0;
  const buttonLabel = paused ? 'Start' : 'Pause';
  const isTimerExpanded = activePanel === 'timer';
  const breakCost = breakMinutes * COINS_PER_BREAK_MINUTE;
  const canPurchaseBreak = breakMinutes > 0 && breakCost <= coinBank;

  const handleIncrementBreak = () => {
    setBreakMinutes((previous) => previous + 1);
  };

  const handleDecrementBreak = () => {
    setBreakMinutes((previous) => Math.max(0, previous - 1));
  };

  const handleBreakMinutesChange = (value: string) => {
    const parsed = Number.parseInt(value, 10);

    if (Number.isNaN(parsed) || parsed < 0) {
      setBreakMinutes(0);
      return;
    }

    setBreakMinutes(parsed);
  };

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
    setPaused(false);
    setActivePanel('timer');
    setBreakMinutes(0);
    setIsShopOpen(false);
  };

  return (
    <main
      className={`flex min-h-screen w-full items-center justify-center px-4 py-16 text-foreground transition-colors duration-700 ${
        isBreakMode ? 'bg-orange-900' : 'bg-background'
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        <Coins
          variant={isTimerExpanded ? 'compact' : 'expanded'}
          onClick={isTimerExpanded ? () => setActivePanel('coins') : undefined}
          sessionDuration={SESSION_LENGTH_MS}
          deadline={deadline}
          paused={paused}
          baseCoins={coinBank}
          breakActive={isBreakMode}
        />
        <Timer
          deadline={deadline}
          paused={paused}
          timeRemaining={timeRemaining}
          setTimeRemaining={setTimeRemaining}
          variant={isTimerExpanded ? 'expanded' : 'compact'}
          onClick={isTimerExpanded ? undefined : () => setActivePanel('timer')}
          mode={mode}
        />
        <div className="flex items-center gap-3">
          {isBreakMode ? (
            <Button
              onClick={handleEndBreak}
              variant="destructive"
              className="cursor-pointer"
            >
              End Break
            </Button>
          ) : !isFinished ? (
            <Button
              onClick={handleToggleTimer}
              variant="default"
              className="cursor-pointer"
            >
              {buttonLabel}
            </Button>
          ) : (
            <Button
              onClick={handleRestart}
              variant="secondary"
              className="cursor-pointer"
            >
              Restart
            </Button>
          )}
          <Button
            variant="secondary"
            className="cursor-pointer"
            onClick={() => setIsShopOpen(true)}
          >
            Shop
          </Button>
        </div>
      </div>
      <Popup
        open={isShopOpen}
        onClose={() => setIsShopOpen(false)}
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
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-sm"
                    onClick={handleDecrementBreak}
                    aria-label="Decrease break minutes"
                  >
                    -
                  </Button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    className="w-24 rounded-2xl bg-background px-3 py-2 text-center font-mono text-lg text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    value={breakMinutes.toString()}
                    onChange={(event) =>
                      handleBreakMinutesChange(event.target.value)
                    }
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-sm"
                    onClick={handleIncrementBreak}
                    aria-label="Increase break minutes"
                  >
                    +
                  </Button>
                </div>
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
    </main>
  );
};

export default App;
