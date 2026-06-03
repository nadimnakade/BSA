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

const lines = sectionText.split('\n').map(l => l.trim()).filter(l => l.length > 15);
console.log('Lines count:', lines.length);

// Test reversed regex
const rowRegexReversed = /^(?:[\s]*(?:[A-Z][A-Z\s&.\x27\u2013\u2014\-]{2,60}?|\d[\d,.\s]{1,20})\s+)([A-Z][A-Z\s&.\x27\u2013\u2014\-]{2,60})\s+(Individual|Guarantor|Joint|Authorised|Authorized)[\s\S]{5,40}?(?:XXXX|\*\*\*\*|####)(\d{3,6})[\s\S]{5,40}?(\d{1,2}[\-\/\.][\w\-\.]{5,20})\s+(Active|Closed|Settled|Written[\- ]?Off|Suspended)[\s\S]{5,40}?(?:Rs\s*|INR\s*)?([\d,\.]+?)\s*\/(?:[\s\S]{0,30})?(?:Rs\s*|INR\s*)?([\d,\.]+?)\s*$/m;

console.log('\n=== Reversed regex matches ===');
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(rowRegexReversed);
  if (m) {
    console.log(`Line ${i}: LENDER=${m[1].trim()} TYPE=${m[2].trim()} ACCT=${m[3]} STATUS=${m[4]} AMOUNT=${m[5]} BALANCE=${m[6]}`);
  } else if (lines[i].includes('XXXX')) {
    console.log(`Line ${i}: NO MATCH - ${lines[i].substring(0, 120)}`);
  }
}

// Now check parsePaisabazaarSummary output
console.log('\n=== Full joined text test ===');
const joined = t;
const rowRegexSquished = /([A-Z][A-Z\s&.\-\x27]{2,60}?)\s+(Personal Loan|Education Loan|Home Loan|Auto Loan|Gold Loan|Consumer Durable Loan|Business Loan|Loan Against Property|Loan Against Securities|Overdraft|Credit Card|Commercial Vehicle Loan|Construction Equipment Loan|Two Wheeler Loan|Used Car Loan|Property Loan|Term Loan|Working Capital Loan|Cash Credit|Demand Loan|Priority Sector Loan|Professional Loan|SME Loan|Micro Loan|Tractor Loan|Muscle Loan|Flexi Loan|Insta Loan|Insta Plus|Top Up Loan|Balance Transfer|Bridge Loan|Crop Loan|KCC|Gold Loan Xpress|Education Loan|Higher Purchase Loan)\s+(Individual|Guarantor|Joint|Authorised|Authorized)\s+(?:XXXX|\*\*\*\*|####)(\d{3,6})\s+(?:XXXX|\*\*\*\*|####)(\d{4})\s+(?:XXXX|\*\*\*\*|####)(\d{4})\s+(\d{1,2}[\-\/\.][\w\-\.]{5,20})\s+(?:XXXX|\*\*\*\*|####)(\d{4})\s+(Active|Closed|Settled|Written[\- ]?Off|Suspended)\s+(?:Rs\s*|INR\s*)?([\d,\.]+?)\s*\/(?:\s*Rs\s*|\s*INR\s*)?([\d,\.]+?)\s/g;

let squishedMatches = [];
let m2;
while ((m2 = rowRegexSquished.exec(joined)) !== null) {
  const fullMatch = m2[0];
  const lenderEnd = joined.indexOf(fullMatch);
  // Find lender before this match
  const beforeMatch = joined.substring(Math.max(0, lenderEnd - 80), lenderEnd).trim();
  const lenderCandidate = beforeMatch.split(/\s{2,}/).pop();
  squishedMatches.push({
    lender: lenderCandidate,
    type: m2[1],
    account: m2[4] ? `XXXX${m2[4]}` : null,
    amount: m2[9],
    balance: m2[10],
  });
}
console.log(`Squished matches: ${squishedMatches.length}`);
squishedMatches.slice(0, 10).forEach((r, i) => {
  console.log(`  ${i}: LENDER=${r.lender} TYPE=${r.type} ACCT=${r.account} AMOUNT=${r.amount} BALANCE=${r.balance}`);
});
