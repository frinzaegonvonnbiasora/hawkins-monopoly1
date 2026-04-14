import React from 'react';
import { Wallet, Dice5, Train, Zap, HelpCircle, Users, ShieldAlert, Star, Skull, Building2 } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { cn } from '../lib/utils';
import { GameState, Player, Property } from '../types';
import { BOARD_SIZE } from '../constants';
import { TitleDeedCard } from './TitleDeedCard';

interface GameBoardProps {
  gameState: GameState;
  onRollDice: () => void;
  onRerollDice: () => void;
  onAction: () => void;
  onBuyProperty: () => void;
  onPayRent: () => void;
  onShowTitleDeed: (propertyId: string) => void;
  onEndTurn: () => void;
  onJailAction?: (action: 'PAY' | 'ROLL' | 'CARD') => void;
  onHideTitleDeed: () => void;
}

// ─── Tile type helpers ────────────────────────────────────────────────────────

/** Returns a small icon for special (non-property) tiles */
const getTileIcon = (type: string, size = 10) => {
  switch (type) {
    case 'GO':            return <Star size={size} className="text-yellow-400" />;
    case 'JAIL':          return <ShieldAlert size={size} className="text-blue-400" />;
    case 'GO_TO_JAIL':    return <Skull size={size} className="text-red-500" />;
    case 'FREE_PARKING':  return <Star size={size} className="text-green-400" />;
    case 'RAILROAD':      return <Train size={size} className="text-white/80" />;
    case 'UTILITY':       return <Zap size={size} className="text-yellow-300" />;
    case 'CHANCE':        return <HelpCircle size={size} className="text-red-400" />;
    case 'COMMUNITY_CHEST': return <Users size={size} className="text-blue-300" />;
    case 'TAX':           return <Wallet size={size} className="text-orange-400" />;
    default:              return <Building2 size={size} className="text-white/40" />;
  }
};

/** Background tint for each special tile type */
const getTileBg = (type: string): string => {
  switch (type) {
    case 'GO':            return 'bg-yellow-900/20';
    case 'JAIL':          return 'bg-blue-900/20';
    case 'GO_TO_JAIL':    return 'bg-red-900/30';
    case 'FREE_PARKING':  return 'bg-green-900/20';
    case 'RAILROAD':      return 'bg-slate-800/60';
    case 'UTILITY':       return 'bg-yellow-900/20';
    case 'CHANCE':        return 'bg-red-900/20';
    case 'COMMUNITY_CHEST': return 'bg-blue-900/20';
    case 'TAX':           return 'bg-orange-900/20';
    default:              return '';
  }
};

