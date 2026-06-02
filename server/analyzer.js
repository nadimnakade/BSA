// BANK STATEMENT ANALYZER - TRANSACTION CLASSIFICATION & INSIGHTS
// ===========================================================================

const SALARY_KEYWORDS = [ /\bSALARY\b/i, /\bPAYROLL\b/i, /\bNEFT\b.*SALARY/i, /\bIMPS\b.*SALARY/i, /\bSAL\s+FOR\b/i, /\bMONTHLY\s+SAL/i, /\bCREDIT\s+SALARY/i, /VARAHE/i, /SIPL/i, /INFOSYS/i, /WIPRO/i, /TATA\s+CONSULTANCY/i, /HCL\s+TECH/i ];
const LOAN_TYPE_MAP = [
  { regex: /PERSONAL\s*LOAN|PL\b/i, code: 'PL', label: 'Personal Loan' },
  { regex: /HOME\s*LOAN|HL\b|HOUSING|MORTGAGE/i, code: 'HL', label: 'Home Loan' },
  { regex: /CAR\s*LOAN|AUTO\s*LOAN|VEHICLE|VL\b/i, code: 'VL', label: 'Vehicle Loan' },
  { regex: /TWO\s*WHEELER/i, code: '2WL', label: 'Two Wheeler Loan' },
  { regex: /GOLD\s*LOAN|GL\b/i, code: 'GL', label: 'Gold Loan' },
  { regex: /BUSINESS\s*LOAN|BL\b/i, code: 'BL', label: 'Business Loan' },
  { regex: /EDUCATION\s*LOAN/i, code: 'EL', label: 'Education Loan' },
  { regex: /CONSUMER\s*DURABLE|CDL\b/i, code: 'CDL', label: 'Consumer Durable Loan' },
  { regex: /LOAN\s*AGAINST\s*PROPERTY|LAP\b/i, code: 'LAP', label: 'Loan Against Property' },
  { regex: /CREDIT\s*CARD|CC\b/i, code: 'CC', label: 'Credit Card' },
  { regex: /OVERDRAFT|OD\b/i, code: 'OD', label: 'Overdraft' },
];

