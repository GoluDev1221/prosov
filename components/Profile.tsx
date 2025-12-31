
import React, { useState } from 'react';
import { useStore } from '../store';
import { X, Save, User, Search, LogOut } from 'lucide-react';
import { formatCurrency } from '../utils';
import { supabase } from '../supabaseClient';
import { InfoTooltip } from './InfoTooltip';

export const Profile: React.FC = () => {
  const { toggleProfile, callsign, bio, updateProfile, archetype, netWorth, streak, startDate, signOut } = useStore();
  
  const [tab, setTab] = useState<'ME' | 'NETWORK'>('ME');
  const [localCallsign, setLocalCallsign] = useState(callsign);
  const [localBio, setLocalBio] = useState(bio);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSave = () => {
    updateProfile(localCallsign, localBio);
    toggleProfile();
  };

  const daysActive = Math.floor((Date.now() - startDate) / (1000 * 60 * 60 * 24));

  const handleSearch = async () => {
      setSearching(true);
      const { data } = await supabase
        .from('profiles')
        .select('callsign, net_worth, archetype, data')
        .ilike('callsign', `%${searchQuery}%`)
        .limit(5);
      
      if (data) setSearchResults(data);
      setSearching(false);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-[#0a0a0a] border border-gray-800 w-full max-w-md relative shadow-[0_0_50px_rgba(255,255,255,0.05)] h-[80vh] flex flex-col">
        
        <button onClick={toggleProfile} className="absolute top-4 right-4 text-gray-500 hover:text-white z-10">
          <X size={24} />
        </button>

        <div className="p-4 border-b border-gray-800 bg-[#111] flex gap-4">
             <button onClick={() => setTab('ME')} className={`text-xs font-bold px-4 py-2 ${tab === 'ME' ? 'text-[#00f7ff] border-b-2 border-[#00f7ff]' : 'text-gray-500'}`}>MY RECORD</button>
             <button onClick={() => setTab('NETWORK')} className={`text-xs font-bold px-4 py-2 ${tab === 'NETWORK' ? 'text-[#00f7ff] border-b-2 border-[#00f7ff]' : 'text-gray-500'}`}>NETWORK SEARCH</button>
        </div>

        {tab === 'ME' ? (
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-black border border-[#00f7ff] flex items-center justify-center">
                <User className="text-[#00f7ff]" size={24} />
             </div>
             <div>
                 <h2 className="text-xl font-bold text-white tracking-widest">AGENT PROFILE</h2>
                 <p className="text-xs text-[#00f7ff]">{archetype || 'UNCLASSIFIED'}</p>
             </div>
          </div>
          
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
                 <div className="text-[10px] text-gray-500 flex items-center">
                     NET WORTH
                     <InfoTooltip text="Total accumulated wealth from focus sessions." />
                 </div>
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
                 <div className="text-white font-bold">Lvl {Math.floor(netWorth / 2500)}</div>
             </div>
          </div>
          
          <button 
            onClick={signOut}
            className="w-full py-2 bg-red-900/20 border border-red-900 text-red-500 text-xs font-bold hover:bg-red-900/40 flex items-center justify-center gap-2"
          >
            <LogOut size={12}/> TERMINATE SESSION
          </button>
        </div>
        ) : (
            <div className="p-6 flex-1 flex flex-col">
                <div className="flex gap-2 mb-6">
                    <input 
                        className="flex-1 bg-black border border-gray-700 p-2 text-white outline-none"
                        placeholder="SEARCH CALLSIGN..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <button onClick={handleSearch} className="bg-[#00f7ff] text-black p-2">
                        <Search size={20} />
                    </button>
                </div>

                <div className="space-y-4 overflow-y-auto">
                    {searching ? <div className="text-xs text-[#00f7ff] animate-pulse">SCANNING DATABASE...</div> : null}
                    
                    {searchResults.map((p, i) => (
                        <div key={i} className="bg-[#111] border border-gray-800 p-3 flex justify-between items-center">
                            <div>
                                <div className="text-[#00f7ff] font-bold">{p.callsign}</div>
                                <div className="text-[10px] text-gray-500">{p.archetype}</div>
                                <div className="text-[10px] text-gray-600 mt-1 italic">"{p.data?.bio || 'No data.'}"</div>
                            </div>
                            <div className="text-right">
                                <div className="text-white font-mono">{formatCurrency(p.net_worth)}</div>
                                <div className="text-[9px] text-gray-500">NET WORTH</div>
                            </div>
                        </div>
                    ))}
                    {!searching && searchResults.length === 0 && <div className="text-center text-gray-600 text-xs mt-10">NO OPERATIVES FOUND</div>}
                </div>
            </div>
        )}

        {tab === 'ME' && (
            <div className="p-4 bg-black border-t border-gray-800 flex gap-4 mt-auto">
            <button 
                onClick={handleSave}
                className="flex-1 py-3 bg-[#00f7ff]/10 border border-[#00f7ff] text-[#00f7ff] font-bold hover:bg-[#00f7ff] hover:text-black transition-all flex items-center justify-center gap-2"
            >
                <Save size={16} />
                UPDATE RECORD
            </button>
            </div>
        )}
      </div>
    </div>
  );
};
