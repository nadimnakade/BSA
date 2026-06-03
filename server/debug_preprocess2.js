const fs=require('fs');
const{preprocessCibilText}=require('./cibil_parser');
const text=fs.readFileSync('xavier_text_raw.txt','utf-8');

// Monkey-patch to trace each step
const origReplace = String.prototype.replace;
let stepCount = 0;

// Trace by adding console.log before each major step
let t = text.replace(/\r\n?/g, '\n');
console.log('STEP 0 (line endings): has Mobile Phone:', t.includes('Mobile Phone'));

const headerBreaks = [
  "Account Details",
  "Credit Enquiries",
  "Credit Enquiry",
  "Summary: Loan Accounts",
  "Summary: Credit Cards",
  "Summary: Credit Accounts",
  "Contact Information",
  "Personal Information",
  "Personal Details",
  "Address Details",
  "Phone Number",
  "Email ID",
  "Mobile Phone",
  "Home Phone",
  "Office Phone",
  "Report Summary",
  "Report Date",
  "Report Number",
  "Sr. No.",
  "Table Of Contents",
  "Table of Contents",
  "Support & Legend",
];
for (const h of headerBreaks) {
  const safe = h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  t = t.replace(
    new RegExp(`(?<=\\S)(${safe})`, "g"),
    "\n$1",
  );
}
console.log('STEP headerBreaks: has Mobile Phone:', t.includes('Mobile Phone'));
console.log('Mobile context:', JSON.stringify(t.slice(t.indexOf('Mobile Phone')-50, t.indexOf('Mobile Phone')+100)));

// Score line normalization
t = t.replace(
  /^([3-9]\d{2})\s*\n\s*(EXCELLENT|GOOD|FAIR|POOR|VERY\s*GOOD|VERY\s*POOR|LOW|HIGH|NA)\b/gim,
  "\nSCORE: $1\nRATING: $2\n",
);
console.log('STEP score1: has Mobile Phone:', t.includes('Mobile Phone'));

// Section labels
t = t.replace(/(\d+)\s+(Active\s+(?:Loans?|Credit\s+Cards?))/gi, "\n$1 $2");
console.log('STEP section: has Mobile Phone:', t.includes('Mobile Phone'));

// 4) Break squished rows
const loanTypePattern = "(?:Personal\\s+Loan|Education\\s+Loan|Home\\s+Loan|Housing\\s+Loan|Vehicle\\s+Loan|Two[\\s-]?Wheeler\\s+Loan|Used\\s+Car\\s+Loan|Gold\\s+Loan|Business\\s+Loan(?:\\s*[–-]\\s*General|\\s+General)?|Consumer\\s+Loan|Loan\\s+Against\\s+Property|Property\\s+Loan|Overdraft|Credit\\s+Card|Loan\\s+on\\s+Credit\\s+Card|Other)";
t = t.replace(
  new RegExp(`([A-Z][A-Z0-9 &.'\\-]{2,60})(${loanTypePattern})`, "g"),
  "$1\n$2",
);
console.log('STEP 4a: has Mobile Phone:', t.includes('Mobile Phone'));

t = t.replace(
  /(?<=[A-Za-z])(XXXX[A-Z0-9]{3,})/g,
  "\n$1",
);
console.log('STEP 4b: has Mobile Phone:', t.includes('Mobile Phone'));

// This one might be the culprit! It's looking for [A-Z0-9]{3,}(?:XXXX)?[A-Z0-9]{0,4}
t = t.replace(
  /([A-Z0-9]{3,}(?:XXXX)?[A-Z0-9]{0,4})(Individual|Joint|Guarantor|Co-Applicant|Co Applicant|Authorised User|Authorized User|Primary)/g,
  "$1\n$2",
);
console.log('STEP 4c (account# to ownership): has Mobile Phone:', t.includes('Mobile Phone'));

t = t.replace(
  /(Individual|Joint|Guarantor)(\d{2}[-\/]\d{2}[-\/]\d{4})/g,
  "$1\n$2",
);
console.log('STEP 4d: has Mobile Phone:', t.includes('Mobile Phone'));

// THIS is likely the culprit - it looks for date followed by [\d,]{4,}
// But "9920117216" has digits and could be matched if preceded by something date-like
t = t.replace(
  /(\d{2}[-\/]\d{2}[-\/]\d{4})([\d,]{4,})/g,
  "$1\n$2",
);
console.log('STEP 4e (date+number): has Mobile Phone:', t.includes('Mobile Phone'));
console.log('Mobile context:', JSON.stringify(t.slice(t.indexOf('Mobile')-30, t.indexOf('Mobile')+50)));

// Check 9920117216
console.log('Has 9920117216:', t.includes('9920117216'));
