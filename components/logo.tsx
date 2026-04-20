type LogoProps = {
  className?: string;
  title?: string;
};

export function LogoMark({ className = "h-5 w-5", title }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={!title}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <rect
        x="8.5"
        y="3"
        width="11"
        height="14"
        rx="2.25"
        className="fill-card"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1.3"
      />
      <rect
        x="4.5"
        y="7"
        width="11"
        height="14"
        rx="2.25"
        className="fill-[var(--brand)]"
      />
      <circle cx="10" cy="18" r="1" className="fill-background" />
    </svg>
  );
}

export function Logo({
  wordmarkClassName = "text-[15px] font-semibold tracking-tight",
  markClassName = "h-5 w-5",
}: {
  wordmarkClassName?: string;
  markClassName?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark className={markClassName} />
      <span className={wordmarkClassName}>Mnemo</span>
    </span>
  );
}
