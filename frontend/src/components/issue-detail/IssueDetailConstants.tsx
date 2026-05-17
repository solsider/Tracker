import type { IssuePriority, IssueType, IssueLinkType, ActivityAction } from '../../types';

export const PRIORITY_COLORS: Record<IssuePriority, string> = {
  CRITICAL: 'text-red-400 bg-red-400/10',
  HIGH: 'text-orange-400 bg-orange-400/10',
  MEDIUM: 'text-yellow-400 bg-yellow-400/10',
  LOW: 'text-green-400 bg-green-400/10',
};

export const PRIORITY_LABELS: Record<IssuePriority, string> = {
  CRITICAL: 'Критический',
  HIGH: 'Высокий',
  MEDIUM: 'Средний',
  LOW: 'Низкий',
};

export const PRIORITY_ICONS: Record<IssuePriority, string> = {
  CRITICAL: '🔴',
  HIGH: '🟠',
  MEDIUM: '🟡',
  LOW: '🟢',
};

export const TYPE_LABELS: Record<IssueType, string> = {
  TASK: 'Задача',
  BUG: 'Баг',
  STORY: 'История',
  EPIC: 'Эпик',
};

export const TYPE_COLORS: Record<IssueType, string> = {
  TASK: 'text-blue-400 bg-blue-400/10',
  BUG: 'text-red-400 bg-red-400/10',
  STORY: 'text-purple-400 bg-purple-400/10',
  EPIC: 'text-amber-400 bg-amber-400/10',
};

export const TYPE_ICONS: Record<IssueType, string> = {
  TASK: '✓',
  BUG: '⚡',
  STORY: '◆',
  EPIC: '★',
};

export const LINK_TYPE_LABELS: Record<IssueLinkType, { label: string; inverseLabel: string }> = {
  BLOCKS: { label: 'Блокирует', inverseLabel: 'Заблокирован' },
  RELATES_TO: { label: 'Связана с', inverseLabel: 'Связана с' },
  DUPLICATES: { label: 'Дублирует', inverseLabel: 'Дублируется' },
  CLONES: { label: 'Клонирует', inverseLabel: 'Клон' },
  SPLIT_FROM: { label: 'Разделена из', inverseLabel: 'Разделена на' },
  CAUSED_BY: { label: 'Вызвана', inverseLabel: 'Вызвала' },
};

export const ACTIVITY_LABELS: Partial<Record<ActivityAction, string>> = {
  CREATED: 'создал задачу',
  UPDATED: 'обновил',
  DELETED: 'удалил задачу',
  COMMENTED: 'прокомментировал',
  MOVED: 'переместил в',
  ASSIGNED: 'назначил исполнителем',
  UNASSIGNED: 'снял исполнителя',
  LABELED: 'добавил метку',
  UNLABELED: 'убрал метку',
  LINKED: 'связал задачу',
  UNLINKED: 'убрал связь',
  STATUS_CHANGED: 'изменил статус',
  PRIORITY_CHANGED: 'изменил приоритет',
  POINTS_CHANGED: 'изменил story points',
  DUE_DATE_CHANGED: 'изменил срок',
  SPRINT_ADDED: 'добавил в спринт',
  SPRINT_REMOVED: 'убрал из спринта',
  CHECKLIST_ADDED: 'добавил чеклист',
  CHECKLIST_COMPLETED: 'завершил чеклист',
  WATCHER_ADDED: 'подписался',
  WATCHER_REMOVED: 'отписался',
};

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}ч ${m}м`;
  if (h > 0) return `${h}ч`;
  return `${m}м`;
}

export function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'только что';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} мин. назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч. назад`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} д. назад`;
  return new Date(isoDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}
