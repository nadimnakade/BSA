// Quick test of what parseSummaryRows actually returns for Harvinder
const fs = require('fs');
const { preprocessCibilText, parseCibilText } = require('./cibil_parser');

const har = fs.readFileSync('cibil_text.txt', 'utf-8');
const pre = preprocessCibilText(har);
const upper = pre.toUpperCase();

const idxLoan = upper.indexOf('SUMMARY: LOAN ACCOUNTS');
const sectionStart = pre.toUpperCase().indexOf('SUMMARY: LOAN ACCOUNTS');
let sectionText = pre.slice(sectionStart);
const nextSectionIdx = sectionText.slice(20).search(/\bSUMMARY:|\bACCOUNT DETAILS\b/i);
if (nextSectionIdx > 0) sectionText = sectionText.slice(0, nextSectionIdx + 20);

// Show which lines match which regex
const lines = sectionText.split('\n').map(l => l.trim()).filter(l => l);

// Simulate parseSummaryRows line combining
const typeRe = "(?:Personal\\s+Loan|Education\\s+Loan|Home\\s+Loan|Housing\\s+Loan|Vehicle\\s+Loan|Two\\s+Wheeler\\s+Loan|Used\\s+Car\\s+Loan|Gold\\s+Loan|Business\\s+Loan(?:\\s+General)?|Consumer\\s+Loan|Loan\\s+Against\\s+Property|Property\\s+Loan|Overdraft|Credit\\s+Card|Loan\\s+on\\s+Credit\\s+Card|Other)";

const rowRegex = new RegExp(
  `([A-Z][A-Z0-9 &.'\\-]{2,50})\\s+` +
  `(${typeRe})\\s+` +
  `(XXXX[A-Z0-9]+|[A-Z0-9X*]{4,})\\s+` +
  `(Individual|Guarantor|Joint|Co-Applicant|Co Applicant|Authorized User|Authorised User)\\s+` +
  `(\\d{2}-\\d{2}-\\d{4})\\s+` +
  `(Active|Closed|Settled|Written\\s*Off|Suit\\s*Filed|Wilful\\s*Default|Loss|SMA)`,
  "i",
);

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

// Combine lines like parseSummaryRows does
const combined = [];
for (let i = 0; i < lines.length; i++) {
  let current = lines[i];
  if (i + 1 < lines.length) {
    const next = lines[i + 1];
    const nextStartsWithType = new RegExp(`^${typeRe}`, "i").test(next);
    if (!new RegExp(typeRe, "i").test(current) && nextStartsWithType) {
      current += " " + next;
      i++;
    }
  }
  combined.push(current);
}

console.log("=== Combined lines (lines 6-12) ===");
for (let i = 6; i < Math.min(combined.length, 13); i++) {
  const mf = combined[i].match(rowRegex);
  const mr = combined[i].match(rowRegexReversed);
  console.log(`Line ${i}: fwd=${!!mf} rev=${!!mr}`, 
    mf ? `fwd_lender=${mf[1]}` : "",
    mr ? `rev_lender=${mr[9]} rev_type=${mr[1]}` : "");
  if (!mf && !mr) {
    console.log(`  RAW: ${combined[i].substring(0, 120)}`);
  }
}

// Check XXXX7037 specifically
console.log("\n=== XXXX7037 line ===");
const line7037 = combined.find(l => l.includes("XXXX7037"));
if (line7037) {
  console.log("Line:", line7037.substring(0, 150));
  const mf = line7037.match(rowRegex);
  const mr = line7037.match(rowRegexReversed);
  console.log("Forward:", mf ? `lender=${mf[1]} type=${mf[2]}` : "NO MATCH");
  console.log("Reversed:", mr ? `type=${mr[1]} lender=${mr[9]}` : "NO MATCH");
}
