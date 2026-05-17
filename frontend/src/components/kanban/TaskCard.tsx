import type React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDrawerStore } from '../../store/drawer.store';
import type { Issue, IssuePriority, IssueType } from '../../types';

const PRIORITY_COLORS: Record<IssuePriority, string> = {
  CRITICAL: 'bg-red-400/10 text-red-400',
  HIGH: 'bg-orange-400/10 text-orange-400',
  MEDIUM: 'bg-yellow-400/10 text-yellow-400',
  LOW: 'bg-green-400/10 text-green-400',
};

const PRIORITY_LABELS: Record<IssuePriority, string> = {
  CRITICAL: 'Крит.',
  HIGH: 'Высок.',
  MEDIUM: 'Средн.',
  LOW: 'Низк.',
};

const TYPE_ICONS: Record<IssueType, React.ReactNode> = {
  TASK: (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <polyline points="2,7 5.5,10.5 12,3.5" />
    </svg>
  ),
  BUG: (
    <svg viewBox="0 0 14 14" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M7 1a2.5 2.5 0 00-2.5 2.5H2.5a.5.5 0 000 1h.6A4.5 4.5 0 002 8.5H1a.5.5 0 000 1h1.07A4.5 4.5 0 007 13a4.5 4.5 0 004.93-3.5H13a.5.5 0 000-1h-1a4.5 4.5 0 00-1.1-4H11.5a.5.5 0 000-1H9.5A2.5 2.5 0 007 1z" />
    </svg>
  ),
  STORY: (
    <svg viewBox="0 0 14 14" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M7 1L8.8 5.2H13.4L9.8 7.8L11.2 12L7 9.3L2.8 12L4.2 7.8L0.6 5.2H5.2L7 1Z" />
    </svg>
  ),
  EPIC: (
    <svg viewBox="0 0 14 14" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M7.8 1.2l5 10.4a.9.9 0 01-.8 1.4H2a.9.9 0 01-.8-1.4l5-10.4a.9.9 0 011.6 0z" />
    </svg>
  ),
};

interface TaskCardProps {
  issue: Issue;
  isDragging?: boolean;
  projectId?: string;
}

export function TaskCard({ issue, isDragging = false, projectId }: TaskCardProps) {
  const openDrawer = useDrawerStore((s) => s.open);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isActive,
  } = useSortable({
    id: issue.id,
    data: { type: 'task', issue },
    disabled: isDragging,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div className="bg-dash-panel rounded-lg border border-dash-accent/40 p-3 select-none shadow-2xl rotate-2 scale-105 cursor-grabbing">
        <CardContent issue={issue} />
      </div>
    );
  }

  const handleClick = (e: React.MouseEvent) => {
    // Only open on direct click (not after drag)
    if (e.defaultPrevented) return;
    if (projectId) openDrawer(projectId, issue.number);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      className={`bg-dash-panel rounded-lg border p-3 select-none transition-all ${
        isActive
          ? 'opacity-0'
          : 'border-dash-border hover:border-dash-accent/40 hover:shadow-md cursor-pointer'
      }`}
    >
      <CardContent issue={issue} />
    </div>
  );
}

function CardContent({ issue }: { issue: Issue }) {
  return (
    <>
      <div className="flex items-start gap-2 mb-2">
        <span className="text-dash-muted mt-0.5 shrink-0 flex items-center">
          {TYPE_ICONS[issue.type]}
        </span>
        <p className="text-sm font-medium text-dash-text leading-snug">
          {issue.title}
        </p>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-dash-muted">#{issue.number}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[issue.priority]}`}>
            {PRIORITY_LABELS[issue.priority]}
          </span>
        </div>
        {issue.assignee && (
          <div
            className="w-6 h-6 rounded-full bg-dash-accent/20 flex items-center justify-center text-xs font-semibold text-dash-accent shrink-0"
            title={issue.assignee.name}
          >
            {issue.assignee.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </>
  );
}
