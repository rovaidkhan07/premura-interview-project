import { useState, useEffect, useCallback } from 'react';
import Vapi from '@vapi-ai/web';
import { Message, CallStatus, AgentStage } from '../types/types';

interface UseVapiOptions {
  publicKey?: string;
  assistantId?: string;
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

  const [vapiPublicKey, setVapiPublicKey] = useState<string>(
    options.publicKey || process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || ''
  );

  useEffect(() => {
    if (!vapiPublicKey || vapiPublicKey.includes('your-vapi') || vapiPublicKey.startsWith('sk-')) {
      setVapi(null);
      return;
    }

    try {
      const vapiInstance = new Vapi(vapiPublicKey);
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
        console.warn('Vapi Web SDK error:', e);
      });

      return () => {
        vapiInstance.stop();
      };
    } catch (err) {
      console.error('Failed to initialize Vapi Web SDK:', err);
    }
  }, [vapiPublicKey]);

  const startWebCall = useCallback(async (customAssistantId?: string) => {
    setCallStatus('active');
    if (!vapi) {
      console.warn('Vapi Web SDK not connected. Missing valid Vapi Public Key (pk_...).');
      return;
    }

    try {
      const targetAssistantId = customAssistantId || options.assistantId;
      if (targetAssistantId) {
        await vapi.start(targetAssistantId);
      } else {
        // Start transient Vapi assistant directly over WebRTC
        await vapi.start({
          transcriber: { provider: 'deepgram', model: 'nova-2' },
          model: {
            provider: 'openai',
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: `You are Sarah, an AI voice appointment setter for Neighborhood Solar. Greet the homeowner naturally in 1-2 short sentences and qualify their home for solar.`
              }
            ]
          },
          voice: { provider: '11labs', voiceId: '21m00Tcm4TlvDq8ikWAM' }
        });
      }
    } catch (err: any) {
      console.error('Error starting live Vapi voice call:', err);
    }
  }, [vapi, options.assistantId]);

  const stopWebCall = useCallback(() => {
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
  };
}
