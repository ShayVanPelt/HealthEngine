'use client';

import { createContext, useCallback, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

export const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = String(++idRef.current);
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast stack — bottom-right */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed right-4 z-50 flex flex-col gap-2 pointer-events-none bottom-[calc(6.25rem+env(safe-area-inset-bottom,0px))] sm:bottom-4"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            onClick={() => dismiss(t.id)}
            className={cn(
              'pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg animate-scale-in cursor-pointer',
              'max-w-xs sm:max-w-sm',
              t.variant === 'success' && 'bg-card border-border text-foreground',
              t.variant === 'error' && 'bg-card border-destructive/40 text-destructive',
              t.variant === 'info' && 'bg-card border-border text-foreground',
            )}
          >
            {t.variant === 'success' && (
              <span className="shrink-0 w-4 h-4 rounded-full bg-success/20 flex items-center justify-center text-success text-[10px] font-black">✓</span>
            )}
            {t.variant === 'error' && (
              <span className="shrink-0 w-4 h-4 rounded-full bg-destructive/20 flex items-center justify-center text-destructive text-[10px] font-black">✕</span>
            )}
            {t.variant === 'info' && (
              <span className="shrink-0 w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-black">i</span>
            )}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
