import React from 'react';
import { LayoutGrid, Package, Receipt, Home, Settings, HelpCircle, User, Dice5, LogIn } from 'lucide-react';
import { Screen } from '../types';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
  onRollDice: () => void;
  canRoll: boolean;
  isRolling: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeScreen, onScreenChange, onRollDice, canRoll, isRolling }) => {
  const navItems = [
    { id: 'BOARD' as Screen, label: 'Game Board', icon: LayoutGrid },
    { id: 'INVENTORY' as Screen, label: 'Inventory', icon: Package },
    { id: 'PROPERTIES' as Screen, label: 'Properties', icon: Receipt },
    { id: 'VOID' as Screen, label: 'The Void', icon: Home },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full z-40 flex flex-col pt-24 w-64 bg-surface-container-lowest border-r border-outline-variant/10 shadow-[10px_0_30px_rgba(0,0,0,0.8)] hidden lg:flex">
      <div className="px-6 mb-8">
        <h2 className="font-newsreader text-primary-container text-xl font-bold tracking-tighter italic">STRANGER THINGS</h2>
        <p className="font-space-grotesk text-[10px] uppercase tracking-[0.2em] text-primary/40">MONOPOLY EDITION</p>
      </div>
      
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onScreenChange(item.id)}
            className={cn(
              "w-full flex items-center gap-4 px-6 py-4 font-space-grotesk text-sm uppercase tracking-widest transition-all",
              activeScreen === item.id 
                ? "bg-primary-container text-on-primary-container border-r-4 border-primary" 
                : "text-primary/40 hover:text-primary hover:bg-surface-container-low"
            )}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-6 mt-auto">
        <button 
          onClick={onRollDice}
          disabled={!canRoll || isRolling}
          className={cn(
            "w-full flex items-center justify-center gap-3 py-4 font-space-grotesk text-xs font-black uppercase tracking-widest transition-all group relative overflow-hidden",
            canRoll && !isRolling
              ? "bg-primary text-white shadow-[inset_0_0_10px_rgba(255,179,172,0.3)] hover:brightness-110 active:scale-95"
              : "bg-surface-container-high text-primary/20 cursor-not-allowed opacity-50 grayscale"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <Dice5 size={18} className={cn("transition-transform duration-500", isRolling && "animate-spin")} />
          <span>{isRolling ? 'Rolling...' : 'Roll the Dice'}</span>
        </button>
      </div>
    </aside>
  );
};

interface TopBarProps {
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
  onShowLogin: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ activeScreen, onScreenChange, onShowLogin }) => {
  return (
    <header className="fixed top-0 left-0 w-full h-20 z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant/10 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="lg:hidden">
          <h2 className="font-newsreader text-primary text-xl font-bold tracking-tighter italic leading-none">HAWKINS</h2>
          <p className="font-space-grotesk text-[8px] uppercase tracking-[0.2em] text-primary/40">MONOPOLY</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={onShowLogin}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-space-grotesk text-[10px] font-black uppercase tracking-[0.2em] hover:brightness-110 transition-all shadow-[0_0_15px_rgba(225,19,34,0.4)]"
        >
          <LogIn size={14} />
          Login
        </button>
      </div>
    </header>
  );
};





