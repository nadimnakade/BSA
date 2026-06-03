const fs = require('fs');
const { preprocessCibilText } = require('./cibil_parser');
const har = fs.readFileSync('cibil_text.txt', 'utf-8');
const pre = preprocessCibilText(har);
const upper = pre.toUpperCase();
const t = pre;

// Find the loan accounts section
const sectionStart = upper.indexOf('SUMMARY: LOAN ACCOUNTS');
let sectionText = t.slice(sectionStart);
const nextSectionIdx = sectionText.slice(20).search(/\bSUMMARY:|\bACCOUNT DETAILS\b/i);
if (nextSectionIdx > 0) sectionText = sectionText.slice(0, nextSectionIdx + 20);

const rawLines = sectionText.split('\n');
console.log('Raw lines count:', rawLines.length);

const lines = rawLines.map(l => l.trim()).filter(l => l.length > 15);
console.log('Filtered lines count:', lines.length);

// Show each line with its char codes for the first line with XXXX
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('XXXX8223')) {
    console.log(`\nLine ${i}: ${lines[i]}`);
    console.log('Length:', lines[i].length);
    console.log('Has multiple spaces:', /\s{2,}/.test(lines[i]));
    
    // Check if it's actually multiple lines concatenated
    const multiSpaceSections = lines[i].split(/\s{2,}/);
    console.log('Sections by 2+ spaces:', multiSpaceSections.length);
    multiSpaceSections.forEach((s, j) => console.log(`  Section ${j}: "${s}"`));
    break;
  }
}

// Now test the actual regex from parseSummaryRows
const typeRe = 'Personal Loan|Education Loan|Home Loan|Auto Loan|Gold Loan|Consumer Durable Loan|Business Loan|Loan Against Property|Loan Against Securities|Overdraft|Credit Card|Commercial Vehicle Loan|Construction Equipment Loan|Two Wheeler Loan|Used Car Loan|Property Loan|Term Loan|Working Capital Loan|Cash Credit|Demand Loan|Priority Sector Loan|Professional Loan|SME Loan|Micro Loan|Tractor Loan|Muscle Loan|Flexi Loan|Insta Loan|Insta Plus|Top Up Loan|Balance Transfer|Bridge Loan|Crop Loan|KCC|Gold Loan Xpress|Higher Purchase Loan';

const rowRegexReversed = new RegExp(
  `^(${typeRe})\\s+` +
  `(XXXX[A-Z0-9]+|[A-Z0-9X*]{4,})\\s+` +
  `(Individual|Guarantor|Joint|Co-Applicant|Co Applicant|Authorized User|Authorised User)\\s+` +
  `(\\d{2}-\\d{2}-\\d{4})\\s+` +
  `(Active|Closed|Settled|Written\\s*Off|Suit\\s*Filed|Wilful\\s*Default|Loss|SMA)\\s+` +
  `(\\d{2}-\\d{2}-\\d{4})\\s+` +
  `([\\d,]+|NA)\\s+` +
  `([\\d,]+|NA)\\s+` +
  `([A-Z][A-Z0-9 &.'\\-]{2,50})$`,
  "i",
);

console.log('\n=== Testing regex on all XXXX lines ===');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('XXXX')) {
    const m = lines[i].match(rowRegexReversed);
    if (m) {
      console.log(`Line ${i}: MATCH LENDER=${m[9]}`);
    } else {
      console.log(`Line ${i}: NO MATCH`);
      console.log(`  Line: ${lines[i].substring(0, 100)}`);
      // Check if ^ or $ is the issue
      const mNoAnchors = lines[i].match(rowRegexReversed);
      if (mNoAnchors) {
        console.log(`  Without anchors: MATCH`);
      }
    }
  }
}
