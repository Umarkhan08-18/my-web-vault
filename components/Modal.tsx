'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  zIndex?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'max-w-lg',
  zIndex = 'z-[80]',
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    const panel = panelRef.current;
    const focusTarget =
      panel?.querySelector<HTMLElement>('input:not([type="hidden"]), textarea, select') ??
      panel?.querySelector<HTMLElement>('button');
    focusTarget?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-end justify-center p-0 sm:items-center sm:p-6`}>
      <div
        className="absolute inset-0 animate-fade-in bg-ink/25 backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-description' : undefined}
        className={`relative w-full ${maxWidth} animate-pop-in overflow-hidden rounded-t-4xl border border-white/70 bg-white shadow-float sm:rounded-4xl`}
      >
        <div className="rainbow-stripe h-[3px] w-full" aria-hidden />

        <div className="flex items-start justify-between gap-4 px-6 pb-4 pt-6">
          <div>
            <h2 id="modal-title" className="font-display text-xl font-semibold tracking-[-0.02em]">
              {title}
            </h2>
            {description ? (
              <p id="modal-description" className="mt-1.5 text-[14px] leading-relaxed text-ink-muted">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/[0.06] bg-white text-ink-muted transition-all duration-200 hover:border-black/15 hover:text-ink"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="px-6">{children}</div>

        {footer ? (
          <div className="mt-6 flex flex-col-reverse gap-2.5 border-t border-black/[0.06] bg-black/[0.015] px-6 py-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        ) : (
          <div className="h-6" />
        )}
      </div>
    </div>
  );
}
