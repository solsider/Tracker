import { useWatchers, useWatchIssue, useUnwatchIssue } from '../../../hooks/useWatchers';
import { useAuthStore } from '../../../store/auth.store';
import { AvatarStack } from '../../ui/AvatarStack';
import { Skeleton } from '../../ui/Skeleton';

interface WatchersPanelProps {
  issueId: string;
}

export function WatchersPanel({ issueId }: WatchersPanelProps) {
  const { user } = useAuthStore();
  const { data: watchers, isLoading } = useWatchers(issueId);
  const watchIssue = useWatchIssue(issueId);
  const unwatchIssue = useUnwatchIssue(issueId);

  const isWatching = watchers?.some((w) => w.userId === user?.id);

  const handleToggle = () => {
    if (isWatching) {
      unwatchIssue.mutate();
    } else {
      watchIssue.mutate();
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xs text-dash-muted">Наблюдатели</span>
        {isLoading ? (
          <Skeleton className="w-16 h-5 rounded-full" />
        ) : watchers && watchers.length > 0 ? (
          <AvatarStack users={watchers.map((w) => w.user)} max={5} size="sm" />
        ) : (
          <span className="text-xs text-dash-muted/60">нет</span>
        )}
      </div>
      <button
        onClick={handleToggle}
        disabled={watchIssue.isPending || unwatchIssue.isPending}
        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-50 ${
          isWatching
            ? 'border-dash-accent text-dash-accent hover:bg-dash-accent/10'
            : 'border-dash-border text-dash-muted hover:border-dash-accent/40 hover:text-dash-text'
        }`}
      >
        {isWatching ? '👁 Слежу' : '+ Следить'}
      </button>
    </div>
  );
}
