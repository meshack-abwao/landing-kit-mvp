// WhatsApp notification service
// For Tier 1, we'll use a simple placeholder
// In production, integrate with Twilio or WhatsApp Business API

async function sendOrderNotification(orderData) {
    try {
        const businessPhone = process.env.BUSINESS_WHATSAPP_NUMBER;
        
        if (!businessPhone) {
            console.log('⚠️  WhatsApp notification skipped: No business phone configured');
            return false;
        }
        
        // Format message
        const message = formatOrderMessage(orderData);
        
        // TODO: Integrate with Twilio WhatsApp API
        // For now, just log the message
        console.log('📱 WhatsApp notification would be sent to:', businessPhone);
        console.log('Message:', message);
        
        // Simulated success
        return true;
        
    } catch (error) {
        console.error('❌ Error sending WhatsApp notification:', error.message);
        // Don't throw - notification failure shouldn't break order creation
        return false;
    }
}

function formatOrderMessage(orderData) {
    const total = orderData.total.toLocaleString();
    const paymentMethod = orderData.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash on Delivery';
    
    return `
🎉 NEW ORDER! ${orderData.orderNumber}

📦 Product: ${orderData.product}
🔢 Quantity: ${orderData.quantity}
💰 Total: KES ${total}

👤 Customer:
Name: ${orderData.customer.name}
Phone: ${orderData.customer.phone}
Location: ${orderData.customer.location}

💳 Payment: ${paymentMethod}

⏰ ${new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}
    `.trim();
}

module.exports = {
    sendOrderNotification
};
