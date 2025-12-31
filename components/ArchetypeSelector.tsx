import React from 'react';
import { useStore } from '../store';
import { Archetype } from '../types';
import { Shield, Brain, Swords, User, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const classes: { id: Archetype; title: string; desc: string; icon: React.ReactNode }[] = [
  { 
    id: 'STRATEGIST', 
    title: 'STRATEGIST', 
    desc: 'Mastery of theory. +15% Efficiency on Theory Annexation.', 
    icon: <Brain size={32} /> 
  },
  { 
    id: 'VANGUARD', 
    title: 'VANGUARD', 
    desc: 'Mastery of application. +15% Efficiency on Combat tiers.', 
    icon: <Swords size={32} /> 
  },
  { 
    id: 'SENTINEL', 
    title: 'SENTINEL', 
    desc: 'The disciplined wall. 50% reduced penalty on failure.', 
    icon: <Shield size={32} /> 
  },
  { 
    id: 'OPERATIVE', 
    title: 'OPERATIVE', 
    desc: 'The baseline. Pure grind. No external dependencies.', 
    icon: <User size={32} /> 
  },
];

export const ArchetypeSelector: React.FC = () => {
  const setArchetype = useStore((state) => state.setArchetype);

  return (
    <div className="min-h-screen bg-black text-[#00f7ff] p-6 flex flex-col justify-center items-center">
      <h1 className="text-2xl font-bold tracking-[0.2em] mb-2 text-center">INITIALIZE PROTOCOL</h1>
      <p className="text-xs text-gray-500 mb-8 font-mono">SELECT YOUR COMBAT SPECIALIZATION</p>
      
      <div className="mb-6 p-3 border border-red-500/50 bg-red-900/10 flex items-start gap-3 max-w-md">
        <AlertTriangle className="text-red-500 shrink-0" size={16} />
        <p className="text-[10px] text-red-400 leading-tight">
            SAFETY WARNING: This interface uses rapid flashing patterns (glitch effects) and high-contrast pulsing lights. 
            User discretion is advised for those with photosensitive conditions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 w-full max-w-md">
        {classes.map((c) => (
          <motion.button
            key={c.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => setArchetype(c.id)}
            className="border border-[#00f7ff]/30 p-6 flex items-center gap-4 bg-[#00f7ff]/5 hover:bg-[#00f7ff]/10 hover:border-[#00f7ff] transition-all text-left group relative overflow-hidden"
          >
            <div className="text-[#00f7ff] group-hover:scale-110 transition-transform">{c.icon}</div>
            <div>
              <h3 className="text-lg font-bold">{c.title}</h3>
              <p className="text-xs text-gray-400 mt-1">{c.desc}</p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00f7ff]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </motion.button>
        ))}
      </div>
    </div>
  );
};