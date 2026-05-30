// ============================================================
// RULE-BASED INDIAN BANK STATEMENT ANALYZER
// No AI/Ollama needed — pure regex + keyword pattern matching
// ============================================================

// ---- KEYWORD DICTIONARIES ----

const SALARY_KEYWORDS = [
  'SALARY','SAL/','SAL ','PAYROLL','STIPEND','WAGES','EPAY',
  'AI AIRPORT','INFOSYS','WIPRO','TCS','HCL','COGNIZANT','ACCENTURE',
  'NACH.*AIRPORT','NACH.*SALARY','NACH.*PAYROLL','NEFT.*SALARY'
];

const LOAN_EMI_PATTERNS = [
  { regex: /SMFG|SMFGINDIACR|SMFG INDIA/i, bank: 'SMFG India Credit', type: 'personal' },
  { regex: /HDFC.*LOAN|HDFC.*EMI|HDFCBANK.*EMI/i, bank: 'HDFC Bank', type: 'personal' },
  { regex: /SBI.*LOAN|SBI.*EMI|SBILOAN/i, bank: 'SBI', type: 'personal' },
  { regex: /ICICI.*LOAN|ICICI.*EMI/i, bank: 'ICICI Bank', type: 'personal' },
  { regex: /AXIS.*LOAN|AXIS.*EMI/i, bank: 'Axis Bank', type: 'personal' },
  { regex: /BAJAJ.*FIN|BAJAJFIN|BAJAJ FINANCE/i, bank: 'Bajaj Finance', type: 'personal' },
  { regex: /PIRAMAL|PIRAMALMORT|PIRAMAL CAP/i, bank: 'Piramal Capital', type: 'home' },
  { regex: /LIC.*HFL|LICHFL/i, bank: 'LIC Housing Finance', type: 'home' },
  { regex: /KOTAK.*LOAN|KOTAK.*EMI/i, bank: 'Kotak Bank', type: 'personal' },
  { regex: /FULLERTON|FULLERTONIND/i, bank: 'Fullerton India', type: 'personal' },
  { regex: /TATA.*CAP|TATACAP/i, bank: 'Tata Capital', type: 'personal' },
  { regex: /ADITYA.*BIRLA|ABFL/i, bank: 'Aditya Birla Finance', type: 'personal' },
  { regex: /MUTHOOT/i, bank: 'Muthoot Finance', type: 'gold' },
  { regex: /MANAPPURAM/i, bank: 'Manappuram', type: 'gold' },
  { regex: /NACH.*EMI|ECS.*EMI|ACH.*EMI/i, bank: 'Unknown Lender', type: 'personal' },
];

const NACH_PATTERNS = [
  /^NACH\//i, /^NACH\s/i, /ECS\//i, /^ACH\//i, /^EMANCH\//i, /SI\//i, /E-?MANDATE/i, /\bMANDATE\b/i, /AUTO\s*DEBIT/i
];

const APP_LOAN_PATTERNS = [
  // Popular Loan Apps
  { regex: /KREDITBEE|KREDIT BEE/i, name: 'KreditBee' },
  { regex: /LAZYPAY|LAZY PAY/i, name: 'LazyPay' },
  { regex: /MONEYTAP|MONEY TAP/i, name: 'MoneyTap' },
  { regex: /NAVI\b/i, name: 'Navi' },
  { regex: /MPOKKET|M POKKET/i, name: 'mPokket' },
  { regex: /PAYSENSE|PAY SENSE/i, name: 'PaySense' },
  { regex: /CASHE\b/i, name: 'CASHe' },
  { regex: /EARLYSALARY|EARLY.*SALARY|FIBE/i, name: 'Fibe' },
  { regex: /STASHFIN/i, name: 'StashFin' },
  { regex: /SLICE\b/i, name: 'Slice' },
  { regex: /JUPITER\b/i, name: 'Jupiter' },
  { regex: /NIRA\b/i, name: 'Nira' },
  { regex: /SMARTCOIN/i, name: 'SmartCoin' },
  { regex: /KISSHT|RING\b/i, name: 'Kissht/Ring' },
  { regex: /FREO|FREOPAY/i, name: 'Freo' },
  { regex: /ZESTMONEY|ZEST MONEY/i, name: 'ZestMoney' },
  { regex: /AXIO|CAPITALFLOAT/i, name: 'Axio' },
  { regex: /DHANI/i, name: 'Dhani' },
  { regex: /INDIALENDS/i, name: 'IndiaLends' },
  { regex: /LOANTAP/i, name: 'LoanTap' },
  { regex: /KRAZYBEE/i, name: 'KrazyBee' },
  { regex: /KREDITZY|KREDITZY/i, name: 'Kreditzy' },
  { regex: /RUPEEK/i, name: 'Rupeek' },
  { regex: /BHARATPE.*LOAN/i, name: 'BharatPe Loan' },
  { regex: /LENDINGKART/i, name: 'Lendingkart' },
  { regex: /FINNABLE/i, name: 'Finnable' },
  { regex: /OXYZO/i, name: 'Oxyzo' },
  { regex: /UGRO/i, name: 'UGRO Capital' },
  { regex: /INDIFI/i, name: 'Indifi' },
  { regex: /FAIRCENT/i, name: 'Faircent' },
];

