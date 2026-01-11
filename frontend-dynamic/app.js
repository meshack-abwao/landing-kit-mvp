// ===========================================
// LANDING KIT STORE - Configuration
// ===========================================
const API_BASE_URL = (() => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return 'http://localhost:3000';
})();

// ===========================================
// SUBDOMAIN DETECTION
// ===========================================
const urlParams = new URLSearchParams(window.location.search);
const SUBDOMAIN = urlParams.get('subdomain') || (() => {
  const parts = window.location.hostname.split('.');
  return (parts.length > 2 && parts[0] !== 'www') ? parts[0] : 'testfashion';
})();

// ===========================================
// STATE
// ===========================================
let storeData = null;
let currentProduct = null;
let quantity = 1;
let selectedPaymentMethod = null;
let currentImageIndex = 0;
let productImages = [];
let likedProducts = JSON.parse(localStorage.getItem('likedProducts') || '{}');

// ===========================================
// TESTIMONIALS HELPER
// ===========================================
function generateTestimonialsHTML(testimonials, sectionTitle = 'What Our Customers Say') {
    if (!testimonials) return '';
    
    // Parse if string (from database JSONB)
    let parsed = testimonials;
    if (typeof testimonials === 'string') {
        try { parsed = JSON.parse(testimonials); } catch (e) { return ''; }
    }
    
    if (!Array.isArray(parsed) || parsed.length === 0) return '';
    
    // Filter out empty testimonials
    const valid = parsed.filter(t => t && t.quote && t.quote.trim());
    if (valid.length === 0) return '';
    
    return `
        <section class="testimonials-section">
            <h3 class="testimonials-title">${sectionTitle}</h3>
            <div class="testimonials-grid">
                ${valid.map(t => `
                    <div class="testimonial-card">
                        ${t.avatar ? `<img src="${t.avatar}" alt="${t.name || 'Customer'}" class="testimonial-avatar">` : 
                            `<div class="testimonial-avatar-placeholder">${(t.name || 'C').charAt(0).toUpperCase()}</div>`}
                        <p class="testimonial-quote">"${t.quote}"</p>
                        <div class="testimonial-author">
                            <span class="testimonial-name">${t.name || 'Happy Customer'}</span>
                            ${t.role ? `<span class="testimonial-role">${t.role}</span>` : ''}
                        </div>
                        <div class="testimonial-rating">★★★★★</div>
                    </div>
                `).join('')}
            </div>
        </section>
    `;
}

// ===========================================
// INITIALIZATION
// ===========================================
async function init() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/public/store/${SUBDOMAIN}`);
        if (!response.ok) throw new Error('Store not found');

        storeData = await response.json();
        
        applyTheme(storeData.store?.theme);
        
        if (storeData.store?.fontFamily) {
            document.documentElement.style.setProperty('--font-family', storeData.store.fontFamily, 'important');
            loadGoogleFont(storeData.store.fontFamily);
        }
        
        const productId = urlParams.get('product');
        if (productId) {
            const product = storeData.products?.find(p => p.id === parseInt(productId));
            product ? renderSingleProduct(product) : renderStore();
        } else {
            renderStore();
        }
        
        applyHeaderBackground();
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        
    } catch (error) {
        console.error('Failed to load store:', error);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'flex';
    }
}

// ===========================================
// THEME APPLICATION
// ===========================================
function applyTheme(theme) {
    if (!theme) return;
    
    const root = document.documentElement;
    if (theme.gradient) root.style.setProperty('--gradient-primary', theme.gradient, 'important');
    if (theme.primary_color) root.style.setProperty('--color-primary', theme.primary_color, 'important');
    if (theme.heading_font) {
        root.style.setProperty('--font-heading', theme.heading_font, 'important');
        loadGoogleFont(theme.heading_font);
    }
    if (theme.body_font) {
        root.style.setProperty('--font-body', theme.body_font, 'important');
        loadGoogleFont(theme.body_font);
    }
    
    if (storeData?.store) document.title = storeData.store.logoText || 'Store';
}

function applyHeaderBackground() {
    const header = document.querySelector('.hero-section');
    if (!header || !storeData?.store?.headerBgUrl) return;
    
    const bgUrl = storeData.store.headerBgUrl;
    if (bgUrl && bgUrl.trim()) {
        header.style.cssText += `background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${bgUrl}') !important; background-size: cover !important; background-position: center !important;`;
        header.classList.add('has-bg-image');
    }
}

function loadGoogleFont(fontName) {
    const systemFonts = ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont'];
    if (systemFonts.includes(fontName)) return;
    if (document.querySelector(`link[href*="${fontName.replace(' ', '+')}"]`)) return;
    
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}:wght@400;500;600;700;800&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
}

// ===========================================
// HERO SECTION RENDERING
// ===========================================
function renderHeroSection() {
    const { store } = storeData;
    
    const heroPhoto = document.getElementById('heroPhoto');
    if (heroPhoto) {
        if (store?.logoImageUrl) {
            // Show logo image - uses object-fit:cover to fill and crop nicely
            heroPhoto.innerHTML = `<img src="${store.logoImageUrl}" alt="${store.logoText || 'Logo'}" class="hero-photo-img">`;
            heroPhoto.style.display = 'flex';
        } else if (store?.logoText) {
            // Fallback to first letter
            heroPhoto.textContent = store.logoText.charAt(0).toUpperCase();
            heroPhoto.style.display = 'flex';
        }
    }
    
    const heroTitle = document.getElementById('heroTitle');
    const heroSubtitle = document.getElementById('heroSubtitle');
    
    if (heroTitle) heroTitle.textContent = store?.logoText || 'Welcome';
    if (heroSubtitle) {
        heroSubtitle.textContent = store?.tagline || '';
        heroSubtitle.style.display = store?.tagline ? 'block' : 'none';
    }
    
    const testimonialSection = document.getElementById('featuredTestimonial');
    if (testimonialSection) testimonialSection.style.display = 'none';
}

// ===========================================
// IMAGE GALLERY FUNCTIONS
// ===========================================
function getProductImages(product) {
    const images = [];
    if (product.image_url) images.push(product.image_url);
    
    try {
        const additional = typeof product.additional_images === 'string' 
            ? JSON.parse(product.additional_images) 
            : product.additional_images;
        if (Array.isArray(additional)) {
            additional.forEach(url => { if (url?.trim()) images.push(url.trim()); });
        }
    } catch (e) {}
    
    return images;
}

function getStoryMedia(product) {
    try {
        const stories = typeof product.story_media === 'string' 
            ? JSON.parse(product.story_media) 
            : product.story_media;
        return Array.isArray(stories) ? stories.slice(0, 4) : [];
    } catch (e) { return []; }
}

