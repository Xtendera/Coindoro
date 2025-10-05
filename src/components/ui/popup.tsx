import { createPortal } from 'react-dom';
import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { Button } from './button';

type PopupProps = {
  open: boolean;
  onClose?: () => void;
  title?: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
  className?: string;
  showCloseButton?: boolean;
};

export const Popup = ({
  open,
  onClose,
  title,
  eyebrow,
  children,
  className,
  showCloseButton = true,
}: PopupProps) => {
  const portalTarget = useMemo(() => {
    if (typeof document === 'undefined') {
      return null;
    }

    return document.body;
  }, []);

  useEffect(() => {
    if (!open || !portalTarget) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, portalTarget]);

  if (!open || !portalTarget) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div
        role="presentation"
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        onClick={() => onClose?.()}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative w-full max-w-lg rounded-3xl border border-primary/30 bg-card/95 p-8 shadow-lg transition-all duration-300 ease-in-out',
          className
        )}
      >
        {(title || eyebrow || showCloseButton) && (
          <div className="flex items-start justify-between gap-4">
            {(title || eyebrow) && (
              <div className="flex flex-col gap-2 text-left">
                {eyebrow ? (
                  <div className="uppercase tracking-[0.35em] text-xs text-primary">
                    {eyebrow}
                  </div>
                ) : null}
                {title ? (
                  <div className="text-lg font-semibold text-foreground">
                    {title}
                  </div>
                ) : null}
              </div>
            )}
            {showCloseButton ? (
              <Button
                variant="secondary"
                size="icon-sm"
                onClick={() => onClose?.()}
                aria-label="Close popup"
              >
                ×
              </Button>
            ) : null}
          </div>
        )}
        <div
          className={cn(
            'text-foreground/90',
            title || eyebrow || showCloseButton ? 'mt-6' : undefined
          )}
        >
          {children}
        </div>
      </div>
    </div>,
    portalTarget
  );
};
