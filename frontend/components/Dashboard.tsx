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
    speakText,
    setActiveStage,
    setTranscripts,
    startWebCall,
    stopWebCall
  } = useVapiCall({
    onTranscript: (newMsg) => {
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

  const addMessageAndSpeak = (content: string, speaker: 'assistant' | 'user' = 'assistant', stage?: AgentStage) => {
    const newMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      speaker,
      content,
      timestamp: new Date().toLocaleTimeString()
    };
    setTranscripts((prev) => [...prev, newMsg]);
    if (stage) setActiveStage(stage);

    if (speaker === 'assistant') {
      speakText(content);
    }
  };

  const handleStartCallSubmit = async (formData: any) => {
    setIsStartingCall(true);
    try {
      // 1. Backend REST call to register customer & create call record
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

      // 2. Launch Vapi WebRTC session if public key is configured
      await startWebCall();

      setIsModalOpen(false);

      // 3. Audio Voice Turn 1: Greeting
      const initialText = `Hi, this is Sarah from the neighborhood energy consultation team. Am I speaking with ${formData.name}?`;
      addMessageAndSpeak(initialText, 'assistant', 'Greeting');

      // 4. Automated voice conversation progression
      setTimeout(() => {
        addMessageAndSpeak(`Yes, this is ${formData.name}.`, 'user', 'Verify Homeowner');
      }, 4000);

      setTimeout(() => {
        const verifyText = `Great! I'm calling regarding your property at ${formData.address}. We're helping homeowners lower their monthly power bills. Would a free solar consultation sound helpful?`;
        addMessageAndSpeak(verifyText, 'assistant', 'Reason For Call');
      }, 7500);

      setTimeout(() => {
        addMessageAndSpeak(`Sure, I currently pay around $${formData.energy_bill} a month on electric bills.`, 'user', 'Qualification');
      }, 12500);

      setTimeout(() => {
        const bookText = `That's great! Based on your $${formData.energy_bill} bill, you could save over 40%. Let's schedule a free 15-minute consultation. We have next Monday at 2:00 PM open, does that work?`;
        addMessageAndSpeak(bookText, 'assistant', 'Appointment Booking');
      }, 16000);

      setTimeout(() => {
        addMessageAndSpeak(`Yes, Monday at 2:00 PM works perfect for me!`, 'user', 'Confirmation');

        const nextMonday = new Date();
        nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7));
        const dateStr = nextMonday.toISOString().split('T')[0];

        setActiveAppointment({
          call_id: callData.callId,
          date: dateStr,
          time: '02:00 PM',
          status: 'confirmed',
          notes: `Qualified homeowner ${formData.name}. Avg bill: $${formData.energy_bill}`
        });
      }, 21000);

      setTimeout(() => {
        const confirmText = `Awesome! I've booked your appointment for next Monday at 2:00 PM. Have a wonderful day!`;
        addMessageAndSpeak(confirmText, 'assistant', 'Completed');
      }, 24000);

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