const LENDER_PATTERNS = [
  // Top Private Banks
  { regex: /\bHDFC\b|HDFCBANK/i, name:'HDFC Bank', category:'Pvt' },
  { regex: /\bICICI\b|ICICIBANK/i, name:'ICICI Bank', category:'Pvt' },
  { regex: /\bAXIS\b|AXISBANK|UTIB/i, name:'Axis Bank', category:'Pvt' },
  { regex: /\bKOTAK\b|KOTAKBANK|KKBK/i, name:'Kotak Mahindra Bank', category:'Pvt' },
  { regex: /\bYES\b|YESBANK|YESB/i, name:'Yes Bank', category:'Pvt' },
  { regex: /\bINDUSIND\b|INDUS.*IND|INDB/i, name:'IndusInd Bank', category:'Pvt' },
  { regex: /\bIDFC\b|IDFCBANK|IDFB/i, name:'IDFC First Bank', category:'Pvt' },
  { regex: /\bFEDERAL\b|FEDERALBANK|FDRL/i, name:'Federal Bank', category:'Pvt' },
  { regex: /\bRBL\b|RBLBANK|RBLB/i, name:'RBL Bank', category:'Pvt' },
  { regex: /\bBANDHAN\b|BANDHANBANK/i, name:'Bandhan Bank', category:'Pvt' },
  { regex: /\bAU\s*SMALL\b|AUBANK|AUBK/i, name:'AU Small Finance Bank', category:'SFB' },
  { regex: /\bEQUITY\b|EQUITAS|ESFB/i, name:'Equitas Small Finance Bank', category:'SFB' },
  
  // Public Sector Banks
  { regex: /\bSBI\b|STATE\s*BANK|SBIN/i, name:'State Bank of India', category:'PSB' },
  { regex: /\bBOB\b|BANK\s*OF\s*BARODA|BARB/i, name:'Bank of Baroda', category:'PSB' },
  { regex: /\bPNB\b|PUNJAB\s*NATIONAL|PUNB/i, name:'Punjab National Bank', category:'PSB' },
  { regex: /\bCANARA\b|CANARABANK|CNRB/i, name:'Canara Bank', category:'PSB' },
  { regex: /\bUNION\b|UNIONBANK|UBIN/i, name:'Union Bank of India', category:'PSB' },
  { regex: /\bBOI\b|BANK\s*OF\s*INDIA|BKID/i, name:'Bank of India', category:'PSB' },
  { regex: /\bIDBI\b|IDBIBANK|IBKL/i, name:'IDBI Bank', category:'PSB' },
  { regex: /\bINDIAN\b|INDIANBANK|IDIB/i, name:'Indian Bank', category:'PSB' },
  { regex: /\bCENTRAL\s*BANK\b|CBIN/i, name:'Central Bank of India', category:'PSB' },
  { regex: /\bUCO\b|UCOBANK/i, name:'UCO Bank', category:'PSB' },
  
  // Top NBFCs
  { regex: /\bBAJAJ\b|BAJAJ.*FIN|BJFL/i, name:'Bajaj Finance', category:'NBFC' },
  { regex: /\bCHOLA\b|CHOLAMANDALAM/i, name:'Cholamandalam Finance', category:'NBFC' },
  { regex: /\bMAHINDRA\b|MMFSL/i, name:'Mahindra Finance', category:'NBFC' },
  { regex: /\bMUTHOOT\b|MUTHOOT.*FIN/i, name:'Muthoot Finance', category:'NBFC' },
  { regex: /\bMANAPPURAM\b|MANAPPURAM.*FIN/i, name:'Manappuram Finance', category:'NBFC' },
  { regex: /\bTATA\s*CAPITAL\b|TATA.*FIN/i, name:'Tata Capital', category:'NBFC' },
  { regex: /\bL&T\b|LNT.*FIN/i, name:'L&T Finance', category:'NBFC' },
  { regex: /\bFULLERTON\b|SMFG/i, name:'SMFG India Credit (Fullerton)', category:'NBFC' },
  { regex: /\bADITYA\s*BIRLA\b|ABCAP/i, name:'Aditya Birla Capital', category:'NBFC' },
  { regex: /\bPOONAWALLA\b|POONAWALLA.*FIN/i, name:'Poonawalla Fincorp', category:'NBFC' },
  { regex: /\bSHRIRAM\b|SHRIRAM.*FIN/i, name:'Shriram Finance', category:'NBFC' },
  { regex: /\bHERO\b|HERO.*FIN/i, name:'Hero Fincorp', category:'NBFC' },
  { regex: /\bHDB\b|HDBFS/i, name:'HDB Financial Services', category:'NBFC' },
  { regex: /\bKOTAK\s*MAHINDRA\s*INVEST\b|KMIL/i, name:'Kotak Mahindra Investments', category:'NBFC' },
  { regex: /\bIIFL\b|IIFL.*FIN/i, name:'IIFL Finance', category:'NBFC' },
  { regex: /\bPIRAMAL\b|PIRAMAL.*FIN/i, name:'Piramal Finance', category:'NBFC' },
  { regex: /\bHOME\s*CREDIT\b|HOMECREDIT/i, name:'Home Credit', category:'NBFC' },
  { regex: /\bKREDITBEE\b|KRAZYBEE/i, name:'KreditBee', category:'NBFC' },
  { regex: /\bCASHE\b|BHANIX/i, name:'CASHe', category:'NBFC' },
  { regex: /\bMONEYVIEW\b|WHIZDM/i, name:'MoneyView', category:'NBFC' },
  { regex: /\bEARLYSALARY\b|FIBE/i, name:'Fibe (EarlySalary)', category:'NBFC' },
  { regex: /\bPAYSENSE\b/i, name:'PaySense', category:'NBFC' },
];

function normalizeDesc(desc) {
  return (desc || '').toString().trim().replace(/\s+/g, ' ');
}

function normUpper(desc) {
  return normalizeDesc(desc).toUpperCase();
}

