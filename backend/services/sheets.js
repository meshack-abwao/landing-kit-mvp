const { google } = require('googleapis');
const path = require('path');

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = 'Orders';

async function getAuthClient() {
    // Option 1: Use JSON key file (easier, more reliable)
    const keyFilePath = path.join(__dirname, '..', 'google-credentials.json');
    
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: keyFilePath,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        return auth.getClient();
    } catch (error) {
        console.error('Error loading credentials:', error.message);
        throw error;
    }
}

async function saveOrder(orderData) {
    try {
        const authClient = await getAuthClient();
        const sheets = google.sheets({ version: 'v4', auth: authClient });
        
        const date = new Date().toLocaleDateString('en-KE');
        const time = new Date().toLocaleTimeString('en-KE');
        
        const row = [
            orderData.orderNumber,
            date,
            time,
            orderData.product,
            orderData.quantity,
            orderData.price,
            orderData.total,
            orderData.customer.name,
            orderData.customer.phone,
            orderData.customer.location,
            orderData.paymentMethod.toUpperCase(),
            'Pending'
        ];
        
        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: SHEET_NAME + '!A:L',
            valueInputOption: 'RAW',
            resource: { values: [row] },
        });
        
        console.log('✅ Order saved to Google Sheets:', orderData.orderNumber);
        return true;
        
    } catch (error) {
        console.error('❌ Error saving to Google Sheets:', error.message);
        throw error;
    }
}

async function getOrder(orderNumber) {
    return null;
}

module.exports = { saveOrder, getOrder };
