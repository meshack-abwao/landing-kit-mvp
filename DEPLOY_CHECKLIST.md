# Instagram Premium UX Features - Deploy Checklist

## ✅ Completed Features

### Store Frontend (frontend-dynamic/)
1. **Logo/Header Customization**
   - Logo image URL option (displays instead of text)
   - Header background image with blur effect

2. **Social Features**
   - Like button with heart animation (❤️ toggle)
   - localStorage persistence per subdomain+product
   - Share button with native share API + clipboard fallback
   - Toast notifications

3. **Gallery Improvements**
   - Instagram-style dots instead of thumbnails
   - Dots expand when active (8px → 24px)
   - Full image display (object-fit: contain)
   - Swipe gestures for mobile

4. **Story Circles**
   - Max 4 testimonial/video circles
   - Instagram-style gradient ring
   - Custom title (default: "See it in Action")
   - Fullscreen modal for viewing
   - Supports both images and videos

5. **Footer & Policies**
   - "Powered by jarisolutionsecom.store" link
   - Privacy Policy, Terms of Service, Refund Policy links
   - Popup modals for policy content

### Dashboard (dashboard/)
1. **Settings Page**
   - Logo Image URL field
   - Header Background Image field

2. **Product Form**
   - Story Media section (4 slots with image/video type)
   - Story Section Title field
   - Policy text areas (Privacy, Terms, Refund)

### Backend (backend/)
1. **Migration Script** (`/api/init/migrate`)
   - products: story_media, story_title, privacy_policy, terms_of_service, refund_policy
   - store_settings: logo_url, header_bg_url

2. **Updated Routes**
   - settings.js: handles logo_url, header_bg_url
   - products.js: handles all story/policy fields
   - public.js: returns logoUrl, headerBgUrl

---

## 🚀 Deployment Steps

### 1. Commit and Push to GitHub
```bash
cd C:\Users\ADMIN\Desktop\landing-kit-mvp
git add .
git commit -m "feat: Instagram premium UX features - stories, social, gallery dots"
git push origin main
```

### 2. Railway (Backend) - Auto-deploys from GitHub
After push, Railway will auto-deploy. Then run migration:
```
Visit: https://landing-kit-mvp-production-2cae.up.railway.app/api/init/migrate
```

### 3. Netlify (Frontend) - Auto-deploys from GitHub
- Dashboard: https://jariecom.netlify.app
- Store: https://jariecomstore.netlify.app

### 4. Test the Features
1. Open dashboard, go to Settings, add logo URL and header background
2. Create/edit a product, add story media URLs
3. Open the store, verify:
   - Header has background image
   - Gallery uses dots
   - Like/Share buttons work
   - Story circles display and open modal
   - Footer shows with policy links

---

## 📁 Changed Files

```
backend/
├── routes/init.js        (migration for new columns)
├── routes/products.js    (story + policy fields)
├── routes/settings.js    (logo_url, header_bg_url)
├── routes/public.js      (returns new fields)
└── server.js             (includes init routes)

dashboard/src/components/Dashboard/
├── ProductList.jsx       (story + policy form sections)
└── Settings.jsx          (logo + header image fields)

frontend-dynamic/
├── app.js                (all premium features)
├── styles.css            (gallery dots, stories, footer)
└── index.html            (story + policy modals)
```

---

## 🎯 Production URLs

- **Backend API**: https://landing-kit-mvp-production-2cae.up.railway.app
- **Dashboard**: https://jariecom.netlify.app
- **Store**: https://jariecomstore.netlify.app
- **Custom Domain**: jarisolutionsecom.store (pending DNS)
