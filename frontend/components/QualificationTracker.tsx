import React from 'react';
import { AgentStage, QualificationAnswer } from '../types/types';
import { CheckCircle2, Circle, HelpCircle, ShieldCheck, Zap } from 'lucide-react';

const STAGES: AgentStage[] = [
  'Greeting',
  'Verify Homeowner',
  'Reason For Call',
  'Qualification',
  'Objection Handling',
  'Appointment Booking',
  'Confirmation',
  'Completed'
];

interface QualificationTrackerProps {
  currentStage: AgentStage;
  qualifications: QualificationAnswer[];
  customerBill?: number;
  homeYear?: number;
  isDecisionMaker?: boolean;
}

export function QualificationTracker({
  currentStage,
  qualifications,
  customerBill,
  homeYear,
  isDecisionMaker
}: QualificationTrackerProps) {
  const currentStageIndex = STAGES.indexOf(currentStage);

  const qualificationItems = [
    {
      label: 'Homeowner Status',
      value: 'Verified Owner',
      isPassed: true
    },
    {
      label: 'Monthly Power Bill',
      value: customerBill ? `$${customerBill}/mo` : 'Pending',
      isPassed: Boolean(customerBill && customerBill >= 100)
    },
    {
      label: 'Home Age Qualification',
      value: homeYear ? `Built ${homeYear}` : 'Pending',
      isPassed: Boolean(homeYear)
    },
    {
      label: 'Decision Maker',
      value: isDecisionMaker ? 'Primary Maker' : 'Secondary',
      isPassed: Boolean(isDecisionMaker)
    }
  ];

  return (
    <div className="glass-panel rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 shadow-xl">
      <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-400" />
        AI State Machine & Qualification Tracker
      </h2>

      {/* State Machine Progress Bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="text-slate-400">Current Phase:</span>
          <span className="font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            State {currentStageIndex + 1}/8: {currentStage}
          </span>
        </div>

        <div className="grid grid-cols-8 gap-1 h-2 bg-slate-950 rounded-full p-0.5 border border-slate-800">
          {STAGES.map((st, idx) => {
            const isDone = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            return (
              <div
                key={st}
                title={`Stage ${idx + 1}: ${st}`}
                className={`h-full rounded-full transition-all ${
                  isDone
                    ? 'bg-emerald-500'
                    : isCurrent
                    ? 'bg-cyan-400 animate-pulse'
                    : 'bg-slate-800'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Lead Qualification Criteria */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Qualification Criteria
        </h3>
        {qualificationItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
          >
            <div className="flex items-center gap-2">
              {item.isPassed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-600 shrink-0" />
              )}
              <span className="text-slate-300 font-medium">{item.label}</span>
            </div>

            <span
              className={`font-semibold px-2 py-0.5 rounded ${
                item.isPassed
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
