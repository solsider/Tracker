import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-dash-muted mb-1.5"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          {...props}
          className={`block w-full rounded-lg bg-dash-bg border px-3 py-2.5 text-sm text-dash-text focus:outline-none focus:ring-2 transition-colors cursor-pointer ${
            error
              ? 'border-red-500/60 focus:ring-red-500/30 focus:border-red-500'
              : 'border-dash-border focus:ring-dash-accent/30 focus:border-dash-accent'
          } disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
        >
          {placeholder && (
            <option value="" className="bg-dash-panel text-dash-muted">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-dash-panel">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-dash-muted">{hint}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';