function setMainImage(index) {
    if (index < 0 || index >= productImages.length) return;
    currentImageIndex = index;
    
    const mainImg = document.getElementById('mainProductImage');
    if (mainImg) mainImg.src = productImages[index];
    
    document.querySelectorAll('.gallery-dot').forEach((dot, i) => dot.classList.toggle('active', i === index));
    document.querySelectorAll('.thumbnail, .thumb-item').forEach((thumb, i) => thumb.classList.toggle('active', i === index));
}

function nextImage() {
    if (productImages.length <= 1) return;
    setMainImage((currentImageIndex + 1) % productImages.length);
}

function prevImage() {
    if (productImages.length <= 1) return;
    setMainImage((currentImageIndex - 1 + productImages.length) % productImages.length);
}

// ===========================================
// LIKE & SHARE FUNCTIONS
// ===========================================
let lastTapTime = 0;

function handleImageDoubleTap(productId, event) {
    const currentTime = new Date().getTime();
    const tapGap = currentTime - lastTapTime;
    
    if (tapGap < 300 && tapGap > 0) {
        // Double tap detected - trigger like
        const key = `${SUBDOMAIN}_${productId}`;
        if (!likedProducts[key]) {
            toggleLike(productId, event);
            showHeartAnimation(event);
        }
    }
    lastTapTime = currentTime;
}

function showHeartAnimation(event) {
    const heart = document.createElement('div');
    heart.className = 'double-tap-heart';
    heart.innerHTML = '❤️';
    
    const rect = event.target.getBoundingClientRect();
    heart.style.left = (event.clientX - rect.left) + 'px';
    heart.style.top = (event.clientY - rect.top) + 'px';
    
    event.target.parentElement.appendChild(heart);
    
    setTimeout(() => heart.remove(), 800);
}

function toggleLike(productId, event) {
    if (event) event.stopPropagation();
    
    const key = `${SUBDOMAIN}_${productId}`;
    likedProducts[key] = !likedProducts[key];
    localStorage.setItem('likedProducts', JSON.stringify(likedProducts));
    
    const heartIcon = document.querySelector(`#like-btn-${productId} .heart-icon`);
    if (heartIcon) {
        heartIcon.classList.toggle('liked', likedProducts[key]);
        heartIcon.innerHTML = likedProducts[key] ? '❤️' : '🤍';
    }
}

function isProductLiked(productId) {
    return likedProducts[`${SUBDOMAIN}_${productId}`] || false;
}

