
import React, { useEffect, useState } from 'react';
import { Swords, Users, Globe, Plus, Play, Clock, Loader, XCircle } from 'lucide-react';
import { useStore } from '../store';
import { formatCurrency } from '../utils';
import { InfoTooltip } from './InfoTooltip';

export const Arena: React.FC = () => {
  const { activeUsers, netWorth, activeLobbies, createDuelLobby, cancelDuelLobby, joinDuelLobby, refreshLobbies, callsign, hostingLobbyId } = useStore();
  const [durationInput, setDurationInput] = useState(30); // Default 30 mins

  useEffect(() => {
      refreshLobbies();
      const interval = setInterval(refreshLobbies, 5000);
      return () => clearInterval(interval);
  }, []);

  const wagerCost = durationInput * 50;

  const handleCreate = () => {
      if (wagerCost > netWorth) return;
      createDuelLobby(durationInput);
  };

  // WAITING ROOM UI (For Host)
  if (hostingLobbyId) {
      return (
          <div className="flex flex-col items-center justify-center h-full pb-20 animate-in fade-in">
              <Loader size={64} className="text-[#00f7ff] animate-spin mb-6" />
              <h2 className="text-2xl font-bold tracking-widest text-[#00f7ff] animate-pulse">AWAITING CHALLENGER</h2>
              <p className="text-xs text-gray-500 mt-2 text-center max-w-xs">
                  CONTRACT PUBLISHED. ESCROW LOCKED. 
                  COMBAT WILL AUTO-INITIALIZE UPON CONNECTION.
              </p>
              
              <div className="mt-8 bg-[#111] p-4 border border-gray-800 w-full max-w-xs">
                  <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-500">WAGER LOCKED</span>
                      <span className="text-white font-mono">{formatCurrency(wagerCost)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                      <span className="text-gray-500">POTENTIAL WIN</span>
                      <span className="text-[#00f7ff] font-mono">{formatCurrency(wagerCost * 2)}</span>
                  </div>
              </div>

              <button 
                  onClick={cancelDuelLobby}
                  className="mt-8 flex items-center gap-2 text-red-500 border border-red-500/30 px-6 py-3 hover:bg-red-900/20 transition-colors"
              >
                  <XCircle size={16} />
                  <span className="text-xs font-bold">CANCEL CONTRACT (REFUND)</span>
              </button>
          </div>
      );
  }

  // STANDARD LOBBY LIST
  return (
    <div className="flex flex-col h-full animate-in fade-in pb-20">
        <div className="mb-6 flex justify-between items-end border-b border-gray-800 pb-2">
            <div>
                <h2 className="text-xl font-bold text-[#00f7ff] flex items-center">
                    THE ARENA
                    <InfoTooltip text="1v1 Focus Duels. Winner takes the pot. Loser gets nothing." />
                </h2>
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
            <div className="flex gap-4 items-end">
                <div className="space-y-1">
                    <label className="text-[10px] text-gray-500">DURATION (MINUTES)</label>
                    <input 
                        type="number" 
                        value={durationInput}
                        onChange={(e) => setDurationInput(Math.max(1, Number(e.target.value)))}
                        className="bg-black border border-gray-700 p-2 text-white w-32 outline-none focus:border-[#00f7ff]"
                        min={1}
                        max={180}
                    />
                </div>
                <div className="flex-1 pb-2">
                    <div className="text-[10px] text-gray-500">REQUIRED WAGER (50/MIN)</div>
                    <div className="text-lg font-bold text-[#00f7ff]">{formatCurrency(wagerCost)}</div>
                </div>
                <button 
                    onClick={handleCreate}
                    disabled={netWorth < wagerCost}
                    className="bg-[#00f7ff]/10 border border-[#00f7ff] text-[#00f7ff] font-bold text-xs hover:bg-[#00f7ff] hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 h-10 px-4"
                >
                    <Plus size={16} /> POST
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
                                 <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                                    <Clock size={10} />
                                    <span>{Math.floor(lobby.wager/50)} MIN</span>
                                 </div>
                             </div>
                             <div className="flex items-center gap-4">
                                 <div className="text-right">
                                    <span className="text-white font-mono block">{formatCurrency(lobby.wager)}</span>
                                    <span className="text-[9px] text-gray-500">ENTRY COST</span>
                                 </div>
                                 <button 
                                    onClick={() => joinDuelLobby(lobby.id, lobby.wager)}
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
