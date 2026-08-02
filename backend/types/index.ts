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
  id: string;
  name: string;
  address: string;
  zip_code: string;
  energy_bill: number;
  home_year: number;
  primary_decisionmaker: boolean;
  created_at: string;
}

export interface Call {
  id: string;
  customer_id: string;
  vapi_call_id?: string;
  status: CallStatus;
  stage?: AgentStage;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  customer?: Customer;
}

export interface ConversationMessage {
  id: string;
  call_id: string;
  speaker: 'user' | 'assistant' | 'system' | 'bot' | string;
  content: string;
  timestamp: string;
}

export interface Appointment {
  id: string;
  call_id: string;
  customer_id?: string;
  date: string;
  time: string;
  status: 'confirmed' | 'cancelled';
  notes?: string;
  created_at: string;
}

export interface QualificationAnswer {
  id: string;
  call_id: string;
  question: string;
  answer: string;
  created_at: string;
}

export interface VapiWebhookEvent {
  message?: {
    type: 'call-started' | 'transcript' | 'function-call' | 'tool-calls' | 'end-of-call-report' | string;
    call?: {
      id: string;
      customer?: {
        number?: string;
        name?: string;
      };
    };
    transcript?: string;
    role?: string;
    functionCall?: {
      name: string;
      parameters: any;
    };
    toolCalls?: Array<{
      id: string;
      function: {
        name: string;
        arguments: any;
      };
    }>;
    endedReason?: string;
  };
  type?: string;
  call?: any;
  transcript?: any;
  toolCall?: any;
}
