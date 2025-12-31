
import React, { useEffect, useState } from 'react';
import { Swords, Users, Globe, Plus, Play } from 'lucide-react';
import { useStore } from '../store';
import { formatCurrency } from '../utils';

export const Arena: React.FC = () => {
  const { activeUsers, netWorth, activeLobbies, createDuelLobby, joinDuelLobby, refreshLobbies, callsign } = useStore();
  const [wagerInput, setWagerInput] = useState(500);

  useEffect(() => {
      refreshLobbies();
      const interval = setInterval(refreshLobbies, 5000);
      return () => clearInterval(interval);
  }, []);

  const handleCreate = () => {
      if (wagerInput > netWorth) return;
      createDuelLobby(wagerInput);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in">
        <div className="mb-6 flex justify-between items-end border-b border-gray-800 pb-2">
            <div>
                <h2 className="text-xl font-bold text-[#00f7ff]">THE ARENA</h2>
                <p className="text-xs text-gray-500">PVP CONTRACTS // {callsign}</p>
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
                    <div className="text-2xl font-bold text-white">{activeLobbies.length}</div>
                    <div className="text-[10px] text-gray-500">OPEN CONTRACTS</div>
                </div>
            </div>
        </div>

        {/* Create Contract */}
        <div className="bg-black/50 border border-gray-800 p-4 mb-6">
            <h3 className="text-xs font-bold text-gray-400 mb-3">CREATE CONTRACT</h3>
            <div className="flex gap-4">
                <input 
                    type="number" 
                    value={wagerInput}
                    onChange={(e) => setWagerInput(Number(e.target.value))}
                    className="bg-black border border-gray-700 p-2 text-white w-32 outline-none focus:border-[#00f7ff]"
                    min={100}
                />
                <button 
                    onClick={handleCreate}
                    disabled={netWorth < wagerInput}
                    className="flex-1 bg-[#00f7ff]/10 border border-[#00f7ff] text-[#00f7ff] font-bold text-xs hover:bg-[#00f7ff] hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Plus size={16} /> POST WAGER
                </button>
            </div>
        </div>

        {/* Lobby List */}
        <div className="flex-1 overflow-y-auto">
             <h3 className="text-xs font-bold text-gray-400 mb-3 sticky top-0 bg-[#050505] py-2">OPEN CONTRACTS</h3>
             
             {activeLobbies.length === 0 ? (
                 <div className="text-center py-10 opacity-30">
                     <Swords size={48} className="mx-auto mb-2"/>
                     <p className="text-xs">NO ACTIVE CONTRACTS FOUND</p>
                 </div>
             ) : (
                 <div className="space-y-2 pb-20">
                     {activeLobbies.map((lobby) => (
                         <div key={lobby.id} className="bg-[#111] border border-gray-800 p-3 flex justify-between items-center group hover:border-red-500 transition-colors">
                             <div>
                                 <span className="text-red-500 font-bold text-sm">VS {lobby.hostName}</span>
                                 <p className="text-[10px] text-gray-500">ID: {lobby.id}</p>
                             </div>
                             <div className="flex items-center gap-4">
                                 <span className="text-white font-mono">{formatCurrency(lobby.wager)}</span>
                                 <button 
                                    onClick={() => joinDuelLobby(lobby.id)}
                                    disabled={netWorth < lobby.wager}
                                    className="p-2 bg-red-500/10 border border-red-500 text-red-500 hover:bg-red-500 hover:text-black transition-colors disabled:opacity-30"
                                 >
                                     <Play size={16} />
                                 </button>
                             </div>
                         </div>
                     ))}
                 </div>
             )}
        </div>
    </div>
  );
};
