# Landing Kit MVP - Complete Session Knowledge Base
**Date Range:** December 27-29, 2025
**Status:** STABLE WORKING VERSION

---

## TABLE OF CONTENTS
1. [System Architecture](#architecture)
2. [Database Schema](#database)
3. [Current Working State](#working-state)
4. [Key Decisions & Why](#decisions)
5. [Common Issues & Solutions](#troubleshooting)
6. [Working Code Versions](#code-versions)
7. [Deployment Guide](#deployment)
8. [Future Features](#future)

---

## ARCHITECTURE

### Three-Tier System
```
┌─────────────────────────────────────────┐
│  Backend API (Port 3000)                │
│  - Node.js + Express                    │
│  - PostgreSQL (Railway)                 │
│  - Routes: auth, products, orders,      │
│    settings, public                     │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  Dashboard (Port 5176)                  │
│  - React + Vite                         │
│  - Admin panel for store management     │
│  - Components: Overview, Products,      │
│    Orders, Settings, Marketplace        │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  Store Frontend (Port 5177)             │
│  - Vanilla JS + Vite                    │
│  - Customer-facing product catalog      │
│  - Subdomain-based routing              │
└─────────────────────────────────────────┘
```

### Key Technologies
- **Backend:** Node.js 22.x, Express 4.x
- **Database:** PostgreSQL 16 (Railway)
- **Frontend:** React 18, Vite 7.3
- **Authentication:** JWT tokens
- **Styling:** Inline styles + CSS (glassmorphism)

---

## DATABASE

### Core Tables

**users**
- id, email, password, business_name, instagram_handle
- subscription_tier (tier1/tier2/tier3)
- created_at, updated_at

**products**
- id, user_id, name, description, price
- image_url, stock_quantity, is_active
- display_order, created_at, updated_at

**orders**
- id, user_id, product_id, order_number
- customer_name, customer_phone, customer_location
- quantity, unit_price, total_amount
- payment_method (mpesa/cod), status (pending/completed)
- created_at, updated_at

**store_settings**
- id, user_id, subdomain, logo_text, tagline
- theme_color, font_family
- mpesa_number, custom_domain
- created_at

**themes**
- id, name, display_name, gradient
- primary_color, animation_style, is_premium
- heading_font, body_font

---

## WORKING STATE

### What's Working ✅
1. **Backend API**
   - All routes respond correctly
   - Database queries work
   - JWT authentication functional

2. **Dashboard**
   - Overview shows revenue (from completed orders)
   - Products CRUD fully functional
   - Settings saves and auto-reloads
   - Orders display correctly
   - Marketplace shows add-ons

3. **Store**
   - Loads by subdomain query param
   - Displays products from database
   - Shows correct theme colors
   - M-Pesa checkout skeleton works

### What Needs Work ⚠️
1. **Theme Changes**
   - Saves to database successfully
   - Requires manual refresh to see changes
   - Auto-reload added but needs testing

2. **Revenue Display**
   - Works correctly (shows $0 because all orders are "pending")
   - Need to mark orders as "completed" to see revenue

3. **Store URL**
   - Currently uses query param: ?subdomain=testfashion
   - Future: Need actual subdomain routing

---

## KEY DECISIONS

### Why "Products" Not "Pages"
**Decision:** Keep the backend simple - products table stores product listings
**Reason:** We tried renaming to "pages" but it created confusion
**Impact:** Clean, simple architecture that works

### Port Configuration
- **3000:** Backend (fixed, easy to remember)
- **5176:** Dashboard (Vite auto-assigns if 5173 taken)
- **5177:** Store (Vite auto-assigns)

### Database Naming
**snake_case** in database, **camelCase** in JavaScript
- DB: `logo_text`, `theme_color`, `is_active`
- JS: `logoText`, `themeColor`, `isActive`

### Revenue Calculation
**Source:** Orders table, calculated on-the-fly
**Logic:** 
- Total Revenue = SUM(orders WHERE status = 'completed')
- Pending Revenue = SUM(orders WHERE status = 'pending')

---

## TROUBLESHOOTING

### "Cannot GET /api/products" (404)
**Cause:** Backend route not loaded or server not restarted
**Fix:** 
```bash
cd backend
npm start  # Full restart required
```

### "Export default not found" Error
**Cause:** File missing closing brace or export statement
**Fix:**
```bash
# Clear Vite cache
cd dashboard
rm -rf node_modules/.vite
# Hard refresh browser: Ctrl+Shift+R
```

### Theme Changes Don't Show
**Cause:** Page needs reload after save
**Fix:** Added `window.location.reload()` in Settings.jsx after successful save

### Revenue Shows $0
**Not a bug!** All 17 orders are "pending" status
**Fix:** Mark some orders as "completed" in database

### Store Shows "Store Not Found"
**Cause:** Backend missing public route
**Fix:** Created `/api/public/store/:subdomain` route

---

## CODE VERSIONS

### Backend - products.js (WORKING)
```javascript
const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json({ success: true, products: result.rows });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, error: 'Failed to get products' });
  }
});

// ... CRUD operations (create, update, delete)

module.exports = router;
```

### Dashboard - Overview.jsx (WORKING)
Key features:
- Calculates revenue from orders
- Shows Quick Actions cards
- Displays recent products with view buttons
- "View Live Store" button

### Dashboard - Settings.jsx (WORKING)
Key features:
- Theme selection with visual preview
- Font selection
- Auto-reloads after save

---

## DEPLOYMENT

### Costs (Monthly)
- **Railway (Backend + DB):** $5-20/month
- **Vercel (Frontends):** FREE
- **Domain:** ~$15/year

### Steps
1. Push to GitHub
2. Connect Railway to repo → auto-deploy backend
3. Connect Vercel to repo → auto-deploy frontends
4. Set environment variables
5. Run database migrations

---

## FUTURE FEATURES

### Planned But Not Built
1. **Brand Redesign**
   - Jari colors integration
   - Forest green dark mode
   - Apple Music-inspired light mode
   - SF Pro Display fonts

2. **CMS Pages** (Tier 2+)
   - About Us, Contact pages
   - Uses separate `pages` table

3. **Payment Per Page** (Tier 1)
   - KES 500 per page
   - M-Pesa payment modal

4. **Dynamic Subscription Display**
   - Show actual user tier in Account modal

5. **Collection Categories**
   - Group products by category
   - Filter in store

---

## SESSION TIMELINE

### Dec 27: Initial Build
- Created backend API structure
- Set up PostgreSQL database
- Built basic dashboard

### Dec 28: Feature Additions
- Added Settings page
- Implemented theme system
- Created Marketplace for add-ons
- Built store frontend

### Dec 29: The Great Refactor (6 hours!)
- **Hour 1-3:** Tried to rename Products → Pages (FAILED)
- **Hour 3-4:** Reverted everything back to Products
- **Hour 4-5:** Fixed Overview to calculate revenue properly
- **Hour 5-6:** Fixed theme save/reload, added public store route

### Key Learnings
1. **Don't rename core entities mid-project!**
2. **Commit working versions to Git before experimenting**
3. **Clear Vite cache religiously**
4. **Test backend routes with curl before debugging frontend**

---

## CRITICAL REMINDERS

### ⚠️ NEW FIELD CHECKLIST (MUST FOLLOW FOR EVERY NEW FEATURE)

When adding ANY new field to the system, you MUST update ALL 4 LAYERS or data won't persist:

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: DATABASE (PostgreSQL)                                 │
│  ─────────────────────────────────────────                      │
│  File: server.js → migratePhase2Collection() or similar         │
│  Action: ALTER TABLE ADD COLUMN IF NOT EXISTS new_field         │
│  Example: ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS   │
│           my_new_field VARCHAR(255)                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 2: BACKEND PUT ROUTE (Save to DB)                        │
│  ─────────────────────────────────────────                      │
│  File: server.js → PUT /api/settings (around line 520-570)      │
│  Action: Add handler for the new field                          │
│  Example:                                                       │
│    if (b.my_new_field !== undefined) {                          │
│      updates.push(`my_new_field = $${idx++}`);                  │
│      values.push(b.my_new_field);                               │
│    }                                                            │
│  ⚠️ THIS IS THE #1 MISSED STEP - testimonials bug lasted days! │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 3: BACKEND GET/PUBLIC ROUTE (Read from DB)               │
│  ─────────────────────────────────────────                      │
│  Files: GET /api/settings, GET /api/public/store/:subdomain     │
│  Action: Include new field in response object                   │
│  Example: In public route response:                             │
│    store: {                                                     │
│      ...existing fields,                                        │
│      myNewField: store.my_new_field || ''                       │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 4: FRONTEND (Dashboard + Store)                          │
│  ─────────────────────────────────────────                      │
│  Dashboard: Settings.jsx                                        │
│    - Add to state: myNewField: ''                               │
│    - Add to loadSettings: myNewField: s.my_new_field || ''      │
│    - Add to updateData: my_new_field: storeSettings.myNewField  │
│    - Add UI input field                                         │
│                                                                 │
│  Store: app.js (if displayed on frontend)                       │
│    - Read from storeData.store.myNewField                       │
│    - Render in appropriate location                             │
└─────────────────────────────────────────────────────────────────┘
```

**QUICK VALIDATION TEST:**
1. Add field in Dashboard UI
2. Enter value and click Save
3. Refresh page - does value persist? 
4. Check store frontend - does it display?

If NO at step 3 → Missing Layer 2 (PUT route)
If NO at step 4 → Missing Layer 3 (public route)

---

### Before Making Changes
```bash
# 1. Commit current state
git add .
git commit -m "Before experimenting with X"

# 2. Create a branch
git checkout -b experiment/feature-name

# 3. Make changes
# ... code ...

# 4. If it works
git checkout master
git merge experiment/feature-name

# 5. If it breaks
git checkout master  # Abandon experiment
```

### Server Restart Order
1. Backend first (port 3000)
2. Dashboard second (note the port)
3. Store last (note the port)

### When Something Breaks
1. Check browser console (F12)
2. Check backend terminal for errors
3. Test backend with curl
4. Clear Vite cache
5. Hard refresh browser

---

**END OF SESSION KNOWLEDGE BASE**
Generated: December 29, 2025
Version: 1.0-stable
