import { useState, useEffect, useRef, useCallback } from 'react';
import Vapi from '@vapi-ai/web';
import { Message, CallStatus, AgentStage } from '../types/types';

interface UseVapiOptions {
  publicKey?: string;
  onTranscript?: (message: Message) => void;
  onCallStateChange?: (status: CallStatus) => void;
}

export function useVapiCall(options: UseVapiOptions = {}) {
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>('pending');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeStage, setActiveStage] = useState<AgentStage>('Greeting');
  const [transcripts, setTranscripts] = useState<Message[]>([]);
  const [volumeLevel, setVolumeLevel] = useState(0);

  const publicKey = options.publicKey || process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '';

  // Browser Text-To-Speech helper for audible voice playback
  const speakText = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // stop previous speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.1;

      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Natural') || v.name.includes('Zira'))
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Browser SpeechSynthesis notice:', err);
    }
  }, []);

  useEffect(() => {
    if (!publicKey || publicKey.includes('your-vapi') || publicKey.startsWith('sk-')) {
      console.info('Vapi Public Key not configured or placeholder used. WebRTC will operate in simulation & browser TTS mode.');
      return;
    }

    try {
      const vapiInstance = new Vapi(publicKey);
      setVapi(vapiInstance);

      vapiInstance.on('call-start', () => {
        setCallStatus('active');
        options.onCallStateChange?.('active');
      });

      vapiInstance.on('call-end', () => {
        setCallStatus('completed');
        setIsSpeaking(false);
        options.onCallStateChange?.('completed');
      });

      vapiInstance.on('speech-start', () => {
        setIsSpeaking(true);
      });

      vapiInstance.on('speech-end', () => {
        setIsSpeaking(false);
      });

      vapiInstance.on('volume-level', (volume: number) => {
        setVolumeLevel(volume);
      });

      vapiInstance.on('message', (message: any) => {
        if (message.type === 'transcript') {
          const newMsg: Message = {
            id: `vapi-msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            speaker: message.role === 'user' ? 'user' : 'assistant',
            content: message.transcript,
            timestamp: new Date().toLocaleTimeString()
          };
          setTranscripts((prev) => [...prev, newMsg]);
          options.onTranscript?.(newMsg);
        }
      });

      vapiInstance.on('error', (e: any) => {
        console.warn('Vapi Web SDK event warning:', e);
      });

      return () => {
        vapiInstance.stop();
      };
    } catch (err) {
      console.warn('Failed to initialize Vapi Web SDK, falling back to browser TTS mode:', err);
    }
  }, [publicKey]);

  const startWebCall = useCallback(async (assistantId?: string) => {
    setCallStatus('active');
    if (!vapi) return;

    try {
      if (assistantId) {
        await vapi.start(assistantId);
      } else {
        await vapi.start({
          transcriber: { provider: 'deepgram', model: 'nova-2' },
          model: {
            provider: 'openai',
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: 'You are Sarah from Neighborhood Solar. Greet the customer and verify if they own the home.'
              }
            ]
          },
          voice: { provider: '11labs', voiceId: '21m00Tcm4TlvDq8ikWAM' }
        });
      }
    } catch (err) {
      console.warn('Vapi startWebCall warning (browser TTS simulation active):', err);
    }
  }, [vapi]);

  const stopWebCall = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (vapi) {
      try {
        vapi.stop();
      } catch (err) {
        // silent catch
      }
    }
    setCallStatus('completed');
    setIsSpeaking(false);
  }, [vapi]);

  return {
    vapi,
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
  };
}
