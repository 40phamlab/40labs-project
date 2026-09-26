import * as React from 'react';
import { ToastContainer, ToastItem, ToastIntent } from '@40labs/ui-components';

interface ToastContextValue {
  showToast: (message: string, intent?: ToastIntent, duration?: number) => void;
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = React.useCallback((message: string, intent: ToastIntent = 'info', duration = 3500) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, intent, duration }]);
  }, []);

  const toast = React.useMemo(
    () => ({
      success: (msg: string, dur?: number) => showToast(msg, 'success', dur),
      error: (msg: string, dur?: number) => showToast(msg, 'danger', dur),
      warning: (msg: string, dur?: number) => showToast(msg, 'warning', dur),
      info: (msg: string, dur?: number) => showToast(msg, 'info', dur),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, toast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} position="bottom-right" />
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    return {
      showToast: () => {},
      toast: {
        success: () => {},
        error: () => {},
        warning: () => {},
        info: () => {},
      },
    };
  }
  return context;
}
