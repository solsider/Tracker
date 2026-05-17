import { useState } from 'react';
import { useTimeEntries, useLogTime, useDeleteTimeEntry } from '../../../hooks/useTimeTracking';
import { useAuthStore } from '../../../store/auth.store';
import { Skeleton } from '../../ui/Skeleton';
import { Avatar } from '../../ui/AvatarStack';
import { formatMinutes } from '../IssueDetailConstants';

interface TimeTrackingPanelProps {
  issueId: string;
}

export function TimeTrackingPanel({ issueId }: TimeTrackingPanelProps) {
  const { user } = useAuthStore();
  const { data, isLoading } = useTimeEntries(issueId);
  const logTime = useLogTime(issueId);
  const deleteEntry = useDeleteTimeEntry(issueId);

  const [isAdding, setIsAdding] = useState(false);
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const handleSubmit = () => {
    const totalMinutes = (parseInt(hours || '0') * 60) + parseInt(minutes || '0');
    if (totalMinutes <= 0) return;
    logTime.mutate(
      { minutes: totalMinutes, description: description || undefined, date },
      {
        onSuccess: () => {
          setHours(''); setMinutes(''); setDescription('');
          setDate(new Date().toISOString().split('T')[0]);
          setIsAdding(false);
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-dash-text">Трекинг времени</h3>
          {data && data.totalMinutes > 0 && (
            <p className="text-xs text-dash-muted mt-0.5">
              Итого: <span className="text-dash-text font-medium">{formatMinutes(data.totalMinutes)}</span>
            </p>
          )}
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="text-xs text-dash-accent hover:text-dash-accent/80"
        >
          + Записать
        </button>
      </div>

      {isAdding && (
        <div className="space-y-3 p-3 bg-dash-bg border border-dash-border rounded-lg">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-dash-muted block mb-1">Часы</label>
              <input
                type="number" min="0" max="23"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="0"
                className="w-full px-2 py-1.5 text-sm bg-dash-panel border border-dash-border rounded text-dash-text focus:outline-none focus:border-dash-accent/50"
              />
            </div>
            <div>
              <label className="text-xs text-dash-muted block mb-1">Минуты</label>
              <input
                type="number" min="0" max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="0"
                className="w-full px-2 py-1.5 text-sm bg-dash-panel border border-dash-border rounded text-dash-text focus:outline-none focus:border-dash-accent/50"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-dash-muted block mb-1">Дата</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-2 py-1.5 text-sm bg-dash-panel border border-dash-border rounded text-dash-text focus:outline-none focus:border-dash-accent/50"
            />
          </div>
          <div>
            <label className="text-xs text-dash-muted block mb-1">Описание (необязательно)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Что делали..."
              className="w-full px-2 py-1.5 text-sm bg-dash-panel border border-dash-border rounded text-dash-text focus:outline-none focus:border-dash-accent/50"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={logTime.isPending || (!hours && !minutes)}
              className="px-3 py-1.5 text-xs bg-dash-accent text-white rounded-lg hover:bg-dash-accent/80 disabled:opacity-50"
            >
              Записать
            </button>
            <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-xs text-dash-muted hover:text-dash-text">
              Отмена
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-12" />)}
        </div>
      )}

      {data?.entries.length === 0 && !isLoading && (
        <p className="text-xs text-dash-muted text-center py-4">Нет записей о времени</p>
      )}

      <div className="space-y-2">
        {data?.entries.map((entry) => (
          <div key={entry.id} className="flex items-start gap-3 p-2.5 bg-dash-bg rounded-lg group">
            <Avatar user={entry.user} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-dash-text">{formatMinutes(entry.minutes)}</span>
                <span className="text-xs text-dash-muted">{entry.user.name}</span>
                <span className="text-xs text-dash-muted/60">
                  {new Date(entry.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              {entry.description && (
                <p className="text-xs text-dash-muted mt-0.5 truncate">{entry.description}</p>
              )}
            </div>
            {user?.id === entry.userId && (
              <button
                onClick={() => deleteEntry.mutate(entry.id)}
                className="text-xs text-red-400/0 group-hover:text-red-400/60 hover:!text-red-400 transition-colors shrink-0"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
