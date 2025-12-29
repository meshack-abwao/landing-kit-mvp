// Google Sheets integration (placeholder for now)

async function appendToSheet(data) {
  try {
    // TODO: Implement Google Sheets API integration
    console.log('📝 Order logged (Google Sheets placeholder):', data);
    return true;
  } catch (error) {
    console.error('Google Sheets error:', error);
    return false;
  }
}

module.exports = { appendToSheet };
