
import React, { useState } from 'react';
import { useStore } from '../store';
import { formatCurrency } from '../utils';
import { Users, Shield, Lock, Crown, LogOut, ChevronUp } from 'lucide-react';
import { Rank } from '../types';
import { InfoTooltip } from './InfoTooltip';

export const Syndicates: React.FC = () => {
  const { syndicate, createSyndicate, joinSyndicate, leaveSyndicate, promoteMember, netWorth, id } = useStore();
  const [inputCode, setInputCode] = useState('');
  const [inputName, setInputName] = useState('');
  const [view, setView] = useState<'JOIN' | 'CREATE'>('JOIN');

  if (!syndicate) {
      return (
          <div className="h-full flex flex-col items-center p-6 text-center animate-in fade-in">
              <Users size={48} className="text-[#00f7ff] mb-4 opacity-50" />
              <h2 className="text-xl font-bold mb-2">NO ALLEGIANCE</h2>
              <p className="text-xs text-gray-500 mb-8 max-w-xs">
                  Lone wolves survive, but Syndicates dominate. Join a faction to pool resources and unlock global buffs.
              </p>
              
              <div className="flex gap-4 mb-6">
                  <button onClick={() => setView('JOIN')} className={`px-4 py-2 text-xs font-bold border ${view === 'JOIN' ? 'border-[#00f7ff] text-[#00f7ff]' : 'border-gray-800 text-gray-600'}`}>JOIN</button>
                  <button onClick={() => setView('CREATE')} className={`px-4 py-2 text-xs font-bold border ${view === 'CREATE' ? 'border-[#00f7ff] text-[#00f7ff]' : 'border-gray-800 text-gray-600'}`}>CREATE</button>
              </div>

              {view === 'JOIN' ? (
                <div className="w-full max-w-xs space-y-4">
                    <input 
                        type="text" 
                        placeholder="ENTER SYNDICATE CODE"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                        className="w-full bg-black border border-gray-700 p-3 text-center text-[#00f7ff] focus:border-[#00f7ff] outline-none"
                    />
                    <button 
                        onClick={() => joinSyndicate(inputCode)}
                        disabled={!inputCode}
                        className="w-full bg-[#00f7ff]/10 border border-[#00f7ff] text-[#00f7ff] py-3 font-bold hover:bg-[#00f7ff] hover:text-black transition-all disabled:opacity-50"
                    >
                        INITIATE LINK
                    </button>
                </div>
              ) : (
                <div className="w-full max-w-xs space-y-4">
                    <input 
                        type="text" 
                        placeholder="SYNDICATE NAME"
                        value={inputName}
                        onChange={(e) => setInputName(e.target.value.toUpperCase())}
                        className="w-full bg-black border border-gray-700 p-3 text-center text-[#00f7ff] focus:border-[#00f7ff] outline-none"
                    />
                    <div className="text-[10px] text-gray-500">COST: $2,500 NW</div>
                    <button 
                        onClick={() => createSyndicate(inputName)}
                        disabled={!inputName || netWorth < 2500}
                        className="w-full bg-[#00f7ff]/10 border border-[#00f7ff] text-[#00f7ff] py-3 font-bold hover:bg-[#00f7ff] hover:text-black transition-all disabled:opacity-50"
                    >
                        ESTABLISH FACTION
                    </button>
                </div>
              )}
          </div>
      );
  }

  const isCommander = syndicate.commanderId === id;
  const totalWealth = syndicate.members.reduce((acc, m) => acc + m.netWorth, 0);

  const getRankIcon = (rank: Rank) => {
      switch(rank) {
          case 'COMMANDER': return <Crown size={14} className="text-yellow-500" />;
          case 'LIEUTENANT': return <Shield size={14} className="text-[#00f7ff]" />;
          default: return null;
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
        <div className="border-b border-[#00f7ff]/30 pb-4 flex justify-between items-end">
            <div>
                <h2 className="text-xl font-bold text-[#00f7ff]">{syndicate.name}</h2>
                <p className="text-xs text-gray-500">CODE: <span className="text-white font-mono">{syndicate.code}</span></p>
            </div>
            <div className="text-right">
                <p className="text-xl font-bold text-white flex items-center justify-end">
                    {formatCurrency(totalWealth)}
                    <InfoTooltip text="Total Net Worth of all members." />
                </p>
                <p className="text-[10px] text-gray-500">COLLECTIVE WEALTH</p>
            </div>
        </div>

        <div className="bg-[#111] p-4 border border-gray-800">
            <h3 className="text-xs font-bold text-gray-400 mb-4 flex items-center gap-2">
                <Shield size={12} /> ACTIVE PROTOCOLS
            </h3>
            <div className="flex gap-2">
                <div className="flex-1 bg-black border border-gray-800 p-2 opacity-50 relative group">
                    <div className="text-[10px] text-gray-500">EFFICIENCY</div>
                    <div className="text-[#00f7ff]">+5%</div>
                    <div className="absolute top-1 right-1"><InfoTooltip text="Boosts mining yield for all members."/></div>
                </div>
                <div className="flex-1 bg-black border border-gray-800 p-2 opacity-50">
                    <div className="text-[10px] text-gray-500">DEFENSE</div>
                    <div className="text-[#00f7ff]">+2%</div>
                </div>
                <button className="flex-1 bg-[#00f7ff]/10 border border-[#00f7ff] text-[#00f7ff] text-[10px] font-bold flex flex-col items-center justify-center p-1">
                    <Lock size={12} className="mb-1"/>
                    FUND BUFF
                </button>
            </div>
        </div>

        <div>
            <h3 className="text-xs font-bold text-gray-400 mb-4 flex items-center gap-2">
                <Users size={12} /> OPERATIVES ({syndicate.members.length}/10)
            </h3>
            <div className="space-y-2">
                {syndicate.members.map((member) => (
                    <div key={member.id} className="flex justify-between items-center bg-black border border-gray-800 p-3 group">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${member.status === 'ONLINE' ? 'bg-[#00f7ff] shadow-[0_0_5px_#00f7ff]' : 'bg-gray-600'}`}></div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className={member.status === 'ONLINE' ? 'text-white' : 'text-gray-500'}>{member.name}</span>
                                    {getRankIcon(member.rank)}
                                </div>
                                <span className="text-[9px] text-gray-600">{member.rank}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-mono text-[#00f7ff]">{formatCurrency(member.netWorth)}</span>
                            {isCommander && member.id !== id && (
                                <button onClick={() => promoteMember(member.id)} className="text-gray-600 hover:text-[#00f7ff]">
                                    <ChevronUp size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
        
        <div className="pt-4 border-t border-gray-800">
             <button 
                onClick={leaveSyndicate}
                className="flex items-center gap-2 text-red-500 text-xs hover:text-red-400"
            >
                <LogOut size={12} /> LEAVE SYNDICATE
            </button>
        </div>
    </div>
  );
};
