const API_BASE_URL = 'http://localhost:3000';

const urlParams = new URLSearchParams(window.location.search);
const SUBDOMAIN = urlParams.get('subdomain') || 'testfashion';

let storeData = null;
let currentProduct = null;
let quantity = 1;
let selectedPaymentMethod = null;

async function init() {
    console.log('🔍 Loading store for subdomain:', SUBDOMAIN);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/public/store/${SUBDOMAIN}`);
        
        if (!response.ok) {
            throw new Error('Store not found');
        }

        storeData = await response.json();`n        console.log('=��� Store data loaded:', storeData);`n        console.log('=�Ŀ Theme from database:', storeData.theme);
        console.log('✅ Store loaded:', storeData.store.businessName);
        
        applyTheme(storeData.theme);
        
        const productId = urlParams.get('product');
        
        if (productId) {
            const product = storeData.products.find(p => p.id === parseInt(productId));
            if (product) {
                renderSingleProduct(product);
            } else {
                renderStore();
            }
        } else {
            renderStore();
        }
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        
    } catch (error) {
        console.error('❌ Failed to load store:', error);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'flex';
    }
}

function applyTheme(theme) {`n    if (!theme) return;`n    `n    console.log('=�Ŀ Applying theme:', theme.display_name `|\`| theme.name);`n    console.log('=��� Theme gradient:', theme.gradient);`n    `n    const root = document.documentElement;`n    `n    // Force override CSS with !important`n    root.style.setProperty('--gradient-primary', theme.gradient, 'important');`n    root.style.setProperty('--color-primary', theme.primary_color, 'important');`n    `n    if (theme.heading_font) {`n        root.style.setProperty('--font-heading', theme.heading_font, 'important');`n    }`n    if (theme.body_font) {`n        root.style.setProperty('--font-body', theme.body_font, 'important');`n    }`n    `n    document.title = storeData.store.businessName;`n    `n    console.log('G�� Theme applied successfully');`n}

function renderStore() {
    const { store, products } = storeData;
    
    document.getElementById('logo').textContent = store.logoText || store.businessName.charAt(0);
    document.getElementById('businessName').textContent = store.businessName;
    document.getElementById('tagline').textContent = store.tagline || '';
    
    const main = document.getElementById('main');
    
    if (products.length === 0) {
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
    main.innerHTML = `
        <div class="collections-container">
            <div class="collections-header">
                <h2>Shop All Products</h2>
                <p>${products.length} ${products.length === 1 ? 'Product' : 'Products'} Available</p>
            </div>
            <div class="collections-grid">
                ${products.map(product => `
                    <div class="collection-card" onclick="viewProduct(${product.id})">
                        <div class="collection-image">
                            ${product.image_url ? 
                                `<img src="${product.image_url}" alt="${product.name}">` :
                                '<div class="image-placeholder">📸</div>'
                            }
                        </div>
                        <div class="collection-content">
                            <h3 class="collection-name">${product.name}</h3>
                            <p class="collection-description">${product.description ? (product.description.substring(0, 60) + '...') : 'No description'}</p>
                            <div class="collection-footer">
                                <p class="collection-price">KES ${parseInt(product.price).toLocaleString()}</p>
                                <button class="collection-btn">View Details →</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
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
    
    const main = document.getElementById('main');
    
    const backButton = storeData.products.length > 1 ? `
        <button onclick="backToCollections()" class="back-btn">
            ← Back to All Products
        </button>
    ` : '';
    
    main.innerHTML = `
        ${backButton}
        <div class="product-container">
            <div class="product-card">
                <div class="product-image">
                    ${product.image_url ? 
                        `<img src="${product.image_url}" alt="${product.name}">` :
                        '<div class="image-placeholder">📸</div>'
                    }
                </div>
                
                <div class="product-info">
                    <h2 class="product-name">${product.name}</h2>
                    <p class="product-description">${product.description || ''}</p>
                    
                    <div class="price-display">
                        <span class="price-label">Price</span>
                        <div class="price">KES <span id="displayPrice">${parseInt(product.price).toLocaleString()}</span></div>
                    </div>
                    
                    <div class="quantity-section">
                        <label class="quantity-label">Quantity</label>
                        <div class="quantity-controls">
                            <button onclick="decreaseQuantity()" id="decreaseBtn" class="quantity-btn">−</button>
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
}

function backToCollections() {
    const url = new URL(window.location);
    url.searchParams.delete('product');
    window.history.pushState({}, '', url);
    
    renderStore();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function increaseQuantity() {
    if (quantity < currentProduct.stock_quantity) {
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
    document.getElementById('decreaseBtn').disabled = quantity <= 1;
    document.getElementById('increaseBtn').disabled = quantity >= currentProduct.stock_quantity;
}

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
        document.getElementById('mpesaOption').classList.remove('selected');
        document.getElementById('codOption').classList.remove('selected');
        document.getElementById('completeOrderBtn').classList.remove('show');
        document.getElementById('ctaHelper').classList.remove('show');
        document.getElementById('customerForm').reset();
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
            alert('Order failed. Please try again.');
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

init();




