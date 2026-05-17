import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useReleases, useCreateRelease, useUpdateRelease, useDeleteRelease } from '../../hooks/useReleases';
import type { Release, ReleaseStatus } from '../../api/releases.api';

const STATUS_LABELS: Record<ReleaseStatus, string> = {
  DRAFT: 'Черновик',
  RELEASED: 'Выпущено',
  ARCHIVED: 'Архив',
};

const STATUS_COLORS: Record<ReleaseStatus, string> = {
  DRAFT: 'bg-yellow-500/20 text-yellow-300',
  RELEASED: 'bg-green-500/20 text-green-400',
  ARCHIVED: 'bg-dash-border text-dash-muted',
};

function CreateReleaseModal({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const [version, setVersion] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const create = useCreateRelease(projectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!version.trim()) return;
    create.mutate({ version: version.trim(), name: name.trim() || undefined, description: description.trim() || undefined }, {
      onSuccess: onClose,
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60" onClick={onClose}>
      <form
        className="bg-dash-panel border border-dash-border rounded-xl p-6 w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 className="text-lg font-bold text-dash-text">Новый релиз</h2>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-dash-muted">Версия *</label>
            <input
              autoFocus
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0.0"
              className="mt-1 w-full bg-dash-bg border border-dash-border rounded-lg px-3 py-2 text-sm text-dash-text focus:outline-none focus:border-dash-accent/50 font-mono"
            />
          </div>
          <div>
            <label className="text-xs text-dash-muted">Название</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Summer Release"
              className="mt-1 w-full bg-dash-bg border border-dash-border rounded-lg px-3 py-2 text-sm text-dash-text focus:outline-none focus:border-dash-accent/50"
            />
          </div>
          <div>
            <label className="text-xs text-dash-muted">Описание / Release Notes</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Что нового в этой версии..."
              className="mt-1 w-full bg-dash-bg border border-dash-border rounded-lg px-3 py-2 text-sm text-dash-text focus:outline-none focus:border-dash-accent/50 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="text-sm px-4 py-2 text-dash-muted hover:text-dash-text">Отмена</button>
          <button type="submit" disabled={create.isPending} className="text-sm px-4 py-2 bg-dash-accent text-white rounded-lg hover:bg-dash-accent/80 disabled:opacity-50">
            Создать
          </button>
        </div>
      </form>
    </div>
  );
}

function ReleaseCard({ release, projectId }: { release: Release; projectId: string }) {
  const update = useUpdateRelease(projectId);
  const deleteR = useDeleteRelease(projectId);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-dash-panel border border-dash-border rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <code className="text-lg font-bold text-dash-text font-mono">v{release.version}</code>
          {release.name && <span className="text-sm text-dash-muted truncate">{release.name}</span>}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[release.status]}`}>
            {STATUS_LABELS[release.status]}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {release.status === 'DRAFT' && (
            <button
              onClick={() => update.mutate({ id: release.id, status: 'RELEASED', releasedAt: new Date().toISOString() })}
              className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
            >
              Выпустить
            </button>
          )}
          {release.status === 'RELEASED' && (
            <button
              onClick={() => update.mutate({ id: release.id, status: 'ARCHIVED' })}
              className="text-xs px-2 py-1 bg-dash-border text-dash-muted rounded hover:text-dash-text"
            >
              Архивировать
            </button>
          )}
          <button
            onClick={() => { if (confirm('Удалить релиз?')) deleteR.mutate(release.id); }}
            className="text-xs text-dash-muted hover:text-red-400 transition-colors"
          >
            Удалить
          </button>
        </div>
      </div>

      {release.description && (
        <div>
          <p className={`text-sm text-dash-muted whitespace-pre-wrap ${!expanded && release.description.length > 200 ? 'line-clamp-3' : ''}`}>
            {release.description}
          </p>
          {release.description.length > 200 && (
            <button onClick={() => setExpanded((p) => !p)} className="text-xs text-dash-accent mt-1">
              {expanded ? 'Свернуть' : 'Показать всё'}
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-dash-muted">
        <span>{release._count?.issues ?? 0} задач</span>
        <span>Создан: {new Date(release.createdAt).toLocaleDateString('ru-RU')}</span>
        {release.releasedAt && <span>Выпущен: {new Date(release.releasedAt).toLocaleDateString('ru-RU')}</span>}
      </div>
    </div>
  );
}

export function ReleasesPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { data: releases = [], isLoading } = useReleases(projectId!);
  const [showCreate, setShowCreate] = useState(false);

  const byStatus = {
    DRAFT: releases.filter((r) => r.status === 'DRAFT'),
    RELEASED: releases.filter((r) => r.status === 'RELEASED'),
    ARCHIVED: releases.filter((r) => r.status === 'ARCHIVED'),
  };

  return (
    <>
      {showCreate && <CreateReleaseModal projectId={projectId!} onClose={() => setShowCreate(false)} />}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-dash-text">Релизы</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="text-sm px-4 py-2 bg-dash-accent text-white rounded-lg hover:bg-dash-accent/80"
          >
            + Новый релиз
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-28 bg-dash-panel rounded-xl animate-pulse" />)}
          </div>
        ) : releases.length === 0 ? (
          <div className="text-center py-16 text-dash-muted">
            <p className="text-4xl mb-3">🚀</p>
            <p className="text-sm">Нет релизов. Создайте первый!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {byStatus.DRAFT.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-dash-muted mb-3 uppercase tracking-wide">Черновики</h2>
                <div className="space-y-3">{byStatus.DRAFT.map((r) => <ReleaseCard key={r.id} release={r} projectId={projectId!} />)}</div>
              </section>
            )}
            {byStatus.RELEASED.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-dash-muted mb-3 uppercase tracking-wide">Выпущено</h2>
                <div className="space-y-3">{byStatus.RELEASED.map((r) => <ReleaseCard key={r.id} release={r} projectId={projectId!} />)}</div>
              </section>
            )}
            {byStatus.ARCHIVED.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-dash-muted mb-3 uppercase tracking-wide">Архив</h2>
                <div className="space-y-3">{byStatus.ARCHIVED.map((r) => <ReleaseCard key={r.id} release={r} projectId={projectId!} />)}</div>
              </section>
            )}
          </div>
        )}
      </div>
    </>
  );
}
