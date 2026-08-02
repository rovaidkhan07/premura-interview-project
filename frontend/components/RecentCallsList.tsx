import React, { useState } from 'react';
import { CallHistoryItem } from '../types/types';
import { History, PhoneCall, Calendar, ChevronRight, User, CheckCircle2, XCircle, Search, MessageSquare } from 'lucide-react';

interface RecentCallsListProps {
  history: CallHistoryItem[];
  onRefresh?: () => void;
}

export function RecentCallsList({ history }: RecentCallsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCall, setSelectedCall] = useState<CallHistoryItem | null>(null);

  const filteredHistory = history.filter((item) =>
    item.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="glass-panel rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            Recent AI Call History & Logs
          </h2>
          <p className="text-xs text-slate-400">Recorded sessions synced with Supabase</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search leads or status..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>

      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
        {filteredHistory.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No call records found in database history.
          </div>
        ) : (
          filteredHistory.map((item) => {
            const isSuccess = item.status === 'completed' || item.appointment;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedCall(item)}
                className="group p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isSuccess
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    <User className="w-4 h-4" />
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">
                      {item.customer_name}
                    </h4>
                    <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{new Date(item.start_time).toLocaleString()}</span>
                      {item.stage && <span className="text-slate-400">• Stage: {item.stage}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {item.appointment && (
                    <span className="hidden md:flex items-center gap-1 text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      <Calendar className="w-3 h-3" /> Appt Booked
                    </span>
                  )}

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      item.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : item.status === 'active'
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 animate-pulse'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {item.status}
                  </span>

                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal detail view for selected call */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl glass-panel bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setSelectedCall(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors text-xs font-semibold px-2 py-1 bg-slate-800 rounded-lg"
            >
              Close
            </button>

            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-1">
              Call Session Details: {selectedCall.customer_name}
            </h3>
            <p className="text-xs text-slate-400 mb-4">Call ID: {selectedCall.id}</p>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1 custom-scrollbar">
              {selectedCall.customer && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                  <p className="font-semibold text-cyan-400">Homeowner Information:</p>
                  <p className="text-slate-300">Address: {selectedCall.customer.address}, {selectedCall.customer.zip_code}</p>
                  <p className="text-slate-300">Electric Bill: ${selectedCall.customer.energy_bill}/mo | Built: {selectedCall.customer.home_year}</p>
                </div>
              )}

              {selectedCall.appointment && (
                <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-500/30 text-xs">
                  <p className="font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Booked Appointment
                  </p>
                  <p className="text-slate-200 mt-1">Date: {selectedCall.appointment.date} at {selectedCall.appointment.time}</p>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" /> Session Transcript ({selectedCall.messages?.length || 0} turns)
                </h4>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 max-h-48 overflow-y-auto">
                  {selectedCall.messages && selectedCall.messages.length > 0 ? (
                    selectedCall.messages.map((m, idx) => (
                      <div key={idx} className="text-xs">
                        <span className="font-semibold text-cyan-400 uppercase text-[10px]">{m.speaker}: </span>
                        <span className="text-slate-300">{m.content}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-600">No transcript logs recorded for this call.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
