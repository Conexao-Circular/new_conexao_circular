type NavIconProps = { className?: string };

/** Ícones compartilhados pela abertura e pela navegação interna. */
export function NavMapIcon({ className }: NavIconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      <path d="M12 21s6-4.4 6-10a6 6 0 1 0-12 0c0 5.6 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2" />
    </svg>
  );
}

export function NavHomeIcon({ className }: NavIconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" />
      <path d="M9 21v-6h6v6" />
    </svg>
  );
}

export function NavStoreIcon({ className }: NavIconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      <path d="M4 8h16l-1 12H5L4 8Z" />
      <path d="M3 8 5 3h14l2 5" />
      <path d="M9 12h6" />
    </svg>
  );
}
