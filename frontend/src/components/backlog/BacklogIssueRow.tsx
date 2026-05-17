import { useState, useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useDrawerStore } from '../../store/drawer.store';
import { TYPE_ICONS } from '../issue-detail/IssueDetailConstants';
import type { Issue } from '../../types';

const FIBONACCI = [1, 2, 3, 5, 8, 13, 21];

interface Props {
  issue: Issue;
  projectId: string;
  onUpdateSP: (issueNumber: number, sp: number | null) => void;
}

export function BacklogIssueRow({ issue, projectId, onUpdateSP }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: issue.id });
  const openDrawer = useDrawerStore((s) => s.open);
  const [spOpen, setSpOpen] = useState(false);
  const spRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!spOpen) return;
    const handler = (e: MouseEvent) => {
      if (spRef.current && !spRef.current.contains(e.target as Node)) {
        setSpOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [spOpen]);

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  const priorityDot =
    issue.priority === 'CRITICAL' ? 'bg-red-500' :
    issue.priority === 'HIGH' ? 'bg-orange-400' :
    issue.priority === 'MEDIUM' ? 'bg-yellow-400' : 'bg-green-400';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-dash-bg/60 group transition-colors ${isDragging ? 'opacity-30' : ''}`}
    >
      <button
        {...listeners}
        {...attributes}
        className="text-dash-muted/30 group-hover:text-dash-muted/60 hover:!text-dash-muted cursor-grab text-sm select-none shrink-0 transition-colors"
        tabIndex={-1}
        title="Перетащить"
      >
        ⠿
      </button>

      <span className="text-xs shrink-0 w-4 text-center">{TYPE_ICONS[issue.type]}</span>
      <span className="text-xs font-mono text-dash-muted shrink-0 w-8">#{issue.number}</span>

      <button
        onClick={() => openDrawer(projectId, issue.number)}
        className="flex-1 text-left text-sm text-dash-text hover:text-white truncate"
      >
        {issue.title}
      </button>

      {/* Story Points picker */}
      <div className="relative shrink-0" ref={spRef}>
        <button
          onClick={() => setSpOpen(!spOpen)}
          className={`w-6 h-6 rounded text-xs font-medium flex items-center justify-center transition-colors ${
            issue.storyPoints != null
              ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
              : 'text-dash-muted/30 group-hover:text-dash-muted/60 hover:!text-dash-muted hover:bg-dash-bg'
          }`}
          title="Story Points"
        >
          {issue.storyPoints ?? '·'}
        </button>
        {spOpen && (
          <div className="absolute right-0 top-8 z-20 flex gap-0.5 bg-dash-panel border border-dash-border rounded-lg p-1.5 shadow-xl">
            <button
              onClick={() => { onUpdateSP(issue.number, null); setSpOpen(false); }}
              className="w-7 h-7 text-xs rounded hover:bg-dash-bg text-dash-muted"
            >
              —
            </button>
            {FIBONACCI.map((sp) => (
              <button
                key={sp}
                onClick={() => { onUpdateSP(issue.number, sp); setSpOpen(false); }}
                className={`w-7 h-7 text-xs rounded hover:bg-dash-accent/20 ${
                  issue.storyPoints === sp ? 'bg-dash-accent/30 text-dash-accent font-semibold' : 'text-dash-muted'
                }`}
              >
                {sp}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Priority dot */}
      <div
        className={`w-2 h-2 rounded-full shrink-0 ${priorityDot}`}
        title={issue.priority}
      />

      {/* Assignee */}
      <div
        className="w-6 h-6 rounded-full bg-dash-border flex items-center justify-center text-[10px] text-dash-muted shrink-0 font-medium"
        title={issue.assignee?.name ?? 'Не назначен'}
      >
        {issue.assignee ? issue.assignee.name.charAt(0).toUpperCase() : '?'}
      </div>
    </div>
  );
}