const SIP_PATTERNS = [
  { regex: /GROWW/i, platform: 'Groww' },
  { regex: /ZERODHA.*COIN|ZERODHA.*MF/i, platform: 'Zerodha Coin' },
  { regex: /PAYTM.*MONEY|PAYTMMONEY/i, platform: 'Paytm Money' },
  { regex: /CAMS\b|CAMSONLINE/i, platform: 'CAMS' },
  { regex: /BSE.*STAR|BSESTAR/i, platform: 'BSE Star MF' },
  { regex: /MIRAE|AXIS.*MF|HDFC.*MF|SBI.*MF|ICICI.*MF|NIPPON.*MF|KOTAK.*MF|DSP.*MF|CANARA.*ROB|EDELWEISS.*MF/i, platform: 'Direct MF' },
  { regex: /MUTUAL.*FUND|MF.*SIP|SIP.*MF/i, platform: 'Mutual Fund' },
  { regex: /FRANKLIN.*TEMP|FRANKLINTEMP/i, platform: 'Franklin Templeton' },
  { regex: /MOTILAL.*OSWAL|MOTILAL/i, platform: 'Motilal Oswal' },
  { regex: /INVESCO/i, platform: 'Invesco MF' },
];




const STOCK_MARKET_PATTERNS = [
  // --- Original & Top Discount Brokers ---
  { regex: /ZERODHA|KITE\b|KITEAPP|COIN\b/i, platform: 'Zerodha' },
  { regex: /UPSTOX|UPSTX/i, platform: 'Upstox' },
  { regex: /GROWW/i, platform: 'Groww' },
  { regex: /ANGEL\s*ONE|ANGEL\s*BROKING|ANGELBRK/i, platform: 'Angel One' },
  { regex: /FYERS/i, platform: 'Fyers' },
  { regex: /5PAISA|FIVE\s*PAISA/i, platform: '5paisa' },
  { regex: /DHAN\b|RAISE\s*FIN/i, platform: 'Dhan' },
  { regex: /PAYTM\s*MONEY|PAYTMMONEY/i, platform: 'Paytm Money' },
  { regex: /ALICE\s*BLUE/i, platform: 'Alice Blue' },
  { regex: /SHOONYA|FINVASIA/i, platform: 'Shoonya by Finvasia' },
  { regex: /PROSTOCKS/i, platform: 'ProStocks' },
  { regex: /SAMCO/i, platform: 'Samco' },
  { regex: /INDMONEY/i, platform: 'INDmoney' },

  // --- Banking Brokers ---
  { regex: /ICICI\s*DIRECT|ICICIDIRECT/i, platform: 'ICICI Direct' },
  { regex: /HDFC\s*SEC|HDFCSEC|HDFC\s*SKY/i, platform: 'HDFC Securities' },
  { regex: /KOTAK\s*SEC|KOTAKSEC|KOTAK\s*NEO/i, platform: 'Kotak Securities' },
  { regex: /AXIS\s*DIRECT|AXISDIRECT/i, platform: 'Axis Direct' },
  { regex: /SBI\s*SEC|SBI\s*SECURITIES/i, platform: 'SBI Securities' },
  { regex: /IDBI\s*DIRECT|IDBIDIRECT/i, platform: 'IDBI Direct' },

  // --- Institutional, Full-Service & Wealth Managers ---
  { regex: /NUVAMA|NUVAMA\s*WEALTH|EDELWEISS\s*BROKING|EDELWEISS\s*SEC/i, platform: 'Nuvama' },
  { regex: /SHAREKHAN/i, platform: 'Sharekhan' },
  { regex: /MOTILAL\s*OSWAL|MOTILAL|MOSL/i, platform: 'Motilal Oswal' },
  { regex: /PRITHVI\s*EXCHANGE|PRITHVI\s*FIN|PRITHVI\s*SHARE|PRITHVI\s*TRADE/i, platform: 'Prithvi' },
  { regex: /CHOICE\s*FINX|CHOICE\s*BROKING/i, platform: 'Choice FinX' },
  { regex: /VENTURA/i, platform: 'Ventura Wealth' },
  { regex: /SMC\s*GLOBAL|SMC\s*EASY/i, platform: 'SMC Global' },
  { regex: /GEOJIT/i, platform: 'Geojit' },
  { regex: /IIFL|INDIA\s*INFOLINE/i, platform: 'IIFL Markets' },
  { regex: /ANAND\s*RATHI/i, platform: 'Anand Rathi' },
  { regex: /NIRMAL\s*BANG/i, platform: 'Nirmal Bang' },
  { regex: /TRADEBULLS/i, platform: 'Tradebulls' },
  { regex: /BAJAJ\s*FIN|BAJAJ\s*SECURITIES/i, platform: 'Bajaj Financial Securities' },
  { regex: /BONANZA\s*ONLINE|BONANZA\s*PORTFOLIO/i, platform: 'Bonanza' },
  { regex: /RELIGARE|DYNAMI/i, platform: 'Religare' },
  { regex: /ARIHANT\s*CAP/i, platform: 'Arihant Capital' }
];


