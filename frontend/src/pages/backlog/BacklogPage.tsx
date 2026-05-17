import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useQueryClient } from '@tanstack/react-query';
import {
  useSprints,
  useCreateSprint,
  useUpdateSprint,
  useStartSprint,
  useCompleteSprint,
  useDeleteSprint,
} from '../../hooks/useSprints';
import { useIssues } from '../../hooks/useIssues';
import { issuesApi } from '../../api/issues.api';
import { Button } from '../../components/ui/Button';
import { SprintGroup } from '../../components/backlog/SprintGroup';
import { BacklogSection } from '../../components/backlog/BacklogSection';
import { SprintFormModal } from '../../components/backlog/SprintFormModal';
import { useProjectRealtime } from '../../hooks/useRealtime';
import type { Issue } from '../../types';

export function BacklogPage() {
  const { id: projectId } = useParams<{ id: string }>();
  useProjectRealtime(projectId);
  const qc = useQueryClient();

  const { data: sprints = [] } = useSprints(projectId!);
  const { data: allIssues = [], isLoading } = useIssues(projectId!);

  const createSprint = useCreateSprint(projectId!);
  const updateSprint = useUpdateSprint(projectId!);
  const startSprint = useStartSprint(projectId!);
  const completeSprint = useCompleteSprint(projectId!);
  const deleteSprint = useDeleteSprint(projectId!);

  const [showCreateSprint, setShowCreateSprint] = useState(false);
  const [draggingIssue, setDraggingIssue] = useState<Issue | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const activeSprints = sprints.filter((s) => s.status !== 'COMPLETED');

  const issuesBySprint = (sprintId: string) =>
    allIssues.filter((i) => i.sprintId === sprintId);

  const backlogIssues = allIssues.filter((i) => !i.sprintId);

  const handleUpdateSP = useCallback(
    async (issueNumber: number, sp: number | null) => {
      await issuesApi.update(projectId!, issueNumber, { storyPoints: sp });
      qc.invalidateQueries({ queryKey: ['issues', projectId] });
    },
    [projectId, qc],
  );

  const handleDragStart = (e: DragStartEvent) => {
    const issue = allIssues.find((i) => i.id === e.active.id);
    setDraggingIssue(issue ?? null);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setDraggingIssue(null);
    const { active, over } = e;
    if (!over || !projectId) return;

    const issue = allIssues.find((i) => i.id === active.id);
    if (!issue) return;

    const currentSprintId = issue.sprintId ?? null;
    const targetSprintId = over.id === 'backlog' ? null : String(over.id);

    if (currentSprintId === targetSprintId) return;

    await issuesApi.update(projectId, issue.number, { sprintId: targetSprintId });
    qc.invalidateQueries({ queryKey: ['issues', projectId] });
  };

  if (isLoading) {
    return <div className="text-dash-muted text-sm">Загрузка бэклога...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dash-text">Бэклог</h1>
        <Button onClick={() => setShowCreateSprint(true)}>+ Создать спринт</Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-3">
          {activeSprints.map((sprint) => (
            <SprintGroup
              key={sprint.id}
              sprint={sprint}
              issues={issuesBySprint(sprint.id)}
              projectId={projectId!}
              onUpdateSP={handleUpdateSP}
              onStartSprint={(id) => startSprint.mutate(id)}
              onCompleteSprint={(id) => completeSprint.mutate(id)}
              onDeleteSprint={(id) => deleteSprint.mutate(id)}
              onUpdateSprint={(id, data) => updateSprint.mutate({ id, ...data })}
            />
          ))}

          <BacklogSection
            issues={backlogIssues}
            projectId={projectId!}
            onUpdateSP={handleUpdateSP}
          />
        </div>

        <DragOverlay dropAnimation={{ duration: 120, easing: 'ease' }}>
          {draggingIssue ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-dash-panel border border-dash-accent/50 rounded-lg shadow-xl">
              <span className="text-xs font-mono text-dash-muted">#{draggingIssue.number}</span>
              <span className="text-sm text-dash-text">{draggingIssue.title}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {showCreateSprint && (
        <SprintFormModal
          onSave={(data) => {
            createSprint.mutate(data);
            setShowCreateSprint(false);
          }}
          onClose={() => setShowCreateSprint(false)}
        />
      )}
    </div>
  );
}
