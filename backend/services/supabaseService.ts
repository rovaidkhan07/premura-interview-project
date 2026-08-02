import { supabase } from '../supabase/client';
import { logger } from '../middlewares/logger';

export const supabaseService = {
  async createCustomer(customer: {
    name: string;
    address: string;
    zip_code: string;
    energy_bill: number;
    home_year: number;
    primary_decisionmaker: boolean;
  }) {
    logger.info('Creating customer:', customer.name);
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
      .select()
      .single();

    if (error) {
      logger.error('Error creating customer:', error);
      throw error;
    }
    return data;
  },

  async createCall(call: {
    customer_id: string;
    vapi_call_id?: string;
    status?: string;
  }) {
    logger.info('Creating call for customer:', call.customer_id);
    const { data, error } = await supabase
      .from('calls')
      .insert([call])
      .select()
      .single();

    if (error) {
      logger.error('Error creating call:', error);
      throw error;
    }
    return data;
  },

  async updateCallStatus(callId: string, status: string) {
    logger.info(`Updating call ${callId} status to ${status}`);
    const { error } = await supabase
      .from('calls')
      .update({ status })
      .eq('id', callId);

    if (error) {
      logger.error('Error updating call status:', error);
      throw error;
    }
  },

  async saveMessage(message: {
    call_id: string;
    speaker: string;
    content: string;
  }) {
    logger.info(`Saving message for call ${message.call_id}`);
    const { data, error } = await supabase
      .from('conversation_messages')
      .insert([message])
      .select()
      .single();

    if (error) {
      logger.error('Error saving message:', error);
      throw error;
    }
    return data;
  },

  async saveTranscript(callId: string, transcript: string) {
    logger.info(`Saving transcript for call ${callId}`);
    const { data, error } = await supabase
      .from('conversation_messages')
      .insert([
        { call_id: callId, speaker: 'system', content: `Transcript: ${transcript}` },
        { call_id: callId, speaker: 'AI', content: transcript }
      ])
      .select();

    if (error) {
      logger.error('Error saving transcript:', error);
      throw error;
    }
    return data;
  },

  async saveQualificationAnswer(callId: string, question: string, answer: string) {
    logger.info(`Saving qualification answer for call ${callId}: ${question}`);
    const { data, error } = await supabase
      .from('qualification_answers')
      .insert([{ call_id: callId, question, answer }])
      .select()
      .single();

    if (error) {
      logger.error('Error saving qualification answer:', error);
      throw error;
    }
    return data;
  },

  async bookAppointment(callId: string, appointment: { date: string; time: string }) {
    logger.info(`Booking appointment for call ${callId}`);
    const { data, error } = await supabase
      .from('appointments')
      .insert([{ call_id: callId, ...appointment }])
      .select()
      .single();

    if (error) {
      logger.error('Error booking appointment:', error);
      throw error;
    }
    return data;
  },

  async endConversation(callId: string) {
    logger.info(`Ending conversation for call ${callId}`);
    const { data, error } = await supabase
      .from('calls')
      .update({ status: 'completed' })
      .eq('id', callId)
      .select()
      .single();

    if (error) {
      logger.error('Error ending conversation:', error);
      throw error;
    }
    return data;
  },

  async getCallById(callId: string) {
    logger.info(`Fetching call ${callId}`);
    const { data, error } = await supabase
      .from('calls')
      .select('*, customer:customers(*)')
      .eq('id', callId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is ok
      logger.error('Error fetching call:', error);
      throw error;
    }
    return data;
  },

  async getHistory() {
    logger.info('Fetching call history');
    const { data, error } = await supabase
      .from('calls')
      .select(`
        *,
        customer:customers(*),
        appointment:appointments(*),
        messages:conversation_messages(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching history:', error);
      throw error;
    }
    return data;
  },

  async saveCustomer(customer: any) {
    return this.createCustomer(customer);
  },

  async saveQualification(callId: string, parameters: any) {
    if (parameters.question && parameters.answer) {
      return this.saveQualificationAnswer(callId, parameters.question, parameters.answer);
    }
    for (const [key, value] of Object.entries(parameters)) {
      await this.saveQualificationAnswer(callId, key, String(value));
    }
  }
};