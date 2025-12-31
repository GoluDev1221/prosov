
import React from 'react';
import { useStore } from '../store';
import { Chapter, TierType } from '../types';
import { TIER_CONFIG } from '../constants';
import { Lock, Check, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { InfoTooltip } from './InfoTooltip';

export const Intel: React.FC = () => {
  const { syllabus, completeTier, netWorth } = useStore();
  const [selectedChapter, setSelectedChapter] = React.useState<string | null>(null);

  const activeChapter = syllabus.find(c => c.id === selectedChapter);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center">
             <h2 className="text-lg font-bold tracking-widest text-[#00f7ff]">SECTOR MAP</h2>
             <InfoTooltip text="Each Hex is a chapter. Click to annex. Gold hexes are decaying and need revision." />
        </div>
        <span className="text-xs text-gray-500">{syllabus.filter(c => c.tiers.every(t => t.completed)).length}/{syllabus.length} ANNEXED</span>
      </div>

      {/* Hex Grid Layout */}
      <div className="flex flex-wrap gap-4 justify-center pb-20 overflow-y-auto">
        {syllabus.map((chapter) => (
          <div 
            key={chapter.id} 
            onClick={() => setSelectedChapter(chapter.id)}
            className="relative w-24 h-28 cursor-pointer group"
          >
             {/* Hexagon Shape CSS */}
            <div className={`
              absolute inset-0 hex-clip transition-all duration-300
              ${chapter.isDecayed ? 'bg-[#c4a000]' : 'bg-[#111]'}
              ${selectedChapter === chapter.id ? 'bg-[#00f7ff] text-black' : 'border-2 border-[#333] hover:border-[#00f7ff]'}
            `}>
                <div className="absolute inset-[2px] bg-black hex-clip flex flex-col items-center justify-center p-2 text-center">
                    <span className={`text-[9px] font-bold ${chapter.isDecayed ? 'text-[#c4a000]' : 'text-gray-300'}`}>
                        {chapter.id.toUpperCase()}
                    </span>
                    <span className="text-[8px] leading-tight mt-1 text-gray-500">
                        {chapter.name.substring(0, 10)}..
                    </span>
                    {chapter.isDecayed && <AlertTriangle size={12} className="text-[#c4a000] mt-1" />}
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Panel Modal */}
      {activeChapter && (
        <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-20 left-4 right-4 bg-black border border-[#00f7ff] p-4 z-30 shadow-[0_0_30px_rgba(0,0,0,0.9)]"
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-[#00f7ff] font-bold uppercase">{activeChapter.name}</h3>
                    <p className="text-[10px] text-gray-400">{activeChapter.subject} // DIFF: {activeChapter.difficulty}</p>
                </div>
                <button onClick={() => setSelectedChapter(null)} className="text-gray-500 hover:text-white">X</button>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {activeChapter.tiers.map((tier) => {
                    const config = TIER_CONFIG[tier.id as TierType];
                    const canAfford = netWorth >= config.baseValue;
                    
                    return (
                        <button
                            key={tier.id}
                            disabled={tier.completed || !canAfford}
                            onClick={() => completeTier(activeChapter.id, tier.id as TierType)}
                            className={`
                                flex flex-col items-center justify-center p-2 border text-xs h-20
                                ${tier.completed ? 'bg-[#00f7ff]/20 border-[#00f7ff] text-[#00f7ff]' : 'bg-transparent border-gray-800 text-gray-500'}
                                ${!tier.completed && canAfford ? 'hover:border-white hover:text-white' : ''}
                                ${!tier.completed && !canAfford ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            {tier.completed ? <Check size={16} /> : <span className="font-bold">{tier.id}</span>}
                            <span className="mt-1 text-[9px]">{config.label}</span>
                            {!tier.completed && <span className="text-[9px] mt-1">${config.baseValue}</span>}
                        </button>
                    )
                })}
            </div>
        </motion.div>
      )}
    </div>
  );
};
