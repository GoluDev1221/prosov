
import React, { useState } from 'react';
import { useStore } from '../store';
import { X, Save, User, Search, LogOut, Shield, Activity, Calendar } from 'lucide-react';
import { formatCurrency } from '../utils';
import { supabase } from '../supabaseClient';
import { InfoTooltip } from './InfoTooltip';

export const Profile: React.FC = () => {
  const { toggleProfile, callsign, bio, updateProfile, archetype, netWorth, streak, startDate, signOut, syllabus } = useStore();
  
  const [tab, setTab] = useState<'ME' | 'NETWORK'>('ME');
  const [localCallsign, setLocalCallsign] = useState(callsign);
  const [localBio, setLocalBio] = useState(bio);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSave = () => {
    updateProfile(localCallsign, localBio);
    toggleProfile();
  };

  const daysActive = Math.floor((Date.now() - startDate) / (1000 * 60 * 60 * 24));
  
  // New Clearance Logic: Total Tiers Annexed
  const totalAnnexed = syllabus.reduce((acc, chapter) => {
      return acc + chapter.tiers.filter(t => t.completed).length;
  }, 0);

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

        {/* Tab Navigation */}
        <div className="p-4 border-b border-gray-800 bg-[#111] flex gap-4">
             <button onClick={() => setTab('ME')} className={`text-xs font-bold px-4 py-2 ${tab === 'ME' ? 'text-[#00f7ff] border-b-2 border-[#00f7ff]' : 'text-gray-500'}`}>MY RECORD</button>
             <button onClick={() => setTab('NETWORK')} className={`text-xs font-bold px-4 py-2 ${tab === 'NETWORK' ? 'text-[#00f7ff] border-b-2 border-[#00f7ff]' : 'text-gray-500'}`}>NETWORK</button>
        </div>

        {tab === 'ME' ? (
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          
          {/* Identity Header */}
          <div className="flex items-center gap-4 border-b border-gray-800 pb-6">
             <div className="w-16 h-16 bg-black border border-[#00f7ff] flex items-center justify-center shadow-[0_0_15px_rgba(0,247,255,0.2)]">
                <User className="text-[#00f7ff]" size={32} />
             </div>
             <div>
                 <h2 className="text-2xl font-black text-white tracking-widest leading-none">{callsign}</h2>
                 <p className="text-xs text-[#00f7ff] mt-1 font-bold">{archetype || 'UNCLASSIFIED'}</p>
                 <p className="text-[10px] text-gray-500 mt-1">OPERATIVE ID: {useStore.getState().id.slice(0,8)}</p>
             </div>
          </div>
          
          {/* Edit Fields */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 uppercase tracking-wider">Callsign (Public)</label>
              <input 
                value={localCallsign}
                onChange={(e) => setLocalCallsign(e.target.value.toUpperCase())}
                className="w-full bg-black border border-gray-700 p-2 text-white focus:border-[#00f7ff] outline-none font-mono text-sm"
                placeholder="ENTER CALLSIGN"
                maxLength={12}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 uppercase tracking-wider">Service Record (Bio)</label>
              <textarea 
                value={localBio}
                onChange={(e) => setLocalBio(e.target.value)}
                className="w-full bg-black border border-gray-700 p-2 text-gray-300 focus:border-[#00f7ff] outline-none font-mono h-20 resize-none text-xs"
                placeholder="Enter service history..."
                maxLength={140}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 pt-4">
             <div className="bg-[#111] p-3 border border-gray-800">
                 <div className="text-[10px] text-gray-500 flex items-center gap-1">
                     <Activity size={10} /> NET WORTH
                     <InfoTooltip text="Total wealth extracted from focus sessions." />
                 </div>
                 <div className="text-lg text-white font-bold">{formatCurrency(netWorth)}</div>
             </div>
             <div className="bg-[#111] p-3 border border-gray-800">
                 <div className="text-[10px] text-gray-500 flex items-center gap-1">
                     <Shield size={10} /> STREAK
                     <InfoTooltip text="Consecutive days with at least 1 focus session." />
                 </div>
                 <div className="text-lg text-[#00f7ff] font-bold">{streak} DAYS</div>
             </div>
             <div className="bg-[#111] p-3 border border-gray-800">
                 <div className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Calendar size={10} /> SERVICE TIME
                 </div>
                 <div className="text-lg text-white font-bold">{daysActive} DAYS</div>
             </div>
             <div className="bg-[#111] p-3 border border-gray-800">
                 <div className="text-[10px] text-gray-500 flex items-center gap-1">
                    CLEARANCE
                    <InfoTooltip text="Level increases with every territory tier annexed." />
                 </div>
                 <div className="text-lg text-white font-bold">LVL {totalAnnexed}</div>
             </div>
          </div>
          
          <button 
            onClick={signOut}
            className="w-full py-2 bg-red-900/10 border border-red-900/50 text-red-500 text-xs font-bold hover:bg-red-900/30 flex items-center justify-center gap-2 mt-4"
          >
            <LogOut size={12}/> TERMINATE LINK
          </button>
        </div>
        ) : (
            <div className="p-6 flex-1 flex flex-col">
                <div className="flex gap-2 mb-6">
                    <input 
                        className="flex-1 bg-black border border-gray-700 p-2 text-white outline-none focus:border-[#00f7ff]"
                        placeholder="SEARCH CALLSIGN..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <button onClick={handleSearch} className="bg-[#00f7ff] text-black p-2 hover:bg-white">
                        <Search size={20} />
                    </button>
                </div>

                <div className="space-y-4 overflow-y-auto">
                    {searching ? <div className="text-xs text-[#00f7ff] animate-pulse">SCANNING DATABASE...</div> : null}
                    
                    {searchResults.map((p, i) => (
                        <div key={i} className="bg-[#111] border border-gray-800 p-3 flex justify-between items-center hover:border-gray-600 transition-colors">
                            <div>
                                <div className="text-[#00f7ff] font-bold">{p.callsign}</div>
                                <div className="text-[10px] text-gray-500">{p.archetype}</div>
                                <div className="text-[10px] text-gray-600 mt-1 italic line-clamp-1">"{p.data?.bio || 'No data.'}"</div>
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
