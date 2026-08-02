
# Claude Code Master Prompt — AI Voice Appointment Setter (Vapi + Supabase)

## ROLE

You are an Expert Senior Software Engineer and AI Solutions Architect with 15+ years of experience building production-ready SaaS, AI Voice Agents, and cloud applications.

Your goal is to build a **fully working MVP**, not a demo or mockup.

### Critical Rules

- Do NOT generate placeholder code.
- Do NOT leave TODO comments.
- Every feature must work end-to-end.
- Prioritize backend functionality over UI polish.
- If the response becomes too long, continue automatically until the entire project is generated.

---

# Project Goal

Build an AI Voice Appointment Setter for a Solar Consultation company.

The assistant will talk with homeowners using Vapi, qualify them using the provided sales script, handle objections using the supplied objection sheet, and book appointments.

Every interaction must automatically be saved into Supabase.

The application must support two deployments:

- Frontend → Vercel
- Backend → Railway (or Render/Fly.io)

The frontend and backend must communicate via REST APIs.

---

# Tech Stack

## Frontend

- Next.js 15
- App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod

## Backend

- Node.js
- Express.js
- TypeScript
- Vapi
- OpenAI-compatible model
- Supabase

---

# Architecture

Frontend is responsible only for:

- Dashboard
- Live transcript
- Status
- Call controls
- History

Backend is responsible for:

- AI logic
- Conversation state
- Tool calling
- Appointment booking
- Supabase
- Vapi webhook handling
- Business rules

No business logic should exist in the frontend.

---

# AI Behaviour

The assistant must:

- Greet naturally.
- Verify homeowner.
- Follow the provided Solar Consultation Script.
- Ask qualification questions.
- Handle objections.
- Continue the conversation until the customer explicitly ends it.
- Never ask the same question twice.
- Resume after interruptions.

The AI should not produce long paragraphs.

Maximum response length:

1–2 conversational sentences.

---

# Conversation State Machine

States:

1. Greeting
2. Verify Homeowner
3. Reason For Call
4. Qualification
5. Objection Handling
6. Appointment Booking
7. Confirmation
8. Completed

Every customer must always belong to one state.

---

# Objection Handling

Use the provided objection sheet as the knowledge base.

Store it in:

backend/data/objections.json

Do not hardcode responses throughout the application.

The AI should detect objections and retrieve the correct response.

---

# AI Prompt

Store the system prompt in:

backend/prompts/solar-agent.ts

Never hardcode prompts inside routes.

---

# Function Calling

Whenever important information is collected call backend tools:

saveCustomer()

saveTranscript()

saveQualification()

bookAppointment()

endConversation()

---

# Supabase

Automatically save:

- Customer
- Transcript
- Qualification answers
- Appointment
- Call status

Never require manual saving.

---

# Suggested Tables

customers

calls

conversation_messages

appointments

qualification_answers

---

# API Endpoints

POST /api/vapi/webhook

POST /api/calls/start

POST /api/calls/end

POST /api/customers

POST /api/appointments

GET /api/history

GET /api/customer/:id

---

# Vapi

Integrate an existing Vapi Assistant using environment variables.

Use webhooks for:

- Call Started
- Transcript
- Tool Calls
- Call Ended

---

# Frontend Dashboard

Include:

- Start AI Call
- End Call
- Live Transcript
- AI Status
- Customer Status
- Qualification Progress
- Appointment Summary
- Recent Calls

Simple UI only.

---

# Start Call Flow

When the user presses "Start AI Call"

Immediately connect to Vapi.

The assistant should begin speaking automatically.

Example:

"Hi, this is Sarah from the neighborhood energy consultation team. Am I speaking with the homeowner?"

---

# End Call

Only end when the customer says:

- Bye
- Goodbye
- Talk later
- Thank you, bye

After ending:

- Save transcript
- Save qualification
- Save appointment
- Update call status

---

# Folder Structure

frontend/

app/

components/

hooks/

services/

lib/

providers/

types/

utils/

backend/

controllers/

routes/

services/

repositories/

middlewares/

prompts/

tools/

vapi/

supabase/

config/

types/

validators/

---

# Environment Variables

Frontend

NEXT_PUBLIC_BACKEND_URL

NEXT_PUBLIC_VAPI_PUBLIC_KEY

Backend

OPENAI_API_KEY

VAPI_API_KEY

VAPI_ASSISTANT_ID

SUPABASE_URL

SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY

PORT

---

# Logging

Log:

- Call Started
- Transcript Received
- Customer Qualified
- Appointment Booked
- Supabase Saved
- Webhook Received
- Call Ended

Include timestamps.

---

# Deliverables

Generate:

- Complete frontend
- Complete backend
- SQL schema
- README
- Deployment guide
- API documentation
- .env.example
- Folder structure
- Vapi setup guide
- Supabase setup guide
- Testing instructions

Generate every required file until the project is fully complete.

The project should be production-ready, modular, clean, and runnable without placeholder implementations.
