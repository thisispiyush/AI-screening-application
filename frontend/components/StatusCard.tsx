/**
 * frontend/components/StatusCard.tsx
 * ------------------------------------
 * Neo-Brutalist container card matching the Stitch Veritas Identity spec.
 *
 * Props:
 *   title     — Section heading text
 *   icon      — Optional icon string or Material Symbol name
 *   children  — Card body content
 *   className — Optional extra Tailwind classes
 */

interface StatusCardProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

export default function StatusCard({
  title,
  icon,
  children,
  className = "",
  headerAction,
}: StatusCardProps) {
  return (
    <div className={`border-2 border-on-background bg-surface neo-shadow flex flex-col ${className}`}>
      {/* Header with high contrast black bar */}
      <div className="bg-on-background text-on-primary px-4 py-3 border-b-2 border-on-background font-mono text-xs uppercase tracking-widest flex justify-between items-center">
        <span className="font-bold flex items-center gap-2">
          {icon && <span className="material-symbols-outlined text-sm">{icon}</span>}
          {title}
        </span>
        {headerAction}
      </div>

      {/* Body */}
      <div className="p-5 flex-1">{children}</div>
    </div>
  );
}
