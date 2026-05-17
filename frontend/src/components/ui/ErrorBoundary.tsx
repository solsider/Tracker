import { Component, type ErrorInfo, type ReactNode } from 'react';

function reportCrash(error: Error) {
  try {
    navigator.sendBeacon(
      '/api/telemetry/crash',
      JSON.stringify({
        message: error.message.slice(0, 500),
        stack: error.stack?.slice(0, 5000),
        url: window.location.href.slice(0, 200),
        version: import.meta.env.VITE_APP_VERSION ?? 'unknown',
      }),
    );
  } catch {
    // never throw from error boundary
  }
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Renders inline (panel-sized) instead of full-page */
  inline?: boolean;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    reportCrash(error);
  }

  retry = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return <ErrorFallback error={this.state.error} onRetry={this.retry} inline={this.props.inline} />;
  }
}

function ErrorFallback({
  error,
  onRetry,
  inline,
}: {
  error: Error;
  onRetry: () => void;
  inline?: boolean;
}) {
  const isDev = import.meta.env.DEV;

  if (inline) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8 px-4 text-center">
        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-dash-text">Что-то пошло не так</p>
          {isDev && (
            <p className="text-xs text-red-400 mt-1 font-mono max-w-xs truncate">{error.message}</p>
          )}
        </div>
        <button
          onClick={onRetry}
          className="text-xs text-dash-accent hover:text-dash-accent/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-accent rounded"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-sm w-full text-center space-y-5">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <h2 className="text-base font-semibold text-dash-text">Произошла ошибка</h2>
          <p className="text-sm text-dash-muted leading-relaxed">
            Компонент завершил работу с ошибкой. Попробуйте обновить страницу.
          </p>
          {isDev && (
            <p className="text-xs text-red-400 font-mono bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2 mt-3 text-left break-all">
              {error.message}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onRetry}
            className="px-4 py-2 text-sm font-medium bg-dash-accent text-white rounded-lg hover:bg-dash-accent/90 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dash-bg"
          >
            Попробовать снова
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-dash-muted hover:text-dash-text border border-dash-border rounded-lg hover:border-dash-accent/30 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dash-bg"
          >
            Обновить страницу
          </button>
        </div>
      </div>
    </div>
  );
}
