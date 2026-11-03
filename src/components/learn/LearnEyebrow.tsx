/** The mono amber eyebrow used across the site's section heads. */
export function LearnEyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`mb-3 font-mono text-xs uppercase tracking-[0.12em] text-silicon-amber-strong ${className}`}>
      {children}
    </p>
  )
}
