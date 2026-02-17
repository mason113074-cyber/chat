'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

type ToastState = { message: string; type: ToastType } | null;

type ToastContextValue = {
  show: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 3000;

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { show: () => {} };
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);

  const show = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <div
          className="fixed right-4 top-4 z-[100] max-w-sm rounded-lg border px-4 py-3 shadow-lg transition-opacity duration-200"
          role="alert"
          style={{
            backgroundColor:
              toast.type === 'success'
                ? '#ecfdf5'
                : toast.type === 'error'
                  ? '#fef2f2'
                  : '#eff6ff',
            borderColor:
              toast.type === 'success'
                ? '#10b981'
                : toast.type === 'error'
                  ? '#ef4444'
                  : '#3b82f6',
            color:
              toast.type === 'success'
                ? '#065f46'
                : toast.type === 'error'
                  ? '#991b1b'
                  : '#1e40af',
          }}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}
