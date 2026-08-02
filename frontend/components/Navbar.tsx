import React from 'react';
import { PhoneCall, Sparkles, Database, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  activeCallsCount?: number;
}

export function Navbar({ activeCallsCount = 0 }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <PhoneCall className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              SolarVoice AI <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
            </h1>
            <p className="text-xs text-slate-400">AI Voice Appointment Setter (Vapi + Supabase)</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className={`w-2 h-2 rounded-full ${activeCallsCount > 0 ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span>{activeCallsCount > 0 ? `${activeCallsCount} Active Call` : 'System Ready'}</span>
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Supabase Sync</span>
          </div>
        </div>
      </div>
    </header>
  );
}
