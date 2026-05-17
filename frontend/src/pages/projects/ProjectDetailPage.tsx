import { useParams, Link } from 'react-router-dom';
import { useProject } from '../../hooks/useProjects';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Владелец', ADMIN: 'Администратор', MEMBER: 'Участник', VIEWER: 'Наблюдатель',
};

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading } = useProject(id!);

  if (isLoading) {
    return <div className="text-dash-muted text-sm">Загрузка проекта...</div>;
  }
  if (!project) {
    return <div className="text-dash-muted text-sm">Проект не найден</div>;
  }

  return (
    <div>
      <div className="mb-1">
        <h1 className="text-2xl font-bold text-dash-text">{project.name}</h1>
      </div>
      {project.description && (
        <p className="text-dash-muted mb-6">{project.description}</p>
      )}

      <div className="flex gap-3 mb-8 flex-wrap">
        <NavBtn to={`/projects/${project.id}/issues`}>
          Задачи ({project._count?.issues ?? 0})
        </NavBtn>
        <NavBtn to={`/projects/${project.id}/board`}>
          Kanban доска
        </NavBtn>
        <NavBtn to={`/projects/${project.id}/gantt`}>
          Диаграмма Ганта
        </NavBtn>
      </div>

      <div>
        <h2 className="text-base font-semibold text-dash-text mb-3">Участники</h2>
        <div className="space-y-2">
          {project.members?.map((member) => (
            <div key={member.id} className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-full bg-dash-accent/20 flex items-center justify-center text-sm font-semibold text-dash-accent shrink-0">
                {member.user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-dash-text">{member.user.name}</p>
                <p className="text-xs text-dash-muted">{ROLE_LABELS[member.role] ?? member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NavBtn({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border border-dash-border text-dash-muted bg-dash-panel hover:border-dash-accent/40 hover:text-dash-text transition-colors"
    >
      {children}
    </Link>
  );
}
