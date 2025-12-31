
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Terminal, Shield, AlertTriangle, User, Lock } from 'lucide-react';
import { INITIAL_SYLLABUS } from '../constants';

export const Auth: React.FC = () => {
  const [view, setView] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fake domain for mapping username to email
  const DOMAIN = 'project-sovereign.local';

  const validateUsername = (u: string) => /^[a-zA-Z0-9_]{3,20}$/.test(u);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanUsername = username.trim();
    const email = `${cleanUsername}@${DOMAIN}`;

    try {
      if (!validateUsername(cleanUsername)) {
          throw new Error("INVALID FORMAT. USE 3-20 ALPHANUMERIC CHARS OR UNDERSCORE.");
      }

      if (view === 'SIGNUP') {
        // 1. Check Uniqueness manually since we can't enforce SQL constraint easily from here
        const { data: existing, error: checkError } = await supabase
            .from('profiles')
            .select('id')
            .ilike('callsign', cleanUsername) // Case-insensitive check
            .single();

        if (existing) {
            throw new Error("CODENAME ALREADY OCCUPIED");
        }
        
        // Ignore "PGRST116" error which means no rows found (good for us)
        if (checkError && checkError.code !== 'PGRST116') {
            console.error(checkError); // Log unexpected db errors
        }

        // 2. Sign Up
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;

        // 3. Create Profile
        if (authData.user) {
            const { error: profileError } = await supabase.from('profiles').insert({
                id: authData.user.id,
                callsign: cleanUsername.toUpperCase(),
                net_worth: 0,
                data: { efficiency: 1.0, syllabus: INITIAL_SYLLABUS }
            });
            
            if (profileError) {
                // Determine if it was a duplicate key error just in case race condition
                throw new Error("PROFILE CREATION FAILED. RETRY.");
            }
            
            alert("OPERATIVE REGISTERED. INITIALIZING LINK...");
            window.location.reload(); // Force reload to ensure session pick-up
        } else {
             alert("VERIFICATION REQUIRED. CHECK SYSTEM ADMIN.");
        }

      } else {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
            if (error.message.includes("Invalid login")) throw new Error("INVALID CREDENTIALS");
            throw error;
        }
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
                onClick={() => { setView('LOGIN'); setError(null); }}
                className={`flex-1 pb-2 text-xs font-bold ${view === 'LOGIN' ? 'text-[#00f7ff] border-b-2 border-[#00f7ff]' : 'text-gray-600'}`}
            >
                LOGIN
            </button>
            <button 
                 onClick={() => { setView('SIGNUP'); setError(null); }}
                 className={`flex-1 pb-2 text-xs font-bold ${view === 'SIGNUP' ? 'text-[#00f7ff] border-b-2 border-[#00f7ff]' : 'text-gray-600'}`}
            >
                REGISTER
            </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
                <label className="text-[10px] text-gray-500 tracking-wider flex items-center gap-1">
                    <User size={10} /> CODENAME (USERNAME)
                </label>
                <input 
                    type="text" 
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="e.g. NEO_01"
                    className="w-full bg-[#050505] border border-gray-700 p-3 text-white focus:border-[#00f7ff] outline-none font-bold tracking-wider"
                />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] text-gray-500 tracking-wider flex items-center gap-1">
                    <Lock size={10} /> PASSPHRASE
                </label>
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
                {loading ? 'PROCESSING...' : (view === 'LOGIN' ? 'ESTABLISH LINK' : 'CREATE IDENTITY')}
            </button>
        </form>

        <div className="mt-6 text-center">
             <div className="text-[10px] text-gray-600 flex justify-center items-center gap-2">
                 <Shield size={10} />
                 SECURE ENCRYPTED CONNECTION
             </div>
        </div>
      </div>
    </div>
  );
};
