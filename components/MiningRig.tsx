
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { AlertOctagon, Power, Swords, Volume2, VolumeX, ExternalLink, ShieldCheck, Eye, Mic, Activity } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

export const MiningRig: React.FC = () => {
  const { stopMining, miningStartTime, miningMode, callsign } = useStore();
  
  const getElapsed = () => {
      if (!miningStartTime) return 0;
      return Math.floor((Date.now() - miningStartTime) / 1000);
  };

  const [elapsed, setElapsed] = useState(getElapsed());
  const [failed, setFailed] = useState(false);
  const [failReason, setFailReason] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [studyMode, setStudyMode] = useState(false);
  
  // Panopticon States
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [handshakeActive, setHandshakeActive] = useState(false);
  const [handshakeTimer, setHandshakeTimer] = useState(0);
  
  // Refs for Logic (Refs allow synchronous access inside event listeners)
  const studyModeRef = useRef(false); 
  const noiseViolationRef = useRef(0);
  const darknessViolationRef = useRef(0);
  const wakeLockRef = useRef<any>(null);
  const lastTickRef = useRef<number>(Date.now());
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sirenIntervalRef = useRef<number | null>(null);
  
  // Streams
  const micStreamRef = useRef<MediaStream | null>(null);
  const camStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const isDuel = miningMode === 'DUEL';
  const themeColor = isDuel ? 'text-red-500' : 'text-[#00f7ff]';
  const borderColor = isDuel ? 'border-red-500' : 'border-[#00f7ff]';
  const shadowColor = isDuel ? 'shadow-[0_0_50px_rgba(239,68,68,0.2)]' : 'shadow-[0_0_50px_rgba(0,247,255,0.2)]';

  // --- 1. BIOMETRIC INITIALIZATION (Camera & Mic) ---
  useEffect(() => {
    const initBiometrics = async () => {
        try {
            // Camera (Low res is fine for brightness detection)
            const vStream = await navigator.mediaDevices.getUserMedia({ video: { width: 100, height: 100, facingMode: 'user' } });
            camStreamRef.current = vStream;
            if (videoRef.current) {
                videoRef.current.srcObject = vStream;
                videoRef.current.play();
            }

            // Microphone
            const aStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micStreamRef.current = aStream;
            
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioCtx.createAnalyser();
            const source = audioCtx.createMediaStreamSource(aStream);
            source.connect(analyser);
            analyser.fftSize = 256;
            analyserRef.current = analyser;

        } catch (e) {
            console.error("Biometric Init Failed", e);
            // In strict mode (V5), we would fail here. For now, we allow it but warn.
        }
    };
    initBiometrics();

    return () => {
        if (camStreamRef.current) camStreamRef.current.getTracks().forEach(t => t.stop());
        if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  // --- 2. AUDIO & VIDEO ANALYSIS LOOP ---
  useEffect(() => {
      const analyze = () => {
          if (failed) return;

          // A. Audio Analysis (Laughing/Distraction)
          if (analyserRef.current) {
              const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
              analyserRef.current.getByteFrequencyData(dataArray);
              const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
              setNoiseLevel(avg);

              // Threshold > 50 roughly catches talking/laughing. 
              if (avg > 50 && !handshakeActive) { 
                   noiseViolationRef.current += 1;
                   // Require ~3 seconds of noise (assuming 60fps ~ 180 frames)
                   if (noiseViolationRef.current > 180) {
                        setFailed(true);
                        setFailReason("AUDIO ANOMALY: SUSTAINED CONVERSATION OR LAUGHTER DETECTED.");
                   }
              } else {
                   noiseViolationRef.current = Math.max(0, noiseViolationRef.current - 1); // Cool down
              }
          }

          // B. Video Analysis (Phone Face Down / Darkness)
          if (videoRef.current) {
              const canvas = document.createElement('canvas');
              canvas.width = 10;
              canvas.height = 10;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                  ctx.drawImage(videoRef.current, 0, 0, 10, 10);
                  const frame = ctx.getImageData(0, 0, 10, 10);
                  let totalBrightness = 0;
                  for (let i = 0; i < frame.data.length; i += 4) {
                      totalBrightness += (frame.data[i] + frame.data[i + 1] + frame.data[i + 2]) / 3;
                  }
                  const avgBrightness = totalBrightness / (frame.data.length / 4);
                  setBrightness(avgBrightness);

                  if (avgBrightness < 5) { // Total darkness
                       darknessViolationRef.current += 1;
                       // Require ~5 seconds of darkness (300 frames) to prevent blink/hand wave failures
                       if (darknessViolationRef.current > 300) {
                           setFailed(true);
                           setFailReason("OPTICAL SENSOR OCCLUDED. KEEP DEVICE VISIBLE.");
                       }
                  } else {
                       darknessViolationRef.current = 0;
                  }
              }
          }

          requestAnimationFrame(analyze);
      };
      const raf = requestAnimationFrame(analyze);
      return () => cancelAnimationFrame(raf);
  }, [failed, handshakeActive]);

  // --- 3. NEURAL HANDSHAKE (Random Integrity Check) ---
  useEffect(() => {
      // Trigger a check every 3-7 minutes randomly
      const nextCheckTime = Math.random() * (7 - 3) * 60 * 1000 + 3 * 60 * 1000;
      
      const timeout = setTimeout(() => {
          triggerHandshake();
      }, nextCheckTime);

      return () => clearTimeout(timeout);
  }, [handshakeActive]); 

  const triggerHandshake = () => {
      if (failed) return;
      setHandshakeActive(true);
      setHandshakeTimer(15); 
      
      // Play Alarm Sound
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.5);
      gain.gain.value = 0.5;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1);
  };

  // Handshake Countdown
  useEffect(() => {
      let interval: any;
      if (handshakeActive && handshakeTimer > 0) {
          interval = setInterval(() => {
              setHandshakeTimer(prev => prev - 1);
          }, 1000);
      } else if (handshakeActive && handshakeTimer <= 0) {
          setFailed(true);
          setFailReason("NEURAL HANDSHAKE MISSED. ATTENTION DRIFT DETECTED.");
          setHandshakeActive(false);
      }
      return () => clearInterval(interval);
  }, [handshakeActive, handshakeTimer]);


  // --- 4. STANDARD CHECKS (Wake Lock, Back Button, Visibility) ---
  useEffect(() => {
    // Wake Lock
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try { wakeLockRef.current = await (navigator as any).wakeLock.request('screen'); } 
        catch (err) { console.warn('Wake Lock request failed:', err); }
      }
    };
    requestWakeLock();

    // Back Button Trap
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    // Visibility & Blur (Split Screen) Protection
    const handleVisibilityChange = () => {
      if (studyModeRef.current) return; // SAFEGUARD: Ignore if strictly in study mode
      if (document.hidden) {
        setFailed(true);
        setFailReason(isDuel ? 'FOCUS LOST (BACKGROUNDED).' : 'PROTOCOL BREACH: APP BACKGROUNDED.');
      }
    };

    const handleBlur = () => {
        if (studyModeRef.current) return;
        // Optional: We can be lenient on blur for desktop users (clicking desktop), 
        // but for strict mobile mining, blur usually means split screen interaction.
        // We will warn or fail. Let's Fail to be strict.
        setFailed(true);
        setFailReason("FOCUS LOST (WINDOW BLURRED). DO NOT MULTITASK.");
    };
    
    // Hibernation Check
    const timer = setInterval(() => {
        if (!miningStartTime) return;
        const now = Date.now();
        const delta = now - lastTickRef.current;
        lastTickRef.current = now;

        if (delta > 5000) {
             setFailed(true);
             setFailReason('TEMPORAL ANOMALY: SYSTEM HIBERNATION DETECTED.');
             clearInterval(timer);
             return;
        }
        setElapsed(Math.floor((now - miningStartTime) / 1000));
    }, 1000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('popstate', handlePopState);
      if (wakeLockRef.current) wakeLockRef.current.release().catch(() => {});
      clearInterval(timer);
    };
  }, [miningStartTime]);

  // --- AUDIO SIREN FOR FAILURE ---
  useEffect(() => {
    // Try to resume audio context if it was suspended (user gesture required policy)
    const initAudio = async () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            audioCtxRef.current = ctx;
            if (ctx.state === 'suspended') await ctx.resume();
        } catch (e) {}
    };
    initAudio();
    return () => { stopSiren(); if (audioCtxRef.current) audioCtxRef.current.close().catch(()=>{}); };
  }, []);

  const startSiren = () => {
      if (!soundEnabled || !audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      // Re-check resume
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      if (ctx.state === 'closed') return;

      stopSiren();
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
              osc.frequency.setValueAtTime(800, now);
              osc.frequency.linearRampToValueAtTime(1500, now + 0.5);
              osc.frequency.linearRampToValueAtTime(800, now + 1.0);
          };
          modulate();
          sirenIntervalRef.current = window.setInterval(modulate, 1000);
      } catch (e) {}
  };

  const stopSiren = () => {
      if (oscRef.current) { try { oscRef.current.stop(); oscRef.current.disconnect(); } catch (e) {} oscRef.current = null; }
      if (gainRef.current) { try { gainRef.current.disconnect(); } catch (e) {} gainRef.current = null; }
      if (sirenIntervalRef.current) { clearInterval(sirenIntervalRef.current); sirenIntervalRef.current = null; }
  };

  useEffect(() => {
      if (failed && soundEnabled) startSiren();
      else stopSiren();
  }, [soundEnabled, failed]);

  const handleStop = () => {
    stopSiren();
    const minutes = Math.floor(elapsed / 60);
    stopMining(!failed, minutes);
  };

  const openStudyPortal = () => {
      setStudyMode(true);
      studyModeRef.current = true; // Sync ref update to block visibility check
      window.open('https://pw.live', '_blank');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- RENDER ---
  
  if (failed) {
    return (
      <div className="fixed inset-0 bg-red-900/90 z-50 flex flex-col items-center justify-center animate-pulse">
        <AlertOctagon size={64} className="text-white mb-4" />
        <h1 className="text-4xl font-black text-white tracking-widest mb-2 text-center">BREACH DETECTED</h1>
        <p className="text-white font-mono mb-8 text-center px-4 max-w-md uppercase font-bold">{failReason}</p>
        <button onClick={handleStop} className="bg-black text-white px-8 py-3 font-mono border border-white hover:bg-white hover:text-black font-bold tracking-widest">ACKNOWLEDGE FAILURE</button>
      </div>
    );
  }

  // --- NEURAL HANDSHAKE MODAL ---
  if (handshakeActive) {
      return (
          <div className="fixed inset-0 bg-[#00f7ff] z-50 flex flex-col items-center justify-center animate-pulse">
              <Activity size={80} className="text-black mb-4 animate-bounce" />
              <h1 className="text-4xl font-black text-black tracking-widest mb-2 text-center">NEURAL HANDSHAKE</h1>
              <p className="text-black font-mono font-bold mb-8 text-center px-4">
                  VERIFY PRESENCE IMMEDIATELY.<br/>
                  TIME REMAINING: {handshakeTimer}s
              </p>
              <button 
                  onClick={() => { setHandshakeActive(false); }}
                  className="bg-black text-[#00f7ff] text-2xl px-12 py-6 font-mono border-4 border-black font-bold tracking-widest hover:scale-105 transition-transform"
              >
                  ESTABLISH SYNC
              </button>
          </div>
      );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
      
      {/* Hidden Video for Analysis */}
      <video ref={videoRef} className="hidden" playsInline muted />

      <button onClick={() => setSoundEnabled(!soundEnabled)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
          {soundEnabled ? <Volume2 /> : <VolumeX />}
      </button>

      {/* Timer Display */}
      <div className={`w-64 h-64 border-2 ${borderColor} rounded-full flex items-center justify-center relative ${shadowColor} transition-all duration-1000`}>
        <div className={`absolute inset-0 border-t-2 ${borderColor} rounded-full animate-spin`}></div>
        <div className="flex flex-col items-center">
            <div className={`text-5xl font-mono ${themeColor} font-bold`}>
                {formatTime(elapsed)}
            </div>
            
            {/* Live Biometric Data */}
            <div className="flex gap-4 mt-4">
                <div className="flex flex-col items-center">
                    <div className={`flex items-center gap-1 text-[10px] ${noiseLevel > 30 ? 'text-red-500 animate-pulse' : 'text-gray-600'}`}>
                        <Mic size={10} />
                        {noiseLevel > 30 ? 'NOISE' : 'SILENT'}
                    </div>
                    <div className="w-12 h-1 bg-gray-800 mt-1">
                        <div className="h-full bg-[#00f7ff]" style={{ width: `${Math.min(noiseLevel, 100)}%` }}></div>
                    </div>
                </div>
                <div className="flex flex-col items-center">
                     <div className={`flex items-center gap-1 text-[10px] ${brightness < 20 ? 'text-red-500' : 'text-gray-600'}`}>
                        <Eye size={10} />
                        {brightness < 20 ? 'OCCLUDED' : 'VISUAL'}
                    </div>
                     <div className="w-12 h-1 bg-gray-800 mt-1">
                        <div className="h-full bg-[#00f7ff]" style={{ width: `${Math.min(brightness, 255)/255*100}%` }}></div>
                    </div>
                </div>
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
            PANOPTICON PROTOCOL ACTIVE
            <InfoTooltip text="Camera and Mic are active. Sustained noise or covering the camera triggers failure." />
        </p>
        <p className={`${themeColor} text-sm animate-pulse`}>
           {studyMode ? 'EXTERNAL LINK: PW.LIVE' : 'SURVEILLANCE ONLINE'}
        </p>
        <p className="text-[10px] text-gray-600">OPERATOR: {callsign}</p>
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
