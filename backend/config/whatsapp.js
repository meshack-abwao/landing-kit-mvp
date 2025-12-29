// WhatsApp integration (placeholder for now)

async function sendWhatsAppNotification(phone, orderData) {
  try {
    // TODO: Implement WhatsApp API integration
    console.log('💬 WhatsApp notification (placeholder):', phone, orderData);
    return true;
  } catch (error) {
    console.error('WhatsApp error:', error);
    return false;
  }
}

module.exports = { sendWhatsAppNotification };
