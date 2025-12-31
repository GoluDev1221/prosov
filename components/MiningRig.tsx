
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { AlertOctagon, Power, Swords, Volume2, VolumeX } from 'lucide-react';

export const MiningRig: React.FC = () => {
  const { stopMining, miningStartTime, miningMode, callsign } = useStore();
  const [elapsed, setElapsed] = useState(0);
  const [failed, setFailed] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Refs for Audio
  const ambientRef = useRef<HTMLAudioElement | null>(null);
  const sirenRef = useRef<HTMLAudioElement | null>(null);

  const isDuel = miningMode === 'DUEL';
  const themeColor = isDuel ? 'text-red-500' : 'text-[#00f7ff]';
  const borderColor = isDuel ? 'border-red-500' : 'border-[#00f7ff]';
  const shadowColor = isDuel ? 'shadow-[0_0_50px_rgba(239,68,68,0.2)]' : 'shadow-[0_0_50px_rgba(0,247,255,0.2)]';

  // Audio Initialization
  useEffect(() => {
    // Ambient: Dark Drone
    ambientRef.current = new Audio('https://cdn.pixabay.com/audio/2022/10/05/audio_6862569947.mp3');
    ambientRef.current.loop = true;
    ambientRef.current.volume = 0.5;

    // Siren: Alarm
    sirenRef.current = new Audio('https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3');
    sirenRef.current.loop = true;

    if (soundEnabled) {
        ambientRef.current.play().catch(e => console.log("Audio play failed:", e));
    }

    return () => {
        ambientRef.current?.pause();
        sirenRef.current?.pause();
    };
  }, []);

  // Toggle Sound
  useEffect(() => {
      if (!ambientRef.current) return;
      if (soundEnabled && !failed) {
          ambientRef.current.play().catch(() => {});
      } else {
          ambientRef.current.pause();
      }
  }, [soundEnabled, failed]);

  // Focus Logic
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setFailed(true);
        triggerSiren();
      }
    };
    
    // Check every second to update UI
    const timer = setInterval(() => {
        if (!miningStartTime) return;
        const diff = Math.floor((Date.now() - miningStartTime) / 1000);
        setElapsed(diff);
    }, 1000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(timer);
    };
  }, [miningStartTime]);

  const triggerSiren = () => {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
    ambientRef.current?.pause();
    if (soundEnabled) {
        sirenRef.current?.play().catch(() => {});
    }
  };

  const handleStop = () => {
    const minutes = Math.floor(elapsed / 60);
    stopMining(!failed, minutes);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (failed) {
    return (
      <div className="fixed inset-0 bg-red-900/90 z-50 flex flex-col items-center justify-center animate-pulse">
        <AlertOctagon size={64} className="text-white mb-4" />
        <h1 className="text-4xl font-black text-white tracking-widest mb-2">MISSION FAILED</h1>
        <p className="text-white font-mono mb-8">{isDuel ? 'DUEL LOST - WAGER FORFEITED' : 'FOCUS PROTOCOL VIOLATED'}</p>
        <button 
          onClick={handleStop}
          className="bg-black text-white px-8 py-3 font-mono border border-white hover:bg-white hover:text-black"
        >
          ACKNOWLEDGE FAILURE
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
      
      {/* Sound Toggle */}
      <button 
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="absolute top-4 right-4 text-gray-500 hover:text-white"
      >
          {soundEnabled ? <Volume2 /> : <VolumeX />}
      </button>

      <div className={`w-64 h-64 border-2 ${borderColor} rounded-full flex items-center justify-center relative ${shadowColor}`}>
        <div className={`absolute inset-0 border-t-2 ${borderColor} rounded-full animate-spin`}></div>
        <div className={`text-5xl font-mono ${themeColor} font-bold`}>
            {formatTime(elapsed)}
        </div>
      </div>
      
      <div className="mt-8 text-center space-y-2">
        <p className="text-gray-500 tracking-widest text-xs">{isDuel ? 'DUEL IN PROGRESS' : 'MINING IN PROGRESS...'}</p>
        <p className={`${themeColor} text-sm animate-pulse`}>{isDuel ? 'OPPONENT ACTIVE - DO NOT YIELD' : 'DO NOT EXIT THE MATRIX'}</p>
        <p className="text-[10px] text-gray-600">OPERATOR: {callsign}</p>
      </div>

      <div className="mt-12 w-full max-w-xs">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>YIELD</span>
              <span>{isDuel ? 'WINNER TAKES ALL' : `EST. +$${Math.floor(elapsed / 60) * 10}`}</span>
          </div>
          <div className="h-1 bg-gray-900 w-full">
              <div className={`h-full ${isDuel ? 'bg-red-500' : 'bg-[#00f7ff]'} transition-all`} style={{ width: `${(elapsed % 60) / 60 * 100}%` }}></div>
          </div>
      </div>

      <button 
        onClick={handleStop}
        className="mt-12 flex items-center gap-2 text-gray-500 border border-gray-800 px-6 py-2 hover:bg-red-900/20 hover:text-red-500 transition-colors"
      >
        {isDuel ? <Swords size={16} /> : <Power size={16} />}
        <span className="text-xs font-bold">{isDuel ? 'FORFEIT MATCH' : 'ABORT SEQUENCE'}</span>
      </button>
    </div>
  );
};
