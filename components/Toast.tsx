'use client';

import type { ReactNode } from 'react';

import { Check, CircleAlert, Info, X } from 'lucide-react';

export interface ToastItem {
  id: number;
  message: string;
  tone: 'success' | 'info' | 'danger';
}

const TONE_STYLES: Record<ToastItem['tone'], { ring: string; icon: ReactNode }> = {
  success: {
    ring: 'border-emerald-200/80 text-emerald-700',
    icon: <Check className="h-4 w-4" aria-hidden />,
  },
  info: {
    ring: 'border-violet-200/80 text-violet-700',
    icon: <Info className="h-4 w-4" aria-hidden />,
  },
  danger: {
    ring: 'border-rose-200/80 text-rose-700',
    icon: <CircleAlert className="h-4 w-4" aria-hidden />,
  },
};

export function ToastStack({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[90] flex flex-col items-center gap-2 px-4"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`glass-strong pointer-events-auto flex animate-slide-up items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-lift ${TONE_STYLES[toast.tone].ring}`}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80">
            {TONE_STYLES[toast.tone].icon}
          </span>
          <span className="text-ink">{toast.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="ml-1 rounded-lg p-1 text-ink-muted transition hover:bg-black/5 hover:text-ink"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
