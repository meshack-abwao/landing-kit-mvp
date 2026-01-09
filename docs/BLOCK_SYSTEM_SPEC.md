# Block System Specification
## Landing Kit MVP - Modular Block Architecture

**Generated:** January 9, 2026
**Based on:** Analysis of 8 HTML sample templates (abc1-abc8)

---

## PHILOSOPHY

> "The difference between templates is NOT the whole code structure but just ADDONS/BLOCKS"

Instead of 6 separate template codebases, we build ONE flexible system where users compose their store from blocks that serve their specific job-to-be-done.

---

## BLOCK CATALOG (16 Blocks)

### UNIVERSAL BLOCKS (All Templates)

#### 1. HERO_IMAGE
Product/service main image
```json
{
  "block_type": "hero_image",
  "settings": {
    "image_url": "https://...",
    "aspect_ratio": "1:1",
    "border_radius": 20
  }
}
```

#### 2. TITLE_PRICE_ACTIONS
Product header with share/like
```json
{
  "block_type": "title_price_actions",
  "settings": {
    "show_share": true,
    "show_like": true,
    "price_note": "Full Day Coverage"
  }
}
```

#### 3. STORY_SHOWCASE
IG-style circular gallery with popup
```json
{
  "block_type": "story_showcase",
  "settings": {
    "title": "Product Showcase",
    "stories": [
      {"image_url": "...", "label": "Overview"},
      {"image_url": "...", "label": "Details"},
      {"image_url": "...", "label": "In Use"},
      {"image_url": "...", "label": "Unboxing"}
    ]
  }
}
```

#### 4. TRUST_BADGES
Credibility indicators
```json
{
  "block_type": "trust_badges",
  "settings": {
    "badges": [
      {"icon": "🛡️", "text": "2-Year Warranty"},
      {"icon": "🚚", "text": "Free Delivery"},
      {"icon": "↩️", "text": "30-Day Returns"}
    ]
  }
}
```

#### 5. TESTIMONIALS
Customer reviews (max 2)
```json
{
  "block_type": "testimonials",
  "settings": {
    "title": "What Customers Say",
    "testimonials": [
      {
        "stars": 5,
        "text": "Amazing product!",
        "author_name": "Sarah M.",
        "author_detail": "Verified Buyer",
        "author_initial": "S"
      }
    ]
  }
}
```

#### 6. STICKY_CTA_FOOTER
Persistent action button
```json
{
  "block_type": "sticky_cta_footer",
  "settings": {
    "primary_text": "Buy Now",
    "secondary_text": "Talk to Expert",
    "show_quantity": true,
    "show_stock": true
  }
}
```

---

### PRODUCT-SPECIFIC BLOCKS

#### 7. SPECS_TABLE
Technical specifications
```json
{
  "block_type": "specs_table",
  "settings": {
    "title": "Technical Specifications",
    "specs": [
      {"label": "Processor", "value": "Apple M3 Chip"},
      {"label": "RAM", "value": "16GB Unified Memory"},
      {"label": "Storage", "value": "512GB SSD"}
    ]
  }
}
```

#### 8. VALUE_PROPOSITION
"Why it's worth it" benefits
```json
{
  "block_type": "value_proposition",
  "settings": {
    "title": "Why It's Worth It",
    "benefits": [
      "5+ year lifespan with regular updates",
      "Energy efficient - saves on electricity",
      "High resale value when you upgrade"
    ]
  }
}
```

#### 9. DIETARY_TAGS
Food-specific tags (inline badges)
```json
{
  "block_type": "dietary_tags",
  "settings": {
    "tags": ["Popular", "Vegetarian", "Wood-Fired", "Spicy"]
  }
}
```

#### 10. INGREDIENTS_LIST
Food ingredients
```json
{
  "block_type": "ingredients_list",
  "settings": {
    "title": "Ingredients",
    "ingredients": [
      "Fresh Mozzarella",
      "San Marzano Tomatoes",
      "Fresh Basil",
      "Extra Virgin Olive Oil"
    ]
  }
}
```

