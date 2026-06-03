const fs = require('fs');
const { preprocessCibilText } = require('./cibil_parser');
const har = fs.readFileSync('cibil_text.txt', 'utf-8');
const pre = preprocessCibilText(har);

// Test the reversed regex directly on one line
const testLine = 'Personal Loan   XXXX8223   Individual   31-12-2025   Active   30-04-2026   5,00,000   4,81,758  KANGRACBL';
console.log('Test line:', testLine);

const typeRe = 'Personal Loan|Education Loan|Home Loan|Auto Loan|Gold Loan|Consumer Durable Loan|Business Loan|Loan Against Property|Loan Against Securities|Overdraft|Credit Card|Commercial Vehicle Loan|Construction Equipment Loan|Two Wheeler Loan|Used Car Loan|Property Loan|Term Loan|Working Capital Loan|Cash Credit|Demand Loan|Priority Sector Loan|Professional Loan|SME Loan|Micro Loan|Tractor Loan|Muscle Loan|Flexi Loan|Insta Loan|Insta Plus|Top Up Loan|Balance Transfer|Bridge Loan|Crop Loan|KCC|Gold Loan Xpress|Higher Purchase Loan';

const rowRegexReversed = new RegExp(
  `(${typeRe})\\s+` +
  `(XXXX[A-Z0-9]+|[A-Z0-9X*]{4,})\\s+` +
  `(Individual|Guarantor|Joint|Co-Applicant|Co Applicant|Authorized User|Authorised User)\\s+` +
  `(\\d{2}-\\d{2}-\\d{4})\\s+` +
  `(Active|Closed|Settled|Written\\s*Off|Suit\\s*Filed|Wilful\\s*Default|Loss|SMA)\\s+` +
  `(\\d{2}-\\d{2}-\\d{4})\\s+` +
  `([\\d,]+|NA)\\s+` +
  `([\\d,]+|NA)\\s+` +
  `([A-Z][A-Z0-9 &.'\\-]{2,50})`,
  "i",
);

console.log('\nRegex:', rowRegexReversed.source.substring(0, 200));
const m = testLine.match(rowRegexReversed);
if (m) {
  console.log('MATCH!');
  console.log('Groups:', m.slice(1).map((g, i) => `  [${i + 1}] ${g}`));
} else {
  console.log('NO MATCH');
  // Try piece by piece
  const parts = testLine.split(/\s{2,}/);
  console.log('Split by 2+ spaces:', parts);
  
  // The issue might be that the regex expects single space between amounts and lender
  // but the actual text has 2+ spaces
  console.log('\nChar-by-char near end:');
  const end = testLine.substring(testLine.length - 30);
  console.log('  ...' + JSON.stringify(end));
  for (let i = testLine.length - 30; i < testLine.length; i++) {
    const code = testLine.charCodeAt(i);
    if (code < 32 || code > 126) {
      console.log(`  pos ${i}: code ${code} (non-ASCII)`);
    }
  }
}
