'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { CallControlPanel } from './CallControlPanel';
import { CustomerFormModal } from './CustomerFormModal';
import { LiveTranscript } from './LiveTranscript';
import { QualificationTracker } from './QualificationTracker';
import { AppointmentSummaryCard } from './AppointmentSummaryCard';
import { RecentCallsList } from './RecentCallsList';
import { apiClient } from '../services/apiClient';
import { useVapiCall } from '../hooks/useVapiCall';
import { CallStatus, AgentStage, Message, Appointment, Customer, CallHistoryItem } from '../types/types';
import { Key, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

export function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [vapiCallId, setVapiCallId] = useState<string | undefined>(undefined);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [activeAppointment, setActiveAppointment] = useState<Appointment | undefined>(undefined);
  const [history, setHistory] = useState<CallHistoryItem[]>([]);
  const [isStartingCall, setIsStartingCall] = useState(false);
  const [customAssistantId, setCustomAssistantId] = useState('');

  const {
    vapi,
    vapiPublicKey,
    setVapiPublicKey,
    callStatus,
    isSpeaking,
    activeStage,
    transcripts,
    volumeLevel,
    setActiveStage,
    setTranscripts,
    startWebCall,
    stopWebCall
  } = useVapiCall({
    onTranscript: (newMsg) => {
      const lower = newMsg.content.toLowerCase();
      if (lower.includes('homeowner') || lower.includes('own')) {
        setActiveStage('Verify Homeowner');
      } else if (lower.includes('electric bill') || lower.includes('power') || lower.includes('$')) {
        setActiveStage('Qualification');
      } else if (lower.includes('schedule') || lower.includes('consultation') || lower.includes('appointment')) {
        setActiveStage('Appointment Booking');
      } else if (lower.includes('confirmed') || lower.includes('see you')) {
        setActiveStage('Confirmation');
      }
    }
  });

  useEffect(() => {
    loadHistory();
    const interval = setInterval(loadHistory, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadHistory = async () => {
    try {
      const data = await apiClient.getHistory();
      setHistory(data || []);
    } catch (error) {
      console.warn('History fetch notice:', error);
    }
  };

  const handleStartCallSubmit = async (formData: any) => {
    setIsStartingCall(true);
    try {
      // 1. Backend REST call to register customer & save initial call record to Supabase
      const callData = await apiClient.startCall(formData);
      setActiveCallId(callData.callId);
      setVapiCallId(callData.vapiCallId);

      const customerRecord: Customer = {
        name: formData.name,
        phone_number: formData.phone_number,
        address: formData.address,
        zip_code: formData.zip_code,
        energy_bill: formData.energy_bill,
        home_year: formData.home_year,
        primary_decisionmaker: formData.primary_decisionmaker
      };
      setActiveCustomer(customerRecord);
      setTranscripts([]);
      setActiveAppointment(undefined);

      setIsModalOpen(false);

      // 2. Launch Live Vapi WebRTC AI Voice Session
      await startWebCall(customAssistantId || undefined);

      await loadHistory();
    } catch (error) {
      console.error('Failed to start call:', error);
      alert('Could not start call. Check backend server connection.');
    } finally {
      setIsStartingCall(false);
    }
  };

  const handleEndCall = async () => {
    stopWebCall();
    if (activeCallId) {
      try {
        await apiClient.endCall(activeCallId, vapiCallId);
      } catch (err) {
        console.error('End call error:', err);
      }
    }
    setActiveCallId(null);
    setVapiCallId(undefined);
    setActiveStage('Completed');
    await loadHistory();
  };

  const isVapiConnected = Boolean(vapiPublicKey && !vapiPublicKey.includes('your-vapi') && vapiPublicKey.startsWith('pk_'));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar activeCallsCount={callStatus === 'active' ? 1 : 0} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Vapi Live Credentials Bar */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isVapiConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {isVapiConnected ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                Live Vapi AI Voice Connection Status
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${isVapiConnected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                  {isVapiConnected ? 'Vapi WebRTC Ready' : 'Key Required'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {isVapiConnected
                  ? 'Your browser is connected to Vapi AI Voice engine. Calls will stream live microphone audio.'
                  : 'Enter your Vapi Public Key (pk_...) below to enable live bidirectional microphone voice calls.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Key className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                value={vapiPublicKey}
                onChange={(e) => setVapiPublicKey(e.target.value)}
                placeholder="Vapi Public Key (pk_...)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <input
              type="text"
              value={customAssistantId}
              onChange={(e) => setCustomAssistantId(e.target.value)}
              placeholder="Assistant ID (Optional)"
              className="w-40 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Call Control Banner */}
        <CallControlPanel
          status={callStatus}
          stage={activeStage}
          isSpeaking={isSpeaking}
          onStartClick={() => setIsModalOpen(true)}
          onEndClick={handleEndCall}
          customerName={activeCustomer?.name}
          volumeLevel={volumeLevel}
        />

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Live Transcript Stream */}
          <div className="lg:col-span-2 space-y-6">
            <LiveTranscript messages={transcripts} isActive={callStatus === 'active'} />
            <RecentCallsList history={history} onRefresh={loadHistory} />
          </div>

          {/* Column 3: AI Qualification Tracker & Booked Appointment */}
          <div className="space-y-6">
            <QualificationTracker
              currentStage={activeStage}
              qualifications={[]}
              customerBill={activeCustomer?.energy_bill}
              homeYear={activeCustomer?.home_year}
              isDecisionMaker={activeCustomer?.primary_decisionmaker}
            />

            <AppointmentSummaryCard appointment={activeAppointment} />
          </div>
        </div>
      </main>

      {/* Customer Intake Modal */}
      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleStartCallSubmit}
        isLoading={isStartingCall}
      />
    </div>
  );
}