async function shareProduct(productId, event) {
    if (event) event.stopPropagation();
    
    const product = currentProduct || storeData.products.find(p => p.id === productId);
    if (!product) return;
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?subdomain=${SUBDOMAIN}&product=${productId}`;
    
    if (navigator.share) {
        try {
            await navigator.share({ title: product.name, text: `Check out ${product.name}`, url: shareUrl });
        } catch (err) {
            if (err.name !== 'AbortError') copyToClipboard(shareUrl);
        }
    } else {
        copyToClipboard(shareUrl);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => showToast('Link copied!')).catch(() => showToast('Could not copy'));
}

function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 2000);
}

// ===========================================
// STORY MODAL FUNCTIONS
// ===========================================
let storyTimer = null;
let currentStoryIndex = 0;
const STORY_DURATION = 5000;

function openStory(index) {
    const stories = getStoryMedia(currentProduct);
    if (!stories.length) return;
    currentStoryIndex = index;
    showStoryAtIndex(currentStoryIndex);
}

function showStoryAtIndex(index) {
    const stories = getStoryMedia(currentProduct);
    if (index < 0 || index >= stories.length) { closeStory(); return; }
    
    currentStoryIndex = index;
    const story = stories[index];
    const modal = document.getElementById('storyModal');
    const content = document.getElementById('storyContent');
    
    clearTimeout(storyTimer);
    
    const progressHTML = `
        <div class="story-progress-container">
            ${stories.map((_, i) => `
                <div class="story-progress-bar ${i < index ? 'completed' : ''} ${i === index ? 'active' : ''}">
                    <div class="story-progress-fill"></div>
                </div>
            `).join('')}
        </div>
    `;
    
    const navHTML = `
        <div class="story-nav-left" onclick="prevStory(event)"></div>
        <div class="story-nav-right" onclick="nextStory(event)"></div>
        <button class="story-close-btn" onclick="closeStory()">✕</button>
    `;
    
    if (story.type === 'video') {
        content.innerHTML = `${progressHTML}${navHTML}<video src="${story.url}" autoplay playsinline class="story-media" onended="nextStory()"></video>`;
        const video = content.querySelector('video');
        video.onloadedmetadata = () => startProgressAnimation(video.duration * 1000);
    } else {
        content.innerHTML = `${progressHTML}${navHTML}<img src="${story.url}" alt="Story" class="story-media">`;
        startProgressAnimation(STORY_DURATION);
        storyTimer = setTimeout(() => nextStory(), STORY_DURATION);
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function startProgressAnimation(duration) {
    const activeBar = document.querySelector('.story-progress-bar.active .story-progress-fill');
    if (activeBar) {
        // Reset to 0 first, then animate
        activeBar.style.transition = 'none';
        activeBar.style.width = '0';
        // Force reflow then animate
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                activeBar.style.transition = `width ${duration}ms linear`;
                activeBar.style.width = '100%';
            });
        });
    }
}

function nextStory(event) {
    if (event) event.stopPropagation();
    const stories = getStoryMedia(currentProduct);
    currentStoryIndex < stories.length - 1 ? showStoryAtIndex(currentStoryIndex + 1) : closeStory();
}

function prevStory(event) {
    if (event) event.stopPropagation();
    if (currentStoryIndex > 0) showStoryAtIndex(currentStoryIndex - 1);
}

function closeStory() {
    const modal = document.getElementById('storyModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    clearTimeout(storyTimer);
    const video = modal.querySelector('video');
    if (video) video.pause();
}

// ===========================================
// POLICY MODAL FUNCTIONS
// ===========================================
function showPolicy(type) {
    if (!currentProduct) return;
    
    const titles = { privacy: 'Privacy Policy', terms: 'Terms of Service', refund: 'Refund Policy' };
    const storePolicies = storeData?.store || {};
    const content = {
        privacy: storePolicies.privacy_policy || currentProduct.privacy_policy || 'No privacy policy available.',
        terms: storePolicies.terms_of_service || currentProduct.terms_of_service || 'No terms of service available.',
        refund: storePolicies.refund_policy || currentProduct.refund_policy || 'No refund policy available.'
    };
    
    document.getElementById('policyTitle').textContent = titles[type];
    document.getElementById('policyText').textContent = content[type];
    document.getElementById('policyModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePolicy() {
    document.getElementById('policyModal').classList.remove('active');
    document.body.style.overflow = '';
}

// ===========================================
// RENDER FUNCTIONS
// ===========================================
function renderStore() {
    const { store, products } = storeData;
    renderHeroSection();
    
    const main = document.getElementById('main');
    
    if (!products || products.length === 0) {
        main.innerHTML = `<div class="empty-state"><div class="empty-icon">📦</div><h2>No Products Available</h2><p>Check back soon!</p></div>`;
        return;
    }
    
    products.length === 1 ? renderSingleProduct(products[0]) : renderCollectionsGrid(products);
}

// Track active category filter
let activeCategoryFilter = null;

function filterByCategory(categoryName) {
    activeCategoryFilter = activeCategoryFilter === categoryName ? null : categoryName;
    renderCollectionsGrid(storeData.products);
}
// Expose to window for onclick handlers
window.filterByCategory = filterByCategory;

function renderCollectionsGrid(products) {
    const main = document.getElementById('main');
    const categories = storeData.store?.categories || [];
    const collectionTitle = storeData.store?.collectionTitle || 'Shop All Products';
    const collectionSubtitle = storeData.store?.collectionSubtitle || '';
    
    // Filter products by active category
    const filteredProducts = activeCategoryFilter 
        ? products.filter(p => p.category === activeCategoryFilter)
        : products;
    
    // Generate category filter tags HTML
    const categoryFiltersHTML = categories.length > 0 ? `
        <div class="category-filters">
            <button class="category-filter-tag ${!activeCategoryFilter ? 'active' : ''}" onclick="filterByCategory(null)">
                All
            </button>
            ${categories.map(cat => `
                <button class="category-filter-tag ${activeCategoryFilter === cat.name ? 'active' : ''}" onclick="filterByCategory('${cat.name}')">
                    ${cat.emoji} ${cat.name}
                </button>
            `).join('')}
        </div>
    ` : '';
    
    main.innerHTML = `
        <div class="collections-container">
            <div class="collections-header">
                <h2>${collectionTitle}</h2>
                <p>${collectionSubtitle || `${filteredProducts.length} ${filteredProducts.length === 1 ? 'Product' : 'Products'} Available`}</p>
            </div>
            ${categoryFiltersHTML}
            <div class="collections-grid">
                ${filteredProducts.map(product => {
                    const imgCount = getProductImages(product).length;
                    // Parse dietary tags for collection cards
                    let dietaryTags = [];
                    try { dietaryTags = Array.isArray(product.dietary_tags) ? product.dietary_tags : JSON.parse(product.dietary_tags || '[]'); } catch (e) {}
                    const dietaryHTML = dietaryTags.length > 0 ? `
                        <div class="collection-dietary-tags">
                            ${dietaryTags.slice(0, 3).map(tag => {
                                const icons = { 'vegetarian': '🥬', 'vegan': '🌱', 'spicy': '🌶️', 'hot': '🔥', 'gluten-free': '🌾', 'halal': '☪️', 'contains-nuts': '🥜', 'dairy-free': '🥛', 'nut-free': '🥜', 'organic': '🌿' };
                                return `<span class="collection-dietary-tag">${icons[tag.toLowerCase()] || '•'} ${tag}</span>`;
                            }).join('')}
                        </div>
                    ` : '';
                    return `
                    <div class="collection-card" onclick="viewProduct(${product.id})">
                        <div class="collection-image">
                            ${product.image_url ? 
                                `<img src="${product.image_url}" alt="${product.name}" onerror="this.parentElement.innerHTML='<div class=\\'image-placeholder\\'>📸</div>'">` :
                                '<div class="image-placeholder">📸</div>'
                            }
                            ${imgCount > 1 ? `<span class="image-count-badge">📷 ${imgCount}</span>` : ''}
                            <div class="collection-overlay">
                                <h3 class="collection-overlay-name">${product.name}</h3>
                                <span class="collection-overlay-price">KES ${parseInt(product.price).toLocaleString()}</span>
                            </div>
                        </div>
                        <div class="collection-content">
                            ${product.description ? `<p class="collection-description">${product.description.substring(0, 80)}${product.description.length > 80 ? '...' : ''}</p>` : ''}
                            ${dietaryHTML}
                            <button class="collection-btn">Get This Now</button>
                        </div>
                    </div>
                `}).join('')}
            </div>
            ${storeData.store?.showTestimonials !== false ? generateTestimonialsHTML(storeData.store?.collectionTestimonials, 'What Our Customers Say') : ''}
        </div>
    `;
}

function viewProduct(productId) {
    const url = new URL(window.location);
    url.searchParams.set('product', productId);
    window.history.pushState({}, '', url);
    
    const product = storeData.products.find(p => p.id === productId);
    if (product) {
        renderSingleProduct(product);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function renderSingleProduct(product) {
    currentProduct = product;
    quantity = 1;
    currentImageIndex = 0;
    productImages = getProductImages(product);
    
    const heroSection = document.getElementById('heroSection');
    if (heroSection) heroSection.classList.add('header-compact');
    
    const templateType = product.template_type || 'quick-decision';
    
    switch(templateType) {
        case 'portfolio-booking': renderPortfolioBookingTemplate(product); break;
        case 'visual-menu': renderVisualMenuTemplate(product); break;
        case 'deep-dive': renderDeepDiveTemplate(product); break;
        case 'event-landing': renderEventLandingTemplate(product); break;
        default: renderQuickDecisionTemplate(product);
    }
}

// ===========================================
// TEMPLATE 1: QUICK DECISION (Default)
// ===========================================
function renderQuickDecisionTemplate(product) {
    const stories = getStoryMedia(product);
    const isLiked = isProductLiked(product.id);
    const main = document.getElementById('main');
    
    // Parse gallery_images and fallback to productImages (from additional_images)
    let galleryImages = [];
    try {
        const parsed = Array.isArray(product.gallery_images) ? product.gallery_images : JSON.parse(product.gallery_images || '[]');
        galleryImages = parsed.filter(url => url?.trim());
    } catch (e) {}
    if (galleryImages.length === 0) galleryImages = productImages;
    productImages = galleryImages;
    
    const backButton = storeData.products.length > 1 ? `<button onclick="backToCollections()" class="back-btn">← Back to All Products</button>` : '';
    const hasMultipleImages = productImages.length > 1;
    
    const galleryHTML = `
        <div class="product-gallery">
            <div class="main-image-container" onclick="handleImageDoubleTap(${product.id}, event)">
                ${hasMultipleImages ? `<button class="gallery-nav prev" onclick="prevImage()">‹</button>` : ''}
                ${productImages[0] ? `<img id="mainProductImage" src="${productImages[0]}" alt="${product.name}" class="main-gallery-image">` : '<div class="image-placeholder">📸</div>'}
                ${hasMultipleImages ? `<button class="gallery-nav next" onclick="nextImage()">›</button>` : ''}
            </div>
            ${hasMultipleImages ? `<div class="gallery-dots">${productImages.map((_, idx) => `<span class="gallery-dot ${idx === 0 ? 'active' : ''}" onclick="setMainImage(${idx})"></span>`).join('')}</div>` : ''}
        </div>
    `;
    
    const storyHTML = stories.length > 0 ? `
        <div class="story-section">
            ${product.story_title ? `<p class="story-title">${product.story_title}</p>` : ''}
            <div class="story-circles">
                ${stories.map((story, idx) => `
                    <div class="story-circle" onclick="openStory(${idx})">
                        <div class="story-ring"><img src="${story.thumbnail || story.url}" alt="Story ${idx + 1}"></div>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';
    
    main.innerHTML = `
        ${backButton}
        <div class="product-container">
            <div class="product-card">
                ${galleryHTML}
                <div class="product-info">
                    <h2 class="product-name">${product.name}</h2>
                    <div class="price-row">
                        <div class="price"><span class="currency">KES</span> <span id="displayPrice">${parseInt(product.price).toLocaleString()}</span></div>
                        <div class="social-actions">
                            <button class="social-btn share-btn" onclick="shareProduct(${product.id}, event)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                            </button>
                            <button id="like-btn-${product.id}" class="social-btn like-btn" onclick="toggleLike(${product.id}, event)">
                                <span class="heart-icon ${isLiked ? 'liked' : ''}">${isLiked ? '❤️' : '🤍'}</span>
                            </button>
                        </div>
                    </div>
                    ${storyHTML}
                    <p class="product-description">${product.description || ''}</p>
                    <div class="quantity-section">
                        <label class="quantity-label">Quantity</label>
                        <div class="quantity-controls">
                            <button onclick="decreaseQuantity()" id="decreaseBtn" class="quantity-btn" ${quantity <= 1 ? 'disabled' : ''}>−</button>
                            <span class="quantity-value" id="quantityDisplay">1</span>
                            <button onclick="increaseQuantity()" id="increaseBtn" class="quantity-btn">+</button>
                        </div>
                    </div>
                    <div class="total-section">
                        <span class="total-label">Total</span>
                        <div class="total-price">KES <span id="totalPrice">${parseInt(product.price).toLocaleString()}</span></div>
                    </div>
                    <button onclick="openCheckout()" class="buy-btn"><span class="btn-text">Buy Now</span><span class="btn-arrow">→</span></button>
                </div>
            </div>
            ${generateTestimonialsHTML(product.testimonials, 'Customer Reviews')}
        </div>
    `;
    
    if (hasMultipleImages) setTimeout(() => setupSwipeGestures(), 100);
}

function setupSwipeGestures() {
    const container = document.querySelector('.main-image-container');
    if (!container) return;
    
    let startX = 0;
    container.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    container.addEventListener('touchend', (e) => {
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) diff > 0 ? nextImage() : prevImage();
    }, { passive: true });
}

// ===========================================
// TEMPLATE 2: PORTFOLIO + BOOKING
// ===========================================
function renderPortfolioBookingTemplate(product) {
    const stories = getStoryMedia(product);
    const isLiked = isProductLiked(product.id);
    
    let servicePackages = [];
    try {
        servicePackages = Array.isArray(product.service_packages) ? product.service_packages : JSON.parse(product.service_packages || '[]');
    } catch (e) {}
    window.currentServicePackages = servicePackages;
    
    let galleryImages = [];
    try {
        const parsed = Array.isArray(product.gallery_images) ? product.gallery_images : JSON.parse(product.gallery_images || '[]');
        galleryImages = parsed.filter(url => url?.trim());
    } catch (e) {}
    if (galleryImages.length === 0) galleryImages = productImages.slice(0, 6);
    if (galleryImages.length === 0 && product.image_url) galleryImages = [product.image_url];
    
    productImages = galleryImages;
    const main = document.getElementById('main');
    const backButton = storeData.products.length > 1 ? `<button onclick="backToCollections()" class="back-btn">← Back to All Services</button>` : '';
    
    const heroImageHTML = `
        <div class="portfolio-hero-image" onclick="handleImageDoubleTap(${product.id}, event)">
            <img id="mainProductImage" src="${galleryImages[0] || product.image_url}" alt="${product.name}">
            ${galleryImages.length > 1 ? `
                <div class="image-nav"><button class="nav-btn prev-btn" onclick="prevImage()">‹</button><button class="nav-btn next-btn" onclick="nextImage()">›</button></div>
                <div class="gallery-dots">${galleryImages.map((_, idx) => `<span class="gallery-dot ${idx === 0 ? 'active' : ''}" onclick="setMainImage(${idx})"></span>`).join('')}</div>
            ` : ''}
        </div>
    `;
    
    const thumbnailsHTML = galleryImages.length > 1 ? `
        <div class="portfolio-thumbnails">
            ${galleryImages.map((img, idx) => `<div class="thumb-item ${idx === 0 ? 'active' : ''}" onclick="setMainImage(${idx})"><img src="${img}" alt="Gallery ${idx + 1}"></div>`).join('')}
        </div>
    ` : '';
    
    const storyHTML = stories.length > 0 ? `
        <div class="story-section portfolio-stories">
            <p class="story-title">${product.story_title || 'See My Work'}</p>
            <div class="story-circles">${stories.map((story, idx) => `<div class="story-circle" onclick="openStory(${idx})"><div class="story-ring"><img src="${story.thumbnail || story.url}" alt="Story ${idx + 1}"></div></div>`).join('')}</div>
        </div>
    ` : '';
    
    const availabilityHTML = product.availability_notes ? `<div class="availability-section"><span class="availability-icon">📅</span><span class="availability-text">${product.availability_notes}</span></div>` : '';
    
    main.innerHTML = `
        ${backButton}
        <div class="product-container template-portfolio edge-to-edge">
            <div class="product-card portfolio-card">
                ${heroImageHTML}
                ${thumbnailsHTML}
                <div class="product-info portfolio-info">
                    <h2 class="product-name">${product.name}</h2>
                    <div class="price-row">
                        <div class="price">${servicePackages.length > 0 ? '<span class="price-prefix">From </span>' : ''}<span class="currency">KES</span> <span id="displayPrice">${parseInt(product.price).toLocaleString()}</span></div>
                        <div class="social-actions">
                            <button class="social-btn share-btn" onclick="shareProduct(${product.id}, event)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></button>
                            <button id="like-btn-${product.id}" class="social-btn like-btn" onclick="toggleLike(${product.id}, event)"><span class="heart-icon ${isLiked ? 'liked' : ''}">${isLiked ? '❤️' : '🤍'}</span></button>
                        </div>
                    </div>
                    ${availabilityHTML}
                    ${storyHTML}
                    <p class="product-description">${product.description || product.rich_description || ''}</p>
                    <button onclick="handlePortfolioCheckout()" class="buy-btn book-btn"><span class="btn-text">${servicePackages.length > 0 ? 'View Packages & Book' : 'Book Now'}</span><span class="btn-arrow">→</span></button>
                </div>
            </div>
            ${generateTestimonialsHTML(product.testimonials, 'Client Reviews')}
        </div>
    `;
}

// ===========================================
// TEMPLATE 3: VISUAL MENU (Food/Restaurant)
// ===========================================
function renderVisualMenuTemplate(product) {
    const stories = getStoryMedia(product);
    const isLiked = isProductLiked(product.id);
    
    // Parse gallery_images and fallback to productImages (from additional_images)
    let galleryImages = [];
    try {
        const parsed = Array.isArray(product.gallery_images) ? product.gallery_images : JSON.parse(product.gallery_images || '[]');
        galleryImages = parsed.filter(url => url?.trim());
    } catch (e) {}
    if (galleryImages.length === 0) galleryImages = productImages;
    productImages = galleryImages;
    
    const hasMultipleImages = productImages.length > 1;
    
    let dietaryTags = [];
    try { dietaryTags = Array.isArray(product.dietary_tags) ? product.dietary_tags : JSON.parse(product.dietary_tags || '[]'); } catch (e) {}
    
    const main = document.getElementById('main');
    const backButton = storeData.products.length > 1 ? `<button onclick="backToCollections()" class="back-btn">← Back to Menu</button>` : '';
    
    const galleryHTML = `
        <div class="product-gallery menu-gallery">
            <div class="main-image-container" onclick="handleImageDoubleTap(${product.id}, event)">
                ${hasMultipleImages ? `<button class="gallery-nav prev" onclick="prevImage()">‹</button>` : ''}
                ${productImages[0] ? `<img id="mainProductImage" src="${productImages[0]}" alt="${product.name}" class="main-gallery-image">` : '<div class="image-placeholder">🍽️</div>'}
                ${hasMultipleImages ? `<button class="gallery-nav next" onclick="nextImage()">›</button>` : ''}
            </div>
            ${hasMultipleImages ? `<div class="thumbnail-strip">${productImages.map((img, idx) => `<div class="thumbnail ${idx === 0 ? 'active' : ''}" onclick="setMainImage(${idx})"><img src="${img}" alt="View ${idx + 1}"></div>`).join('')}</div>` : ''}
        </div>
    `;
    
    const dietaryHTML = dietaryTags.length > 0 ? `
        <div class="dietary-tags">
            ${dietaryTags.map(tag => {
                const icons = { 'vegetarian': '🥬', 'vegan': '🌱', 'spicy': '🌶️', 'hot': '🔥', 'gluten-free': '🌾', 'halal': '☪️', 'contains-nuts': '🥜', 'dairy-free': '🥛', 'nut-free': '🥜', 'organic': '🌿' };
                return `<span class="dietary-tag">${icons[tag.toLowerCase()] || '•'} ${tag}</span>`;
            }).join('')}
        </div>
    ` : '';
    
    const storyHTML = stories.length > 0 ? `
        <div class="story-section">
            <p class="story-title">${product.story_title || 'The Dish'}</p>
            <div class="story-circles">${stories.map((story, idx) => `<div class="story-circle" onclick="openStory(${idx})"><div class="story-ring"><img src="${story.thumbnail || story.url}" alt="Story ${idx + 1}"></div></div>`).join('')}</div>
        </div>
    ` : '';
    
    const metaHTML = (product.prep_time || product.calories) ? `
        <div class="food-meta">
            ${product.prep_time ? `<span class="meta-item">⏱️ ${product.prep_time} min</span>` : ''}
            ${product.calories ? `<span class="meta-item">🔥 ${product.calories} cal</span>` : ''}
        </div>
    ` : '';
    
    const ingredientsHTML = product.ingredients ? `<div class="ingredients-section"><h4 class="ingredients-title">Ingredients</h4><p class="ingredients-list">${product.ingredients}</p></div>` : '';
    
    main.innerHTML = `
        ${backButton}
        <div class="product-container template-menu">
            <div class="product-card food-card">
                ${galleryHTML}
                <div class="product-info">
                    <h2 class="product-name">${product.name}</h2>
                    <div class="price-row">
                        <div class="price"><span class="currency">KES</span> <span id="displayPrice">${parseInt(product.price).toLocaleString()}</span></div>
                        <div class="social-actions">
                            <button class="social-btn share-btn" onclick="shareProduct(${product.id}, event)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></button>
                            <button id="like-btn-${product.id}" class="social-btn like-btn" onclick="toggleLike(${product.id}, event)"><span class="heart-icon ${isLiked ? 'liked' : ''}">${isLiked ? '❤️' : '🤍'}</span></button>
                        </div>
                    </div>
                    ${dietaryHTML}
                    ${storyHTML}
                    <p class="product-description">${product.description || ''}</p>
                    ${metaHTML}
                    ${ingredientsHTML}
                    <div class="quantity-section">
                        <label class="quantity-label">Quantity</label>
                        <div class="quantity-controls">
                            <button onclick="decreaseQuantity()" id="decreaseBtn" class="quantity-btn" ${quantity <= 1 ? 'disabled' : ''}>−</button>
                            <span class="quantity-value" id="quantityDisplay">1</span>
                            <button onclick="increaseQuantity()" id="increaseBtn" class="quantity-btn">+</button>
                        </div>
                    </div>
                    <div class="total-section"><span class="total-label">Total</span><div class="total-price">KES <span id="totalPrice">${parseInt(product.price).toLocaleString()}</span></div></div>
                    <button onclick="openCheckout()" class="buy-btn order-btn"><span class="btn-text">Add to Order</span><span class="btn-arrow">→</span></button>
                </div>
            </div>
            ${generateTestimonialsHTML(product.testimonials, 'Customer Reviews')}
        </div>
    `;
}

// ===========================================
// TEMPLATE 4: DEEP DIVE EVALUATOR
// ===========================================
function renderDeepDiveTemplate(product) {
    const stories = getStoryMedia(product);
    const isLiked = isProductLiked(product.id);
    
    let specifications = {};
    try { specifications = typeof product.specifications === 'object' ? product.specifications : JSON.parse(product.specifications || '{}'); } catch (e) {}
    
    let trustBadges = [];
    try { trustBadges = Array.isArray(product.trust_badges) ? product.trust_badges : JSON.parse(product.trust_badges || '[]'); } catch (e) {}
    
    let galleryImages = [];
    try {
        const parsed = Array.isArray(product.gallery_images) ? product.gallery_images : JSON.parse(product.gallery_images || '[]');
        galleryImages = parsed.filter(url => url?.trim());
    } catch (e) {}
    if (galleryImages.length === 0) galleryImages = productImages;
    productImages = galleryImages;
    
    const main = document.getElementById('main');
    const backButton = storeData.products.length > 1 ? `<button onclick="backToCollections()" class="back-btn">← Back to All Products</button>` : '';
    const hasMultipleImages = productImages.length > 1;
    
    const trustHTML = trustBadges.length > 0 ? `<div class="trust-badges-bar">${trustBadges.map(badge => `<span class="trust-badge">${badge.icon || '✓'} ${badge.text}</span>`).join('')}</div>` : '';
    
    const galleryHTML = `
        <div class="product-gallery deep-dive-gallery">
            <div class="main-image-container" onclick="handleImageDoubleTap(${product.id}, event)">
                ${hasMultipleImages ? `<button class="gallery-nav prev" onclick="prevImage()">‹</button>` : ''}
                ${productImages[0] ? `<img id="mainProductImage" src="${productImages[0]}" alt="${product.name}" class="main-gallery-image">` : '<div class="image-placeholder">📸</div>'}
                ${hasMultipleImages ? `<button class="gallery-nav next" onclick="nextImage()">›</button>` : ''}
            </div>
            ${hasMultipleImages ? `<div class="thumbnail-strip">${productImages.map((img, idx) => `<div class="thumbnail ${idx === 0 ? 'active' : ''}" onclick="setMainImage(${idx})"><img src="${img}" alt="View ${idx + 1}"></div>`).join('')}</div>` : ''}
        </div>
    `;
    
    const specsHTML = Object.keys(specifications).length > 0 ? `
        <div class="specifications-section">
            <h3 class="specs-title">Specifications</h3>
            <table class="specs-table">${Object.entries(specifications).map(([key, value]) => `<tr><td class="spec-key">${key}</td><td class="spec-value">${value}</td></tr>`).join('')}</table>
        </div>
    ` : '';
    
    const warrantyHTML = `
        <div class="guarantees-section">
            ${product.warranty_info ? `<div class="guarantee-item"><span class="guarantee-icon">🛡️</span><div class="guarantee-content"><h4>Warranty</h4><p>${product.warranty_info}</p></div></div>` : ''}
            ${product.return_policy_days ? `<div class="guarantee-item"><span class="guarantee-icon">↩️</span><div class="guarantee-content"><h4>${product.return_policy_days}-Day Returns</h4><p>Not satisfied? Return within ${product.return_policy_days} days.</p></div></div>` : ''}
        </div>
    `;
    
    const storyHTML = stories.length > 0 ? `
        <div class="story-section">
            <p class="story-title">${product.story_title || 'Customer Reviews'}</p>
            <div class="story-circles">${stories.map((story, idx) => `<div class="story-circle" onclick="openStory(${idx})"><div class="story-ring"><img src="${story.thumbnail || story.url}" alt="Review ${idx + 1}"></div></div>`).join('')}</div>
        </div>
    ` : '';
    
    main.innerHTML = `
        ${backButton}
        <div class="product-container template-deep-dive">
            <div class="product-card">
                ${galleryHTML}
                <div class="product-info">
                    <h2 class="product-name">${product.name}</h2>
                    <div class="price-row">
                        <div class="price"><span class="currency">KES</span> <span id="displayPrice">${parseInt(product.price).toLocaleString()}</span></div>
                        <div class="social-actions">
                            <button class="social-btn share-btn" onclick="shareProduct(${product.id}, event)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></button>
                            <button id="like-btn-${product.id}" class="social-btn like-btn" onclick="toggleLike(${product.id}, event)"><span class="heart-icon ${isLiked ? 'liked' : ''}">${isLiked ? '❤️' : '🤍'}</span></button>
                        </div>
                    </div>
                    ${trustHTML}
                    ${storyHTML}
                    <p class="product-description">${product.rich_description || product.description || ''}</p>
                    ${specsHTML}
                    ${warrantyHTML}
                    <div class="quantity-section">
                        <label class="quantity-label">Quantity</label>
                        <div class="quantity-controls">
                            <button onclick="decreaseQuantity()" id="decreaseBtn" class="quantity-btn" ${quantity <= 1 ? 'disabled' : ''}>−</button>
                            <span class="quantity-value" id="quantityDisplay">1</span>
                            <button onclick="increaseQuantity()" id="increaseBtn" class="quantity-btn">+</button>
                        </div>
                    </div>
                    <div class="total-section"><span class="total-label">Total</span><div class="total-price">KES <span id="totalPrice">${parseInt(product.price).toLocaleString()}</span></div></div>
                    <button onclick="openCheckout()" class="buy-btn invest-btn"><span class="btn-text">Secure Your Order</span><span class="btn-arrow">→</span></button>
                </div>
            </div>
            ${generateTestimonialsHTML(product.testimonials, 'Customer Reviews')}
        </div>
    `;
    
    if (hasMultipleImages) setTimeout(() => setupSwipeGestures(), 100);
}

// ===========================================
// TEMPLATE 5: EVENT LANDING
// ===========================================
function renderEventLandingTemplate(product) {
    const stories = getStoryMedia(product);
    const isLiked = isProductLiked(product.id);
    
    let galleryImages = [];
    try {
        const parsed = Array.isArray(product.gallery_images) ? product.gallery_images : JSON.parse(product.gallery_images || '[]');
        galleryImages = parsed.filter(url => url?.trim());
    } catch (e) {}
    if (galleryImages.length === 0) galleryImages = productImages;
    productImages = galleryImages;
    
    const main = document.getElementById('main');
    const backButton = storeData.products.length > 1 ? `<button onclick="backToCollections()" class="back-btn">← Back to All Events</button>` : '';
    
    let eventDateDisplay = '';
    let countdown = '';
    if (product.event_date) {
        const eventDate = new Date(product.event_date);
        eventDateDisplay = eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const diff = eventDate - new Date();
        if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            countdown = `<div class="event-countdown"><div class="countdown-item"><span class="countdown-value">${days}</span><span class="countdown-label">Days</span></div><div class="countdown-item"><span class="countdown-value">${hours}</span><span class="countdown-label">Hours</span></div></div>`;
        }
    }
    
    let speakers = [];
    try { speakers = Array.isArray(product.speakers) ? product.speakers : JSON.parse(product.speakers || '[]'); } catch (e) {}
    
    const speakersHTML = speakers.length > 0 ? `
        <div class="speakers-section">
            <h3 class="speakers-title">Featured Speakers</h3>
            <div class="speakers-grid">${speakers.map(s => `<div class="speaker-card">${s.photo ? `<img src="${s.photo}" class="speaker-photo">` : '<div class="speaker-placeholder">👤</div>'}<h4 class="speaker-name">${s.name}</h4>${s.title ? `<p class="speaker-title">${s.title}</p>` : ''}</div>`).join('')}</div>
        </div>
    ` : '';
    
    const storyHTML = stories.length > 0 ? `
        <div class="story-section">
            <p class="story-title">${product.story_title || 'Event Highlights'}</p>
            <div class="story-circles">${stories.map((story, idx) => `<div class="story-circle" onclick="openStory(${idx})"><div class="story-ring"><img src="${story.thumbnail || story.url}" alt="Highlight ${idx + 1}"></div></div>`).join('')}</div>
        </div>
    ` : '';
    
    main.innerHTML = `
        ${backButton}
        <div class="product-container template-event">
            <div class="event-hero">${productImages[0] ? `<img src="${productImages[0]}" alt="${product.name}" class="event-banner">` : '<div class="event-placeholder">🎪</div>'}<div class="event-overlay"><span class="event-badge">📅 Event</span></div></div>
            <div class="product-card event-card">
                <div class="product-info">
                    <h2 class="product-name event-title">${product.name}</h2>
                    <div class="price-row">
                        <div class="price"><span class="currency">KES</span> <span id="displayPrice">${parseInt(product.price).toLocaleString()}</span></div>
                        <div class="social-actions">
                            <button class="social-btn share-btn" onclick="shareProduct(${product.id}, event)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></button>
                            <button id="like-btn-${product.id}" class="social-btn like-btn" onclick="toggleLike(${product.id}, event)"><span class="heart-icon ${isLiked ? 'liked' : ''}">${isLiked ? '❤️' : '🤍'}</span></button>
                        </div>
                    </div>
                    <div class="event-details">
                        ${eventDateDisplay ? `<div class="event-detail-item"><span class="detail-icon">📅</span><span class="detail-text">${eventDateDisplay}</span></div>` : ''}
                        ${product.event_location ? `<div class="event-detail-item"><span class="detail-icon">📍</span><span class="detail-text">${product.event_location}</span></div>` : ''}
                    </div>
                    ${storyHTML}
                    ${countdown}
                    <p class="product-description event-description">${product.rich_description || product.description || ''}</p>
                    ${speakersHTML}
                    <div class="quantity-section">
                        <label class="quantity-label">Number of Tickets</label>
                        <div class="quantity-controls">
                            <button onclick="decreaseQuantity()" id="decreaseBtn" class="quantity-btn" ${quantity <= 1 ? 'disabled' : ''}>−</button>
                            <span class="quantity-value" id="quantityDisplay">1</span>
                            <button onclick="increaseQuantity()" id="increaseBtn" class="quantity-btn">+</button>
                        </div>
                    </div>
                    <div class="total-section"><span class="total-label">Total</span><div class="total-price">KES <span id="totalPrice">${parseInt(product.price).toLocaleString()}</span></div></div>
                    <button onclick="openCheckout()" class="buy-btn register-btn"><span class="btn-text">Register Now</span><span class="btn-arrow">→</span></button>
                </div>
            </div>
            ${generateTestimonialsHTML(product.testimonials, 'Attendee Reviews')}
        </div>
    `;
}

// ===========================================
// NAVIGATION
// ===========================================
function backToCollections() {
    const url = new URL(window.location);
    url.searchParams.delete('product');
    window.history.pushState({}, '', url);
    
    const heroSection = document.getElementById('heroSection');
    if (heroSection) heroSection.classList.remove('header-compact');
    
    renderStore();
    applyHeaderBackground();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===========================================
// QUANTITY CONTROLS
// ===========================================
function increaseQuantity() {
    const maxStock = currentProduct.stock_quantity || 1000;
    if (quantity < maxStock) { quantity++; updateQuantityDisplay(); }
}

function decreaseQuantity() {
    if (quantity > 1) { quantity--; updateQuantityDisplay(); }
}

function updateQuantityDisplay() {
    document.getElementById('quantityDisplay').textContent = quantity;
    document.getElementById('totalPrice').textContent = parseInt(currentProduct.price * quantity).toLocaleString();
    const decreaseBtn = document.getElementById('decreaseBtn');
    const increaseBtn = document.getElementById('increaseBtn');
    if (decreaseBtn) decreaseBtn.disabled = quantity <= 1;
    if (increaseBtn) increaseBtn.disabled = quantity >= (currentProduct.stock_quantity || 1000);
}

// ===========================================
// PORTFOLIO CHECKOUT
// ===========================================
let selectedPackageIndex = -1;

function handlePortfolioCheckout() {
    const packages = window.currentServicePackages || [];
    packages.length > 0 ? showPackageSelection(packages) : openCheckout();
}

function showPackageSelection(packages) {
    const overlay = document.createElement('div');
    overlay.className = 'package-overlay';
    overlay.id = 'packageOverlay';
    
    overlay.innerHTML = `
        <div class="package-modal">
            <button class="package-modal-close" onclick="closePackageSelection()">✕</button>
            <h2 class="package-modal-title">Choose Your Package</h2>
            <p class="package-modal-subtitle">Select the package that best fits your needs</p>
            <div class="package-options">
                ${packages.map((pkg, idx) => `
                    <div class="package-option ${idx === 0 ? 'recommended' : ''}" onclick="selectPackageOption(${idx})">
                        ${idx === 0 ? '<span class="package-badge">Most Popular</span>' : ''}
                        <h3 class="package-option-name">${pkg.name || 'Package ' + (idx + 1)}</h3>
                        <div class="package-option-price">KES ${parseInt(pkg.price || currentProduct.price).toLocaleString()}</div>
                        ${pkg.description ? `<p class="package-option-desc">${pkg.description}</p>` : ''}
                        ${pkg.features?.length > 0 ? `<ul class="package-option-features">${pkg.features.map(f => `<li>✓ ${f}</li>`).join('')}</ul>` : ''}
                        <button class="package-option-btn">Select This Package</button>
                    </div>
                `).join('')}
            </div>
            <button class="package-skip-btn" onclick="skipPackageSelection()">Or continue without selecting a package →</button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => overlay.classList.add('active'));
}

function selectPackageOption(index) {
    const packages = window.currentServicePackages || [];
    if (packages[index]) {
        selectedPackageIndex = index;
        currentProduct.selectedPackage = packages[index];
        currentProduct.selectedPrice = parseInt(packages[index].price || currentProduct.price);
    }
    closePackageSelection();
    openCheckout();
}

function skipPackageSelection() {
    selectedPackageIndex = -1;
    currentProduct.selectedPackage = null;
    currentProduct.selectedPrice = currentProduct.price;
    closePackageSelection();
    openCheckout();
}

function closePackageSelection() {
    const overlay = document.getElementById('packageOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
        document.body.style.overflow = '';
    }
}

// ===========================================
// CHECKOUT FLOW
// ===========================================
function openCheckout() {
    const price = currentProduct.selectedPrice || currentProduct.price;
    const packageName = currentProduct.selectedPackage ? ` (${currentProduct.selectedPackage.name})` : '';
    
    document.getElementById('summaryProductName').textContent = currentProduct.name + packageName;
    document.getElementById('summaryQuantity').textContent = quantity;
    document.getElementById('summaryUnitPrice').textContent = parseInt(price).toLocaleString();
    document.getElementById('summaryTotal').textContent = parseInt(price * quantity).toLocaleString();
    
    document.getElementById('modalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    goToStep1();
}

function closeCheckout() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.body.style.overflow = '';
    selectedPaymentMethod = null;
    resetCheckout();
}

function resetCheckout() {
    setTimeout(() => {
        document.getElementById('mpesaOption')?.classList.remove('selected');
        document.getElementById('codOption')?.classList.remove('selected');
        document.getElementById('completeOrderBtn')?.classList.remove('show');
        document.getElementById('ctaHelper')?.classList.remove('show');
        document.getElementById('customerForm')?.reset();
    }, 300);
}

function closeOnOverlay(event) {
    if (event.target === document.getElementById('modalOverlay')) closeCheckout();
}

function hideAllSteps() {
    document.querySelectorAll('.checkout-step').forEach(step => step.classList.remove('active'));
}

function goToStep1() { hideAllSteps(); document.getElementById('step1').classList.add('active'); }
function goToStep2() { hideAllSteps(); document.getElementById('step2').classList.add('active'); }

function goToStep3() {
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const location = document.getElementById('customerLocation').value.trim();

    if (!name || !phone || !location) { alert('Please fill in all fields'); return; }
    if (phone.length < 10) { alert('Please enter a valid phone number'); return; }

    hideAllSteps();
    document.getElementById('step3').classList.add('active');
}

function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    
    document.getElementById('mpesaOption').classList.remove('selected');
    document.getElementById('codOption').classList.remove('selected');
    
    const ctaButton = document.getElementById('ctaButtonText');
    const helperText = document.getElementById('paymentMethodText');
    
    if (method === 'mpesa') {
        document.getElementById('mpesaOption').classList.add('selected');
        ctaButton.textContent = '✓ Complete Order with M-Pesa';
        helperText.textContent = 'Check your phone for M-Pesa prompt';
    } else {
        document.getElementById('codOption').classList.add('selected');
        ctaButton.textContent = '✓ Complete Order - Pay on Delivery';
        helperText.textContent = 'Prepare exact cash for delivery';
    }
    
    document.getElementById('completeOrderBtn').classList.add('show');
    document.getElementById('ctaHelper').classList.add('show');
}

