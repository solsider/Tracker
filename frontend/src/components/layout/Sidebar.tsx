import { useEffect } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { useProjects } from '../../hooks/useProjects';

function NavItem({
  to,
  icon,
  children,
  end = false,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-accent ${
          isActive
            ? 'bg-dash-accent/20 text-dash-accent border-l-2 border-dash-accent pl-[10px]'
            : 'text-dash-muted hover:bg-dash-border/70 hover:text-dash-text border-l-2 border-transparent pl-[10px]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`w-4 h-4 shrink-0 ${isActive ? '' : 'opacity-60'}`}>{icon}</span>
          {children}
        </>
      )}
    </NavLink>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const BoardIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor">
    <rect x="1" y="1" width="6" height="14" rx="1" />
    <rect x="9" y="1" width="6" height="9" rx="1" />
  </svg>
);
const ListIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="2" y1="4" x2="14" y2="4" />
    <line x1="2" y1="8" x2="14" y2="8" />
    <line x1="2" y1="12" x2="10" y2="12" />
  </svg>
);
const GanttIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor">
    <rect x="1" y="2" width="8" height="3" rx="1" />
    <rect x="4" y="6.5" width="10" height="3" rx="1" />
    <rect x="2" y="11" width="6" height="3" rx="1" />
  </svg>
);
const BacklogIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="1.5" y="1.5" width="13" height="4" rx="1" />
    <rect x="1.5" y="7" width="9" height="4" rx="1" />
    <rect x="1.5" y="12.5" width="6" height="2" rx="1" />
  </svg>
);
const VelocityIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="1,13 5,8 8,10 12,4 15,6" />
  </svg>
);
const CalendarIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="1.5" y="2.5" width="13" height="12" rx="1" />
    <line x1="1.5" y1="6.5" x2="14.5" y2="6.5" />
    <line x1="5" y1="1" x2="5" y2="4" />
    <line x1="11" y1="1" x2="11" y2="4" />
  </svg>
);
const DashboardIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor">
    <rect x="1" y="1" width="6" height="6" rx="1" />
    <rect x="9" y="1" width="6" height="6" rx="1" />
    <rect x="1" y="9" width="6" height="6" rx="1" />
    <rect x="9" y="9" width="6" height="6" rx="1" />
  </svg>
);
const AnalyticsIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="1" y="9" width="3" height="6" rx="0.5" />
    <rect x="6" y="5" width="3" height="10" rx="0.5" />
    <rect x="11" y="2" width="3" height="13" rx="0.5" />
  </svg>
);

// ── Project nav (expands when a project is active) ───────────────────────────

function ProjectNav({ projectId }: { projectId: string }) {
  return (
    <div className="mt-1 ml-2 pl-2 border-l border-dash-border space-y-0.5">
      <NavItem to={`/projects/${projectId}/board`} icon={<BoardIcon />}>Доска</NavItem>
      <NavItem to={`/projects/${projectId}/backlog`} icon={<BacklogIcon />}>Бэклог</NavItem>
      <NavItem to={`/projects/${projectId}/issues`} icon={<ListIcon />}>Задачи</NavItem>
      <NavItem to={`/projects/${projectId}/calendar`} icon={<CalendarIcon />}>Календарь</NavItem>
      <NavItem to={`/projects/${projectId}/gantt`} icon={<GanttIcon />}>Гант</NavItem>
      <NavItem to={`/projects/${projectId}/dashboard`} icon={<DashboardIcon />}>Дашборд</NavItem>
      <NavItem to={`/projects/${projectId}/analytics`} icon={<AnalyticsIcon />}>Аналитика</NavItem>
      <NavItem to={`/projects/${projectId}/velocity`} icon={<VelocityIcon />}>Скорость</NavItem>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: projects } = useProjects();
  const { id: activeProjectId } = useParams<{ id?: string }>();

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Close sidebar on nav (mobile)
  const handleNavClick = () => { if (window.innerWidth < 768) onClose(); };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 w-56 bg-dash-panel border-r border-dash-border flex flex-col shrink-0 overflow-y-auto
        transition-transform duration-200 ease-out
        md:static md:translate-x-0 md:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
    >
      <div className="p-4 space-y-1" onClick={handleNavClick}>
        {/* Global dashboard */}
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-accent border-l-2 pl-[10px] ${
              isActive
                ? 'bg-dash-accent/20 text-dash-accent border-dash-accent'
                : 'text-dash-muted hover:bg-dash-border/70 hover:text-dash-text border-transparent'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`shrink-0 ${isActive ? '' : 'opacity-60'}`}>
                <DashboardIcon />
              </span>
              Дашборд
            </>
          )}
        </NavLink>

        {/* All projects */}
        <NavLink
          to="/projects"
          end
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-accent border-l-2 pl-[10px] ${
              isActive
                ? 'bg-dash-accent/20 text-dash-accent border-dash-accent'
                : 'text-dash-muted hover:bg-dash-border/70 hover:text-dash-text border-transparent'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`shrink-0 ${isActive ? '' : 'opacity-60'}`}>
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z" />
                </svg>
              </span>
              Все проекты
            </>
          )}
        </NavLink>

        {projects && projects.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-dash-muted uppercase tracking-wider mb-2 px-3">
              Проекты
            </p>
            <nav className="space-y-0.5">
              {projects.map((project) => (
                <div key={project.id}>
                  <NavLink
                    to={`/projects/${project.id}`}
                    end
                    className={({ isActive }) => {
                      const isProjectActive = isActive || activeProjectId === project.id;
                      return `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dash-accent border-l-2 pl-[10px] ${
                        isProjectActive
                          ? 'bg-dash-accent/15 text-dash-text border-dash-accent/60'
                          : 'text-dash-muted hover:bg-dash-border/70 hover:text-dash-text border-transparent'
                      }`;
                    }}
                  >
                    <span className="w-5 h-5 rounded bg-dash-accent/20 border border-dash-accent/20 flex items-center justify-center text-[9px] font-bold text-dash-accent shrink-0">
                      {project.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="truncate">{project.name}</span>
                  </NavLink>
                  {activeProjectId === project.id && (
                    <ProjectNav projectId={project.id} />
                  )}
                </div>
              ))}
            </nav>
          </div>
        )}
      </div>
    </aside>
  );
}
