import { Request, Response } from 'express';
import { supabaseService } from '../services/supabaseService';
import { CallRepository } from '../repositories/callRepository';
import { logger } from '../middlewares/logger';

export const handleVapiWebhook = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const message = payload.message || payload;
    const type = message.type || payload.type;
    const call = message.call || payload.call;
    const vapiCallId = call?.id;

    logger.info(`Received Vapi webhook event: ${type} (CallID: ${vapiCallId || 'N/A'})`);

    switch (type) {
      case 'call-started':
      case 'call_started':
        await handleCallStarted(vapiCallId);
        break;

      case 'transcript':
      case 'transcript-updated':
        await handleTranscript(vapiCallId, message);
        break;

      case 'function-call':
      case 'tool-calls':
      case 'tool_call':
        await handleToolCall(vapiCallId, message);
        break;

      case 'call-ended':
      case 'call_ended':
      case 'end-of-call-report':
        await handleCallEnded(vapiCallId, message);
        break;

      default:
        logger.info(`Unprocessed Vapi event type: ${type}`);
    }

    res.status(200).json({ status: 'success' });
  } catch (error: any) {
    logger.error(`Error processing Vapi webhook: ${error.message}`);
    res.status(500).json({ error: 'Internal server error in webhook handler' });
  }
};

const handleCallStarted = async (vapiCallId?: string) => {
  if (vapiCallId) {
    logger.info(`Webhook call_started: ${vapiCallId}`);
    // Match call in Supabase if exists by vapi_call_id
    await supabaseService.updateCallStatus(vapiCallId, 'active');
  }
};

const handleTranscript = async (vapiCallId: string | undefined, message: any) => {
  const transcriptText = message.transcript || message.content;
  const role = message.role || (message.transcriptType === 'final' ? 'user' : 'assistant');

  if (vapiCallId && transcriptText) {
    logger.info(`Webhook transcript received for ${vapiCallId} [${role}]: ${transcriptText.slice(0, 50)}...`);
    await supabaseService.saveMessage({
      call_id: vapiCallId,
      speaker: role,
      content: transcriptText
    });
  }
};

const handleToolCall = async (vapiCallId: string | undefined, message: any) => {
  const toolCall = message.toolCall || message.functionCall;
  const toolCallsArray = message.toolCalls || (toolCall ? [toolCall] : []);

  for (const tc of toolCallsArray) {
    const fnName = tc.name || tc.function?.name;
    const fnArgs = typeof tc.parameters === 'string' 
      ? JSON.parse(tc.parameters) 
      : (tc.parameters || (typeof tc.function?.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function?.arguments));

    logger.info(`Webhook tool_call trigger: ${fnName} with args: ${JSON.stringify(fnArgs)}`);

    if (!vapiCallId) continue;

    switch (fnName) {
      case 'saveCustomer':
        await supabaseService.saveCustomer(fnArgs);
        break;
      case 'saveTranscript':
        await supabaseService.saveTranscript(vapiCallId, fnArgs.transcript);
        break;
      case 'saveQualification':
        await supabaseService.saveQualification(vapiCallId, fnArgs);
        break;
      case 'bookAppointment':
        await supabaseService.bookAppointment(vapiCallId, fnArgs);
        await CallRepository.updateStatus(vapiCallId, 'active', 'Appointment Booking');
        break;
      case 'endConversation':
        await supabaseService.endConversation(vapiCallId);
        break;
      default:
        logger.warn(`Unknown tool call function name: ${fnName}`);
    }
  }
};

const handleCallEnded = async (vapiCallId: string | undefined, message: any) => {
  if (vapiCallId) {
    logger.info(`Webhook call_ended: ${vapiCallId}`);
    await supabaseService.updateCallStatus(vapiCallId, 'completed');
  }
};