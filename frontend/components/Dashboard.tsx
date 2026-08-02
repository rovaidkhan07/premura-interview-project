'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sun, Phone, Database, ShieldCheck, Code, FileText, 
  Volume2, VolumeX, SlidersHorizontal, Radio, Bot, 
  AlertCircle, Mic, MicOff, PhoneOff, Layers, Check, 
  MessageSquare, Terminal, Zap, User, RefreshCw, Sparkles, Copy, Send 
} from 'lucide-react';
import { apiClient } from '../services/apiClient';

// Helper for Base64 to ArrayBuffer conversion
function base64ToArrayBuffer(base64: string) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper to convert PCM16 audio samples to a WAV Blob
function pcmToWav(pcm16Data: Int16Array, sampleRate = 24000) {
  const numChannels = 1;
  const sampleBits = 16;
  const buffer = new ArrayBuffer(44 + pcm16Data.length * 2);
  const view = new DataView(buffer);

  function writeString(v: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      v.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcm16Data.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (sampleBits / 8), true);
  view.setUint16(32, numChannels * (sampleBits / 8), true);
  view.setUint16(34, sampleBits, true);
  writeString(view, 36, 'data');
  view.setUint32(40, pcm16Data.length * 2, true);

  let offset = 44;
  for (let i = 0; i < pcm16Data.length; i++, offset += 2) {
    view.setInt16(offset, pcm16Data[i], true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

// Knowledge Base Objections Data
const OBJECTIONS_DATA = [
  {
    id: "obj_cost",
    category: "High Upfront Cost",
    trigger: ["too expensive", "can't afford", "cost too much", "money"],
    aiResponse: "I completely understand cost is top of mind. That's why our neighborhood program has $0 upfront installation costs. You simply swap your electric utility bill for a lower solar rate.",
    followUp: "Would a 10-minute roof suitability assessment make sense to see your exact savings?"
  },
  {
    id: "obj_interest",
    category: "Not Interested",
    trigger: ["not interested", "no thanks", "don't care", "busy"],
    aiResponse: "No worries at all! Most homeowners we speak with felt the same way until they saw Austin Energy rates increase 14% this year.",
    followUp: "If I could show you how to cap your electric bill without paying a penny out of pocket, would that be worth a quick look?"
  },
  {
    id: "obj_spouse",
    category: "Spouse / Partner Decision",
    trigger: ["talk to my wife", "talk to my husband", "partner", "spouse"],
    aiResponse: "That makes total sense! We always recommend both decision-makers be present during the 15-minute consultation.",
    followUp: "Is there an evening slot this week that works for both of you?"
  },
  {
    id: "obj_existing",
    category: "Already Have Solar / Panels",
    trigger: ["already have solar", "got panels", "already solar"],
    aiResponse: "That's fantastic! You're already ahead of the curve. Are you looking to add battery storage, or expand panels for an EV charger?",
    followUp: "We offer battery retrofit assessments as well if your power ever goes out during grid storms."
  }
];

// Production Code Templates
const CODE_FILES: Record<string, string> = {
  "server.ts": `import express from 'express';\nimport cors from 'cors';\nimport { vapiRouter } from './routes/vapi';\nimport { supabase } from './lib/supabase';\n\nconst app = express();\napp.use(cors());\napp.use(express.json());\n\napp.use('/api/vapi', vapiRouter);\n\nconst PORT = process.env.PORT || 8080;\napp.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));`,
  "vapiWebhook.ts": `import { Request, Response } from 'express';\nimport { supabase } from '../lib/supabase';\n\nexport const handleVapiWebhook = async (req: Request, res: Response) => {\n  const { message } = req.body;\n  if (message.type === 'tool-calls') {\n    console.log('Executing Vapi tool call:', message.toolCalls);\n  }\n  return res.status(200).json({ status: 'success' });\n};`,
  "solar-agent.ts": `export const SOLAR_AGENT_PROMPT = \`You are Sarah, a warm and professional solar appointment setting assistant.\nGoal: Qualify homeowners and schedule a 15-min consultation.\nKeep answers short (1-2 sentences max).\`;`,
  "schema.sql": `-- Supabase SQL Schema\nCREATE TABLE customers (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  name TEXT NOT NULL,\n  phone TEXT NOT NULL,\n  monthly_bill TEXT,\n  status TEXT DEFAULT 'Pending',\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\nCREATE TABLE appointments (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  customer_id UUID REFERENCES customers(id),\n  scheduled_time TIMESTAMPTZ NOT NULL,\n  status TEXT DEFAULT 'Booked'\n);`
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-rose-950/90 border border-rose-800 rounded-2xl text-rose-200 m-6 font-sans">
          <h2 className="text-lg font-bold mb-2 text-white">Application Error Caught</h2>
          <p className="font-mono text-xs bg-slate-950 p-3 rounded-lg border border-rose-900/50 mb-4 text-rose-300">
            {this.state.error?.message || String(this.state.error)}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-rose-800 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg transition-colors"
          >
            Reset Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('simulator');
  const [codeFile, setCodeFile] = useState('server.ts');
  const [copiedCode, setCopiedCode] = useState(false);

  // Call Simulator States
  const [callState, setCallState] = useState<'idle' | 'active' | 'ended'>('idle');
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [autoVoiceSynth, setAutoVoiceSynth] = useState(true);

  // Human Voice Tuning & Neural Audio Synthesis States
  const [useNeuralTTS, setUseNeuralTTS] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState('Aoede');
  const [humanStyle, setHumanStyle] = useState('conversational');
  const [phoneFilter, setPhoneFilter] = useState(false);
  const [audioSource, setAudioSource] = useState('Gemini Neural TTS (Aoede)');
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  // Microphone & Speech Recognition State
  const [isMicListening, setIsMicListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [micSupported, setMicSupported] = useState(true);
  const [micError, setMicError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [manualInput, setManualInput] = useState('');

  // Refs for speech recognition & Web Audio management
  const recognitionRef = useRef<any>(null);
  const isMicListeningRef = useRef(false);
  const isAiSpeakingRef = useRef(false);
  const callStateRef = useRef(callState);
  const isRecognizingRef = useRef(false);

  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    isMicListeningRef.current = isMicListening;
  }, [isMicListening]);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  // Lead Data State
  const [lead, setLead] = useState({
    name: "Marcus Vance",
    phone: "+1 (512) 894-2049",
    address: "742 Evergreen Terrace, Austin TX",
    monthlyBill: 210,
    isHomeowner: true,
    utilityProvider: "Austin Energy"
  });

  // State Machine Definitions
  const STAGES = [
    { id: 1, name: "Greeting", desc: "Verify identity & introduce Sarah" },
    { id: 2, name: "Verify Homeowner", desc: "Confirm ownership & high bill" },
    { id: 3, name: "Reason for Call", desc: "Pitch zero-down neighborhood program" },
    { id: 4, name: "Qualification", desc: "Roof sun exposure & utility provider check" },
    { id: 5, name: "Objection Handling", desc: "Dynamic objection pivot tactics" },
    { id: 6, name: "Book Appointment", desc: "Offer two distinct consultation slots" },
    { id: 7, name: "Confirmation", desc: "Confirm cell, email & calendar invite" },
    { id: 8, name: "Completed", desc: "Sync to Supabase & terminate stream" }
  ];

  // Live Transcript Stream
  const [messages, setMessages] = useState<any[]>([
    {
      id: 1,
      sender: 'system',
      text: 'System Initialized. Connected to Vapi Voice Stream & Supabase Relational Cluster.',
      timestamp: '10:00:00 AM'
    }
  ]);

  // Saved Data Records (Supabase DB Simulation)
  const [crmCustomers, setCrmCustomers] = useState<any[]>([
    { id: "c_1", name: "Marcus Vance", phone: "+1 (512) 894-2049", bill: "$210/mo", status: "Qualified", appointment: "Thu 2:00 PM" },
    { id: "c_2", name: "Elena Rostova", phone: "+1 (512) 431-9012", bill: "$185/mo", status: "Qualified", appointment: "Fri 10:00 AM" },
    { id: "c_3", name: "David Chen", phone: "+1 (512) 678-3341", bill: "$95/mo", status: "Not Qualified", appointment: "N/A" }
  ]);

  const [dbLogs, setDbLogs] = useState<any[]>([
    { id: "l_1", time: "10:01:14 AM", action: "CALL_STARTED", details: "Vapi Call ID: vapi_99812_tx" },
    { id: "l_2", time: "10:02:05 AM", action: "QUALIFICATION_SAVED", details: "Bill: $210, Sun Access: High" },
    { id: "l_3", time: "10:03:12 AM", action: "APPOINTMENT_BOOKED", details: "Scheduled for Marcus Vance on 2026-08-06 14:00" }
  ]);

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Safe helper wrappers for SpeechRecognition
  const safeStartRecognition = () => {
    if (!recognitionRef.current || isRecognizingRef.current) return;
    try {
      isRecognizingRef.current = true;
      recognitionRef.current.start();
    } catch (e: any) {
      if (e.name === 'InvalidStateError') {
        isRecognizingRef.current = true;
      } else {
        isRecognizingRef.current = false;
        console.warn('SpeechRecognition start error:', e);
      }
    }
  };

  const safeAbortRecognition = () => {
    if (!recognitionRef.current) return;
    try {
      isRecognizingRef.current = false;
      recognitionRef.current.abort();
    } catch (e) {
      // Ignore abort errors
    }
  };

  // Initialize Speech Recognition Engine
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        isRecognizingRef.current = true;
        setMicError(null);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece;
          } else {
            currentInterim += transcriptPiece;
          }
        }

        if (currentInterim) {
          setInterimTranscript(currentInterim);
        }

        if (finalTranscript.trim() && !isAiSpeakingRef.current) {
          const userSpokenText = finalTranscript.trim();
          setInterimTranscript('');
          safeAbortRecognition();
          simulateUserInput(userSpokenText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicError('Microphone permission blocked. Click "Start AI Voice Call" to re-request mic access.');
          setIsMicListening(false);
          isRecognizingRef.current = false;
        } else if (event.error === 'network') {
          setMicError('Browser Speech Recognition network timeout. You can also type or click fast replies below.');
        }
      };

      recognition.onend = () => {
        isRecognizingRef.current = false;
        setInterimTranscript('');
        if (callStateRef.current === 'active' && isMicListeningRef.current && !isAiSpeakingRef.current) {
          safeStartRecognition();
        }
      };

      recognitionRef.current = recognition;
    } else {
      setMicSupported(false);
    }

    return () => {
      safeAbortRecognition();
    };
  }, []);

  // Web Audio Context & Live Microphone Volume Analyser
  const initMicrophoneAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        }
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
      setMicError(null);
      return true;
    } catch (err) {
      console.warn("Microphone access request failed:", err);
      setMicError("Microphone access denied by browser settings. Please allow mic access.");
      return false;
    }
  };

  const stopMicrophoneAudio = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  // Toggle Microphone On / Off
  const toggleMicrophone = async () => {
    if (isMicListening) {
      setIsMicListening(false);
      safeAbortRecognition();
      stopMicrophoneAudio();
    } else {
      const micGranted = await initMicrophoneAudio();
      if (micGranted) {
        setIsMicListening(true);
        if (!isAiSpeakingRef.current) {
          safeStartRecognition();
        }
      }
    }
  };

  const speakText = async (text: string) => {
    if (!autoVoiceSynth) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsGeneratingAudio(true);
    isAiSpeakingRef.current = true;
    safeAbortRecognition();

    const tonePrompts: Record<string, string> = {
      conversational: "Say naturally, smoothly, and expressively with subtle human breathing pauses, realistic phone vocal cadence, and a warm friendly tone: ",
      warm: "Say in a very warm, empathetic, and reassuring voice with gentle human chuckles and realistic conversational pauses: ",
      enthusiastic: "Say with lively, upbeat, friendly energy and natural conversational flow: ",
      professional: "Say in a clear, polite, natural, and confident professional customer service voice: "
    };

    const promptText = `${tonePrompts[humanStyle] || tonePrompts.conversational}"${text}"`;

    const onAudioPlaybackFinished = () => {
      setIsGeneratingAudio(false);
      isAiSpeakingRef.current = false;

      if (callStateRef.current === 'active' && isMicListeningRef.current) {
        safeStartRecognition();
      }
    };

    if (useNeuralTTS) {
      try {
        const payload = {
          contents: [{
            parts: [{ text: promptText }]
          }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: selectedVoice }
              }
            }
          },
          model: "gemini-2.5-flash-preview-tts"
        };

        const apiKey = "";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        const part = result?.candidates?.[0]?.content?.parts?.[0];
        const audioData = part?.inlineData?.data;
        const mimeType = part?.inlineData?.mimeType;

        if (audioData && mimeType && mimeType.startsWith("audio/")) {
          const match = mimeType.match(/rate=(\d+)/);
          const sampleRate = match ? parseInt(match[1], 10) : 24000;
          const arrayBuffer = base64ToArrayBuffer(audioData);
          const pcm16 = new Int16Array(arrayBuffer);
          const wavBlob = pcmToWav(pcm16, sampleRate);
          const audioUrl = URL.createObjectURL(wavBlob);

          const audio = new Audio(audioUrl);

          if (phoneFilter && (window.AudioContext || (window as any).webkitAudioContext)) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioCtx();
            const source = audioCtx.createMediaElementSource(audio);
            const filterLow = audioCtx.createBiquadFilter();
            filterLow.type = 'highpass';
            filterLow.frequency.value = 300;

            const filterHigh = audioCtx.createBiquadFilter();
            filterHigh.type = 'lowpass';
            filterHigh.frequency.value = 3400;

            source.connect(filterLow);
            filterLow.connect(filterHigh);
            filterHigh.connect(audioCtx.destination);
          }

          setAudioSource(`Gemini Neural TTS (${selectedVoice})`);
          audio.onended = onAudioPlaybackFinished;
          audio.onerror = onAudioPlaybackFinished;
          await audio.play();
          return;
        }
      } catch (err) {
        console.warn("Gemini Neural TTS fallback to Web Speech:", err);
      }
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setAudioSource('Web Speech Synthetic Fallback');
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = humanStyle === 'warm' ? 0.95 : humanStyle === 'enthusiastic' ? 1.1 : 1.0;

      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find((v) =>
        v.name.includes('Samantha') ||
        v.name.includes('Google US English') ||
        v.name.includes('Victoria') ||
        v.name.includes('Zira') ||
        v.name.includes('Karen')
      );
      if (femaleVoice) utterance.voice = femaleVoice;

      utterance.onend = onAudioPlaybackFinished;
      utterance.onerror = onAudioPlaybackFinished;
      window.speechSynthesis.speak(utterance);
    } else {
      onAudioPlaybackFinished();
    }
  };

  const startCall = async () => {
    setCallState('active');
    setCurrentStageIndex(0);

    const micGranted = await initMicrophoneAudio();
    if (micGranted) {
      setIsMicListening(true);
      if (!isAiSpeakingRef.current) {
        safeStartRecognition();
      }
    }

    const greetingText = `Hi ${lead.name}, this is Sarah calling from the Neighborhood Solar Consultation team. Am I speaking with the homeowner at ${lead.address}?`;

    const newMsg = {
      id: Date.now(),
      sender: 'ai',
      text: greetingText,
      stage: 'Greeting',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    setMessages((prev) => [...prev, newMsg]);
    await speakText(greetingText);
  };

  const endCall = () => {
    setCallState('ended');
    setIsMicListening(false);
    safeAbortRecognition();
    stopMicrophoneAudio();

    const endedMsg = {
      id: Date.now(),
      sender: 'system',
      text: 'Call session ended. Syncing call transcript and qualifications to Supabase...',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setMessages((prev) => [...prev, endedMsg]);

    setDbLogs((prev) => [
      {
        id: `l_${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        action: 'CALL_COMPLETED',
        details: `Saved session transcript for ${lead.name}`
      },
      ...prev
    ]);
  };

  const simulateUserInput = async (userText: string, isObjection = false, objectionObj: any = null) => {
    if (callState !== 'active') return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    setTimeout(async () => {
      setIsThinking(false);
      let replyText = "";
      let nextStage = currentStageIndex;
      let toolCallExecuted = null;

      if (isObjection && objectionObj) {
        replyText = `${objectionObj.aiResponse} ${objectionObj.followUp}`;
        nextStage = 4;
      } else {
        nextStage = Math.min(currentStageIndex + 1, STAGES.length - 1);
        setCurrentStageIndex(nextStage);

        switch (nextStage) {
          case 1:
            replyText = `Great! I noticed electricity rates in Austin went up over 14%. Are you currently paying around $200 a month on average?`;
            break;
          case 2:
            replyText = `That's exactly why I'm calling. Austin Energy offers a zero-down program that replaces your bill with clean solar. Does your roof get decent sunlight throughout the day?`;
            break;
          case 3:
            replyText = `Awesome. We can have a technician run a 3D solar scan for your roof. I have opening slots this Thursday at 10:00 AM or 2:00 PM. Which works best?`;
            toolCallExecuted = "saveQualification(bill: 210, sunAccess: 'High')";
            break;
          case 4:
            replyText = `Perfect! I'll reserve Thursday at 10:00 AM for you. Can I confirm your preferred mobile number for the calendar invite?`;
            toolCallExecuted = "bookAppointment(slot: 'Thu 10:00 AM')";
            break;
          case 5:
            replyText = `All set! You'll receive a confirmation SMS in a few moments. Thanks so much, Marcus, and have a fantastic rest of your day!`;
            toolCallExecuted = "saveCustomer(status: 'Qualified')";
            break;
          case 6:
            replyText = `Thanks for chatting! Have a great day. Goodbye!`;
            break;
          default:
            replyText = `Thank you so much! We look forward to speaking with you then.`;
            break;
        }
      }

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: replyText,
        stage: STAGES[nextStage]?.name,
        toolCall: toolCallExecuted,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
      await speakText(replyText);

      if (toolCallExecuted) {
        setDbLogs((prev) => [
          {
            id: `l_${Date.now()}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            action: 'TOOL_CALL_EXECUTED',
            details: toolCallExecuted
          },
          ...prev
        ]);
      }
    }, 900);
  };

  // Canvas Audio Wave Renderer
  useEffect(() => {
    if (callState !== 'active') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      const dynamicAmp = audioLevel > 5
        ? audioLevel * 0.4
        : isThinking
        ? 4
        : Math.sin(phase * 2) * 15 + 10;

      for (let j = 0; j < 3; j++) {
        ctx.beginPath();
        ctx.lineWidth = 2 - j * 0.5;
        ctx.strokeStyle = audioLevel > 5
          ? (j === 0 ? '#10B981' : j === 1 ? '#06B6D4' : '#F59E0B')
          : (j === 0 ? '#10B981' : j === 1 ? '#06B6D4' : '#3B82F6');
        ctx.globalAlpha = 1 - j * 0.3;

        for (let x = 0; x < width; x++) {
          const freq = 0.02 + j * 0.01;
          const y = centerY + Math.sin(x * freq + phase + j) * dynamicAmp * Math.sin((x / width) * Math.PI);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      phase += audioLevel > 5 ? 0.2 : isThinking ? 0.05 : 0.12;
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [callState, isThinking, audioLevel]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim() || callState !== 'active') return;
    simulateUserInput(manualInput.trim());
    setManualInput('');
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
        
        {/* Top Header Navigation */}
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/10 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sun className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  SolarVoice AI
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  PRODUCTION VAPI + GEMINI HUMAN TTS
                </span>
              </div>
              <p className="text-xs text-slate-400">Autonomous Solar Appointment Setter Agent</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'simulator'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              Live Call Studio
            </button>
            
            <button
              onClick={() => setActiveTab('crm')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'crm'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Supabase CRM ({crmCustomers.length})
            </button>

            <button
              onClick={() => setActiveTab('objections')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'objections'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Objection Matrix
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'code'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Codebase & Schema
            </button>

            <button
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'docs'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Deployment Docs
            </button>
          </nav>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
          
          {/* TAB 1: LIVE CALL STUDIO */}
          {activeTab === 'simulator' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* Voice Control & Call Launcher Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Live Human Voice Engine
                      </span>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        Sarah (AI Agent)
                      </h2>
                    </div>
                    <button
                      onClick={() => setAutoVoiceSynth(!autoVoiceSynth)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors flex items-center gap-1.5 ${
                        autoVoiceSynth
                          ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                      title="Toggle Speech Audio Output"
                    >
                      {autoVoiceSynth ? <Volume2 className="w-3.5 h-3.5 text-teal-400" /> : <VolumeX className="w-3.5 h-3.5" />}
                      {autoVoiceSynth ? 'Voice Output ON' : 'Muted'}
                    </button>
                  </div>

                  {/* Human Voice Tuning Control Panel */}
                  <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 mb-4 space-y-3">
                    <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" /> Humanization Settings
                      </span>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-emerald-400 font-mono">
                        <input
                          type="checkbox"
                          checked={useNeuralTTS}
                          onChange={(e) => setUseNeuralTTS(e.target.checked)}
                          className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                        />
                        Gemini Neural Audio
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block mb-1">Voice Persona</span>
                        <select
                          value={selectedVoice}
                          onChange={(e) => setSelectedVoice(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs px-2 py-1 text-slate-200 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Aoede">Aoede (Breezy & Natural)</option>
                          <option value="Kore">Kore (Firm & Clear)</option>
                          <option value="Zephyr">Zephyr (Bright & Friendly)</option>
                          <option value="Leda">Leda (Youthful & Warm)</option>
                          <option value="Callirrhoe">Callirrhoe (Easy-going)</option>
                          <option value="Puck">Puck (Upbeat)</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block mb-1">Tone Expressiveness</span>
                        <select
                          value={humanStyle}
                          onChange={(e) => setHumanStyle(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs px-2 py-1 text-slate-200 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="conversational">Natural Conversational</option>
                          <option value="warm">Empathetic & Warm</option>
                          <option value="enthusiastic">Upbeat & Energetic</option>
                          <option value="professional">Clear Professional</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 border-t border-slate-800/60">
                      <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200">
                        <Radio className="w-3.5 h-3.5 text-cyan-400" />
                        <input
                          type="checkbox"
                          checked={phoneFilter}
                          onChange={(e) => setPhoneFilter(e.target.checked)}
                          className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                        />
                        Telephonic Filter (300-3400Hz)
                      </label>
                      <span className="text-[10px] font-mono text-emerald-400 truncate max-w-[150px]">
                        {audioSource}
                      </span>
                    </div>
                  </div>

                  {/* Target Homeowner Card */}
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 mb-4 text-xs grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase">Target Homeowner</span>
                      <p className="font-semibold text-slate-200">{lead.name}</p>
                      <p className="text-slate-400">{lead.phone}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase">Property & Electric</span>
                      <p className="text-slate-300 truncate">{lead.address}</p>
                      <p className="text-emerald-400 font-medium">Est. Bill: ${lead.monthlyBill}/mo</p>
                    </div>
                  </div>

                  {/* Visualizer & Mic Level Display */}
                  <div className="h-28 bg-slate-950 rounded-xl border border-slate-800/90 relative flex items-center justify-center overflow-hidden mb-4">
                    {callState === 'active' ? (
                      <>
                        <canvas ref={canvasRef} width={400} height={112} className="w-full h-full" />
                        
                        <div className="absolute top-2 right-3 flex items-center gap-1.5 bg-slate-900/80 px-2 py-0.5 rounded text-[10px] text-emerald-400 border border-emerald-500/20">
                          <span className={`w-1.5 h-1.5 rounded-full ${isGeneratingAudio ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                          {isGeneratingAudio ? 'GENERATING NEURAL AUDIO...' : 'VAPI LIVE AUDIO'}
                        </div>

                        {/* Live Microphone Audio Level Meter */}
                        <div className="absolute top-2 left-3 flex items-center gap-2 bg-slate-900/90 px-2.5 py-1 rounded text-[10px] border border-slate-800">
                          <Mic className={`w-3 h-3 ${audioLevel > 5 ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                          <span className="text-slate-300 font-mono">Mic Input Level:</span>
                          <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-400 h-full transition-all duration-75"
                              style={{ width: `${audioLevel}%` }}
                            />
                          </div>
                        </div>

                        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-800 text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isMicListening ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
                            <span className="font-semibold text-slate-200">
                              {isMicListening ? 'Microphone Active — Speak Now!' : 'Microphone Paused'}
                            </span>
                          </div>
                          {interimTranscript && (
                            <span className="text-amber-300 font-mono italic truncate max-w-[180px]">
                              "{interimTranscript}..."
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-slate-500 text-xs p-3">
                        <Bot className="w-7 h-7 mx-auto mb-1 text-slate-700" />
                        <p className="font-medium text-slate-300">Ready to start AI call session</p>
                        <p className="text-[11px] text-slate-500">Click "Start AI Voice Call" to initiate microphone access</p>
                      </div>
                    )}
                  </div>

                  {/* Microphone Error Alert */}
                  {micError && (
                    <div className="mb-4 bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs p-2.5 rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{micError}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    {callState === 'idle' || callState === 'ended' ? (
                      <button
                        onClick={startCall}
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group"
                      >
                        <Phone className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                        Start AI Voice Call (Voice Enabled)
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={toggleMicrophone}
                          className={`py-3 px-4 rounded-xl font-bold text-xs border transition-all flex items-center gap-2 ${
                            isMicListening
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                          }`}
                        >
                          {isMicListening ? <Mic className="w-4 h-4 text-emerald-400 animate-pulse" /> : <MicOff className="w-4 h-4 text-rose-400" />}
                          {isMicListening ? 'Mic Active' : 'Mic Muted'}
                        </button>

                        <button
                          onClick={endCall}
                          className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold text-sm shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                        >
                          <PhoneOff className="w-4 h-4" />
                          End Call
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* State Machine Step Tracker */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      Conversation State Machine
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      State: {STAGES[currentStageIndex]?.name}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {STAGES.map((stage, idx) => {
                      const isActive = idx === currentStageIndex && callState === 'active';
                      const isPassed = idx < currentStageIndex || callState === 'ended';
                      return (
                        <div
                          key={stage.id}
                          className={`p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                            isActive
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 ring-1 ring-emerald-500/20'
                              : isPassed
                              ? 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                              : 'bg-slate-950/30 border-slate-900 text-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isActive
                                  ? 'bg-emerald-500 text-slate-950'
                                  : isPassed
                                  ? 'bg-slate-800 text-emerald-400'
                                  : 'bg-slate-900 text-slate-600'
                              }`}
                            >
                              {isPassed ? <Check className="w-3 h-3" /> : stage.id}
                            </div>
                            <div>
                              <p className={`font-semibold ${isActive ? 'text-emerald-300' : 'text-slate-300'}`}>
                                {stage.name}
                              </p>
                              <p className="text-[10px] text-slate-500">{stage.desc}</p>
                            </div>
                          </div>

                          {isActive && (
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Transcript Display Window & Interactive Controls */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex-1 flex flex-col h-[560px]">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-bold text-white">Live Call Transcript & Tool Execution Stream</h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">WebSocket / Webhook Feed</span>
                  </div>

                  {/* Message Stream */}
                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 custom-scrollbar">
                    {messages.map((msg) => (
                      <div key={msg.id} className="space-y-1">
                        {msg.sender === 'system' && (
                          <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-3 text-xs font-mono text-slate-400 flex items-start gap-2">
                            <Terminal className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                            <div>
                              <span className="text-[10px] text-slate-500 block mb-0.5">{msg.timestamp}</span>
                              <p className="text-slate-300">{msg.text}</p>
                            </div>
                          </div>
                        )}

                        {msg.sender === 'ai' && (
                          <div className="flex flex-col items-start max-w-[85%]">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                <Bot className="w-3 h-3" /> Sarah (Humanized AI)
                              </span>
                              {msg.stage && (
                                <span className="text-[9px] bg-emerald-500/10 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                  {msg.stage}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                            </div>
                            <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-100 shadow-sm leading-relaxed">
                              {msg.text}
                            </div>

                            {msg.toolCall && (
                              <div className="mt-1.5 bg-slate-950 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono px-2.5 py-1 rounded-lg flex items-center gap-2">
                                <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
                                <span>Supabase Tool Execution: <code>{msg.toolCall}</code></span>
                              </div>
                            )}
                          </div>
                        )}

                        {msg.sender === 'user' && (
                          <div className="flex flex-col items-end ml-auto max-w-[85%]">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                              <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                                <User className="w-3 h-3" /> {lead.name} (Homeowner)
                              </span>
                            </div>
                            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tr-none p-3.5 text-xs text-slate-100 shadow-sm leading-relaxed">
                              {msg.text}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {isThinking && (
                      <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono py-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sarah is processing prompt & objection rules...</span>
                      </div>
                    )}

                    <div ref={transcriptEndRef} />
                  </div>

                  {/* Manual Input Form & Quick Chips */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-2.5">
                    
                    {/* Speak or Type Direct Input Bar */}
                    <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        placeholder={callState === 'active' ? "Speak into your microphone or type your response here..." : "Start the call to talk..."}
                        disabled={callState !== 'active'}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={callState !== 'active' || !manualInput.trim()}
                        className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send
                      </button>
                    </form>

                    {/* Fast Reply Simulation Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        disabled={callState !== 'active'}
                        onClick={() => simulateUserInput("Yes, I am the homeowner and my monthly bill is around $210.")}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-[11px] text-slate-200 border border-slate-700 transition-colors"
                      >
                        "Yes, I'm the homeowner ($210 bill)"
                      </button>

                      <button
                        disabled={callState !== 'active'}
                        onClick={() => simulateUserInput("Sure, our roof gets full sunlight and we use Austin Energy.")}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-[11px] text-slate-200 border border-slate-700 transition-colors"
                      >
                        "Full sun exposure, Austin Energy"
                      </button>

                      <button
                        disabled={callState !== 'active'}
                        onClick={() => simulateUserInput("Thursday at 10:00 AM works perfect for me.")}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-[11px] text-slate-200 border border-slate-700 transition-colors"
                      >
                        "Thursday 10 AM works"
                      </button>
                    </div>

                    {/* Objection Triggers */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                      <span className="text-[10px] uppercase tracking-wider text-rose-400 font-bold shrink-0">Inject Objection:</span>
                      <div className="flex flex-wrap gap-1.5 flex-1">
                        {OBJECTIONS_DATA.map((obj) => (
                          <button
                            key={obj.id}
                            disabled={callState !== 'active'}
                            onClick={() => simulateUserInput(`I don't know, solar seems ${obj.trigger[0]}.`, true, obj)}
                            className="px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 disabled:opacity-30 border border-rose-800/60 text-[10px] transition-colors"
                          >
                            ⚡ {obj.category}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: SUPABASE CRM */}
          {activeTab === 'crm' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-400" />
                    Supabase Database Explorer
                  </h2>
                  <p className="text-xs text-slate-400">Live synchronized records from voice call tool calls</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 text-slate-300 font-mono">
                    Schema: public
                  </span>
                </div>
              </div>

              {/* Customers & Appointments Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200">Customers & Consultation Appointments</h3>
                  <span className="text-xs text-slate-400">{crmCustomers.length} Records</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Customer Name</th>
                        <th className="p-3.5">Phone Number</th>
                        <th className="p-3.5">Monthly Power Bill</th>
                        <th className="p-3.5">Qualification Status</th>
                        <th className="p-3.5">Booked Slot</th>
                        <th className="p-3.5">Database Sync</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {crmCustomers.map((cust) => (
                        <tr key={cust.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 font-semibold text-white">{cust.name}</td>
                          <td className="p-3.5 font-mono text-slate-400">{cust.phone}</td>
                          <td className="p-3.5 text-emerald-400 font-medium">{cust.bill}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {cust.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-amber-300 font-medium">{cust.appointment}</td>
                          <td className="p-3.5 font-mono text-[10px] text-slate-500">
                            UUID: {cust.id}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Audit Log */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  Live Supabase Audit Log
                </h3>
                <div className="space-y-2 font-mono text-xs max-h-60 overflow-y-auto">
                  {dbLogs.map((log) => (
                    <div key={log.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-500">{log.time}</span>
                        <span className="text-emerald-400 font-semibold">{log.action}</span>
                        <span className="text-slate-300">{log.details}</span>
                      </div>
                      <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-500">HTTP 200 OK</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OBJECTION MATRIX */}
          {activeTab === 'objections' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  Objection Handling Engine (`backend/data/objections.json`)
                </h2>
                <p className="text-xs text-slate-400">
                  The AI Voice agent detects key objection triggers dynamically and responds with non-pushy micro-rebuttals.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {OBJECTIONS_DATA.map((obj) => (
                  <div key={obj.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">{obj.category}</span>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {obj.id}
                        </span>
                      </div>

                      <div className="mb-3">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Trigger Keywords:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {obj.trigger.map((t, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 text-[11px] border border-slate-800">
                              "{t}"
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">AI Conversational Rebuttal:</span>
                        <p className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-200 leading-relaxed italic">
                          "{obj.aiResponse}"
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Follow-up Micro Close:</span>
                      <p className="text-xs font-medium text-emerald-400 mt-0.5">{obj.followUp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CODEBASE & SCHEMA */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Code className="w-5 h-5 text-emerald-400" />
                    Full Production Source Code
                  </h2>
                  <p className="text-xs text-slate-400">Copy modular components for your backend and Supabase cluster</p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  {Object.keys(CODE_FILES).map((f) => (
                    <button
                      key={f}
                      onClick={() => setCodeFile(f)}
                      className={`px-3 py-1.5 rounded-lg font-mono transition-all ${
                        codeFile === f
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
                <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">{codeFile}</span>
                  <button
                    onClick={() => copyToClipboard(CODE_FILES[codeFile])}
                    className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded-lg border border-slate-700 transition-colors"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCode ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>

                <pre className="p-4 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed bg-slate-950/80 max-h-[550px]">
                  <code>{CODE_FILES[codeFile]}</code>
                </pre>
              </div>
            </div>
          )}

          {/* TAB 5: DEPLOYMENT DOCS */}
          {activeTab === 'docs' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                  <FileText className="w-5 h-5 text-teal-400" />
                  Step-by-Step Deployment Architecture Guide
                </h2>
                <p className="text-xs text-slate-400">Instructions for Vercel, Railway, Vapi Webhook, and Supabase integration</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">1</span>
                    Vapi Assistant Setup
                  </div>
                  <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Log in to <code className="bg-slate-950 px-1 py-0.5 text-emerald-300">vapi.ai</code> dashboard and click "Create Assistant".</li>
                    <li>Set Transcriber to <b>Deepgram Nova-2</b> for lowest latency speech recognition.</li>
                    <li>Set Model to <b>GPT-4o / Claude 3.5 Sonnet</b> with system prompt from <code className="text-emerald-300">solar-agent.ts</code>.</li>
                    <li>Set Voice to <b>Azure - en-US-JennyNeural</b> or ElevenLabs <b>Rachel</b>.</li>
                    <li>Set Server URL to your Railway backend: <code className="bg-slate-950 px-1 py-0.5 text-emerald-300">https://your-api.railway.app/api/vapi/webhook</code>.</li>
                  </ol>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs">2</span>
                    Supabase Database Setup
                  </div>
                  <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Create a new Supabase project at <code className="bg-slate-950 px-1 py-0.5 text-cyan-300">database.new</code>.</li>
                    <li>Navigate to SQL Editor and run the provided script from the <b>schema.sql</b> tab.</li>
                    <li>Copy your <code className="text-cyan-300">SUPABASE_URL</code> and <code className="text-cyan-300">SUPABASE_SERVICE_ROLE_KEY</code> from Project Settings &gt; API.</li>
                    <li>All webhooks automatically stream customer data, transcripts, and calendar slots into these tables.</li>
                  </ol>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                    <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs">3</span>
                    Railway Backend Deployment
                  </div>
                  <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
                    <li>Push <code className="text-purple-300">/backend</code> directory to GitHub repository.</li>
                    <li>Connect repository to Railway (<code className="bg-slate-950 px-1 py-0.5 text-purple-300">railway.app</code>).</li>
                    <li>Set Environment Variables: <code className="text-slate-400">OPENAI_API_KEY</code>, <code className="text-slate-400">VAPI_API_KEY</code>, <code className="text-slate-400">SUPABASE_URL</code>, <code className="text-slate-400">SUPABASE_SERVICE_ROLE_KEY</code>.</li>
                    <li>Deploy Node server with command: <code className="bg-slate-950 px-1 py-0.5 text-purple-300">npm start</code>.</li>
                  </ul>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs">4</span>
                    Vercel Frontend Deployment
                  </div>
                  <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
                    <li>Import <code className="text-amber-300">/frontend</code> Next.js App Router project into Vercel.</li>
                    <li>Add Environment Variable: <code className="bg-slate-950 px-1 py-0.5 text-amber-300">NEXT_PUBLIC_BACKEND_URL=https://your-api.railway.app</code>.</li>
                    <li>Add Environment Variable: <code className="bg-slate-950 px-1 py-0.5 text-amber-300">NEXT_PUBLIC_VAPI_PUBLIC_KEY=your-vapi-public-key</code>.</li>
                    <li>Deploy to production. Access dashboard directly to trigger and monitor live AI calls!</li>
                  </ul>
                </div>

              </div>
            </div>
          )}

        </main>

        <footer className="border-t border-slate-800 bg-slate-950 px-4 py-3 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>SolarVoice AI Production Suite</span>
            <span className="text-slate-700">|</span>
            <span>Gemini Neural TTS & Supabase Postgres Ready</span>
          </div>
          <div>
            <span>Vapi Webhook Endpoint Target: <code className="text-slate-400 font-mono">POST /api/vapi/webhook</code></span>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}