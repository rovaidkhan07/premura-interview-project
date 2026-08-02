import { supabase } from '../supabase/client';
import { logger } from '../middlewares/logger';
import { CustomerRepository } from '../repositories/customerRepository';
import { CallRepository } from '../repositories/callRepository';
import { AppointmentRepository } from '../repositories/appointmentRepository';

export const supabaseService = {
  async createCustomer(customer: any) {
    return CustomerRepository.create(customer);
  },

  async createCall(call: any) {
    return CallRepository.create(call);
  },

  async updateCallStatus(callId: string, status: string) {
    return CallRepository.updateStatus(callId, status);
  },

  async saveMessage(message: any) {
    return CallRepository.saveMessage(message);
  },

  async saveTranscript(callId: string, transcript: string) {
    return CallRepository.saveMessage({
      call_id: callId,
      speaker: 'assistant',
      content: transcript
    });
  },

  async saveQualificationAnswer(callId: string, question: string, answer: string) {
    return CallRepository.saveQualification(callId, question, answer);
  },

  async bookAppointment(callId: string, appointment: any) {
    return AppointmentRepository.create({ call_id: callId, ...appointment });
  },

  async endConversation(callId: string) {
    return CallRepository.updateStatus(callId, 'completed', 'Completed');
  },

  async getCallById(callId: string) {
    return null;
  },

  async getHistory() {
    return CallRepository.getHistory();
  },

  async saveCustomer(customer: any) {
    return this.createCustomer(customer);
  },

  async saveQualification(callId: string, parameters: any) {
    if (parameters.question && parameters.answer) {
      return this.saveQualificationAnswer(callId, parameters.question, parameters.answer);
    }
    if (typeof parameters === 'object' && parameters !== null) {
      for (const [key, value] of Object.entries(parameters)) {
        await this.saveQualificationAnswer(callId, key, String(value));
      }
    }
  }
};