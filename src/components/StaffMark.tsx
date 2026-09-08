// Marque d'en-tête : une note noircie sur cinq portées — signature partition.

export function StaffMark() {
  return (
    <span className="app-header__mark" aria-hidden="true">
      <svg viewBox="0 0 34 34" width="34" height="34" focusable="false">
        <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
          <line x1="3" y1="8" x2="31" y2="8" />
          <line x1="3" y1="13" x2="31" y2="13" />
          <line x1="3" y1="18" x2="31" y2="18" />
          <line x1="3" y1="23" x2="31" y2="23" />
          <line x1="3" y1="28" x2="31" y2="28" />
        </g>
        <ellipse cx="20" cy="23" rx="4.4" ry="3.2" fill="currentColor" transform="rotate(-16 20 23)" />
        <line
          x1="24.1"
          y1="21.5"
          x2="24.1"
          y2="8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
