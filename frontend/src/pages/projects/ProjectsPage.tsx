import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjects, useCreateProject } from '../../hooks/useProjects';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, EmptyIcons } from '../../components/ui/EmptyState';
import type { CreateProjectDto } from '../../types';

function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<CreateProjectDto>({ name: '', description: '' });
  const createProject = useCreateProject();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProject.mutate(form, { onSuccess: onClose });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Название проекта"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        required
        minLength={2}
        placeholder="Мой проект"
        autoFocus
      />
      <Input
        label="Описание"
        value={form.description ?? ''}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        placeholder="Краткое описание проекта"
      />
      {createProject.error && (
        <p className="text-sm text-red-400">
          {(createProject.error as any)?.response?.data?.message || 'Ошибка создания проекта'}
        </p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Отмена
        </Button>
        <Button type="submit" loading={createProject.isPending}>
          Создать
        </Button>
      </div>
    </form>
  );
}

function ProjectCard({ project }: { project: { id: string; name: string; description: string | null; _count?: { issues: number; members: number } } }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="block p-5 bg-dash-panel border border-dash-border rounded-card hover:border-dash-accent/40 hover:shadow-glow-sm transition-[border-color,box-shadow] duration-200 group shadow-card"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-dash-accent/20 border border-dash-accent/30 flex items-center justify-center shrink-0 text-xs font-bold text-dash-accent group-hover:bg-dash-accent/30 transition-colors">
          {project.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-dash-text group-hover:text-white transition-colors truncate">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-sm text-dash-muted mt-0.5 line-clamp-2">{project.description}</p>
          )}
        </div>
      </div>
      <div className="mt-4 flex gap-4 text-xs text-dash-muted">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z" />
          </svg>
          {project._count?.issues ?? 0} задач
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="5" r="3" />
            <path d="M1 14c0-3.866 3.134-7 7-7s7 3.134 7 7" />
          </svg>
          {project._count?.members ?? 0} участников
        </span>
      </div>
    </Link>
  );
}

export function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1.5">
            <div className="h-7 w-36 bg-dash-border/60 rounded-lg animate-pulse" />
            <div className="h-4 w-20 bg-dash-border/40 rounded animate-pulse" />
          </div>
          <div className="h-9 w-36 bg-dash-border/60 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-5 bg-dash-panel border border-dash-border rounded-card shadow-card animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-dash-border/60 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-dash-border/60 rounded" />
                  <div className="h-3 w-full bg-dash-border/40 rounded" />
                </div>
              </div>
              <div className="mt-4 flex gap-4">
                <div className="h-3 w-16 bg-dash-border/40 rounded" />
                <div className="h-3 w-20 bg-dash-border/40 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dash-text">Мои проекты</h1>
          <p className="text-sm text-dash-muted mt-0.5">
            {projects?.length ?? 0} {projects?.length === 1 ? 'проект' : 'проектов'}
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <svg className="w-4 h-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Создать проект
        </Button>
      </div>

      {!projects?.length ? (
        <EmptyState
          icon={EmptyIcons.generic}
          title="Нет проектов"
          description="Создайте первый проект, чтобы начать работу"
          action={{ label: 'Создать проект', onClick: () => setIsModalOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Создать проект">
        <CreateProjectModal onClose={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
}
