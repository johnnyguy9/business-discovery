# Troubleshooting: Backend Connection Issues

## Current Issue: "Backend offline" after switching to Cloudflare HTTPS

### Quick Diagnostic Checklist

Run through these checks in order:

---

## 1. Verify Cloudflare DNS is Set Up

**Test in your browser:**
- Visit: https://api.pointwakeglobal.com/api/health
- **Expected result:** JSON response like `{"status": "healthy", "apiKeyConfigured": true}`
- **If you get:**
  - ❌ **DNS error / Site can't be reached** → DNS not configured (see Step A below)
  - ❌ **Cloudflare error page** → Proxy settings wrong (see Step B below)
  - ❌ **CORS error** → Backend CORS needs updating (see Step C below)
  - ✅ **JSON response** → DNS/Cloudflare is working, issue is with Vercel

---

## 2. Check Browser Console for Actual Error

**In your deployed app:**
1. Visit: https://business-discovery-5h72.vercel.app
2. Open DevTools (F12)
3. Go to **Console** tab
4. Look for errors related to `api.pointwakeglobal.com`

**Common errors and solutions:**

### Error: "Mixed Content: blocked loading https://..."
- **Cause:** Still calling HTTP instead of HTTPS
- **Fix:** Verify env var is HTTPS, rebuild (not just redeploy)

### Error: "net::ERR_NAME_NOT_RESOLVED"
- **Cause:** DNS doesn't exist for api.pointwakeglobal.com
- **Fix:** Configure DNS in Cloudflare (Step A)

### Error: "Access to fetch blocked by CORS policy"
- **Cause:** Backend doesn't allow requests from your Vercel domain
- **Fix:** Update backend CORS (Step C)

### Error: "Failed to fetch" or "NetworkError"
- **Cause:** Cloudflare proxy not configured or backend down
- **Fix:** Check Cloudflare proxy settings (Step B) or verify backend is running

---

## 3. Verify Vercel Environment Variable

**Check it's actually applied:**
1. Go to: https://vercel.com/johnnyguy9/business-discovery/settings/environment-variables
2. Find: `VITE_API_BASE_URL`
3. Value should be: `https://api.pointwakeglobal.com`
4. **Environment:** Should have "Production" checked
5. **Important:** After changing, you must **trigger a NEW build** (not just redeploy)
   - Go to Deployments → Create new deployment
   - Or push a new commit to trigger rebuild

---

## Step A: Configure Cloudflare DNS

**If api.pointwakeglobal.com doesn't resolve:**

1. Log in to Cloudflare dashboard
2. Select domain: **pointwakeglobal.com**
3. Go to **DNS** → **Records**
4. Add an **A record:**
   - **Name:** `api`
   - **IPv4 address:** `3.15.145.185` (your Lightsail IP)
   - **Proxy status:** ✅ **Proxied** (orange cloud icon - CRITICAL!)
   - **TTL:** Auto
5. Click **Save**
6. Wait 1-2 minutes for DNS propagation
7. Test: Visit https://api.pointwakeglobal.com/api/health

**Why "Proxied" matters:**
- ✅ **Proxied (orange cloud):** Cloudflare acts as proxy, provides HTTPS
- ❌ **DNS only (gray cloud):** Direct to IP, no HTTPS, won't work

---

## Step B: Configure Cloudflare SSL/TLS Settings

**If you get Cloudflare error pages:**

1. In Cloudflare dashboard → **SSL/TLS**
2. Set encryption mode to: **Flexible**
   - This allows: Browser (HTTPS) → Cloudflare (HTTPS) → Backend (HTTP)
3. **SSL/TLS** → **Edge Certificates**
   - Verify "Always Use HTTPS" is **ON**
4. Test again: https://api.pointwakeglobal.com/api/health

---

## Step C: Update Backend CORS Settings

**If you get CORS errors:**

The backend needs to allow requests from your Vercel domain.

**Check current CORS in backend:**
```python
# backend/api_server.py (around line 20)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Currently allows all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**If it's set to `["*"]` → should work for all domains (including Vercel)**

**If it's set to specific domains:**
```python
allow_origins=[
    "https://business-discovery-5h72.vercel.app",  # Add your Vercel domain
    "https://api.pointwakeglobal.com",  # Add Cloudflare domain
    "http://localhost:5173",  # Keep for local dev
],
```

Then restart backend: `python backend/api_server.py`

---

## Step D: Force Vercel to Rebuild (Not Just Redeploy)

**Critical:** Environment variables are **build-time**, not runtime!

**Wrong way (doesn't work):**
- Click "Redeploy" on existing deployment ❌
- This uses cached build with old env var

**Correct way:**
1. **Option A:** Push a new commit
   ```bash
   git commit --allow-empty -m "Force rebuild with new env var"
   git push origin main
   ```

2. **Option B:** Delete .vercel/cache and redeploy
   - In Vercel dashboard: Settings → General → Clear Build Cache
   - Then: Deployments → Redeploy (with "Use existing Build Cache" UNCHECKED)

---

## Verification Steps

After completing fixes above:

1. **Test Cloudflare directly:**
   ```bash
   curl https://api.pointwakeglobal.com/api/health
   ```
   Should return: `{"status":"healthy","apiKeyConfigured":true}`

2. **Check deployed frontend:**
   - Visit: https://business-discovery-5h72.vercel.app
   - Should show: "🔄 Checking backend connection..."
   - Then: "✅ Backend ready" (NOT "❌ Backend offline")

3. **Verify in DevTools:**
   - F12 → Network tab
   - Look for request to: `https://api.pointwakeglobal.com/api/health`
   - Status should be: **200 OK**
   - Response should be JSON: `{"status":"healthy",...}`

---

## Still Not Working?

**Share these details:**
1. What do you see when visiting: https://api.pointwakeglobal.com/api/health
2. What error appears in browser console (F12)?
3. What's the value of `VITE_API_BASE_URL` in Vercel dashboard?
4. Did you rebuild (not just redeploy) after changing env var?

---

## Quick Reference

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| "DNS not found" | DNS not configured | Step A: Add A record in Cloudflare |
| "Cloudflare error" | SSL/TLS wrong | Step B: Set SSL to Flexible |
| "CORS policy" | Backend CORS | Step C: Update CORS settings |
| "Backend offline" (no other errors) | Env var not rebuilt | Step D: Force new build |
| "Mixed content" | Still using HTTP | Check env var is HTTPS, rebuild |

---

## Expected Final State

**Architecture:**
```
Browser
  ↓ HTTPS
Vercel Frontend (reads VITE_API_BASE_URL at build time)
  ↓ HTTPS fetch() calls
Cloudflare (api.pointwakeglobal.com)
  ↓ HTTP (internal)
AWS Lightsail (3.15.145.185:8000)
```

**All API calls should go to:** `https://api.pointwakeglobal.com/api/*`

**No calls should go to:**
- ❌ `http://3.15.145.185`
- ❌ `http://localhost:8000` (in production)
