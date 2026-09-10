# Teameit — Production Launch Guide
**Complete Step-by-Step Developer Reference**  
**Estimated Total Time: ~3–4 hours (first time)**

---

> **How to read this guide**  
> Every step is written as: **go to this URL → click this → type this → save**.  
> Follow sections in order. Each section must be complete before the next one starts.

---

## OVERVIEW — What You Are Configuring

```
┌─────────────────────────────────────────────────────────────┐
│                      TEAMEIT STACK                           │
│                                                              │
│  Frontend (Vercel)  ──→  Backend (Railway)  ──→  DB (Supabase) │
│       ↓                        ↓                              │
│  Static Web App          Node.js API               Postgres   │
│                              ↓                              │
│                    Meta (FB/IG/WA) + Google APIs            │
└─────────────────────────────────────────────────────────────┘
```

**Services you will set up:**
1. ✅ Supabase (Database + Auth)
2. ✅ Railway (Backend API hosting)
3. ✅ Vercel (Frontend hosting)
4. ✅ Meta Developer (WhatsApp / Instagram / Facebook)
5. ✅ Google Cloud (Google Ads / Analytics / Business Profile)

---

## SECTION 1 — SUPABASE (Database)

**Time: ~20 minutes**

### Step 1.1 — Create Supabase Account

1. Go to → **https://supabase.com**
2. Click **"Start your project"** (top right)
3. Click **"Sign up with GitHub"** (recommended) or enter your email
4. Verify your email if asked

### Step 1.2 — Create Your Project

1. After login, click **"New project"**
2. Fill in:
   - **Organization:** Select your org or create one (type your company name → click "Create organization")
   - **Project name:** `teameit-production`
   - **Database Password:** Click "Generate a password" → **COPY AND SAVE THIS SOMEWHERE SAFE**
   - **Region:** Select the closest to your users (e.g., `South Asia (Mumbai)` for India)
   - **Pricing Plan:** Free tier for testing, Pro ($25/month) for production
3. Click **"Create new project"**
4. Wait ~2 minutes for the project to initialize (you will see a loading spinner)

### Step 1.3 — Copy Your Keys

Once the project is ready:

1. In the left sidebar, click **"Project Settings"** (gear icon at the bottom)
2. Click **"API"** in the settings menu
3. You will see a page with keys. **Copy all three:**

```
Project URL:          https://xxxxxxxxxxxx.supabase.co  → this is SUPABASE_URL
anon / public key:    eyJhbGciOiJIUzI1...              → this is SUPABASE_ANON_KEY
service_role key:     eyJhbGciOiJIUzI1...              → this is SUPABASE_SERVICE_ROLE_KEY
```

> ⚠️ **NEVER expose the service_role key in your frontend or public repos.**

### Step 1.4 — Run Database Migrations

1. In your Supabase project, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. On your computer, open Terminal and run:
   ```bash
   cd "/Users/jameeru/Desktop/Projest ASTRA"
   cat supabase/migrations/*.sql
   ```
4. Copy ALL the SQL output
5. Paste it into the Supabase SQL Editor
6. Click **"Run"** (or press Cmd+Enter)
7. You should see: `Success. No rows returned`

> If you see errors about "already exists", that is OK — the tables already exist.

### Step 1.5 — Configure Email Auth

1. In left sidebar, click **"Authentication"**
2. Click **"Providers"**
3. Scroll down to **"Email"** — make sure it is toggled **ON**
4. Click **"Providers"** → **"Email"**
5. Set:
   - **Confirm email:** Toggle **ON** (users verify their email)
   - **Secure email change:** Toggle **ON**
6. Click **"Save"**

### Step 1.6 — Set Up Auth Redirect URL

1. In Authentication sidebar, click **"URL Configuration"**
2. Under **"Site URL"**, enter your Vercel frontend URL:
   ```
   https://teameit.vercel.app
   ```
   (You will update this once you know your exact Vercel URL in Section 3)
3. Under **"Redirect URLs"**, click **"Add URL"** and add:
   ```
   https://teameit.vercel.app/**
   https://teameit.vercel.app/login
   ```
4. Click **"Save"**

---

## SECTION 2 — RAILWAY (Backend API)

**Time: ~15 minutes**

### Step 2.1 — Create Railway Account

1. Go to → **https://railway.app**
2. Click **"Login"** → **"Login with GitHub"**
3. Authorize Railway to access your GitHub

### Step 2.2 — Create a New Project

