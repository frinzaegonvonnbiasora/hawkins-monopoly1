import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Activity, Eye, Shield, Lock, Radio, LogOut, Bell, Settings, AlertTriangle, Zap, Terminal } from 'lucide-react';
import { cn } from '../lib/utils';

interface HawkinsLabDashboardProps {
  onLogout: () => void;
  agentId: string;
}

export const HawkinsLabDashboard: React.FC<HawkinsLabDashboardProps> = ({ onLogout, agentId }) => {
  const [activeTab, setActiveTab] = useState('SYSTEM STATUS');

  const sidebarItems = [
    { label: 'SYSTEM STATUS', icon: LayoutGrid },
    { label: 'VOID PULSE', icon: Radio },
    { label: 'ENTITY TRACKER', icon: Eye },
    { label: 'GATE INTEGRITY', icon: Shield },
    { label: 'TRANSMISSION', icon: Activity },
  ];

  return (
    <div className="fixed inset-0 z-[100000] bg-[#050505] flex overflow-hidden font-space-grotesk text-white">
      {/* Left Sidebar */}
      <aside className="w-64 h-full bg-black/40 border-r border-white/5 flex flex-col p-6 z-10 shadow-[20px_0_40px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col gap-1 mb-12">
          <div className="flex items-center gap-3 p-3 bg-primary/10 rounded border border-primary/20">
            <Shield size={20} className="text-primary" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-primary uppercase tracking-widest leading-none">SECTOR 4</span>
              <span className="text-[7px] text-primary/60 uppercase tracking-widest mt-1">Level 5 Clearance</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.label)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-4 font-space-grotesk text-[10px] font-bold uppercase tracking-[0.2em] transition-all group",
                activeTab === item.label 
                  ? "bg-primary text-white shadow-[0_0_20px_rgba(225,19,34,0.3)]" 
                  : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 space-y-6">
          <button className="w-full py-3 bg-primary text-white font-bold uppercase tracking-[0.2em] text-[10px] shadow-[0_0_20px_rgba(225,19,34,0.3)] hover:brightness-110 active:scale-95 transition-all">
            EMERGENCY OVERRIDE
          </button>
          <div className="space-y-4">
            <button className="flex items-center gap-3 text-white/30 hover:text-white transition-colors group">
              <Terminal size={14} />
              <span className="text-[9px] font-bold uppercase tracking-widest">SECURITY LOG</span>
            </button>
            <button onClick={onLogout} className="flex items-center gap-3 text-white/30 hover:text-primary transition-colors group">
              <LogOut size={14} />
              <span className="text-[9px] font-bold uppercase tracking-widest">LOGOUT</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full p-8 flex flex-col relative overflow-hidden">
        {/* Background CRT & Grain */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(225,19,34,0.05),transparent_80%)]" />
          <div className="crt-overlay" />
        </div>

        {/* Top Header */}
        <header className="flex items-center justify-between mb-12 relative z-10">
          <div className="flex items-center gap-12">
            <h1 className="font-newsreader text-2xl font-black italic text-primary tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(225,19,34,0.4)]">
              DOE HAWKINS LAB
            </h1>
            <nav className="hidden xl:flex items-center gap-8 text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">
              <a href="#" className="text-primary border-b border-primary pb-1">MONITORING</a>
              <a href="#" className="hover:text-white transition-colors">ACTIVITY</a>
              <a href="#" className="hover:text-white transition-colors">SECURE COMMS</a>
              <a href="#" className="hover:text-white transition-colors">ARCHIVES</a>
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <Bell size={18} className="text-white/40 hover:text-white transition-colors cursor-pointer" />
            <Settings size={18} className="text-white/40 hover:text-white transition-colors cursor-pointer" />
            <div className="flex items-center gap-3 pl-6 border-l border-white/10">
              <img src="https://i.pravatar.cc/150?u=brenner" className="w-8 h-8 rounded border border-white/20" alt="Avatar" />
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="flex-1 grid grid-cols-12 grid-rows-12 gap-6 relative z-10">
          {/* Main Monitor Area */}
          <div className="col-span-12 lg:col-span-8 row-span-7 bg-black/60 border border-white/5 p-8 flex flex-col relative overflow-hidden group shadow-[inset_0_0_50px_rgba(0,0,0,1)]">
             <div className="flex items-center justify-between mb-8">
               <div className="space-y-1">
                 <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em]">Hawkins Lab Internal Surveillance</p>
                 <h2 className="font-newsreader text-5xl font-black italic text-white tracking-tighter uppercase leading-none">
                   VOID <span className="text-primary drop-shadow-[0_0_20px_rgba(225,19,34,0.4)]">OS v1.9.84</span>
                 </h2>
               </div>
               <div className="text-right">
                 <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em] mb-1">SYSTEM TIME</p>
                 <p className="text-lg font-bold text-primary tabular-nums tracking-widest drop-shadow-[0_0_10px_#e11322]">03:42:18 LOCAL</p>
               </div>
             </div>

             <div className="flex-1 flex flex-col gap-12">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#fff]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">System Monitoring</span>
                </div>

                <div className="grid grid-cols-3 gap-8">
                  {['CPU_LOAD_MASTER', 'COOLANT_PSI', 'ENTITY_DETECTION_RADAR'].map((label, i) => (
                    <div key={label} className="space-y-4">
                      <p className="text-[8px] font-bold text-primary uppercase tracking-[0.3em]">{label}</p>
                      <div className="h-16 flex items-end gap-1">
                        {[...Array(6)].map((_, j) => (
                          <motion.div 
                            key={j}
                            animate={{ height: [10 + Math.random() * 50, 10 + Math.random() * 50] }}
                            transition={{ duration: 1, repeat: Infinity, delay: j * 0.1 }}
                            className={cn("flex-1", j > 3 ? "bg-primary" : "bg-primary/40")} 
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>

          {/* Right Status Panel */}
          <div className="col-span-12 lg:col-span-4 row-span-7 bg-black/40 border border-white/5 p-8 flex flex-col gap-8 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]">
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em]">GATE INTEGRITY STATUS</p>
            <div className="space-y-8">
               <div className="space-y-3">
                 <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                   <span className="text-white/60">Dimensional Seal</span>
                   <span className="text-white">14.2%</span>
                 </div>
                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                   <motion.div animate={{ width: '14.2%' }} className="h-full bg-primary shadow-[0_0_10px_#e11322]" />
                 </div>
               </div>
               <div className="space-y-3">
                 <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                   <span className="text-white/60">Radiation Leakage</span>
                   <span className="text-white">92.8%</span>
                 </div>
                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                   <motion.div animate={{ width: '92.8%' }} className="h-full bg-primary shadow-[0_0_10px_#e11322]" />
                 </div>
               </div>
            </div>

            <div className="mt-auto p-6 bg-primary/5 border border-primary/20 space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold uppercase text-[9px] tracking-widest">
                <AlertTriangle size={14} />
                WARNING: CRITICAL BREACH
              </div>
              <p className="text-[8px] text-primary/60 uppercase leading-relaxed tracking-widest">
                Rift expansion exceeding predictable parameters. Recommendation: IMMEDIATE EVACUATION OF LOWER LEVELS.
              </p>
            </div>
          </div>

          {/* Bottom Area: Entity Tracker & Logs */}
          <div className="col-span-12 lg:col-span-8 row-span-5 bg-black/60 border border-white/5 p-8 flex gap-8">
            <div className="w-1/3 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-primary uppercase tracking-[0.3em]">ENTITY TRACKER</p>
                  <p className="text-[11px] font-newsreader italic text-white/60 uppercase">Location: Hawkins High School</p>
                </div>
                <div className="px-2 py-1 bg-primary text-white text-[7px] font-black uppercase tracking-widest rounded-sm animate-pulse">
                  THREAT LEVEL: DELTA
                </div>
              </div>
              <div className="flex-1 bg-white/5 border border-white/10 relative overflow-hidden">
                 <div className="absolute top-1/2 left-1/3 w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_#e11322] animate-ping" />
                 <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-primary/40 rounded-full" />
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(225,19,34,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(225,19,34,0.05)_1px,transparent_1px)] [background-size:20px_20px]" />
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-6">
              <div className="flex items-center justify-between text-[9px] font-bold text-white/30 uppercase tracking-widest">
                <span>ENCRYPTED TRANSMISSION FEED</span>
                <span>CHANNEL: SEC-7-DELTA</span>
              </div>
              <div className="flex-1 space-y-3 font-mono text-[8px] uppercase tracking-widest overflow-y-auto pr-4 scrollbar-hide">
                {[
                  { time: '03:41:02', type: 'INCOMING', msg: 'R-I-G-H-T-H-E-R-E... C-A-N-Y-O-U-H-E-A-R-M-E...' },
                  { time: '03:41:15', type: 'SYSTEM', msg: 'DECRYPTION ERROR: NON-EUCLIDEAN CHARACTER SET DETECTED', error: true },
                  { time: '03:42:01', type: 'INCOMING', msg: 'THE GATE IS NOT CLOSED THE GATE IS NOT CLOSED THE GATE IS NOT CLOSED' },
                  { time: '03:42:10', type: 'OUTGOING', msg: 'ATTEMPTING TRACE... SIGNAL ORIGIN: UNKNOWN (AXIS-Z)' },
                  { time: '03:42:18', type: 'INCOMING', msg: 'ITSWATCHING', error: true },
                ].map((log, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-primary w-16">{log.time}</span>
                    <span className="text-white/40 w-16 italic">[{log.type}]</span>
                    <span className={cn(log.error ? "text-primary font-bold" : "text-white/80")}>{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Right: Oscillator */}
          <div className="col-span-12 lg:col-span-4 row-span-5 flex flex-col gap-6">
             <div className="flex-1 bg-black/60 border border-white/5 p-8 flex flex-col gap-4">
                <div className="flex items-center justify-between text-[9px] font-bold text-white/30 uppercase tracking-widest">
                  <span>VOID PULSE OSCILLOSCOPE</span>
                  <span>FREQ: 14.8HZ</span>
                </div>
                <div className="flex-1 bg-white/5 border border-white/10 relative overflow-hidden flex items-center justify-center">
                   <svg className="w-full h-full stroke-primary opacity-60" viewBox="0 0 400 200">
                     <path d="M0 100 Q 50 20 100 100 T 200 100 T 300 100 T 400 100" fill="none" strokeWidth="2">
                       <animate attributeName="d" values="M0 100 Q 50 20 100 100 T 200 100 T 300 100 T 400 100;M0 100 Q 50 180 100 100 T 200 100 T 300 100 T 400 100;M0 100 Q 50 20 100 100 T 200 100 T 300 100 T 400 100" dur="2s" repeatCount="indefinite" />
                     </path>
                   </svg>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 p-3 bg-white/5 rounded border border-white/10">
                    <p className="text-[7px] text-white/30 uppercase font-bold mb-1">MAX_PEAK</p>
                    <p className="text-lg font-bold tabular-nums">0.982 mG</p>
                  </div>
                  <div className="flex-1 p-3 bg-white/5 rounded border border-white/10">
                    <p className="text-[7px] text-white/30 uppercase font-bold mb-1">VAR_SHIFT</p>
                    <p className="text-lg font-bold tabular-nums">0.012 mG</p>
                  </div>
                </div>
             </div>
             
             <button className="w-full py-6 bg-primary text-white font-black uppercase tracking-[0.4em] text-xs shadow-[0_0_40px_rgba(225,19,34,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-4">
                <Zap size={18} />
                INITIATE LOCKDOWN
             </button>
          </div>
        </div>

        {/* System Footer Status */}
        <footer className="mt-12 flex items-center justify-between border-t border-white/5 pt-6 relative z-10">
          <div className="flex gap-12">
            <div className="space-y-1">
              <p className="text-[7px] text-white/20 uppercase tracking-widest font-bold">STATION ID</p>
              <p className="text-[10px] text-white/60 font-bold tracking-widest">DOE-HWK-LAB-04</p>
            </div>
            <div className="space-y-1">
              <p className="text-[7px] text-white/20 uppercase tracking-widest font-bold">OPERATOR</p>
              <p className="text-[10px] text-white/60 font-bold tracking-widest uppercase">BRENNER, M.</p>
            </div>
            <div className="space-y-1">
              <p className="text-[7px] text-white/20 uppercase tracking-widest font-bold">STATUS</p>
              <p className="text-[10px] text-primary font-bold tracking-widest uppercase animate-pulse">CONTAINMENT COMPROMISED</p>
            </div>
          </div>
          <p className="font-newsreader italic text-white/10 text-xl tracking-tighter">U.S. Department of Energy</p>
        </footer>
      </main>
    </div>
  );
};
