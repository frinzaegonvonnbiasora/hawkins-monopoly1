import React from 'react';
import { Landmark, Receipt, PlusCircle, Home, Star, Info, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { GameState } from '../types';

interface InventoryViewProps {
  gameState: GameState;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ gameState }) => {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const ownedProperties = gameState.properties.filter(p => p.ownerId === currentPlayer.id);
  const mortgagedCount = ownedProperties.filter(p => p.isMortgaged).length;

  return (
    <main className="lg:ml-64 pt-24 pb-20 px-6 min-h-screen bg-surface selection:bg-primary-container selection:text-on-primary-container">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-outline-variant/20 pb-4">
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded flex items-center justify-center text-on-primary-container shadow-[0_0_20px_rgba(0,0,0,0.5)]"
              style={{ backgroundColor: currentPlayer.color }}
            >
              <User size={32} />
            </div>
            <div>
              <span className="font-space-grotesk text-primary text-[10px] tracking-[0.4em] uppercase">Status Report // Subject: {currentPlayer.name}</span>
              <h1 className="font-newsreader text-5xl font-extrabold uppercase tracking-tighter text-white italic">Player Dashboard</h1>
            </div>
          </div>
          <div className="flex gap-2 text-right">
            <div className="px-4 py-1 bg-surface-container-high border-l-4 border-primary">
              <p className="font-space-grotesk text-[10px] text-primary/60 uppercase">Net Worth</p>
              <p className="font-newsreader text-2xl font-bold tracking-widest">${currentPlayer.money + ownedProperties.reduce((acc, p) => acc + p.price, 0)}</p>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Bankroll Section */}
          <section className="lg:col-span-4 bg-surface-container-high/60 backdrop-blur-xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[320px] border border-outline-variant/20">
            <div className="absolute top-0 right-0 p-4">
              <Landmark size={96} className="text-primary/20" />
            </div>
            <div>
              <h3 className="font-space-grotesk text-xs tracking-widest uppercase text-primary mb-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                Bankroll Status
              </h3>
              <div className="space-y-1">
                <span className="font-newsreader text-6xl font-black text-white tracking-tighter italic">${currentPlayer.money}</span>
                <p className="font-space-grotesk text-xs text-primary/40 uppercase tracking-widest">Available Liquidity</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="p-3 bg-surface-container-lowest border border-outline-variant/10 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <Receipt size={14} className="text-tertiary" />
                  <span className="font-space-grotesk text-[10px] uppercase text-white/60">Cash</span>
                </div>
                <p className="font-newsreader text-xl font-bold italic">${Math.floor(currentPlayer.money * 0.8)}</p>
              </div>
              <div className="p-3 bg-surface-container-lowest border border-outline-variant/10 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <Star size={14} className="text-primary" />
                  <span className="font-space-grotesk text-[10px] uppercase text-white/60">Eggo Coupons</span>
                </div>
                <p className="font-newsreader text-xl font-bold italic">${Math.floor(currentPlayer.money * 0.2)}</p>
              </div>
            </div>
          </section>

          {/* Inventory Section */}
          <section className="lg:col-span-8 bg-surface-container-high/60 backdrop-blur-xl p-6 border border-outline-variant/20">
            <h3 className="font-space-grotesk text-xs tracking-widest uppercase text-primary mb-6">Equipment & Items</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {currentPlayer.inventory.map(item => (
                <div key={item.id} className="group relative aspect-square bg-surface-container-high flex flex-col items-center justify-center p-4 rounded hover:bg-surface-container-highest transition-all border border-transparent hover:border-primary/20">
                  <div className="w-24 h-24 mb-4 grayscale contrast-125 brightness-90 group-hover:brightness-110 transition-all">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="font-newsreader text-lg font-bold uppercase tracking-widest italic">{item.name}</span>
                  <span className="font-space-grotesk text-[10px] text-primary/60 mt-1 uppercase">{item.type}</span>
                  <div className={cn(
                    "absolute bottom-2 right-2 px-2 py-0.5 text-[8px] font-space-grotesk font-bold uppercase",
                    item.status === 'Ready' ? "bg-primary-container text-on-primary-container" : "bg-surface-container-highest text-white/40"
                  )}>
                    {item.status}
                  </div>
                </div>
              ))}
              {currentPlayer.inventory.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-on-surface/20 border-2 border-dashed border-outline-variant/20">
                  <p className="font-newsreader text-xl italic uppercase">Inventory Empty</p>
                </div>
              )}
            </div>
          </section>

          {/* Properties Section */}
          <section className="lg:col-span-12 bg-surface-container-high/60 backdrop-blur-xl p-6 border border-outline-variant/20">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-space-grotesk text-xs tracking-widest uppercase text-primary flex items-center gap-2">
                <Receipt size={16} />
                Managed Properties
              </h3>
              <div className="flex gap-4 font-space-grotesk text-[10px] uppercase text-primary/40">
                <span>Total Assets: {ownedProperties.length}</span>
                <span>Mortgaged: {mortgagedCount}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {ownedProperties.map(p => (
                <div key={p.id} className="flex flex-col bg-surface-container-low border-b-4 overflow-hidden group hover:bg-surface-container-high transition-colors" style={{ borderBottomColor: p.color || '#333' }}>
                  <div className="p-3 text-center border-b border-outline-variant/10 min-h-[60px] flex items-center justify-center">
                    <p className="font-newsreader text-sm font-bold uppercase tracking-tighter leading-tight italic">{p.name}</p>
                  </div>
                  <div className={cn("p-4 flex flex-col items-center justify-center flex-1", p.isMortgaged && "opacity-50 grayscale")}>
                    <p className="font-space-grotesk text-[10px] text-white/40 mb-1 uppercase">Rent</p>
                    <p className="font-newsreader text-xl font-black italic">${p.rent[p.sheds]}</p>
                  </div>
                  {p.isMortgaged ? (
                    <div className="px-2 py-1 bg-primary-container/20 text-primary-container text-center">
                      <p className="font-space-grotesk text-[8px] font-bold uppercase">Mortgaged</p>
                    </div>
                  ) : (
                    <div className="px-2 py-1 bg-black/40 flex justify-center gap-1">
                      {Array.from({ length: p.sheds || 0 }).map((_, i) => (
                        <Home key={i} size={12} className="text-primary" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {ownedProperties.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-on-surface/20 border-2 border-dashed border-outline-variant/20">
                  <p className="font-newsreader text-xl italic uppercase">No Properties Owned</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};