// ===========================================
// ORDER SUBMISSION
// ===========================================
async function completeOrder() {
    if (!selectedPaymentMethod) { alert('Please select a payment method'); return; }

    showLoading();

    const orderData = {
        subdomain: SUBDOMAIN,
        productId: currentProduct.id,
        product: currentProduct.name,
        quantity: quantity,
        price: parseFloat(currentProduct.price),
        total: parseFloat(currentProduct.price) * quantity,
        customer: {
            name: document.getElementById('customerName').value.trim(),
            phone: document.getElementById('customerPhone').value.trim(),
            location: document.getElementById('customerLocation').value.trim()
        },
        paymentMethod: selectedPaymentMethod,
        timestamp: new Date().toISOString()
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (result.success) {
            document.getElementById('orderNumber').textContent = result.orderNumber;
            const total = (orderData.price * orderData.quantity).toLocaleString();
            const message = selectedPaymentMethod === 'mpesa' 
                ? `🎉 Order confirmed!\n\n📱 Check ${orderData.customer.phone} for M-Pesa prompt to pay KES ${total}.\n\n💬 WhatsApp confirmation coming soon.`
                : `🎉 Order confirmed!\n\n💵 Prepare KES ${total} for payment on delivery.\n\n💬 WhatsApp confirmation coming soon.`;
            document.getElementById('successMessage').textContent = message;
            showSuccess();
        } else {
            alert(result.error || 'Order failed. Please try again.');
            goToStep3();
        }
    } catch (error) {
        console.error('Order error:', error);
        alert('Failed to place order. Please try again.');
        goToStep3();
    }
}

