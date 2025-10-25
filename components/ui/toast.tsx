'use client';

import * as React from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'loading' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, toast: Partial<Omit<Toast, 'id'>>) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateToast = React.useCallback((id: string, toast: Partial<Omit<Toast, 'id'>>) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...toast } : t))
    );
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, updateToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { addToast, updateToast, removeToast } = context;

  return React.useMemo(
    () => ({
      success: (message: string, options?: { description?: string }) =>
        addToast({ type: 'success', message, description: options?.description }),
      error: (message: string, options?: { description?: string }) =>
        addToast({ type: 'error', message, description: options?.description }),
      loading: (message: string, options?: { description?: string }) =>
        addToast({ type: 'loading', message, description: options?.description }),
      info: (message: string, options?: { description?: string }) =>
        addToast({ type: 'info', message, description: options?.description }),
      update: (id: string, toast: Partial<Omit<Toast, 'id'>>) =>
        updateToast(id, toast),
      dismiss: (id: string) => removeToast(id),
    }),
    [addToast, updateToast, removeToast]
  );
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isExiting, setIsExiting] = React.useState(false);
  const [isEntering, setIsEntering] = React.useState(true);

  React.useEffect(() => {
    // Smooth entrance
    const timer = setTimeout(() => setIsEntering(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = React.useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  }, [onRemove, toast.id]);

  React.useEffect(() => {
    // Auto remove after 5 seconds (unless it's a loading toast)
    if (toast.type !== 'loading') {
      const timer = setTimeout(() => {
        handleRemove();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.type, handleRemove]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />,
    error: <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />,
    loading: <Loader2 className="h-5 w-5 text-blue-500 flex-shrink-0 animate-spin" />,
    info: <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />,
  };

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-3 min-w-[400px] max-w-[500px] rounded-lg bg-[#1a1a1a] border border-white/10 px-4 py-3 shadow-lg transition-all duration-300 ease-out',
        isEntering && 'opacity-0 translate-y-[-20px] scale-95',
        !isEntering && !isExiting && 'opacity-100 translate-y-0 scale-100',
        isExiting && 'opacity-0 translate-y-[-10px] scale-95'
      )}
    >
      {/* Icon */}
      {icons[toast.type]}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white leading-tight">
          {toast.message}
        </p>
        {toast.description && (
          <p className="text-xs text-gray-400 mt-1 leading-tight">
            {toast.description}
          </p>
        )}
      </div>

      {/* Close Button */}
      {toast.type !== 'loading' && (
        <button
          onClick={handleRemove}
          className="flex-shrink-0 flex items-center justify-center rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      )}
    </div>
  );
}

