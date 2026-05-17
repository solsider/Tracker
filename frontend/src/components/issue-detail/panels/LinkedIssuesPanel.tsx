import { useState } from 'react';
import { useIssueLinks, useCreateIssueLink, useDeleteIssueLink } from '../../../hooks/useIssueLinks';
import { useDrawerStore } from '../../../store/drawer.store';
import { Skeleton } from '../../ui/Skeleton';
import { LINK_TYPE_LABELS, TYPE_ICONS, PRIORITY_ICONS } from '../IssueDetailConstants';
import type { IssueLinkType, IssueStub } from '../../../types';

const LINK_TYPE_OPTIONS: IssueLinkType[] = [
  'BLOCKS', 'RELATES_TO', 'DUPLICATES', 'CLONES', 'SPLIT_FROM', 'CAUSED_BY',
];

interface LinkedIssuesPanelProps {
  issueId: string;
  projectId: string;
}

export function LinkedIssuesPanel({ issueId, projectId }: LinkedIssuesPanelProps) {
  const { data, isLoading } = useIssueLinks(issueId);
  const createLink = useCreateIssueLink(issueId);
  const deleteLink = useDeleteIssueLink(issueId);
  const openDrawer = useDrawerStore((s) => s.open);

  const [isAdding, setIsAdding] = useState(false);
  const [targetNumber, setTargetNumber] = useState('');
  const [linkType, setLinkType] = useState<IssueLinkType>('RELATES_TO');
  const [error, setError] = useState('');

  const handleCreate = () => {
    setError('');
    if (!targetNumber.trim()) return;
    createLink.mutate(
      { targetId: targetNumber.trim(), type: linkType },
      {
        onSuccess: () => { setTargetNumber(''); setIsAdding(false); },
        onError: (e: any) => setError(e?.response?.data?.message || 'Ошибка'),
      },
    );
  };

  const totalLinks = (data?.outgoing.length ?? 0) + (data?.incoming.length ?? 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-dash-text">
          Связанные задачи {totalLinks > 0 ? `(${totalLinks})` : ''}
        </h3>
        <button
          onClick={() => setIsAdding(true)}
          className="text-xs text-dash-accent hover:text-dash-accent/80"
        >
          + Добавить
        </button>
      </div>

      {isAdding && (
        <div className="space-y-2 p-3 bg-dash-bg border border-dash-border rounded-lg">
          <select
            value={linkType}
            onChange={(e) => setLinkType(e.target.value as IssueLinkType)}
            className="w-full px-2 py-1.5 text-xs bg-dash-panel border border-dash-border rounded text-dash-text focus:outline-none focus:border-dash-accent/50"
          >
            {LINK_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{LINK_TYPE_LABELS[t].label}</option>
            ))}
          </select>
          <input
            type="text"
            value={targetNumber}
            onChange={(e) => setTargetNumber(e.target.value)}
            placeholder="ID задачи..."
            className="w-full px-2 py-1.5 text-xs bg-dash-panel border border-dash-border rounded text-dash-text focus:outline-none focus:border-dash-accent/50"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={createLink.isPending}
              className="px-3 py-1.5 text-xs bg-dash-accent text-white rounded hover:bg-dash-accent/80 disabled:opacity-50"
            >
              Связать
            </button>
            <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-xs text-dash-muted hover:text-dash-text">
              Отмена
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[1, 2].map((i) => <Skeleton key={i} className="h-10" />)}
        </div>
      )}

      {totalLinks === 0 && !isLoading && (
        <p className="text-xs text-dash-muted text-center py-4">Нет связанных задач</p>
      )}

      {data?.outgoing.map((link) => (
        <LinkedIssueRow
          key={link.id}
          id={link.id}
          label={LINK_TYPE_LABELS[link.type].label}
          issue={link.target}
          projectId={projectId}
          onOpen={openDrawer}
          onDelete={(id) => deleteLink.mutate(id)}
        />
      ))}

      {data?.incoming.map((link) => (
        <LinkedIssueRow
          key={link.id}
          id={link.id}
          label={LINK_TYPE_LABELS[link.type].inverseLabel}
          issue={link.source}
          projectId={projectId}
          onOpen={openDrawer}
          onDelete={(id) => deleteLink.mutate(id)}
        />
      ))}
    </div>
  );
}

function LinkedIssueRow({
  id, label, issue, projectId, onOpen, onDelete,
}: {
  id: string;
  label: string;
  issue: IssueStub;
  projectId: string;
  onOpen: (projectId: string, number: number) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-dash-bg group">
      <span className="text-xs text-dash-muted w-20 shrink-0">{label}</span>
      <button
        onClick={() => onOpen(projectId, issue.number)}
        className="flex-1 flex items-center gap-2 text-left hover:text-dash-accent"
      >
        <span className="text-xs">{TYPE_ICONS[issue.type]}</span>
        <span className="text-xs font-mono text-dash-muted">#{issue.number}</span>
        <span className="text-xs text-dash-text truncate group-hover:text-dash-accent">{issue.title}</span>
        <span className="text-xs shrink-0">{PRIORITY_ICONS[issue.priority]}</span>
      </button>
      <button
        onClick={() => onDelete(id)}
        className="text-xs text-red-400/0 group-hover:text-red-400/60 hover:!text-red-400 transition-colors shrink-0"
      >
        ✕
      </button>
    </div>
  );
}
