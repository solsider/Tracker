interface IconProps {
  className?: string;
}

export function GripIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <circle cx="5" cy="4" r="1.5"/>
      <circle cx="11" cy="4" r="1.5"/>
      <circle cx="5" cy="8" r="1.5"/>
      <circle cx="11" cy="8" r="1.5"/>
      <circle cx="5" cy="12" r="1.5"/>
      <circle cx="11" cy="12" r="1.5"/>
    </svg>
  );
}

export function XIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 4l8 8M12 4l-8 8"/>
    </svg>
  );
}

export function CheckIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8l4 4 6-7"/>
    </svg>
  );
}

export function BugIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 2a3 3 0 00-3 3v1H3.5a.5.5 0 000 1H5v1H3.5a.5.5 0 000 1H5v.5a3 3 0 006 0V9h1.5a.5.5 0 000-1H11V7h1.5a.5.5 0 000-1H11V5a3 3 0 00-3-3zm0 1a2 2 0 012 2v5.5a2 2 0 01-4 0V5a2 2 0 012-2z"/>
    </svg>
  );
}

export function DiamondIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1L15 8L8 15L1 8Z"/>
    </svg>
  );
}

export function StarIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1l1.9 4.1L14 5.5l-3 3 .7 4.2L8 10.4 4.3 12.7l.7-4.2-3-3 4.1-.4z"/>
    </svg>
  );
}

export function PlusIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M8 3v10M3 8h10"/>
    </svg>
  );
}

export function LogoutIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3"/>
      <path d="M10 11l3-3-3-3"/>
      <path d="M13 8H6"/>
    </svg>
  );
}

export function BoardIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="1" width="4" height="14" rx="1"/>
      <rect x="6" y="1" width="4" height="9" rx="1"/>
      <rect x="11" y="1" width="4" height="12" rx="1"/>
    </svg>
  );
}

export function ListIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 4h10M3 8h10M3 12h6"/>
    </svg>
  );
}
