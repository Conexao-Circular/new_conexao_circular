type LogoVariant = "color" | "white" | "mono";

const RING = "#157a3c";
const INK = "#111111";

/**
 * Conexão Circular brand mark — broken green ring with three nodes around a
 * black "C". `variant`:
 *  - "color" (default): green ring + black C/nodes (light backgrounds)
 *  - "white": all white (dark/green backgrounds)
 *  - "mono": inherits `currentColor`
 */
export function LogoMark({
  className,
  variant = "color",
}: {
  className?: string;
  variant?: LogoVariant;
}) {
  const ring = variant === "white" ? "#ffffff" : variant === "mono" ? "currentColor" : RING;
  const ink = variant === "white" ? "#ffffff" : variant === "mono" ? "currentColor" : INK;

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* broken outer ring (three arcs, gaps at the nodes) */}
      <path d="M 47.39 49.09 A 23 23 0 0 1 16.61 49.09" stroke={ring} strokeWidth="5.5" strokeLinecap="round" />
      <path d="M 9.51 36.78 A 23 23 0 0 1 24.89 10.13" stroke={ring} strokeWidth="5.5" strokeLinecap="round" />
      <path d="M 39.11 10.13 A 23 23 0 0 1 54.49 36.78" stroke={ring} strokeWidth="5.5" strokeLinecap="round" />

      {/* inner "C" */}
      <path d="M 42.649 39.456 A 13 13 0 1 1 42.649 24.544" stroke={ink} strokeWidth="9" fill="none" />

      {/* connection nodes */}
      <circle cx="32" cy="9" r="4.5" stroke={ink} strokeWidth="4" />
      <circle cx="9.5" cy="45" r="3.5" stroke={ink} strokeWidth="3" />
      <circle cx="54.5" cy="45" r="3.5" stroke={ink} strokeWidth="3" />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
  variant = "color",
}: {
  className?: string;
  markClassName?: string;
  variant?: LogoVariant;
}) {
  return (
    <span className={className}>
      <LogoMark className={markClassName} variant={variant} />
      <span className="font-heading font-semibold">Conexão Circular</span>
    </span>
  );
}
