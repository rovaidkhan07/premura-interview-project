export const vapiTools = [
  {
    type: 'function',
    function: {
      name: 'saveCustomer',
      description: 'Saves or updates homeowner customer information into Supabase',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Full name of the homeowner' },
          address: { type: 'string', description: 'Property address' },
          zip_code: { type: 'string', description: 'Property ZIP code' },
          energy_bill: { type: 'number', description: 'Average monthly electricity bill in USD' },
          home_year: { type: 'number', description: 'Year the home was built' },
          primary_decisionmaker: { type: 'boolean', description: 'Whether customer makes energy decisions' }
        },
        required: ['name', 'address', 'zip_code']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'saveTranscript',
      description: 'Saves an important transcript turn or summary to Supabase',
      parameters: {
        type: 'object',
        properties: {
          transcript: { type: 'string', description: 'The text snippet or summary' },
          speaker: { type: 'string', description: 'Speaker: customer or assistant' }
        },
        required: ['transcript']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'saveQualification',
      description: 'Saves qualification question and response into Supabase',
      parameters: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'Qualification question asked' },
          answer: { type: 'string', description: 'Homeowner answer' }
        },
        required: ['question', 'answer']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'bookAppointment',
      description: 'Books a free solar consultation appointment',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Date format YYYY-MM-DD' },
          time: { type: 'string', description: 'Time format HH:MM AM/PM' },
          notes: { type: 'string', description: 'Special consultation notes' }
        },
        required: ['date', 'time']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'endConversation',
      description: 'Ends the call gracefully after booking or when customer explicitly says goodbye',
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'Reason for ending call' }
        }
      }
    }
  }
];