#### 11. FOOD_DETAILS
Portion/prep info
```json
{
  "block_type": "food_details",
  "settings": {
    "details": [
      {"label": "Portion Size", "value": "12\" (serves 2-3)"},
      {"label": "Prep Time", "value": "15-20 minutes"},
      {"label": "Calories", "value": "~280 per slice"}
    ]
  }
}
```

---

### SERVICE-SPECIFIC BLOCKS

#### 12. WHATS_INCLUDED
Service deliverables
```json
{
  "block_type": "whats_included",
  "settings": {
    "title": "What's Included",
    "items": [
      "8-10 hours of coverage",
      "500+ edited photos",
      "Private online gallery",
      "USB drive included"
    ]
  }
}
```

#### 13. SEE_IT_IN_ACTION
Video + gallery combo
```json
{
  "block_type": "see_it_in_action",
  "settings": {
    "title": "See It In Action",
    "video_url": "https://youtube.com/...",
    "gallery": [
      "https://image1.jpg",
      "https://image2.jpg",
      "https://image3.jpg"
    ]
  }
}
```

---

### COLLECTION PAGE BLOCKS

#### 14. BRAND_HERO
Collection page header
```json
{
  "block_type": "brand_hero",
  "settings": {
    "logo_url": "https://...",
    "business_name": "TechStore KE",
    "tagline": "Premium gadgets at honest prices",
    "background_type": "gradient",
    "background_value": "linear-gradient(135deg, #0071e3, #00d4ff)",
    "primary_cta": "Shop Now",
    "secondary_cta": "View Catalog"
  }
}
```

#### 15. PROFESSIONAL_HERO
Service provider header
```json
{
  "block_type": "professional_hero",
  "settings": {
    "photo_url": "https://...",
    "name": "John Kamau",
    "tagline": "Creating timeless memories through authentic storytelling",
    "availability_status": "available",
    "primary_cta": "Book Now",
    "secondary_cta": "See Availability"
  }
}
```

#### 16. CATEGORY_FILTER
Horizontal filter tabs
```json
{
  "block_type": "category_filter",
  "settings": {
    "categories": ["All", "Laptops", "Phones", "Accessories"],
    "default_active": "All"
  }
}
```

---

## DATABASE SCHEMA

### Option A: JSONB in Products Table (Simpler)
```sql
ALTER TABLE products ADD COLUMN blocks JSONB DEFAULT '[]';
ALTER TABLE store_settings ADD COLUMN collection_blocks JSONB DEFAULT '[]';
```

### Option B: Separate Blocks Table (More Flexible)
```sql
CREATE TABLE product_blocks (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  block_type VARCHAR(50) NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  order_position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE collection_blocks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  block_type VARCHAR(50) NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  order_position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_blocks_product ON product_blocks(product_id);
CREATE INDEX idx_collection_blocks_user ON collection_blocks(user_id);
```

---

## BLOCK PRESETS BY JOB

### Quick Decision Single (Instagram Sellers)
```json
{
  "preset": "quick_single",
  "product_blocks": [
    {"block_type": "hero_image", "order": 1},
    {"block_type": "title_price_actions", "order": 2},
    {"block_type": "trust_badges", "order": 3},
    {"block_type": "story_showcase", "order": 4},
    {"block_type": "sticky_cta_footer", "order": 5}
  ]
}
```

### Portfolio + Booking (Service Providers)
```json
{
  "preset": "portfolio_booking",
  "collection_blocks": [
    {"block_type": "professional_hero", "order": 1},
    {"block_type": "testimonials", "order": 2}
  ],
  "product_blocks": [
    {"block_type": "hero_image", "order": 1},
    {"block_type": "title_price_actions", "order": 2},
    {"block_type": "story_showcase", "order": 3},
    {"block_type": "whats_included", "order": 4},
    {"block_type": "testimonials", "order": 5},
    {"block_type": "sticky_cta_footer", "order": 6}
  ]
}
```

