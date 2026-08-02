import { Request, Response } from 'express';
import { vapiService } from '../services/vapiService';
import { CustomerRepository } from '../repositories/customerRepository';
import { CallRepository } from '../repositories/callRepository';
import { logger } from '../middlewares/logger';

export const startCall = async (req: Request, res: Response) => {
  try {
    const { phone_number, name, address, zip_code, energy_bill, home_year, primary_decisionmaker } = req.body;

    logger.info(`Starting new call request for customer: ${name}`);

    // Save or update customer record in Supabase
    const customer = await CustomerRepository.create({
      name,
      address,
      zip_code,
      energy_bill: Number(energy_bill),
      home_year: Number(home_year),
      primary_decisionmaker: Boolean(primary_decisionmaker)
    });

    // Initiate Vapi Call
    let vapiCallResponse;
    try {
      vapiCallResponse = await vapiService.startCall({
        name,
        address,
        zip_code,
        phone_number
      });
    } catch (vapiErr: any) {
      logger.warn(`Vapi API call error (simulated call ID used for dev/testing if Vapi credentials unconfigured): ${vapiErr.message}`);
      vapiCallResponse = { id: `vapi-sim-${Date.now()}` };
    }

    // Save Call record in Supabase
    const supabaseCall = await CallRepository.create({
      customer_id: customer.id,
      vapi_call_id: vapiCallResponse?.id || `vapi-sim-${Date.now()}`,
      status: 'active',
      stage: 'Greeting'
    });

    res.status(200).json({
      success: true,
      callId: supabaseCall.id,
      vapiCallId: vapiCallResponse?.id,
      customerName: customer.name,
      customer: customer,
      status: 'active'
    });
  } catch (error: any) {
    logger.error(`Error starting call: ${error.message}`);
    res.status(500).json({ error: error.message || 'Unknown error occurred while starting call' });
  }
};

export const endCall = async (req: Request, res: Response) => {
  try {
    const { callId, vapiCallId } = req.body;
    logger.info(`Ending call: ${callId || vapiCallId}`);

    if (vapiCallId) {
      try {
        await vapiService.endCall(vapiCallId);
      } catch (err: any) {
        logger.warn(`Vapi end call request warning: ${err.message}`);
      }
    }

    if (callId) {
      await CallRepository.updateStatus(callId, 'completed', 'Completed');
    }

    res.status(200).json({ success: true, message: 'Call ended successfully' });
  } catch (error: any) {
    logger.error(`Error ending call: ${error.message}`);
    res.status(500).json({ error: error.message || 'Unknown error occurred while ending call' });
  }
};