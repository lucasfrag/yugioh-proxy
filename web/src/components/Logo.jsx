import React from 'react';

// Marca do site: núcleo hexagonal de um duel disk com uma carta no centro
export default function Logo({ size = 30, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path d="M16 1.5 28.5 8.75v14.5L16 30.5 3.5 23.25V8.75L16 1.5Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 5.5 25 10.7v10.6L16 26.5l-9-5.2V10.7L16 5.5Z" stroke="currentColor" strokeWidth="0.8" opacity="0.45" />
      <rect x="11.25" y="9" width="9.5" height="14" rx="0.75" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.4" />
      <path d="M13.5 12h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M16 15.25 18 17.5 16 19.75 14 17.5 16 15.25Z" fill="currentColor" />
    </svg>
  );
}
