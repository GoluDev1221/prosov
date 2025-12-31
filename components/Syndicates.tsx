import React, { useState } from 'react';
import { useStore } from '../store';
import { formatCurrency } from '../utils';
import { Users, Shield, TrendingUp, Lock } from 'lucide-react';

export const Syndicates: React.FC = () => {
  const { syndicateName, syndicateMembers, joinSyndicate, netWorth } = useStore();
  const [inputName, setInputName] = useState('');

  if (!syndicateName) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
              <Users size={48} className="text-[#00f7ff] mb-4 opacity-50" />
              <h2 className="text-xl font-bold mb-2">NO ALLEGIANCE</h2>
              <p className="text-xs text-gray-500 mb-8 max-w-xs">
                  Lone wolves survive, but Syndicates dominate. Join a faction to pool resources and unlock global buffs.
              </p>
              
              <div className="w-full max-w-xs space-y-4">
                  <input 
                    type="text" 
                    placeholder="ENTER SYNDICATE CODE"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    className="w-full bg-black border border-gray-700 p-3 text-center text-[#00f7ff] focus:border-[#00f7ff] outline-none"
                  />
                  <button 
                    onClick={() => joinSyndicate(inputName || 'OMEGA_SQUAD')}
                    className="w-full bg-[#00f7ff]/10 border border-[#00f7ff] text-[#00f7ff] py-3 font-bold hover:bg-[#00f7ff] hover:text-black transition-all"
                  >
                      INITIATE LINK
                  </button>
              </div>
          </div>
      );
  }

  const totalWealth = syndicateMembers.reduce((acc, m) => acc + m.netWorth, 0);

  return (
    <div className="space-y-6">
        <div className="border-b border-[#00f7ff]/30 pb-4 flex justify-between items-end">
            <div>
                <h2 className="text-xl font-bold text-[#00f7ff]">{syndicateName}</h2>
                <p className="text-xs text-gray-500">SYNDICATE // TIER 1</p>
            </div>
            <div className="text-right">
                <p className="text-xl font-bold text-white">{formatCurrency(totalWealth)}</p>
                <p className="text-[10px] text-gray-500">COLLECTIVE WEALTH</p>
            </div>
        </div>

        <div className="bg-[#111] p-4 border border-gray-800">
            <h3 className="text-xs font-bold text-gray-400 mb-4 flex items-center gap-2">
                <Shield size={12} /> ACTIVE PROTOCOLS
            </h3>
            <div className="flex gap-2">
                <div className="flex-1 bg-black border border-gray-800 p-2 opacity-50">
                    <div className="text-[10px] text-gray-500">EFFICIENCY</div>
                    <div className="text-[#00f7ff]">+0%</div>
                </div>
                <div className="flex-1 bg-black border border-gray-800 p-2 opacity-50">
                    <div className="text-[10px] text-gray-500">DEFENSE</div>
                    <div className="text-[#00f7ff]">+0%</div>
                </div>
                <button className="flex-1 bg-[#00f7ff]/10 border border-[#00f7ff] text-[#00f7ff] text-[10px] font-bold flex flex-col items-center justify-center p-1">
                    <Lock size={12} className="mb-1"/>
                    FUND BUFF
                </button>
            </div>
        </div>

        <div>
            <h3 className="text-xs font-bold text-gray-400 mb-4 flex items-center gap-2">
                <Users size={12} /> OPERATIVES
            </h3>
            <div className="space-y-2">
                {syndicateMembers.map((member) => (
                    <div key={member.id} className="flex justify-between items-center bg-black border border-gray-800 p-3">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${member.status === 'ONLINE' ? 'bg-[#00f7ff] shadow-[0_0_5px_#00f7ff]' : 'bg-gray-600'}`}></div>
                            <span className={member.status === 'ONLINE' ? 'text-white' : 'text-gray-500'}>{member.name}</span>
                        </div>
                        <span className="text-xs font-mono text-[#00f7ff]">{formatCurrency(member.netWorth)}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};