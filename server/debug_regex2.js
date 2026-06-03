const line = 'Personal Loan   XXXX7037   Individual   08-04-2025   Active   30-04-2026   18,23,083   11,38,311  HDFC BANK';
const typeRe = "(?:Personal\\s+Loan|Education\\s+Loan|Home\\s+Loan|Housing\\s+Loan|Vehicle\\s+Loan|Two\\s+Wheeler\\s+Loan|Used\\s+Car\\s+Loan|Gold\\s+Loan|Business\\s+Loan(?:\\s+General)?|Consumer\\s+Loan|Loan\\s+Against\\s+Property|Property\\s+Loan|Overdraft|Credit\\s+Card|Loan\\s+on\\s+Credit\\s+Card|Other)";

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

const m = line.match(rowRegexReversed);
console.log('Reversed match:', m ? 'YES' : 'NO');
if (m) {
  console.log('  Type:', m[1]);
  console.log('  Acct:', m[2]);
  console.log('  Owner:', m[3]);
  console.log('  Opened:', m[4]);
  console.log('  Status:', m[5]);
  console.log('  Updated:', m[6]);
  console.log('  Amt1:', m[7]);
  console.log('  Amt2:', m[8]);
  console.log('  Lender:', m[9]);
}

// Also test what the forward regex would match
const rowRegex = new RegExp(
  `([A-Z][A-Z0-9 &.'\\-]{2,50})\\s+` +
  `(${typeRe})\\s+` +
  `(XXXX[A-Z0-9]+|[A-Z0-9X*]{4,})\\s+` +
  `(Individual|Guarantor|Joint|Co-Applicant|Co Applicant|Authorized User|Authorised User)\\s+` +
  `(\\d{2}-\\d{2}-\\d{4})\\s+` +
  `(Active|Closed|Settled|Written\\s*Off|Suit\\s*Filed|Wilful\\s*Default|Loss|SMA)`,
  "i",
);
const m2 = line.match(rowRegex);
console.log('\nForward match:', m2 ? 'YES' : 'NO');
if (m2) {
  console.log('  Lender:', m2[1]);
  console.log('  Type:', m2[2]);
}
