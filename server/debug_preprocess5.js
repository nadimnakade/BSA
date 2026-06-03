const fs=require('fs');
const text=fs.readFileSync('xavier_text_raw.txt','utf-8');
let t = text.replace(/\r\n?/g, '\n');

const squishedLabels = [
    "Account Opened Date", "Account Closed Date", "Last Bank Update",
    "Last Payment Date", "Pay Start Date", "Pay End Date",
    "Repayment Tenure", "Loan Amount", "Settlement Amount",
    "Overdue Amount", "EMI Amount", "Outstanding Balance",
    "Credit Limit", "Actual Last Payment", "Interest Rate",
    "Collateral Type", "Suit Filed Status", "Cash Limit",
    "Payment Frequency", "Maximum Utilization", "High Credit",
    "Account Number", "Account type", "Account Status",
    "Account No", "Ownership", "Opened Date", "Account Details",
    "Enquired on", "Enquiry Purpose", "Financial Institution",
    "Last Bank",
];

for (const label of squishedLabels) {
  const safe = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  t = t.replace(new RegExp(`(?<=[a-zA-Z0-9])(${safe})`, "g"), "\n$1");
  t = t.replace(new RegExp(`(${safe})\\s*:?\\s*(?=\\S)`, "g"), "\n$1: ");
  t = t.replace(new RegExp(`\\b(${safe})\\b(?=[A-Z][a-z])`, "g"), "\n$1 ");
  t = t.replace(new RegExp(`\\b(${safe})\\b(?!\\s*[:\\n])(?=[A-Z])`, "g"), "\n$1 ");
}

t = t.replace(/Report\s+to\s+CIBIL\s*Table\s+of\s+Contents/gi, "\n");
t = t.replace(/Powered\s+by[^\n]*/gi, "");

const headerBreaks = [
  "Account Details", "Credit Enquiries", "Credit Enquiry",
  "Summary: Loan Accounts", "Summary: Credit Cards", "Summary: Credit Accounts",
  "Contact Information", "Personal Information", "Personal Details",
  "Address Details", "Phone Number", "Email ID", "Mobile Phone",
  "Home Phone", "Office Phone", "Report Summary", "Report Date",
  "Report Number", "Sr. No.", "Table Of Contents", "Table of Contents",
  "Support & Legend",
];
for (const h of headerBreaks) {
  const safe = h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  t = t.replace(
    new RegExp(`(?<=\\S)(${safe})`, "g"),
    "\n$1",
  );
}
console.log('After headerBreaks, has Mobile:', t.includes('Mobile Phone'));

// Score line
t = t.replace(
  /^([3-9]\d{2})\s*\n\s*(EXCELLENT|GOOD|FAIR|POOR|VERY\s*GOOD|VERY\s*POOR|LOW|HIGH|NA)\b/gim,
  "\nSCORE: $1\nRATING: $2\n",
);
console.log('After score1, has Mobile:', t.includes('Mobile Phone'));

t = t.replace(
  /\b(EXCELLENT|GOOD|FAIR|POOR|VERY\s*GOOD|VERY\s*POOR|LOW|HIGH|NA)\s*\n\s*([3-9]\d{2})\b/gim,
  "\nSCORE: $2\nRATING: $1\n",
);
console.log('After score2, has Mobile:', t.includes('Mobile Phone'));

t = t.replace(
  /\bCIBIL\s*SCORE\b\s*[:\-]?\s*([3-9]\d{2})/gi,
  "\nCIBIL SCORE: $1",
);
t = t.replace(
  /\b(Equifax|Experian|CRIF|CIBIL|TransUnion)\s*Score\b\s*[:\-]?\s*([3-9]\d{2})/gi,
  "\nCIBIL SCORE: $2",
);
console.log('After score3+4, has Mobile:', t.includes('Mobile Phone'));

// 3) Section labels
t = t.replace(/(\d+)\s+(Active\s+(?:Loans?|Credit\s+Cards?))/gi, "\n$1 $2");
t = t.replace(/(Total\s+(?:loan|limit))/gi, "\n$1");
t = t.replace(/(Current\s+Outstanding)/gi, "\n$1");
t = t.replace(/(Overdue\s+Payments)/gi, "\n$1");
t = t.replace(/(Age\s+of\s+Accounts)/gi, "\n$1");
t = t.replace(/(Recent\s+Enquiries)/gi, "\n$1");
t = t.replace(/(Hey\s+[A-Za-z]+,)/gi, "\n$1\n");
t = t.replace(/This section[^.]*\./gi, "\n");
console.log('After section labels, has Mobile:', t.includes('Mobile Phone'));

