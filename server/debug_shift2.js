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
console.log('\n=== ALL lines with XXXX ===');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('XXXX')) {
    console.log(`Line ${i}: ${lines[i]}`);
  }
}
