import React from 'react';

export interface PlainpageLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'app-icon';
  theme?: 'light' | 'dark';
  showTagline?: boolean;
  taglineClassName?: string;
  className?: string;
}

/**
 * Tilted folded-page 'p' mark.
 * The bowl is a page with a 45-degree folded corner,
 * tilted 10 degrees forward like a turning page.
 */
export function PlainpageIcon({
  size = 28,
  color = '#1D4ED8',
  foldColor = '#60A5FA',
  className = '',
}: {
  size?: number;
  color?: string;
  foldColor?: string;
  className?: string;
}) {
  const height = Math.round((size * 44) / 36);
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 36 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 overflow-visible select-none ${className}`}
      aria-hidden="true"
    >
      <g transform="rotate(10 18 22)">
        {/* Main P body: stem + page bowl with cutout counter */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="
            M 5 7.5
            H 22
            L 31 16.5
            V 22.5
            C 31 26.8 27.5 29.5 23 29.5
            H 12
            V 41
            C 12 42.7 10.7 44 9 44
            C 7.3 44 6 42.7 6 41
            V 7.5
            Z
            M 12 14
            H 20.5
            C 22.5 14 24 15.5 24 17.5
            C 24 19.5 22.5 21 20.5 21
            H 12
            V 14
            Z"
          fill={color}
        />
        {/* Folded page corner (dog-ear flap) */}
        <path d="M 22 7.5 V 16.5 H 31 Z" fill={foldColor} />
      </g>
    </svg>
  );
}

/**
 * Plainpage App Icon / Favicon badge
 * Rounded tile with white tilted 'p' inside.
 */
export function PlainpageAppIcon({
  size = 40,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  const iconSize = Math.round(size * 0.58);
  const rx = Math.round(size * 0.25);
  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 shadow-sm ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: rx,
        backgroundColor: '#1D4ED8',
      }}
      aria-hidden="true"
    >
      <PlainpageIcon size={iconSize} color="#FFFFFF" foldColor="#93C5FD" />
    </div>
  );
}

/**
 * Plainpage Official Logo Component
 * Supports standalone app icon, standalone glyph, or full one-piece wordmark.
 */
export default function PlainpageLogo({
  size = 'md',
  variant = 'full',
  theme = 'light',
  showTagline = false,
  taglineClassName = '',
  className = '',
}: PlainpageLogoProps) {
  // Dimension tokens
  const config = {
    sm: { pSize: 18, fontSize: 'text-[17px]', fontLeading: 'leading-none', gap: '-ml-0.5', textOffset: '-mb-0.5' },
    md: { pSize: 24, fontSize: 'text-[22px]', fontLeading: 'leading-none', gap: '-ml-0.5', textOffset: '-mb-0.5' },
    lg: { pSize: 34, fontSize: 'text-[32px]', fontLeading: 'leading-none', gap: '-ml-1', textOffset: '-mb-1' },
    xl: { pSize: 44, fontSize: 'text-[42px]', fontLeading: 'leading-none', gap: '-ml-1', textOffset: '-mb-1.5' },
  }[size];

  const pColor = theme === 'dark' ? '#3B82F6' : '#1D4ED8';
  const foldColor = theme === 'dark' ? '#93C5FD' : '#60A5FA';
  const textColor = theme === 'dark' ? 'text-white' : 'text-slate-900';

  if (variant === 'app-icon') {
    const tileSizes = { sm: 26, md: 36, lg: 48, xl: 64 };
    return <PlainpageAppIcon size={tileSizes[size]} className={className} />;
  }

  if (variant === 'icon') {
    return (
      <PlainpageIcon
        size={config.pSize}
        color={pColor}
        foldColor={foldColor}
        className={className}
      />
    );
  }

  return (
    <div className={`inline-flex flex-col select-none ${className}`}>
      <div className="inline-flex items-baseline tracking-tight">
        {/* The tilted 'p' leading the word as one piece */}
        <div className="inline-flex items-center shrink-0 self-center">
          <PlainpageIcon
            size={config.pSize}
            color={pColor}
            foldColor={foldColor}
          />
        </div>
        {/* 'lainpage' completes the wordmark */}
        <span
          className={`font-extrabold ${config.fontSize} ${config.fontLeading} ${config.gap} ${config.textOffset} ${textColor}`}
          style={{ letterSpacing: '-0.035em' }}
        >
          lainpage
        </span>
      </div>

      {showTagline && (
        <span
          className={`text-slate-500 font-medium text-xs mt-1 ${taglineClassName}`}
        >
          Write clearly. Share simply.
        </span>
      )}
    </div>
  );
}
