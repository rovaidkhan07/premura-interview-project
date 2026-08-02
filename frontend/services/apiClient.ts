const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export const apiClient = {
  async startCall(customer: {
    phone_number: string;
    name: string;
    address: string;
    zip_code: string;
    energy_bill: number;
    home_year: number;
    primary_decisionmaker: boolean;
  }) {
    const response = await fetch(`${API_BASE_URL}/api/calls/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(err.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async endCall(callId: string, vapiCallId?: string) {
    const response = await fetch(`${API_BASE_URL}/api/calls/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId, vapiCallId })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(err.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async getHistory() {
    const response = await fetch(`${API_BASE_URL}/api/history`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.map((call: any) => ({
      id: call.id,
      customer_name: call.customer?.name || call.customer_name || 'Homeowner',
      status: call.status,
      stage: call.stage || 'Greeting',
      start_time: call.start_time || call.created_at,
      end_time: call.end_time,
      customer: call.customer,
      appointment: Array.isArray(call.appointment) ? call.appointment[0] : call.appointment,
      messages: call.messages || [],
      qualifications: call.qualifications || []
    }));
  },

  async getCustomer(id: string) {
    const response = await fetch(`${API_BASE_URL}/api/customer/${id}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async createAppointment(callId: string, date: string, time: string, notes?: string) {
    const response = await fetch(`${API_BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ call_id: callId, date, time, notes })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
};