function anyMatch(text, patterns) {
  return patterns.some(p => p instanceof RegExp ? p.test(text) : text.includes(p));
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const s = dateStr.toString().trim();
  const parts = s.split(/[-\/\s.]/);
  if (parts.length < 3) return null;
  let d, m, y;
  if (parts[0].length === 4) { y = parts[0]; m = parts[1]; d = parts[2]; }
  else { d = parts[0]; m = parts[1]; y = parts[2]; }
  if (y.length === 2) y = `20${y}`;
  const monthMap = { 'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12' };
  if (isNaN(m)) m = monthMap[m.toUpperCase().slice(0, 3)] || '01';
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function parseAmount(str) {
  if (!str) return 0;
  // Handle strings like "1,850.007,31,191.66" by splitting at the first valid amount boundary
  // This is a safety measure if the parser didn't already split it
  let clean = str.toString().replace(/₹/g, '').trim();
  const joinedMatch = clean.match(/^(\d[0-9,]*\.\d{2})(\d[0-9,]*\.\d{2})$/);
  if (joinedMatch) clean = joinedMatch[1];
  
  if (clean.startsWith('(') && clean.endsWith(')')) clean = `-${clean.slice(1, -1)}`;
  clean = clean.replace(/[,\s]/g, '').replace(/(dr|cr)$/i, '');
  return parseFloat(clean) || 0;
}

const SALARY_SOURCE_MAP = { 'AI AIRPORT':'AI Airport Services Ltd', 'AIAIRPORT':'AI Airport Services Ltd', 'INFOSYS':'Infosys BPO Ltd', 'WIPRO':'Wipro Ltd', 'TCS':'Tata Consultancy Services', 'HCL':'HCL Technologies', 'COGNIZANT':'Cognizant Technology', 'ACCENTURE':'Accenture' };
const NACH_PATTERNS = [ /^NACH\//i, /^NACH\s/i, /^ECS\//i, /^ECS\s/i, /^ACH\//i, /^EMANCH\//i, /^SI\//i, /^SI\s/i, /E-?MANDATE/i, /\bMANDATE\b/i, /AUTO\s*DEBIT/i, /NACH.*DEBIT/i, /ECS.*DEBIT/i ];
const APP_LOAN_PATTERNS = [
  { regex: /KREDITBEE|KREDIT.*BEE/i, name:'KreditBee', maxApr:36 }, { regex: /LAZYPAY|LAZY.*PAY/i, name:'LazyPay', maxApr:36 }, { regex: /MONEYTAP|MONEY.*TAP/i, name:'MoneyTap', maxApr:36 }, { regex: /\bNAVI\b/i, name:'Navi', maxApr:36 }, { regex: /MPOKKET|M.*POKKET/i, name:'mPokket', maxApr:48 }, { regex: /PAYSENSE|PAY.*SENSE/i, name:'PaySense', maxApr:36 }, { regex: /\bCASHE\b/i, name:'CASHe', maxApr:36 }, { regex: /EARLYSALARY|EARLY.*SALARY|\bFIBE\b/i, name:'Fibe', maxApr:36 }, { regex: /STASHFIN/i, name:'StashFin', maxApr:36 }, { regex: /\bSLICE\b/i, name:'Slice', maxApr:30 }, { regex: /\bJUPITER\b/i, name:'Jupiter', maxApr:30 }, { regex: /\bNIRA\b/i, name:'Nira', maxApr:36 }, { regex: /SMARTCOIN/i, name:'SmartCoin', maxApr:48 }, { regex: /KISSHT|RING.*LOAN/i, name:'Kissht/Ring', maxApr:36 }, { regex: /\bFREO\b|FREOPAY/i, name:'Freo', maxApr:30 }, { regex: /ZESTMONEY|ZEST.*MONEY/i, name:'ZestMoney', maxApr:36 }, { regex: /AXIO|CAPITALFLOAT/i, name:'Axio', maxApr:36 }, { regex: /\bDHANI\b/i, name:'Dhani', maxApr:42 }, { regex: /INDIALENDS/i, name:'IndiaLends', maxApr:36 }, { regex: /LOANTAP/i, name:'LoanTap', maxApr:36 }, { regex: /KRAZYBEE/i, name:'KrazyBee', maxApr:48 }, { regex: /RUPEEK/i, name:'Rupeek', maxApr:24 }, { regex: /BHARATPE.*LOAN/i, name:'BharatPe Loan', maxApr:36 }, { regex: /LENDINGKART/i, name:'Lendingkart', maxApr:36 }, { regex: /FINNABLE/i, name:'Finnable', maxApr:36 }, { regex: /OXYZO/i, name:'Oxyzo', maxApr:24 }, { regex: /INDIFI/i, name:'Indifi', maxApr:36 }, { regex: /FAIRCENT/i, name:'Faircent', maxApr:36 }, { regex: /MONEYVIEW/i, name:'MoneyView', maxApr:36 }, { regex: /\bPREFR\b/i, name:'Prefr', maxApr:36 }, { regex: /FINAGLE/i, name:'Finagle', maxApr:40 }
];
const SIP_PATTERNS = [
  { regex: /GROWW/i, platform:'Groww' }, { regex: /ZERODHA.*COIN|ZERODHA.*MF/i, platform:'Zerodha Coin' }, { regex: /PAYTM.*MONEY|PAYTMMONEY/i, platform:'Paytm Money' }, { regex: /\bCAMS\b|CAMSONLINE/i, platform:'CAMS' }, { regex: /BSE.*STAR|BSESTAR/i, platform:'BSE Star MF' }, { regex: /MF.*UTIL|MFUTILITY/i, platform:'MF Utility' }, { regex: /MIRAE/i, platform:'Mirae Asset MF' }, { regex: /NIPPON.*MF|NIPPON.*INDIA/i, platform:'Nippon India MF' }, { regex: /AXIS.*MF/i, platform:'Axis MF' }, { regex: /HDFC.*MF/i, platform:'HDFC MF' }, { regex: /SBI.*MF/i, platform:'SBI MF' }, { regex: /ICICI.*MF|ICICI.*PRU.*MF/i, platform:'ICICI Prudential MF' }, { regex: /UTI.*MF/i, platform:'UTI MF' }, { regex: /KOTAK.*MF/i, platform:'Kotak MF' }, { regex: /TATA.*MF/i, platform:'Tata MF' }, { regex: /CANARA.*ROBECO/i, platform:'Canara Robeco MF' }, { regex: /DSP.*MF/i, platform:'DSP MF' }, { regex: /IDFC.*MF|BANDHAN.*MF/i, platform:'Bandhan MF' }, { regex: /HSBC.*MF/i, platform:'HSBC MF' }, { regex: /FRANKLIN.*TEMPLETON/i, platform:'Franklin Templeton MF' }
];

function analyzeTransactions(transactions) {
  const txns = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  const analysis = { salary: [], pf_epfo: [], loans: [], emi_payments: [], loan_disbursements: [], apy_pension: [], rent: [], app_loans: [], credit_card_payments: [], stock_market: [], insurance: [], utilities: [], transfers_in: [], transfers_out: [], bounce_charges: [], account_summary: {}, monthly_summary: {}, insights: { avg_monthly_salary: 0, total_emi_monthly: 0, obligation_to_income_ratio: 0, savings_rate: 0, risk_flags: [], recommendations: [] }, loan_summary: {} };
  if (!txns.length) return analysis;
  let totalCredits = 0, totalDebits = 0;
  const periodStart = txns[0].date, periodEnd = txns[txns.length - 1].date;
  for (const t of txns) {
    const desc = normUpper(t.description), amt = Number(t.amount || t.credit || t.debit) || 0, type = (t.type || (t.credit > 0 ? 'CREDIT' : 'DEBIT')).toUpperCase();
    if (type === 'CREDIT') totalCredits += amt; else if (type === 'DEBIT') totalDebits += amt;
    const salary = detectSalary(t); if (salary) analysis.salary.push(salary);
    if (type === 'CREDIT' && (desc.includes('EPFO') || desc.includes('PFUND') || desc.includes('PROV FUND'))) analysis.pf_epfo.push(t);
    const disb = detectLoanDisbursement(t); if (disb) analysis.loan_disbursements.push(disb);
    const emi = detectLoanEMI(t); if (emi) { analysis.emi_payments.push(emi); analysis.loans.push(emi); }
    if (type === 'DEBIT' && (desc.includes('APY') || desc.includes('ATAL PENSION'))) analysis.apy_pension.push(t);
    const rent = detectRent(t); if (rent) analysis.rent.push(rent);
    const appLoan = detectAppLoan(t); if (appLoan) analysis.app_loans.push(appLoan);
    const cc = detectCreditCardPayment(t); if (cc) analysis.credit_card_payments.push(cc);
    const stock = detectStockMarket(t); if (stock) analysis.stock_market.push(stock);
    const ins = detectInsurance(t); if (ins) analysis.insurance.push(ins);
    const util = detectUtilities(t); if (util) analysis.utilities.push(util);
    const trans = detectTransfers(t); if (trans) { if (type === 'CREDIT') analysis.transfers_in.push(trans); else analysis.transfers_out.push(trans); }
    const bounce = detectBounceCharges(t); if (bounce) analysis.bounce_charges.push(bounce);
  }
  analysis.account_summary = { period: `${periodStart} to ${periodEnd}`, transaction_count: txns.length, total_credits: totalCredits, total_debits: totalDebits, net_balance: totalCredits - totalDebits };
  computeMonthlySummary(analysis, txns); computeInsights(analysis); computeLoanSummary(analysis);
  return analysis;
}

function detectSalary(t) {
  if (t.isSalary) return { ...t, amount: t.credit, employer: inferSalaryEmployer(t.description) };
  if ((t.type !== 'CREDIT' && t.credit <= 0) || (t.amount < 5000 && t.credit < 5000)) return null;
  const desc = normUpper(t.description);
  if (anyMatch(desc, SALARY_KEYWORDS) || (desc.includes('NACH') && !anyMatch(desc, ['REJECT', 'RETURN', 'BOUNCE']))) return { ...t, amount: t.amount || t.credit, employer: inferSalaryEmployer(t.description) };
  return null;
}

function inferSalaryEmployer(desc) {
  const d = normUpper(desc);
  for (const [key, name] of Object.entries(SALARY_SOURCE_MAP)) if (d.includes(key)) return name;
  const nachMatch = desc.match(/NACH\/([^\/]+)/i); if (nachMatch) return nachMatch[1].trim();
  const salMatch = desc.match(/SAL(?:ARY)?\s+(?:FOR\s+)?(?:[A-Z]{3,}\s+)?([A-Z0-9 &.-]{3,})/i); if (salMatch) return salMatch[1].trim();
  return 'Unknown Employer';
}

function detectLoanEMI(t) {
  if (t.isEMI) return { ...t, emi_amount: t.debit, bank: 'Unknown Lender', type: 'PL', loan_category: 'Personal Loan', ...extractTxnMeta(t.description) };
  if ((t.type !== 'DEBIT' && t.debit <= 0) || (t.amount < 500 && t.debit < 500)) return null;
  const desc = normUpper(t.description);
  if (!anyMatch(desc, NACH_PATTERNS) && !desc.includes('EMI') && !desc.includes('LOAN') && !desc.includes('MANDATE')) return null;
  const lender = LENDER_PATTERNS.find(p => p.regex.test(desc)), loanType = LOAN_TYPE_MAP.find(p => p.regex.test(desc));
  return { ...t, emi_amount: t.amount || t.debit, bank: lender ? lender.name : 'Unknown Lender', type: loanType ? loanType.code : 'PL', loan_category: loanType ? loanType.label : 'Personal Loan', ...extractTxnMeta(t.description) };
}

function detectLoanDisbursement(t) {
  if (t.type !== 'CREDIT' || t.amount < 5000) return null;
  const desc = normUpper(t.description);
  if (!anyMatch(desc, [/DISB/i, /LOAN/i, /FINANCE/i, /CREDIT/i]) || anyMatch(desc, SALARY_KEYWORDS)) return null;
  const lender = LENDER_PATTERNS.find(p => p.regex.test(desc)), loanType = LOAN_TYPE_MAP.find(p => p.regex.test(desc));
  return { ...t, bank: lender ? lender.name : 'Unknown Lender', loan_type: loanType ? loanType.code : 'PL', loan_category: loanType ? loanType.label : 'Personal Loan', ...extractTxnMeta(t.description) };
}

function detectAppLoan(t) {
  const desc = normUpper(t.description), app = APP_LOAN_PATTERNS.find(p => p.regex.test(desc));
  if (!app) return null;
  return { ...t, app_name: app.name, type: t.type === 'CREDIT' ? 'Credit' : 'Repayment', ...extractTxnMeta(t.description) };
}

function detectRent(t) { if (t.type === 'DEBIT' && t.amount >= 2000 && (normUpper(t.description).includes('RENT'))) return { ...t, payee: 'Unknown' }; return null; }
function detectStockMarket(t) {
  const desc = normUpper(t.description), platforms = ['ZERODHA', 'KITE', 'UPSTOX', 'GROWW', 'ANGEL', 'FYERS', '5PAISA', 'ICICI DIRECT', 'HDFC SEC', 'NUVAMA', 'EDELWEISS'];
  if (!platforms.some(p => desc.includes(p)) && !anyMatch(desc, [/NSE/i, /BSE/i, /DEMAT/i, /DP CHARGES/i])) return null;
  return { ...t, direction: t.type === 'CREDIT' ? 'credit' : 'debit', platform: platforms.find(p => desc.includes(p)) || 'Stock Market', ...extractTxnMeta(t.description) };
}
function detectInsurance(t) { if (t.type === 'DEBIT' && anyMatch(normUpper(t.description), [/INSURANCE/i, /PREMIUM/i, /LIC /i, /HDFC LIFE/i, /ICICI PRU/i])) return { ...t, provider: 'Insurance' }; return null; }
function detectUtilities(t) { if (t.type === 'DEBIT' && anyMatch(normUpper(t.description), [/ELECTRICITY/i, /WATER/i, /GAS/i, /MOBILE/i, /INTERNET/i, /RECHARGE/i])) return { ...t, category: 'Utility' }; return null; }
function detectTransfers(t) { if (anyMatch(normUpper(t.description), [/TRANSFER/i, /OWN ACC/i, /SELF/i])) return { ...t }; return null; }
function detectBounceCharges(t) { if (anyMatch(normUpper(t.description), [/RETURN/i, /BOUNCE/i, /REJECT/i, /PENALTY/i, /INSUFFICIENT/i, /FUNDS/i])) return { ...t }; return null; }
function detectCreditCardPayment(t) { if (t.type === 'DEBIT' && anyMatch(normUpper(t.description), [/CREDIT CARD/i, /CC PAYMENT/i, /CARD BILL/i])) return { ...t, ...extractTxnMeta(t.description) }; return null; }
function extractTxnMeta(desc) { const meta = {}, utrMatch = desc.match(/\b([A-Z0-9]{12,})\b/i), rrnMatch = desc.match(/\b(\d{12})\b/); if (utrMatch) meta.utr = utrMatch[1]; if (rrnMatch) meta.rrn = rrnMatch[1]; return meta; }

function computeMonthlySummary(analysis, txns) {
  const summary = {};
  for (const t of txns) {
    const month = t.date.slice(0, 7);
    if (!summary[month]) summary[month] = { credits: 0, debits: 0, salary: 0, emi: 0, apy: 0, transfers_in: 0, transfers_out: 0, closing_balance: 0 };
    if (t.type === 'CREDIT') summary[month].credits += t.amount; else summary[month].debits += t.amount;
    summary[month].closing_balance = t.balance || 0;
  }
  for (const s of analysis.salary) if (summary[s.date.slice(0, 7)]) summary[s.date.slice(0, 7)].salary += s.amount;
  for (const e of analysis.emi_payments) if (summary[e.date.slice(0, 7)]) summary[e.date.slice(0, 7)].emi += e.amount;
  for (const a of analysis.apy_pension) if (summary[a.date.slice(0, 7)]) summary[a.date.slice(0, 7)].apy += a.amount;
  for (const i of analysis.transfers_in) if (summary[i.date.slice(0, 7)]) summary[i.date.slice(0, 7)].transfers_in += i.amount;
  for (const o of analysis.transfers_out) if (summary[o.date.slice(0, 7)]) summary[o.date.slice(0, 7)].transfers_out += o.amount;
  analysis.monthly_summary = summary;
}

function computeInsights(analysis) {
  const months = Object.keys(analysis.monthly_summary); if (!months.length) return;
  analysis.insights.avg_monthly_salary = analysis.salary.reduce((s, x) => s + x.amount, 0) / months.length;
  analysis.insights.total_emi_monthly = analysis.emi_payments.reduce((s, x) => s + x.amount, 0) / months.length;
  if (analysis.insights.avg_monthly_salary > 0) analysis.insights.obligation_to_income_ratio = (analysis.insights.total_emi_monthly / analysis.insights.avg_monthly_salary) * 100;
  if (analysis.account_summary.total_credits > 0) analysis.insights.savings_rate = ((analysis.account_summary.total_credits - analysis.account_summary.total_debits) / analysis.account_summary.total_credits) * 100;
  if (analysis.insights.obligation_to_income_ratio > 50) { analysis.insights.risk_flags.push('High debt-to-income ratio'); analysis.insights.recommendations.push('Consider reducing non-essential expenses'); }
  if (analysis.bounce_charges.length > 0) { analysis.insights.risk_flags.push('Bounces detected in statement'); analysis.insights.recommendations.push('Maintain sufficient balance for EMIs'); }
}

function computeLoanSummary(analysis) {
  const summary = {};
  for (const e of analysis.emi_payments) {
    const bank = e.bank || 'Unknown';
    if (!summary[bank]) summary[bank] = { count: 0, total_paid: 0, last_emi: null };
    summary[bank].count++; summary[bank].total_paid += e.amount; summary[bank].last_emi = e.date;
  }
  analysis.loan_summary = summary;
}

module.exports = {
  LOAN_TYPE_MAP, LENDER_PATTERNS, SALARY_KEYWORDS, NACH_PATTERNS, APP_LOAN_PATTERNS, SIP_PATTERNS, SALARY_SOURCE_MAP,
  normalizeDesc, normUpper, anyMatch, parseDate, parseAmount, analyzeTransactions,
};
