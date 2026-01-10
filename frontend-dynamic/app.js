// ===========================================
// LANDING KIT STORE - Configuration
// ===========================================
const getApiUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return 'http://localhost:3000';
};

const API_BASE_URL = getApiUrl();
console.log('📡 Store API URL:', API_BASE_URL);

// ===========================================
// SUBDOMAIN DETECTION
// ===========================================
const urlParams = new URLSearchParams(window.location.search);

const getSubdomain = () => {
    const paramSubdomain = urlParams.get('subdomain');
    if (paramSubdomain) return paramSubdomain;
    
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    
    if (parts.length > 2 && parts[0] !== 'www') {
        return parts[0];
    }
    
    return 'testfashion';
};

const SUBDOMAIN = getSubdomain();

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
// INITIALIZATION
// ===========================================
async function init() {
    console.log('🔍 Loading store for subdomain:', SUBDOMAIN);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/public/store/${SUBDOMAIN}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Store not found');
        }

        storeData = await response.json();
        console.log('✅ Store loaded:', storeData.store?.logoText || 'Unknown');
        
        applyTheme(storeData.store?.theme);
        // Note: applyHeaderBackground() moved to after renderStore() creates the header
        
        if (storeData.store?.fontFamily) {
            document.documentElement.style.setProperty('--font-family', storeData.store.fontFamily, 'important');
            loadGoogleFont(storeData.store.fontFamily);
        }
        
        const productId = urlParams.get('product');
        
        if (productId) {
            const product = storeData.products?.find(p => p.id === parseInt(productId));
            if (product) {
                renderSingleProduct(product);
            } else {
                renderStore();
            }
        } else {
            renderStore();
        }
        
        // Apply header background AFTER the header is rendered
        applyHeaderBackground();
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        
    } catch (error) {
        console.error('❌ Failed to load store:', error);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'flex';
    }
}

// ===========================================
// THEME APPLICATION
// ===========================================
function applyTheme(theme) {
    if (!theme) {
        console.log('⚠️ No theme provided, using defaults');
        return;
    }
    
    console.log('🎨 Applying theme:', theme.display_name || theme.name);
    
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
    
    if (storeData?.store) {
        document.title = storeData.store.logoText || 'Store';
    }
}

function applyHeaderBackground() {
    const header = document.querySelector('.hero-section');
    if (!header || !storeData?.store) {
        console.log('⚠️ applyHeaderBackground: No hero-section or store data');
        return;
    }
    
    const bgUrl = storeData.store.headerBgUrl;
    console.log('🖼️ Header background URL:', bgUrl);
    
    if (bgUrl && bgUrl.trim()) {
        // Use !important via cssText to override the gradient
        header.style.cssText += `
            background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${bgUrl}') !important;
            background-size: cover !important;
            background-position: center !important;
        `;
        header.classList.add('has-bg-image');
        console.log('✅ Header background applied');
    }
}

function loadGoogleFont(fontName) {
    const systemFonts = ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont'];
    if (systemFonts.includes(fontName)) return;
    
    const existingLink = document.querySelector(`link[href*="${fontName.replace(' ', '+')}"]`);
    if (existingLink) return;
    
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}:wght@400;500;600;700;800&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
}

