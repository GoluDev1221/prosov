
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { EXAM_DATE } from '../constants';
import { formatCurrency, getRandomQuote } from '../utils';
import { POWER_LAWS } from '../constants';
import { TrendingUp, Activity, Skull, Book, User } from 'lucide-react';

interface Props {
  defcon: number;
}

export const Command: React.FC<Props> = ({ defcon }) => {
  const { netWorth, efficiency, calculateCAGR, streak, globalEvents, callsign, toggleManual, toggleProfile } = useStore();
  const projectedNW = calculateCAGR();
  const quote = getRandomQuote(POWER_LAWS);
  
  const [countdown, setCountdown] = useState('');

  // Real-time countdown
  useEffect(() => {
      const interval = setInterval(() => {
          const now = Date.now();
          const diff = EXAM_DATE - now;
          if (diff <= 0) {
              setCountdown("IMPACT DETECTED");
              return;
          }
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setCountdown(`${days}D ${hours}H ${minutes}M ${seconds}S`);
      }, 1000);
      return () => clearInterval(interval);
  }, []);
  
  const isDanger = defcon < 3;
  const primaryColor = isDanger ? 'text-red-500' : 'text-[#00f7ff]';
  const borderColor = isDanger ? 'border-red-500' : 'border-[#00f7ff]';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Action Bar */}
      <div className="flex gap-2">
          <button onClick={toggleProfile} className="flex-1 bg-[#111] border border-gray-800 p-3 flex items-center justify-center gap-2 hover:border-[#00f7ff] transition-colors">
              <User size={16} className="text-[#00f7ff]" />
              <span className="text-xs font-bold text-white">PROFILE</span>
          </button>
          <button onClick={toggleManual} className="flex-1 bg-[#111] border border-gray-800 p-3 flex items-center justify-center gap-2 hover:border-[#00f7ff] transition-colors">
              <Book size={16} className="text-[#00f7ff]" />
              <span className="text-xs font-bold text-white">MANUAL</span>
          </button>
      </div>

      {/* Laws of Power */}
      <div className={`border-l-2 ${borderColor} bg-white/5 p-4`}>
        <p className="text-[10px] text-gray-500 mb-1">STRATEGIC DIRECTIVE // {callsign}</p>
        <p className={`text-sm font-bold ${primaryColor} glitch-text`}>{quote}</p>
      </div>

      {/* The Ledger */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`bg-black border ${borderColor} p-4 flex flex-col justify-between h-32`}>
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-gray-400">LIQUID ASSETS</span>
            <Activity size={16} className={primaryColor} />
          </div>
          <div className="text-2xl font-bold tracking-tight">{formatCurrency(netWorth)}</div>
          <div className="text-[10px] text-gray-500">EFFICIENCY: {efficiency}x</div>
        </div>

        <div className={`bg-black border ${borderColor} p-4 flex flex-col justify-between h-32`}>
           <div className="flex justify-between items-start">
            <span className="text-[10px] text-gray-400">PROJECTED VALUE</span>
            <TrendingUp size={16} className={primaryColor} />
          </div>
          <div className="text-xl font-bold tracking-tight opacity-80">{formatCurrency(projectedNW)}</div>
          <div className="text-[10px] text-gray-500">CAGR PROJECTION</div>
        </div>
      </div>

      {/* Global Ticker (Real-time Feed) */}
      <div className="w-full bg-[#111] h-8 overflow-hidden flex items-center border-t border-b border-gray-800 relative">
        <div className="absolute whitespace-nowrap animate-[marquee_40s_linear_infinite] text-xs text-gray-400 font-mono flex gap-12">
            {globalEvents.slice(0, 10).map((event) => (
                <span key={event.id} className="flex items-center gap-2">
                    <span className={`w-1 h-1 rounded-full inline-block ${event.type === 'COMBAT' ? 'bg-red-500' : 'bg-[#00f7ff]'}`}></span>
                    {event.message} <span className="text-[9px] opacity-50">[{new Date(event.timestamp).toLocaleTimeString()}]</span>
                </span>
            ))}
             {/* Duplicate for smooth loop if enough events exist */}
             {globalEvents.length > 5 && globalEvents.slice(0, 10).map((event) => (
                <span key={`dup-${event.id}`} className="flex items-center gap-2">
                     <span className={`w-1 h-1 rounded-full inline-block ${event.type === 'COMBAT' ? 'bg-red-500' : 'bg-[#00f7ff]'}`}></span>
                    {event.message}
                </span>
            ))}
             {globalEvents.length === 0 && <span>ESTABLISHING UPLINK...</span>}
        </div>
      </div>

      {/* Exam Countdown */}
      <div className={`p-6 border ${borderColor} relative overflow-hidden group`}>
        <div className={`absolute top-0 left-0 w-1 h-full ${isDanger ? 'bg-red-500' : 'bg-[#00f7ff]'}`}></div>
        <div className="flex justify-between items-end relative z-10">
          <div>
            <h2 className="text-2xl font-black">{countdown}</h2>
            <p className="text-xs tracking-[0.3em] mt-1">TIME TO IMPACT</p>
          </div>
          <Skull size={48} className={`opacity-20 ${primaryColor}`} />
        </div>
        <div className={`absolute -bottom-10 -right-10 w-32 h-32 ${isDanger ? 'bg-red-500' : 'bg-[#00f7ff]'} opacity-10 blur-2xl rounded-full`}></div>
      </div>

      <div className="flex justify-between text-xs text-gray-600 font-mono">
        <span>STREAK: {streak} DAYS</span>
        <span>ID: {callsign}</span>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};
