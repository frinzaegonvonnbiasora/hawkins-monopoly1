import React from 'react';
import { Lock, Shield, Landmark, Zap, Train, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { GameState } from '../types';

interface PropertyCardProps {
  gameState: GameState;
  onUpgrade?: (propertyId: string) => void;
  onMortgage?: (propertyId: string) => void;
  onBuy?: () => void;
}

/** Human-readable upgrade tier label */
const upgradeTierLabel = (sheds: number): string => {
  if (sheds === 0) return 'No barricades';
  if (sheds <= 4)  return `${sheds} Barricade${sheds > 1 ? 's' : ''}`;
  if (sheds === 5) return 'Hawkins Lab';
  return 'Fortified Base';
};

/** Next upgrade label */
const nextUpgradeLabel = (sheds: number): string => {
  if (sheds === 0) return 'Build Barricade';
  if (sheds < 4)   return 'Add Barricade';
  if (sheds === 4) return 'Build Hawkins Lab';
  if (sheds === 5) return 'Fortify Base';
  return 'Maxed Out';
};

/** Next upgrade cost */
const nextUpgradeCost = (property: { sheds: number; shedCost?: number; labCost?: number }): number => {
  if (property.sheds < 4) return property.shedCost ?? 0;
  if (property.sheds === 4 || property.sheds === 5) return property.labCost ?? 0;
  return 0;
};

export const PropertyCard: React.FC<PropertyCardProps> = ({ gameState, onUpgrade, onMortgage, onBuy }) => {
  const ownedProperties = gameState.properties.filter(p => p.ownerId !== null);
  const unownedProperties = gameState.properties.filter(p => p.ownerId === null && (p.type === 'PROPERTY' || p.type === 'RAILROAD' || p.type === 'UTILITY'));
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const currentTile = gameState.properties[currentPlayer.position];

  // Group by type for cleaner display
  const playerProperties = ownedProperties.filter(p => p.ownerId === currentPlayer.id);
  const otherProperties  = ownedProperties.filter(p => p.ownerId !== currentPlayer.id);

  const isStandingOnUnowned = currentTile.ownerId === null && (currentTile.type === 'PROPERTY' || currentTile.type === 'RAILROAD' || currentTile.type === 'UTILITY');
  const canBuyCurrent = isStandingOnUnowned && currentPlayer.money >= currentTile.price && gameState.turnPhase === 'ACTION';

  return (
    <div className="lg:ml-64 pt-24 pb-20 px-6 min-h-screen bg-surface">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <header className="mb-10 flex justify-between items-end border-b border-outline-variant/20 pb-6">
          <div>
            <p className="font-space-grotesk text-primary text-[10px] tracking-[0.4em] uppercase mb-1">
              Hawkins Property Registry
            </p>
            <h2 className="font-newsreader text-4xl font-black italic text-white tracking-tighter uppercase">
              Location Control
            </h2>
          </div>
          <div className="text-right">
            <p className="font-space-grotesk text-[10px] text-on-surface/40 uppercase tracking-widest">Your Balance</p>
            <p className="font-newsreader text-3xl font-black text-primary">${currentPlayer.money}</p>
          </div>
        </header>

        {isStandingOnUnowned && (
          <section className="mb-12 p-6 bg-primary/10 border-2 border-primary/30 shadow-[0_0_30px_rgba(225,19,34,0.1)]">
            <h3 className="font-space-grotesk text-[11px] uppercase tracking-[0.3em] text-primary mb-5 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
              Current Location Opportunity
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-full md:w-64 p-4 bg-surface-container-high border border-outline-variant/20 shadow-xl">
                <div className="h-2 w-full mb-3" style={{ backgroundColor: currentTile.color || '#333' }} />
                <h4 className="font-newsreader text-xl font-black uppercase text-white italic mb-1">{currentTile.name}</h4>
                <p className="font-space-grotesk text-[9px] text-white/40 uppercase tracking-widest mb-4">Price: ${currentTile.price}</p>
                <button
                  onClick={onBuy}
                  disabled={!canBuyCurrent}
                  className="w-full py-3 bg-primary text-white font-space-grotesk text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  <Landmark size={14} />
                  {canBuyCurrent ? `Secure for $${currentTile.price}` : 'Insufficient Funds'}
                </button>
              </div>
              <div className="flex-1 space-y-4">
                <p className="font-newsreader text-lg italic text-white/60 leading-relaxed">
                  "You have landed on an unsecured location in Hawkins. Securing this location will increase your influence and allow you to build barricades against the Upside Down."
                </p>
                <div className="flex gap-4">
                  <div className="p-3 bg-surface-container-low border border-outline-variant/10 rounded flex-1 text-center">
                    <p className="font-space-grotesk text-[8px] text-white/30 uppercase mb-1">Base Income</p>
                    <p className="font-newsreader text-xl font-bold text-white">${currentTile.rent[0]}</p>
                  </div>
                  <div className="p-3 bg-surface-container-low border border-outline-variant/10 rounded flex-1 text-center">
                    <p className="font-space-grotesk text-[8px] text-white/30 uppercase mb-1">Max Income</p>
                    <p className="font-newsreader text-xl font-bold text-white">${currentTile.rent[currentTile.rent.length - 1]}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {ownedProperties.length === 0 && !isStandingOnUnowned ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-outline-variant/20">
            <Lock size={40} className="text-primary/20 mb-4" />
            <p className="font-newsreader text-xl italic text-on-surface/30 uppercase">
              No locations have been secured yet...
            </p>
          </div>
        ) : (
          <div className="space-y-12">

            {/* Current player's properties */}
            {playerProperties.length > 0 && (
              <section>
                <h3 className="font-space-grotesk text-[11px] uppercase tracking-[0.3em] text-primary mb-5 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Your Secured Locations ({playerProperties.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {playerProperties.map(property => {
                    const canUpgrade = !property.isMortgaged && property.sheds < 6 &&
                      currentPlayer.money >= nextUpgradeCost(property);
                    const canMortgage = property.sheds === 0 && !property.isMortgaged;
                    const canUnmortgage = property.isMortgaged &&
                      currentPlayer.money >= Math.ceil(property.mortgageValue * 1.1);
                    const currentRent = property.rent[Math.min(property.sheds, property.rent.length - 1)] ?? 0;

                    return (
                      <div
                        key={property.id}
                        className={cn(
                          'overflow-hidden border border-outline-variant/20 shadow-xl transition-all hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(225,19,34,0.2)] relative',
                          property.isMortgaged && 'opacity-70',
                        )}
                      >
                        {/* Color header */}
                        <div
                          className="h-2 w-full"
                          style={{ backgroundColor: property.color || '#333' }}
                        />

                        <div className="p-4 bg-surface-container-high">
                          {/* Title + group */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div>
                              {property.group && (
                                <span className="font-space-grotesk text-[8px] uppercase tracking-widest text-white/30 block mb-0.5">
                                  {property.group} GROUP
                                </span>
                              )}
                              <h3 className="font-newsreader text-lg font-black uppercase tracking-tight text-white italic leading-tight">
                                {property.name}
                              </h3>
                            </div>
                            {property.type === 'RAILROAD' && <Train size={18} className="text-white/50 shrink-0 mt-1" />}
                            {property.type === 'UTILITY'  && <Zap   size={18} className="text-yellow-400 shrink-0 mt-1" />}
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="p-2 bg-surface-container-lowest border border-outline-variant/10">
                              <p className="font-space-grotesk text-[8px] uppercase text-white/40">Influence Cost</p>
                              <p className="font-newsreader text-lg font-black text-primary italic">${currentRent}</p>
                            </div>
                            <div className="p-2 bg-surface-container-lowest border border-outline-variant/10">
                              <p className="font-space-grotesk text-[8px] uppercase text-white/40">Development</p>
                              <p className="font-space-grotesk text-[10px] font-bold text-white uppercase leading-tight mt-0.5">
                                {upgradeTierLabel(property.sheds)}
                              </p>
                            </div>
                          </div>

                          {/* Barricade pips */}
                          {property.type === 'PROPERTY' && (
                            <div className="flex gap-1 mb-3">
                              {Array.from({ length: 6 }).map((_, idx) => (
                                <div
                                  key={idx}
                                  className={cn(
                                    'flex-1 h-1.5 rounded-full transition-all',
                                    idx < property.sheds
                                      ? idx < 4 ? 'bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.6)]'
                                               : 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.6)]'
                                      : 'bg-white/10',
                                  )}
                                />
                              ))}
                            </div>
                          )}

                          {/* Rent progression */}
                          <div className="grid grid-cols-4 gap-1 mb-4">
                            {property.rent.slice(0, 7).map((r, i) => (
                              <div
                                key={i}
                                className={cn(
                                  'text-center p-1 text-[8px] font-space-grotesk rounded',
                                  i === property.sheds
                                    ? 'bg-primary text-white font-black'
                                    : 'bg-surface-container-lowest text-on-surface/50',
                                )}
                              >
                                <div className="opacity-60">
                                  {i === 0 ? 'Base' : i === 5 ? 'Lab' : i === 6 ? 'Fort' : `${i}B`}
                                </div>
                                <div className="font-bold">${r}</div>
                              </div>
                            ))}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            {property.type === 'PROPERTY' && (
                              <button
                                onClick={() => onUpgrade?.(property.id)}
                                disabled={!canUpgrade}
                                className="flex-1 py-2 bg-primary/80 text-white text-[9px] font-space-grotesk font-black uppercase tracking-widest hover:bg-primary active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                              >
                                <Shield size={10} />
                                {nextUpgradeLabel(property.sheds)}
                              </button>
                            )}
                            <button
                              onClick={() => onMortgage?.(property.id)}
                              disabled={property.isMortgaged ? !canUnmortgage : !canMortgage}
                              className="flex-1 py-2 bg-surface-container border border-outline-variant/30 text-[9px] font-space-grotesk font-bold uppercase tracking-widest text-on-surface/60 hover:border-primary hover:text-primary active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              {property.isMortgaged
                                ? `Unmortgage $${Math.ceil(property.mortgageValue * 1.1)}`
                                : `Mortgage $${property.mortgageValue}`}
                            </button>
                          </div>
                        </div>

                        {/* Mortgaged overlay */}
                        {property.isMortgaged && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10 pointer-events-none">
                            <div className="bg-error text-white px-4 py-2 font-space-grotesk font-black uppercase tracking-widest text-xs -rotate-12 shadow-lg border border-white/20">
                              Mortgaged
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Other players' properties */}
            {otherProperties.length > 0 && (
              <section>
                <h3 className="font-space-grotesk text-[11px] uppercase tracking-[0.3em] text-on-surface/40 mb-5 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                  Other Players' Locations ({otherProperties.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {otherProperties.map(property => {
                    const ownerPlayer = gameState.players.find(p => p.id === property.ownerId);
                    const currentRent = property.rent[Math.min(property.sheds, property.rent.length - 1)] ?? 0;
                    return (
                      <div
                        key={property.id}
                        className="bg-surface-container-low border border-outline-variant/10 overflow-hidden opacity-70 hover:opacity-90 transition-opacity"
                        style={{ borderBottomColor: property.color || '#333', borderBottomWidth: 3 }}
                      >
                        <div className="p-2 text-center min-h-[48px] flex items-center justify-center border-b border-outline-variant/10">
                          <p className="font-newsreader text-xs font-bold uppercase leading-tight italic text-white">
                            {property.name}
                          </p>
                        </div>
                        <div className="p-2 text-center">
                          <p className="font-space-grotesk text-[8px] text-white/30 uppercase">Cost</p>
                          <p className="font-newsreader text-sm font-black italic text-white">${currentRent}</p>
                        </div>
                        {ownerPlayer && (
                          <div className="px-2 pb-2 flex items-center justify-center gap-1">
                            <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: ownerPlayer.color }} />
                            <span className="font-space-grotesk text-[7px] text-white/40 uppercase truncate">
                              {ownerPlayer.name}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Unowned properties section */}
            {unownedProperties.length > 0 && (
              <section className="pt-8 border-t border-outline-variant/10">
                <h3 className="font-space-grotesk text-[11px] uppercase tracking-[0.3em] text-white/30 mb-5 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white/10" />
                  Available Hawkins Locations ({unownedProperties.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {unownedProperties.map(property => (
                    <div
                      key={property.id}
                      className="bg-surface-container-low border border-outline-variant/10 overflow-hidden opacity-50 hover:opacity-100 transition-opacity"
                      style={{ borderBottomColor: property.color || '#333', borderBottomWidth: 3 }}
                    >
                      <div className="p-2 text-center min-h-[48px] flex items-center justify-center border-b border-outline-variant/10">
                        <p className="font-newsreader text-[10px] font-bold uppercase leading-tight italic text-white/60">
                          {property.name}
                        </p>
                      </div>
                      <div className="p-2 text-center">
                        <p className="font-space-grotesk text-[7px] text-white/20 uppercase">Secure Cost</p>
                        <p className="font-newsreader text-xs font-black italic text-white/60">${property.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};