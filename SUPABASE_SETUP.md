# Supabase Setup Guide — SolarVoice AI

Follow these steps to set up your Supabase database schema and obtain API keys.

---

## Step 1: Create Supabase Project

1. Go to [Supabase Console](https://supabase.com/dashboard) and click **New Project**.
2. Name your project (e.g. `solar-voice-agent`).
3. Set a strong database password and select your preferred region.

---

## Step 2: Run SQL Migration Script

1. In your Supabase Dashboard, navigate to the **SQL Editor** tab.
2. Click **New Query**.
3. Copy and paste the entire contents of `backend/supabase/database.sql`:

```sql
-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  energy_bill NUMERIC NOT NULL DEFAULT 0,
  home_year INTEGER NOT NULL DEFAULT 2000,
  primary_decisionmaker BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Calls Table
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  vapi_call_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  stage TEXT DEFAULT 'Greeting',
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversation Messages Table
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
  speaker TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Qualification Answers Table
CREATE TABLE IF NOT EXISTS qualification_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

4. Click **Run**. All 5 tables and indexes will be created.

---

## Step 3: Copy API Credentials

1. Go to **Project Settings** → **API**.
2. Copy `Project URL` → set as `SUPABASE_URL` in `backend/.env`.
3. Copy `anon / public` key → set as `SUPABASE_ANON_KEY` in `backend/.env`.
4. Copy `service_role` key → set as `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`.
