export type CallStatus = 'pending' | 'active' | 'completed' | 'failed';

export type AgentStage = 
  | 'Greeting'
  | 'Verify Homeowner'
  | 'Reason For Call'
  | 'Qualification'
  | 'Objection Handling'
  | 'Appointment Booking'
  | 'Confirmation'
  | 'Completed';

export interface Customer {
  id?: string;
  name: string;
  phone_number: string;
  address: string;
  zip_code: string;
  energy_bill: number;
  home_year: number;
  primary_decisionmaker: boolean;
  created_at?: string;
}

export interface Call {
  id: string;
  vapi_call_id?: string;
  customer_id?: string;
  customer_name?: string;
  status: CallStatus;
  stage?: AgentStage;
  start_time: string | null;
  end_time: string | null;
  created_at?: string;
  customer?: Customer;
  appointment?: Appointment;
  messages?: Message[];
  qualifications?: QualificationAnswer[];
}

export interface Message {
  id: string;
  call_id?: string;
  speaker: 'user' | 'assistant' | 'system' | string;
  content: string;
  timestamp: string;
}

export interface Appointment {
  id?: string;
  call_id?: string;
  date: string;
  time: string;
  status?: 'confirmed' | 'cancelled';
  notes?: string;
  created_at?: string;
}

export interface QualificationAnswer {
  id?: string;
  call_id?: string;
  question: string;
  answer: string;
  created_at?: string;
}

export interface CallHistoryItem {
  id: string;
  customer_name: string;
  status: CallStatus;
  stage?: string;
  start_time: string;
  end_time: string | null;
  customer?: Customer;
  appointment?: Appointment;
  messages?: Message[];
}