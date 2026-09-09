export function AppLogoIcon({ size = 32 }: { size?: number }): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="app-logo-svg"
    >
      <defs>
        {/* Background Canvas */}
        <linearGradient id="as-bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#080e1e" />
          <stop offset="40%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#040711" />
        </linearGradient>

        {/* Outer Rim Bevel */}
        <linearGradient id="as-rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
          <stop offset="25%" stopColor="#1e293b" stopOpacity="0.4" />
          <stop offset="70%" stopColor="#0f172a" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.75" />
        </linearGradient>

        {/* Dual Ambient Corner Glows */}
        <radialGradient id="as-glowTopLeft" cx="20%" cy="20%" r="65%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#1d4ed8" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="as-glowBottomRight" cx="80%" cy="80%" r="65%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#047857" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>

        {/* FACET 1: Top-Left Shoulder (Vivid Sky to Royal Blue) */}
        <linearGradient id="as-facetTopLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="35%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>

        {/* FACET 2: Bottom-Left Taper (Royal Navy) */}
        <linearGradient id="as-facetBotLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="50%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>

        {/* FACET 3: Top-Right Shoulder (Mint / Emerald Highlight) */}
        <linearGradient id="as-facetTopRight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="40%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        {/* FACET 4: Bottom-Right Taper (Deep Emerald) */}
        <linearGradient id="as-facetBotRight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="55%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>

        {/* Inner Core Cavity Gradient */}
        <linearGradient id="as-innerCavityGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#131e36" />
          <stop offset="100%" stopColor="#070c18" />
        </linearGradient>

        {/* Apex Keystone Facet */}
        <linearGradient id="as-apexJewel" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#bae6fd" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        {/* Reconcile Checkmark Ribbon Gradient */}
        <linearGradient id="as-checkRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#f0fdf4" />
          <stop offset="75%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>

        {/* Specular Bevel Highlights */}
        <linearGradient id="as-specularTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Drop Shadows & Glow Filters */}
        <filter id="as-shadowApp" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#000000" floodOpacity="0.65" />
        </filter>

        <filter id="as-glowShield" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#0284c7" floodOpacity="0.45" />
          <feDropShadow dx="0" dy="2" stdDeviation="6" floodColor="#10b981" floodOpacity="0.35" />
        </filter>

        <filter id="as-glowCheckmark" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#0ea5e9" floodOpacity="0.6" />
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#10b981" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* ================= 1. SQUIRCLE ICON CONTAINER ================= */}
      <rect
        x="14"
        y="14"
        width="228"
        height="228"
        rx="54"
        fill="url(#as-bgGrad)"
        stroke="url(#as-rimGrad)"
        strokeWidth="2"
        filter="url(#as-shadowApp)"
      />
      <rect x="14" y="14" width="228" height="228" rx="54" fill="url(#as-glowTopLeft)" />
      <rect x="14" y="14" width="228" height="228" rx="54" fill="url(#as-glowBottomRight)" />

      {/* Subtle Financial / Tech Precision Grid Markings */}
      <g opacity="0.06" stroke="#38bdf8" strokeWidth="1" fill="none">
        <circle cx="128" cy="128" r="94" strokeDasharray="4 6" />
        <circle cx="128" cy="128" r="68" />
        <path d="M 40 128 H 216 M 128 40 V 216" strokeDasharray="3 5" />
      </g>

      {/* ================= 2. THE 3D FACETED AUDIT SHIELD (MONOGRAM 'A') ================= */}
      <g filter="url(#as-glowShield)">
        {/* Center Inner Cavity */}
        <path
          d="M 128 42 L 186 74 L 186 128 C 186 168 160 200 128 214 C 96 200 70 168 70 128 L 70 74 Z"
          fill="url(#as-innerCavityGrad)"
          stroke="#1e293b"
          strokeWidth="1.5"
        />

        {/* FACET 1: Top-Left Shoulder */}
        <path
          d="M 128 42 L 70 74 L 70 128 L 102 128 L 102 92 L 128 76 Z"
          fill="url(#as-facetTopLeft)"
        />

        {/* FACET 2: Bottom-Left Taper */}
        <path
          d="M 70 128 C 70 168 96 200 128 214 L 128 178 C 110 166 102 148 102 128 Z"
          fill="url(#as-facetBotLeft)"
        />

        {/* FACET 3: Top-Right Shoulder */}
        <path
          d="M 128 42 L 186 74 L 186 128 L 154 128 L 154 92 L 128 76 Z"
          fill="url(#as-facetTopRight)"
        />

        {/* FACET 4: Bottom-Right Taper */}
        <path
          d="M 186 128 C 186 168 160 200 128 214 L 128 178 C 146 166 154 148 154 128 Z"
          fill="url(#as-facetBotRight)"
        />

        {/* Specular Bevel Highlights */}
        <path
          d="M 128 42 L 70 74 L 70 128"
          stroke="url(#as-specularTop)"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />

        <path
          d="M 128 42 L 186 74"
          stroke="#ffffff"
          strokeOpacity="0.45"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Apex Keystone Diamond */}
        <polygon points="128,42 138,58 128,74 118,58" fill="url(#as-apexJewel)" />
        <circle cx="128" cy="58" r="2.5" fill="#ffffff" />

        {/* ================= 3. LUMINOUS RECONCILIATION CHECKMARK RIBBON ================= */}
        <g filter="url(#as-glowCheckmark)">
          {/* Checkmark Halo Shadow Base */}
          <path
            d="M 86 126 L 116 156 C 118.5 158.5 122.5 158.5 125 156 L 184 94"
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="20"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.3"
          />

          {/* Main Glowing Reconcile Checkmark Ribbon */}
          <path
            d="M 86 126 L 116 156 C 118.5 158.5 122.5 158.5 125 156 L 184 94"
            fill="none"
            stroke="url(#as-checkRibbon)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* High-Intensity Specular Core Light */}
          <path
            d="M 88 126 L 116 154 C 118.5 156.5 122.5 156.5 125 154 L 182 94"
            fill="none"
            stroke="#ffffff"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.95"
          />
        </g>

        {/* Base Convergence Sparkle */}
        <polygon points="128,206 131,212 128,218 125,212" fill="#ffffff" opacity="0.8" />
      </g>
    </svg>
  )
}

export function AppLogo(): JSX.Element {
  return (
    <div className="app-brand">
      <div className="app-brand-badge">
        <AppLogoIcon size={34} />
      </div>
      <div className="app-brand-text">
        <div className="app-brand-title">
          <span className="brand-name-main">Audit</span>
          <span className="brand-name-sub">Soft</span>
          <span className="brand-badge-pill">PRO</span>
        </div>
        <div className="app-brand-desc">
          Hệ thống Trợ lý Kiểm toán Toàn diện
        </div>
      </div>
    </div>
  )
}
