import type { GameType } from '../types/session';

interface GameIconProps {
  game: GameType;
  className?: string;
  strokeWidth?: number;
}

/**
 * Clean inline-SVG icon set for the five exercises.
 * Stroke style, inherits currentColor.
 */
export function GameIcon({ game, className = 'w-6 h-6', strokeWidth = 1.8 }: GameIconProps) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (game) {
    case 'piano':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M8 5v8M12 5v8M16 5v8" />
          <path d="M8 13v6M12 13v6M16 13v6" strokeWidth={strokeWidth * 0.7} />
        </svg>
      );
    case 'bubbles':
      return (
        <svg {...common}>
          <circle cx="8" cy="9" r="4" />
          <circle cx="16.5" cy="14.5" r="3" />
          <circle cx="10" cy="17.5" r="1.6" />
        </svg>
      );
    case 'grab-cup':
      return (
        <svg {...common}>
          <path d="M6 8h11v7a4 4 0 0 1-4 4h-3a4 4 0 0 1-4-4V8Z" />
          <path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17" />
          <path d="M9 4.5c0-.8.6-.8.6-1.5M13 4.5c0-.8.6-.8.6-1.5" strokeWidth={strokeWidth * 0.8} />
        </svg>
      );
    case 'pour':
      return (
        <svg {...common}>
          <path d="M8 9h8v3.5a4 4 0 0 1-4 4h0a4 4 0 0 1-4-4V9Z" />
          <path d="M8 10 4.5 7.5c-.6-.4-.3-1.4.4-1.5L8 7" />
          <path d="M16 9.5c1.6.2 3 1 3 2.6 0 1.4-1.2 2.2-2.6 2.2" />
          <path d="M11.2 19.5v1.3M13.6 19.2v1.6" strokeWidth={strokeWidth * 0.8} />
        </svg>
      );
    case 'mirror':
      return (
        <svg {...common}>
          <rect x="7" y="3" width="10" height="18" rx="5" />
          <path d="M10.5 8.5 14 5.5M10.5 12.5l5.5-5" strokeWidth={strokeWidth * 0.75} />
        </svg>
      );
    default:
      return null;
  }
}
