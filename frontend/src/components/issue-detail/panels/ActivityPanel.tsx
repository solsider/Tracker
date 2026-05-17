import { useIssueActivity } from '../../../hooks/useActivity';
import { Skeleton } from '../../ui/Skeleton';
import { Avatar } from '../../ui/AvatarStack';
import { ACTIVITY_LABELS, formatRelativeTime } from '../IssueDetailConstants';
import type { ActivityLog } from '../../../types';

interface ActivityPanelProps {
  issueId: string;
}

export function ActivityPanel({ issueId }: ActivityPanelProps) {
  const { data: activities, isLoading } = useIssueActivity(issueId, 50);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-dash-text">История изменений</h3>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-6 h-6 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      )}

      {activities?.length === 0 && !isLoading && (
        <p className="text-xs text-dash-muted text-center py-4">Нет активности</p>
      )}

      <div className="space-y-3">
        {activities?.map((log) => (
          <ActivityRow key={log.id} log={log} />
        ))}
      </div>
    </div>
  );
}

function ActivityRow({ log }: { log: ActivityLog }) {
  const verb = ACTIVITY_LABELS[log.action] ?? log.action.toLowerCase().replace(/_/g, ' ');

  return (
    <div className="flex gap-2.5 items-start">
      <Avatar user={log.user} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-xs font-medium text-dash-text">{log.user.name}</span>
          <span className="text-xs text-dash-muted">{verb}</span>
          {log.newValue && !log.oldValue && (
            <span className="text-xs text-dash-text font-medium">«{log.newValue}»</span>
          )}
          {log.oldValue && log.newValue && (
            <>
              <span className="text-xs text-red-400/70 line-through">{log.oldValue}</span>
              <span className="text-xs text-dash-muted">→</span>
              <span className="text-xs text-green-400">{log.newValue}</span>
            </>
          )}
          {log.field && (
            <span className="text-xs text-dash-muted">({log.field})</span>
          )}
        </div>
        <span className="text-xs text-dash-muted/60">{formatRelativeTime(log.createdAt)}</span>
      </div>
    </div>
  );
}