### Visual Menu (Restaurants)
```json
{
  "preset": "visual_menu",
  "collection_blocks": [
    {"block_type": "brand_hero", "order": 1},
    {"block_type": "category_filter", "order": 2}
  ],
  "product_blocks": [
    {"block_type": "hero_image", "order": 1},
    {"block_type": "title_price_actions", "order": 2},
    {"block_type": "dietary_tags", "order": 3},
    {"block_type": "food_details", "order": 4},
    {"block_type": "ingredients_list", "order": 5},
    {"block_type": "sticky_cta_footer", "order": 6}
  ]
}
```

### Deep Dive Evaluator (High-Ticket)
```json
{
  "preset": "deep_dive",
  "product_blocks": [
    {"block_type": "hero_image", "order": 1},
    {"block_type": "title_price_actions", "order": 2},
    {"block_type": "trust_badges", "order": 3},
    {"block_type": "story_showcase", "order": 4},
    {"block_type": "specs_table", "order": 5},
    {"block_type": "value_proposition", "order": 6},
    {"block_type": "testimonials", "order": 7},
    {"block_type": "sticky_cta_footer", "order": 8}
  ]
}
```

---

## ALWAYS PRESENT (Not Blocks)

These elements are ALWAYS rendered, NOT configurable:

1. **Collection page as homepage** (mandatory)
2. **Price display** (pulled from product.price)
3. **Share/Like buttons** (part of title_price_actions)
4. **Footer:** "Powered by jarisolutionsecom.store" + legal links

---

## CHECKOUT TYPES (Special CTA Variants)

The `sticky_cta_footer` block supports 3 checkout flows:

### 1. Buy Now (Products)
```json
{
  "checkout_type": "buy_now",
  "flow": ["delivery_details", "payment", "confirmation"]
}
```

### 2. Book Now (Services)
```json
{
  "checkout_type": "book_now",
  "flow": ["calendar_picker", "delivery_details", "payment", "confirmation"]
}
```

### 3. Customize Order (Food/Configurable)
```json
{
  "checkout_type": "customize",
  "flow": ["customization_modal", "delivery_details", "payment", "confirmation"]
}
```

---

## THEMING

Blocks inherit theme from store_settings:

```sql
-- store_settings columns
theme_color VARCHAR(50)  -- References themes.name
font_family VARCHAR(100)
```

Each block renders using CSS variables:
```css
:root {
  --gradient-primary: var(--theme-gradient);
  --color-primary: var(--theme-primary);
  --font-heading: var(--theme-heading-font);
  --font-body: var(--theme-body-font);
}
```

---

## IMPLEMENTATION PRIORITY

### Phase 1: Core Infrastructure
1. Database schema (blocks tables)
2. Block renderer engine
3. Block manager (CRUD operations)

### Phase 2: Essential Blocks (MVP)
1. hero_image
2. title_price_actions
3. trust_badges
4. story_showcase
5. sticky_cta_footer
6. testimonials

### Phase 3: Specialized Blocks
1. specs_table
2. value_proposition
3. whats_included
4. dietary_tags
5. ingredients_list

### Phase 4: Collection Blocks
1. brand_hero
2. professional_hero
3. category_filter

### Phase 5: Advanced Features
1. see_it_in_action (video)
2. Checkout type variations
3. Block presets/templates

---

## MIGRATION STRATEGY

For existing 17 orders and products:

1. Add `blocks` column to products (JSONB, default '[]')
2. Existing products get empty blocks array
3. Store renders with "legacy mode" if blocks empty
4. New products use block system
5. Gradually migrate old products

---

## DECISION POINTS (Need User Input)

1. **Pricing model:** Free blocks vs premium blocks vs flat fee?
2. **Block limits:** Unlimited or capped per tier?
3. **Custom blocks:** Allow users to request custom blocks?
4. **Block ordering:** Drag-and-drop in dashboard?
5. **Block visibility:** Toggle blocks on/off without deleting?

---

**END OF SPECIFICATION**