1. After login, click **"New Project"** (top right)
2. Select **"Deploy from GitHub repo"**
3. If asked, click **"Configure GitHub App"** → select your repository → click **"Save"**
4. Select your **teameit repository** from the list
5. Railway will detect it automatically

### Step 2.3 — Configure the Service

1. Railway will create a service. Click on the service name
2. Click the **"Settings"** tab
3. Under **"Source"**:
   - **Root Directory:** `apps/api`
   - **Build Command:** `npm run build`
   - **Start Command:** `node dist/index.js`
4. Click **"Save"**

### Step 2.4 — Set Environment Variables

1. Click the **"Variables"** tab
2. Click **"RAW Editor"** (top right of the variables section)
3. Paste the following (replace every `your_...` value):

```env
NODE_ENV=production
PORT=3001

SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1...your_service_role_key
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...your_anon_key

JWT_SECRET=paste_here_output_of_openssl_rand_hex_32
OAUTH_STATE_SECRET=paste_here_output_of_openssl_rand_hex_32

META_APP_ID=will_fill_in_section_4
META_APP_SECRET=will_fill_in_section_4
WHATSAPP_VERIFY_TOKEN=pick_any_secret_string_like_teameit_wa_prod_2026
INSTAGRAM_VERIFY_TOKEN=pick_any_secret_string_like_teameit_ig_prod_2026
FACEBOOK_VERIFY_TOKEN=pick_any_secret_string_like_teameit_fb_prod_2026

GOOGLE_CLIENT_ID=will_fill_in_section_5
GOOGLE_CLIENT_SECRET=will_fill_in_section_5

API_BASE_URL=https://your-app.up.railway.app
FRONTEND_URL=https://teameit.vercel.app
```

4. To generate `JWT_SECRET` and `OAUTH_STATE_SECRET`, open Terminal:
   ```bash
   openssl rand -hex 32
   # Copy the output → paste as JWT_SECRET
   openssl rand -hex 32
   # Copy the output → paste as OAUTH_STATE_SECRET
   ```

5. Click **"Update Variables"**

### Step 2.5 — Get Your Railway URL

1. Click the **"Settings"** tab
2. Under **"Networking"**, click **"Generate Domain"**
3. Copy the URL (looks like `https://teameit-api.up.railway.app`)
4. Go back to **"Variables"** and update `API_BASE_URL` to this URL
5. Click **"Deploy"** → Railway will build and deploy your API

### Step 2.6 — Verify API is Live

1. Open your browser
2. Go to: `https://your-railway-url.up.railway.app/health`
3. You should see: `{"status":"ok"}`

> If you see a 404 or error, check the **"Deployments"** tab and click your latest deploy → **"View Logs"** to see what went wrong.

---

## SECTION 3 — VERCEL (Frontend)

**Time: ~10 minutes**

### Step 3.1 — Create Vercel Account

1. Go to → **https://vercel.com**
2. Click **"Sign Up"** → **"Continue with GitHub"**
3. Authorize Vercel

### Step 3.2 — Import Your Project

1. On the Vercel dashboard, click **"Add New..."** → **"Project"**
2. Find your teameit repository → click **"Import"**
3. Configure the project:
   - **Framework Preset:** Vite (Vercel usually auto-detects this)
   - **Root Directory:** Click **"Edit"** → type `apps/web` → click **"Continue"**
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

### Step 3.3 — Set Environment Variables

1. Scroll down to **"Environment Variables"**
2. Add each one by clicking **"Add"**:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://xxxxxxxxxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1...your_anon_key` |
| `VITE_API_URL` | `https://your-app.up.railway.app` |

3. Click **"Deploy"**
4. Wait ~2 minutes for the build to complete
5. Vercel will give you a URL like `https://teameit.vercel.app`

### Step 3.4 — Update Your Supabase Redirect URLs

Now that you have your real Vercel URL:

1. Go back to **https://supabase.com** → your project
2. Click **"Authentication"** → **"URL Configuration"**
3. Update **"Site URL"** to your actual Vercel URL
4. Add the Vercel URL to **"Redirect URLs"**
5. Click **"Save"**

### Step 3.5 — Update Railway with Frontend URL

1. Go back to **https://railway.app** → your project → **Variables**
2. Update `FRONTEND_URL` to your actual Vercel URL
3. Click **"Update Variables"** → Railway will redeploy

### Step 3.6 — Test the Frontend

