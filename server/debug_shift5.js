const fs = require('fs');
const { preprocessCibilText } = require('./cibil_parser');
const har = fs.readFileSync('cibil_text.txt', 'utf-8');

// Monkey-patch to trace data flow
const origModule = require('./cibil_parser');
let summaryRows, paisaRows, finalAccounts;

// Patch console.log to capture PAISABAZAAR SUMMARY ROWS
const origLog = console.log;
const logs = [];
console.log = (...args) => {
  logs.push(args.join(' '));
  // origLog(...args);
};

const h = origModule.parseCibilText(har);
console.log = origLog;

// Print relevant logs
for (const l of logs) {
  if (l.includes('PAISABAZAAR') || l.includes('SUMMARY ROWS') || l.includes('ACCOUNT NO DEDUP')) {
    origLog(l);
  }
}

// Now check what summaryAccounts have for XXXX7037
// The parseSummaryRows should have correct data, but paisabazaarAccounts might override
// Let me trace by checking all accounts that have XXXX7037
const accts7037 = h.accounts.filter(a => a.account_no === 'XXXX7037');
origLog('\n=== Accounts with XXXX7037 ===');
accts7037.forEach((a, i) => {
  origLog(`  ${i}: lender=${a.lender} type=${a.account_type} bal=${a.current_balance} sanct=${a.sanctioned_amount} source=${a._source || 'unknown'}`);
});

// Check XXXX8223
const accts8223 = h.accounts.filter(a => a.account_no === 'XXXX8223');
origLog('\n=== Accounts with XXXX8223 ===');
accts8223.forEach((a, i) => {
  origLog(`  ${i}: lender=${a.lender} type=${a.account_type} bal=${a.current_balance} sanct=${a.sanctioned_amount} source=${a._source || 'unknown'}`);
});

// Check all accounts with their sources
origLog('\n=== First 10 accounts ===');
h.accounts.slice(0, 10).forEach((a, i) => {
  origLog(`  ${i}: ${a.account_no} lender=${a.lender} type=${a.account_type} bal=${a.current_balance}`);
});