/** Corner tile full rendering */
const CORNER_CONFIG: Record<number, { label: string; sublabel: string; bg: string; textColor: string; icon: React.ReactNode }> = {
  0:  { label: 'GO',           sublabel: 'Collect $200',       bg: 'bg-yellow-900/30',   textColor: 'text-yellow-300',  icon: <Star size={20} className="text-yellow-400" /> },
  10: { label: 'JUST VISITING', sublabel: '/ THE VOID',         bg: 'bg-blue-900/30',     textColor: 'text-blue-300',    icon: <ShieldAlert size={20} className="text-blue-400" /> },
  20: { label: 'FREE PARKING', sublabel: 'Safe Zone',           bg: 'bg-green-900/30',    textColor: 'text-green-300',   icon: <Star size={20} className="text-green-400" /> },
  30: { label: 'GO TO',        sublabel: 'THE VOID',            bg: 'bg-red-900/40',      textColor: 'text-red-400',     icon: <Skull size={20} className="text-red-500" /> },
};

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onRollDice,
  onRerollDice,
  onAction,
  onBuyProperty,
  onPayRent,
  onShowTitleDeed,
  onEndTurn,
  onJailAction,
  onHideTitleDeed,
}) => {
  const { players, currentPlayerIndex, properties, dice, turnPhase, isRolling } = gameState;
  const currentPlayer = players[currentPlayerIndex];
  const currentTile = properties[currentPlayer.position];

  const getPlayersOnTile = (tileIndex: number) =>
    players.filter(p => p.position === tileIndex);

  // ── Title deed popup positioning ────────────────────────────────────────────
  const getTitleDeedPosition = (position: number) => {
    let baseStyles: React.CSSProperties = { position: 'absolute', zIndex: 100, pointerEvents: 'auto' };
    let animationClass = 'animate-in fade-in duration-500';
    if (position >= 21 && position <= 29) {
      baseStyles = { ...baseStyles, bottom: '105%', left: '50%', transform: 'translateX(-50%)' };
      animationClass += ' slide-in-from-bottom-4';
    } else if (position >= 31 && position <= 39) {
      baseStyles = { ...baseStyles, top: '50%', left: '105%', transform: 'translateY(-50%)' };
      animationClass += ' slide-in-from-left-4';
    } else if (position >= 1 && position <= 9) {
      baseStyles = { ...baseStyles, top: '105%', left: '50%', transform: 'translateX(-50%)' };
      animationClass += ' slide-in-from-top-4';
    } else if (position >= 11 && position <= 19) {
      baseStyles = { ...baseStyles, top: '50%', right: '105%', transform: 'translateY(-50%)' };
      animationClass += ' slide-in-from-right-4';
    } else {
      baseStyles = { ...baseStyles, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
      animationClass += ' zoom-in-95';
    }
    return { styles: baseStyles, className: animationClass };
  };

  const onTileClick = (index: number) => {
    const tile = gameState.properties[index];
    if (
      (tile.type === 'PROPERTY' || tile.type === 'RAILROAD' || tile.type === 'UTILITY') &&
      tile.ownerId === currentPlayer.id
    ) {
      onShowTitleDeed(tile.id);
    }
  };

  // ── Side tile renderer ───────────────────────────────────────────────────────
  const renderSideTiles = (side: 'top' | 'right' | 'bottom' | 'left') => {
    const tiles = [];
    for (let i = 0; i < 9; i++) {
      let index = 0;
      let gridPos = {};

      if (side === 'top')    { index = 21 + i; gridPos = { gridColumnStart: 2 + i, gridRowStart: 1 }; }
      else if (side === 'right')  { index = 31 + i; gridPos = { gridColumnStart: 11, gridRowStart: 2 + i }; }
      else if (side === 'bottom') { index = 9 - i;  gridPos = { gridColumnStart: 10 - i, gridRowStart: 11 }; }
      else if (side === 'left')   { index = 19 - i; gridPos = { gridColumnStart: 1, gridRowStart: 10 - i }; }

      const tile = gameState.properties[index];
      const playersOnTile = getPlayersOnTile(index);
      const owner = tile.ownerId ? gameState.players.find(p => p.id === tile.ownerId) : null;
      const isOwnedByCurrent = tile.ownerId === currentPlayer.id;
      const isCurrentPlayerHere = playersOnTile.some(p => p.id === currentPlayer.id);
      const isPurchasable = tile.type === 'PROPERTY' || tile.type === 'RAILROAD' || tile.type === 'UTILITY';
      const isSpecial = !isPurchasable;

      // Orientation helpers
      const isHoriz = side === 'top' || side === 'bottom';
      const rotClass = side === 'right' ? 'rotate-90' : side === 'left' ? '-rotate-90' : '';

      const content = (
        <div
          onClick={() => onTileClick(index)}
          className={cn(
            'flex flex-col items-center justify-between h-full w-full relative group transition-all duration-200',
            isHoriz ? (side === 'bottom' ? 'flex-col-reverse' : 'flex-col') : (side === 'left' ? 'flex-row' : 'flex-row-reverse'),
            isOwnedByCurrent && 'cursor-pointer hover:scale-[1.03] hover:z-20',
            !isOwnedByCurrent && 'cursor-default',
            getTileBg(tile.type),
            isCurrentPlayerHere && 'ring-1 ring-inset ring-white/30',
          )}
        >
          {/* Hover glow for owned tiles */}
          {isOwnedByCurrent && (
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-primary/5 shadow-[0_0_20px_rgba(225,19,34,0.15)] z-0" />
          )}

          {/* Property color strip */}
          {tile.color && isPurchasable && (
            <div
              className={cn(
                isHoriz ? 'w-full h-3' : 'h-full w-3',
                'shrink-0 transition-all group-hover:brightness-125 shadow-[inset_0_0_6px_rgba(0,0,0,0.4)] z-10',
                owner && 'opacity-100',
                !owner && 'opacity-70',
              )}
              style={{ backgroundColor: tile.color }}
            />
          )}

          {/* Special tile icon strip (replaces color bar) */}
          {isSpecial && (
            <div className={cn(
              isHoriz ? 'w-full h-3 flex items-center justify-center' : 'h-full w-3 flex items-center justify-center',
              'shrink-0 z-10 bg-black/20',
            )}>
              {getTileIcon(tile.type, 8)}
            </div>
          )}

          {/* Tile content */}
          <div className="flex-1 flex flex-col items-center justify-center p-0.5 overflow-hidden z-10 gap-0.5">
            {/* Special tile icon (center) */}
            {isSpecial && (
              <div className={cn('mb-0.5', rotClass)}>
                {getTileIcon(tile.type, 9)}
              </div>
            )}

            <span className={cn(
              'font-space-grotesk text-[5.5px] text-center leading-tight uppercase font-bold transition-colors',
              rotClass,
              isOwnedByCurrent ? 'text-primary' : isSpecial ? 'text-white/70' : 'text-on-surface/80',
            )}>
              {tile.name}
            </span>

            {/* Price for unowned purchasable tiles */}
            {isPurchasable && tile.price > 0 && !owner && (
              <span className={cn('font-space-grotesk text-[5px] text-on-surface/40 font-bold', rotClass)}>
                ${tile.price}
              </span>
            )}

            {/* Tax amount */}
            {tile.type === 'TAX' && (
              <span className={cn('font-space-grotesk text-[5px] text-orange-400 font-bold', rotClass)}>
                Pay ${tile.price}
              </span>
            )}

            {/* Railroad / Utility rent hint */}
            {(tile.type === 'RAILROAD' || tile.type === 'UTILITY') && !owner && (
              <span className={cn('font-space-grotesk text-[4.5px] text-white/30', rotClass)}>
                {tile.type === 'RAILROAD' ? 'RAILROAD' : 'UTILITY'}
              </span>
            )}
          </div>

          {/* Shed/hotel indicators */}
          {isPurchasable && tile.sheds > 0 && (
            <div className={cn(
              'flex gap-px z-20 shrink-0',
              isHoriz ? 'flex-row' : 'flex-col',
            )}>
              {Array.from({ length: Math.min(tile.sheds, 4) }).map((_, idx) => (
                <div
                  key={idx}
                  className="w-1.5 h-1.5 bg-green-400 shadow-[0_0_3px_rgba(74,222,128,0.8)]"
                />
              ))}
              {tile.sheds >= 5 && (
                <div className="w-1.5 h-1.5 bg-red-500 shadow-[0_0_3px_rgba(239,68,68,0.8)]" />
              )}
            </div>
          )}

          {/* Ownership badge */}
          {owner && (
            <div
              className={cn(
                'absolute z-20 w-2 h-2 rounded-full border border-white/60 shadow-md',
                side === 'top' ? 'bottom-0.5' : side === 'bottom' ? 'top-0.5' : side === 'left' ? 'right-0.5' : 'left-0.5',
              )}
              style={{ backgroundColor: owner.color }}
              title={`Owned by ${owner.name}`}
            />
          )}

          {/* Mortgage overlay */}
          {tile.isMortgaged && (
            <div className="absolute inset-0 z-15 bg-black/50 flex items-center justify-center pointer-events-none">
              <span className={cn('font-space-grotesk text-[5px] text-red-400 font-black uppercase', rotClass)}>
                MORT
              </span>
            </div>
          )}

          {/* Player tokens — always centered inside the tile cell */}
          {playersOnTile.length > 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
              <div className="flex flex-wrap items-center justify-center gap-0.5 max-w-full max-h-full p-0.5">
                {playersOnTile.map((p, tokenIdx) => (
                  <motion.div
                    key={p.id}
                    layoutId={`token-${p.id}`}
                    layout
                    className={cn(
                      'rounded-full border-2 border-white shadow-[0_0_8px_rgba(0,0,0,0.9),0_0_4px_rgba(255,255,255,0.4)]',
                      playersOnTile.length === 1 ? 'w-4 h-4' : 'w-3 h-3',
                    )}
                    style={{ backgroundColor: p.color }}
                    animate={{ y: [0, -2, 0] }}
                    transition={{
                      y: { duration: 1.2, repeat: Infinity, delay: tokenIdx * 0.25, ease: 'easeInOut' },
                      layout: { type: 'spring', stiffness: 300, damping: 30 },
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      );

      tiles.push(
        <div
          key={index}
          style={gridPos}
          className={cn(
            'border border-outline-variant/10 relative overflow-hidden',
            isCurrentPlayerHere ? 'bg-surface-container-high' : 'bg-surface-container',
          )}
        >
          {content}
        </div>
      );
    }
    return tiles;
  };

  // ── Corner tile renderer ─────────────────────────────────────────────────────
  const renderCorner = (index: number) => {
    const tile = gameState.properties[index];
    const playersOnTile = getPlayersOnTile(index);
    const cfg = CORNER_CONFIG[index] ?? { label: tile.name, sublabel: '', bg: 'bg-surface-container', textColor: 'text-white', icon: null };

    let gridPos = {};
    if (index === 20) gridPos = { gridColumnStart: 1, gridRowStart: 1 };
    if (index === 30) gridPos = { gridColumnStart: 11, gridRowStart: 1 };
    if (index === 0)  gridPos = { gridColumnStart: 11, gridRowStart: 11 };
    if (index === 10) gridPos = { gridColumnStart: 1, gridRowStart: 11 };

    return (
      <div
        key={index}
        style={gridPos}
        className={cn(
          'border border-outline-variant/10 flex flex-col items-center justify-center text-center p-1 relative gap-0.5',
          cfg.bg,
        )}
      >
        {cfg.icon && <div className="mb-0.5">{cfg.icon}</div>}
        <span className={cn('font-space-grotesk text-[7px] font-black uppercase leading-tight', cfg.textColor)}>
          {cfg.label}
        </span>
        {cfg.sublabel && (
          <span className="font-space-grotesk text-[5.5px] text-white/40 uppercase leading-tight">
            {cfg.sublabel}
          </span>
        )}

        {/* Player tokens — centered inside corner */}
        {playersOnTile.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="flex flex-wrap items-center justify-center gap-1 max-w-full max-h-full p-1">
              {playersOnTile.map((p, tokenIdx) => (
                <motion.div
                  key={p.id}
                  layoutId={`token-${p.id}`}
                  layout
                  className={cn(
                    'rounded-full border-2 border-white shadow-[0_0_10px_rgba(0,0,0,0.9),0_0_6px_rgba(255,255,255,0.5)]',
                    playersOnTile.length === 1 ? 'w-5 h-5' : 'w-4 h-4',
                  )}
                  style={{ backgroundColor: p.color }}
                  animate={{ y: [0, -3, 0] }}
                  transition={{
                    y: { duration: 1.2, repeat: Infinity, delay: tokenIdx * 0.25, ease: 'easeInOut' },
                    layout: { type: 'spring', stiffness: 300, damping: 30 },
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Action panel ──────────────────────────────────────────────────────────────
  const renderActionPanel = () => {
    if (currentPlayer.inJail) {
      return (
        <div className="bg-surface-variant/80 backdrop-blur-md p-6 border border-error/30 shadow-[0_0_30px_rgba(225,19,34,0.2)] animate-in fade-in zoom-in duration-300">
          <p className="font-space-grotesk text-[10px] text-error uppercase tracking-[0.2em] mb-1 flex items-center gap-1">
            <Skull size={10} /> Trapped in the Void
          </p>
          <h3 className="font-newsreader text-xl font-bold uppercase text-white mb-4 italic">Escape Attempt</h3>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onJailAction?.('PAY')}
              disabled={currentPlayer.money < 50}
              className="w-full py-3 bg-error text-white font-space-grotesk text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              💸 Pay $50 to Leave
            </button>
            <button
              onClick={() => onJailAction?.('ROLL')}
              className="w-full py-3 bg-surface-container-highest text-white/80 font-space-grotesk text-xs font-black uppercase tracking-widest hover:text-white transition-all"
            >
              🎲 Try for Doubles
            </button>
          </div>
        </div>
      );
    }

    if (turnPhase === 'ACTION') {
      const isPurchasable = currentTile.type === 'PROPERTY' || currentTile.type === 'RAILROAD' || currentTile.type === 'UTILITY';
      const isUnowned = currentTile.ownerId === null;
      const isOwnedByOther = currentTile.ownerId !== null && currentTile.ownerId !== currentPlayer.id;

      return (
        <div className="bg-surface-variant/80 backdrop-blur-md p-5 border border-primary/30 shadow-[0_0_30px_rgba(225,19,34,0.2)] animate-in fade-in zoom-in duration-300">
          {/* Tile type badge */}
          <div className="flex items-center gap-2 mb-1">
            {getTileIcon(currentTile.type, 11)}
            <p className="font-space-grotesk text-[9px] text-primary/70 uppercase tracking-[0.2em]">
              {currentTile.type.replace('_', ' ')}
            </p>
          </div>

          <h3 className="font-newsreader text-lg font-bold uppercase text-white mb-3 italic leading-tight">
            {currentTile.name}
          </h3>

          {/* Show title deed for unowned purchasable tiles */}
          {isPurchasable && isUnowned && (
            <div className="mb-3 scale-90 origin-top">
              <TitleDeedCard property={currentTile as Property} owner={null} />
            </div>
          )}

          {/* Rent owed display */}
          {isPurchasable && isOwnedByOther && gameState.pendingRent && (
            <div className="mb-3 p-3 bg-red-900/30 border border-red-500/30 rounded">
              <p className="font-space-grotesk text-[9px] text-red-300 uppercase tracking-wider mb-1">
                Influence Cost Owed
              </p>
              <p className="font-newsreader text-2xl font-black text-red-400">
                ${gameState.pendingRent.amount}
              </p>
              <p className="font-space-grotesk text-[8px] text-white/40 mt-1">
                to {players.find(p => p.id === gameState.pendingRent?.ownerId)?.name}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {/* Pay rent button */}
            {gameState.pendingRent && (
              <button
                onClick={onPayRent}
                disabled={isRolling}
                className="w-full py-3 bg-red-600 text-white font-space-grotesk text-xs font-black uppercase tracking-widest hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2 border border-red-500/30 shadow-[0_0_15px_rgba(225,19,34,0.3)]"
              >
                <Wallet size={14} />
                Pay ${gameState.pendingRent.amount} Rent
              </button>
            )}

            {/* Reroll button */}
            {gameState.rerollsAvailable > 0 && !gameState.pendingRent && (
              <button
                onClick={onRerollDice}
                disabled={isRolling}
                className="w-full py-2.5 bg-tertiary/80 text-on-tertiary font-space-grotesk text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 border border-tertiary/30"
              >
                <Dice5 size={13} />
                Reroll ({gameState.rerollsAvailable} left)
              </button>
            )}

            {/* Buy / Pass for unowned properties */}
            {isPurchasable && isUnowned && !gameState.pendingRent && (
              <>
                <button
                  onClick={onBuyProperty}
                  disabled={currentPlayer.money < currentTile.price}
                  className="w-full py-3 bg-primary text-white font-space-grotesk text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <Landmark size={14} />
                  Secure Location (${currentTile.price})
                </button>
                <button
                  onClick={onAction}
                  className="w-full py-2.5 bg-surface-container-highest text-white/50 font-space-grotesk text-xs font-black uppercase tracking-widest hover:text-white/80 transition-all"
                >
                  Pass
                </button>
              </>
            )}

            {/* Own tile or non-purchasable — just resolve */}
            {(!isPurchasable || (isPurchasable && !isUnowned && !isOwnedByOther)) && !gameState.pendingRent && (
              <button
                onClick={onAction}
                className="w-full py-3 bg-primary text-white font-space-grotesk text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      );
    }

    if (turnPhase === 'END') {
      return (
        <button
          onClick={onEndTurn}
          className="w-full py-4 bg-tertiary text-on-tertiary font-space-grotesk text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(0,103,124,0.3)] hover:brightness-110 active:scale-95 transition-all animate-pulse"
        >
          End Turn →
        </button>
      );
    }

    return null;
  };

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="lg:ml-64 pt-24 pb-20 px-6 min-h-screen flex flex-col xl:flex-row gap-8 items-start justify-center">

      {/* ── Game Board ─────────────────────────────────────────────────────── */}
      <LayoutGroup>
      <div className="relative w-full max-w-[800px] aspect-square bg-surface-container-lowest border-4 border-outline-variant/20 shadow-[-10px_-10px_30px_rgba(225,19,34,0.05),10px_10px_30px_rgba(184,195,255,0.05)] grid grid-cols-11 grid-rows-11">

        {/* Center Area */}
        <div className="col-start-2 col-end-11 row-start-2 row-end-11 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-container/5 via-transparent to-tertiary-container/5 opacity-40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(225,19,34,0.1),transparent_70%)]" />

          {/* Dice display while rolling / action */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[110]">
            <AnimatePresence>
              {(isRolling || gameState.isSettling || turnPhase === 'ACTION') && (
                <div className="flex gap-12">
                  {dice.map((d, i) => (
                    <motion.div
                      key={`center-dice-${i}`}
                      initial={{ scale: 0, opacity: 0, x: i === 0 ? -200 : 200, y: 200, rotate: i === 0 ? -45 : 45 }}
                      animate={{ scale: 2, opacity: 1, x: 0, y: 0, rotate: 0 }}
                      exit={{ scale: 0, opacity: 0, y: -100, transition: { duration: 0.3 } }}
                      transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                    >
                      <div className={cn('w-12 h-12 flex items-center justify-center bg-surface-container-high border-2 border-primary text-2xl font-black', isRolling && 'animate-bounce')}>
                        {d}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          <h1 className="font-newsreader text-6xl italic font-black text-primary-container tracking-tighter drop-shadow-[0_0_15px_rgba(225,19,34,0.6)] z-10">
            STRANGER<br />THINGS
          </h1>
          <p className="font-space-grotesk text-xs tracking-[0.5em] text-tertiary mt-2 z-10 uppercase">
            HELLFIRE CLUB EDITION
          </p>

          {/* Action Controls */}
          <div className="mt-6 flex flex-col gap-3 w-full max-w-xs z-10">
            {renderActionPanel()}
          </div>
        </div>

        {/* Corners */}
        {renderCorner(20)}
        {renderCorner(30)}
        {renderCorner(0)}
        {renderCorner(10)}

        {/* Sides */}
        {renderSideTiles('top')}
        {renderSideTiles('right')}
        {renderSideTiles('bottom')}
        {renderSideTiles('left')}

        {/* DICE.jpg tap-to-roll overlay */}
        <div
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] flex flex-col items-center gap-6 transition-all duration-500',
            turnPhase === 'ROLL' && !isRolling
              ? 'scale-110 pointer-events-auto cursor-pointer'
              : 'scale-100 pointer-events-none opacity-0',
          )}
          onClick={() => { if (turnPhase === 'ROLL' && !isRolling) onRollDice(); }}
        >
          <div className="relative w-64 h-64 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3], filter: ['blur(20px)', 'blur(40px)', 'blur(20px)'] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 bg-red-600/30 rounded-full"
            />
            <motion.div
              animate={isRolling
                ? { rotate: [0, 10, -10, 10, -10, 0], scale: [1, 1.05, 0.95, 1.05, 1] }
                : { rotate: [0, 2, -2, 0], scale: 1 }}
              transition={isRolling
                ? { duration: 0.2, repeat: Infinity, ease: 'linear' }
                : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="relative z-10 w-full h-full drop-shadow-[0_0_30px_rgba(225,19,34,0.6)]"
            >
              <img
                src="/Public Folder/Dice/DICE.jpg"
                alt="Stranger Things Dice"
                className="w-full h-full object-contain rounded-3xl"
              />
              <AnimatePresence mode="wait">
                {!isRolling && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center gap-8 pointer-events-none"
                  >
                    {dice.map((d, i) => (
                      <div key={`functional-dice-${i}`} className="text-white font-newsreader font-black italic text-6xl drop-shadow-[0_0_15px_rgba(0,195,255,1)]">
                        {d}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className={cn(
              'px-8 py-3 rounded-full font-newsreader font-black italic text-xl uppercase tracking-widest transition-all duration-300',
              isRolling
                ? 'bg-red-600 text-white animate-pulse shadow-[0_0_30px_rgba(225,19,34,0.8)]'
                : 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)]',
            )}>
              {isRolling ? 'TRANSMITTING...' : 'TAP TO ROLL'}
            </div>
          </div>
        </div>
      </div>
      </LayoutGroup>

      {/* ── Title Deed Overlay ─────────────────────────────────────────────── */}
      {gameState.showingTitleDeed && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={onHideTitleDeed}
        >
          <div
            className={cn('relative animate-in zoom-in-95 slide-in-from-bottom-10 duration-500', getTitleDeedPosition(gameState.showingTitleDeed.position).className)}
            style={getTitleDeedPosition(gameState.showingTitleDeed.position).styles}
            onClick={e => e.stopPropagation()}
          >
            <TitleDeedCard
              property={gameState.showingTitleDeed}
              owner={gameState.players.find(p => p.id === gameState.showingTitleDeed!.ownerId) || null}
            />
            <button
              onClick={onHideTitleDeed}
              className="absolute -top-4 -right-4 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary transition-colors border-2 border-white/20"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Player Dashboard ───────────────────────────────────────────────── */}
      <aside className="w-full xl:w-96 flex flex-col gap-6">
        {/* Current player card */}
        <section className="bg-surface-container-high p-6 border border-outline-variant/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="flex items-center gap-4 mb-6 relative">
            <div
              className="w-12 h-12 rounded flex items-center justify-center text-white font-newsreader font-black text-xl italic shadow-[0_0_15px_rgba(0,0,0,0.3)]"
              style={{ backgroundColor: currentPlayer.color }}
            >
              {currentPlayer.name[0]}
            </div>
            <div>
              <h3 className="font-newsreader text-xl font-bold tracking-tight text-white uppercase">
                {currentPlayer.name}
              </h3>
              <p className="font-space-grotesk text-[10px] text-primary uppercase tracking-widest">
                {turnPhase === 'ROLL' ? '🎲 Your Turn' : turnPhase === 'ACTION' ? '⚡ Resolving...' : turnPhase === 'END' ? '✅ End Turn' : '⏳ Waiting'}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-end border-b border-outline-variant/20 pb-2">
              <span className="font-space-grotesk text-xs text-on-surface/60 uppercase">Bank Balance</span>
              <span className="font-newsreader text-3xl font-black text-primary">${currentPlayer.money}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-space-grotesk text-xs text-on-surface/70">Position</span>
              <div className="flex items-center gap-1">
                {getTileIcon(currentTile.type, 10)}
                <span className="font-space-grotesk text-xs font-bold uppercase">{currentTile.name}</span>
              </div>
            </div>
            {/* Jail status */}
            {currentPlayer.inJail && (
              <div className="flex items-center gap-2 p-2 bg-red-900/20 border border-red-500/20 rounded">
                <Skull size={12} className="text-red-400" />
                <span className="font-space-grotesk text-[10px] text-red-400 uppercase">
                  Trapped — Turn {currentPlayer.jailTurns}/3
                </span>
              </div>
            )}
          </div>
        </section>

        {/* All players summary */}
        <section className="bg-surface-container-high/40 p-4 border border-outline-variant/10">
          <h4 className="font-space-grotesk text-[10px] text-on-surface/40 uppercase tracking-widest mb-3">Players</h4>
          <div className="space-y-2">
            {players.map((p, idx) => {
              const pTile = properties[p.position];
              const isActive = idx === currentPlayerIndex;
              return (
                <div key={p.id} className={cn(
                  'flex items-center gap-3 p-2 transition-all',
                  isActive ? 'bg-surface-container-highest/80 border border-primary/20' : 'opacity-60',
                )}>
                  <div className="w-6 h-6 rounded-full border border-white/30 shrink-0" style={{ backgroundColor: p.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-space-grotesk text-[10px] font-bold uppercase text-white truncate">{p.name}</p>
                    <p className="font-space-grotesk text-[8px] text-white/40 truncate">{pTile.name}</p>
                  </div>
                  <span className="font-newsreader font-bold text-sm text-primary shrink-0">${p.money}</span>
                  {p.inJail && <Skull size={10} className="text-red-400 shrink-0" />}
                </div>
              );
            })}
          </div>
        </section>

        {/* Transmission log */}
        <section className="bg-surface-container-lowest/80 p-4 border border-outline-variant/10">
          <h4 className="font-space-grotesk text-[10px] text-on-surface/40 uppercase tracking-widest mb-3">
            Transmission Log
          </h4>
          <div className="space-y-1.5 h-52 overflow-y-auto pr-1 custom-scrollbar text-[11px] font-space-grotesk">
            {gameState.logs.length === 0 && (
              <p className="text-white/20 italic text-[10px] uppercase">No transmissions yet...</p>
            )}
            {gameState.logs.map(log => (
              <div
                key={log.id}
                className={cn(
                  'flex gap-2 p-1.5 border-l-2',
                  log.type === 'alert'  ? 'text-error border-error bg-error/5' :
                  log.type === 'action' ? 'text-tertiary border-tertiary bg-tertiary/5' :
                  log.type === 'dice'   ? 'text-yellow-400 border-yellow-500/40 bg-yellow-900/10' :
                  'text-on-surface/80 border-outline-variant/20',
                )}
              >
                <span className="opacity-40 shrink-0 text-[9px]">[{log.timestamp}]</span>
                <span className="uppercase leading-tight">{log.message}</span>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
};