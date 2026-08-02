import { supabase } from '../supabase/client';
import { Call, ConversationMessage, QualificationAnswer } from '../types';
import { logger } from '../middlewares/logger';

export class CallRepository {
  static async create(call: { customer_id: string; vapi_call_id?: string; status?: string; stage?: string }): Promise<Call> {
    logger.info(`[CallRepository] Creating call record for customer ${call.customer_id}`);
    try {
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
        logger.warn(`[CallRepository] Supabase call save notice: ${error.message}`);
        return {
          id: `call-${Date.now()}`,
          customer_id: call.customer_id,
          vapi_call_id: call.vapi_call_id || `vapi-${Date.now()}`,
          status: (call.status || 'active') as any,
          stage: (call.stage || 'Greeting') as any,
          start_time: new Date().toISOString(),
          end_time: null,
          created_at: new Date().toISOString()
        };
      }
      return data;
    } catch (err: any) {
      return {
        id: `call-${Date.now()}`,
        customer_id: call.customer_id,
        vapi_call_id: call.vapi_call_id || `vapi-${Date.now()}`,
        status: (call.status || 'active') as any,
        stage: (call.stage || 'Greeting') as any,
        start_time: new Date().toISOString(),
        end_time: null,
        created_at: new Date().toISOString()
      };
    }
  }

  static async updateStatus(callId: string, status: string, stage?: string): Promise<void> {
    logger.info(`[CallRepository] Updating call ${callId} status=${status} stage=${stage}`);
    try {
      const updateData: any = { status };
      if (stage) updateData.stage = stage;
      if (status === 'completed' || status === 'failed') {
        updateData.end_time = new Date().toISOString();
      }

      await supabase.from('calls').update(updateData).eq('id', callId);
    } catch (err: any) {
      logger.warn(`[CallRepository] Update status error: ${err.message}`);
    }
  }

  static async saveMessage(message: { call_id: string; speaker: string; content: string }): Promise<ConversationMessage> {
    logger.info(`[CallRepository] Saving transcript message for call ${message.call_id} from ${message.speaker}`);
    try {
      const { data, error } = await supabase
        .from('conversation_messages')
        .insert([message])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      return {
        id: `msg-${Date.now()}`,
        call_id: message.call_id,
        speaker: message.speaker,
        content: message.content,
        timestamp: new Date().toISOString()
      };
    }
  }

  static async saveQualification(callId: string, question: string, answer: string): Promise<QualificationAnswer> {
    logger.info(`[CallRepository] Saving qualification for call ${callId}: ${question}`);
    try {
      const { data, error } = await supabase
        .from('qualification_answers')
        .insert([{ call_id: callId, question, answer }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      return {
        id: `qual-${Date.now()}`,
        call_id: callId,
        question,
        answer,
        created_at: new Date().toISOString()
      };
    }
  }

  static async getHistory(): Promise<any[]> {
    logger.info('[CallRepository] Fetching full call history');
    try {
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

      if (error || !data) return [];
      return data;
    } catch (err: any) {
      logger.warn(`[CallRepository] History fetch notice: ${err.message}`);
      return [];
    }
  }
}