const INSURANCE_PATTERNS = [
  { regex: /LIC\b|LICINDIA|LIC.*PREM/i, provider: 'LIC', type: 'life' },
  { regex: /HDFC.*LIFE|HDFCLIFE/i, provider: 'HDFC Life', type: 'life' },
  { regex: /ICICI.*PRU|ICICIPRU/i, provider: 'ICICI Prudential', type: 'life' },
  { regex: /SBI.*LIFE|SBILIFE/i, provider: 'SBI Life', type: 'life' },
  { regex: /MAX.*LIFE|MAXLIFE/i, provider: 'Max Life', type: 'life' },
  { regex: /BAJAJ.*ALI|BAJAJALLIANZ/i, provider: 'Bajaj Allianz', type: 'life' },
  { regex: /STAR.*HEALTH|STARHEALTH/i, provider: 'Star Health', type: 'health' },
  { regex: /NIVA.*BUPA|NIVABUPA/i, provider: 'Niva Bupa', type: 'health' },
  { regex: /CARE.*HEALTH|CAREHEALTH/i, provider: 'Care Health', type: 'health' },
  { regex: /NEW.*INDIA.*ASSU|NEWINDIAASSUR/i, provider: 'New India Assurance', type: 'health' },
  { regex: /PMSBY|PMJJBY/i, provider: 'Govt Insurance Scheme', type: 'accidental' },
  { regex: /INSURANCE.*PREM|INS.*PREM|PREM.*INS/i, provider: 'Insurance', type: 'general' },
];

const RENT_KEYWORDS = [
  'RENT','HOUSE RENT','H RENT','FLAT RENT','ROOM RENT',
  'LANDLORD','OWNER RENT','MAKAN','PG RENT','HOSTEL RENT'
];

const UTILITY_PATTERNS = [
  { regex: /MSEDCL|MSEB\b|MAHAVITARAN/i, category: 'electricity' },
  { regex: /BSES\b|BESCOM|TPDDL|TNEB|WBSEDCL/i, category: 'electricity' },
  { regex: /JIO\b|JIOFIBER|JIONET/i, category: 'internet/mobile' },
  { regex: /AIRTEL\b|BHARTI.*AIRTEL/i, category: 'mobile' },
  { regex: /VODAFONE|VODA\b|VI\b.*RECHARGE/i, category: 'mobile' },
  { regex: /BSNL\b/i, category: 'mobile' },
  { regex: /GOOGLE.*UTIL|GPAY.*UTIL|gpay.*utility/i, category: 'utility' },
  { regex: /PIPED.*GAS|MAHANAGAR.*GAS|MGL\b|IGL\b|ADANI.*GAS/i, category: 'gas' },
  { regex: /NETFLIX|AMAZON.*PRIME|HOTSTAR|DISNEY|SONY.*LIV|ZEE5/i, category: 'OTT' },
  { regex: /SWIGGY|ZOMATO/i, category: 'food delivery' },
  { regex: /IBIBO|MAKEMYTRIP|GOIBIBO|YATRA\b/i, category: 'travel' },
];

const SALARY_SOURCE_MAP = {
  'AI AIRPORT': 'AI Airport Services Ltd',
  'AIAIRPORT': 'AI Airport Services Ltd',
  'INFOSYS': 'Infosys BPO Ltd',
  'WIPRO': 'Wipro Ltd',
  'TCS': 'Tata Consultancy Services',
};

// ---- TRANSACTION PARSER ----

function parseAmount(str) {
  if (!str) return 0;
  let clean = str.toString().replace(/₹/g, '').trim();
  if (clean.startsWith('(') && clean.endsWith(')')) clean = `-${clean.slice(1, -1)}`;
  clean = clean.replace(/[,\s]/g, '');
  clean = clean.replace(/(dr|cr)$/i, '');
  return parseFloat(clean) || 0;
}

function parseDate(str) {
  if (!str) return '';
  const s = str.toString().trim().replace(/[.,]/g, '');

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const dmyDash4 = s.match(/^(\d{2})-(\d{2})-(\d{4})/);
  if (dmyDash4) return `${dmyDash4[3]}-${dmyDash4[2]}-${dmyDash4[1]}`;

  const dmySlash4 = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (dmySlash4) return `${dmySlash4[3]}-${dmySlash4[2]}-${dmySlash4[1]}`;

  const dmyDash2 = s.match(/^(\d{2})-(\d{2})-(\d{2})/);
  if (dmyDash2) return `20${dmyDash2[3]}-${dmyDash2[2]}-${dmyDash2[1]}`;

  const dmySlash2 = s.match(/^(\d{2})\/(\d{2})\/(\d{2})/);
  if (dmySlash2) return `20${dmySlash2[3]}-${dmySlash2[2]}-${dmySlash2[1]}`;

  const mon = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

  const dMonY = s.match(/^(\d{2})[-\/\s]([A-Za-z]{3})[-\/\s](\d{2,4})/);
  if (dMonY) {
    const mm = mon[dMonY[2].toLowerCase()];
    const yyyy = dMonY[3].length === 2 ? `20${dMonY[3]}` : dMonY[3];
    if (mm) return `${yyyy}-${mm}-${dMonY[1]}`;
  }

  return s.split(' ')[0];
}