1. Open: `https://teameit.vercel.app`
2. You should see the Teameit login page
3. Try signing up with your email
4. Check your email for the confirmation link
5. Click the link → you should be redirected back and logged in

---

## SECTION 4 — META (WhatsApp / Instagram / Facebook)

**Time: ~45 minutes**

### Step 4.1 — Create Meta Developer Account

1. Go to → **https://developers.facebook.com**
2. Click **"Get Started"** (top right)
3. Log in with your personal Facebook account (required by Meta)
4. Accept the Meta Platform Terms
5. Click **"Create First App"** or **"Create App"**

### Step 4.2 — Create Your App

1. On the app creation screen:
   - **App type:** Select **"Business"** → click **"Next"**
   - **App name:** `Teameit`
   - **App contact email:** your business email
   - **Business account:** Select your business portfolio (or create one)
2. Click **"Create App"**
3. Complete the security check if shown

### Step 4.3 — Copy App Credentials

1. In the left sidebar, click **"App Settings"** → **"Basic"**
2. Copy:
   - **App ID** → this is `META_APP_ID`
   - **App Secret** → click "Show" → copy → this is `META_APP_SECRET`
3. Go to Railway → Variables → update `META_APP_ID` and `META_APP_SECRET`

### Step 4.4 — Configure WhatsApp

1. In the left sidebar, scroll to **"Add Products"**
2. Find **"WhatsApp"** → click **"Set up"**
3. Select your **Business Portfolio** → click **"Continue"**
4. You will see the WhatsApp quickstart page

**Add a Phone Number:**
1. Click **"Add phone number"** under "Step 5: Add a phone number"
2. Enter your WhatsApp Business phone number
3. Choose verification method (SMS or Call) → click **"Send Code"**
4. Enter the 6-digit code → click **"Verify"**

**Configure Webhook:**
1. In the left sidebar under WhatsApp, click **"Configuration"**
2. Under **"Webhook"**, click **"Edit"**
3. Fill in:
   - **Callback URL:** `https://your-railway-url.up.railway.app/api/v1/webhooks/whatsapp`
   - **Verify Token:** The value you set as `WHATSAPP_VERIFY_TOKEN` in Railway (e.g., `teameit_wa_prod_2026`)
4. Click **"Verify and Save"**
5. Railway will receive the verification request — if it returns 200, you will see ✅
6. Click **"Manage"** next to webhook fields
7. Toggle **ON:** `messages`
8. Click **"Done"**

### Step 4.5 — Configure Instagram

1. In the left sidebar, click **"Add Products"** (or scroll down)
2. Find **"Instagram"** → click **"Set up"**

**Connect Instagram Account:**
1. Click **"Add Instagram Test Account"** (or use a real account for production)
2. Click **"Connect your Instagram account"**
3. Log in to Instagram → click **"Authorize"**
4. The account will appear as connected

**Configure Webhook:**
1. In the left sidebar under Instagram, click **"API Setup with Instagram"**
2. Scroll to **"Configure webhooks"**
3. Click **"Add Callback URL"**
4. Fill in:
   - **Callback URL:** `https://your-railway-url.up.railway.app/api/v1/webhooks/instagram`
   - **Verify Token:** The value you set as `INSTAGRAM_VERIFY_TOKEN` in Railway
5. Click **"Verify and Save"** → you will see ✅
6. Toggle **ON** the `messages` and `comments` fields

### Step 4.6 — Configure Facebook Pages

1. In the left sidebar, click **"Add Products"**
2. Find **"Messenger"** → click **"Set up"**

**Connect a Page:**
1. Click **"Add or Remove Pages"** under "Access Tokens"
2. Select your Facebook Business Page → click **"Continue"** → **"OK"**
3. Copy the **Page Access Token** (you may need this for advanced messaging features)

**Configure Webhook:**
1. Scroll to **"Webhooks"** section → click **"Add Callback URL"**
2. Fill in:
   - **Callback URL:** `https://your-railway-url.up.railway.app/api/v1/webhooks/facebook`
   - **Verify Token:** The value you set as `FACEBOOK_VERIFY_TOKEN` in Railway
3. Click **"Verify and Save"** → you will see ✅
4. Click **"Add Subscriptions"** → toggle ON: `messages`, `messaging_postbacks`

### Step 4.7 — Add OAuth Redirect URIs

