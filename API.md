# REST & Webhook API Documentation — SolarVoice AI

Base URL (Local): `http://localhost:3001`  
Base URL (Production): `https://<your-backend-railway-url>`

---

## Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/vapi/webhook` | Handles all Vapi webhook events & tool calls |
| `POST` | `/api/calls/start` | Initiates customer creation & AI voice call |
| `POST` | `/api/calls/end` | Gracefully terminates an active call session |
| `POST` | `/api/customers` | Creates customer lead record in Supabase |
| `GET` | `/api/customer/:id` | Retrieves customer profile by UUID |
| `POST` | `/api/appointments` | Books solar consultation appointment |
| `GET` | `/api/history` | Fetches historical call logs & transcripts |

---

## Detailed Specifications

### 1. `POST /api/calls/start`
Initiates customer creation and starts Vapi voice call.

**Request Body:**
```json
{
  "phone_number": "(555) 234-5678",
  "name": "Sarah Jenkins",
  "address": "742 Evergreen Terrace",
  "zip_code": "90210",
  "energy_bill": 240,
  "home_year": 2012,
  "primary_decisionmaker": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "callId": "uuid-here",
  "vapiCallId": "vapi-call-uuid",
  "customerName": "Sarah Jenkins",
  "status": "active"
}
```

---

### 2. `POST /api/vapi/webhook`
Receiver for Vapi server events and tool calls.

**Supported Events:**
- `call-started`: Updates call status to `active`.
- `transcript`: Stores conversation turn into `conversation_messages` table.
- `tool-calls` / `function-call`: Triggers internal handlers for `saveCustomer`, `saveTranscript`, `saveQualification`, `bookAppointment`, `endConversation`.
- `end-of-call-report` / `call-ended`: Marks call as `completed`.

---

### 3. `GET /api/history`
Returns list of all calls, associated customer data, booked appointments, and transcripts.

**Response (200 OK):**
```json
[
  {
    "id": "call-uuid",
    "status": "completed",
    "stage": "Appointment Booking",
    "start_time": "2026-08-03T01:00:00.000Z",
    "customer": {
      "name": "Sarah Jenkins",
      "address": "742 Evergreen Terrace",
      "zip_code": "90210"
    },
    "appointment": {
      "date": "2026-08-10",
      "time": "02:00 PM",
      "status": "confirmed"
    }
  }
]
```
