import { supabase } from '../supabase/client';
import { Appointment } from '../types';
import { logger } from '../middlewares/logger';

export class AppointmentRepository {
  static async create(appointment: { call_id: string; date: string; time: string; notes?: string }): Promise<Appointment> {
    logger.info(`[AppointmentRepository] Booking appointment for call ${appointment.call_id} on ${appointment.date} at ${appointment.time}`);
    const { data, error } = await supabase
      .from('appointments')
      .insert([{
        call_id: appointment.call_id,
        date: appointment.date,
        time: appointment.time,
        notes: appointment.notes || null,
        status: 'confirmed'
      }])
      .select()
      .single();

    if (error) {
      logger.error(`[AppointmentRepository] Error creating appointment: ${error.message}`);
      throw error;
    }
    return data;
  }
}
