# Vercel Deployment Setup

## Environment Variables Configuration

### Required Environment Variable

The frontend needs to know where the backend API is located. This is configured via:

**Variable Name:** `VITE_API_BASE_URL`

**Value for Production:** `https://api.pointwakeglobal.com`

### How to Configure in Vercel Dashboard

1. Go to your Vercel project: https://vercel.com/johnnyguy9/business-discovery
2. Click on **Settings** tab
3. Navigate to **Environment Variables** section
4. Add new variable:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://api.pointwakeglobal.com`
   - **Environments:** Check "Production" (and optionally Preview)
5. Click **Save**
6. **Redeploy** your application for changes to take effect

### How It Works

- The frontend code uses `import.meta.env.VITE_API_BASE_URL` to determine the API endpoint
- If not set, it defaults to `http://localhost:8000` (for local development)
- All API calls are made to `${VITE_API_BASE_URL}/api/*`

### Current API Endpoints

When properly configured, the frontend will call:
- Health check: `https://api.pointwakeglobal.com/api/health`
- Search: `https://api.pointwakeglobal.com/api/search`
- Results: `https://api.pointwakeglobal.com/api/results/{jobId}`
- CSV download: `https://api.pointwakeglobal.com/api/results/{jobId}/csv`

### Troubleshooting

**Issue:** Frontend shows "Backend offline"

**Causes:**
1. `VITE_API_BASE_URL` not set in Vercel → Frontend defaults to localhost
2. Backend not running on Lightsail
3. CORS not configured on backend to allow Vercel domain

**Solution:**
- Verify environment variable is set in Vercel dashboard
- Test backend directly: `curl https://api.pointwakeglobal.com/api/health`
- Check backend CORS allows: `https://business-discovery-5h72.vercel.app`

### Local Development

For local development, create a `.env.local` file:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

This file is gitignored and won't be committed.
