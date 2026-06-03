const fs=require('fs');
const text=fs.readFileSync('xavier_text_raw.txt','utf-8');
let t = text.replace(/\r\n?/g, '\n');
console.log('Initial has Mobile:', t.includes('Mobile Phone'));

// Find the slice around mobile
const idx = t.indexOf('Mobile Phone');
console.log('Mobile at idx:', idx);
console.log('Context:', JSON.stringify(t.slice(idx-50, idx+100)));

// Now run preprocess steps and trace
const origReplace = String.prototype.replace;
let step = 0;

// Run a copy of the preprocessing
const {preprocessCibilText} = require('./cibil_parser');

// Direct test
const pre = preprocessCibilText(text);
console.log('\nPreprocessed has Mobile:', pre.includes('Mobile Phone'));
console.log('Preprocessed has 992:', pre.includes('992'));
console.log('Preprocessed length:', pre.length);

// Let me check what step removes it - run preprocess step by step using module functions
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

let t2 = text.replace(/\r\n?/g, '\n');
console.log('\nAfter line endings, has Mobile:', t2.includes('Mobile Phone'));

for (const label of squishedLabels) {
  const safe = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  t2 = t2.replace(new RegExp(`(?<=[a-zA-Z0-9])(${safe})`, "g"), "\n$1");
  t2 = t2.replace(new RegExp(`(${safe})\\s*:?\\s*(?=\\S)`, "g"), "\n$1: ");
  t2 = t2.replace(new RegExp(`\\b(${safe})\\b(?=[A-Z][a-z])`, "g"), "\n$1 ");
  t2 = t2.replace(new RegExp(`\\b(${safe})\\b(?!\\s*[:\\n])(?=[A-Z])`, "g"), "\n$1 ");
}
console.log('After squished labels, has Mobile:', t2.includes('Mobile Phone'));

t2 = t2.replace(/Report\s+to\s+CIBIL\s*Table\s+of\s+Contents/gi, "\n");
t2 = t2.replace(/Powered\s+by[^\n]*/gi, "");
console.log('After report glue, has Mobile:', t2.includes('Mobile Phone'));

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
  t2 = t2.replace(
    new RegExp(`(?<=\\S)(${safe})`, "g"),
    "\n$1",
  );
}
console.log('After headerBreaks, has Mobile:', t2.includes('Mobile Phone'));
