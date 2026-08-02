# Vapi AI Setup Guide — SolarVoice AI

Follow this guide to configure your Vapi Assistant and link it to the backend server.

---

## Step 1: Create Vapi Assistant

1. Log in to [Vapi Dashboard](https://dashboard.vapi.ai).
2. Click **Create Assistant** and choose **Blank Template**.
3. Name your Assistant: `Solar Voice Appointment Setter - Sarah`.

---

## Step 2: System Prompt Configuration

Copy the system prompt from `backend/prompts/solar-agent.ts` into the **System Prompt** section of your Vapi Assistant:

```text
You are an AI Voice Assistant working for a solar consultation company. Your job is to qualify homeowners and book appointments for free solar consultations. Keep responses to 1-2 conversational sentences.
```

---

## Step 3: Configure Voice & Model Settings

- **Model**: OpenAI `gpt-4o`
- **Voice Provider**: ElevenLabs
- **Voice ID**: `21m00Tcm4TlvDq8ikWAM` (Rachel/Sarah natural voice)
- **First Message**: 
  `Hi, this is Sarah from the neighborhood energy consultation team. Am I speaking with the homeowner?`

---

## Step 4: Add Tool Functions to Assistant

Add the following 5 functions under Assistant Tools:

1. `saveCustomer(name, address, zip_code, energy_bill, home_year, primary_decisionmaker)`
2. `saveTranscript(transcript, speaker)`
3. `saveQualification(question, answer)`
4. `bookAppointment(date, time, notes)`
5. `endConversation(reason)`

The tool declarations JSON is available at `backend/tools/vapiTools.ts`.

---

## Step 5: Server URL (Webhooks)

Set the **Server URL** in Assistant settings:
`https://your-backend-domain.com/api/vapi/webhook`

Copy your **Assistant ID** and **API Keys** into `backend/.env` and `frontend/.env`.
