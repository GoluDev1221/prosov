
import React, { useEffect, useState } from 'react';
import { useStore } from './store';
import { getDaysRemaining, getDefconLevel } from './utils';
import { ArchetypeSelector } from './components/ArchetypeSelector';
import { Command } from './components/Command';
import { Intel } from './components/Intel';
import { MiningRig } from './components/MiningRig';
import { BlackMarket } from './components/BlackMarket';
import { Arena } from './components/Arena';
import { Syndicates } from './components/Syndicates';
import { Manual } from './components/Manual';
import { Profile } from './components/Profile';
import { Auth } from './components/Auth';
import { Shield, Map, Cpu, ShoppingBag, Swords, Terminal, Wifi, Radio, Users, WifiOff } from 'lucide-react';

const App: React.FC = () => {
  const { id, archetype, isMining, updateDecay, connectToNetwork, onlineStatus, activeUsers, showManual, showProfile, checkIntegrity } = useStore();
  const [currentView, setCurrentView] = useState<'COMMAND' | 'INTEL' | 'MARKET' | 'ARENA' | 'SYNDICATE'>('COMMAND');
  const [defcon, setDefcon] = useState(5);

  // Initialize checks
  useEffect(() => {
    checkIntegrity(); // Validate session on load
    updateDecay();
    const days = getDaysRemaining();
    setDefcon(getDefconLevel(days));
    connectToNetwork(); 
  }, [id]); // Re-run when ID changes (login/logout)

  // 1. If not authenticated, show Auth Screen
  if (!id) {
    return <Auth />;
  }

  // 2. If authenticated but no archetype, show Selector
  if (!archetype) {
    return <ArchetypeSelector />;
  }

  if (isMining) {
    return <MiningRig />;
  }

  // Visual Theme based on DEFCON
  const isCritical = defcon === 1;
  const themeColor = isCritical ? 'text-red-500 border-red-500' : 'text-[#00f7ff] border-[#00f7ff]';
  const glowClass = isCritical ? 'shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'shadow-[0_0_20px_rgba(0,247,255,0.15)]';

  return (
    <div className={`min-h-screen bg-[#050505] font-mono selection:bg-[#00f7ff] selection:text-black flex flex-col pb-24 ${isCritical ? 'animate-pulse-slow' : ''}`}>
      
      {showManual && <Manual />}
      {showProfile && <Profile />}

      {/* Header */}
      <header className={`p-4 border-b border-opacity-20 flex justify-between items-center ${themeColor} bg-black/80 backdrop-blur-md sticky top-0 z-40`}>
        <div className="flex items-center gap-2">
          <Terminal size={20} />
          <span className="font-bold tracking-widest text-lg">PROsov.v4</span>
        </div>
        
        <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 text-[9px] tracking-widest border border-gray-800 px-2 py-1 bg-black/50 ${
                onlineStatus === 'ONLINE' ? 'text-[#00f7ff]' : 
                onlineStatus === 'ERROR' ? 'text-red-500' : 'text-yellow-500'
            }`}>
                {onlineStatus === 'ONLINE' ? <Wifi size={12} /> : 
                 onlineStatus === 'ERROR' ? <WifiOff size={12} /> : 
                 <Radio size={12} className="animate-spin" />}
                
                <span>
                  {onlineStatus === 'ONLINE' ? `NET: ONLINE (${activeUsers})` : 
                   onlineStatus === 'ERROR' ? 'NET: OFFLINE' : 'SYNCING...'}
                </span>
            </div>
            <div className={`text-xs px-2 py-1 border ${themeColor} ${glowClass}`}>
            DEFCON {defcon}
            </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 max-w-4xl mx-auto w-full overflow-hidden">
        {currentView === 'COMMAND' && <Command defcon={defcon} />}
        {currentView === 'INTEL' && <Intel />}
        {currentView === 'MARKET' && <BlackMarket />}
        {currentView === 'ARENA' && <Arena />}
        {currentView === 'SYNDICATE' && <Syndicates />}
      </main>

      {/* Navigation Deck */}
      <nav className={`fixed bottom-0 left-0 w-full bg-black border-t border-gray-800 p-2 flex justify-around items-end z-50 backdrop-blur-md`}>
        <NavBtn 
          icon={<Cpu size={20} />} 
          label="CMD" 
          active={currentView === 'COMMAND'} 
          onClick={() => setCurrentView('COMMAND')}
          color={themeColor} 
        />
        <NavBtn 
          icon={<Map size={20} />} 
          label="INTEL" 
          active={currentView === 'INTEL'} 
          onClick={() => setCurrentView('INTEL')}
          color={themeColor} 
        />
        
        <div className="relative -top-6">
           <button 
            onClick={() => useStore.getState().startMining()}
            className={`w-16 h-16 bg-black border-2 ${themeColor} ${glowClass} rounded-full flex items-center justify-center hover:bg-[#00f7ff] hover:text-black transition-all active:scale-95`}
           >
             <Shield size={32} />
           </button>
        </div>

        <NavBtn 
          icon={<ShoppingBag size={20} />} 
          label="MKT" 
          active={currentView === 'MARKET'} 
          onClick={() => setCurrentView('MARKET')}
          color={themeColor} 
        />
        <NavBtn 
          icon={<Users size={20} />} 
          label="SYN" 
          active={currentView === 'SYNDICATE'} 
          onClick={() => setCurrentView('SYNDICATE')}
          color={themeColor} 
        />
         <NavBtn 
          icon={<Swords size={20} />} 
          label="PVP" 
          active={currentView === 'ARENA'} 
          onClick={() => setCurrentView('ARENA')}
          color={themeColor} 
        />
      </nav>
    </div>
  );
};

const NavBtn = ({ icon, label, active, onClick, color }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 ${active ? color : 'text-gray-600'} transition-colors`}
  >
    {icon}
    <span className="text-[10px] tracking-wider font-bold">{label}</span>
  </button>
);

export default App;
