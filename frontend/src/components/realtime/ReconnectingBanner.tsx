import { useRealtimeStore } from '../../store/realtime.store';
import { useEffect, useState } from 'react';

export function ReconnectingBanner() {
  const connected = useRealtimeStore((s) => s.connected);
  // Show banner only after a brief delay to avoid flash on initial connect
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (!connected) {
      // Small delay so we don't flash on page load
      timer = setTimeout(() => setShow(true), 1500);
    } else {
      setShow(false);
    }
    return () => clearTimeout(timer);
  }, [connected]);

  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-dash-panel border border-dash-border shadow-lg shadow-black/20 backdrop-blur-sm text-sm text-dash-text animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      {/* Animated dots */}
      <span className="flex items-center gap-1" aria-hidden="true">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:300ms]" />
      </span>
      <span className="text-dash-muted text-xs font-medium">Переподключение…</span>
    </div>
  );
}
