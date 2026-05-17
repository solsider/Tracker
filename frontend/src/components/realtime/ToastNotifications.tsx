import { useEffect } from 'react';
import { useRealtimeStore } from '../../store/realtime.store';

export function ToastNotifications() {
  const { toasts, dismissToast } = useRealtimeStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onDismiss={dismissToast}
        />
      ))}
    </div>
  );
}

function Toast({
  id,
  message,
  type,
  onDismiss,
}: {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(id), 5000);
    return () => clearTimeout(t);
  }, [id, onDismiss]);

  const colors = {
    info: 'bg-dash-panel border-dash-accent/40 text-dash-text',
    success: 'bg-dash-panel border-green-500/40 text-green-300',
    error: 'bg-dash-panel border-red-500/40 text-red-300',
  };

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm max-w-sm ${colors[type]} animate-in slide-in-from-right-4`}
    >
      <span className="flex-1">{message}</span>
      <button
        onClick={() => onDismiss(id)}
        className="shrink-0 text-dash-muted hover:text-white transition-colors"
      >
        ×
      </button>
    </div>
  );
}
