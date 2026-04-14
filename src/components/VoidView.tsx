import React from 'react';
import { ShieldAlert, MoveLeft, Info, Skull } from 'lucide-react';
import { cn } from '../lib/utils';
import { GameState } from '../types';

interface VoidViewProps {
  gameState: GameState;
}

export const VoidView: React.FC<VoidViewProps> = ({ gameState }) => {
  const playersInJail = gameState.players.filter(p => p.inJail);

  return (
    <main className="lg:ml-64 pt-20 h-screen relative flex items-center justify-center overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        <img 
          alt="The Upside Down Forest" 
          className="w-full h-full object-cover opacity-40 mix-blend-luminosity"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3YKvcQB4IgA_fs-LgFBFDwZ9JBQ4CXGJJdPwkdb5NjIPynjOfYG5sdjbk0oeMHgSvRJGpetuq6aOUuI6goO8v3iPrE-inxuZvk3iPBg-_xtYN5Lt4wBjr5H6muRqJEvmoBEOEogwpsRxGOjhDuDB97a585eX9imgxwQTf6Wlqx663BxZXp3v8GfbYmyFllwpA2yWGtrBZN9LxnB_a67NMMuUr4dsKaAh--z5n7dfGEz_KquR8D8QCEqJ6U4MN2pyCAnj974estsWn"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80"></div>
        <div className="absolute inset-0 void-bg opacity-60"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl px-8 flex flex-col lg:flex-row items-center gap-16">
        <div className="w-full lg:w-1/2 flex flex-col items-start gap-8">
          <div className="space-y-2">
            <span className="font-space-grotesk text-primary text-xs uppercase tracking-[0.4em] animate-pulse">System Breach Detected</span>
            <h1 className="font-newsreader text-6xl md:text-8xl font-black text-white leading-none italic uppercase tracking-tighter shadow-primary/20 drop-shadow-2xl">THE VOID</h1>
          </div>
          <p className="text-white/60 font-work-sans text-lg leading-relaxed max-w-md">
            The rift has stabilized. Those trapped within must roll doubles or pay the price in psychic energy to return to Hawkins.
          </p>
          
          <div className="w-full space-y-4">
            <h3 className="font-space-grotesk text-[10px] uppercase tracking-[0.3em] text-primary/60">Currently Trapped</h3>
            <div className="flex flex-wrap gap-4">
              {playersInJail.length === 0 ? (
                <p className="font-newsreader text-xl italic text-white/20 uppercase">The Void is currently empty...</p>
              ) : (
                playersInJail.map(p => (
                  <div key={p.id} className="flex items-center gap-3 bg-surface-container-high/40 backdrop-blur-md p-3 border border-primary/30 rounded shadow-[0_0_20px_rgba(225,19,34,0.2)]">
                    <div className="w-8 h-8 rounded-full border border-white/20" style={{ backgroundColor: p.color }}></div>
                    <div>
                      <p className="font-newsreader text-lg font-bold text-white uppercase italic leading-none">{p.name}</p>
                      <p className="font-space-grotesk text-[8px] text-primary uppercase tracking-widest mt-1">Turns Trapped: {p.jailTurns}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex justify-center perspective-1000">
          <div className="relative w-80 h-[480px] bg-surface-variant/80 backdrop-blur-2xl border-2 border-primary/40 rounded shadow-[0_0_60px_rgba(225,19,34,0.4)] transform rotate-2 hover:rotate-0 transition-transform duration-700 flex flex-col overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-tertiary/10"></div>
            <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-highest/50">
              <ShieldAlert size={16} className="text-primary animate-pulse" />
              <span className="font-space-grotesk text-[10px] uppercase tracking-[0.3em] text-white/60">Reality Distortion Field</span>
            </div>
            <div className="relative flex-1 p-8 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="w-full aspect-square bg-black/40 rounded flex items-center justify-center relative overflow-hidden">
                  <Skull size={64} className="text-primary/20 absolute z-0" />
                  <img 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuTDK45xavCu0wvoThDoJh_uIbt_iF2qyqr78Bw47wNtg9hacvARbMA6gpUvSnV31yB8TGeDB9pYgEDRouFfMhVuOzuKeptwUIu5kOxK04h5SXkeGoTOH9a6ydHSpdEiTeAj3bg0W8H83hALLJwS281oxkjojCY5IHYA9YbgAoFd1n88izCyIB1eS79HTbkxC-DUo1t2cJyxrvyqz1w3kVlRDFLJA6JnmaPRLYs1hQlTvUk0Hjtq6VpT9pmcMB-atj1v-cXwURCgJW" 
                    alt="Demogorgon" 
                    className="w-full h-full object-cover mix-blend-luminosity opacity-40 group-hover:opacity-60 transition-opacity z-10"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-20"></div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-newsreader text-3xl font-bold text-white leading-tight italic uppercase tracking-tighter">The Mind Flayer Watches.</h3>
                  <div className="h-1 w-16 bg-primary"></div>
                  <p className="font-work-sans text-sm text-white/50 leading-relaxed">
                    Every turn spent in the Void drains your psychic energy. Roll the dice to find your way back, or remain lost forever.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-outline-variant/10">
                <div className="flex items-center gap-3 text-primary">
                  <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
                  <span className="font-space-grotesk text-xs uppercase font-black tracking-widest">Signal Strength: Weak</span>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -z-10 w-80 h-[480px] bg-primary/10 border border-primary/20 rounded transform -rotate-3 translate-x-4 translate-y-2 blur-sm"></div>
        </div>
      </div>

      <div className="absolute bottom-12 right-12 flex flex-col items-end gap-2 text-primary/30 font-space-grotesk">
        <span className="text-[10px] tracking-widest uppercase">Void Coordinates</span>
        <span className="text-xs">??.??° N, ??.??° W</span>
      </div>
    </main>
  );
};