// 4) Break squished rows
const loanTypePattern = "(?:Personal\\s+Loan|Education\\s+Loan|Home\\s+Loan|Housing\\s+Loan|Vehicle\\s+Loan|Two[\\s-]?Wheeler\\s+Loan|Used\\s+Car\\s+Loan|Gold\\s+Loan|Business\\s+Loan(?:\\s*[–-]\\s*General|\\s+General)?|Consumer\\s+Loan|Loan\\s+Against\\s+Property|Property\\s+Loan|Overdraft|Credit\\s+Card|Loan\\s+on\\s+Credit\\s+Card|Other)";
t = t.replace(
  new RegExp(`([A-Z][A-Z0-9 &.'\\-]{2,60})(${loanTypePattern})`, "g"),
  "$1\n$2",
);
console.log('After 4a (lender+type split), has Mobile:', t.includes('Mobile Phone'));

t = t.replace(
  /(?<=[A-Za-z])(XXXX[A-Z0-9]{3,})/g,
  "\n$1",
);
console.log('After 4b (XXXX split), has Mobile:', t.includes('Mobile Phone'));

// THIS might be it! The mobile number is "9920117216" which is preceded by something
t = t.replace(
  /([A-Z0-9]{3,}(?:XXXX)?[A-Z0-9]{0,4})(Individual|Joint|Guarantor|Co-Applicant|Co Applicant|Authorised User|Authorized User|Primary)/g,
  "$1\n$2",
);
console.log('After 4c (account# split), has Mobile:', t.includes('Mobile Phone'));

t = t.replace(
  /(Individual|Joint|Guarantor)(\d{2}[-\/]\d{2}[-\/]\d{4})/g,
  "$1\n$2",
);
console.log('After 4d, has Mobile:', t.includes('Mobile Phone'));

t = t.replace(
  /(\d{2}[-\/]\d{2}[-\/]\d{4})(Active|Closed|Settled|Written\s*Off|Suit\s*Filed|Wilful\s*Default|Loss|SMA|Special\s*Mention)/g,
  "$1\n$2",
);
console.log('After 4e (date+status split), has Mobile:', t.includes('Mobile Phone'));

t = t.replace(
  /(Active|Closed|Settled|Written\s*Off|Suit\s*Filed|Wilful\s*Default|Loss|SMA|Special\s*Mention)(\d{2}[-\/]\d{2}[-\/]\d{4})/g,
  "$1\n$2",
);
console.log('After 4f (status+date split), has Mobile:', t.includes('Mobile Phone'));

t = t.replace(
  /(\d{2}[-\/]\d{2}[-\/]\d{4})([\d,]{4,})/g,
  "$1\n$2",
);
console.log('After 4g (date+number split), has Mobile:', t.includes('Mobile Phone'));

// Check
if (!t.includes('Mobile Phone')) {
  console.log('Mobile lost! Context at original idx:');
  const origIdx = text.indexOf('Mobile Phone');
  console.log(JSON.stringify(t.slice(origIdx-100, origIdx+100)));
}

// Split squished money
t = t.replace(
  /(\d{1,2},\d{2},\d{3})(\d{1,2},\d{2},\d{3})/g,
  "$1\n$2",
);
console.log('After money split, has Mobile:', t.includes('Mobile Phone'));

t = t.replace(
  /(\d{1,2},\d{2},\d{3})(-?\d{1,3})(?=\s|$|\n)/g,
  "$1\n$2",
);
console.log('After money-amount split, has Mobile:', t.includes('Mobile Phone'));

// 5) Break squished enquiry rows
t = t.replace(
  /(?<=\b)(\d{1,3})(Housing\s+Loan|Personal\s+Loan|Credit\s+Card|Business\s+Loan(?:[ –-]General)?|Other|Education\s+Loan|Vehicle\s+Loan|Two[ -]?wheeler\s+Loan|Loan\s+on\s+Credit\s+Card|Gold\s+Loan|Property\s+Loan|Overdraft)/gi,
  "\n$1 $2",
);
console.log('After 5a (enquiry start), has Mobile:', t.includes('Mobile Phone'));

t = t.replace(
  new RegExp(`(${loanTypePattern})([A-Z][A-Z0-9 &.'\\-]{2,60}?)(\\d{2}-\\d{2}-\\d{4})`, "g"),
  "$1\n$2\n$3",
);
console.log('After 5b (enquiry complete), has Mobile:', t.includes('Mobile Phone'));

// 6) Account-details header block
t = t.replace(
  /\b(Active|Closed|Settled|Written\s*Off|Suit\s*Filed|Wilful\s*Default|Loss|SMA)\s+(Account\s*Number\s*:?)/gi,
  "$1\n$2",
);
console.log('After 6, has Mobile:', t.includes('Mobile Phone'));

// Collapse
t = t.replace(/\n{3,}/g, "\n\n");
console.log('After collapse, has Mobile:', t.includes('Mobile Phone'));
console.log('Final length:', t.length);
