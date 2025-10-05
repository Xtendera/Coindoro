import type { ChangeEvent } from 'react';

import { Button } from './button';

export type CounterProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
};

export const Counter = ({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
}: CounterProps) => {
  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = Number.parseInt(event.target.value, 10);

    if (Number.isNaN(parsed)) {
      onChange(min);
      return;
    }

    const clamped = Math.max(min, Math.min(max, parsed));
    onChange(clamped);
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="secondary"
        size="icon-sm"
        onClick={handleDecrement}
        aria-label="Decrease value"
      >
        -
      </Button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={step}
        className="w-24 rounded-2xl bg-background px-3 py-2 text-center font-mono text-lg text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        value={value.toString()}
        onChange={handleInputChange}
      />
      <Button
        type="button"
        variant="secondary"
        size="icon-sm"
        onClick={handleIncrement}
        aria-label="Increase value"
      >
        +
      </Button>
    </div>
  );
};

export default Counter;
