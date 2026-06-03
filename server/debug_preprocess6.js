const fs=require('fs');
const text=fs.readFileSync('xavier_text_raw.txt','utf-8');
let t = text.replace(/\r\n?/g, '\n');

// Squished labels
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

// Header breaks
const headerBreaks = ["Account Details", "Credit Enquiries", "Credit Enquiry",
  "Summary: Loan Accounts", "Summary: Credit Cards", "Summary: Credit Accounts",
  "Contact Information", "Personal Information", "Personal Details",
  "Address Details", "Phone Number", "Email ID", "Mobile Phone",
  "Home Phone", "Office Phone", "Report Summary", "Report Date",
  "Report Number", "Sr. No.", "Table Of Contents", "Table of Contents",
  "Support & Legend"];
for (const h of headerBreaks) {
  const safe = h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  t = t.replace(new RegExp(`(?<=\\S)(${safe})`, "g"), "\n$1");
}

// Score
t = t.replace(/^([3-9]\d{2})\s*\n\s*(EXCELLENT|GOOD|FAIR|POOR|VERY\s*GOOD|VERY\s*POOR|LOW|HIGH|NA)\b/gim, "\nSCORE: $1\nRATING: $2\n");
t = t.replace(/\b(EXCELLENT|GOOD|FAIR|POOR|VERY\s*GOOD|VERY\s*POOR|LOW|HIGH|NA)\s*\n\s*([3-9]\d{2})\b/gim, "\nSCORE: $2\nRATING: $1\n");
t = t.replace(/\bCIBIL\s*SCORE\b\s*[:\-]?\s*([3-9]\d{2})/gi, "\nCIBIL SCORE: $1");
t = t.replace(/\b(Equifax|Experian|CRIF|CIBIL|TransUnion)\s*Score\b\s*[:\-]?\s*([3-9]\d{2})/gi, "\nCIBIL SCORE: $2");

console.log('Before section labels, has Mobile:', t.includes('Mobile Phone'));

// Now the section labels - step by step
const tests = [
  [/(\d+)\s+(Active\s+(?:Loans?|Credit\s+Cards?))/gi, "\n$1 $2"],
  [/(Total\s+(?:loan|limit))/gi, "\n$1"],
  [/(Current\s+Outstanding)/gi, "\n$1"],
  [/(Overdue\s+Payments)/gi, "\n$1"],
  [/(Age\s+of\s+Accounts)/gi, "\n$1"],
  [/(Recent\s+Enquiries)/gi, "\n$1"],
  [/(Hey\s+[A-Za-z]+,)/gi, "\n$1\n"],
  [/This section[^.]*\./gi, "\n"],
];
for (const [re, rep] of tests) {
  const before = t.length;
  const hadMobile = t.includes('Mobile Phone');
  t = t.replace(re, rep);
  const lost = hadMobile && !t.includes('Mobile Phone');
  if (lost || before !== t.length) {
    console.log('Regex', re, 'before', before, 'after', t.length, 'lostMobile:', lost);
  }
}
console.log('Final has Mobile:', t.includes('Mobile Phone'));
