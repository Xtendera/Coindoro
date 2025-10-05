import { Counter } from './ui/counter';
import { Popup } from './ui/popup';

export type SettingsProps = {
  open: boolean;
  onClose: () => void;
  focusMinutes: number;
  onFocusMinutesChange: (value: number) => void;
  minutesPerCoin: number;
  onMinutesPerCoinChange: (value: number) => void;
};

export const Settings = ({
  open,
  onClose,
  focusMinutes,
  onFocusMinutesChange,
  minutesPerCoin,
  onMinutesPerCoinChange,
}: SettingsProps) => {
  return (
    <Popup open={open} onClose={onClose} eyebrow="Settings">
      <div className="space-y-6 text-sm leading-relaxed">
        <header className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Preferences</h2>
        </header>
        <div className="space-y-5">
          <section className="space-y-3">
            <div className="text-xs uppercase tracking-[0.3em] text-primary">
              Focus session length (minutes)
            </div>
            <Counter
              value={focusMinutes}
              onChange={onFocusMinutesChange}
              min={5}
              max={180}
              step={5}
            />
          </section>
          <section className="space-y-3">
            <div className="text-xs uppercase tracking-[0.3em] text-primary">
              Minutes per coin
            </div>
            <Counter
              value={minutesPerCoin}
              onChange={onMinutesPerCoinChange}
              min={1}
              max={60}
              step={1}
            />
          </section>
        </div>
      </div>
    </Popup>
  );
};

export default Settings;