// ===========================================
// HERO SECTION RENDERING (Phase 2)
// ===========================================
function renderHeroSection() {
    const { store, hero, testimonial } = storeData;
    
    // Apply store mode (dark/light) - future feature
    if (store?.mode === 'light') {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
    
    // Hero section uses the theme gradient from CSS variables
    const heroSection = document.getElementById('heroSection');
    if (heroSection) {
        // Background is controlled by CSS using --gradient-primary
        heroSection.style.background = 'var(--gradient-primary)';
    }
    
    // Hero Photo
    const heroPhoto = document.getElementById('heroPhoto');
    if (heroPhoto) {
        if (hero?.photoUrl) {
            heroPhoto.innerHTML = `<img src="${hero.photoUrl}" alt="${hero.title || 'Store'}" class="hero-photo-img">`;
            heroPhoto.style.display = 'flex';
        } else if (store?.logoText) {
            heroPhoto.textContent = store.logoText.charAt(0).toUpperCase();
            heroPhoto.style.display = 'flex';
        } else {
            heroPhoto.style.display = 'none';
        }
    }
    
    // Hero Title & Subtitle
    const heroTitle = document.getElementById('heroTitle');
    const heroSubtitle = document.getElementById('heroSubtitle');
    
    if (heroTitle) {
        heroTitle.textContent = hero?.title || store?.logoText || 'Welcome';
    }
    if (heroSubtitle) {
        heroSubtitle.textContent = hero?.subtitle || store?.tagline || '';
        heroSubtitle.style.display = (hero?.subtitle || store?.tagline) ? 'block' : 'none';
    }
    
    // Hero CTA Buttons
    const heroCta = document.getElementById('heroCta');
    if (heroCta && hero) {
        let ctaHtml = '';
        
        if (hero.ctaPrimaryText) {
            const primaryLink = hero.ctaPrimaryLink || '#main';
            ctaHtml += `<a href="${primaryLink}" class="hero-btn primary">${hero.ctaPrimaryText}</a>`;
        }
        
        if (hero.ctaSecondaryText) {
            const secondaryLink = hero.ctaSecondaryLink || '#';
            ctaHtml += `<a href="${secondaryLink}" class="hero-btn secondary">${hero.ctaSecondaryText}</a>`;
        }
        
        heroCta.innerHTML = ctaHtml;
        heroCta.style.display = ctaHtml ? 'flex' : 'none';
    }
    
    // Featured Testimonial
    const testimonialSection = document.getElementById('featuredTestimonial');
    if (testimonialSection && testimonial && testimonial.text) {
        document.getElementById('testimonialText').textContent = `"${testimonial.text}"`;
        document.getElementById('testimonialAuthor').textContent = testimonial.author + (testimonial.detail ? ` - ${testimonial.detail}` : '');
        testimonialSection.style.display = 'block';
    } else if (testimonialSection) {
        testimonialSection.style.display = 'none';
    }
}

// ===========================================
// IMAGE GALLERY FUNCTIONS
// ===========================================
function getProductImages(product) {
    const images = [];
    if (product.image_url) images.push(product.image_url);
    
    try {
        const additional = JSON.parse(product.additional_images || '[]');
        if (Array.isArray(additional)) {
            additional.forEach(url => {
                if (url && url.trim()) images.push(url.trim());
            });
        }
    } catch (e) {}
    
    return images;
}

function getStoryMedia(product) {
    try {
        const stories = JSON.parse(product.story_media || '[]');
        return Array.isArray(stories) ? stories.slice(0, 4) : [];
    } catch (e) {
        return [];
    }
}

function setMainImage(index) {
    if (index < 0 || index >= productImages.length) return;
    
    currentImageIndex = index;
    const mainImg = document.getElementById('mainProductImage');
    if (mainImg) {
        mainImg.src = productImages[index];
    }
    
    // Update dot indicators
    document.querySelectorAll('.gallery-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
    
    // Update counter
    const counter = document.querySelector('.image-counter');
    if (counter) {
        counter.textContent = `${index + 1} / ${productImages.length}`;
    }
}

function nextImage() {
    if (productImages.length <= 1) return;
    const next = (currentImageIndex + 1) % productImages.length;
    setMainImage(next);
}

function prevImage() {
    if (productImages.length <= 1) return;
    const prev = (currentImageIndex - 1 + productImages.length) % productImages.length;
    setMainImage(prev);
}

// ===========================================
// LIKE & SHARE FUNCTIONS
// ===========================================
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
    const shareData = {
        title: product.name,
        text: `Check out ${product.name} - KES ${parseInt(product.price).toLocaleString()}`,
        url: shareUrl
    };
    
    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            if (err.name !== 'AbortError') {
                copyToClipboard(shareUrl);
            }
        }
    } else {
        copyToClipboard(shareUrl);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Link copied to clipboard!');
    }).catch(() => {
        showToast('Could not copy link');
    });
}

