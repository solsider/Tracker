import { useRealtimeStore } from '../../store/realtime.store';

interface Props {
  issueId: string;
  currentUserId?: string;
}

export function TypingIndicator({ issueId, currentUserId }: Props) {
  const typing = useRealtimeStore((s) => s.typingUsers[issueId] ?? []);
  const others = typing.filter((u) => u.userId !== currentUserId);

  if (!others.length) return null;

  const names = others.map((u) => u.name).join(', ');
  const verb = others.length === 1 ? 'печатает' : 'печатают';

  return (
    <div className="flex items-center gap-1.5 text-xs text-dash-muted italic px-1">
      <span className="flex gap-0.5">
        <span className="w-1 h-1 rounded-full bg-dash-muted animate-bounce [animation-delay:0ms]" />
        <span className="w-1 h-1 rounded-full bg-dash-muted animate-bounce [animation-delay:150ms]" />
        <span className="w-1 h-1 rounded-full bg-dash-muted animate-bounce [animation-delay:300ms]" />
      </span>
      <span>{names} {verb}…</span>
    </div>
  );
}
