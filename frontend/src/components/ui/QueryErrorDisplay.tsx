interface QueryErrorDisplayProps {
  error: unknown;
  onRetry?: () => void;
  /** Renders as compact panel-sized variant instead of full-page */
  inline?: boolean;
}

function parseStatus(error: unknown): number {
  return (error as any)?.response?.status ?? (error as any)?.status ?? 0;
}

function getErrorInfo(status: number): { title: string; description: string; icon: React.ReactNode } {
  if (!navigator.onLine) {
    return {
      title: 'Нет соединения',
      description: 'Проверьте интернет-соединение и попробуйте снова.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3l18 18M8.111 8.111A5.47 5.47 0 006 12c0 3.314 2.686 6 6 6 1.416 0 2.718-.516 3.721-1.367M10.586 10.586A2 2 0 0114 12a2 2 0 01-2 2 2 2 0 01-1.414-.586M12 2C6.477 2 2 6.477 2 12c0 2.43.865 4.66 2.292 6.393" />
        </svg>
      ),
    };
  }
  if (status === 403) {
    return {
      title: 'Нет доступа',
      description: 'У вас нет прав для просмотра этого ресурса.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    };
  }
  if (status === 404) {
    return {
      title: 'Не найдено',
      description: 'Запрошенный ресурс не существует или был удалён.',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803zM13.5 10.5h-6" />
        </svg>
      ),
    };
  }
  return {
    title: 'Ошибка сервера',
    description: 'Что-то пошло не так на сервере. Мы уже работаем над этим.',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
  };
}

export function QueryErrorDisplay({ error, onRetry, inline }: QueryErrorDisplayProps) {
  const status = parseStatus(error);
  const { title, description, icon } = getErrorInfo(status);

  if (inline) {
    return (
      <div className="flex flex-col items-center justify-center gap-2.5 py-6 px-4 text-center">
        <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-dash-text">{title}</p>
          <p className="text-xs text-dash-muted mt-0.5 max-w-[220px]">{description}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 text-xs text-dash-accent hover:text-dash-accent/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-accent rounded"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Повторить
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-dash-panel border border-dash-border flex items-center justify-center mx-auto text-dash-muted">
          <span className="scale-[1.4]">{icon}</span>
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-semibold text-dash-text">{title}</h2>
          <p className="text-sm text-dash-muted leading-relaxed">{description}</p>
          {status > 0 && (
            <p className="text-xs text-dash-muted/50 font-mono">Код ошибки: {status}</p>
          )}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-dash-accent text-white rounded-lg hover:bg-dash-accent/90 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dash-bg"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Повторить запрос
          </button>
        )}
      </div>
    </div>
  );
}
