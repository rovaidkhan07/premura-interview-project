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

export function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [vapiCallId, setVapiCallId] = useState<string | undefined>(undefined);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [activeAppointment, setActiveAppointment] = useState<Appointment | undefined>(undefined);
  const [history, setHistory] = useState<CallHistoryItem[]>([]);
  const [isStartingCall, setIsStartingCall] = useState(false);

  const {
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
      // Auto advance stage based on transcript text heuristics or tool events
      if (newMsg.content.toLowerCase().includes('homeowner')) {
        setActiveStage('Verify Homeowner');
      } else if (newMsg.content.toLowerCase().includes('electric bill') || newMsg.content.toLowerCase().includes('$')) {
        setActiveStage('Qualification');
      } else if (newMsg.content.toLowerCase().includes('schedule') || newMsg.content.toLowerCase().includes('consultation')) {
        setActiveStage('Appointment Booking');
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
      // 1. Backend REST call to register customer & create call record
      const callData = await apiClient.startCall(formData);
      setActiveCallId(callData.callId);
      setVapiCallId(callData.vapiCallId);
      setActiveCustomer({
        name: formData.name,
        phone_number: formData.phone_number,
        address: formData.address,
        zip_code: formData.zip_code,
        energy_bill: formData.energy_bill,
        home_year: formData.home_year,
        primary_decisionmaker: formData.primary_decisionmaker
      });

      // Initial greeting message in transcript
      const initialGreeting: Message = {
        id: `init-${Date.now()}`,
        speaker: 'assistant',
        content: "Hi, this is Sarah from the neighborhood energy consultation team. Am I speaking with the homeowner?",
        timestamp: new Date().toLocaleTimeString()
      };
      setTranscripts([initialGreeting]);

      // 2. Launch Vapi WebRTC session if public key is configured
      await startWebCall();

      setIsModalOpen(false);
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar activeCallsCount={callStatus === 'active' ? 1 : 0} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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