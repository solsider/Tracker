import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { issuesApi } from '../../../api/issues.api';
import { useAuthStore } from '../../../store/auth.store';
import { RichTextEditor } from '../../ui/RichTextEditor';
import { Skeleton } from '../../ui/Skeleton';
import { Avatar } from '../../ui/AvatarStack';
import { formatRelativeTime } from '../IssueDetailConstants';
import type { Comment } from '../../../types';

interface CommentsPanelProps {
  projectId: string;
  issueNumber: number;
  issueId: string;
}

export function CommentsPanel({ projectId, issueNumber, issueId }: CommentsPanelProps) {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [newBody, setNewBody] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', projectId, issueNumber],
    queryFn: () => issuesApi.getComments(projectId, issueNumber),
    enabled: !!projectId && !!issueNumber,
  });

  const addComment = useMutation({
    mutationFn: (body: string) => issuesApi.addComment(projectId, issueNumber, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', projectId, issueNumber] });
      qc.invalidateQueries({ queryKey: ['activity', 'issue', issueId] });
      setNewBody('');
      setIsComposing(false);
    },
  });

  const updateComment = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => issuesApi.updateComment(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', projectId, issueNumber] });
      setEditingId(null);
    },
  });

  const deleteComment = useMutation({
    mutationFn: (id: string) => issuesApi.deleteComment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', projectId, issueNumber] });
      qc.invalidateQueries({ queryKey: ['activity', 'issue', issueId] });
    },
  });

  const handleSubmit = () => {
    const trimmed = newBody.trim();
    if (!trimmed || trimmed === '<p></p>') return;
    addComment.mutate(trimmed);
  };

  const handleEditSubmit = (comment: Comment) => {
    const trimmed = editBody.trim();
    if (!trimmed || trimmed === '<p></p>') return;
    updateComment.mutate({ id: comment.id, body: trimmed });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-dash-text">
        Комментарии {comments?.length ? `(${comments.length})` : ''}
      </h3>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {comments?.map((comment) => (
        <div key={comment.id} className="flex gap-3 group">
          <Avatar user={comment.author} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-dash-text">{comment.author.name}</span>
              <span className="text-xs text-dash-muted">{formatRelativeTime(comment.createdAt)}</span>
              {comment.updatedAt !== comment.createdAt && (
                <span className="text-xs text-dash-muted italic">(изменён)</span>
              )}
            </div>

            {editingId === comment.id ? (
              <div className="space-y-2">
                <RichTextEditor
                  content={editBody}
                  onChange={setEditBody}
                  placeholder="Редактировать комментарий..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditSubmit(comment)}
                    disabled={updateComment.isPending}
                    className="px-3 py-1 text-xs bg-dash-accent text-white rounded-lg hover:bg-dash-accent/80 disabled:opacity-50"
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1 text-xs text-dash-muted hover:text-dash-text rounded-lg"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="text-sm text-dash-text leading-relaxed rich-text"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.body) }}
              />
            )}

            {user?.id === comment.authorId && editingId !== comment.id && (
              <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => { setEditingId(comment.id); setEditBody(comment.body); }}
                  className="text-xs text-dash-muted hover:text-dash-text"
                >
                  Изменить
                </button>
                <button
                  onClick={() => deleteComment.mutate(comment.id)}
                  disabled={deleteComment.isPending}
                  className="text-xs text-red-400/70 hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {deleteComment.isPending ? 'Удаление...' : 'Удалить'}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* New comment */}
      {user && (
        <div className="flex gap-3">
          <Avatar user={user} size="md" />
          <div className="flex-1">
            {isComposing ? (
              <div className="space-y-2">
                <RichTextEditor
                  content={newBody}
                  onChange={setNewBody}
                  placeholder="Напишите комментарий..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmit}
                    disabled={addComment.isPending}
                    className="px-3 py-1.5 text-xs bg-dash-accent text-white rounded-lg hover:bg-dash-accent/80 disabled:opacity-50"
                  >
                    {addComment.isPending ? 'Отправка...' : 'Отправить'}
                  </button>
                  <button
                    onClick={() => { setIsComposing(false); setNewBody(''); }}
                    className="px-3 py-1.5 text-xs text-dash-muted hover:text-dash-text rounded-lg"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsComposing(true)}
                className="w-full text-left px-3 py-2.5 text-sm text-dash-muted bg-dash-bg border border-dash-border rounded-lg hover:border-dash-accent/40 transition-colors"
              >
                Добавить комментарий...
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
