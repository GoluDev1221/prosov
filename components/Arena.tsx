import React, { useState } from 'react';
import { Swords, Users, Globe, Loader2 } from 'lucide-react';
import { useStore } from '../store';

export const Arena: React.FC = () => {
  const { activeUsers, netWorth, startMining } = useStore();
  const [matchStatus, setMatchStatus] = useState<'IDLE' | 'SEARCHING' | 'FOUND'>('IDLE');
  const [opponent, setOpponent] = useState<string | null>(null);

  const handleFindOpponent = () => {
      setMatchStatus('SEARCHING');
      
      // Simulate matchmaking delay
      setTimeout(() => {
          const randomId = Math.floor(Math.random() * 999);
          setOpponent(`AGENT_${randomId}`);
          setMatchStatus('FOUND');
          
          // Auto-start duel after brief pause
          setTimeout(() => {
              startMining('DUEL');
          }, 2000);
      }, 3000);
  };

  return (
    <div className="flex flex-col h-full">
        <div className="mb-6 flex justify-between items-end border-b border-gray-800 pb-2">
            <div>
                <h2 className="text-xl font-bold text-[#00f7ff]">THE ARENA</h2>
                <p className="text-xs text-gray-500">WILLPOWER WAGERING SYSTEM</p>
            </div>
            <div className="text-right">
                <div className="flex items-center gap-2 text-xs text-[#00f7ff]">
                    <Globe size={12} />
                    <span>GLOBAL</span>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#111] p-4 border border-gray-800 flex items-center gap-4">
                <Users className="text-[#00f7ff]" size={24} />
                <div>
                    <div className="text-2xl font-bold text-white">{activeUsers}</div>
                    <div className="text-[10px] text-gray-500">AGENTS ONLINE</div>
                </div>
            </div>
            <div className="bg-[#111] p-4 border border-gray-800 flex items-center gap-4">
                <Swords className="text-red-500" size={24} />
                <div>
                    <div className="text-2xl font-bold text-white">42</div>
                    <div className="text-[10px] text-gray-500">ACTIVE DUELS</div>
                </div>
            </div>
        </div>

        <div className="flex-1 bg-black/50 border border-gray-800 p-4 relative overflow-hidden flex flex-col items-center justify-center">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
             
             {matchStatus === 'IDLE' && (
                 <>
                    <Swords size={64} className="text-[#00f7ff] opacity-20 mb-6" />
                    
                    <h3 className="text-lg font-bold mb-2">ENTER THE GAUNTLET</h3>
                    <p className="text-center text-xs text-gray-500 max-w-xs mb-8">
                        Stake your Net Worth against a random opponent. The first to break focus loses their stake.
                    </p>

                    <button 
                        onClick={handleFindOpponent}
                        disabled={netWorth < 500}
                        className="group relative px-8 py-3 bg-[#00f7ff]/10 border border-[#00f7ff] text-[#00f7ff] font-bold tracking-widest hover:bg-[#00f7ff] hover:text-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            FIND OPPONENT <span className="text-[10px] opacity-70">($500 WAGER)</span>
                        </span>
                        <div className="absolute inset-0 bg-[#00f7ff] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                    </button>
                    
                    {netWorth < 500 && (
                        <p className="mt-4 text-[10px] text-red-500">INSUFFICIENT FUNDS FOR WAGER</p>
                    )}
                 </>
             )}

             {matchStatus === 'SEARCHING' && (
                 <div className="flex flex-col items-center">
                     <Loader2 size={48} className="text-[#00f7ff] animate-spin mb-4" />
                     <p className="text-[#00f7ff] tracking-widest text-xs animate-pulse">SCANNING NETWORK...</p>
                 </div>
             )}

             {matchStatus === 'FOUND' && (
                 <div className="flex flex-col items-center">
                     <h3 className="text-2xl font-black text-red-500 mb-2">MATCH FOUND</h3>
                     <p className="text-white mb-8">VS {opponent}</p>
                     <p className="text-xs text-gray-500">INITIALIZING LINK...</p>
                 </div>
             )}
        </div>
    </div>
  );
};