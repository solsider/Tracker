import { useState } from 'react';
import { useGitLinks, useAddBranch, useDeleteBranch } from '../../../hooks/useGitLinks';
import type { GitBranch, GitCommit, GitPR } from '../../../api/git.api';

const STATE_COLORS: Record<string, string> = {
  open: 'text-green-400',
  merged: 'text-purple-400',
  closed: 'text-red-400',
};

function BranchRow({ branch, onDelete }: { branch: GitBranch; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-2 group px-2 py-1.5 rounded hover:bg-dash-border/50">
      <span className="text-dash-muted text-xs">⎇</span>
      {branch.url ? (
        <a href={branch.url} target="_blank" rel="noreferrer" className="text-xs text-dash-accent hover:underline flex-1 truncate font-mono">
          {branch.name}
        </a>
      ) : (
        <span className="text-xs text-dash-text flex-1 truncate font-mono">{branch.name}</span>
      )}
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-[10px] text-dash-muted hover:text-red-400 transition-all">✕</button>
    </div>
  );
}

function CommitRow({ commit }: { commit: GitCommit }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-dash-border/50">
      <span className="text-dash-muted text-xs">◉</span>
      <span className="text-[10px] font-mono text-dash-muted w-16 shrink-0">
        {commit.sha.slice(0, 7)}
      </span>
      {commit.url ? (
        <a href={commit.url} target="_blank" rel="noreferrer" className="text-xs text-dash-text hover:text-dash-accent flex-1 truncate hover:underline">
          {commit.message}
        </a>
      ) : (
        <span className="text-xs text-dash-text flex-1 truncate">{commit.message}</span>
      )}
      {commit.authorName && <span className="text-[10px] text-dash-muted shrink-0">{commit.authorName}</span>}
    </div>
  );
}

function PRRow({ pr }: { pr: GitPR }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-dash-border/50">
      <span className="text-xs">⎃</span>
      <span className="text-[10px] text-dash-muted shrink-0">#{pr.number}</span>
      <a href={pr.url} target="_blank" rel="noreferrer" className="text-xs text-dash-text hover:text-dash-accent flex-1 truncate hover:underline">
        {pr.title}
      </a>
      <span className={`text-[10px] font-medium shrink-0 ${STATE_COLORS[pr.state] ?? 'text-dash-muted'}`}>
        {pr.state}
      </span>
    </div>
  );
}

interface Props {
  projectId: string;
  issueNumber: number;
}

export function GitLinksPanel({ projectId, issueNumber }: Props) {
  const { data, isLoading } = useGitLinks(projectId, issueNumber);
  const addBranch = useAddBranch(projectId, issueNumber);
  const deleteBranch = useDeleteBranch(projectId, issueNumber);

  const [showBranchForm, setShowBranchForm] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [branchUrl, setBranchUrl] = useState('');

  const handleAddBranch = () => {
    if (!branchName.trim()) return;
    addBranch.mutate({ name: branchName.trim(), url: branchUrl.trim() || undefined }, {
      onSuccess: () => { setBranchName(''); setBranchUrl(''); setShowBranchForm(false); },
    });
  };

  if (isLoading) return <div className="h-16 animate-pulse bg-dash-panel rounded" />;

  const { branches = [], commits = [], pullRequests = [] } = data ?? {};
  const total = branches.length + commits.length + pullRequests.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-dash-text">
          Git {total > 0 && <span className="text-dash-muted text-xs font-normal ml-1">({total})</span>}
        </h3>
        <button
          onClick={() => setShowBranchForm((p) => !p)}
          className="text-xs text-dash-accent hover:text-dash-accent/80"
        >
          + Ветка
        </button>
      </div>

      {showBranchForm && (
        <div className="space-y-1.5 p-2 bg-dash-panel border border-dash-border rounded-lg">
          <input
            autoFocus
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            placeholder="feature/my-branch"
            className="w-full bg-transparent border border-dash-border rounded px-2 py-1 text-xs text-dash-text focus:outline-none focus:border-dash-accent/50 font-mono"
          />
          <input
            value={branchUrl}
            onChange={(e) => setBranchUrl(e.target.value)}
            placeholder="https://github.com/... (необязательно)"
            className="w-full bg-transparent border border-dash-border rounded px-2 py-1 text-xs text-dash-text focus:outline-none focus:border-dash-accent/50"
          />
          <div className="flex gap-1.5">
            <button onClick={handleAddBranch} className="text-xs px-2 py-1 bg-dash-accent text-white rounded hover:bg-dash-accent/80">
              Добавить
            </button>
            <button onClick={() => setShowBranchForm(false)} className="text-xs px-2 py-1 text-dash-muted hover:text-dash-text">
              Отмена
            </button>
          </div>
        </div>
      )}

      {total === 0 && !showBranchForm && (
        <p className="text-xs text-dash-muted text-center py-3">Нет связанных элементов Git</p>
      )}

      {branches.length > 0 && (
        <div>
          <p className="text-[10px] text-dash-muted uppercase tracking-wide px-2 mb-1">Ветки</p>
          {branches.map((b) => (
            <BranchRow key={b.id} branch={b} onDelete={() => deleteBranch.mutate(b.id)} />
          ))}
        </div>
      )}

      {pullRequests.length > 0 && (
        <div>
          <p className="text-[10px] text-dash-muted uppercase tracking-wide px-2 mb-1">Pull Requests</p>
          {pullRequests.map((pr) => <PRRow key={pr.id} pr={pr} />)}
        </div>
      )}

      {commits.length > 0 && (
        <div>
          <p className="text-[10px] text-dash-muted uppercase tracking-wide px-2 mb-1">Коммиты</p>
          {commits.slice(0, 5).map((c) => <CommitRow key={c.id} commit={c} />)}
          {commits.length > 5 && (
            <p className="text-[10px] text-dash-muted px-2">+{commits.length - 5} ещё</p>
          )}
        </div>
      )}
    </div>
  );
}
