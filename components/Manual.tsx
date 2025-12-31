
import React from 'react';
import { useStore } from '../store';
import { X, Shield, Swords, Map, Activity } from 'lucide-react';

export const Manual: React.FC = () => {
  const { toggleManual } = useStore();

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-[#111] border border-[#00f7ff] w-full max-w-2xl max-h-[80vh] overflow-y-auto custom-scrollbar flex flex-col relative shadow-[0_0_50px_rgba(0,247,255,0.1)]">
        
        <button onClick={toggleManual} className="absolute top-4 right-4 text-gray-500 hover:text-white">
          <X size={24} />
        </button>

        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-black text-[#00f7ff] tracking-[0.2em]">OPERATOR HANDBOOK</h2>
          <p className="text-xs text-gray-500 mt-1">FIELD MANUAL V4.0 // CLASSIFIED</p>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Section 1 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <Activity size={18} className="text-[#00f7ff]" />
              <h3>1. EXTRACTION PROTOCOL</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your primary objective is to accumulate Net Worth ($NW). This is done by initiating the 
              <span className="text-white"> MINING RIG</span>. 
              <br/><br/>
              The system tracks your focus. 
              <span className="text-red-500"> DO NOT</span> switch tabs. 
              <span className="text-red-500"> DO NOT</span> minimize the browser. 
              Failure results in a wealth penalty.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <Map size={18} className="text-[#00f7ff]" />
              <h3>2. TERRITORIAL ANNEXATION</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Spend $NW to capture Hexes (Chapters) in the <span className="text-white">INTEL</span> matrix. 
              Annexation is tiered: start with L (Lecture) and grind to TS (Teacher Sheet).
              <br/><br/>
              <span className="text-yellow-500">WARNING:</span> Territories decay after 14 days of inactivity. Revise to maintain income streams.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <Swords size={18} className="text-[#00f7ff]" />
              <h3>3. PVP & SYNDICATES</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Enter <span className="text-white">THE ARENA</span> to wager $NW against other operatives. 
              Join a <span className="text-white">SYNDICATE</span> to pool wealth and unlock rank-based buffs.
              Syndicate Commanders hold the power to promote or exile.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <Shield size={18} className="text-[#00f7ff]" />
              <h3>4. SURVIVAL</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              The Global War Ticker shows real-time actions of other agents. 
              Use the <span className="text-white">BLACK MARKET</span> for advantages, but beware: 
              the only true currency is discipline.
            </p>
          </div>

        </div>

        <div className="p-4 bg-black border-t border-gray-800 text-center">
          <button 
            onClick={toggleManual}
            className="px-8 py-2 bg-[#00f7ff] text-black font-bold hover:bg-white transition-colors"
          >
            ACKNOWLEDGE
          </button>
        </div>
      </div>
    </div>
  );
};
