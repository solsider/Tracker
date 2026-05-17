import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useDrawerStore } from '../../store/drawer.store';
import { useIssue, useUpdateIssue } from '../../hooks/useIssues';
import { issuesApi } from '../../api/issues.api';
import { Drawer } from '../ui/Drawer';
import { Skeleton, SkeletonText } from '../ui/Skeleton';
import { RichTextEditor } from '../ui/RichTextEditor';
import { IssueSidebar } from './IssueSidebar';
import { useIssueRealtime } from '../../hooks/useRealtime';
import { PresenceDots } from '../realtime/PresenceDots';
import { useAuthStore } from '../../store/auth.store';
import { CommentsPanel } from './panels/CommentsPanel';
import { ChecklistPanel } from './panels/ChecklistPanel';
import { TimeTrackingPanel } from './panels/TimeTrackingPanel';
import { LinkedIssuesPanel } from './panels/LinkedIssuesPanel';
import { ActivityPanel } from './panels/ActivityPanel';
import { AttachmentsPanel } from './panels/AttachmentsPanel';
import { GitLinksPanel } from './panels/GitLinksPanel';
import { TYPE_ICONS, TYPE_LABELS, TYPE_COLORS, PRIORITY_COLORS, PRIORITY_LABELS } from './IssueDetailConstants';

type TabId = 'comments' | 'checklists' | 'time' | 'links' | 'attachments' | 'git' | 'activity';

const TABS: { id: TabId; label: string }[] = [
  { id: 'comments', label: 'Комментарии' },
  { id: 'checklists', label: 'Чеклисты' },
  { id: 'time', label: 'Время' },
  { id: 'links', label: 'Связи' },
  { id: 'attachments', label: 'Вложения' },
  { id: 'git', label: 'Git' },
  { id: 'activity', label: 'История' },
];

