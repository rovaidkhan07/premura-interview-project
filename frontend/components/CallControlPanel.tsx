import React from 'react';
import { Phone, PhoneOff, Mic, Volume2, Sparkles, Radio } from 'lucide-react';
import { CallStatus, AgentStage } from '../types/types';

interface CallControlPanelProps {
  status: CallStatus;
  stage: AgentStage;
  isSpeaking: boolean;
  onStartClick: () => void;
  onEndClick: () => void;
  customerName?: string;
  volumeLevel?: number;
}

export function CallControlPanel({
  status,
  stage,
  isSpeaking,
  onStartClick,
  onEndClick,
  customerName,
  volumeLevel = 0
}: CallControlPanelProps) {
  const isActive = status === 'active';

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-xl relative overflow-hidden">
      {/* Glow effect when call is active */}
      {isActive && (
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-ring" />
      )}

      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Side: Status & Stage */}
        <div className="flex items-center space-x-4 w-full md:w-auto">
          <div
            className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
              isActive
                ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30'
                : 'bg-slate-800 border border-slate-700 text-slate-400'
            }`}
          >
            {isActive ? (
              <Radio className="w-7 h-7 text-white animate-pulse" />
            ) : (
              <Mic className="w-7 h-7 text-slate-400" />
            )}

            {isActive && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                AI Voice Assistant Status
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : status === 'completed'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {isActive ? (isSpeaking ? 'AI Speaking' : 'Listening') : status}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              {customerName ? `Calling: ${customerName}` : 'Idle Session'}
            </h3>

            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Current State Machine Stage: <span className="font-semibold text-cyan-300">{stage}</span>
            </p>
          </div>
        </div>

        {/* Center: Live Soundwave Visualizer */}
        {isActive && (
          <div className="flex items-center space-x-1.5 h-8 px-4 py-2 bg-slate-950/60 rounded-full border border-slate-800/80">
            <Volume2 className="w-4 h-4 text-cyan-400 mr-1" />
            <div className="w-1.5 bg-cyan-400 rounded-full animate-soundwave-1" />
            <div className="w-1.5 bg-cyan-500 rounded-full animate-soundwave-2" />
            <div className="w-1.5 bg-blue-500 rounded-full animate-soundwave-3" />
            <div className="w-1.5 bg-cyan-400 rounded-full animate-soundwave-4" />
          </div>
        )}

        {/* Right Side: Action Buttons */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
          {!isActive ? (
            <button
              onClick={onStartClick}
              className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-2.5 group"
            >
              <Phone className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
              Start AI Call
            </button>
          ) : (
            <button
              onClick={onEndClick}
              className="w-full md:w-auto px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-lg shadow-rose-600/25 hover:shadow-rose-600/40 transition-all flex items-center justify-center gap-2.5 group"
            >
              <PhoneOff className="w-4 h-4 group-hover:scale-110 transition-transform" />
              End Call Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
