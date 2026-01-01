# 🚀 Landing Kit MVP - Deployment Guide

## Overview

This guide walks you through deploying Landing Kit MVP to production:
- **Backend**: Railway (Node.js + PostgreSQL)
- **Dashboard**: Netlify (React)
- **Store**: Netlify (Vanilla JS)
- **Domain**: jarisolutionsecom.store

---

## Step 1: Deploy Backend to Railway

### 1.1 Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub and select `landing-kit-mvp`
5. Railway will auto-detect the Node.js app

### 1.2 Configure Root Directory
In Railway project settings:
- Set **Root Directory** to: `backend`

### 1.3 Add PostgreSQL Database
1. In your Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will create a PostgreSQL instance

### 1.4 Set Environment Variables
In Railway, go to your backend service → Variables tab:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=<auto-populated by Railway - copy from PostgreSQL service>
JWT_SECRET=<generate a random 64-character string>
DASHBOARD_URL=https://your-dashboard.netlify.app
STORE_URL=https://your-store.netlify.app
```

**To generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 1.5 Deploy
Railway will auto-deploy. Wait for build to complete.

### 1.6 Initialize Database
Once deployed, visit:
```
https://your-railway-url.up.railway.app/api/init
```

This creates all required tables. You should see:
```json
{
  "success": true,
  "message": "🎉 Database initialized successfully!",
  "tables": ["users", "products", "orders", "store_settings", "themes", "add_ons", "user_add_ons"]
}
```

### 1.7 Get Your Railway URL
Copy your Railway backend URL (e.g., `https://landing-kit-mvp-production.up.railway.app`)

---

## Step 2: Deploy Dashboard to Netlify

### 2.1 Create Netlify Site
1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect GitHub and select `landing-kit-mvp`

### 2.2 Configure Build Settings
- **Base directory**: `dashboard`
- **Build command**: `npm install && npm run build`
- **Publish directory**: `dashboard/dist`

### 2.3 Set Environment Variables
Go to Site Settings → Build & deploy → Environment variables:

```
VITE_API_URL=https://your-railway-url.up.railway.app
```

### 2.4 Deploy
Click "Deploy site". Netlify will build and deploy.

### 2.5 Note Your Dashboard URL
Copy the Netlify URL (e.g., `https://your-site.netlify.app`)

---

## Step 3: Deploy Store to Netlify

### 3.1 Create Another Netlify Site
1. Click "Add new site" → "Import an existing project"
2. Select the same `landing-kit-mvp` repo

### 3.2 Configure Build Settings
- **Base directory**: `frontend-dynamic`
- **Build command**: `npm install && npm run build`
- **Publish directory**: `frontend-dynamic/dist`

### 3.3 Set Environment Variables
```
VITE_API_URL=https://your-railway-url.up.railway.app
```

### 3.4 Deploy
Click "Deploy site".

---

## Step 4: Update CORS in Railway

Go back to Railway and update the environment variables:

```
DASHBOARD_URL=https://your-dashboard.netlify.app
STORE_URL=https://your-store.netlify.app
```

Railway will auto-redeploy.

---

## Step 5: Connect Custom Domain

### For the Store (jarisolutionsecom.store):
1. In Netlify, go to your store site
2. Domain settings → Add custom domain
3. Enter: `jarisolutionsecom.store`
4. Add DNS records as Netlify instructs

### For the Dashboard (optional subdomain):
You could use `dashboard.jarisolutionsecom.store`

---

## Step 6: Test Everything

### Test Backend Health:
```
https://your-railway-url.up.railway.app/health
```

### Test Database Status:
```
https://your-railway-url.up.railway.app/api/init/status
```

### Test Dashboard:
1. Go to your Netlify dashboard URL
2. Register a new account
3. Login should work

### Test Store:
1. Go to your store URL
2. Add `?subdomain=testfashion` to test
3. Products should load

---

## Troubleshooting

### Backend not starting?
- Check Railway logs for errors
- Verify DATABASE_URL is set correctly
- Ensure all environment variables are set

### Dashboard shows blank?
- Check browser console (F12)
- Verify VITE_API_URL is set in Netlify
- Redeploy after setting env vars

### CORS errors?
- Verify DASHBOARD_URL and STORE_URL in Railway
- Make sure URLs include https://
- Redeploy Railway after updating vars

### Database empty?
- Visit `/api/init` to create tables
- Check `/api/init/status` to verify tables exist

---

## Environment Variables Summary

### Railway (Backend):
| Variable | Description | Example |
|----------|-------------|---------|
| NODE_ENV | Environment | `production` |
| DATABASE_URL | PostgreSQL URL | Auto from Railway |
| JWT_SECRET | Auth secret | Random 64 chars |
| DASHBOARD_URL | Dashboard URL | `https://xxx.netlify.app` |
| STORE_URL | Store URL | `https://xxx.netlify.app` |

### Netlify (Dashboard & Store):
| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_URL | Backend URL | `https://xxx.up.railway.app` |

---

## Post-Deployment Security

After everything is working:

1. **Remove init route** (optional but recommended):
   - Delete `/api/init` route from server.js
   - Redeploy to Railway

2. **Update JWT_SECRET** to a new value if exposed

3. **Enable Netlify branch deploys** for staging

---

## Quick Links

- Railway Dashboard: https://railway.app/dashboard
- Netlify Dashboard: https://app.netlify.com
- Your Domain DNS: (your registrar)
