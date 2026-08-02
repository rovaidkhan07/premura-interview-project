import React, { useEffect, useRef } from 'react';
import { Message } from '../types/types';
import { MessageSquare, Bot, User, ShieldAlert, Sparkles } from 'lucide-react';

interface LiveTranscriptProps {
  messages: Message[];
  isActive: boolean;
}

export function LiveTranscript({ messages, isActive }: LiveTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="glass-panel rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 h-[420px] flex flex-col shadow-xl">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
        <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          Live Conversation Transcript
        </h2>

        {isActive && (
          <span className="flex items-center gap-1.5 text-xs text-cyan-400 font-medium bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            Streaming Real-time
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-6">
            <div className="w-12 h-12 rounded-full bg-slate-800/60 flex items-center justify-center mb-3 text-slate-400">
              <Bot className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-400">No active call transcript</p>
            <p className="text-xs text-slate-600 mt-1 max-w-xs">
              Click &quot;Start AI Call&quot; to begin lead qualification and live voice interaction.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAI = msg.speaker === 'assistant' || msg.speaker === 'AI' || msg.speaker === 'bot';
            const isSystem = msg.speaker === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800/80 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-cyan-400" /> {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isAI ? 'flex-row' : 'flex-row-reverse'}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isAI
                      ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-sm shadow-cyan-500/20'
                      : 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  }`}
                >
                  {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    isAI
                      ? 'bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-tl-none shadow-sm'
                      : 'bg-cyan-600/90 text-white rounded-tr-none shadow-sm shadow-cyan-600/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <span className="font-semibold text-[10px] uppercase opacity-75">
                      {isAI ? 'Solar AI Assistant (Sarah)' : 'Homeowner'}
                    </span>
                    <span className="text-[10px] opacity-60 font-mono">{msg.timestamp}</span>
                  </div>
                  <p>{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