function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// ===========================================
// STORY MODAL FUNCTIONS
// ===========================================
function openStory(index) {
    const stories = getStoryMedia(currentProduct);
    if (!stories.length) return;
    
    const story = stories[index];
    const modal = document.getElementById('storyModal');
    const content = document.getElementById('storyContent');
    
    if (story.type === 'video') {
        content.innerHTML = `<video src="${story.url}" controls autoplay playsinline class="story-media"></video>`;
    } else {
        content.innerHTML = `<img src="${story.url}" alt="Story" class="story-media">`;
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeStory() {
    const modal = document.getElementById('storyModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    const video = modal.querySelector('video');
    if (video) video.pause();
}

// ===========================================
// POLICY MODAL FUNCTIONS
// ===========================================
function showPolicy(type) {
    if (!currentProduct) return;
    
    const titles = {
        privacy: 'Privacy Policy',
        terms: 'Terms of Service',
        refund: 'Refund Policy'
    };
    
    // Check store-level policies first, then product-level as fallback
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
    
    // Render the new hero section (Phase 2)
    renderHeroSection();
    
    const main = document.getElementById('main');
    
    if (!products || products.length === 0) {
        main.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h2>No Products Available</h2>
                <p>Check back soon!</p>
            </div>
        `;
        return;
    }
    
    if (products.length === 1) {
        renderSingleProduct(products[0]);
    } else {
        renderCollectionsGrid(products);
    }
}

function renderCollectionsGrid(products) {
    const main = document.getElementById('main');
    
    // Template badge labels
    const templateLabels = {
        'quick-decision': '⚡ Quick Buy',
        'portfolio-booking': '📅 Book Now',
        'visual-menu': '🍽️ Menu',
        'deep-dive': '🔍 Details',
        'event-landing': '🎪 Event'
    };
    
    main.innerHTML = `
        <div class="collections-container">
            <div class="collections-header">
                <h2>Shop All Products</h2>
                <p>${products.length} ${products.length === 1 ? 'Product' : 'Products'} Available</p>
            </div>
            <div class="collections-grid">
                ${products.map(product => {
                    const imgCount = getProductImages(product).length;
                    const template = product.template_type || 'quick-decision';
                    const templateLabel = templateLabels[template] || '';
                    return `
                    <div class="collection-card" onclick="viewProduct(${product.id})">
                        <div class="collection-image">
                            ${product.image_url ? 
                                `<img src="${product.image_url}" alt="${product.name}" onerror="this.parentElement.innerHTML='<div class=\\'image-placeholder\\'>📸</div>'">` :
                                '<div class="image-placeholder">📸</div>'
                            }
                            ${imgCount > 1 ? `<span class="image-count-badge">📷 ${imgCount}</span>` : ''}
                            ${templateLabel ? `<span class="template-badge ${template}">${templateLabel}</span>` : ''}
                        </div>
                        <div class="collection-content">
                            <h3 class="collection-name">${product.name}</h3>
                            <p class="collection-description">${product.description ? (product.description.substring(0, 60) + (product.description.length > 60 ? '...' : '')) : 'No description'}</p>
                            <div class="collection-footer">
                                <p class="collection-price">KES ${parseInt(product.price).toLocaleString()}</p>
                                <button class="collection-btn">View Details →</button>
                            </div>
                        </div>
                    </div>
                `}).join('')}
            </div>
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
    
    // Route to appropriate template renderer based on template_type
    const templateType = product.template_type || 'quick-decision';
    
    switch(templateType) {
        case 'portfolio-booking':
            renderPortfolioBookingTemplate(product);
            break;
        case 'visual-menu':
            renderVisualMenuTemplate(product);
            break;
        case 'deep-dive':
            renderDeepDiveTemplate(product);
            break;
        case 'event-landing':
            renderEventLandingTemplate(product);
            break;
        case 'catalog-nav':
            // Catalog navigator is a homepage, not a product template
            renderQuickDecisionTemplate(product);
            break;
        default:
            renderQuickDecisionTemplate(product);
    }
}

// ===========================================
// TEMPLATE 1: QUICK DECISION (Default)
// ===========================================
function renderQuickDecisionTemplate(product) {
    const stories = getStoryMedia(product);
    const isLiked = isProductLiked(product.id);
    
    const main = document.getElementById('main');
    
    const backButton = storeData.products.length > 1 ? `
        <button onclick="backToCollections()" class="back-btn">
            ← Back to All Products
        </button>
    ` : '';
    
    const hasMultipleImages = productImages.length > 1;
    
    // Gallery with dots instead of thumbnails
    const galleryHTML = `
        <div class="product-gallery">
            <div class="main-image-container">
                ${hasMultipleImages ? `<button class="gallery-nav prev" onclick="prevImage()">‹</button>` : ''}
                ${productImages[0] ? 
                    `<img id="mainProductImage" src="${productImages[0]}" alt="${product.name}" class="main-gallery-image" onerror="this.src=''; this.parentElement.querySelector('.image-placeholder')?.classList.remove('hidden')">` :
                    ''
                }
                <div class="image-placeholder ${productImages[0] ? 'hidden' : ''}">📸</div>
                ${hasMultipleImages ? `<button class="gallery-nav next" onclick="nextImage()">›</button>` : ''}
            </div>
            ${hasMultipleImages ? `
                <div class="gallery-dots">
                    ${productImages.map((_, idx) => `
                        <span class="gallery-dot ${idx === 0 ? 'active' : ''}" onclick="setMainImage(${idx})"></span>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
    
    // Story circles section
    const storyHTML = stories.length > 0 ? `
        <div class="story-section">
            ${product.story_title ? `<p class="story-title">${product.story_title}</p>` : ''}
            <div class="story-circles">
                ${stories.map((story, idx) => `
                    <div class="story-circle" onclick="openStory(${idx})">
                        <div class="story-ring">
                            <img src="${story.thumbnail || story.url}" alt="Story ${idx + 1}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>▶</text></svg>'">
                        </div>
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
                    <div class="product-header">
                        <h2 class="product-name">${product.name}</h2>
                        <div class="social-actions">
                            <button class="social-btn share-btn" onclick="shareProduct(${product.id}, event)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                            </button>
                            <button id="like-btn-${product.id}" class="social-btn like-btn" onclick="toggleLike(${product.id}, event)">
                                <span class="heart-icon ${isLiked ? 'liked' : ''}">${isLiked ? '❤️' : '🤍'}</span>
                            </button>
                        </div>
                    </div>
                    <p class="product-description">${product.description || ''}</p>
                    
                    ${storyHTML}
                    
                    <div class="price-display">
                        <span class="price-label">Price</span>
                        <div class="price">KES <span id="displayPrice">${parseInt(product.price).toLocaleString()}</span></div>
                    </div>
                    
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
                    
                    <button onclick="openCheckout()" class="buy-btn">
                        <span class="btn-text">Buy Now</span>
                        <span class="btn-arrow">→</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add swipe support for mobile
    if (hasMultipleImages) {
        setTimeout(() => setupSwipeGestures(), 100);
    }
}

function setupSwipeGestures() {
    const container = document.querySelector('.main-image-container');
    if (!container) return;
    
    let startX = 0;
    let endX = 0;
    
    container.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    }, { passive: true });
    
    container.addEventListener('touchend', (e) => {
        endX = e.changedTouches[0].clientX;
        const diff = startX - endX;
        
        if (Math.abs(diff) > 50) {
            if (diff > 0) nextImage();
            else prevImage();
        }
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
        servicePackages = JSON.parse(product.service_packages || '[]');
    } catch (e) {
        servicePackages = [];
    }
    
    const main = document.getElementById('main');
    
    const backButton = storeData.products.length > 1 ? `
        <button onclick="backToCollections()" class="back-btn">
            ← Back to All Services
        </button>
    ` : '';
    
    const hasMultipleImages = productImages.length > 1;
    
    // Portfolio gallery
    const galleryHTML = `
        <div class="portfolio-gallery">
            <div class="gallery-grid">
                ${productImages.slice(0, 6).map((img, idx) => `
                    <div class="gallery-item ${idx === 0 ? 'featured' : ''}" onclick="setMainImage(${idx})">
                        <img src="${img}" alt="Portfolio ${idx + 1}">
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Story circles for testimonials/process
    const storyHTML = stories.length > 0 ? `
        <div class="story-section">
            ${product.story_title ? `<p class="story-title">${product.story_title}</p>` : '<p class="story-title">See My Work</p>'}
            <div class="story-circles">
                ${stories.map((story, idx) => `
                    <div class="story-circle" onclick="openStory(${idx})">
                        <div class="story-ring">
                            <img src="${story.thumbnail || story.url}" alt="Story ${idx + 1}">
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';
    
    // Service packages
    const packagesHTML = servicePackages.length > 0 ? `
        <div class="service-packages">
            <h3 class="packages-title">Service Packages</h3>
            ${servicePackages.map((pkg, idx) => `
                <div class="package-card ${idx === 0 ? 'featured' : ''}">
                    <div class="package-header">
                        <h4 class="package-name">${pkg.name || 'Package ' + (idx + 1)}</h4>
                        <span class="package-price">KES ${parseInt(pkg.price || product.price).toLocaleString()}</span>
                    </div>
                    ${pkg.description ? `<p class="package-desc">${pkg.description}</p>` : ''}
                    ${pkg.includes && pkg.includes.length > 0 ? `
                        <ul class="package-includes">
                            ${pkg.includes.map(item => `<li>✓ ${item}</li>`).join('')}
                        </ul>
                    ` : ''}
                    <button class="package-select-btn" onclick="selectPackage(${idx})">Select Package</button>
                </div>
            `).join('')}
        </div>
    ` : '';
    
    // Availability notes
    const availabilityHTML = product.availability_notes ? `
        <div class="availability-section">
            <span class="availability-label">📅 Availability</span>
            <p class="availability-text">${product.availability_notes}</p>
        </div>
    ` : '';
    
    main.innerHTML = `
        ${backButton}
        <div class="product-container template-portfolio">
            <div class="product-card">
                ${galleryHTML}
                
                <div class="product-info">
                    <div class="product-header">
                        <h2 class="product-name">${product.name}</h2>
                        <div class="social-actions">
                            <button class="social-btn share-btn" onclick="shareProduct(${product.id}, event)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                            </button>
                            <button id="like-btn-${product.id}" class="social-btn like-btn" onclick="toggleLike(${product.id}, event)">
                                <span class="heart-icon ${isLiked ? 'liked' : ''}">${isLiked ? '❤️' : '🤍'}</span>
                            </button>
                        </div>
                    </div>
                    
                    <p class="product-description">${product.description || ''}</p>
                    
                    ${storyHTML}
                    ${packagesHTML}
                    ${availabilityHTML}
                    
                    <div class="price-display">
                        <span class="price-label">Starting from</span>
                        <div class="price">KES <span id="displayPrice">${parseInt(product.price).toLocaleString()}</span></div>
                    </div>
                    
                    <button onclick="openCheckout()" class="buy-btn book-btn">
                        <span class="btn-text">Book Now</span>
                        <span class="btn-arrow">→</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ===========================================
// TEMPLATE 3: VISUAL MENU (Food/Restaurant)
// ===========================================
function renderVisualMenuTemplate(product) {
    const isLiked = isProductLiked(product.id);
    
    // Parse dietary tags
    let dietaryTags = [];
    try {
        dietaryTags = JSON.parse(product.dietary_tags || '[]');
    } catch (e) {
        dietaryTags = [];
    }
    
    const main = document.getElementById('main');
    
    const backButton = storeData.products.length > 1 ? `
        <button onclick="backToCollections()" class="back-btn">
            ← Back to Menu
        </button>
    ` : '';
    
    // Dietary tags display
    const dietaryHTML = dietaryTags.length > 0 ? `
        <div class="dietary-tags">
            ${dietaryTags.map(tag => {
                const tagIcons = {
                    'vegetarian': '🥬',
                    'vegan': '🌱',
                    'spicy': '🌶️',
                    'hot': '🔥',
                    'gluten-free': '🌾',
                    'halal': '☪️',
                    'contains-nuts': '🥜',
                    'dairy-free': '🥛'
                };
                return `<span class="dietary-tag">${tagIcons[tag.toLowerCase()] || '•'} ${tag}</span>`;
            }).join('')}
        </div>
    ` : '';
    
    // Prep time and calories
    const metaHTML = `
        <div class="food-meta">
            ${product.prep_time ? `<span class="meta-item">⏱️ ${product.prep_time}</span>` : ''}
            ${product.calories ? `<span class="meta-item">🔥 ${product.calories} cal</span>` : ''}
        </div>
    `;
    
    // Ingredients
    const ingredientsHTML = product.ingredients ? `
        <div class="ingredients-section">
            <h4 class="ingredients-title">Ingredients</h4>
            <p class="ingredients-list">${product.ingredients}</p>
        </div>
    ` : '';
    
    main.innerHTML = `
        ${backButton}
        <div class="product-container template-menu">
            <div class="product-card food-card">
                <div class="food-image">
                    ${productImages[0] ? 
                        `<img src="${productImages[0]}" alt="${product.name}">` :
                        '<div class="image-placeholder">🍽️</div>'
                    }
                    ${dietaryHTML}
                </div>
                
                <div class="product-info">
                    <div class="product-header">
                        <h2 class="product-name">${product.name}</h2>
                        <div class="social-actions">
                            <button class="social-btn share-btn" onclick="shareProduct(${product.id}, event)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                            </button>
                            <button id="like-btn-${product.id}" class="social-btn like-btn" onclick="toggleLike(${product.id}, event)">
                                <span class="heart-icon ${isLiked ? 'liked' : ''}">${isLiked ? '❤️' : '🤍'}</span>
                            </button>
                        </div>
                    </div>
                    
                    <p class="product-description">${product.description || ''}</p>
                    
                    ${metaHTML}
                    ${ingredientsHTML}
                    
                    <div class="price-display">
                        <span class="price-label">Price</span>
                        <div class="price">KES <span id="displayPrice">${parseInt(product.price).toLocaleString()}</span></div>
                    </div>
                    
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
                    
                    <button onclick="openCheckout()" class="buy-btn order-btn">
                        <span class="btn-text">Add to Order</span>
                        <span class="btn-arrow">→</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ===========================================
// TEMPLATE 5: DEEP DIVE EVALUATOR (High-Ticket)
// ===========================================
function renderDeepDiveTemplate(product) {
    const stories = getStoryMedia(product);
    const isLiked = isProductLiked(product.id);
    
    // Parse specifications
    let specifications = {};
    try {
        specifications = JSON.parse(product.specifications || '{}');
    } catch (e) {
        specifications = {};
    }
    
    // Parse trust badges
    let trustBadges = [];
    try {
        trustBadges = JSON.parse(product.trust_badges || '[]');
    } catch (e) {
        trustBadges = [];
    }
    
    const main = document.getElementById('main');
    
    const backButton = storeData.products.length > 1 ? `
        <button onclick="backToCollections()" class="back-btn">
            ← Back to All Products
        </button>
    ` : '';
    
    const hasMultipleImages = productImages.length > 1;
    
    // Trust badges header
    const trustHTML = trustBadges.length > 0 ? `
        <div class="trust-badges-bar">
            ${trustBadges.map(badge => `
                <span class="trust-badge">${badge.icon || '✓'} ${badge.text}</span>
            `).join('')}
        </div>
    ` : '';
    
    // Gallery with thumbnails for multiple angles
    const galleryHTML = `
        <div class="product-gallery deep-dive-gallery">
            <div class="main-image-container">
                ${hasMultipleImages ? `<button class="gallery-nav prev" onclick="prevImage()">‹</button>` : ''}
                ${productImages[0] ? 
                    `<img id="mainProductImage" src="${productImages[0]}" alt="${product.name}" class="main-gallery-image">` :
                    '<div class="image-placeholder">📸</div>'
                }
                ${hasMultipleImages ? `<button class="gallery-nav next" onclick="nextImage()">›</button>` : ''}
            </div>
            ${hasMultipleImages ? `
                <div class="thumbnail-strip">
                    ${productImages.map((img, idx) => `
                        <div class="thumbnail ${idx === 0 ? 'active' : ''}" onclick="setMainImage(${idx})">
                            <img src="${img}" alt="View ${idx + 1}">
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
    
    // Specifications table
    const specsHTML = Object.keys(specifications).length > 0 ? `
        <div class="specifications-section">
            <h3 class="specs-title">Specifications</h3>
            <table class="specs-table">
                ${Object.entries(specifications).map(([key, value]) => `
                    <tr>
                        <td class="spec-key">${key}</td>
                        <td class="spec-value">${value}</td>
                    </tr>
                `).join('')}
            </table>
        </div>
    ` : '';
    
    // Warranty and return policy
    const warrantyHTML = `
        <div class="guarantees-section">
            ${product.warranty_info ? `
                <div class="guarantee-item">
                    <span class="guarantee-icon">🛡️</span>
                    <div class="guarantee-content">
                        <h4>Warranty</h4>
                        <p>${product.warranty_info}</p>
                    </div>
                </div>
            ` : ''}
            ${product.return_policy_days ? `
                <div class="guarantee-item">
                    <span class="guarantee-icon">↩️</span>
                    <div class="guarantee-content">
                        <h4>${product.return_policy_days}-Day Returns</h4>
                        <p>Not satisfied? Return within ${product.return_policy_days} days for a full refund.</p>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    // Story section for reviews/testimonials
    const storyHTML = stories.length > 0 ? `
        <div class="story-section">
            <p class="story-title">${product.story_title || 'Customer Reviews'}</p>
            <div class="story-circles">
                ${stories.map((story, idx) => `
                    <div class="story-circle" onclick="openStory(${idx})">
                        <div class="story-ring">
                            <img src="${story.thumbnail || story.url}" alt="Review ${idx + 1}">
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';
    
    main.innerHTML = `
        ${backButton}
        <div class="product-container template-deep-dive">
            ${trustHTML}
            <div class="product-card">
                ${galleryHTML}
                
                <div class="product-info">
                    <div class="product-header">
                        <h2 class="product-name">${product.name}</h2>
                        <div class="social-actions">
                            <button class="social-btn share-btn" onclick="shareProduct(${product.id}, event)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                            </button>
                            <button id="like-btn-${product.id}" class="social-btn like-btn" onclick="toggleLike(${product.id}, event)">
                                <span class="heart-icon ${isLiked ? 'liked' : ''}">${isLiked ? '❤️' : '🤍'}</span>
                            </button>
                        </div>
                    </div>
                    
                    <p class="product-description">${product.rich_description || product.description || ''}</p>
                    
                    ${specsHTML}
                    ${warrantyHTML}
                    ${storyHTML}
                    
                    <div class="price-display premium-price">
                        <span class="price-label">Investment</span>
                        <div class="price">KES <span id="displayPrice">${parseInt(product.price).toLocaleString()}</span></div>
                    </div>
                    
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
                    
                    <button onclick="openCheckout()" class="buy-btn invest-btn">
                        <span class="btn-text">Secure Your Order</span>
                        <span class="btn-arrow">→</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    if (hasMultipleImages) {
        setTimeout(() => setupSwipeGestures(), 100);
    }
}

// ===========================================
// TEMPLATE 4: EVENT LANDING
// ===========================================
function renderEventLandingTemplate(product) {
    const isLiked = isProductLiked(product.id);
    
    const main = document.getElementById('main');
    
    const backButton = storeData.products.length > 1 ? `
        <button onclick="backToCollections()" class="back-btn">
            ← Back to All Events
        </button>
    ` : '';
    
    // Parse event date
    let eventDateDisplay = '';
    let countdown = '';
    if (product.event_date) {
        const eventDate = new Date(product.event_date);
        eventDateDisplay = eventDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Calculate countdown
        const now = new Date();
        const diff = eventDate - now;
        if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            countdown = `
                <div class="event-countdown">
                    <div class="countdown-item">
                        <span class="countdown-value">${days}</span>
                        <span class="countdown-label">Days</span>
                    </div>
                    <div class="countdown-item">
                        <span class="countdown-value">${hours}</span>
                        <span class="countdown-label">Hours</span>
                    </div>
                </div>
            `;
        }
    }
    
    // Parse speakers/hosts
    let speakers = [];
    try {
        speakers = JSON.parse(product.speakers || '[]');
    } catch (e) {
        speakers = [];
    }
    
    const speakersHTML = speakers.length > 0 ? `
        <div class="speakers-section">
            <h3 class="speakers-title">Featured Speakers</h3>
            <div class="speakers-grid">
                ${speakers.map(speaker => `
                    <div class="speaker-card">
                        ${speaker.photo ? `<img src="${speaker.photo}" alt="${speaker.name}" class="speaker-photo">` : `<div class="speaker-placeholder">👤</div>`}
                        <h4 class="speaker-name">${speaker.name}</h4>
                        ${speaker.title ? `<p class="speaker-title">${speaker.title}</p>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';
    
    main.innerHTML = `
        ${backButton}
        <div class="product-container template-event">
            <div class="event-hero">
                ${productImages[0] ? 
                    `<img src="${productImages[0]}" alt="${product.name}" class="event-banner">` :
                    '<div class="event-placeholder">🎪</div>'
                }
                <div class="event-overlay">
                    <span class="event-badge">📅 Event</span>
                </div>
            </div>
            
            <div class="product-card event-card">
                <div class="product-info">
                    <div class="product-header">
                        <h2 class="product-name event-title">${product.name}</h2>
                        <div class="social-actions">
                            <button class="social-btn share-btn" onclick="shareProduct(${product.id}, event)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                            </button>
                            <button id="like-btn-${product.id}" class="social-btn like-btn" onclick="toggleLike(${product.id}, event)">
                                <span class="heart-icon ${isLiked ? 'liked' : ''}">${isLiked ? '❤️' : '🤍'}</span>
                            </button>
                        </div>
                    </div>
                    
                    ${countdown}
                    
                    <div class="event-details">
                        ${eventDateDisplay ? `
                            <div class="event-detail-item">
                                <span class="detail-icon">📅</span>
                                <span class="detail-text">${eventDateDisplay}</span>
                            </div>
                        ` : ''}
                        ${product.event_location ? `
                            <div class="event-detail-item">
                                <span class="detail-icon">📍</span>
                                <span class="detail-text">${product.event_location}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <p class="product-description event-description">${product.rich_description || product.description || ''}</p>
                    
                    ${speakersHTML}
                    
                    <div class="price-display event-price">
                        <span class="price-label">Ticket Price</span>
                        <div class="price">KES <span id="displayPrice">${parseInt(product.price).toLocaleString()}</span></div>
                    </div>
                    
                    <div class="quantity-section">
                        <label class="quantity-label">Number of Tickets</label>
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
                    
                    <button onclick="openCheckout()" class="buy-btn register-btn">
                        <span class="btn-text">Register Now</span>
                        <span class="btn-arrow">→</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Helper function for portfolio template
function selectPackage(index) {
    // Update the display price based on selected package
    try {
        const packages = JSON.parse(currentProduct.service_packages || '[]');
        if (packages[index] && packages[index].price) {
            currentProduct.selectedPackagePrice = packages[index].price;
            document.getElementById('displayPrice').textContent = parseInt(packages[index].price).toLocaleString();
            document.getElementById('totalPrice').textContent = parseInt(packages[index].price).toLocaleString();
        }
        
        // Highlight selected package
        document.querySelectorAll('.package-card').forEach((card, idx) => {
            card.classList.toggle('selected', idx === index);
        });
    } catch (e) {}
}

// Expose new functions to window
window.selectPackage = selectPackage;

function backToCollections() {
    const url = new URL(window.location);
    url.searchParams.delete('product');
    window.history.pushState({}, '', url);
    
    renderStore();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===========================================
// QUANTITY CONTROLS
// ===========================================
function increaseQuantity() {
    const maxStock = currentProduct.stock_quantity || 1000;
    if (quantity < maxStock) {
        quantity++;
        updateQuantityDisplay();
    }
}

function decreaseQuantity() {
    if (quantity > 1) {
        quantity--;
        updateQuantityDisplay();
    }
}

function updateQuantityDisplay() {
    document.getElementById('quantityDisplay').textContent = quantity;
    const total = currentProduct.price * quantity;
    document.getElementById('totalPrice').textContent = parseInt(total).toLocaleString();
    
    const decreaseBtn = document.getElementById('decreaseBtn');
    const increaseBtn = document.getElementById('increaseBtn');
    
    if (decreaseBtn) decreaseBtn.disabled = quantity <= 1;
    if (increaseBtn) increaseBtn.disabled = quantity >= (currentProduct.stock_quantity || 1000);
}

// ===========================================
// CHECKOUT FLOW
// ===========================================
function openCheckout() {
    document.getElementById('summaryProductName').textContent = currentProduct.name;
    document.getElementById('summaryQuantity').textContent = quantity;
    document.getElementById('summaryUnitPrice').textContent = parseInt(currentProduct.price).toLocaleString();
    document.getElementById('summaryTotal').textContent = parseInt(currentProduct.price * quantity).toLocaleString();
    
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
        const mpesaOption = document.getElementById('mpesaOption');
        const codOption = document.getElementById('codOption');
        const completeBtn = document.getElementById('completeOrderBtn');
        const ctaHelper = document.getElementById('ctaHelper');
        const customerForm = document.getElementById('customerForm');
        
        if (mpesaOption) mpesaOption.classList.remove('selected');
        if (codOption) codOption.classList.remove('selected');
        if (completeBtn) completeBtn.classList.remove('show');
        if (ctaHelper) ctaHelper.classList.remove('show');
        if (customerForm) customerForm.reset();
    }, 300);
}

function closeOnOverlay(event) {
    if (event.target === document.getElementById('modalOverlay')) {
        closeCheckout();
    }
}

function hideAllSteps() {
    document.querySelectorAll('.checkout-step').forEach(step => {
        step.classList.remove('active');
    });
}

function goToStep1() {
    hideAllSteps();
    document.getElementById('step1').classList.add('active');
}

function goToStep2() {
    hideAllSteps();
    document.getElementById('step2').classList.add('active');
}

function goToStep3() {
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const location = document.getElementById('customerLocation').value.trim();

    if (!name || !phone || !location) {
        alert('Please fill in all fields');
        return;
    }

    if (phone.length < 10) {
        alert('Please enter a valid phone number');
        return;
    }

    hideAllSteps();
    document.getElementById('step3').classList.add('active');
}

function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    
    document.getElementById('mpesaOption').classList.remove('selected');
    document.getElementById('codOption').classList.remove('selected');
    
    const ctaButton = document.getElementById('ctaButtonText');
    const helperText = document.getElementById('paymentMethodText');
    const ctaHelper = document.getElementById('ctaHelper');
    
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
    ctaHelper.classList.add('show');
}

// ===========================================
// ORDER SUBMISSION
// ===========================================
async function completeOrder() {
    if (!selectedPaymentMethod) {
        alert('Please select a payment method');
        return;
    }

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
            const phone = orderData.customer.phone;
            let message = '';

            if (selectedPaymentMethod === 'mpesa') {
                message = `🎉 Order confirmed!\n\n📱 Check ${phone} for M-Pesa prompt to pay KES ${total}.\n\n💬 WhatsApp message with delivery details coming in 5 minutes.`;
            } else {
                message = `🎉 Order confirmed!\n\n💵 Prepare KES ${total} for payment on delivery.\n\n💬 WhatsApp message with delivery details coming in 5 minutes.`;
            }

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

function showLoading() {
    hideAllSteps();
    document.getElementById('loadingStep').classList.add('active');
}

function showSuccess() {
    hideAllSteps();
    document.getElementById('successStep').classList.add('active');
}

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
// START THE APP
// ===========================================
init();

// ===========================================
// EXPOSE FUNCTIONS TO WINDOW
// ===========================================
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
window.showPolicy = showPolicy;
window.closePolicy = closePolicy;

