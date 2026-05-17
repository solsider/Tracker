import { useState, useRef, useEffect } from 'react';
import { useDrawerStore } from '../../store/drawer.store';
import { useUnreadCount, useNotifications, useMarkNotificationRead, useMarkAllRead } from '../../hooks/useNotifications';
import { useQueryClient } from '@tanstack/react-query';

const TYPE_LABELS: Record<string, string> = {
  ISSUE_ASSIGNED: 'Назначена задача',
  ISSUE_UPDATED: 'Задача обновлена',
  COMMENT_ADDED: 'Новый комментарий',
  MENTIONED: 'Упоминание',
  SPRINT_STARTED: 'Спринт начат',
  SPRINT_COMPLETED: 'Спринт завершён',
  ATTACHMENT_ADDED: 'Новый файл',
  ATTACHMENT_REMOVED: 'Файл удалён',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин. назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч. назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн. назад`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const qc = useQueryClient();
  const openDrawer = useDrawerStore((s) => s.open);

  const { data: countData } = useUnreadCount();
  const { data: notifications = [], isLoading } = useNotifications(false);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();

  const unreadCount = countData?.count ?? 0;

  // Close panel on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Invalidate count when panel opens
  useEffect(() => {
    if (open) qc.invalidateQueries({ queryKey: ['notifications'] });
  }, [open, qc]);

  function handleNotificationClick(n: (typeof notifications)[0]) {
    if (!n.read) markRead.mutate(n.id);
    if (n.issue && n.projectId) {
      openDrawer(n.projectId, n.issue.number);
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg text-dash-muted hover:text-dash-text hover:bg-dash-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-accent"
        aria-label="Уведомления"
        aria-expanded={open}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5 w-[18px] h-[18px]">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-11 w-80 bg-dash-panel border border-dash-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-dash-border">
            <span className="text-sm font-semibold text-dash-text">Уведомления</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="text-xs text-dash-accent hover:text-dash-accent/80 transition-colors disabled:opacity-50"
              >
                Прочитать все
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-1 p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg animate-pulse">
                    <div className="w-7 h-7 rounded-full bg-dash-border/60 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-4/5 bg-dash-border/60 rounded" />
                      <div className="h-2.5 w-3/5 bg-dash-border/40 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <div className="w-10 h-10 rounded-xl bg-dash-border/40 flex items-center justify-center mb-3 text-dash-muted">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 opacity-60">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <p className="text-xs font-medium text-dash-muted">Нет уведомлений</p>
              </div>
            ) : (
              <div className="p-1.5 space-y-0.5">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group ${
                      n.read
                        ? 'hover:bg-dash-border/40'
                        : 'bg-dash-accent/5 hover:bg-dash-accent/10'
                    }`}
                  >
                    {/* Actor avatar */}
                    <div className="w-7 h-7 rounded-full bg-dash-accent/20 border border-dash-accent/20 flex items-center justify-center text-[10px] font-semibold text-dash-accent shrink-0 mt-0.5">
                      {n.actor?.name?.charAt(0).toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-dash-text leading-snug line-clamp-2">
                        {TYPE_LABELS[n.type] ?? n.type}
                        {n.issue && (
                          <span className="text-dash-muted font-normal"> · #{n.issue.number} {n.issue.title}</span>
                        )}
                      </p>
                      <p className="text-[10px] text-dash-muted mt-0.5">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-dash-accent shrink-0 mt-1.5" aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
