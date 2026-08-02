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

  useEffect(() => {
    if (!publicKey) return;

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
        console.error('Vapi Web SDK Error:', e);
        setCallStatus('failed');
      });

      return () => {
        vapiInstance.stop();
      };
    } catch (err) {
      console.warn('Failed to initialize Vapi Web SDK, falling back to REST/Simulation mode', err);
    }
  }, [publicKey]);

  const startWebCall = useCallback(async (assistantId?: string) => {
    if (!vapi) {
      setCallStatus('active');
      return;
    }
    setCallStatus('active');
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
      console.error('Error starting Vapi call via Web SDK:', err);
    }
  }, [vapi]);

  const stopWebCall = useCallback(() => {
    if (vapi) {
      vapi.stop();
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
    setActiveStage,
    setTranscripts,
    startWebCall,
    stopWebCall
  };
}
