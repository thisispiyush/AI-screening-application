/**
 * frontend/components/StatusCard.tsx
 * ------------------------------------
 * Reusable glassmorphism card for each section of the result dashboard.
 *
 * Props:
 *   title     — Section heading text
 *   icon      — Emoji or SVG string shown next to the title
 *   children  — Card body content
 *   className — Optional extra Tailwind classes
 */

interface StatusCardProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
}

export default function StatusCard({
  title,
  icon,
  children,
  className = "",
}: StatusCardProps) {
  return (
    <div
      className={`
        relative rounded-2xl border border-white/10
        bg-white/5 backdrop-blur-sm
        shadow-[0_4px_32px_rgba(0,0,0,0.4)]
        p-6 transition-all duration-300
        hover:border-white/20 hover:bg-white/8
        ${className}
      `}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        {icon && (
          <span className="text-xl leading-none" aria-hidden>
            {icon}
          </span>
        )}
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          {title}
        </h2>
      </div>

      {/* Body */}
      <div>{children}</div>
    </div>
  );
}
