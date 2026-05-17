import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Compact variant — used inside panels */
  compact?: boolean;
}

// Pre-built icons for common empty states
export const EmptyIcons = {
  issues: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  attachments: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  ),
  comments: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  notifications: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  search: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  generic: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  ),
};

export function EmptyState({ icon, title, description, action, compact }: EmptyStateProps) {
  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-dash-panel border border-dash-border flex items-center justify-center text-dash-muted">
            {icon}
          </div>
        )}
        <div>
          <p className="text-xs font-medium text-dash-muted">{title}</p>
          {description && <p className="text-[10px] text-dash-muted/60 mt-0.5">{description}</p>}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="text-xs text-dash-accent hover:text-dash-accent/80 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-accent rounded"
          >
            {action.label}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-dash-panel border border-dash-border flex items-center justify-center text-dash-muted">
          <span className="scale-[1.3]">{icon}</span>
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-dash-text">{title}</p>
        {description && (
          <p className="text-xs text-dash-muted leading-relaxed max-w-[260px]">{description}</p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-dash-accent/10 text-dash-accent border border-dash-accent/20 rounded-lg hover:bg-dash-accent/20 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dash-bg"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
