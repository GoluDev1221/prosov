import React from 'react';
import { useStore } from '../store';
import { formatCurrency } from '../utils';
import { Zap, EyeOff, Snowflake, Clock } from 'lucide-react';

export const BlackMarket: React.FC = () => {
  const { netWorth, buyItem, inventory } = useStore();

  const items: {id: 'NEURAL' | 'CRYO' | 'GHOST', name: string, cost: number, desc: string, icon: any}[] = [
    { id: 'NEURAL', name: 'NEURAL STIMULANT', cost: 5000, desc: '2x Yield Multiplier (1hr)', icon: <Zap size={20}/> },
    { id: 'CRYO', name: 'CRYO-STASIS', cost: 2000, desc: 'Freeze Streak for 24h', icon: <Snowflake size={20}/> },
    { id: 'GHOST', name: 'GHOST PROTOCOL', cost: 10000, desc: 'Hide from Global Ticker', icon: <EyeOff size={20}/> },
  ];

  const now = Date.now();
  const getRemainingTime = (expiry: number | null) => {
      if (!expiry || expiry < now) return null;
      const mins = Math.floor((expiry - now) / 60000);
      return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className="space-y-6">
       <div className="border-b border-[#00f7ff]/30 pb-4">
        <h2 className="text-xl font-bold text-[#00f7ff]">BLACK MARKET</h2>
        <p className="text-xs text-gray-500 mt-1">AVAILABLE FUNDS: <span className="text-white">{formatCurrency(netWorth)}</span></p>
      </div>

      <div className="space-y-2 mb-6">
          <p className="text-[10px] text-gray-500 mb-2">ACTIVE AUGMENTS</p>
          {getRemainingTime(inventory.neuralStimulantUntil) && (
              <div className="flex items-center gap-2 text-[#00f7ff] text-xs border border-[#00f7ff]/30 p-2 bg-[#00f7ff]/10">
                  <Clock size={12} />
                  <span>NEURAL STIMULANT ACTIVE ({getRemainingTime(inventory.neuralStimulantUntil)})</span>
              </div>
          )}
           {getRemainingTime(inventory.cryoStasisUntil) && (
              <div className="flex items-center gap-2 text-blue-400 text-xs border border-blue-400/30 p-2 bg-blue-400/10">
                  <Clock size={12} />
                  <span>CRYO-STASIS ACTIVE ({getRemainingTime(inventory.cryoStasisUntil)})</span>
              </div>
          )}
           {getRemainingTime(inventory.ghostProtocolUntil) && (
              <div className="flex items-center gap-2 text-gray-400 text-xs border border-gray-400/30 p-2 bg-gray-400/10">
                  <Clock size={12} />
                  <span>GHOST PROTOCOL ACTIVE ({getRemainingTime(inventory.ghostProtocolUntil)})</span>
              </div>
          )}
          {!getRemainingTime(inventory.neuralStimulantUntil) && 
           !getRemainingTime(inventory.cryoStasisUntil) && 
           !getRemainingTime(inventory.ghostProtocolUntil) && (
               <p className="text-xs text-gray-700 italic">NO ACTIVE AUGMENTS</p>
           )}
      </div>

      <div className="grid gap-4">
        {items.map((item) => (
            <div key={item.id} className="bg-[#111] p-4 border border-gray-800 flex justify-between items-center group hover:border-[#00f7ff] transition-colors">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-black border border-gray-700 text-[#00f7ff]">{item.icon}</div>
                    <div>
                        <h3 className="font-bold text-sm">{item.name}</h3>
                        <p className="text-[10px] text-gray-500">{item.desc}</p>
                    </div>
                </div>
                <button 
                    onClick={() => buyItem(item.id, item.cost)}
                    disabled={netWorth < item.cost}
                    className="px-3 py-1 bg-black border border-[#00f7ff] text-[#00f7ff] text-xs font-bold disabled:opacity-30 disabled:border-gray-700 disabled:text-gray-700 hover:bg-[#00f7ff] hover:text-black transition-colors"
                >
                    BUY ${item.cost}
                </button>
            </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-[#0c0c0c] border-l-2 border-yellow-600 text-[10px] text-gray-500">
        WARNING: ILLICIT PURCHASES ARE NON-REFUNDABLE. SYNDICATE TAX MAY APPLY.
      </div>
    </div>
  );
};