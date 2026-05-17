import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { Sprint, Issue } from '../../types';

interface Props {
  sprint: Sprint;
  issues: Issue[];
  onConfirm: () => void;
  onClose: () => void;
}

export function CompleteSprintModal({ sprint, issues, onConfirm, onClose }: Props) {
  const totalSP = issues.reduce((sum, i) => sum + (i.storyPoints ?? 0), 0);

  return (
    <Modal isOpen onClose={onClose} title="Завершить спринт">
      <div className="space-y-4">
        <div className="bg-dash-bg rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold text-dash-text">{sprint.name}</p>
          {sprint.goal && <p className="text-xs text-dash-muted">{sprint.goal}</p>}
          <div className="flex gap-6 pt-1">
            <div>
              <p className="text-xl font-bold text-dash-text">{issues.length}</p>
              <p className="text-xs text-dash-muted">задач в спринте</p>
            </div>
            {totalSP > 0 && (
              <div>
                <p className="text-xl font-bold text-dash-accent">{totalSP}</p>
                <p className="text-xs text-dash-muted">story points</p>
              </div>
            )}
            {sprint.startDate && sprint.endDate && (
              <div>
                <p className="text-xl font-bold text-dash-text">
                  {Math.ceil((new Date(sprint.endDate).getTime() - new Date(sprint.startDate).getTime()) / (1000 * 60 * 60 * 24))}
                </p>
                <p className="text-xs text-dash-muted">дней</p>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-dash-muted">
          Спринт будет отмечен как завершённый. Задачи останутся в базе данных и будут
          доступны в бэклоге.
        </p>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button onClick={onConfirm}>Завершить спринт</Button>
        </div>
      </div>
    </Modal>
  );
}