function inferSalaryEmployer(desc) {
  const s = (desc || '').toString();
  const upper = s.toUpperCase();

  for (const [key, name] of Object.entries(SALARY_SOURCE_MAP)) {
    if (upper.includes(key)) return name;
  }

  const fromMarkers = [
    /(?:SALARY|PAYROLL|WAGES|STIPEND)\s*(?:FOR\s*[A-Z]{3,9}\s*\d{2,4})?\s*[:\-\/]*\s*([A-Z0-9 &.,()]{3,80})/i,
    /(?:NEFT|IMPS|RTGS|UPI)\s*[:\-\/]*\s*(?:SALARY|PAYROLL)\s*[:\-\/]*\s*([A-Z0-9 &.,()]{3,80})/i,
    /(?:SAL|SALARY)\s*[:\-\/]\s*([A-Z0-9 &.,()]{3,80})/i,
  ];
  for (const re of fromMarkers) {
    const m = s.match(re);
    if (m && m[1]) {
      const cleaned = m[1]
        .replace(/\b(?:SALARY|PAYROLL|WAGES|STIPEND|FOR|MONTH|MTH|NEFT|IMPS|RTGS|UPI|NACH|ACH|ECS)\b/gi, ' ')
        .replace(/\b(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\b/gi, ' ')
        .replace(/\b20\d{2}\b/g, ' ')
        .replace(/\b\d{1,2}\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (cleaned.length >= 3) return cleaned.slice(0, 60);
    }
  }

  const nachToken = inferAutoDebitLender(s);
  if (nachToken) return nachToken;

  const m = upper.match(/\b(?:SALARY|PAYROLL|WAGES|STIPEND)\b[\s:\-\/]*([A-Z][A-Z0-9 &]{2,50})/);
  if (m && m[1]) return m[1].replace(/\s+/g, ' ').trim().slice(0, 60);

  return 'Salary Credit';
}

function detectSalary(desc, amount) {
  const d = desc.toUpperCase();
  for (const kw of SALARY_KEYWORDS) {
    if (new RegExp(kw, 'i').test(d)) {
      return inferSalaryEmployer(desc);
    }
  }
  return null;
}

function detectLoanEMI(desc, amount) {
  const d = desc.toUpperCase();
  for (const p of LOAN_EMI_PATTERNS) {
    if (p.regex.test(desc)) {
      const inferredBank = p.bank === 'Unknown Lender' ? inferAutoDebitLender(desc) : '';
      return { bank: inferredBank || p.bank, type: inferLoanType(desc) || p.type };
    }
  }
  const isAutoDebit = NACH_PATTERNS.some(p => p.test(desc));
  if (!isAutoDebit && !/EMI|LOAN\s*INST|INSTALMENT/i.test(d)) return null;
  // Generic NACH debit with large round amount = likely EMI
  if (isAutoDebit && amount >= 500) {
    return { bank: inferAutoDebitLender(desc) || 'Unknown Lender (NACH)', type: inferLoanType(desc) || 'personal' };
  }
  return null;
}

function inferAutoDebitLender(desc) {
  const s = (desc || '').toString();
  const m = s.match(/(?:^|\b)(?:NACH|ACH|ECS|SI|EMANCH)\/([^\/\s]+)/i);
  if (!m) return '';
  const token = (m[1] || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 24);
  if (token.length < 3) return '';
  return token.toUpperCase();
}

function inferLoanType(desc) {
  const d = (desc || '').toUpperCase();
  if (/(HOUSING|HOME\s*LOAN|\bHL\b|MORTGAGE|LAP\b|LOAN\s*AGAINST\s*PROPERTY)/i.test(d)) return 'home';
  if (/(CAR\s*LOAN|AUTO\s*LOAN|VEHICLE\s*LOAN|\bAL\b|\bVL\b)/i.test(d)) return 'car';
  if (/(EDUCATION\s*LOAN|STUDENT\s*LOAN|\bEL\b)/i.test(d)) return 'education';
  if (/(BUSINESS\s*LOAN|\bBL\b|SME\s*LOAN|MSME\s*LOAN|WORKING\s*CAPITAL|OD\s*LOAN|OVERDRAFT)/i.test(d)) return 'business';
  if (/(GOLD\s*LOAN|\bGL\b|MUTHOOT|MANAPPURAM)/i.test(d)) return 'gold';
  if (/(PERSONAL\s*LOAN|\bPL\b)/i.test(d)) return 'personal';
  return '';
}

function loanTypeCode(type) {
  switch ((type || '').toLowerCase()) {
    case 'home': return 'HL';
    case 'car': return 'AL';
    case 'education': return 'EL';
    case 'business': return 'BL';
    case 'gold': return 'GL';
    case 'personal': return 'PL';
    default: return 'OTHER';
  }
}

function extractTxnMeta(desc, tx) {
  const text = (desc || '').toString();
  const upper = text.toUpperCase();

  let rawObj = null;
  if (tx && typeof tx.raw === 'string' && tx.raw.trim().startsWith('{')) {
    try { rawObj = JSON.parse(tx.raw); } catch {}
  }

  const pullFromRaw = (patterns) => {
    if (!rawObj) return '';
    for (const [k, v] of Object.entries(rawObj)) {
      if (v === undefined || v === null || v === '') continue;
      const key = k.toString();
      for (const p of patterns) {
        if (new RegExp(p, 'i').test(key)) return v.toString();
      }
    }
    return '';
  };

  const find = (re) => {
    const m = text.match(re);
    return m ? (m[1] || '').trim() : '';
  };

  const utr = find(/\bUTR[:\s\-]*([A-Z0-9]{10,25})\b/i) || pullFromRaw(['utr']);
  const rrn = find(/\bRRN[:\s\-]*([0-9]{10,18})\b/i) || pullFromRaw(['rrn', 'retrieval.*ref', 'retrieval.*no']);
  const reference_id = find(/\bREF(?:ERENCE)?[:\s\-]*([A-Z0-9\-]{6,30})\b/i) || pullFromRaw(['ref', 'reference']);
  const txn_id = find(/\bTRAN(?:SACTION)?\s*ID[:\s\-]*([A-Z0-9\-]{6,30})\b/i) || pullFromRaw(['tran.*id', 'txn.*id', 'transaction.*id']);
  const cheque_no = find(/\bCHQ(?:UE)?\s*(?:NO|NUMBER)?[:\s\-]*([0-9]{4,10})\b/i) || pullFromRaw(['chq', 'cheque']);
  const nach_umrn = find(/\bUMRN[:\s\-]*([A-Z0-9]{10,30})\b/i) || pullFromRaw(['umrn']);
  const mandate_id = find(/\bMANDATE[:\s\-]*([A-Z0-9\-]{6,30})\b/i) || pullFromRaw(['mandate']);
  const disbursement_id = find(/\bDISB(?:URSEMENT)?\s*(?:ID|NO|#)[:\s\-]*([A-Z0-9\-]{6,30})\b/i);

  const loan_account_raw =
    find(/\bLOAN\s*(?:A\/C|AC|ACCOUNT)\s*(?:NO|NUMBER)?[:\s\-]*([Xx*]*\d{3,10})\b/i) ||
    find(/\bA\/C\s*(?:NO|NUMBER)?[:\s\-]*([Xx*]*\d{3,10})\b/i) ||
    pullFromRaw(['loan.*ac', 'loan.*account', 'account.*no', '^ac$', '^a/c$']);

  const loan_account_masked = loan_account_raw ? loan_account_raw.replace(/[^0-9Xx*]/g, '').slice(-10) : '';

  const lender_raw = inferAutoDebitLender(text);
  const lender_normalized = lender_raw;

  let emi_cycle = '';
  if (/\bMONTHLY\b/i.test(upper) || /\bMTHLY\b/i.test(upper)) emi_cycle = 'MONTHLY';
  else if (/\bQUARTERLY\b/i.test(upper)) emi_cycle = 'QUARTERLY';
  else if (/\bWEEKLY\b/i.test(upper)) emi_cycle = 'WEEKLY';

  const emiDayMatch = upper.match(/\bEMI(?:\s*ON)?\s*(\d{1,2})(?:ST|ND|RD|TH)?\b/);
  const emi_day = emiDayMatch ? emiDayMatch[1] : '';

  const principal_raw = find(/\bPRIN(?:CIPAL)?[:\s\-]*([\d,]+\.\d{2})\b/i);
  const interest_raw = find(/\bINT(?:EREST)?[:\s\-]*([\d,]+\.\d{2})\b/i);
  const principal_amount = principal_raw ? parseAmount(principal_raw) : 0;
  const interest_amount = interest_raw ? parseAmount(interest_raw) : 0;

  const src = tx && tx._source ? tx._source : null;
  const source_type = src ? (src.type || '') : '';
  const source_sheet = src ? (src.sheet || '') : '';
  const source_row = src && src.row !== undefined ? src.row : undefined;
  const source_line_start = src && src.line_start !== undefined ? src.line_start : undefined;
  const source_line_end = src && src.line_end !== undefined ? src.line_end : undefined;
  const source_page = src && src.page !== undefined ? src.page : undefined;
  const source_excerpt = tx && tx.source_excerpt ? tx.source_excerpt : '';

  return {
    reference_id: reference_id || undefined,
    utr: utr || undefined,
    rrn: rrn || undefined,
    mandate_id: mandate_id || undefined,
    nach_umrn: nach_umrn || undefined,
    loan_account_masked: loan_account_masked || undefined,
    lender_raw: lender_raw || undefined,
    lender_normalized: lender_normalized || undefined,
    txn_id: txn_id || undefined,
    cheque_no: cheque_no || undefined,
    disbursement_id: disbursement_id || undefined,
    emi_cycle: emi_cycle || undefined,
    emi_day: emi_day || undefined,
    principal_amount: principal_amount || undefined,
    interest_amount: interest_amount || undefined,
    processing_fee: undefined,
    source_type: source_type || undefined,
    source_sheet: source_sheet || undefined,
    source_row: source_row,
    source_line_start: source_line_start,
    source_line_end: source_line_end,
    source_page: source_page,
    source_excerpt: source_excerpt || undefined,
  };
}

function detectLoanDisbursement(desc, amount) {
  if (!desc || !amount) return null;
  const d = desc.toUpperCase();
  const isDisb = /(DISB|DISBUR|DISBURSEMENT|LOAN\s*DISB|LOAN\s*DISBUR|DISBURSAL|DISB\.|DISBUR\.)/i.test(d);
  const isLikelyLoan = isDisb || (/\bLOAN\b/i.test(d) && /(CREDIT|CR|BY\s+TRANSFER|BY\s+NEFT|NEFT|IMPS|RTGS)/i.test(d));
  if (!isLikelyLoan) return null;
  if (amount < 5000) return null;

  let lender = '';
  for (const p of LOAN_EMI_PATTERNS) {
    if (p.regex.test(desc)) { lender = p.bank; break; }
  }
  if (!lender) {
    const m = d.match(/(HDFC|ICICI|SBI|AXIS|KOTAK|IDFC|YES\s*BANK|INDUSIND|PNB|BOB|CANARA|UNION\s*BANK|CENTRAL\s*BANK|IOB|UCO|FEDERAL|RBL|AU\s*BANK|BANDHAN|IDBI)/i);
    if (m) lender = m[0].replace(/\s+/g, ' ').trim();
  }

  return { lender: lender || 'Loan Disbursement', type: inferLoanType(desc) || 'personal' };
}

function detectAppLoan(desc) {
  for (const p of APP_LOAN_PATTERNS) {
    if (p.regex.test(desc)) return p.name;
  }
  return null;
}

function detectSIP(desc) {
  const d = (desc || '').toUpperCase();
  const isMf = /\bMF\b|MUTUAL|SIP|FOLIO|AMC\b|CAMS\b|KFIN|KARVY/i.test(d);
  const stockKw = /\bNSE\b|\bBSE\b|EQUITY|STOCK|SHARE|BROKING|DP\s*CHARGES|DEMAT|CDSL|NSDL|PAYOUT|PAYIN|MARGIN|\bFNO\b|F&O|FUTURES|OPTIONS|INTRADAY|DELIVERY|\bIPO\b/i.test(d);
  if (stockKw) return null;
  for (const p of SIP_PATTERNS) {
    if (!p.regex.test(desc)) continue;
    if (!isMf && /GROWW|ZERODHA|PAYTM|MOTILAL/i.test(p.platform)) continue;
    return p.platform;
  }
  return null;
}

function detectStockMarket(desc) {
  if (!desc) return null;
  const d = desc.toUpperCase();
  const isMf = /\bMF\b|MUTUAL|SIP|FOLIO|AMC\b|CAMS\b|KFIN|KARVY/i.test(d);
  const stockKw = /\bNSE\b|\bBSE\b|EQUITY|STOCK|SHARE|BROKING|DP\s*CHARGES|DEMAT|CDSL|NSDL|PAYOUT|PAYIN|MARGIN|\bFNO\b|F&O|FUTURES|OPTIONS|INTRADAY|DELIVERY|\bIPO\b/i.test(d);

  for (const p of STOCK_MARKET_PATTERNS) {
    if (!p.regex.test(desc)) continue;
    if (isMf && !stockKw) return null;
    return { platform: p.platform };
  }

  if (stockKw && !isMf) return { platform: 'Stock Market' };
  return null;
}

function detectInsurance(desc) {
  for (const p of INSURANCE_PATTERNS) {
    if (p.regex.test(desc)) return { provider: p.provider, type: p.type };
  }
  return null;
}

function detectRent(desc, amount) {
  const d = desc.toUpperCase();
  for (const kw of RENT_KEYWORDS) {
    if (d.includes(kw)) return true;
  }
  return false;
}

function detectUtility(desc) {
  for (const p of UTILITY_PATTERNS) {
    if (p.regex.test(desc)) return p.category;
  }
  return null;
}

function detectAPY(desc) {
  return /APY|ATAL.*PENSION|TRTR.*APY/i.test(desc);
}

function detectCreditCard(desc) {
  const text = desc.toUpperCase();

  const patterns = [
    /CREDIT\s*CARD/,
    /CRDT\s*CARD/,
    /CARD\s*PAYMENT/,
    /CARD\s*PMT/,
    /CARD\s*DUE/,
    /CC\s*PAY/,
    /CC\s*PMT/,
    /CC\s*PAYMENT/,
    /CREDITCARD/,
    /CARD\s*BILL/,
    /BILLDESK.*CARD/,
    /EASYPAY.*CARD/,
    /PAYTM.*CARD/,
    /CRED/,
    /CHEQ/,
    /CREDIT\s*CARD\s*BILL/,
    /VISA.*PAYMENT/,
    /MASTERCARD.*PAYMENT/,
    /RUPAY.*PAYMENT/,
  ];

  return patterns.some(pattern => pattern.test(text));
}

function detectPF(desc) {
  return /EPFO|EMPLOYEE.*PROVIDENT|PROVIDENT.*FUND|EPF\b/i.test(desc);
}

function detectPiramalDisbursement(desc, amount, isCredit) {
  return isCredit && /PIRAMAL/i.test(desc) && amount > 50000;
}

function detectTransfer(desc) {
  const d = desc.toUpperCase();
  if (/NISHIKAN|NISHIKANT/i.test(d)) {
    return d.includes('/CR/') || d.includes('UPIAB') ? 'in' : 'out';
  }
  return null;
}

// ---- MONTH KEY ----
function monthKey(dateStr) {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr.slice(0, 7);
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

// ---- MAIN ANALYZER ----
function analyzeTransactions(transactions) {
  const result = {
    account_summary: {
      total_credits: 0,
      total_debits: 0,
      net_balance: 0,
      transaction_count: transactions.length,
      period: '',
      opening_balance: 0,
      closing_balance: 0,
    },
    salary: [],
    other_income: [],
    loans: [],
    rent: [],
    sip_investments: [],
    insurance: [],
    app_loans: [],
    utilities: [],
    pf_credits: [],
    loan_disbursements: [],
    credit_card_payments: [],
    stock_market: [],
    apy_pension: [],
    family_transfers: { out: [], in: [] },
    monthly_summary: {},
    insights: {
      obligation_to_income_ratio: 0,
      savings_rate: 0,
      avg_monthly_salary: 0,
      total_emi_monthly: 0,
      risk_flags: [],
      recommendations: [],
    }
  };

  if (!transactions.length) return result;

  // Sort by date
  transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
  result.account_summary.period = `${transactions[0].date} to ${transactions[transactions.length-1].date}`;

  const emiSeen = new Set();
  const processingFees = [];

  for (const tx of transactions) {
    const desc = (tx.description || tx.remarks || '').trim();
    const debit = parseAmount(tx.debit || tx.withdrawal || 0);
    const credit = parseAmount(tx.credit || tx.deposit || 0);
    const amount = debit || credit;
    const isCredit = credit > 0;
    const isDebit = debit > 0;
    const date = tx.date || '';
    const balance = parseAmount(tx.balance || 0);
    const month = monthKey(date);
    const meta = extractTxnMeta(desc, tx);

    // Monthly summary
    if (!result.monthly_summary[month]) {
      result.monthly_summary[month] = {
        credits: 0, debits: 0, salary: 0, emi: 0,
        piramal_emi: 0, smfg_emi: 0, apy: 0,
        closing_balance: 0, transfers_out: 0, transfers_in: 0
      };
    }
    const ms = result.monthly_summary[month];
    if (isCredit) { ms.credits += credit; result.account_summary.total_credits += credit; }
    if (isDebit) { ms.debits += debit; result.account_summary.total_debits += debit; }
    if (balance > 0) ms.closing_balance = balance;

    // ---- SALARY ----
    if (isCredit) {
      const employer = detectSalary(desc, credit);
      if (employer) {
        result.salary.push({ date, employer, amount: credit, mode: 'NACH/NEFT', description: desc, ...meta });
        ms.salary += credit;
        result.insights.avg_monthly_salary += credit;
        continue;
      }

      // PF Credit
      if (detectPF(desc)) {
        result.pf_credits.push({ date, description: desc, amount: credit, ...meta });
        result.other_income.push({ date, description: 'PF / EPFO Credit', amount: credit, type: 'pf' });
        continue;
      }

      // Piramal disbursement
      const disb = detectLoanDisbursement(desc, credit) || (detectPiramalDisbursement(desc, credit, true) ? { lender: 'Piramal Capital', type: 'home' } : null);
      if (disb) {
        result.loan_disbursements.push({ date, lender: disb.lender, amount: credit, description: desc, loan_type: loanTypeCode(disb.type), loan_category: disb.type, ...meta });
        result.other_income.push({ date, description: 'Loan Disbursement', amount: credit, type: 'loan_credit' });
        continue;
      }

      const smCredit = detectStockMarket(desc);
      if (smCredit) {
        result.stock_market.push({ date, direction: 'credit', platform: smCredit.platform, amount: credit, description: desc, ...meta });
        continue;
      }

      // Family transfer IN
      const transferDir = detectTransfer(desc);
      if (transferDir === 'in') {
        result.family_transfers.in.push({ date, from: 'NISHIKANT HIRE', amount: credit, description: desc, ...meta });
        ms.transfers_in += credit;
        continue;
      }

      // Other credits
      result.other_income.push({ date, description: desc.slice(0, 60), amount: credit, type: 'other' });
    }

    if (isDebit) {
      if (/PROCESSING\s*FEE|DOC(?:UMENTATION)?\s*CHARGES?|STAMP\s*DUTY|DISBURSAL\s*CHARGES?|LOAN\s*CHARGES?|PF\s*FEE/i.test(desc)) {
        processingFees.push({ date, amount: debit, description: desc, ...meta });
      }

      // ---- APY ----
      if (detectAPY(desc)) {
        result.apy_pension.push({ date, description: desc, amount: debit, ...meta });
        ms.apy += debit;
        continue;
      }

      // ---- LOAN EMI ----
      const loanInfo = detectLoanEMI(desc, debit);
      if (loanInfo) {
        const key = `${date}|${loanInfo.bank}|${loanInfo.type}|${debit}`;
        if (emiSeen.has(key)) continue;
        emiSeen.add(key);
        result.loans.push({ date, bank: loanInfo.bank, type: loanTypeCode(loanInfo.type), loan_category: loanInfo.type, emi_amount: debit, description: desc, ...meta });
        ms.emi += debit;
        if (/SMFG/i.test(desc)) ms.smfg_emi += debit;
        if (/PIRAMAL/i.test(desc)) ms.piramal_emi += debit;
        continue;
      }

      // ---- INSURANCE ----
      const ins = detectInsurance(desc);
      if (ins) {
        result.insurance.push({ date, provider: ins.provider, policy_type: ins.type, amount: debit, description: desc, ...meta });
        continue;
      }

      const smDebit = detectStockMarket(desc);
      if (smDebit) {
        result.stock_market.push({ date, direction: 'debit', platform: smDebit.platform, amount: debit, description: desc, ...meta });
        continue;
      }

      // ---- SIP ----
      const sip = detectSIP(desc);
      if (sip) {
        result.sip_investments.push({ date, fund_name: desc.slice(0, 50), platform: sip, amount: debit, description: desc, ...meta });
        continue;
      }

      // ---- APP LOANS ----
      const appLoan = detectAppLoan(desc);
      if (appLoan) {
        result.app_loans.push({ date, app_name: appLoan, amount: debit, type: 'repayment', description: desc, ...meta });
        continue;
      }

      // ---- RENT ----
      if (detectRent(desc, debit)) {
        result.rent.push({ date, payee: desc.slice(0, 40), amount: debit, description: desc, mode: 'UPI', ...meta });
        continue;
      }

      // ---- CREDIT CARD ----
      if (detectCreditCard(desc)) {
        result.credit_card_payments.push({ date, description: desc, amount: debit, ...meta });
        continue;
      }

      // ---- FAMILY TRANSFERS OUT ----
      const transferDir = detectTransfer(desc);
      if (transferDir === 'out') {
        result.family_transfers.out.push({ date, to: 'NISHIKANT HIRE', amount: debit, description: desc, ...meta });
        ms.transfers_out += debit;
        continue;
      }

      // ---- UTILITIES ----
      const util = detectUtility(desc);
      if (util) {
        result.utilities.push({ date, description: desc.slice(0, 50), amount: debit, category: util, ...meta });
        continue;
      }
    }
  }

  if (processingFees.length && result.loan_disbursements.length) {
    const byMonth = {};
    for (const d of result.loan_disbursements) {
      const m = monthKey(d.date);
      if (!byMonth[m]) byMonth[m] = [];
      byMonth[m].push(d);
    }

    for (const fee of processingFees) {
      const feeMonth = monthKey(fee.date);
      const candidates = byMonth[feeMonth] || [];
      if (!candidates.length) continue;

      let picked = null;
      const feeDate = new Date(fee.date);
      if (!isNaN(feeDate)) {
        for (const d of candidates) {
          const disbDate = new Date(d.date);
          if (isNaN(disbDate)) continue;
          const days = Math.abs((feeDate - disbDate) / (1000 * 60 * 60 * 24));
          if (days <= 7) { picked = d; break; }
        }
      }
      if (!picked && candidates.length === 1) picked = candidates[0];
      if (!picked) continue;
      picked.processing_fee = (picked.processing_fee || 0) + (fee.amount || 0);
    }
  }

  // ---- COMPUTE INSIGHTS ----
  const salaryMonths = result.salary.length > 0 ? new Set(result.salary.map(s => monthKey(s.date))).size : 1;
  result.insights.avg_monthly_salary = result.salary.reduce((s, x) => s + x.amount, 0) / salaryMonths;

  // Unique monthly EMI
  const emiByBank = {};
  for (const l of result.loans) {
    if (!emiByBank[l.bank] || l.emi_amount > emiByBank[l.bank]) emiByBank[l.bank] = l.emi_amount;
  }
  result.insights.total_emi_monthly = Object.values(emiByBank).reduce((a, b) => a + b, 0);

  const apyMonthly = result.apy_pension.length > 0 ?
    result.apy_pension.reduce((s, x) => s + x.amount, 0) / salaryMonths : 0;

  const totalObligations = result.insights.total_emi_monthly + apyMonthly;
  result.insights.obligation_to_income_ratio = result.insights.avg_monthly_salary > 0
    ? Math.round((totalObligations / result.insights.avg_monthly_salary) * 100)
    : 0;

  const avgCredit = result.account_summary.total_credits / salaryMonths;
  const avgDebit = result.account_summary.total_debits / salaryMonths;
  result.insights.savings_rate = avgCredit > 0
    ? Math.round(((avgCredit - avgDebit) / avgCredit) * 100)
    : 0;

  result.account_summary.net_balance =
    result.account_summary.total_credits - result.account_summary.total_debits;

  // Risk Flags
  const R = result.insights.risk_flags;
  if (result.insights.obligation_to_income_ratio > 60)
    R.push(`EMI obligation ratio is ${result.insights.obligation_to_income_ratio}% — dangerously high (safe limit: 40%)`);
  else if (result.insights.obligation_to_income_ratio > 40)
    R.push(`EMI obligation ratio is ${result.insights.obligation_to_income_ratio}% — moderate risk`);

  const minBalance = Math.min(...transactions.filter(t => t.balance).map(t => parseAmount(t.balance)));
  if (minBalance < 500)
    R.push(`Balance dropped to ₹${minBalance.toFixed(2)} — near-zero cash at least once`);

  if (result.app_loans.length > 0)
    R.push(`${result.app_loans.length} app loan repayment(s) detected — high interest debt risk`);

  if (result.loan_disbursements.length > 0)
    R.push(`Fresh loan disbursement of ₹${fmt(result.loan_disbursements[0].amount)} detected — new debt taken`);

  const totalTransferOut = result.family_transfers.out.reduce((s, x) => s + x.amount, 0);
  if (totalTransferOut > 100000)
    R.push(`₹${fmt(totalTransferOut)} transferred to family (NISHIKANT) — account used as pass-through`);

  if (result.sip_investments.length === 0)
    R.push('No SIP/mutual fund investment detected in this period');
  if (result.insurance.filter(i => i.policy_type === 'life').length === 0)
    R.push('No life insurance premium detected — financial protection gap');

  const ccTotal = result.credit_card_payments.reduce((s, x) => s + x.amount, 0);
  if (ccTotal > 0) R.push(`Credit card payments: ₹${fmt(ccTotal)} — monitor revolving debt`);

  // Recommendations
  const Rec = result.insights.recommendations;
  if (result.sip_investments.length === 0)
    Rec.push('Start a monthly SIP — even ₹1,000/month in index funds builds long-term wealth');
  if (result.insurance.length === 0)
    Rec.push('Get term life insurance (₹1Cr cover costs ~₹700/month) and health insurance');
  if (result.insights.obligation_to_income_ratio > 50)
    Rec.push('Consider loan consolidation or pre-payment to reduce EMI burden below 40% of income');
  if (totalTransferOut > 100000)
    Rec.push('Consolidate family finances — reduce inter-account transfers to improve cash visibility');
  if (result.pf_credits.length > 0)
    Rec.push('PF withdrawals detected — consider keeping PF invested for retirement corpus');

  return result;
}

function fmt(n) {
  if (!n) return '0';
  if (n >= 100000) return `${(n/100000).toFixed(2)}L`;
  if (n >= 1000) return `${(n/1000).toFixed(1)}K`;
  return n.toFixed(0);
}

module.exports = { analyzeTransactions, parseAmount, parseDate };
