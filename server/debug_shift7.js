const fs = require('fs');
const { preprocessCibilText } = require('./cibil_parser');
const har = fs.readFileSync('cibil_text.txt', 'utf-8');
const pre = preprocessCibilText(har);

// Check what parsePaisabazaarSummary produces
const Module = require('module');
const origRequire = Module.prototype.require;

// Just directly test the squished regex
const joined = pre; // Use preprocessed text (with newlines)
const typeRe = 'Personal Loan|Education Loan|Home Loan|Auto Loan|Gold Loan|Consumer Durable Loan|Business Loan|Loan Against Property|Loan Against Securities|Overdraft|Credit Card|Commercial Vehicle Loan|Construction Equipment Loan|Two Wheeler Loan|Used Car Loan|Property Loan|Term Loan|Working Capital Loan|Cash Credit|Demand Loan|Priority Sector Loan|Professional Loan|SME Loan|Micro Loan|Tractor Loan|Muscle Loan|Flexi Loan|Insta Loan|Insta Plus|Top Up Loan|Balance Transfer|Bridge Loan|Crop Loan|KCC|Gold Loan Xpress|Higher Purchase Loan';

// Test: what does parseSummaryRows actually return for Harvinder?
// Let me test the reversed regex vs squished regex on the section text
const upper = pre.toUpperCase();
const idxLoan = upper.indexOf('SUMMARY: LOAN ACCOUNTS');
let sectionText = pre.slice(idxLoan);
const nextSectionIdx = sectionText.slice(20).search(/\bSUMMARY:|\bACCOUNT DETAILS\b/i);
if (nextSectionIdx > 0) sectionText = sectionText.slice(0, nextSectionIdx + 20);

const lines = sectionText.split('\n').map(l => l.trim()).filter(l => l.length > 15);
console.log('Lines:', lines.length);

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

const results = [];
for (const line of lines) {
  const m = line.match(rowRegexReversed);
  if (m) {
    results.push({ account_no: m[2], lender: m[9].trim() });
  }
}
console.log('Reversed regex results:', results.length);
results.slice(0, 5).forEach(r => console.log(`  ${r.account_no} -> ${r.lender}`));

// Now check what parseSquishedSummaryRows produces on the same section text
// The squished regex tries to find lender+type+account etc in squished text
// Let me check what the "squished rows" look like inside parseSummaryRows
