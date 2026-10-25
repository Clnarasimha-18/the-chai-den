import React from 'react';

export const MilkshakesTallGlass: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative flex flex-col items-center justify-center ${className} select-none`}>
      <svg
        width="82"
        height="180"
        viewBox="0 0 82 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] filter transition-transform hover:scale-105 duration-300"
      >
        <defs>
          <linearGradient id="strawPinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFAEC9" />
            <stop offset="40%" stopColor="#FF7597" />
            <stop offset="80%" stopColor="#E03867" />
            <stop offset="100%" stopColor="#B31A45" />
          </linearGradient>

          <linearGradient id="glassReflection" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.1" />
            <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id="creamMound" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#FFF2F6" />
            <stop offset="100%" stopColor="#F5D0DD" />
          </linearGradient>
        </defs>

        {/* Straw extending out of the cream */}
        <line x1="52" y1="2" x2="38" y2="55" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
        <line x1="52" y1="2" x2="38" y2="55" stroke="#E83E6E" strokeWidth="2.5" strokeDasharray="5 5" strokeLinecap="round" />

        {/* Fresh Ruby Strawberry Garnish */}
        <path
          d="M20 28 C15 22 22 14 30 18 C36 22 34 32 26 34 C21 34 20 30 20 28 Z"
          fill="#D61A46"
        />
        {/* Strawberry seed dots */}
        <circle cx="24" cy="24" r="0.8" fill="#FFF275" />
        <circle cx="28" cy="26" r="0.8" fill="#FFF275" />
        <circle cx="25" cy="30" r="0.8" fill="#FFF275" />
        {/* Strawberry green leaves */}
        <path d="M26 18 Q30 12 32 14 Q30 18 26 18" fill="#4E8C2F" />
        <path d="M24 19 Q20 13 22 15 Q24 19 24 19" fill="#4E8C2F" />

        {/* Towering Swirled Whipped Cream Top */}
        <path
          d="M26 42
             C20 36 25 24 38 24
             C50 24 55 34 52 42
             C58 43 62 48 59 56
             C57 60 52 64 42 64
             C32 64 22 62 19 56
             C17 48 21 44 26 42 Z"
          fill="url(#creamMound)"
          stroke="#E5C1D0"
          strokeWidth="0.8"
        />

        {/* Drizzled Pink Strawberry Syrup Trails over the cream */}
        <path d="M34 26 Q36 36 32 44" stroke="#D82958" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path d="M42 28 Q48 38 46 50" stroke="#D82958" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <path d="M26 42 Q30 52 38 52" stroke="#D82958" strokeWidth="1.8" strokeLinecap="round" fill="none" />

        {/* Sundae Fluted Glass Body */}
        <path
          d="M18 62
             L25 138
             C26 145 32 150 40 150
             C48 150 54 145 55 138
             L62 62
             Z"
          fill="url(#strawPinkGrad)"
        />

        {/* Inner Liquid Texture / Glass Fluting Lines */}
        <path d="M27 64 L31 138" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="1.5" />
        <path d="M40 64 L40 148" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="2" />
        <path d="M53 64 L49 138" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="1.5" />

        {/* Glass Outer Highlight Overlays */}
        <path
          d="M18 62
             L25 138
             C26 145 32 150 40 150
             C48 150 54 145 55 138
             L62 62
             Z"
          fill="url(#glassReflection)"
          stroke="#FFFFFF"
          strokeOpacity="0.45"
          strokeWidth="1.2"
        />

        {/* Heavy Fluted Glass Stem & Circular Base */}
        <path d="M36 150 L34 165 C34 168 36 170 40 170 C44 170 46 168 46 165 L44 150 Z" fill="#E8D2DC" stroke="#FFFFFF" strokeWidth="1" />
        <ellipse cx="40" cy="170" rx="22" ry="6" fill="#F0DFE7" stroke="#FFFFFF" strokeWidth="1.2" />
        <ellipse cx="40" cy="170" rx="16" ry="3.5" fill="#FFFFFF" fillOpacity="0.6" />
      </svg>
    </div>
  );
};

export const MilkshakesRowMini: React.FC<{ className?: string }> = ({ className = '' }) => {
  const miniShakes = [
    { name: 'Vanilla', color: '#FFF8E7', syrup: '#E5C483', top: '#FFFFFF' },
    { name: 'Strawberry', color: '#FFAEC9', syrup: '#D61A46', top: '#FFE5EC' },
    { name: 'Chocolate', color: '#5C341E', syrup: '#30180B', top: '#EAD1BD' },
    { name: 'Oreo', color: '#3A2820', syrup: '#18100C', top: '#ECE5DE' },
    { name: 'Black Current', color: '#743C6E', syrup: '#3D1537', top: '#E6C6E0' },
    { name: 'Banana', color: '#FFE072', syrup: '#C49718', top: '#FFF7D6' },
  ];

  return (
    <div className={`w-full flex items-end justify-between px-2 pt-1 pb-1 gap-1 select-none ${className}`}>
      {miniShakes.map((s, idx) => (
        <div key={idx} className="flex flex-col items-center group/mini flex-1 max-w-[42px]">
          <svg
            width="32"
            height="58"
            viewBox="0 0 32 58"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="transition-transform group-hover/mini:scale-110 duration-200"
          >
            {/* Straw */}
            <line x1="20" y1="2" x2="16" y2="18" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="20" y1="2" x2="16" y2="18" stroke={s.syrup} strokeWidth="1" strokeDasharray="2 2" strokeLinecap="round" />

            {/* Whipped top */}
            <ellipse cx="16" cy="16" rx="9" ry="5" fill={s.top} stroke="#FFFFFF" strokeWidth="0.8" />
            <path d="M11 16 Q16 12 21 16" stroke={s.syrup} strokeWidth="1.2" strokeLinecap="round" fill="none" />

            {/* Glass body */}
            <path
              d="M8 18 L10 50 C10.5 53 13 54.5 16 54.5 C19 54.5 21.5 53 22 50 L24 18 Z"
              fill={s.color}
              stroke="#FFFFFF"
              strokeWidth="0.9"
            />
            {/* Glass highlight */}
            <line x1="11" y1="20" x2="12" y2="48" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="1" />
            {/* Glass base */}
            <ellipse cx="16" cy="54" rx="7" ry="2.2" fill="#EAD8E0" stroke="#FFFFFF" strokeWidth="0.8" />
          </svg>
        </div>
      ))}
    </div>
  );
};
