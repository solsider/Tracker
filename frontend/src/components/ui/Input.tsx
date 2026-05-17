import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-dash-muted mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          {...props}
          className={`block w-full rounded-lg bg-dash-bg border px-3 py-2.5 text-sm text-dash-text placeholder-dash-muted/60 focus:outline-none focus:ring-2 transition-colors ${
            error
              ? 'border-red-500/60 focus:ring-red-500/30 focus:border-red-500'
              : 'border-dash-border focus:ring-dash-accent/30 focus:border-dash-accent'
          } disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
        />
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-dash-muted">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
