
import React, { useState } from 'react';
import { useStore } from '../store';
import { X, Save, User, Shield, Terminal } from 'lucide-react';
import { formatCurrency } from '../utils';

export const Profile: React.FC = () => {
  const { toggleProfile, callsign, bio, updateProfile, archetype, netWorth, streak, startDate } = useStore();
  
  const [localCallsign, setLocalCallsign] = useState(callsign);
  const [localBio, setLocalBio] = useState(bio);

  const handleSave = () => {
    updateProfile(localCallsign, localBio);
    toggleProfile();
  };

  const daysActive = Math.floor((Date.now() - startDate) / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-[#0a0a0a] border border-gray-800 w-full max-w-md relative shadow-[0_0_50px_rgba(255,255,255,0.05)]">
        
        <button onClick={toggleProfile} className="absolute top-4 right-4 text-gray-500 hover:text-white">
          <X size={24} />
        </button>

        <div className="p-6 border-b border-gray-800 bg-[#111]">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-black border border-[#00f7ff] flex items-center justify-center">
                <User className="text-[#00f7ff]" size={24} />
             </div>
             <div>
                 <h2 className="text-xl font-bold text-white tracking-widest">AGENT PROFILE</h2>
                 <p className="text-xs text-[#00f7ff]">{archetype || 'UNCLASSIFIED'}</p>
             </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase tracking-wider">Callsign</label>
            <input 
              value={localCallsign}
              onChange={(e) => setLocalCallsign(e.target.value.toUpperCase())}
              className="w-full bg-black border border-gray-700 p-3 text-white focus:border-[#00f7ff] outline-none font-mono"
              placeholder="ENTER CALLSIGN"
              maxLength={12}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase tracking-wider">Service Record (Bio)</label>
            <textarea 
              value={localBio}
              onChange={(e) => setLocalBio(e.target.value)}
              className="w-full bg-black border border-gray-700 p-3 text-gray-300 focus:border-[#00f7ff] outline-none font-mono h-24 resize-none"
              placeholder="Enter service history..."
              maxLength={140}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
             <div className="bg-black p-3 border border-gray-800">
                 <div className="text-[10px] text-gray-500">NET WORTH</div>
                 <div className="text-white font-bold">{formatCurrency(netWorth)}</div>
             </div>
             <div className="bg-black p-3 border border-gray-800">
                 <div className="text-[10px] text-gray-500">DISCIPLINE STREAK</div>
                 <div className="text-[#00f7ff] font-bold">{streak} DAYS</div>
             </div>
             <div className="bg-black p-3 border border-gray-800">
                 <div className="text-[10px] text-gray-500">SERVICE TIME</div>
                 <div className="text-white font-bold">{daysActive} DAYS</div>
             </div>
             <div className="bg-black p-3 border border-gray-800">
                 <div className="text-[10px] text-gray-500">CLEARANCE</div>
                 <div className="text-white font-bold">Lvl {Math.floor(netWorth / 10000)}</div>
             </div>
          </div>

        </div>

        <div className="p-4 bg-black border-t border-gray-800 flex gap-4">
          <button 
            onClick={handleSave}
            className="flex-1 py-3 bg-[#00f7ff]/10 border border-[#00f7ff] text-[#00f7ff] font-bold hover:bg-[#00f7ff] hover:text-black transition-all flex items-center justify-center gap-2"
          >
            <Save size={16} />
            UPDATE RECORD
          </button>
        </div>
      </div>
    </div>
  );
};
