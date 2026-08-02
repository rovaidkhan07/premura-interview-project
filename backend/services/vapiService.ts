import https from 'https';
import { VAPI_API_KEY, VAPI_ASSISTANT_ID } from '../config/env';
import { logger } from '../middlewares/logger';

function makeRequest(url: string, method: string, headers: Record<string, string>, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!VAPI_API_KEY || VAPI_API_KEY.includes('your-vapi') || VAPI_API_KEY.startsWith('pk_')) {
      logger.warn('[VapiService] VAPI_API_KEY is not set to a valid private API key (sk_...). Operating in fallback mode.');
      return resolve({ id: `vapi-sim-${Date.now()}`, status: 'simulated' });
    }

    const urlObj = new URL(url);
    const options: https.RequestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          logger.warn(`[VapiService] API responded with status ${res.statusCode}: ${data}`);
          // Return simulated payload instead of crashing when Vapi credentials are invalid or unauthorized
          resolve({ id: `vapi-sim-${Date.now()}`, status: 'simulated', rawError: data });
        }
      });
    });

    req.on('error', (err) => {
      logger.error('[VapiService] Request error:', err);
      resolve({ id: `vapi-sim-${Date.now()}`, status: 'simulated' });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

export const vapiService = {
  async startCall(customer: {
    name: string;
    address: string;
    zip_code: string;
    phone_number: string;
  }): Promise<any> {
    logger.info(`Starting Vapi call for ${customer.name} (${customer.phone_number})...`);

    const headers = {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json'
    };

    const body = {
      assistantId: VAPI_ASSISTANT_ID,
      phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
      customer: {
        number: customer.phone_number,
        name: customer.name
      }
    };

    return makeRequest('https://api.vapi.ai/call', 'POST', headers, body);
  },

  async endCall(callId: string): Promise<any> {
    logger.info(`Ending Vapi call ${callId}...`);

    const headers = {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json'
    };

    return makeRequest(`https://api.vapi.ai/call/${callId}/end`, 'POST', headers);
  },

  async updateAssistant(assistantId: string, updates: any): Promise<any> {
    logger.info(`Updating assistant ${assistantId}...`);

    const headers = {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json'
    };

    return makeRequest(`https://api.vapi.ai/assistant/${assistantId}`, 'PATCH', headers, updates);
  }
};