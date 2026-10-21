import * as React from 'react';
import { ToastContainer, ToastItem, ToastIntent, ToastSeverity, ToastAction } from '@40labs/ui-components';

export interface ShowToastOptions {
  key?: string;
  message?: string;
  title?: string;
  detail?: string;
  severity?: ToastSeverity;
  intent?: ToastIntent;
  duration?: number;
  actions?: ToastAction[];
  persistent?: boolean;
  progress?: number;
}

interface ToastContextValue {
  showToast: (optionsOrMessage: string | ShowToastOptions, intent?: ToastIntent, duration?: number) => void;
  toast: {
    show: (options: ShowToastOptions) => void;
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

  const showToast = React.useCallback((optionsOrMessage: string | ShowToastOptions, intent: ToastIntent = 'info', duration = 3500) => {
    let newItem: ToastItem;
    if (typeof optionsOrMessage === 'string') {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      newItem = { id, message: optionsOrMessage, intent, duration };
    } else {
      const { key, message, title, detail, severity, intent: optIntent, duration: optDuration, actions, persistent, progress } = optionsOrMessage;
      const id = key || `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      newItem = {
        id,
        key,
        message: message || title || '',
        title,
        detail,
        severity: severity || (optIntent === 'danger' ? 'danger' : optIntent === 'warning' ? 'warning' : 'info'),
        intent: optIntent || intent,
        duration: optDuration ?? duration,
        actions,
        persistent,
        progress,
      };
    }

    setToasts((prev) => {
      if (newItem.key) {
        const index = prev.findIndex((t) => t.key === newItem.key || t.id === newItem.id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...newItem, id: updated[index].id };
          return updated;
        }
      }
      return [...prev, newItem];
    });
  }, []);

  const toast = React.useMemo(
    () => ({
      show: (options: ShowToastOptions) => showToast(options),
      success: (msg: string, dur?: number) => showToast({ message: msg, intent: 'success', duration: dur, severity: 'info' }),
      error: (msg: string, dur?: number) => showToast({ message: msg, intent: 'danger', duration: dur, severity: 'danger' }),
      warning: (msg: string, dur?: number) => showToast({ message: msg, intent: 'warning', duration: dur, severity: 'warning' }),
      info: (msg: string, dur?: number) => showToast({ message: msg, intent: 'info', duration: dur, severity: 'info' }),
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
        show: () => {},
        success: () => {},
        error: () => {},
        warning: () => {},
        info: () => {},
      },
    };
  }
  return context;
}
