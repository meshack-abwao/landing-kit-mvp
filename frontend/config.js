// ============================================
// LANDING KIT - PRODUCT CONFIGURATION
// ============================================

// BUSINESS INFORMATION
const BUSINESS_CONFIG = {
    name: "@fashionbykaren",
    logoText: "FK",
    tagline: "Premium Fashion • Fast Delivery",
    phone: "254712345678",
    location: "Nairobi, Kenya"
};

// PRODUCT INFORMATION
const PRODUCT_CONFIG = {
    name: "Premium Ankara Dress",
    price: 3500,
    description: "Handcrafted Ankara dress perfect for any occasion. Features vibrant African print, comfortable fit, and premium quality fabric.",
    imageUrl: "",
    maxQuantity: 10,
    inStock: true
};

// PAYMENT SETTINGS
const PAYMENT_CONFIG = {
    acceptMpesa: true,
    acceptCOD: true,
    mpesaInstructions: "Check your phone for M-Pesa prompt",
    codInstructions: "Prepare exact cash for delivery"
};

// API CONFIG
const API_CONFIG = {
    baseUrl: "http://localhost:3000",
    endpoints: {
        createOrder: "/api/orders"
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BUSINESS_CONFIG, PRODUCT_CONFIG, PAYMENT_CONFIG, API_CONFIG };
}
