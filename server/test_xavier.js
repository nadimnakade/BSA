const fs = require('fs');
const path = require('path');
const { parseCibilText } = require('./cibil_parser');

async function run() {
  const filePath = path.join(__dirname, 'uploads', 'CIBIL XAVIER 9920117216.pdf');
  const buffer = fs.readFileSync(filePath);
  try {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    let text = data.text || '';

    // The issue with Xavier PDF is that pdf-parse collapses all Account Details fields into single lines
    // e.g. "Account Number:XXXX9705Account type:Personal LoanAccount Status:ActiveOwnership:Individual"
    // Let's add spacing before these labels if they are squished.
    const fieldLabels = [
      'Account Opened Date', 'Account Closed Date', 'Last Bank Update',
      'Last Payment Date', 'Pay Start Date', 'Pay End Date', 'Repayment Tenure',
      'Loan Amount', 'Settlement Amount', 'Overdue Amount', 'EMI Amount',
      'Outstanding Balance', 'Credit Limit', 'Actual Last Payment',
      'Interest Rate', 'Collateral Type', 'Collateral', 'Suit Filed Status',
      'Cash Limit', 'Payment Frequency', 'Maximum Utilization',
      'Account Number', 'Account type', 'Account Status', 'Ownership',
      'Account Details', 'Payment History'
    ];

    for (const label of fieldLabels) {
      // Add a newline before the label if it's squished to previous word
      text = text.replace(new RegExp(`(?<=[a-z0-9])(${label})`, 'gi'), '\n$1');
      // Add a newline before the label even if no lowercase letter, just in case
      text = text.replace(new RegExp(`(${label}:?)`, 'gi'), '\n$1');
    }

    // After adding newlines, the lines might be a bit messy, let's parse
    const parsed = parseCibilText(text);
    const active = (parsed.accounts || []).filter(a => !/CLOSED|SETTLED/i.test(a.account_status || ''));
    console.log('Parsed active accounts for Xavier:', active.length);
    if(active.length > 0) {
      console.log(JSON.stringify(active.slice(0, 2), null, 2));
    }
  } catch(e) {
    console.log('pdf-parse failed:', e.message);
  }
}
run().catch(console.error);
