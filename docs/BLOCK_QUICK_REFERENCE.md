# Block System - Quick Reference Card

## 16 BLOCKS IDENTIFIED

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNIVERSAL BLOCKS (6)                         │
├─────────────────────────────────────────────────────────────────┤
│  1. HERO_IMAGE         - Main product/service image             │
│  2. TITLE_PRICE_ACTIONS- Title + price + share/like             │
│  3. STORY_SHOWCASE     - IG-style circular gallery              │
│  4. TRUST_BADGES       - Warranty, delivery, returns            │
│  5. TESTIMONIALS       - Customer reviews (max 2)               │
│  6. STICKY_CTA_FOOTER  - Persistent buy/book button             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   PRODUCT BLOCKS (5)                            │
├─────────────────────────────────────────────────────────────────┤
│  7. SPECS_TABLE        - Technical specifications               │
│  8. VALUE_PROPOSITION  - "Why it's worth it" benefits           │
│  9. DIETARY_TAGS       - Food badges (Vegan, Spicy, etc)        │
│ 10. INGREDIENTS_LIST   - Food ingredients checklist             │
│ 11. FOOD_DETAILS       - Portion, prep time, calories           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   SERVICE BLOCKS (2)                            │
├─────────────────────────────────────────────────────────────────┤
│ 12. WHATS_INCLUDED     - Service deliverables list              │
│ 13. SEE_IT_IN_ACTION   - Video + gallery combo                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  COLLECTION BLOCKS (3)                          │
├─────────────────────────────────────────────────────────────────┤
│ 14. BRAND_HERO         - Store header (logo, name, CTAs)        │
│ 15. PROFESSIONAL_HERO  - Service provider header (photo, bio)   │
│ 16. CATEGORY_FILTER    - Horizontal filter tabs                 │
└─────────────────────────────────────────────────────────────────┘
```

## BLOCKS BY JOB-TO-BE-DONE

```
┌────────────────────────────┬────────────────────────────────────┐
│ JOB                        │ BLOCKS                             │
├────────────────────────────┼────────────────────────────────────┤
│ Quick Decision Single      │ 1,2,4,3,6 + optional 5             │
│ (Instagram Sellers)        │                                    │
├────────────────────────────┼────────────────────────────────────┤
│ Portfolio + Booking        │ 15,5 (collection)                  │
│ (Service Providers)        │ 1,2,3,12,5,6 (service detail)      │
├────────────────────────────┼────────────────────────────────────┤
│ Visual Menu                │ 14,16 (collection)                 │
│ (Restaurants)              │ 1,2,9,11,10,6 (product)            │
├────────────────────────────┼────────────────────────────────────┤
│ Deep Dive Evaluator        │ 1,2,4,3,7,8,5,6                    │
│ (High-Ticket Items)        │                                    │
├────────────────────────────┼────────────────────────────────────┤
│ Catalog Navigator          │ 14,16 (collection)                 │
│ (Multi-Product)            │ 1,2,4,6 (product)                  │
└────────────────────────────┴────────────────────────────────────┘
```

## CHECKOUT FLOWS

```
BUY NOW (Products):
[Delivery Details] → [Payment] → [Done]

BOOK NOW (Services):
[Calendar] → [Delivery Details] → [Payment] → [Done]

CUSTOMIZE (Food/Configurable):
[Customization Modal] → [Delivery Details] → [Payment] → [Done]
```

## ALWAYS PRESENT (Not Configurable)

- ✓ Collection page as homepage
- ✓ Price display (from product.price)
- ✓ Share/Like buttons
- ✓ Footer: "Powered by jarisolutionsecom.store"
- ✓ Legal links: Privacy, Refund, Terms

## COLOR SCHEMES

```
TECH (Blue):     #0071e3 → #00d4ff
FOOD (Orange):   #ff9f0a → #ff375f  
SERVICE (Green): #30d158 → #00c7be
```

## DATABASE CHOICE

Option B Recommended: Separate blocks table
- More flexible for querying
- Easier to reorder blocks
- Better for analytics (which blocks perform best?)

## IMPLEMENTATION ORDER

```
Phase 1: Infrastructure (schema, renderer, manager)
Phase 2: Essential blocks (1,2,4,3,6,5) - MVP
Phase 3: Specialized blocks (7,8,12,9,10)
Phase 4: Collection blocks (14,15,16)
Phase 5: Advanced (13, checkout variants)
```
