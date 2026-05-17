import { useState } from 'react';
import {
  useChecklists, useCreateChecklist, useDeleteChecklist,
  useCreateChecklistItem, useUpdateChecklistItem, useDeleteChecklistItem,
} from '../../../hooks/useChecklists';
import { Skeleton } from '../../ui/Skeleton';
import type { Checklist, ChecklistItem } from '../../../types';

interface ChecklistPanelProps {
  issueId: string;
}

export function ChecklistPanel({ issueId }: ChecklistPanelProps) {
  const { data: checklists, isLoading } = useChecklists(issueId);
  const createChecklist = useCreateChecklist(issueId);
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const totalItems = checklists?.reduce((sum, c) => sum + c.items.length, 0) ?? 0;
  const completedItems = checklists?.reduce(
    (sum, c) => sum + c.items.filter((i) => i.isCompleted).length,
    0,
  ) ?? 0;
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createChecklist.mutate({ title: newTitle.trim() }, {
      onSuccess: () => { setNewTitle(''); setIsAdding(false); },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-dash-text">Чеклисты</h3>
        <button
          onClick={() => setIsAdding(true)}
          className="text-xs text-dash-accent hover:text-dash-accent/80"
        >
          + Добавить
        </button>
      </div>

      {totalItems > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-dash-muted">
            <span>{completedItems} / {totalItems}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-dash-border rounded-full overflow-hidden">
            <div
              className="h-full bg-dash-accent rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      )}

      {checklists?.map((checklist) => (
        <ChecklistBlock key={checklist.id} checklist={checklist} issueId={issueId} />
      ))}

      {isAdding && (
        <div className="flex gap-2">
          <input
            autoFocus
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setIsAdding(false); }}
            placeholder="Название чеклиста..."
            className="flex-1 px-3 py-1.5 text-sm bg-dash-bg border border-dash-border rounded-lg text-dash-text focus:outline-none focus:border-dash-accent/50"
          />
          <button
            onClick={handleCreate}
            disabled={createChecklist.isPending}
            className="px-3 py-1.5 text-xs bg-dash-accent text-white rounded-lg hover:bg-dash-accent/80 disabled:opacity-50"
          >
            OK
          </button>
          <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-xs text-dash-muted hover:text-dash-text">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

function ChecklistBlock({ checklist, issueId }: { checklist: Checklist; issueId: string }) {
  const deleteChecklist = useDeleteChecklist(issueId);
  const createItem = useCreateChecklistItem(issueId);
  const [newItem, setNewItem] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  const completedCount = checklist.items.filter((i) => i.isCompleted).length;

  const handleAddItem = () => {
    if (!newItem.trim()) return;
    createItem.mutate(
      { checklistId: checklist.id, title: newItem.trim(), order: checklist.items.length },
      { onSuccess: () => { setNewItem(''); setIsAddingItem(false); } },
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between group">
        <span className="text-sm font-medium text-dash-text">{checklist.title}</span>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-dash-muted">{completedCount}/{checklist.items.length}</span>
          <button
            onClick={() => deleteChecklist.mutate(checklist.id)}
            className="text-xs text-red-400/60 hover:text-red-400"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="space-y-1.5 pl-1">
        {checklist.items.map((item) => (
          <ChecklistItemRow key={item.id} item={item} issueId={issueId} />
        ))}

        {isAddingItem ? (
          <div className="flex gap-2 pt-1">
            <input
              autoFocus
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddItem(); if (e.key === 'Escape') setIsAddingItem(false); }}
              placeholder="Новый пункт..."
              className="flex-1 px-2 py-1 text-xs bg-dash-bg border border-dash-border rounded text-dash-text focus:outline-none focus:border-dash-accent/50"
            />
            <button onClick={handleAddItem} className="text-xs text-dash-accent hover:text-dash-accent/80">OK</button>
            <button onClick={() => setIsAddingItem(false)} className="text-xs text-dash-muted">✕</button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingItem(true)}
            className="text-xs text-dash-muted hover:text-dash-accent flex items-center gap-1 pt-1"
          >
            + Добавить пункт
          </button>
        )}
      </div>
    </div>
  );
}

function ChecklistItemRow({ item, issueId }: { item: ChecklistItem; issueId: string }) {
  const updateItem = useUpdateChecklistItem(issueId);
  const deleteItem = useDeleteChecklistItem(issueId);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);

  return (
    <div className="flex items-center gap-2 group">
      <input
        type="checkbox"
        checked={item.isCompleted}
        onChange={(e) => updateItem.mutate({ id: item.id, isCompleted: e.target.checked })}
        className="w-4 h-4 rounded border-dash-border bg-dash-bg accent-dash-accent shrink-0 cursor-pointer"
      />

      {isEditing ? (
        <input
          autoFocus
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={() => {
            if (editTitle.trim() && editTitle !== item.title) {
              updateItem.mutate({ id: item.id, title: editTitle.trim() });
            }
            setIsEditing(false);
          }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setIsEditing(false); }}
          className="flex-1 text-xs bg-dash-bg border border-dash-accent/50 rounded px-2 py-0.5 text-dash-text focus:outline-none"
        />
      ) : (
        <span
          onDoubleClick={() => setIsEditing(true)}
          className={`flex-1 text-xs cursor-pointer ${item.isCompleted ? 'line-through text-dash-muted' : 'text-dash-text'}`}
        >
          {item.title}
        </span>
      )}

      <button
        onClick={() => deleteItem.mutate(item.id)}
        className="text-xs text-red-400/0 group-hover:text-red-400/60 hover:!text-red-400 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
