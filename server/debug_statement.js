const { parseFile } = require('./parser');
const { analyzeTransactions } = require('./analyzer');
const path = require('path');

async function debug() {
  const file = 'statementfile.pdf';
  const filePath = path.join(__dirname, 'uploads', file);
  
  console.log(`Analyzing ${file}...`);
  try {
    const result = await parseFile(filePath, file);
    console.log(`Transactions: ${result.transactions.length}`);
    if (result.transactions.length > 0) {
      const tx = result.transactions[0];
      console.log('Sample TX:', JSON.stringify(tx, null, 2));
      
      const analysis = analyzeTransactions(result.transactions);
      console.log('\n--- Analysis Metrics ---');
      console.log('Total Credits:', analysis.account_summary.total_credits);
      console.log('Total Debits:', analysis.account_summary.total_debits);
      console.log('Salary count:', analysis.salary.length);
      console.log('EMI count:', analysis.emi_payments.length);
    }
  } catch (err) {
    console.error(err);
  }
}

debug();
