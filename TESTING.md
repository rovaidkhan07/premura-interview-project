# Testing Instructions — SolarVoice AI

Follow these instructions to test the complete application end-to-end.

---

## 1. Unit & Integration Tests (Backend)

Run Jest unit tests for API endpoints and controllers:

```bash
cd backend
npm test
```

---

## 2. Testing End-to-End Voice Flow

1. Start backend server:
   ```bash
   cd backend
   npm run dev
   ```
2. Start frontend dev server:
   ```bash
   cd frontend
   npm run dev
   ```
3. Open `http://localhost:3000` in your web browser.
4. Click **Start AI Call**.
5. Fill out the homeowner intake form (e.g. John Doe, $240 electric bill, 2012 home year).
6. Click **Launch AI Call Now**.
7. Observe:
   - Live transcript turns streaming in real-time.
   - Stage progression (Greeting → Verify Homeowner → Qualification → Appointment Booking).
   - Audio visualizer waves animating during active speech.
   - Session history automatically updated in recent call logs.

---

## 3. Webhook Simulation Testing

You can simulate a Vapi tool call webhook manually using `curl`:

```bash
curl -X POST http://localhost:3001/api/vapi/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "tool-calls",
    "call": { "id": "vapi-test-call-123" },
    "toolCalls": [
      {
        "name": "bookAppointment",
        "parameters": {
          "date": "2026-08-15",
          "time": "10:00 AM",
          "notes": "Interested in 10kW roof solar array"
        }
      }
    ]
  }'
```

Verify that the response returns `{"status":"success"}` and the appointment is created in Supabase.
