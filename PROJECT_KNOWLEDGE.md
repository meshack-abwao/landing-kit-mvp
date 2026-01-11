# Landing Kit MVP - Complete Session Knowledge Base
**Last Updated:** January 12, 2026
**Status:** STABLE - Railway Dark Theme + Premium Transitions

---

## TABLE OF CONTENTS
1. [System Architecture](#architecture)
2. [Database Schema](#database)
3. [Current Working State](#working-state)
4. [Recent Changes (Jan 11-12)](#recent-changes)
5. [Known Issues](#known-issues)
6. [Key Decisions & Why](#decisions)
7. [Common Issues & Solutions](#troubleshooting)
8. [Deployment Guide](#deployment)
9. [Next Up: Checkout Flow](#next-up)

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
│    Orders, Settings, Marketplace,       │
│    Templates                            │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  Store Frontend (Port 5174)             │
│  - Vanilla JS + Vite                    │
│  - 5 JTBD Templates                     │
│  - Customer-facing product pages        │
└─────────────────────────────────────────┘
```

### Key File Locations
```
C:\Users\ADMIN\Desktop\landing-kit-mvp\
├── backend/
│   ├── server.js              # Main Express server
│   ├── routes/                # API routes
│   └── config/database.js     # PostgreSQL connection
├── dashboard/
│   └── src/
│       ├── index.css          # ALL THEME STYLES HERE
│       ├── components/Dashboard/
│       │   ├── DashboardLayout.jsx  # Sidebar + navigation
│       │   ├── ProductList.jsx      # Product CRUD
│       │   └── Templates.jsx        # Template selector
│       └── services/api.jsx   # API client
└── frontend-dynamic/
    ├── app.js                 # ALL TEMPLATE RENDERING
    ├── styles.css             # Store frontend styles
    └── index.html             # Entry point
```

---

## DATABASE SCHEMA

### Core Tables (PostgreSQL on Railway)

**products** - Main product/page data
- id, user_id, name, description, price
- image_url, images (JSONB array for gallery)
- template_id (1-5 for JTBD templates)
- stock_quantity, is_active
- **JSONB fields:** stories, testimonials, service_packages, faqs, trust_badges, gallery_images

**store_settings** - Per-user store config
- subdomain, logo_text, tagline
- theme_color, font_family
- mpesa_number

**themes** - Pre-defined color themes
- name, display_name, gradient, primary_color

---

## CURRENT WORKING STATE

### What's Working ✅

**Dashboard (React)**
- Railway-style dark mode (pure dark + purple/pink/orange center glow)
- Light mode (soft pastels)
- Products CRUD with template selection
- Image gallery with multiple images
- Settings page with theme selection
- All 5 template editors working

**Store Frontend (Vanilla JS)**
- All 5 JTBD templates rendering correctly
- Premium image transitions (slide animations)
- Hover-reveal gallery navigation arrows
- Touch swipe support for galleries
- Story autoplay with progress bars
- Testimonials display
- Collection cards for multi-product stores

### 5 JTBD Templates
1. **Quick Decision Single** (template_id: 1) - Instagram sellers, impulse buys
2. **Portfolio + Booking** (template_id: 2) - Service providers
3. **Visual Menu** (template_id: 3) - Restaurants/cafes
4. **Deep Dive Evaluator** (template_id: 4) - High-ticket items
5. **Catalog Navigator** (template_id: 5) - Multi-product stores

---

## RECENT CHANGES (Jan 11-12, 2026)

### Dark Mode Theme
Changed from "Fresh Mint + Ocean Blue" to **Railway-style**:
- Pure dark background: `#0a0a0f`
- Center gradient glow: purple → pink → orange
- Located in: `dashboard/src/index.css` lines 68-110

```css
[data-theme="dark"] {
  --bg-primary: #0a0a0f;
  --accent-color: #a855f7;
  --logo-gradient: linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #f97316 100%);
}
```

### Premium Image Transitions
Added smooth slide animations to product galleries:
- Direction-aware (left/right based on navigation)
- 350ms cubic-bezier easing
- Glassmorphic nav buttons with hover reveal
- Located in: `frontend-dynamic/styles.css` and `frontend-dynamic/app.js`

```css
@keyframes slideInFromRight {
  from { opacity: 0; transform: translateX(8%); }
  to { opacity: 1; transform: translateX(0); }
}
```

### Mobile Sidebar (PARTIALLY WORKING)
- Has smooth slide transition
- Auto-close on route change via useEffect
- **KNOWN ISSUE:** Tapping nav items doesn't reliably close sidebar on mobile

---

## KNOWN ISSUES

### 🔴 Mobile Sidebar Not Auto-Closing
**Problem:** When tapping nav items on mobile, sidebar doesn't auto-close reliably
**Location:** `dashboard/src/components/Dashboard/DashboardLayout.jsx`
**Attempted fixes:**
- Added onClick={closeMobileMenu} to all NavLinks
- Tried onTouchStart (caused double-fire)
- useEffect watches location.pathname but may not trigger fast enough

**To investigate:**
- Check if NavLink onClick fires before navigation
- Consider using useNavigate programmatically
- May need to wrap in setTimeout or use event.preventDefault + manual navigate

### 🟡 Revenue Shows $0
Not a bug - all orders are "pending" status. Mark orders as "completed" to see revenue.

---

## KEY DECISIONS

### Template System
- Templates stored as `template_id` (1-5) on products table
- Each template has different JSONB fields it uses
- Rendering logic all in `frontend-dynamic/app.js`

### JSONB for Flexible Data
- PostgreSQL JSONB for arrays (images, testimonials, etc.)
- **CRITICAL:** pg driver accepts JS objects directly - don't JSON.stringify!

### Theme Variables
All theme colors use CSS variables defined in `dashboard/src/index.css`:
- Light mode: `:root, [data-theme="light"]`
- Dark mode: `[data-theme="dark"]`

---

## TROUBLESHOOTING

### Backend Not Responding
```bash
cd C:\Users\ADMIN\Desktop\landing-kit-mvp\backend
npm start
```

### Dashboard Blank/Broken
```bash
cd C:\Users\ADMIN\Desktop\landing-kit-mvp\dashboard
rm -rf node_modules/.vite
npm run dev
# Hard refresh: Ctrl+Shift+R
```

### Store Not Loading
Check subdomain param: `http://localhost:5174?subdomain=testfashion`

### JSONB Not Saving
DON'T use JSON.stringify - pass JS objects directly to pg queries.

---

## DEPLOYMENT

### Current Setup
- **Backend:** Railway (auto-deploy from GitHub)
- **Frontend:** Netlify (auto-deploy from GitHub)
- **Database:** PostgreSQL on Railway

### Environment Variables (Backend)
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
NODE_ENV=production
```

---

## NEXT UP: CHECKOUT FLOW

### Priority Task
Build/improve the checkout flow for customer purchases.

### Current State
- Basic checkout modal exists in `frontend-dynamic/app.js`
- Order creation endpoint exists at `/api/orders`
- M-Pesa STK push placeholder (not implemented)

### To Implement
1. Review current checkout modal UX
2. Improve form validation
3. M-Pesa integration (Daraja API)
4. Order confirmation flow
5. WhatsApp notification on order

### Files to Edit
- `frontend-dynamic/app.js` - checkout modal rendering
- `frontend-dynamic/styles.css` - checkout styling
- `backend/routes/orders.js` - order processing
- `backend/services/mpesa.js` - M-Pesa integration (currently placeholder)

---

## GIT WORKFLOW

```bash
cd C:\Users\ADMIN\Desktop\landing-kit-mvp
git add -A
git commit -m "emoji Description"
git push origin master
```

### Commit Emoji Guide
- 🎨 UI/styling changes
- 🐛 Bug fixes
- ✨ New features
- 🔧 Config/setup changes
- 📝 Documentation

---

## 🔧 SURGICAL DEBUGGING METHODOLOGY

### The Approach That Works

**1. READ BEFORE EDITING**
- Always `read_file` the target section FIRST
- Understand existing code structure before making changes
- Check for related code that might be affected

**2. SMALL, TARGETED EDITS**
- Use `edit_block` with exact `old_string` matches
- Change ONE thing at a time
- Keep edits minimal - don't rewrite entire files

**3. VERIFY THE EDIT APPLIED**
- Check the response: "Successfully applied 1 edit"
- If it fails, the `old_string` didn't match exactly
- Re-read the file to get exact current content

**4. TEST IMMEDIATELY**
- Commit and push after each logical change
- User tests in browser right away
- Fix issues before moving to next feature

**5. DON'T CASCADE**
- If something breaks, STOP
- Don't try to fix by adding more code
- Go back, understand what broke, fix surgically

### Common Pitfalls Avoided

❌ **DON'T:** Edit multiple files at once for one feature
✅ **DO:** Edit one file, test, then move to next

❌ **DON'T:** Guess at code structure
✅ **DO:** Read the file first, find exact line content

❌ **DON'T:** Add duplicate handlers (e.g., onClick + onTouchStart both firing)
✅ **DO:** Use one handler, let React normalize events

❌ **DON'T:** Rewrite entire functions when one line needs changing
✅ **DO:** Target the specific line that needs modification

### Debugging CSS Issues
1. Check which theme mode is active (light/dark)
2. Find the CSS variable definition
3. Trace where it's used
4. Edit the variable, not every usage

### Debugging React Issues
1. Check useEffect dependencies
2. Look for state update loops
3. Verify event handlers aren't doubling up
4. Check if component is re-mounting unexpectedly

### Debugging API Issues
1. Test endpoint directly with curl/Postman first
2. Check backend console for errors
3. Verify request payload matches expected format
4. Check CORS if cross-origin

---

**END OF SESSION KNOWLEDGE BASE**
Generated: January 12, 2026
