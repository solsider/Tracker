import { Link, useNavigate } from 'react-router-dom';
import { useProjects } from '../../hooks/useProjects';
import { useIssues } from '../../hooks/useIssues';
import { useSprints } from '../../hooks/useSprints';
import { useAuthStore } from '../../store/auth.store';
import { useDrawerStore } from '../../store/drawer.store';
import { EmptyState, EmptyIcons } from '../../components/ui/EmptyState';
import type { Issue, Sprint } from '../../types';

function SprintProgress({ sprint, issues }: { sprint: Sprint; issues: Issue[] }) {
  const sprintIssues = issues.filter((i) => i.sprintId === sprint.id);
  const done = sprintIssues.filter((i) =>
    i.column.title.toLowerCase().includes('done') || i.column.title.toLowerCase().includes('завершен') || i.column.title.toLowerCase().includes('closed'),
  ).length;
  const total = sprintIssues.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const endDate = sprint.endDate ? new Date(sprint.endDate) : null;
  const daysLeft = endDate ? Math.ceil((endDate.getTime() - Date.now()) / 86400000) : null;

  return (
    <div className="bg-dash-panel border border-dash-border rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-dash-text">{sprint.name}</p>
          {sprint.goal && <p className="text-xs text-dash-muted mt-0.5 line-clamp-1">{sprint.goal}</p>}
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium shrink-0 ml-2">
          Активный
        </span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 bg-dash-border rounded-full h-2 overflow-hidden">
          <div className="h-full bg-dash-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-semibold text-dash-accent shrink-0">{pct}%</span>
      </div>
      <div className="flex justify-between text-xs text-dash-muted">
        <span>{done}/{total} задач</span>
        {daysLeft != null && (
          <span className={daysLeft < 2 ? 'text-red-400' : daysLeft < 5 ? 'text-yellow-400' : ''}>
            {daysLeft > 0 ? `${daysLeft} дн. осталось` : 'Просрочен'}
          </span>
        )}
      </div>
    </div>
  );
}

function MyIssueRow({ issue, projectId }: { issue: Issue; projectId: string }) {
  const open = useDrawerStore((s) => s.open);
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = issue.dueDate && issue.dueDate.slice(0, 10) < today;

  const PRIORITY_DOT: Record<string, string> = {
    CRITICAL: 'bg-red-500',
    HIGH: 'bg-orange-400',
    MEDIUM: 'bg-yellow-400',
    LOW: 'bg-green-400',
  };

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-dash-border/50 cursor-pointer transition-colors group"
      onClick={() => open(projectId, issue.number)}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[issue.priority]}`} />
      <span className="text-xs font-mono text-dash-muted w-10 shrink-0">#{issue.number}</span>
      <span className="flex-1 text-sm text-dash-text truncate group-hover:text-white">{issue.title}</span>
      <span className="text-xs px-1.5 py-0.5 rounded text-white shrink-0" style={{ backgroundColor: issue.column.color }}>
        {issue.column.title}
      </span>
      {issue.dueDate && (
        <span className={`flex items-center gap-0.5 text-xs shrink-0 ${isOverdue ? 'text-red-400' : 'text-dash-muted'}`}>
          {isOverdue && (
            <svg viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3 shrink-0">
              <path d="M6 1a.4.4 0 01.357.214l4.5 8.25A.4.4 0 0110.5 10H1.5a.4.4 0 01-.357-.536l4.5-8.25A.4.4 0 016 1zm0 3.5a.5.5 0 00-.5.5v2a.5.5 0 001 0V5A.5.5 0 006 4.5zM6 9a.5.5 0 100-1 .5.5 0 000 1z" />
            </svg>
          )}
          {new Date(issue.dueDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
        </span>
      )}
    </div>
  );
}

// Per-project widget that loads its own issues
function ProjectWidget({ project }: { project: { id: string; name: string } }) {
  const { data: issues = [] } = useIssues(project.id);
  const { data: sprints = [] } = useSprints(project.id);
  const { user } = useAuthStore();

  const activeSprint = sprints.find((s) => s.status === 'ACTIVE');
  const myIssues = issues.filter((i) => i.assigneeId === user?.id);
  const overdueCount = myIssues.filter(
    (i) => i.dueDate && i.dueDate.slice(0, 10) < new Date().toISOString().slice(0, 10),
  ).length;

  if (!myIssues.length && !activeSprint) return null;

  return (
    <div className="bg-dash-panel border border-dash-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-dash-border">
        <Link
          to={`/projects/${project.id}/dashboard`}
          className="text-sm font-semibold text-dash-text hover:text-dash-accent transition-colors"
        >
          {project.name}
        </Link>
        <div className="flex gap-3 text-xs text-dash-muted">
          <span>{myIssues.length} моих</span>
          {overdueCount > 0 && (
            <span className="flex items-center gap-1 text-red-400">
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 shrink-0">
                <path d="M8 1.5a.5.5 0 01.447.276l6 11A.5.5 0 0114 13.5H2a.5.5 0 01-.447-.724l6-11A.5.5 0 018 1.5zM8 6a.5.5 0 00-.5.5v3a.5.5 0 001 0v-3A.5.5 0 008 6zm0 6.5a.625.625 0 100-1.25.625.625 0 000 1.25z" />
              </svg>
              {overdueCount} просрочено
            </span>
          )}
        </div>
      </div>
      {activeSprint && (
        <div className="px-4 py-3 border-b border-dash-border/50">
          <SprintProgress sprint={activeSprint} issues={issues} />
        </div>
      )}
      <div className="p-2">
        {myIssues.slice(0, 5).map((issue) => (
          <MyIssueRow key={issue.id} issue={issue} projectId={project.id} />
        ))}
        {myIssues.length > 5 && (
          <Link
            to={`/projects/${project.id}/issues`}
            className="block text-xs text-dash-muted hover:text-dash-accent px-3 py-1 transition-colors"
          >
            + ещё {myIssues.length - 5}
          </Link>
        )}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { data: projects = [] } = useProjects();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dash-text">Дашборд</h1>
          <p className="text-sm text-dash-muted mt-0.5">
            {user?.name ? `Привет, ${user.name}!` : 'Обзор ваших проектов'}
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={EmptyIcons.generic}
          title="Нет проектов"
          description="Создайте первый проект чтобы увидеть дашборд с задачами и спринтами"
          action={{ label: 'Перейти к проектам', onClick: () => navigate('/projects') }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map((project) => (
            <ProjectWidget key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
