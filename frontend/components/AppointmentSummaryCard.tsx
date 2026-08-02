import React from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, CalendarPlus } from 'lucide-react';
import { Appointment } from '../types/types';

interface AppointmentSummaryCardProps {
  appointment?: Appointment;
}

export function AppointmentSummaryCard({ appointment }: AppointmentSummaryCardProps) {
  if (!appointment) {
    return (
      <div className="glass-panel rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 shadow-xl">
        <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          Booked Solar Consultation
        </h2>

        <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500">
          <CalendarPlus className="w-10 h-10 mb-2 opacity-40 text-slate-400" />
          <p className="text-xs text-slate-400 font-medium">No Appointment Booked Yet</p>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Appointment details will automatically sync here once booked by AI.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          Booked Solar Consultation
        </h2>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Confirmed
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3 text-cyan-400" /> Date
          </span>
          <p className="text-sm font-bold text-slate-100">{appointment.date}</p>
        </div>

        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1 mb-1">
            <Clock className="w-3 h-3 text-amber-400" /> Scheduled Time
          </span>
          <p className="text-sm font-bold text-slate-100">{appointment.time}</p>
        </div>
      </div>

      {appointment.notes && (
        <p className="text-xs text-slate-400 mt-3 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/60">
          <span className="font-semibold text-slate-300">Notes:</span> {appointment.notes}
        </p>
      )}
    </div>
  );
}
