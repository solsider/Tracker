import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { Sprint } from '../../types';

interface Props {
  sprint?: Sprint;
  onSave: (data: { name: string; goal?: string; startDate?: string; endDate?: string }) => void;
  onClose: () => void;
}

export function SprintFormModal({ sprint, onSave, onClose }: Props) {
  const [name, setName] = useState(sprint?.name ?? '');
  const [goal, setGoal] = useState(sprint?.goal ?? '');
  const [startDate, setStartDate] = useState(sprint?.startDate?.split('T')[0] ?? '');
  const [endDate, setEndDate] = useState(sprint?.endDate?.split('T')[0] ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      goal: goal.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  return (
    <Modal isOpen onClose={onClose} title={sprint ? 'Редактировать спринт' : 'Создать спринт'}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          label="Название"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Sprint 1"
          autoFocus
        />
        <div>
          <label className="block text-sm font-medium text-dash-muted mb-1.5">Цель спринта</label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Что планируем достичь..."
            rows={2}
            className="w-full px-3 py-2 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text placeholder-dash-muted/50 focus:outline-none focus:border-dash-accent/50 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Дата начала"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="Дата окончания"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Отмена</Button>
          <Button type="submit">{sprint ? 'Сохранить' : 'Создать'}</Button>
        </div>
      </form>
    </Modal>
  );
}
