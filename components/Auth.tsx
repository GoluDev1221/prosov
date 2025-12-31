
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Terminal, Shield, AlertTriangle } from 'lucide-react';

export const Auth: React.FC = () => {
  const [view, setView] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (view === 'SIGNUP') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert("REGISTRATION COMPLETE. VERIFY EMAIL TO INITIATE LINK.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'AUTHENTICATION FAILED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-[#00f7ff] font-mono relative overflow-hidden">
      
      {/* Background FX */}
      <div className="scanline"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#000_100%)] z-10 pointer-events-none"></div>

      <div className="z-20 w-full max-w-sm border border-[#00f7ff] bg-black p-8 shadow-[0_0_50px_rgba(0,247,255,0.1)]">
        <div className="flex items-center gap-3 mb-8 justify-center">
            <Terminal size={32} />
            <h1 className="text-2xl font-black tracking-widest">SOVEREIGN.V4</h1>
        </div>

        <div className="flex gap-4 mb-8 border-b border-gray-800 pb-1">
            <button 
                onClick={() => setView('LOGIN')}
                className={`flex-1 pb-2 text-xs font-bold ${view === 'LOGIN' ? 'text-[#00f7ff] border-b-2 border-[#00f7ff]' : 'text-gray-600'}`}
            >
                LOGIN
            </button>
            <button 
                 onClick={() => setView('SIGNUP')}
                 className={`flex-1 pb-2 text-xs font-bold ${view === 'SIGNUP' ? 'text-[#00f7ff] border-b-2 border-[#00f7ff]' : 'text-gray-600'}`}
            >
                REGISTER
            </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
            <div>
                <label className="text-[10px] text-gray-500 tracking-wider">NET LINK ID (EMAIL)</label>
                <input 
                    type="email" 
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-[#050505] border border-gray-700 p-3 text-white focus:border-[#00f7ff] outline-none"
                />
            </div>
            <div>
                <label className="text-[10px] text-gray-500 tracking-wider">ENCRYPTION KEY (PASSWORD)</label>
                <input 
                    type="password" 
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-[#050505] border border-gray-700 p-3 text-white focus:border-[#00f7ff] outline-none"
                />
            </div>

            {error && (
                <div className="flex items-center gap-2 text-red-500 text-xs border border-red-500/50 p-2 bg-red-900/10">
                    <AlertTriangle size={12} />
                    {error.toUpperCase()}
                </div>
            )}

            <button 
                disabled={loading}
                className="w-full py-4 bg-[#00f7ff] text-black font-black tracking-widest hover:bg-white transition-colors disabled:opacity-50 mt-4"
            >
                {loading ? 'ESTABLISHING UPLINK...' : (view === 'LOGIN' ? 'INITIATE SESSION' : 'CREATE OPERATIVE')}
            </button>
        </form>

        <div className="mt-6 text-center">
             <div className="text-[10px] text-gray-600 flex justify-center items-center gap-2">
                 <Shield size={10} />
                 SECURE CONNECTION REQUIRED
             </div>
        </div>
      </div>
    </div>
  );
};
