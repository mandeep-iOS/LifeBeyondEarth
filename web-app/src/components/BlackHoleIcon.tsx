export default function BlackHoleIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="block">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .bh-disk { animation: spinDisk 4s linear infinite; }
          @keyframes spinDisk {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        }
      `}</style>
      
      {/* Outer accretion disk - violet to cyan */}
      <circle cx="15" cy="15" r="13" fill="none" stroke="url(#diskGrad)" strokeWidth="3" className="bh-disk" opacity="0.7" />
      
      {/* Middle accretion ring - cyan */}
      <circle cx="15" cy="15" r="10" fill="none" stroke="#06b6d4" strokeWidth="2" className="bh-disk" opacity="0.5" />
      
      {/* Event horizon - dark center */}
      <circle cx="15" cy="15" r="6" fill="url(#horizonGrad)" />
      
      {/* Inner light source glow */}
      <circle cx="15" cy="15" r="5" fill="#1e1b4b" opacity="0.8" />
      <circle cx="15" cy="15" r="3" fill="#4c1d95" opacity="0.6" />
      
      {/* Subtle highlight on horizon */}
      <circle cx="15" cy="12" r="2" fill="#a78bfa" opacity="0.3" />
      
      <defs>
        {/* Disk gradient: violet to cyan */}
        <linearGradient id="diskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#bf40bf', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#0ea5e9', stopOpacity: 1 }} />
        </linearGradient>
        
        {/* Event horizon: dark purple to black */}
        <radialGradient id="horizonGrad" cx="50%" cy="40%">
          <stop offset="0%" style={{ stopColor: '#2d1b5e', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#0f0620', stopOpacity: 1 }} />
        </radialGradient>
      </defs>
    </svg>
  )
}