export function IssueDrawer() {
  const { isOpen, projectId, issueNumber, close } = useDrawerStore();
  const [, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>('comments');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [descEditing, setDescEditing] = useState(false);
  const [descValue, setDescValue] = useState('');

  const qc = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const { data: issue, isLoading } = useIssue(
    projectId ?? '',
    issueNumber ?? 0,
  );

  useIssueRealtime(projectId ?? undefined, issue?.id, issueNumber ?? undefined);

  const updateIssue = useUpdateIssue(projectId ?? '', issueNumber ?? 0);

  // URL sync — add ?issue=N when drawer opens
  useEffect(() => {
    if (isOpen && issueNumber) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('issue', String(issueNumber));
        return next;
      }, { replace: true });
    } else {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('issue');
        return next;
      }, { replace: true });
    }
  }, [isOpen, issueNumber, setSearchParams]);

  // Sync local state when issue loads
  useEffect(() => {
    if (issue) {
      setTitleValue(issue.title);
      setDescValue(issue.description ?? '');
    }
  }, [issue]);

  const handleUpdate = (data: Record<string, unknown>) => {
    if (!projectId || !issueNumber) return;

    // Handle column change via move
    if ('columnId' in data) {
      const columnId = data.columnId as string;
      issuesApi.moveToColumn(issue!.id, columnId).then(() => {
        qc.invalidateQueries({ queryKey: ['issues', projectId] });
        qc.invalidateQueries({ queryKey: ['issues', projectId, issueNumber] });
      });
      return;
    }

    updateIssue.mutate(data as any, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['issues', projectId] });
      },
    });
  };

  const handleTitleSave = () => {
    if (titleValue.trim() && titleValue !== issue?.title) {
      handleUpdate({ title: titleValue.trim() });
    }
    setEditingTitle(false);
  };

  const handleDescSave = (html: string) => {
    if (html !== issue?.description) {
      handleUpdate({ description: html });
    }
    setDescEditing(false);
  };

  return (
    <Drawer isOpen={isOpen} onClose={close}>
      {isLoading ? (
        <DrawerSkeleton />
      ) : issue ? (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-dash-border shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${TYPE_COLORS[issue.type]}`}>
                {TYPE_ICONS[issue.type]} {TYPE_LABELS[issue.type]}
              </span>
              <span className="text-xs font-mono text-dash-muted shrink-0">#{issue.number}</span>
              <span className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${PRIORITY_COLORS[issue.priority]}`}>
                {PRIORITY_LABELS[issue.priority]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {issue?.id && (
                <PresenceDots issueId={issue.id} currentUserId={currentUserId} />
              )}
              {updateIssue.isPending && (
                <span className="text-xs text-dash-muted animate-pulse">Сохранение...</span>
              )}
              <button
                onClick={close}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-dash-muted hover:text-dash-text hover:bg-dash-border transition-colors text-lg"
                title="Закрыть (ESC)"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex gap-5 p-5">
              {/* Main content */}
              <div className="flex-1 min-w-0 space-y-5">
                {/* Title */}
                {editingTitle ? (
                  <textarea
                    autoFocus
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={(e) => { if (e.key === 'Escape') { setEditingTitle(false); setTitleValue(issue.title); } if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTitleSave(); } }}
                    className="w-full text-xl font-bold text-dash-text bg-transparent border-b border-dash-accent/50 focus:outline-none resize-none leading-snug pb-1"
                    rows={2}
                  />
                ) : (
                  <h2
                    onClick={() => setEditingTitle(true)}
                    className="text-xl font-bold text-dash-text cursor-text hover:text-white leading-snug"
                    title="Нажмите для редактирования"
                  >
                    {issue.title}
                  </h2>
                )}

                {/* Description */}
                <div>
                  <p className="text-xs font-medium text-dash-muted mb-2">Описание</p>
                  {descEditing ? (
                    <div>
                      <RichTextEditor
                        content={descValue}
                        onChange={setDescValue}
                        onBlur={handleDescSave}
                        placeholder="Добавьте описание задачи..."
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleDescSave(descValue)}
                          className="px-3 py-1 text-xs bg-dash-accent text-white rounded-lg hover:bg-dash-accent/80"
                        >
                          Сохранить
                        </button>
                        <button
                          onClick={() => { setDescEditing(false); setDescValue(issue.description ?? ''); }}
                          className="px-3 py-1 text-xs text-dash-muted hover:text-dash-text"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setDescEditing(true)}
                      className={`cursor-text rounded-lg p-3 hover:bg-dash-bg/50 transition-colors ${
                        issue.description ? '' : 'border border-dashed border-dash-border'
                      }`}
                    >
                      {issue.description ? (
                        <RichTextEditor
                          content={issue.description}
                          editable={false}
                        />
                      ) : (
                        <p className="text-sm text-dash-muted/60 italic">Нажмите для добавления описания...</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div>
                  <div className="flex gap-0 border-b border-dash-border overflow-x-auto">
                    {TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                          activeTab === tab.id
                            ? 'border-dash-accent text-dash-accent'
                            : 'border-transparent text-dash-muted hover:text-dash-text'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="pt-4">
                    {activeTab === 'comments' && (
                      <CommentsPanel
                        projectId={projectId!}
                        issueNumber={issueNumber!}
                        issueId={issue.id}
                      />
                    )}
                    {activeTab === 'checklists' && (
                      <ChecklistPanel issueId={issue.id} />
                    )}
                    {activeTab === 'time' && (
                      <TimeTrackingPanel issueId={issue.id} />
                    )}
                    {activeTab === 'links' && (
                      <LinkedIssuesPanel issueId={issue.id} projectId={projectId!} />
                    )}
                    {activeTab === 'attachments' && (
                      <AttachmentsPanel projectId={projectId!} issueNumber={issueNumber!} />
                    )}
                    {activeTab === 'git' && (
                      <GitLinksPanel projectId={projectId!} issueNumber={issueNumber!} />
                    )}
                    {activeTab === 'activity' && (
                      <ActivityPanel issueId={issue.id} />
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <IssueSidebar
                issue={issue as any}
                projectId={projectId!}
                onUpdate={handleUpdate}
              />
            </div>
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}

function DrawerSkeleton() {
  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-5 w-8 rounded" />
        <Skeleton className="h-5 w-20 rounded" />
      </div>
      <Skeleton className="h-8 w-3/4" />
      <SkeletonText lines={4} />
      <div className="flex gap-4 pt-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-4 w-20" />)}
      </div>
      <SkeletonText lines={6} />
    </div>
  );
}
