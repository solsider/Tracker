import { useState, useRef, useCallback } from 'react';
import { useAttachments, useDeleteAttachment } from '../../../hooks/useAttachments';
import { attachmentsApi } from '../../../api/attachments.api';
import { useQueryClient } from '@tanstack/react-query';
import type { Attachment } from '../../../types';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']);
const MAX_SIZE = 20 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// SVG-based file type icons — no emoji, consistent across OS/browsers
function FileIcon({ mimetype, className = 'w-8 h-8' }: { mimetype: string; className?: string }) {
  if (IMAGE_TYPES.has(mimetype)) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#3B82F6" fillOpacity="0.15" />
        <path d="M6 22l7-9 5 6 3-4 5 7H6z" fill="#3B82F6" />
        <circle cx="22" cy="12" r="3" fill="#3B82F6" />
      </svg>
    );
  }
  if (mimetype === 'application/pdf') {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#EF4444" fillOpacity="0.15" />
        <text x="5" y="22" fontSize="11" fontWeight="700" fill="#EF4444" fontFamily="monospace">PDF</text>
      </svg>
    );
  }
  if (mimetype.includes('zip') || mimetype.includes('compressed')) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#F59E0B" fillOpacity="0.15" />
        <text x="5" y="22" fontSize="11" fontWeight="700" fill="#F59E0B" fontFamily="monospace">ZIP</text>
      </svg>
    );
  }
  if (mimetype.includes('spreadsheet') || mimetype.includes('csv') || mimetype.includes('excel')) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#10B981" fillOpacity="0.15" />
        <text x="5" y="22" fontSize="11" fontWeight="700" fill="#10B981" fontFamily="monospace">XLS</text>
      </svg>
    );
  }
  if (mimetype.includes('document') || mimetype.includes('word')) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#6366F1" fillOpacity="0.15" />
        <text x="4" y="22" fontSize="11" fontWeight="700" fill="#6366F1" fontFamily="monospace">DOC</text>
      </svg>
    );
  }
  if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#F97316" fillOpacity="0.15" />
        <text x="5" y="22" fontSize="11" fontWeight="700" fill="#F97316" fontFamily="monospace">PPT</text>
      </svg>
    );
  }
  if (mimetype === 'application/json' || mimetype.startsWith('text/')) {
    return (
      <svg className={className} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="6" fill="#64748B" fillOpacity="0.15" />
        <text x="5" y="22" fontSize="11" fontWeight="700" fill="#64748B" fontFamily="monospace">TXT</text>
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="6" fill="#6B7280" fillOpacity="0.15" />
      <path d="M10 8h8l6 6v10a2 2 0 01-2 2H10a2 2 0 01-2-2V10a2 2 0 012-2z" stroke="#6B7280" strokeWidth="1.5" fill="none" />
      <path d="M18 8v6h6" stroke="#6B7280" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function ImagePreviewModal({ attachment, onClose }: { attachment: Attachment; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] p-2" onClick={(e) => e.stopPropagation()}>
        <div className="absolute -top-10 right-0 flex items-center gap-3">
          <button
            onClick={() => attachmentsApi.triggerDownload(attachment.id, attachment.originalName)}
            className="text-white/60 hover:text-white text-sm transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Скачать
          </button>
          <button onClick={onClose} className="text-white/60 hover:text-white text-xl transition-colors">
            ✕
          </button>
        </div>
        <img
          src={attachment.url}
          alt={attachment.originalName}
          className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
        />
        <p className="text-center text-xs text-white/50 mt-2">{attachment.originalName} · {formatBytes(attachment.size)}</p>
      </div>
    </div>
  );
}

interface UploadItem {
  file: File;
  progress: number;
  error: string | null;
  done: boolean;
  id: string;
}

interface AttachmentsPanelProps {
  projectId: string;
  issueNumber: number;
}

export function AttachmentsPanel({ projectId, issueNumber }: AttachmentsPanelProps) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [preview, setPreview] = useState<Attachment | null>(null);

  const { data: attachments = [], isLoading } = useAttachments(projectId, issueNumber);
  const deleteAtt = useDeleteAttachment(projectId, issueNumber);

  const updateUpload = (id: string, patch: Partial<UploadItem>) =>
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));

  const uploadFile = useCallback(async (file: File) => {
    if (file.size > MAX_SIZE) {
      const uid = crypto.randomUUID();
      setUploads((p) => [...p, { id: uid, file, progress: 0, error: 'Файл превышает 20 МБ', done: false }]);
      return;
    }
    const uid = crypto.randomUUID();
    setUploads((p) => [...p, { id: uid, file, progress: 0, error: null, done: false }]);
    try {
      await attachmentsApi.upload(projectId, issueNumber, file, (pct) =>
        updateUpload(uid, { progress: pct }),
      );
      updateUpload(uid, { progress: 100, done: true });
      qc.invalidateQueries({ queryKey: ['attachments', projectId, issueNumber] });
      setTimeout(() => setUploads((p) => p.filter((u) => u.id !== uid)), 2000);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Ошибка загрузки';
      updateUpload(uid, { error: msg, done: false });
    }
  }, [projectId, issueNumber, qc]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(uploadFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const retryUpload = (item: UploadItem) => {
    setUploads((p) => p.filter((u) => u.id !== item.id));
    uploadFile(item.file);
  };

  const dismissError = (id: string) => setUploads((p) => p.filter((u) => u.id !== id));

  const activeUploads = uploads.filter((u) => !u.done);

  return (
    <>
      {preview && <ImagePreviewModal attachment={preview} onClose={() => setPreview(null)} />}

      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-dash-text">Вложения</h3>
            {attachments.length > 0 && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-dash-border text-dash-muted">
                {attachments.length}
              </span>
            )}
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            className="text-xs text-dash-accent hover:text-dash-accent/80 transition-colors"
          >
            + Загрузить
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-150 ${
            dragging
              ? 'border-dash-accent bg-dash-accent/8 scale-[1.01]'
              : 'border-dash-border hover:border-dash-accent/40 hover:bg-dash-accent/3'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <svg className="w-5 h-5 mx-auto mb-1.5 text-dash-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-xs text-dash-muted">
            {dragging ? 'Отпустите для загрузки' : 'Перетащите файлы или нажмите'}
          </p>
          <p className="text-[10px] text-dash-muted/50 mt-0.5">PNG, JPG, PDF, ZIP, DOCX — до 20 МБ</p>
        </div>

        {/* Active uploads */}
        {activeUploads.length > 0 && (
          <div className="space-y-1.5">
            {activeUploads.map((u) => (
              <UploadRow key={u.id} item={u} onRetry={retryUpload} onDismiss={dismissError} />
            ))}
          </div>
        )}

        {/* Attachment list */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-dash-panel rounded-lg animate-pulse" />
            ))}
          </div>
        ) : attachments.length === 0 ? (
          <p className="text-xs text-dash-muted text-center py-6">Нет вложений</p>
        ) : (
          <div className="space-y-1.5">
            {attachments.map((att) => (
              <AttachmentRow
                key={att.id}
                att={att}
                onPreview={() => IMAGE_TYPES.has(att.mimetype) ? setPreview(att) : undefined}
                onDelete={() => deleteAtt.mutate(att.id)}
                isDeleting={deleteAtt.isPending && (deleteAtt.variables as string) === att.id}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function UploadRow({ item, onRetry, onDismiss }: {
  item: UploadItem;
  onRetry: (item: UploadItem) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <div className={`bg-dash-panel border rounded-lg p-2.5 text-xs transition-colors ${
      item.error ? 'border-red-500/30' : 'border-dash-border'
    }`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-dash-text truncate max-w-[200px]">{item.file.name}</span>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {item.error ? (
            <>
              <button onClick={() => onRetry(item)} className="text-dash-accent hover:text-dash-accent/80 text-xs">
                Повторить
              </button>
              <button onClick={() => onDismiss(item.id)} className="text-dash-muted hover:text-red-400 text-xs">
                ✕
              </button>
            </>
          ) : item.done ? (
            <span className="text-green-400 font-medium">✓</span>
          ) : (
            <span className="text-dash-muted">{item.progress}%</span>
          )}
        </div>
      </div>
      {item.error ? (
        <p className="text-red-400 text-[10px]">{item.error}</p>
      ) : (
        <div className="h-1 bg-dash-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${item.done ? 'bg-green-400' : 'bg-dash-accent'}`}
            style={{ width: `${item.progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

function AttachmentRow({ att, onPreview, onDelete, isDeleting }: {
  att: Attachment;
  onPreview: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}) {
  const isImage = IMAGE_TYPES.has(att.mimetype);

  return (
    <div className={`flex items-center gap-2.5 p-2 rounded-lg bg-dash-panel border border-dash-border hover:border-dash-accent/30 transition-all group ${isDeleting ? 'opacity-50' : ''}`}>
      {/* Thumbnail / Icon */}
      <div
        className={isImage ? 'cursor-pointer shrink-0' : 'shrink-0'}
        onClick={isImage ? onPreview : undefined}
      >
        {isImage ? (
          <img
            src={att.url}
            alt={att.originalName}
            className="w-8 h-8 object-cover rounded-md ring-1 ring-dash-border hover:ring-dash-accent/40 transition-all"
          />
        ) : (
          <FileIcon mimetype={att.mimetype} className="w-8 h-8" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-xs text-dash-text truncate hover:text-dash-accent cursor-pointer transition-colors"
          onClick={isImage ? onPreview : undefined}
          title={att.originalName}
        >
          {att.originalName}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-dash-muted">{formatBytes(att.size)}</span>
          {att.uploader && (
            <>
              <span className="text-dash-muted/40 text-[10px]">·</span>
              <span className="text-[10px] text-dash-muted truncate max-w-[80px]">
                {att.uploader.name}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Actions — appear on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => attachmentsApi.triggerDownload(att.id, att.originalName)}
          className="p-1 text-dash-muted hover:text-dash-accent transition-colors rounded"
          title="Скачать"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="p-1 text-dash-muted hover:text-red-400 transition-colors rounded"
          title="Удалить"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
