import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { useLogout } from '../../hooks/useAuth';
import { useRealtimeStore } from '../../store/realtime.store';
import { NotificationBell } from './NotificationBell';

function UserAvatar({ name, avatar }: { name: string; avatar: string | null }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="w-8 h-8 rounded-full object-cover ring-2 ring-dash-border"
      />
    );
  }
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-dash-accent/20 border border-dash-accent/30 flex items-center justify-center text-xs font-semibold text-dash-accent">
      {initials}
    </div>
  );
}

export function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { user } = useAuthStore();
  const logout = useLogout();
  const connected = useRealtimeStore((s) => s.connected);

  return (
    <header className="bg-dash-panel border-b border-dash-border h-14 flex items-center px-4 md:px-6 shrink-0 z-40">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuToggle}
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-dash-muted hover:text-dash-text hover:bg-dash-border transition-colors mr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-accent"
        aria-label="Открыть меню"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <Link
        to="/projects"
        className="text-xl font-bold text-dash-accent mr-8 tracking-tight hover:text-dash-accent/80 transition-colors"
      >
        Tracker
      </Link>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {/* Connection status dot — semantic only, no count */}
        <div
          title={connected ? 'Подключено' : 'Не подключено'}
          aria-label={connected ? 'Соединение установлено' : 'Нет соединения'}
          className={`w-2 h-2 rounded-full transition-colors ${connected ? 'bg-green-400' : 'bg-dash-muted'}`}
        />

        <NotificationBell />

        {user && (
          <Link
            to="/profile"
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-dash-border transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-accent"
          >
            <UserAvatar name={user.name} avatar={user.avatar} />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-dash-text group-hover:text-white transition-colors leading-none">
                {user.name}
              </p>
              {user.position && (
                <p className="text-xs text-dash-muted leading-none mt-0.5">{user.position}</p>
              )}
            </div>
          </Link>
        )}

        <div className="w-px h-6 bg-dash-border mx-1" />

        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-dash-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          aria-label="Выйти"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="hidden sm:inline">Выйти</span>
        </button>
      </div>
    </header>
  );
}
