import { solarAgentPrompt } from '../prompts/solar-agent';
import { vapiTools } from '../tools/vapiTools';

export const SARAH_VOICE_ID = process.env.VOICE_SARAH || 'EXAVITQu4vr4xnSDxMaL';

export const getSolarAssistantConfig = (backendWebhookUrl: string) => {
  return {
    name: 'Solar Appointment Setter - Sarah',
    model: {
      provider: 'openai',
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: solarAgentPrompt
        }
      ],
      tools: vapiTools
    },
    voice: {
      provider: '11labs',
      voiceId: SARAH_VOICE_ID
    },
    firstMessage: "Hi, this is Sarah from the neighborhood energy consultation team. Am I speaking with the homeowner?",
    serverUrl: backendWebhookUrl,
    serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET || '',
    endCallPhrases: [
      "bye",
      "goodbye",
      "talk later",
      "thank you, bye",
      "have a good day"
    ]
  };
};