function showLoading() { hideAllSteps(); document.getElementById('loadingStep').classList.add('active'); }
function showSuccess() { hideAllSteps(); document.getElementById('successStep').classList.add('active'); }

// ===========================================
// BROWSER NAVIGATION
// ===========================================
window.addEventListener('popstate', () => {
    const productId = new URLSearchParams(window.location.search).get('product');
    if (productId) {
        const product = storeData?.products?.find(p => p.id === parseInt(productId));
        if (product) renderSingleProduct(product);
    } else {
        renderStore();
    }
});

// ===========================================
// START & EXPOSE
// ===========================================
init();

window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.openCheckout = openCheckout;
window.closeCheckout = closeCheckout;
window.closeOnOverlay = closeOnOverlay;
window.goToStep1 = goToStep1;
window.goToStep2 = goToStep2;
window.goToStep3 = goToStep3;
window.selectPaymentMethod = selectPaymentMethod;
window.completeOrder = completeOrder;
window.viewProduct = viewProduct;
window.backToCollections = backToCollections;
window.setMainImage = setMainImage;
window.nextImage = nextImage;
window.prevImage = prevImage;
window.toggleLike = toggleLike;
window.shareProduct = shareProduct;
window.openStory = openStory;
window.closeStory = closeStory;
window.nextStory = nextStory;
window.prevStory = prevStory;
window.showPolicy = showPolicy;
window.closePolicy = closePolicy;
window.handlePortfolioCheckout = handlePortfolioCheckout;
window.selectPackageOption = selectPackageOption;
window.skipPackageSelection = skipPackageSelection;
window.closePackageSelection = closePackageSelection;
