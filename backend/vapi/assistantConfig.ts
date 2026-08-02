import { solarAgentPrompt } from '../prompts/solar-agent';
import { vapiTools } from '../tools/vapiTools';

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
      voiceId: '21m00Tcm4TlvDq8ikWAM' // Sarah / Rachel natural voice
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
