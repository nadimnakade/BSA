const fs = require('fs');
const har = fs.readFileSync('cibil_text.txt', 'utf-8');

// Temporarily monkey-patch to trace summaryAccounts
const origParse = require('./cibil_parser').parseCibilText;

// Patch to capture summaryAccounts before merge
const Module = require('module');
const origLoad = Module._load;

// Actually, simpler: just add logging directly by modifying the source temporarily
// Let me just check the issue differently

// The reversed regex on the actual lines WORKS (confirmed above).
// The squished parser + catch-all regex might be creating WRONG entries.
// Let me check what parseSummaryRows actually returns

const { preprocessCibilText, normalizeLenderName } = require('./cibil_parser');
const pre = preprocessCibilText(har);
const upper = pre.toUpperCase();
const t = pre;

// Manually run parseSummaryRows
const idxLoan = upper.indexOf('SUMMARY: LOAN ACCOUNTS');
let sectionText = t.slice(idxLoan);
const nextSectionIdx = sectionText.slice(20).search(/\bSUMMARY:|\bACCOUNT DETAILS\b/i);
if (nextSectionIdx > 0) sectionText = sectionText.slice(0, nextSectionIdx + 20);

// The issue is in parseSummaryRows calling parseSquishedSummaryRows
// Let me check what squished rows look like

// Read parseSquishedSummaryRows from source... or just check what accounts parseSummaryRows produces
// by intercepting at the merge level

// Actually, let me check: are there entries in summaryAccounts with same account_no but different lenders?
// That would confirm the Pass 3 catch-all is the problem

// Let me check the catch-all regex by looking at what it finds for XXXX7037 in joinedFlat
const joinedFlat = t.replace(/\n/g, ' ').replace(/\s+/g, ' ');
const acctNoRe = /\b([A-Z0-9X*]{4,})\b/gi;
const typeRe = 'Personal Loan|Education Loan|Home Loan|Auto Loan|Gold Loan|Consumer Durable Loan|Business Loan|Loan Against Property|Loan Against Securities|Overdraft|Credit Card|Commercial Vehicle Loan|Construction Equipment Loan|Two Wheeler Loan|Used Car Loan|Property Loan|Term Loan|Working Capital Loan|Cash Credit|Demand Loan|Priority Sector Loan|Professional Loan|SME Loan|Micro Loan|Tractor Loan|Muscle Loan|Flexi Loan|Insta Loan|Insta Plus|Top Up Loan|Balance Transfer|Bridge Loan|Crop Loan|KCC|Gold Loan Xpress|Higher Purchase Loan';

let mm;
while ((mm = acctNoRe.exec(joinedFlat)) !== null) {
  const accountNo = (mm[1] || '').trim();
  if (accountNo === 'XXXX7037') {
    const before = joinedFlat.slice(Math.max(0, mm.index - 150), mm.index).replace(/\s+/g, ' ').trim();
    const after = joinedFlat.slice(mm.index + accountNo.length, mm.index + accountNo.length + 250).replace(/\s+/g, ' ').trim();
    console.log('=== XXXX7037 catch-all context ===');
    console.log('Before:', before.slice(-100));
    console.log('After:', after.slice(0, 100));
    
    const beforeMatch = before.match(
      new RegExp(`(?:^|\\s)([A-Z][A-Z0-9 &.'-]{2,60})\\s+(${typeRe})\\s*$`, 'i')
    );
    if (beforeMatch) {
      console.log('beforeMatch lender:', beforeMatch[1]);
      console.log('beforeMatch type:', beforeMatch[2]);
    } else {
      console.log('No beforeMatch');
    }
    break;
  }
}
