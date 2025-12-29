// Landing Kit - Main Script
const PRODUCT_PRICE = PRODUCT_CONFIG.price;
let quantity = 1;
let selectedPaymentMethod = null;

// Initialize page on load
document.addEventListener('DOMContentLoaded', function() {
    loadProductData();
    updateQuantity();
});

// Load product data from config
function loadProductData() {
    document.title = BUSINESS_CONFIG.name + ' - ' + PRODUCT_CONFIG.name;
    document.getElementById('businessName').textContent = BUSINESS_CONFIG.name;
    document.getElementById('businessLogo').textContent = BUSINESS_CONFIG.logoText;
    document.getElementById('businessTagline').textContent = BUSINESS_CONFIG.tagline;
    document.getElementById('productName').textContent = PRODUCT_CONFIG.name;
    document.getElementById('productDescription').textContent = PRODUCT_CONFIG.description;
    document.getElementById('summaryProductName').textContent = PRODUCT_CONFIG.name;
    
    if (PRODUCT_CONFIG.imageUrl) {
        const imgContainer = document.getElementById('productImage');
        imgContainer.innerHTML = '<img src="' + PRODUCT_CONFIG.imageUrl + '" alt="' + PRODUCT_CONFIG.name + '" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">';
    }
}

// Quantity controls
function updateQuantity() {
    document.getElementById('quantityDisplay').textContent = quantity;
    document.getElementById('summaryQuantity').textContent = quantity;
    
    const total = PRODUCT_PRICE * quantity;
    document.getElementById('displayPrice').textContent = PRODUCT_PRICE.toLocaleString();
    document.getElementById('totalPrice').textContent = total.toLocaleString();
    document.getElementById('summaryTotal').textContent = total.toLocaleString();
    document.getElementById('summaryUnitPrice').textContent = PRODUCT_PRICE.toLocaleString();

    document.getElementById('decreaseBtn').disabled = quantity <= 1;
    document.getElementById('increaseBtn').disabled = quantity >= PRODUCT_CONFIG.maxQuantity;
}

function increaseQuantity() {
    if (quantity < PRODUCT_CONFIG.maxQuantity) {
        quantity++;
        updateQuantity();
    }
}

function decreaseQuantity() {
    if (quantity > 1) {
        quantity--;
        updateQuantity();
    }
}

// Modal controls
function openCheckout() {
    if (!PRODUCT_CONFIG.inStock) {
        alert('Sorry, this product is currently out of stock.');
        return;
    }
    document.getElementById('modalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCheckout() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.body.style.overflow = '';
    resetCheckout();
}

function closeOnOverlay(event) {
    if (event.target === document.getElementById('modalOverlay')) {
        closeCheckout();
    }
}

function resetCheckout() {
    setTimeout(function() {
        goToStep1();
        document.getElementById('customerForm').reset();
        selectedPaymentMethod = null;
        document.getElementById('mpesaOption').classList.remove('selected');
        document.getElementById('codOption').classList.remove('selected');
        document.getElementById('completeOrderBtn').classList.remove('show');
        document.getElementById('ctaHelper').classList.remove('show');
    }, 300);
}

// Step navigation
function hideAllSteps() {
    var steps = document.querySelectorAll('.checkout-step');
    for (var i = 0; i < steps.length; i++) {
        steps[i].classList.remove('active');
    }
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
    var name = document.getElementById('customerName').value.trim();
    var phone = document.getElementById('customerPhone').value.trim();
    var location = document.getElementById('customerLocation').value.trim();

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

// Payment selection
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;

    var mpesaOption = document.getElementById('mpesaOption');
    var codOption = document.getElementById('codOption');
    var completeBtn = document.getElementById('completeOrderBtn');
    var ctaHelper = document.getElementById('ctaHelper');
    var ctaButtonText = document.getElementById('ctaButtonText');
    var paymentMethodText = document.getElementById('paymentMethodText');

    mpesaOption.classList.remove('selected');
    codOption.classList.remove('selected');

    if (method === 'mpesa') {
        if (!PAYMENT_CONFIG.acceptMpesa) {
            alert('M-Pesa payment is not available');
            return;
        }
        mpesaOption.classList.add('selected');
        ctaButtonText.textContent = '✓ Complete Order with M-Pesa';
        paymentMethodText.textContent = PAYMENT_CONFIG.mpesaInstructions;
    } else {
        if (!PAYMENT_CONFIG.acceptCOD) {
            alert('Cash on Delivery is not available');
            return;
        }
        codOption.classList.add('selected');
        ctaButtonText.textContent = '✓ Complete Order - Pay on Delivery';
        paymentMethodText.textContent = PAYMENT_CONFIG.codInstructions;
    }

    completeBtn.classList.add('show');
    ctaHelper.classList.add('show');
}

// Complete order
function completeOrder() {
    if (!selectedPaymentMethod) {
        alert('Please select a payment method');
        return;
    }

    showLoading();

    var orderData = {
        product: PRODUCT_CONFIG.name,
        quantity: quantity,
        price: PRODUCT_PRICE,
        total: PRODUCT_PRICE * quantity,
        customer: {
            name: document.getElementById('customerName').value.trim(),
            phone: document.getElementById('customerPhone').value.trim(),
            location: document.getElementById('customerLocation').value.trim()
        },
        paymentMethod: selectedPaymentMethod,
        business: {
            name: BUSINESS_CONFIG.name,
            phone: BUSINESS_CONFIG.phone
        },
        timestamp: new Date().toISOString()
    };

    fetch(API_CONFIG.baseUrl + API_CONFIG.endpoints.createOrder, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
    })
    .then(function(response) {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(function(data) {
        var orderNumber = data.orderNumber || 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        document.getElementById('orderNumber').textContent = orderNumber;

        var total = (PRODUCT_PRICE * quantity).toLocaleString();
        var phone = document.getElementById('customerPhone').value;
        var message = '';

        if (selectedPaymentMethod === 'mpesa') {
            message = '🎉 Order confirmed!\n\n📱 Check ' + phone + ' for M-Pesa prompt to pay KES ' + total + '.\n\n💬 WhatsApp message with delivery details coming in 5 minutes.';
        } else {
            message = '🎉 Order confirmed!\n\n💵 Prepare KES ' + total + ' for payment on delivery.\n\n💬 WhatsApp message with delivery details coming in 5 minutes.';
        }

        document.getElementById('successMessage').textContent = message;
        showSuccess();
    })
    .catch(function(error) {
        console.error('Error:', error);
        alert('There was an error processing your order. Please try again or contact us directly.');
        goToStep3();
    });
}

function showLoading() {
    hideAllSteps();
    document.getElementById('loading').classList.add('active');
}

function showSuccess() {
    hideAllSteps();
    document.getElementById('success').classList.add('active');
}
