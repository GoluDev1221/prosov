
import React from 'react';
import { useStore } from '../store';
import { X, Shield, Swords, Map, Activity, Brain, User, Zap, Users, AlertTriangle, Skull } from 'lucide-react';

export const Manual: React.FC = () => {
  const { toggleManual } = useStore();

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-[#111] border border-[#00f7ff] w-full max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar flex flex-col relative shadow-[0_0_50px_rgba(0,247,255,0.1)]">
        
        <button onClick={toggleManual} className="absolute top-4 right-4 text-gray-500 hover:text-white sticky z-50 bg-[#111] rounded-full p-1">
          <X size={24} />
        </button>

        <div className="p-6 border-b border-gray-800 sticky top-0 bg-[#111] z-40">
          <h2 className="text-2xl font-black text-[#00f7ff] tracking-[0.2em]">OPERATOR HANDBOOK</h2>
          <p className="text-xs text-gray-500 mt-1">FIELD MANUAL V4.1 // UNCLASSIFIED</p>
        </div>

        <div className="p-6 space-y-10">
          
          {/* 0. THE OBJECTIVE */}
          <div className="border-l-2 border-[#00f7ff] pl-4">
             <h3 className="text-white font-bold text-lg mb-2">0. THE OBJECTIVE</h3>
             <p className="text-sm text-gray-400">
                You are an Operative in a war for academic dominance. Your goal is to annex the entire <span className="text-white">Syllabus Matrix</span> and maximize your <span className="text-[#00f7ff]">$NW (Net Worth)</span> before the Exam Deadline.
             </p>
          </div>

          {/* 1. MINING */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#00f7ff] font-bold border-b border-gray-800 pb-1">
              <Activity size={18} />
              <h3>1. RESOURCE EXTRACTION (MINING)</h3>
            </div>
            <div className="text-xs text-gray-400 space-y-2 leading-relaxed">
              <p>
                <strong className="text-white">THE RIG:</strong> This is your primary source of income. Activate the Mining Rig to convert real-world study time into $NW.
              </p>
              <p>
                <strong className="text-white">STRICT PROTOCOL:</strong> The system detects focus. If you switch tabs, minimize the browser, or exit the app, the <span className="text-red-500">SIREN</span> will trigger.
              </p>
              <div className="bg-red-900/10 border border-red-500/30 p-3 text-red-400 flex gap-2 items-start">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-red-500">PENALTY ON BREACH:</strong> Failing a session results in an immediate loss of <strong className="text-white">20% of your Total Net Worth</strong>. Stay focused or lose everything.
                  </span>
              </div>
            </div>
          </div>

          {/* 2. TERRITORY */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#00f7ff] font-bold border-b border-gray-800 pb-1">
              <Map size={18} />
              <h3>2. TERRITORIAL ANNEXATION</h3>
            </div>
            <div className="text-xs text-gray-400 space-y-2 leading-relaxed">
              <p>
                The INTEL map represents your syllabus. Each hexagon is a Chapter. To annex a chapter, you must purchase its 6 Tiers using $NW.
              </p>
              <ul className="list-disc pl-4 space-y-1 mt-2">
                  <li><span className="text-white">THEORY TIERS:</span> Lecture (L), Revision (RTQ), NEET PYQ (NP).</li>
                  <li><span className="text-white">COMBAT TIERS:</span> JEE PYQ (JP), Kattar Sheet (KS), Teacher Sheet (TS).</li>
              </ul>
              <p className="mt-2">
                <strong className="text-yellow-500">DECAY MECHANIC:</strong> Territories not revised within <span className="text-white">14 Days</span> turn <span className="text-yellow-500">GOLD</span>. This indicates knowledge decay. You must re-annex a tier to repair the territory.
              </p>
            </div>
          </div>

          {/* 3. PVP */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#00f7ff] font-bold border-b border-gray-800 pb-1">
              <Swords size={18} />
              <h3>3. THE ARENA (PVP)</h3>
            </div>
            <div className="text-xs text-gray-400 space-y-2 leading-relaxed">
              <p>
                Engage in 1v1 Focus Duels with other Operatives. 
              </p>
              <p>
                <strong className="text-white">THE WAGER:</strong> Both players stake $NW based on the duration (50 $NW per minute).
              </p>
              <p>
                <strong className="text-white">VICTORY CONDITIONS:</strong> Complete the session without breaking focus. If your opponent fails (switches tabs), you win the entire pot instantly.
              </p>
               <p>
                <strong className="text-white">DEFEAT:</strong> If you break focus, you lose your wager AND suffer the standard 20% Net Worth penalty.
              </p>
            </div>
          </div>

          {/* 4. CLASSES */}
          <div className="space-y-3">
             <div className="flex items-center gap-2 text-[#00f7ff] font-bold border-b border-gray-800 pb-1">
                <User size={18} />
                <h3>4. CLASS SPECIALIZATIONS</h3>
             </div>
             <p className="text-xs text-gray-500">Your archetype determines your economic advantages.</p>
             
             <div className="grid grid-cols-1 gap-2">
                 <div className="bg-black border border-gray-800 p-2 flex items-center gap-3">
                     <Brain size={16} className="text-[#00f7ff]"/> 
                     <div className="text-xs"><strong className="text-white">STRATEGIST:</strong> 15% Discount on all THEORY tiers.</div>
                 </div>
                 <div className="bg-black border border-gray-800 p-2 flex items-center gap-3">
                     <Swords size={16} className="text-[#00f7ff]"/> 
                     <div className="text-xs"><strong className="text-white">VANGUARD:</strong> 15% Discount on all COMBAT tiers.</div>
                 </div>
                 <div className="bg-black border border-gray-800 p-2 flex items-center gap-3">
                     <Shield size={16} className="text-[#00f7ff]"/> 
                     <div className="text-xs"><strong className="text-white">SENTINEL:</strong> 50% Damage Reduction. Breach penalty reduced from 20% to 10%.</div>
                 </div>
                 <div className="bg-black border border-gray-800 p-2 flex items-center gap-3">
                     <User size={16} className="text-[#00f7ff]"/> 
                     <div className="text-xs"><strong className="text-white">OPERATIVE:</strong> No perks. Pure skill. No Syndicate Tax liability.</div>
                 </div>
             </div>
          </div>

          {/* 5. ECONOMY */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#00f7ff] font-bold border-b border-gray-800 pb-1">
              <Zap size={18} />
              <h3>5. BLACK MARKET</h3>
            </div>
            <div className="text-xs text-gray-400 space-y-1">
                <p>Spend your hard-earned $NW on tactical augments:</p>
                <ul className="list-disc pl-4 space-y-1">
                    <li><strong className="text-white">NEURAL STIMULANT:</strong> Doubles mining yield for 1 hour.</li>
                    <li><strong className="text-white">CRYO-STASIS:</strong> Freezes your Daily Streak for 24h (use before a rest day).</li>
                    <li><strong className="text-white">GHOST PROTOCOL:</strong> Hides your name from the Global Ticker.</li>
                </ul>
            </div>
          </div>

           {/* 6. SYNDICATES */}
           <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#00f7ff] font-bold border-b border-gray-800 pb-1">
              <Users size={18} />
              <h3>6. SYNDICATE OPERATIONS</h3>
            </div>
            <div className="text-xs text-gray-400 space-y-1">
                <p>A Syndicate is a faction of up to 10 Operatives.</p>
                <p>Pooling resources increases your <strong className="text-white">Collective Wealth</strong> rank on the leaderboards.</p>
                <p>Commanders can purchase <strong className="text-white">Global Buffs</strong> (e.g., +5% Efficiency) that apply to all members.</p>
            </div>
          </div>

           {/* 7. DEFCON */}
           <div className="space-y-3">
            <div className="flex items-center gap-2 text-red-500 font-bold border-b border-gray-800 pb-1">
              <Skull size={18} />
              <h3>7. DEFCON PROTOCOLS</h3>
            </div>
            <div className="text-xs text-gray-400 space-y-1">
                <p>As the Exam Date approaches, the system interface shifts.</p>
                <ul className="list-disc pl-4 space-y-1">
                    <li><strong className="text-white">DEFCON 5 (&gt;120 Days):</strong> Normal Operation. Cyan Theme.</li>
                    <li><strong className="text-white">DEFCON 3 (&lt;90 Days):</strong> Visual Glitches increase. Music shifts.</li>
                    <li><strong className="text-red-500">DEFCON 1 (&lt;30 Days):</strong> Total War. Interface bleeds Red. Panic is simulated.</li>
                </ul>
            </div>
          </div>

        </div>

        <div className="p-4 bg-black border-t border-gray-800 text-center sticky bottom-0 z-40">
          <button 
            onClick={toggleManual}
            className="px-12 py-3 bg-[#00f7ff] text-black font-black tracking-widest hover:bg-white transition-colors skew-x-[-10deg]"
          >
            I UNDERSTAND THE RISKS
          </button>
        </div>
      </div>
    </div>
  );
};
