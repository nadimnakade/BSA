const line = 'Loan on Credit  Card   XXXX9055   Individual   09-10-2024   Closed   31-08-2025   NA   0  AMEX';
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

console.log('Forward match:', !!line.match(rowRegex));
const m1 = line.match(rowRegex);
if (m1) console.log('  Lender:', m1[1], 'Type:', m1[2]);

console.log('Reversed match:', !!line.match(rowRegexReversed));
const m2 = line.match(rowRegexReversed);
if (m2) console.log('  Type:', m2[1], 'Acct:', m2[2], 'Lender:', m2[10]);

// Debug: test each part of reversed regex
console.log('\nStep by step:');
const typeMatch = line.match(new RegExp(`^${typeRe}`, 'i'));
console.log('Type at start:', typeMatch ? typeMatch[0] : 'NO MATCH');

// Test what the reversed regex is actually doing
const typeMatch2 = line.match(new RegExp(`(${typeRe})`, 'i'));
console.log('Type anywhere:', typeMatch2 ? typeMatch2[0] : 'NO MATCH');
