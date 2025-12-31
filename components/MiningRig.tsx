
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { AlertOctagon, Power, Swords, Volume2, VolumeX, ExternalLink, ShieldCheck } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

export const MiningRig: React.FC = () => {
  const { stopMining, miningStartTime, miningMode, callsign } = useStore();
  
  // Initialize elapsed time based on actual start time to handle refreshes
  const getElapsed = () => {
      if (!miningStartTime) return 0;
      return Math.floor((Date.now() - miningStartTime) / 1000);
  };

  const [elapsed, setElapsed] = useState(getElapsed());
  const [failed, setFailed] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [studyMode, setStudyMode] = useState(false);
  
  // Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sirenIntervalRef = useRef<number | null>(null);

  const isDuel = miningMode === 'DUEL';
  const themeColor = isDuel ? 'text-red-500' : 'text-[#00f7ff]';
  const borderColor = isDuel ? 'border-red-500' : 'border-[#00f7ff]';
  const shadowColor = isDuel ? 'shadow-[0_0_50px_rgba(239,68,68,0.2)]' : 'shadow-[0_0_50px_rgba(0,247,255,0.2)]';

  // Initialize Audio Context on Mount
  useEffect(() => {
    const initAudio = async () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            
            const ctx = new AudioContext();
            audioCtxRef.current = ctx;
            
            // Resume context if suspended (browser policy)
            if (ctx.state === 'suspended') {
                try { await ctx.resume(); } catch(e) { console.warn("Audio resume failed", e); }
            }
        } catch (e) {
            console.error("Audio Init Failed", e);
        }
    };
    initAudio();

    return () => {
        stopSiren();
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
             audioCtxRef.current.close().catch(() => {});
        }
    };
  }, []);

  const startSiren = () => {
      if (!soundEnabled || !audioCtxRef.current) return;
      
      const ctx = audioCtxRef.current;
      if (ctx.state === 'closed') return;

      stopSiren(); // Clear existing

      try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sawtooth';
          gain.gain.value = 0.3; 
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();

          oscRef.current = osc;
          gainRef.current = gain;

          const modulate = () => {
              if (ctx.state === 'closed') return;
              const now = ctx.currentTime;
              osc.frequency.cancelScheduledValues(now);
              osc.frequency.setValueAtTime(800, now);
              osc.frequency.linearRampToValueAtTime(1500, now + 0.5);
              osc.frequency.linearRampToValueAtTime(800, now + 1.0);
          };

          modulate();
          sirenIntervalRef.current = window.setInterval(modulate, 1000);
      } catch (e) {
          console.error("Siren start failed", e);
      }
  };

  const stopSiren = () => {
      if (oscRef.current) {
          try { oscRef.current.stop(); } catch (e) {}
          try { oscRef.current.disconnect(); } catch (e) {}
          oscRef.current = null;
      }
      if (gainRef.current) {
          try { gainRef.current.disconnect(); } catch (e) {}
          gainRef.current = null;
      }
      if (sirenIntervalRef.current) {
          clearInterval(sirenIntervalRef.current);
          sirenIntervalRef.current = null;
      }
  };

  useEffect(() => {
      if (failed && soundEnabled) {
          startSiren();
      } else {
          stopSiren();
      }
  }, [soundEnabled, failed]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (studyMode) return;
      if (document.hidden) {
        setFailed(true);
        if (navigator.vibrate) navigator.vibrate([500, 200, 500]); 
      }
    };
    
    // Accurate Timer Logic
    const timer = setInterval(() => {
        if (!miningStartTime) return;
        setElapsed(Math.floor((Date.now() - miningStartTime) / 1000));
    }, 1000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(timer);
    };
  }, [miningStartTime, studyMode]);

  const handleStop = () => {
    stopSiren();
    const minutes = Math.floor(elapsed / 60);
    stopMining(!failed, minutes);
  };

  const openStudyPortal = () => {
      setStudyMode(true);
      window.open('https://pw.live', '_blank');
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
        <h1 className="text-4xl font-black text-white tracking-widest mb-2 text-center">BREACH DETECTED</h1>
        <p className="text-white font-mono mb-8 text-center px-4">
            {isDuel ? 'FOCUS LOST during combat.' : 'Tab switching violates Deep Work protocol.'}
        </p>
        <button 
          onClick={handleStop}
          className="bg-black text-white px-8 py-3 font-mono border border-white hover:bg-white hover:text-black font-bold tracking-widest"
        >
          ACKNOWLEDGE FAILURE
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
      
      <button 
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="absolute top-4 right-4 text-gray-500 hover:text-white"
      >
          {soundEnabled ? <Volume2 /> : <VolumeX />}
      </button>

      {/* Timer Display */}
      <div className={`w-64 h-64 border-2 ${borderColor} rounded-full flex items-center justify-center relative ${shadowColor} transition-all duration-1000`}>
        <div className={`absolute inset-0 border-t-2 ${borderColor} rounded-full animate-spin`}></div>
        <div className="flex flex-col items-center">
            <div className={`text-5xl font-mono ${themeColor} font-bold`}>
                {formatTime(elapsed)}
            </div>
            {studyMode && (
                <span className="text-[10px] text-green-500 font-bold mt-2 flex items-center gap-1 animate-pulse">
                    <ShieldCheck size={10} /> LINK ESTABLISHED
                </span>
            )}
        </div>
      </div>
      
      <div className="mt-8 text-center space-y-2">
        <p className="text-gray-500 tracking-widest text-xs flex items-center justify-center">
            {isDuel ? 'DUEL IN PROGRESS' : 'MINING IN PROGRESS'}
            <InfoTooltip text="Strict focus enforced. Switching tabs or closing app triggers the Siren and forfeits rewards." />
        </p>
        <p className={`${themeColor} text-sm animate-pulse`}>
            {studyMode ? 'EXTERNAL LINK ACTIVE: PW.LIVE' : 'DO NOT EXIT THE MATRIX'}
        </p>
        <p className="text-[10px] text-gray-600">OPERATOR: {callsign}</p>
      </div>

      <div className="mt-8 w-full max-w-xs">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>YIELD</span>
              <span>{isDuel ? 'WINNER TAKES ALL' : `EST. +$${Math.floor(elapsed / 60) * 10}`}</span>
          </div>
          <div className="h-1 bg-gray-900 w-full">
              <div className={`h-full ${isDuel ? 'bg-red-500' : 'bg-[#00f7ff]'} transition-all`} style={{ width: `${(elapsed % 60) / 60 * 100}%` }}></div>
          </div>
      </div>

      <div className="mt-12 flex flex-col gap-4 w-full max-w-xs">
          
          {!isDuel && !studyMode && (
             <button 
                onClick={openStudyPortal}
                className="flex items-center justify-center gap-2 text-[#00f7ff] border border-[#00f7ff]/30 px-6 py-3 hover:bg-[#00f7ff]/10 transition-colors"
             >
                <ExternalLink size={16} />
                <span className="text-xs font-bold">OPEN STUDY PORTAL (PW.LIVE)</span>
             </button>
          )}

          <button 
            onClick={handleStop}
            className="flex items-center justify-center gap-2 text-gray-500 border border-gray-800 px-6 py-3 hover:bg-red-900/20 hover:text-red-500 transition-colors"
          >
            {isDuel ? <Swords size={16} /> : <Power size={16} />}
            <span className="text-xs font-bold">{isDuel ? 'FORFEIT MATCH' : 'END SESSION'}</span>
          </button>
      </div>
    </div>
  );
};
