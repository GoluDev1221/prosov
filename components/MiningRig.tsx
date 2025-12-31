
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { AlertOctagon, Power, Swords, Volume2, VolumeX, ExternalLink, ShieldCheck } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

export const MiningRig: React.FC = () => {
  const { stopMining, miningStartTime, miningMode, callsign } = useStore();
  const [elapsed, setElapsed] = useState(0);
  const [failed, setFailed] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [studyMode, setStudyMode] = useState(false);
  
  // Refs for Audio
  const ambientRef = useRef<HTMLAudioElement | null>(null);
  const sirenRef = useRef<HTMLAudioElement | null>(null);

  const isDuel = miningMode === 'DUEL';
  const themeColor = isDuel ? 'text-red-500' : 'text-[#00f7ff]';
  const borderColor = isDuel ? 'border-red-500' : 'border-[#00f7ff]';
  const shadowColor = isDuel ? 'shadow-[0_0_50px_rgba(239,68,68,0.2)]' : 'shadow-[0_0_50px_rgba(0,247,255,0.2)]';

  // Audio Initialization
  useEffect(() => {
    // Ambient: Dark Drone (Deep focus)
    ambientRef.current = new Audio('https://cdn.pixabay.com/audio/2022/10/05/audio_6862569947.mp3');
    ambientRef.current.loop = true;
    ambientRef.current.volume = 0.5;

    // Siren: WW2 Air Raid Siren (Distinct Warning)
    sirenRef.current = new Audio('https://cdn.pixabay.com/audio/2021/08/09/audio_0ac4267e37.mp3');
    sirenRef.current.loop = true;
    sirenRef.current.volume = 1.0;

    if (soundEnabled) {
        ambientRef.current.play().catch(e => console.log("Audio play failed:", e));
    }

    return () => {
        ambientRef.current?.pause();
        sirenRef.current?.pause();
    };
  }, []);

  // Toggle Sound Logic
  useEffect(() => {
      if (!ambientRef.current || !sirenRef.current) return;
      
      if (failed) {
          ambientRef.current.pause();
          if (soundEnabled) sirenRef.current.play().catch(() => {});
      } else {
          sirenRef.current.pause();
          sirenRef.current.currentTime = 0;
          if (soundEnabled) ambientRef.current.play().catch(() => {});
          else ambientRef.current.pause();
      }
  }, [soundEnabled, failed]);

  // Focus & Anti-Cheat Logic
  useEffect(() => {
    const handleVisibilityChange = () => {
      // If user is in "Study Mode" (e.g. watching PW.LIVE), we ignore visibility changes
      if (studyMode) return;

      if (document.hidden) {
        setFailed(true);
        // Haptic feedback for mobile
        if (navigator.vibrate) navigator.vibrate([500, 200, 500]); 
      }
    };
    
    // Timer Logic
    const timer = setInterval(() => {
        if (!miningStartTime) return;
        // Use Date.now() delta so timer is accurate even if tab throttled in background during Study Mode
        const diff = Math.floor((Date.now() - miningStartTime) / 1000);
        setElapsed(diff);
    }, 1000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(timer);
    };
  }, [miningStartTime, studyMode]);

  const handleStop = () => {
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
      
      {/* Sound Toggle */}
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
            <InfoTooltip text="Strict focus enforced. Switching tabs or closing app triggers the Siren and forfeits rewards. Use the link below for whitelisted study material." />
        </p>
        <p className={`${themeColor} text-sm animate-pulse`}>
            {studyMode ? 'EXTERNAL LINK ACTIVE: PW.LIVE' : 'DO NOT EXIT THE MATRIX'}
        </p>
        <p className="text-[10px] text-gray-600">OPERATOR: {callsign}</p>
      </div>

      {/* Progress Bar */}
      <div className="mt-8 w-full max-w-xs">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>YIELD</span>
              <span>{isDuel ? 'WINNER TAKES ALL' : `EST. +$${Math.floor(elapsed / 60) * 10}`}</span>
          </div>
          <div className="h-1 bg-gray-900 w-full">
              <div className={`h-full ${isDuel ? 'bg-red-500' : 'bg-[#00f7ff]'} transition-all`} style={{ width: `${(elapsed % 60) / 60 * 100}%` }}></div>
          </div>
      </div>

      {/* Actions */}
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
