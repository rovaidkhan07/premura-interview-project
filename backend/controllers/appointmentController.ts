import { Request, Response } from 'express';
import { AppointmentRepository } from '../repositories/appointmentRepository';
import { logger } from '../middlewares/logger';

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const { call_id, date, time, notes } = req.body;
    if (!call_id || !date || !time) {
      return res.status(400).json({ error: 'call_id, date, and time are required fields' });
    }

    const appointment = await AppointmentRepository.create({
      call_id,
      date,
      time,
      notes
    });

    res.status(201).json(appointment);
  } catch (error: any) {
    logger.error(`Error creating appointment: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
