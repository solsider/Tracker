import { useState } from 'react';
import { useCreateColumn } from '../../hooks/useColumns';

interface AddColumnButtonProps {
  projectId: string;
}

export function AddColumnButton({ projectId }: AddColumnButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#6366f1');
  const createColumn = useCreateColumn(projectId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createColumn.mutate(
      { title: title.trim(), color },
      {
        onSuccess: () => {
          setTitle('');
          setColor('#6366f1');
          setIsOpen(false);
        },
      },
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 w-72 shrink-0 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-colors text-sm font-medium"
      >
        + Добавить колонку
      </button>
    );
  }

  return (
    <div className="w-72 shrink-0 bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-gray-200 p-0.5"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название колонки"
            className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!title.trim() || createColumn.isPending}
            className="flex-1 text-sm bg-blue-600 text-white rounded px-3 py-1.5 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Добавить
          </button>
          <button
            type="button"
            onClick={() => { setIsOpen(false); setTitle(''); }}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