1. In the left sidebar, click **"App Settings"** → **"Basic"**
2. Scroll to **"App Domains"** → add your Railway domain (e.g., `your-app.up.railway.app`)
3. In the left sidebar, click **"Facebook Login"** → **"Settings"**
4. Under **"Valid OAuth Redirect URIs"**, add:
   ```
   https://your-railway-url.up.railway.app/api/v1/integrations/meta/oauth/callback
   https://your-railway-url.up.railway.app/api/v1/integrations/facebook/oauth/callback
   https://your-railway-url.up.railway.app/api/v1/integrations/instagram/oauth/callback
   https://your-railway-url.up.railway.app/api/v1/integrations/whatsapp/oauth/callback
   ```
5. Click **"Save Changes"**

### Step 4.8 — Switch App to Live Mode

> ⚠️ While in **Development mode**, only users you explicitly add as testers can use the app.
> Before going live to real users, submit for App Review.

For testing right now:
1. In the left sidebar, click **"App Settings"** → **"Basic"**
2. Toggle the switch at the top from **"Development"** to **"Live"**
3. Click **"Switch Mode"** to confirm

For full production (connecting real users):
1. In the left sidebar, click **"App Review"** → **"Permissions and Features"**
2. Request the permissions your app uses
3. Submit for review with screenshots/video of your app's usage

---

## SECTION 5 — GOOGLE CLOUD (Analytics / Ads / Business Profile)

**Time: ~30 minutes**

### Step 5.1 — Create Google Cloud Project

1. Go to → **https://console.cloud.google.com**
2. Sign in with your Google account
3. At the top, click the project dropdown → **"New Project"**
4. Fill in:
   - **Project name:** `Teameit`
   - **Organization:** Select your org or leave as "No organization"
5. Click **"Create"**
6. Wait for the project to be created (10 seconds)
7. Make sure you are in the new project (check the top dropdown)

### Step 5.2 — Create OAuth Credentials

1. In the left sidebar, click **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** → **"OAuth client ID"**
3. If asked to configure the consent screen first:
   - Click **"Configure Consent Screen"**
   - Choose **"External"** → click **"Create"**
   - Fill in:
     - **App name:** `Teameit`
     - **User support email:** your email
     - **Developer contact email:** your email
   - Click **"Save and Continue"**
   - On "Scopes" page → click **"Add or Remove Scopes"**
   - Search for and add:
     - `https://www.googleapis.com/auth/adwords`
     - `https://www.googleapis.com/auth/analytics.readonly`
     - `https://www.googleapis.com/auth/business.manage`
     - `https://www.googleapis.com/auth/webmasters.readonly`
   - Click **"Update"** → **"Save and Continue"**
   - On "Test Users" page → click **"+ Add Users"** → add your Google email → **"Save and Continue"**
   - Click **"Back to Dashboard"**
4. Now click **"+ Create Credentials"** → **"OAuth client ID"** again
5. Fill in:
   - **Application type:** `Web application`
   - **Name:** `Teameit Production`
   - Under **"Authorized redirect URIs"**, click **"+ Add URI"** and add:
     ```
     https://your-railway-url.up.railway.app/api/v1/integrations/google/oauth/callback
     https://your-railway-url.up.railway.app/api/v1/integrations/google_ads/oauth/callback
     https://your-railway-url.up.railway.app/api/v1/integrations/google_analytics/oauth/callback
     https://your-railway-url.up.railway.app/api/v1/integrations/google_business/oauth/callback
     ```
6. Click **"Create"**
7. A popup appears with:
   - **Your Client ID** → this is `GOOGLE_CLIENT_ID`
   - **Your Client Secret** → this is `GOOGLE_CLIENT_SECRET`
8. Click **"Download JSON"** to save a backup
9. Click **"OK"**

### Step 5.3 — Enable Required APIs

1. In the left sidebar, click **"APIs & Services"** → **"Library"**
2. Search and enable each of the following (click the API name → click **"Enable"**):
   - `Google Ads API`
   - `Google Analytics Data API`
   - `Google Analytics Reporting API`
   - `Business Profile API`
   - `Google Search Console API`
   - `YouTube Data API v3`
3. Each takes ~5 seconds to enable. You will see the **"Manage"** button when done.

### Step 5.4 — Update Railway with Google Credentials

1. Go back to **https://railway.app** → your project → **Variables**
2. Update:
   - `GOOGLE_CLIENT_ID` → paste your Client ID
   - `GOOGLE_CLIENT_SECRET` → paste your Client Secret
