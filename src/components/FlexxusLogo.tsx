"use client";

export function FlexxusSupportLogoLight({ className = "", width = 420 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 670 220"
      width={width}
      className={className}
      role="img"
      aria-label="Flexxus Portal de Soporte"
    >
      <defs>
        <linearGradient id="fx-red-light" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff3b3b" />
          <stop offset="100%" stopColor="#e1262d" />
        </linearGradient>
      </defs>

      <g transform="translate(28 46)">
        <g stroke="#5d6168" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M40 14 L92 14 L118 58 L92 102 L40 102 L14 58 Z" />
          <path d="M40 14 L40 102" />
          <path d="M92 14 L92 102" />
          <path d="M14 58 L118 58" />
          <path d="M40 14 L66 58 L40 102" />
          <path d="M92 14 L66 58 L92 102" />
        </g>
        {([
          [40, 14], [92, 14], [118, 58], [92, 102], [40, 102], [14, 58],
        ] as [number, number][]).map(([cx, cy], i) => (
          <circle
            key={i} cx={cx} cy={cy} r="10"
            fill={i === 0 || i === 2 || i === 5 ? "#ef2b2d" : "#f4f4f5"}
            stroke="#5d6168" strokeWidth="4"
          />
        ))}
        <circle cx="66" cy="58" r="16" fill="url(#fx-red-light)" stroke="#ffffff" strokeWidth="5" />
      </g>

      <g transform="translate(180 34)">
        <text x="0" y="80" fontFamily="Arial, Helvetica, sans-serif" fontSize="118" fontWeight="700" letterSpacing="-4">
          <tspan fill="#3f3f46">Fle</tspan>
          <tspan fill="url(#fx-red-light)">xx</tspan>
          <tspan fill="#3f3f46">us</tspan>
        </text>
        <text x="216" y="146" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif"
          fontSize="46" fontWeight="400" fill="#666b73" letterSpacing="0.2">
          Portal de Soporte
        </text>
      </g>
    </svg>
  );
}

export function FlexxusSupportLogoDark({ className = "", width = 420 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 670 220"
      width={width}
      className={className}
      role="img"
      aria-label="Flexxus Portal de Soporte"
    >
      <defs>
        <linearGradient id="fx-red-dark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff4a4a" />
          <stop offset="100%" stopColor="#e1262d" />
        </linearGradient>
      </defs>

      <g transform="translate(28 46)">
        <g stroke="#9aa0aa" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M40 14 L92 14 L118 58 L92 102 L40 102 L14 58 Z" />
          <path d="M40 14 L40 102" />
          <path d="M92 14 L92 102" />
          <path d="M14 58 L118 58" />
          <path d="M40 14 L66 58 L40 102" />
          <path d="M92 14 L66 58 L92 102" />
        </g>
        {([
          [40, 14], [92, 14], [118, 58], [92, 102], [40, 102], [14, 58],
        ] as [number, number][]).map(([cx, cy], i) => (
          <circle
            key={i} cx={cx} cy={cy} r="10"
            fill={i === 0 || i === 2 || i === 5 ? "#ef2b2d" : "#1f2937"}
            stroke="#c7ccd4" strokeWidth="4"
          />
        ))}
        <circle cx="66" cy="58" r="16" fill="url(#fx-red-dark)" stroke="#ffffff" strokeWidth="5" />
      </g>

      <g transform="translate(180 34)">
        <text x="0" y="80" fontFamily="Arial, Helvetica, sans-serif" fontSize="118" fontWeight="700" letterSpacing="-4">
          <tspan fill="#f4f4f5">Fle</tspan>
          <tspan fill="url(#fx-red-dark)">xx</tspan>
          <tspan fill="#f4f4f5">us</tspan>
        </text>
        <text x="216" y="146" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif"
          fontSize="46" fontWeight="400" fill="#d4d7dd" letterSpacing="0.2">
          Portal de Soporte
        </text>
      </g>
    </svg>
  );
}

export function FlexxusSupportIcon({ className = "", size = 64 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 132 132"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Flexxus Support Icon"
    >
      <defs>
        <linearGradient id="fx-red-icon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff3b3b" />
          <stop offset="100%" stopColor="#e1262d" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="132" height="132" rx="24" fill="#ffffff" />
      <g transform="translate(0 2)">
        <g stroke="#5d6168" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M40 14 L92 14 L118 58 L92 102 L40 102 L14 58 Z" />
          <path d="M40 14 L40 102" />
          <path d="M92 14 L92 102" />
          <path d="M14 58 L118 58" />
          <path d="M40 14 L66 58 L40 102" />
          <path d="M92 14 L66 58 L92 102" />
        </g>
        {([
          [40, 14], [92, 14], [118, 58], [92, 102], [40, 102], [14, 58],
        ] as [number, number][]).map(([cx, cy], i) => (
          <circle
            key={i} cx={cx} cy={cy} r="10"
            fill={i === 0 || i === 2 || i === 5 ? "#ef2b2d" : "#f4f4f5"}
            stroke="#5d6168" strokeWidth="4"
          />
        ))}
        <circle cx="66" cy="58" r="16" fill="url(#fx-red-icon)" stroke="#ffffff" strokeWidth="5" />
      </g>
    </svg>
  );
}
