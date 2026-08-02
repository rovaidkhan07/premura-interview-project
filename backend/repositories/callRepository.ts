import { supabase } from '../supabase/client';
import { Call, ConversationMessage, QualificationAnswer } from '../types';
import { logger } from '../middlewares/logger';

export class CallRepository {
  static async create(call: { customer_id: string; vapi_call_id?: string; status?: string; stage?: string }): Promise<Call> {
    logger.info(`[CallRepository] Creating call record for customer ${call.customer_id}`);
    const { data, error } = await supabase
      .from('calls')
      .insert([{
        customer_id: call.customer_id,
        vapi_call_id: call.vapi_call_id || null,
        status: call.status || 'active',
        stage: call.stage || 'Greeting',
        start_time: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      logger.error(`[CallRepository] Error creating call: ${error.message}`);
      throw error;
    }
    return data;
  }

  static async updateStatus(callId: string, status: string, stage?: string): Promise<void> {
    logger.info(`[CallRepository] Updating call ${callId} status=${status} stage=${stage}`);
    const updateData: any = { status };
    if (stage) updateData.stage = stage;
    if (status === 'completed' || status === 'failed') {
      updateData.end_time = new Date().toISOString();
    }

    const { error } = await supabase
      .from('calls')
      .update(updateData)
      .eq('id', callId);

    if (error) {
      logger.error(`[CallRepository] Error updating call status: ${error.message}`);
      throw error;
    }
  }

  static async saveMessage(message: { call_id: string; speaker: string; content: string }): Promise<ConversationMessage> {
    logger.info(`[CallRepository] Saving transcript message for call ${message.call_id} from ${message.speaker}`);
    const { data, error } = await supabase
      .from('conversation_messages')
      .insert([message])
      .select()
      .single();

    if (error) {
      logger.error(`[CallRepository] Error saving message: ${error.message}`);
      throw error;
    }
    return data;
  }

  static async saveQualification(callId: string, question: string, answer: string): Promise<QualificationAnswer> {
    logger.info(`[CallRepository] Saving qualification for call ${callId}: ${question}`);
    const { data, error } = await supabase
      .from('qualification_answers')
      .insert([{ call_id: callId, question, answer }])
      .select()
      .single();

    if (error) {
      logger.error(`[CallRepository] Error saving qualification: ${error.message}`);
      throw error;
    }
    return data;
  }

  static async getHistory(): Promise<any[]> {
    logger.info('[CallRepository] Fetching full call history');
    const { data, error } = await supabase
      .from('calls')
      .select(`
        *,
        customer:customers(*),
        appointment:appointments(*),
        messages:conversation_messages(*),
        qualifications:qualification_answers(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error(`[CallRepository] Error fetching history: ${error.message}`);
      throw error;
    }
    return data || [];
  }
}
