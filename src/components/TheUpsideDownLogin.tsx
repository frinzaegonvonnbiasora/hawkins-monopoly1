import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Radio } from 'lucide-react';
import { cn } from '../lib/utils';

interface TheUpsideDownLoginProps {
  onSignIn: (id: string) => void;
  onBack: () => void;
}

export const TheUpsideDownLogin: React.FC<TheUpsideDownLoginProps> = ({ onSignIn, onBack }) => {
  const [agentId, setAgentId] = useState('');
  const [encryptionKey, setEncryptionKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignIn(agentId || 'AGENT_011');
  };

  return (
    <div className="fixed inset-0 z-[100000] bg-black flex items-center justify-center overflow-hidden font-space-grotesk">
      {/* Red Border Overlay for the whole screen if needed, but the image shows it around the card */}
      
      {/* Background with subtle dots */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(#e11322_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      {/* Main Login Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg p-12 bg-[#0a0a0a] border-2 border-primary shadow-[0_0_60px_rgba(225,19,34,0.2)]"
      >
        <div className="text-center mb-12">
          <h1 className="font-newsreader text-[80px] font-black italic text-primary tracking-tighter uppercase leading-[0.75] drop-shadow-[0_0_20px_rgba(225,19,34,0.6)]">
            HELLFIRE<br/>CLUB
          </h1>
          <p className="text-[10px] uppercase tracking-[0.5em] text-white/40 mt-10 font-bold">
            Dept of Energy Access Protocol
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="text-[9px] uppercase tracking-[0.2em] text-[#8e5a4e] font-bold">Terminal Identifier</label>
            <input 
              type="text" 
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="AGENT_ID_011"
              className="w-full bg-[#141414] border-b border-white/5 px-4 py-4 text-xs uppercase tracking-widest text-[#555] focus:outline-none focus:border-primary/40 transition-colors placeholder:text-[#222] font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] uppercase tracking-[0.2em] text-[#8e5a4e] font-bold">Encryption Key</label>
            <input 
              type="password" 
              value={encryptionKey}
              onChange={(e) => setEncryptionKey(e.target.value)}
              placeholder="********"
              className="w-full bg-[#141414] border-b border-white/5 px-4 py-4 text-xs tracking-widest text-[#555] focus:outline-none focus:border-primary/40 transition-colors placeholder:text-[#222] font-bold"
            />
          </div>

          <div className="pt-6">
            <button 
              type="submit"
              className="w-full py-5 bg-[#e11322] text-white font-black uppercase tracking-[0.2em] text-xl hover:brightness-110 active:scale-[0.99] transition-all shadow-[0_0_40px_rgba(225,19,34,0.4)]"
            >
              Sign In
            </button>
          </div>
        </form>

        <div className="mt-8 text-center space-y-4">
          <button 
            type="button"
            className="text-[10px] uppercase tracking-[0.2em] text-white/20 hover:text-white/40 transition-colors font-bold"
          >
            Forgot Password?
          </button>
          
          <div className="pt-8 flex flex-col items-center gap-2">
            <p className="text-[9px] uppercase tracking-widest text-white/10 font-bold">
              New in Hawkins?
            </p>
            <button 
              type="button"
              className="text-[#8e5a4e] text-[10px] uppercase tracking-widest font-black hover:brightness-125 transition-all"
            >
              Join the Hawkins Club
            </button>
          </div>
        </div>

        {/* System Status at the bottom of the card */}
        <div className="mt-8 flex justify-center">
          <div className="px-4 py-1.5 bg-white/[0.02] border border-white/5 rounded-full flex items-center gap-2">
            <Radio size={10} className="text-primary animate-pulse" />
            <span className="text-[8px] uppercase tracking-[0.2em] text-white/30 font-bold">Encrypted Link Active</span>
          </div>
        </div>
      </motion.div>

      {/* Back button for development/escape */}
      <button 
        onClick={onBack}
        className="fixed top-8 right-8 text-white/10 hover:text-white/40 transition-colors"
      >
        <Settings size={20} />
      </button>
    </div>
  );
};
