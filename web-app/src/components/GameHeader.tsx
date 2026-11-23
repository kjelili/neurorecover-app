import { Link } from 'react-router-dom';
import { GameIcon } from './GameIcon';
import type { GameType } from '../types/session';

interface GameHeaderProps {
  game: GameType;
  title: string;
  backLabel: string;
}

/** Shared game-page header: back link + brand icon tile + title. */
export function GameHeader({ game, title, backLabel }: GameHeaderProps) {
  return (
    <div className="mb-6">
      <Link to="/app" className="text-sm text-warm-400 hover:text-primary-600 transition-colors mb-2 inline-block">
        ← {backLabel}
      </Link>
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0">
          <GameIcon game={game} className="w-6 h-6" />
        </span>
        <h1 className="section-title">{title}</h1>
      </div>
    </div>
  );
}
