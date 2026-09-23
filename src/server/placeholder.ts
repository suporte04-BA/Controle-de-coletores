// Widescreen Zebra TC52 placeholder matching user's device image
// Black rugged body, orange side button, front camera, Android nav buttons, scanner window

export function placeholderImg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="520" viewBox="0 0 300 520">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0d0d0d"/>
      <stop offset="100%" stop-color="#050505"/>
    </linearGradient>
    <linearGradient id="body" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3a3a3a"/>
      <stop offset="35%" stop-color="#2d2d2d"/>
      <stop offset="65%" stop-color="#282828"/>
      <stop offset="100%" stop-color="#222"/>
    </linearGradient>
    <linearGradient id="bezel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#333"/>
      <stop offset="100%" stop-color="#2a2a2a"/>
    </linearGradient>
    <linearGradient id="scr" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#010101"/>
    </linearGradient>
    <linearGradient id="rugged" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#404040"/>
      <stop offset="100%" stop-color="#333"/>
    </linearGradient>
    <linearGradient id="orangeBtn" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ff8a3d"/>
      <stop offset="50%" stop-color="#ff6b1a"/>
      <stop offset="100%" stop-color="#e05500"/>
    </linearGradient>
    <linearGradient id="camGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2a2a3a"/>
      <stop offset="100%" stop-color="#1a1a28"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="innerShadow">
      <feOffset dx="0" dy="2"/>
      <feGaussianBlur stdDeviation="3"/>
      <feComposite operator="out" in="SourceGraphic"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.3"/></feComponentTransfer>
      <feComposite operator="over" in="SourceGraphic"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="300" height="520" fill="url(#bg)"/>

  <!-- Device body - main shape -->
  <rect x="42" y="22" width="216" height="476" rx="24" fill="url(#body)"/>

  <!-- Rugged corner bumpers -->
  <rect x="38" y="18" width="30" height="30" rx="8" fill="url(#rugged)"/>
  <rect x="232" y="18" width="30" height="30" rx="8" fill="url(#rugged)"/>
  <rect x="38" y="472" width="30" height="30" rx="8" fill="url(#rugged)"/>
  <rect x="232" y="472" width="30" height="30" rx="8" fill="url(#rugged)"/>

  <!-- Body edge highlights -->
  <rect x="42" y="22" width="216" height="476" rx="24" fill="none" stroke="#444" stroke-width="0.5"/>

  <!-- Screen bezel -->
  <rect x="52" y="42" width="196" height="420" rx="4" fill="url(#bezel)"/>

  <!-- Screen -->
  <rect x="56" y="48" width="188" height="408" rx="2" fill="url(#scr)" filter="url(#innerShadow)"/>

  <!-- Screen subtle reflection -->
  <rect x="56" y="48" width="188" height="200" rx="2" fill="url(#scr)" opacity="0.85"/>
  <rect x="56" y="48" width="188" height="80" rx="2" fill="#0d0d0d" opacity="0.3"/>

  <!-- Top bar area (dark) -->
  <rect x="56" y="48" width="188" height="16" fill="#0a0a0a"/>

  <!-- Front camera -->
  <circle cx="90" cy="55" r="4.5" fill="#111" stroke="#2a2a2a" stroke-width="0.8"/>
  <circle cx="90" cy="55" r="2.5" fill="#16162a"/>
  <circle cx="89.2" cy="54.2" r="0.8" fill="#2a2a4a" opacity="0.6"/>

  <!-- Speaker grill -->
  <rect x="128" y="53" width="40" height="3" rx="1.5" fill="#1a1a1a"/>
  <rect x="130" y="53.5" width="36" height="2" rx="1" fill="#111"/>

  <!-- Sensor dots -->
  <circle cx="180" cy="55" r="1.5" fill="#111" stroke="#222" stroke-width="0.3"/>
  <circle cx="190" cy="55" r="1.5" fill="#111" stroke="#222" stroke-width="0.3"/>

  <!-- Orange side button (left side) -->
  <rect x="30" y="195" width="14" height="55" rx="5" fill="url(#orangeBtn)"/>
  <rect x="30" y="195" width="14" height="55" rx="5" fill="none" stroke="#ffaa66" stroke-width="0.4" opacity="0.5"/>
  <rect x="32" y="200" width="10" height="45" rx="3" fill="none" stroke="#ff9944" stroke-width="0.3" opacity="0.3"/>

  <!-- Side buttons (right side) -->
  <rect x="256" y="180" width="10" height="35" rx="3" fill="#3a3a3a" stroke="#444" stroke-width="0.3"/>
  <rect x="256" y="225" width="10" height="35" rx="3" fill="#3a3a3a" stroke="#444" stroke-width="0.3"/>

  <!-- Android navigation bar -->
  <rect x="56" y="430" width="188" height="26" fill="#0a0a0a"/>

  <!-- Back button (triangle) -->
  <polygon points="100,445 88,437 88,453" fill="none" stroke="#555" stroke-width="1.5" stroke-linejoin="round"/>

  <!-- Home button (circle) -->
  <circle cx="128" cy="445" r="7" fill="none" stroke="#555" stroke-width="1.5"/>

  <!-- Recent apps button (square) -->
  <rect x="160" y="438" width="14" height="14" rx="1.5" fill="none" stroke="#555" stroke-width="1.5"/>

  <!-- Scanner window (bottom back - visible) -->
  <rect x="100" y="490" width="100" height="14" rx="3" fill="#1a1a1a" stroke="#333" stroke-width="0.5"/>
  <rect x="105" y="492" width="90" height="10" rx="2" fill="#0d0d0d"/>
  <rect x="110" y="494" width="80" height="6" rx="1" fill="#080808"/>
  <rect x="110" y="494" width="80" height="2" rx="1" fill="#151515" opacity="0.4"/>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
