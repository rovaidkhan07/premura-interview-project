# Deployment Guide — SolarVoice AI

This guide details deploying the application for production:
- **Frontend** → Vercel
- **Backend** → Railway / Render / Fly.io

---

## 1. Deploy Backend to Railway

1. Sign in to [Railway.app](https://railway.app/).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select your repository and choose the `/backend` subdirectory.
4. Set the build command:
   ```bash
   npm run build
   ```
5. Set the start command:
   ```bash
   npm start
   ```
6. Add Environment Variables under project **Settings**:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `VAPI_API_KEY`: Your Vapi private key
   - `VAPI_ASSISTANT_ID`: Your Vapi assistant UUID
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key
   - `PORT`: `3001`
7. Railway will generate a public URL (e.g. `https://solarvoice-backend.up.railway.app`).

---

## 2. Deploy Frontend to Vercel

1. Sign in to [Vercel](https://vercel.com).
2. Click **Add New** → **Project** and select your GitHub repository.
3. Set the Root Directory to `frontend`.
4. Add Environment Variables:
   - `NEXT_PUBLIC_BACKEND_URL`: `https://solarvoice-backend.up.railway.app`
   - `NEXT_PUBLIC_VAPI_PUBLIC_KEY`: Your Vapi public key
5. Click **Deploy**.

---

## 3. Configure Vapi Webhook Endpoint

Once the backend is deployed on Railway:
1. Go to your [Vapi Dashboard](https://dashboard.vapi.ai).
2. Edit your Assistant settings.
3. Set **Server URL** to:
   `https://solarvoice-backend.up.railway.app/api/vapi/webhook`
4. Enable Server Events: `call-started`, `transcript`, `function-call`, `end-of-call-report`.
