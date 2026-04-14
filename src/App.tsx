/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Map, Wallet, Store, History } from 'lucide-react';
import { Sidebar, TopBar } from './components/Navigation';
import { GameBoard } from './components/GameBoard';
import { PropertyCard } from './components/PropertyCard';
import { InventoryView } from './components/InventoryView';
import { VoidView } from './components/VoidView';
import { Screen } from './types';
import { cn } from './lib/utils';
import { useGameLogic } from './useGameLogic';
import { TheUpsideDownLogin } from './components/TheUpsideDownLogin';
import { HawkinsLabDashboard } from './components/HawkinsLabDashboard';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('BOARD');
  const [appState, setAppState] = useState<'LANDING' | 'LOGIN' | 'DASHBOARD' | 'GAME'>('LANDING');
  const [agentId, setAgentId] = useState('');
  
  const { gameState, setGameState, resetGame, rollDice, rerollDice, handleAction, buyProperty, upgradeProperty, mortgageProperty, handleJailAction, payRent, showTitleDeed, endTurn, hideTitleDeed } = useGameLogic();

  useEffect(() => {
    const handleShowLogin = () => {
      console.log("SHOW_LOGIN event received");
      setAppState('LOGIN');
    };
    window.addEventListener('SHOW_LOGIN', handleShowLogin);
    return () => window.removeEventListener('SHOW_LOGIN', handleShowLogin);
  }, []);

  if (appState === 'LANDING') {
    return <div id="react-is-waiting" style={{ display: 'none' }} />;
  }

  if (appState === 'LOGIN') {
    return <TheUpsideDownLogin onSignIn={(id) => {
      setAgentId(id);
      setAppState('DASHBOARD');
    }} onBack={() => window.location.reload()} />;
  }

  if (appState === 'DASHBOARD') {
    return <HawkinsLabDashboard agentId={agentId} onLogout={() => setAppState('LOGIN')} />;
  }

  if (gameState.isGameOver) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-surface-container-high p-12 border-4 border-primary shadow-[0_0_100px_rgba(225,19,34,0.3)] animate-in zoom-in duration-1000">
          <h1 className="font-newsreader text-6xl font-black italic text-primary mb-4 uppercase tracking-tighter">Game Over</h1>
          <p className="font-space-grotesk text-xs text-on-surface/40 uppercase tracking-[0.4em] mb-12">The Void has claimed its victims</p>
          
          <div className="mb-12">
            <p className="font-space-grotesk text-[10px] text-tertiary uppercase tracking-widest mb-2">Sole Survivor</p>
            <h2 className="font-newsreader text-4xl font-bold text-white uppercase italic">{gameState.winner?.name}</h2>
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-primary text-on-primary font-space-grotesk font-bold uppercase tracking-widest hover:brightness-110 transition-all"
          >
            Restart Transmission
          </button>
        </div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'BOARD':
        return (
          <GameBoard 
            gameState={gameState} 
            onRollDice={rollDice} 
            onRerollDice={rerollDice}
            onAction={handleAction} 
            onBuyProperty={buyProperty} 
            onPayRent={payRent}
            onShowTitleDeed={showTitleDeed}
            onEndTurn={endTurn} 
            onJailAction={handleJailAction}
            onHideTitleDeed={hideTitleDeed}
          />
        );
      case 'PROPERTIES':
        return <PropertyCard gameState={gameState} onUpgrade={upgradeProperty} onMortgage={mortgageProperty} onBuy={buyProperty} />;
      case 'INVENTORY':
        return <InventoryView gameState={gameState} />;
      case 'VOID':
        return <VoidView gameState={gameState} />;
      default:
        return <GameBoard gameState={gameState} onRollDice={rollDice} onRerollDice={rerollDice} onAction={handleAction} onBuyProperty={buyProperty} onEndTurn={endTurn} onHideTitleDeed={hideTitleDeed} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface selection:bg-primary-container selection:text-on-primary-container">
      <div className="crt-overlay" />
      <div className="grain-texture" />

      <TopBar activeScreen={activeScreen} onScreenChange={setActiveScreen} onShowLogin={() => setAppState('LOGIN')} />
      <Sidebar 
        activeScreen={activeScreen} 
        onScreenChange={setActiveScreen} 
        onRollDice={rollDice} 
        canRoll={gameState.turnPhase === 'ROLL' && !gameState.isRolling} 
        isRolling={gameState.isRolling}
      />

      {renderScreen()}

      {/* Bottom Nav Bar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface/90 backdrop-blur-md border-t border-outline-variant/30 shadow-[0_-4px_20px_rgba(147,0,15,0.15)]">
        <button 
          onClick={() => setActiveScreen('BOARD')}
          className={cn(
            "flex flex-col items-center justify-center rounded-md px-3 py-1 transition-all",
            activeScreen === 'BOARD' ? "bg-primary-container text-on-primary-container shadow-[0_0_10px_#e11322]" : "text-primary/50"
          )}
        >
          <Map size={20} />
          <span className="font-space-grotesk text-[10px] font-bold uppercase">Board</span>
        </button>
        <button 
          onClick={() => setActiveScreen('INVENTORY')}
          className={cn(
            "flex flex-col items-center justify-center rounded-md px-3 py-1 transition-all",
            activeScreen === 'INVENTORY' ? "bg-primary-container text-on-primary-container shadow-[0_0_10px_#e11322]" : "text-primary/50"
          )}
        >
          <Wallet size={20} />
          <span className="font-space-grotesk text-[10px] font-bold uppercase">Inv</span>
        </button>
        <button 
          onClick={() => setActiveScreen('PROPERTIES')}
          className={cn(
            "flex flex-col items-center justify-center rounded-md px-3 py-1 transition-all",
            activeScreen === 'PROPERTIES' ? "bg-primary-container text-on-primary-container shadow-[0_0_10px_#e11322]" : "text-primary/50"
          )}
        >
          <Store size={20} />
          <span className="font-space-grotesk text-[10px] font-bold uppercase">Props</span>
        </button>
        <button 
          onClick={() => setActiveScreen('VOID')}
          className={cn(
            "flex flex-col items-center justify-center rounded-md px-3 py-1 transition-all",
            activeScreen === 'VOID' ? "bg-primary-container text-on-primary-container shadow-[0_0_10px_#e11322]" : "text-primary/50"
          )}
        >
          <History size={20} />
          <span className="font-space-grotesk text-[10px] font-bold uppercase">Void</span>
        </button>
      </nav>
    </div>
  );
}
