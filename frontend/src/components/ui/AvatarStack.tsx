interface AvatarItem {
  id: string;
  name: string;
  avatar: string | null;
}

interface AvatarStackProps {
  users: AvatarItem[];
  max?: number;
  size?: 'sm' | 'md';
}

function Avatar({ user, size }: { user: AvatarItem; size: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs';
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        title={user.name}
        className={`${sizeClass} rounded-full border-2 border-dash-panel object-cover`}
      />
    );
  }
  return (
    <div
      title={user.name}
      className={`${sizeClass} rounded-full border-2 border-dash-panel bg-dash-accent flex items-center justify-center font-semibold text-white`}
    >
      {user.name.charAt(0).toUpperCase()}
    </div>
  );
}

export function AvatarStack({ users, max = 4, size = 'sm' }: AvatarStackProps) {
  const visible = users.slice(0, max);
  const overflow = users.length - max;
  const sizeClass = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs';

  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((u) => (
        <Avatar key={u.id} user={u} size={size} />
      ))}
      {overflow > 0 && (
        <div
          className={`${sizeClass} rounded-full border-2 border-dash-panel bg-dash-border flex items-center justify-center font-semibold text-dash-muted`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

export { Avatar };
