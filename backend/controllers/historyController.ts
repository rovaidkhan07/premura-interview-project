import { Request, Response } from 'express';
import { CallRepository } from '../repositories/callRepository';
import { logger } from '../middlewares/logger';

export const getHistory = async (req: Request, res: Response) => {
  try {
    const history = await CallRepository.getHistory();
    res.json(history);
  } catch (error: any) {
    logger.error(`Error fetching call history: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