3. Click **"Update Variables"** → Railway redeploys

### Step 5.5 — Google Ads Developer Token (Required for Ads API)

> The Google Ads API requires a Developer Token which must be applied for separately.

1. Go to → **https://ads.google.com**
2. Sign in with your Google account
3. Create a Google Ads account if you don't have one (you can use a manager account)
4. Go to **Tools & Settings** (wrench icon) → **API Center**
5. Click **"Apply for basic access"**
6. Fill in the form describing how Teameit uses Google Ads data
7. The token will be approved within 1–3 business days
8. Once approved, go back to **Tools & Settings** → **API Center**
9. Copy the **Developer Token** value
10. Add it to Railway variables as: `GOOGLE_ADS_DEVELOPER_TOKEN`

---

## SECTION 6 — CUSTOM DOMAIN (Optional but Recommended)

**Time: ~15 minutes**

### Step 6.1 — Add Domain to Vercel (Frontend)

1. Go to **https://vercel.com** → your project → **"Settings"** tab → **"Domains"**
2. Click **"Add"** → type your domain (e.g., `app.teameit.com`)
3. Vercel will show you DNS records to add
4. Go to your domain registrar (GoDaddy / Namecheap / Cloudflare etc.)
5. Add the DNS records Vercel shows:
   - If using Vercel nameservers: change your NS records
   - If using custom DNS: add the CNAME record shown
6. Click **"Verify"** — DNS can take 5–60 minutes to propagate
7. Vercel auto-provisions SSL (you will see a padlock icon when done)

### Step 6.2 — Add Domain to Railway (Backend API)

1. Go to **https://railway.app** → your project → **"Settings"** → **"Networking"**
2. Under **"Custom Domain"**, click **"+ Custom Domain"**
3. Enter your API subdomain (e.g., `api.teameit.com`)
4. Railway shows a CNAME record — add it to your DNS registrar
5. Once verified, Railway shows ✅

### Step 6.3 — Update All URLs

Once your domains are live, update everywhere:
1. Railway Variables: `API_BASE_URL=https://api.teameit.com`, `FRONTEND_URL=https://app.teameit.com`
2. Vercel Environment Variables: `VITE_API_URL=https://api.teameit.com`
3. Supabase → Authentication → URL Configuration → update Site URL and Redirect URLs
4. Meta Developer → Facebook Login → Authorized Redirect URIs → update all to `https://api.teameit.com/...`
5. Google Cloud → Credentials → your OAuth client → update Authorized redirect URIs

---

## SECTION 7 — FINAL CHECKLIST BEFORE LAUNCH

Run through this list top to bottom. Do not skip items.

### 7.1 — Infrastructure

```
[ ] Supabase project is on Pro plan (Free plan has pausing and row limits)
[ ] All database migrations ran without errors (check Supabase → Table Editor → verify tables exist)
[ ] Railway deployment shows "Active" status (green dot)
[ ] Vercel deployment shows "Ready" status
[ ] https://api.teameit.com/health returns {"status":"ok"}
[ ] https://app.teameit.com loads the login page
```

### 7.2 — Authentication Flow

```
[ ] Go to https://app.teameit.com → you see the login page
[ ] Click "Sign Up" → enter email + password → click "Sign Up"
[ ] Check your email → click the confirmation link → you are redirected to the app
[ ] You are logged in and see "Loading Workspace..." or the create workspace screen
[ ] Click "Create Workspace" → fill in name and slug → click "Create"
[ ] You are taken to the dashboard
[ ] Sign out → sign back in → dashboard loads correctly
```

### 7.3 — Meta Integrations

```
[ ] Go to Integrations page → click "Connect" next to WhatsApp
[ ] You are redirected to Facebook login (NOT localhost)
[ ] After authorizing, you are redirected back to Teameit
[ ] WhatsApp shows as "Connected" in the Integrations page
[ ] Repeat for Instagram and Facebook
[ ] Send a WhatsApp message to your connected number → it appears in Inbox within 10 seconds
```

### 7.4 — Google Integrations

```
[ ] Go to Integrations page → click "Connect" next to Google
[ ] You are redirected to accounts.google.com
[ ] After authorizing, you are redirected back to Teameit
[ ] Google shows as "Connected"
```

### 7.5 — Email Integration

```
[ ] Go to Integrations → Email → fill in SMTP and IMAP credentials
[ ] Click "Connect" → you see "Email Connected" with a green check
[ ] Go to Campaigns → Create Campaign → select Email → pick a contact → send
[ ] Verify the email arrives in the recipient's inbox
```

