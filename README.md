# InstaScrape Pro 📸✨

> A modern, mobile-first full-stack web application for scraping, analyzing, and exporting public Instagram posts using the Apify actor [`apify/instagram-post-scraper`](https://apify.com/apify/instagram-post-scraper). Engineered for **public production deployment** with zero client-side token exposure, Firebase Email/Password authentication, server-enforced access tiers, and recurring subscriptions powered by **Razorpay (INR)**.

---

## 🏛️ Architecture & Stack

- **Frontend**: React 18+ with Vite (JavaScript), Framer Motion for smooth micro-interactions, Lucide React icons, Recharts for timeline analytics, and plain CSS variables with dark mode default.
- **Backend**: Node.js + Express (ES modules). Serves `/api` routes and, in production, hosts the compiled static frontend from `/dist`.
- **Database**: Google Cloud Firestore (via `firebase-admin` on the server only). Direct client access to Firestore is completely disabled via security rules.
- **Auth**: Firebase Authentication (Email/Password provider **ONLY**; minimum 8-character password; email verification strictly enforced before scraping or subscribing).
- **Payments**: Razorpay Subscriptions (INR). Webhooks verified with HMAC SHA-256 over raw body.
- **Deployment**: Multi-stage `Dockerfile` and `render.yaml` blueprint ready for Render, Railway, or Fly.io.

---

## 🔒 Security Architecture

```
[ Client Browser (Vite SPA) ]
        │  (Authorization: Bearer <FirebaseIdToken> + X-Firebase-AppCheck)
        ▼
[ Express Server Proxy (Node.js ESM) ]
   ├── Helmet CSP & Security Headers
   ├── CORS Restriction (APP_ORIGIN)
   ├── express.raw body parser for /api/razorpay/webhook (before JSON)
   ├── Rate Limiting (express-rate-limit on auth & scrape)
   ├── Firebase App Check Token Verification
   ├── Firebase Admin Token Verification (verifyIdToken)
   │     └── Rejects non-password sign-in providers (401)
   ├── Server-Side Tier & Quota Calculation from Firestore
   ├── Strict Regex Sanitization (usernames & URLs)
   └── Field Filter & Media Stripping (Single Source of Truth)
        │  (Bearer Authorization Header only)
        ▼
[ Apify API v2 ] ──> [ apify/instagram-post-scraper ]
```

1. **Zero Token Exposure**: Apify API token (`APIFY_TOKEN`), Razorpay Secret (`RAZORPAY_KEY_SECRET`), and Firebase Private Key (`FIREBASE_PRIVATE_KEY`) reside exclusively in server environment variables.
2. **Bundle Verification**: Grepping the built frontend bundle (`dist/`) yields zero instances of secret tokens or private keys.
3. **No Direct Firestore Reads/Writes**: Direct client access to Firestore is denied by `firestore.rules` (`allow read, write: if false;`). Only the server Admin SDK interacts with the database.

---

## 🎟️ Access Tiers & Business Rules

| Tier | Authentication Status | Daily Scrape Quota | Visible Fields | Media Previews | Paywall Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GUEST** | Not logged in | 0 | None (results hidden) | None | Search taps save query to `sessionStorage` and open Paywall. **Zero Apify calls.** |
| **FREE** | Registered & Verified | 1 run/day (`FREE_RUNS_PER_DAY`) | `ownerUsername`, `caption`, `timestamp`, `likesCount` | None (Locked placeholder) | Banner: *"Upgrade to see image previews and video links."* |
| **PAID** | Active subscription (`active`/`trialing`) | 20 runs/day (`PAID_RUNS_PER_DAY`) | Free fields + `displayUrl`, `images`, `videoUrl` | High-res lazy-loaded photos & video playback | Unlimited post type filters and media metadata export. |

> **Server-Enforced Access**: User tier is calculated dynamically from Firestore on every request. Client-supplied plan parameters are never trusted.

---

## 💳 Razorpay Subscription Plans (INR)

All prices are in **Indian Rupees (INR)** and processed via Razorpay Subscriptions (amounts stored in paise: 1 INR = 100 paise):

- **Weekly Pass**: ₹199 / week (`RAZORPAY_PLAN_WEEKLY`, 19,900 paise)
- **Monthly Pro**: ₹499 / month (`RAZORPAY_PLAN_MONTHLY`, 49,900 paise)
- **Annual Elite**: ₹1,299 / year (`RAZORPAY_PLAN_YEARLY`, 129,900 paise — *"Best value"*)

### Payment Lifecycle & Signature Verification:
1. `POST /api/billing/subscribe { plan }` maps the plan securely on the server and creates a recurring subscription.
2. Razorpay Checkout.js opens. Upon completion, the handler submits payment and signature parameters to `POST /api/billing/verify`.
3. The server computes `HMAC-SHA256(razorpay_payment_id + "|" + razorpay_subscription_id, RAZORPAY_KEY_SECRET)` to verify signatures.
4. Official status updates are processed through `POST /api/razorpay/webhook`, which verifies the `X-Razorpay-Signature` against the raw request body before updating user documents.

---

## 📦 Field Policy (Single Source of Truth)

Defined in [`src/shared/fieldPolicy.js`](src/shared/fieldPolicy.js) and imported by both backend and frontend:
- **`FREE_FIELDS`**: `["ownerUsername", "caption", "timestamp", "likesCount"]`
- **`PAID_FIELDS`**: `[...FREE_FIELDS, "displayUrl", "images", "videoUrl"]`
- **Strictly Excluded**: Comments, hashtags, co-authors, child posts, alt text, dimensions, and sponsored/pinned flags are never stored in Firestore or exposed in API responses.

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env`:

```env
# Apify
APIFY_TOKEN=apify_api_your_token_here

# Server
PORT=3001
NODE_ENV=development
APP_ORIGIN=http://localhost:5173

# Firebase Admin SDK (Server)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Firebase Client SDK (Vite)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=1:...
VITE_RECAPTCHA_SITE_KEY=6L...

# Razorpay Subscriptions (INR)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
RAZORPAY_CURRENCY=INR
RAZORPAY_PLAN_WEEKLY=plan_...
RAZORPAY_PLAN_MONTHLY=plan_...
RAZORPAY_PLAN_YEARLY=plan_...

# Quotas & Controls
FREE_RUNS_PER_DAY=1
PAID_RUNS_PER_DAY=20
SCRAPE_RATE_LIMIT_PER_HOUR=10
MAX_CONCURRENT_RUNS=3
MAX_RESULTS_PER_PROFILE=100
MAX_USERNAMES_PER_REQUEST=10
PREVIEW_TTL_HOURS=12
```

---

## 🛠️ Step-by-Step Setup Guide

### 1. Firebase Setup
1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** and choose **Email/Password** provider only. Enable email verification templates.
3. Create a **Firestore Database** in production mode.
4. Deploy the repository security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
5. Navigate to **Project Settings > Service accounts**, generate a new private key, and copy the credentials into `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`.
6. Enable **Firebase App Check** using reCAPTCHA v3 or Enterprise.

### 2. Razorpay Setup
1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Navigate to **Subscriptions > Plans** and create three plans in INR:
   - Weekly (interval: 1 week, ₹199)
   - Monthly (interval: 1 month, ₹499)
   - Yearly (interval: 1 year, ₹1,299)
3. Copy the plan IDs into `.env` (`RAZORPAY_PLAN_WEEKLY`, `RAZORPAY_PLAN_MONTHLY`, `RAZORPAY_PLAN_YEARLY`).
4. Generate API Keys in **Settings > API Keys** and set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
5. Under **Settings > Webhooks**, create an endpoint pointing to `https://<YOUR_DOMAIN>/api/razorpay/webhook` with events:
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.pending`
   - `subscription.halted`
   - `subscription.cancelled`
   - `subscription.completed`
6. Set the webhook secret in `RAZORPAY_WEBHOOK_SECRET`.

### 3. Apify Setup
1. Get your API token from [Apify Console > Integrations](https://console.apify.com/account/integrations).
2. Set `APIFY_TOKEN` in your environment.

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Run concurrently (Express on :3001, Vite dev on :5173)
npm run dev

# 3. Open browser
http://localhost:5173
```

---

## 🚢 Production Deployment

### Option A: Render
Connect your repository and deploy with [`render.yaml`](render.yaml):
```bash
# Build command:
npm install && npm run build

# Start command:
npm start
```

### Option B: Docker
```bash
# Build multi-stage container
docker build -t instascrape-pro .

# Run container
docker run -p 3001:3001 --env-file .env instascrape-pro
```

---

## 🔍 Profile Presentation Analyzer (`/analyzer`)

An objective, AI-powered presentation auditing tool for Instagram profiles:
- **Zero Post Scraping**: Uses `apify/instagram-profile-scraper` with `includeAboutSection: false` to extract only profile headers (`username`, `fullName`, `biography`, `followersCount`, `followsCount`, `profilePicUrl`, `private`, `verified`, `externalUrl`). Posts and reels are never read or stored, ensuring identical support for public and private accounts.
- **Server-Side Gemini AI**: Profile presentation evaluated using Google Gemini 2.0 Flash-Lite (`gemini-2.0-flash-lite`) with JSON schema enforcement, low temperature (0.3), Zod validation, prompt injection resistance, and sensitive attribute guards (never evaluates religion, ethnicity, gender, sexual orientation, disability, politics, marital status, or age).
- **Presentation Rubric**: Five criteria scored 0–10:
  1. *Clarity of Target & Niche*
  2. *Value Proposition & Offer*
  3. *Call to Action (CTA)*
  4. *Scannability & Spacing*
  5. *Contact Path & Links*
  Overall score is the rounded average of the five criteria.
- **Quotas & Caching**:
  - Verified Free: 3 analyses/day (`ANALYZER_RUNS_PER_DAY_FREE`)
  - Paid Subscribers: 30 analyses/day (`ANALYZER_RUNS_PER_DAY_PAID`)
  - Cached for 24 hours (`ANALYZER_CACHE_HOURS`) by username and SHA-256 bio hash. Unchanged bio cache hits consume zero quota.
  - Automatically retained in history for 30 days (`ANALYZER_RESULT_TTL_DAYS`). Users can delete analyses at any time.

---

## ⚖️ Compliance & Refund Policy

- **Instagram Disclaimer**: Scraping Instagram may violate Instagram's Terms of Use and applicable laws. You are responsible for how you use this service. Subscriptions are billed through Razorpay.
- **Refund Terms**:
  - *Weekly (₹199)*: Non-refundable once activated due to short duration.
  - *Monthly (₹499)*: Full refund within 48 hours if fewer than 2 total scrapes were run.
  - *Yearly (₹1,299)*: Refund available within 7 days of charge minus nominal compute usage.
