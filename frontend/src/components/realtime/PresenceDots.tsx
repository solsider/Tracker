import { useRealtimeStore } from '../../store/realtime.store';

interface Props {
  issueId: string;
  currentUserId?: string;
}

export function PresenceDots({ issueId, currentUserId }: Props) {
  const viewers = useRealtimeStore((s) => s.issuePresence[issueId] ?? []);
  const others = viewers.filter((v) => v.userId !== currentUserId);

  if (!others.length) return null;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-dash-muted">Просматривает:</span>
      <div className="flex -space-x-1.5">
        {others.slice(0, 5).map((v) => (
          <div
            key={v.userId}
            title={v.name}
            className="w-6 h-6 rounded-full bg-dash-accent/20 border-2 border-dash-panel flex items-center justify-center text-[10px] font-semibold text-dash-accent"
          >
            {v.name.charAt(0).toUpperCase()}
          </div>
        ))}
        {others.length > 5 && (
          <div className="w-6 h-6 rounded-full bg-dash-border border-2 border-dash-panel flex items-center justify-center text-[9px] text-dash-muted">
            +{others.length - 5}
          </div>
        )}
      </div>
    </div>
  );
}
