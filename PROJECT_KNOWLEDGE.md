# Landing Kit MVP - Complete Session Knowledge Base
**Last Updated:** January 11, 2026
**Status:** STABLE WORKING VERSION (Debloated)

---

## TABLE OF CONTENTS
1. [System Architecture](#architecture)
2. [Database Schema](#database)
3. [Current Working State](#working-state)
4. [🔧 DEBUGGING FORMULA - NEW FIELD NOT WORKING](#debugging-formula)
5. [Key Decisions & Why](#decisions)
6. [Common Issues & Solutions](#troubleshooting)
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
│  - Single file: server.js               │
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

### Clean File Structure (Post-Debloat)
```
landing-kit-mvp/
├── backend/           # API server (server.js is the main file)
├── dashboard/         # Admin React app  
├── frontend-dynamic/  # Customer store
├── docs/              # Documentation
├── PROJECT_KNOWLEDGE.md
└── README.md
```

---

## 🔧 DEBUGGING FORMULA - NEW FIELD NOT WORKING

### The 4-Layer Architecture
Every field in Jari.Ecom flows through exactly 4 layers. If a field isn't working, one of these layers is broken:

```
┌─────────────────────────────────────────────────────────────┐
│ LAYER 1: DATABASE                                           │
│ File: backend/server.js (lines 82-180)                      │
│ Check: ALTER TABLE ... ADD COLUMN IF NOT EXISTS             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 2: BACKEND ROUTES (INSERT/UPDATE) ⚠️ MOST COMMON BUG │
│ File: backend/server.js                                     │
│ Check: POST /api/products or PUT /api/products/:id          │
│        POST /api/settings or PUT /api/settings              │
│ Bug: Field in migration but NOT in INSERT/UPDATE query      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 3: BACKEND ROUTES (GET/PUBLIC)                        │
│ File: backend/server.js                                     │
│ Check: GET /api/public/store/:subdomain response object     │
│ Bug: Field saved but not returned to frontend               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 4: FRONTEND                                           │
│ Files: dashboard/src/components/*, frontend-dynamic/app.js  │
│ Check: Form sends field, store renders field                │
└─────────────────────────────────────────────────────────────┘
```

### Quick Diagnosis Steps

**Step 1: Identify which table the field belongs to**
- Product fields → `products` table → `/api/products` routes
- Store/Collection fields → `store_settings` table → `/api/settings` routes

**Step 2: Check each layer in order**

```
LAYER 1 - DATABASE (server.js ~lines 82-180):
Search in server.js for: ALTER TABLE [table_name] ADD COLUMN IF NOT EXISTS [field_name]
If missing → Add migration

LAYER 2 - BACKEND INSERT/UPDATE (⚠️ CHECK THIS FIRST - MOST COMMON):
For products:
  - INSERT INTO products → line ~234
  - UPDATE products SET → line ~343
  - Verify field is in BOTH the column list AND values array

For store_settings:
  - app.put('/api/settings' → line ~500
  - Verify: if (b.field_name !== undefined) { updates.push(...) }

LAYER 3 - BACKEND GET/PUBLIC (server.js ~line 619):
Search: app.get('/api/public/store
Verify field is included in response object

LAYER 4 - FRONTEND:
Dashboard: Check form has input for field, check submitData includes field
Store: Check render function uses the field
```

### Real Bug Examples We Fixed

#### Bug #1: Collection Testimonials Not Saving
**Symptom:** Dashboard showed testimonials form, but data disappeared on refresh
**Root Cause:** Layer 2 - PUT /api/settings missing handlers

```javascript
// BEFORE (broken) - these lines were MISSING:
// if (b.show_testimonials !== undefined) { ... }
// if (b.collection_testimonials !== undefined) { ... }

// AFTER (fixed):
if (b.show_testimonials !== undefined) { 
  updates.push(`show_testimonials = $${idx++}`); 
  values.push(b.show_testimonials); 
}
if (b.collection_testimonials !== undefined) { 
  updates.push(`collection_testimonials = $${idx++}`); 
  const testimonials = Array.isArray(b.collection_testimonials) 
    ? b.collection_testimonials 
    : JSON.parse(b.collection_testimonials);
  values.push(JSON.stringify(testimonials)); 
}
```

#### Bug #2: Product Testimonials Not Saving
**Symptom:** Same as above but for product-level testimonials
**Root Cause:** Layer 2 - POST and PUT /api/products missing `testimonials` field

```javascript
// BEFORE (broken):
// INSERT INTO products (...29 columns...) VALUES ($1...$29)
// UPDATE products SET ...28 fields... WHERE id = $29

// AFTER (fixed):
// INSERT INTO products (...30 columns including testimonials...) VALUES ($1...$30)
// UPDATE products SET ...29 fields including testimonials = COALESCE($29, testimonials)... WHERE id = $30
```

### NEW FIELD CHECKLIST
When adding ANY new field, complete ALL 4 layers:

```
□ LAYER 1: Add migration in server.js (lines 82-180)
  ALTER TABLE [table] ADD COLUMN IF NOT EXISTS [field] [TYPE] DEFAULT [value]

□ LAYER 2: Add to INSERT query (for new records)
  - Add column name to INSERT INTO ... ([columns])
  - Add $N placeholder to VALUES (...)
  - Add value to the values array

□ LAYER 2: Add to UPDATE query (for existing records)
  - Add: field_name = COALESCE($N, field_name) to SET clause
  - Add value to the values array
  - Update WHERE clause parameter numbers!

□ LAYER 3: Add to GET response (for public API)
  - Include field in the response object

□ LAYER 4: Frontend
  - Dashboard: Add form input + include in submit data
  - Store: Render the field where needed
```

### JSONB Fields - Special Handling
PostgreSQL's `pg` driver handles JSONB automatically:
- **DON'T** use `JSON.stringify()` when reading - it's already parsed
- **DO** use `JSON.stringify()` when writing to database
- **DO** handle both array and string input (dashboard may send either)

```javascript
// Writing JSONB:
const testimonials = Array.isArray(input) ? input : JSON.parse(input);
values.push(JSON.stringify(testimonials));

// Reading JSONB - already parsed by pg driver:
const data = result.rows[0].testimonials; // Already an array, not a string!
```

---

## DATABASE

### Core Tables

**users**
- id, email, password_hash, business_name, instagram_handle
- subscription_tier (tier1/tier2/tier3)
- created_at

**products** (30+ columns)
- Core: id, user_id, name, description, price, image_url, stock_quantity, is_active
- Template: template_type, story_media, story_title, gallery_images
- Rich content: rich_description, testimonials (JSONB), specifications (JSONB)
- Policies: privacy_policy, terms_of_service, refund_policy

**orders**
- id, user_id, product_id, order_number
- customer_name, customer_phone, customer_location
- quantity, unit_price, total_amount, payment_method, status

**store_settings** (40+ columns)
- Core: id, user_id, subdomain, logo_text, tagline, theme_color
- Hero: hero_bg_type, hero_bg_image, hero_title, hero_subtitle
- Testimonials: show_testimonials, collection_testimonials (JSONB)
- Footer: footer_text, footer_powered_by
- Policies: privacy_policy, terms_of_service, refund_policy

**themes**
- id, name, display_name, gradient, primary_color
- heading_font, body_font, is_premium

---

## WORKING STATE

### What's Working ✅
1. **Backend API** - All CRUD operations, JWT auth
2. **Dashboard** - Products, Orders, Settings with all fields
3. **Store Frontend** - Dynamic theming, product display, checkout
4. **Testimonials** - Both collection-level and product-level (after Layer 2 fix)

### File Counts (Post-Debloat)
- Backend: **854 lines** in server.js (single file architecture)
  - Migrations: lines 82-180
  - Product routes: lines 200-430
  - Settings routes: lines 450-600
  - Public store API: lines 619-750
  - Server startup: lines 800-854
- Dashboard: Standard React/Vite structure
- Frontend-dynamic: app.js + styles.css + index.html

---

## KEY DECISIONS

### Single File Backend (server.js)
**Decision:** Keep all backend logic in one file
**Reason:** Easier to search, fewer import issues, faster debugging
**Trade-off:** Large file (~854 lines) but ctrl+F works perfectly

### Database Column Approach
**Current:** Individual columns for each field
**Future consideration:** JSONB config pattern for flexibility
**Note:** Migration plan exists but deferred for stability

---

## TROUBLESHOOTING

### Quick Fixes

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Field not saving | Layer 2 missing | Add to INSERT/UPDATE query |
| Field saves but not showing | Layer 3 missing | Add to GET response |
| Form not sending field | Layer 4 frontend | Check submitData object |
| "Column does not exist" | Layer 1 missing | Add migration |

### Server Restart Required After
- Any change to server.js
- Database migration changes
- Environment variable changes

### Clear Caches When
- Vite hot reload not working: `rm -rf node_modules/.vite`
- Browser showing old version: Hard refresh (Ctrl+Shift+R)

---

## DEPLOYMENT

### Current Setup
- **Backend:** Railway (auto-deploy from GitHub)
- **Dashboard:** Netlify 
- **Store:** Netlify

### Environment Variables Required
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
NODE_ENV=production
```

---

## FUTURE FEATURES

### Planned
1. JSONB migration for store_settings (reduce column sprawl)
2. Image upload (Cloudinary integration)
3. M-Pesa STK Push integration
4. WhatsApp notifications

---

**END OF KNOWLEDGE BASE**
Last Updated: January 11, 2026 - Post-debloat, with debugging formula
