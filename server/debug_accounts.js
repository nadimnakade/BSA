const fs = require('fs');
const { parseCibilText } = require('./cibil_parser');

const xav = fs.readFileSync('xavier_text_raw.txt', 'utf-8');
const har = fs.readFileSync('cibil_text.txt', 'utf-8');

function show(label, result) {
  console.log(`\n=== ${label} ===`);
  console.log('ACCOUNTS:', result.accounts.length);
  const withNo = result.accounts.filter(a => a.account_no);
  const withLender = result.accounts.filter(a => a.lender);
  console.log('With account_no:', withNo.length, 'With lender:', withLender.length);
  
  // Show first 5 real accounts
  console.log('\nFirst 10 accounts:');
  result.accounts.slice(0, 10).forEach((a, i) => {
    console.log(`  ${i}: no=${a.account_no || 'NONE'} type=${a.account_type || 'NONE'} status=${a.account_status || 'NONE'} bal=${a.current_balance || 'NONE'} lender=${(a.lender || 'NONE').substring(0, 25)}`);
  });
  
  // Show last 10
  console.log('Last 10 accounts:');
  result.accounts.slice(-10).forEach((a, i) => {
    const idx = result.accounts.length - 10 + i;
    console.log(`  ${idx}: no=${a.account_no || 'NONE'} type=${a.account_type || 'NONE'} status=${a.account_status || 'NONE'} bal=${a.current_balance || 'NONE'} lender=${(a.lender || 'NONE').substring(0, 25)}`);
  });
  
  // Summary
  const statuses = {};
  result.accounts.forEach(a => { const s = a.account_status || 'NONE'; statuses[s] = (statuses[s]||0)+1; });
  console.log('\nStatuses:', JSON.stringify(statuses));
  
  const lenders = {};
  result.accounts.forEach(a => { const l = a.lender || 'NONE'; lenders[l] = (lenders[l]||0)+1; });
  console.log('Lenders:', JSON.stringify(lenders));
}

show('XAVIER', parseCibilText(xav));
show('HARVINDER', parseCibilText(har));