### 7.6 — Security Verification

```
[ ] Open browser DevTools → Network tab → confirm NO requests expose SUPABASE_SERVICE_ROLE_KEY
[ ] In Railway Variables, confirm NODE_ENV=production
[ ] META_APP_SECRET is set and not empty
[ ] OAUTH_STATE_SECRET is set and not empty
[ ] JWT_SECRET is set and not empty
[ ] No .env files committed to your Git repository (run: git status — should not show .env)
```

---

## SECTION 8 — ENVIRONMENT VARIABLES — COMPLETE REFERENCE

### Backend (`apps/api/.env`)

| Variable | Where to Get It | Required |
|----------|----------------|----------|
| `SUPABASE_URL` | Supabase → Project Settings → API | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API | ✅ |
| `SUPABASE_ANON_KEY` | Supabase → Project Settings → API | ✅ |
| `PORT` | Set to `3001` | ✅ |
| `NODE_ENV` | Set to `production` | ✅ |
| `JWT_SECRET` | `openssl rand -hex 32` | ✅ |
| `OAUTH_STATE_SECRET` | `openssl rand -hex 32` | ✅ |
| `META_APP_ID` | Meta Developer → App Settings → Basic | ✅ |
| `META_APP_SECRET` | Meta Developer → App Settings → Basic → Show | ✅ |
| `WHATSAPP_VERIFY_TOKEN` | You choose any secret string | ✅ |
| `INSTAGRAM_VERIFY_TOKEN` | You choose any secret string | ✅ |
| `FACEBOOK_VERIFY_TOKEN` | You choose any secret string | ✅ |
| `GOOGLE_CLIENT_ID` | Google Cloud → APIs & Services → Credentials | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google Cloud → APIs & Services → Credentials | ✅ |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Google Ads → Tools → API Center | When using Google Ads |
| `API_BASE_URL` | Your Railway URL | ✅ |
| `FRONTEND_URL` | Your Vercel URL | ✅ |

### Frontend (`apps/web/.env`)

| Variable | Where to Get It | Required |
|----------|----------------|----------|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | ✅ |
| `VITE_API_URL` | Your Railway URL | ✅ |

---

## SECTION 9 — TROUBLESHOOTING

### "OAuth redirect does not match"
→ Go to Meta Developer → Facebook Login → Settings → check **"Valid OAuth Redirect URIs"**  
→ The URL must match **exactly** (https://, correct domain, correct path)

### "Webhook verification failed"
→ Open Railway → Deployments → View Logs  
→ Check that your Railway URL is correct and the service is running  
→ The `WHATSAPP_VERIFY_TOKEN` in Railway must **exactly match** what you entered in Meta

### "Supabase auth not working"
→ Go to Supabase → Authentication → URL Configuration  
→ Make sure "Site URL" matches your exact Vercel URL  
→ Make sure your Vercel URL is in "Redirect URLs"

### "Google OAuth fails after login"
→ Go to Google Cloud → Credentials → your OAuth client  
→ Check "Authorized redirect URIs" — must include your Railway callback URL  
→ Make sure the Google APIs are enabled in the API Library

### "API returns 500"
→ Go to Railway → your project → Deployments → click latest → View Logs  
→ Look for the error message and check the corresponding env variable

### "Build fails on Railway"
→ Confirm Root Directory is set to `apps/api`  
→ Confirm Build Command is `npm run build`  
→ Confirm Start Command is `node dist/index.js`

---

## SECTION 10 — ONGOING MAINTENANCE

### Monitor Your App

- **Railway Metrics:** Go to Railway → your service → **"Metrics"** tab (CPU, memory, requests)
- **Supabase Logs:** Supabase → **"Logs"** in the left sidebar → check for DB errors
- **Vercel Analytics:** Vercel → your project → **"Analytics"** tab

### Database Backups

- Supabase Pro plan includes automatic daily backups
- To manually create a backup: Supabase → **"Database"** → **"Backups"** → **"Create backup"**

### Updating the App

When you push new code to your GitHub repository:
- Railway automatically redeploys the API (**~2 minutes**)
- Vercel automatically redeploys the frontend (**~1 minute**)

To apply new database migrations:
1. Run the SQL in Supabase → **SQL Editor** → paste the migration content → **Run**

---

*Guide generated: 2026-09-01 | Teameit Production v1.0*
