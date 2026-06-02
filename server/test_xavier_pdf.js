const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { parseCibilText } = require('./analyzer.js');

(async () => {
  try {
    const buffer = fs.readFileSync(path.join(__dirname, 'uploads', 'CIBIL XAVIER 9920117216.pdf'));
    const data = await pdfParse(buffer);
    const result = parseCibilText(data.text);
    
    console.log('Report Date:', result.report_date);
    console.log('Credit Score:', result.score);
    console.log('Total accounts:', result.accounts?.length || 0);
    
    if (result.accounts && result.accounts.length > 0) {
      console.log('\nFirst 3 accounts:');
      for (let i = 0; i < Math.min(3, result.accounts.length); i++) {
        const a = result.accounts[i];
        console.log(`[${i}] ${a.account_no} | ${a.lender} | ${a.account_status}`);
      }
    }
  } catch (e) {
    console.error('ERROR:', e.message);
    console.error(e.stack);
  }
  process.exit(0);
})();
