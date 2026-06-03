const fs=require('fs');
const text=fs.readFileSync('xavier_text_raw.txt','utf-8');
let t = text.replace(/\r\n?/g, '\n');
console.log('Step 0: chars=',t.length, 'has Mobile Phone:', t.includes('Mobile Phone'));

// Squished labels step
const squishedLabels = ['Account Opened Date','Account Closed Date','Last Bank Update','Last Payment Date','Pay Start Date','Pay End Date','Repayment Tenure','Loan Amount','Settlement Amount','Overdue Amount','EMI Amount','Outstanding Balance','Credit Limit','Actual Last Payment','Interest Rate','Collateral Type','Suit Filed Status','Cash Limit','Payment Frequency','Maximum Utilization','High Credit','Account Number','Account type','Account Status','Account No','Ownership','Opened Date','Account Details','Enquired on','Enquiry Purpose','Financial Institution','Last Bank'];

for (const label of squishedLabels) {
  const safe = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  t = t.replace(new RegExp(`(?<=[a-zA-Z0-9])(${safe})`, 'g'), '\n$1');
  t = t.replace(new RegExp(`(${safe})\\s*:?\\s*(?=\\S)`, 'g'), '\n$1: ');
  t = t.replace(new RegExp(`\\b(${safe})\\b(?=[A-Z][a-z])`, 'g'), '\n$1 ');
  t = t.replace(new RegExp(`\\b(${safe})\\b(?!\\s*[:\\n])(?=[A-Z])`, 'g'), '\n$1 ');
}
console.log('After squished labels: chars=',t.length, 'has Mobile Phone:', t.includes('Mobile Phone'));
console.log('Mobile context:', JSON.stringify(t.slice(t.indexOf('Mobile Phone')-50, t.indexOf('Mobile Phone')+100)));
