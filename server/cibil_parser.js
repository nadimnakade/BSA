// CIBIL REPORT PARSER
// Optimized for messy text reports, horizontal tables, and multi-row enquiries
// ===========================================================================

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

// ── LENDER REGISTRY (Standardized Names) ──────────────────────────
const LENDER_PATTERNS = [
  // Public Sector Banks
  { regex: /\bSBIN\b|STATE.*BANK.*INDIA|\bSBI\b/i,       name:'State Bank of India (SBI)',        category:'PSB' },
  { regex: /\bUBIN\b|UNION.*BANK/i,                       name:'Union Bank of India',               category:'PSB' },
  { regex: /\bPUNB\b|PUNJAB.*NATIONAL|\bPNB\b/i,          name:'Punjab National Bank (PNB)',         category:'PSB' },
  { regex: /\bBARB\b|BANK.*BARODA|\bBOB\b/i,              name:'Bank of Baroda (BOB)',               category:'PSB' },
  { regex: /\bCNRB\b|CANARA.*BANK/i,                      name:'Canara Bank',                        category:'PSB' },
  { regex: /\bIOBA\b|INDIAN.*OVERSEAS/i,                  name:'Indian Overseas Bank (IOB)',          category:'PSB' },
  { regex: /\bBKID\b|BANK.*INDIA\b/i,                     name:'Bank of India (BOI)',                 category:'PSB' },
  { regex: /\bMAHB\b|BANK.*MAHARASHTRA/i,                 name:'Bank of Maharashtra',                category:'PSB' },
  { regex: /CENTRAL.*BANK.*INDIA|\bCBIN\b/i,              name:'Central Bank of India',              category:'PSB' },
  { regex: /\bUCO\b|UCO.*BANK/i,                          name:'UCO Bank',                           category:'PSB' },
  // Private Sector Banks
  { regex: /\bHDFC\b|HDFCBANK/i,                          name:'HDFC Bank',                          category:'Pvt' },
  { regex: /ICICI|ICICIBANK/i,                            name:'ICICI Bank',                         category:'Pvt' },
  { regex: /\bUTIB\b|AXIS.*BANK|AXISBANK/i,               name:'Axis Bank',                          category:'Pvt' },
  { regex: /\bKKBK\b|KOTAK/i,                             name:'Kotak Mahindra Bank',                 category:'Pvt' },
  { regex: /\bYESB\b|YES.*BANK|YESBANK/i,                 name:'Yes Bank',                           category:'Pvt' },
  { regex: /\bINDB\b|INDUSIND|INDUS.*IND/i,               name:'IndusInd Bank',                      category:'Pvt' },
  { regex: /\bFDRL\b|FEDERAL.*BANK/i,                     name:'Federal Bank',                       category:'Pvt' },
  { regex: /\bIDFB\b|IDFC/i,                              name:'IDFC First Bank',                    category:'Pvt' },
  { regex: /\bIBKL\b|\bIDBI\b/i,                          name:'IDBI Bank',                          category:'Pvt' },
  { regex: /\bIDIB\b|INDIAN.*BANK/i,                      name:'Indian Bank',                        category:'PSB' },
  { regex: /\bRBLB\b|\bRBL\b/i,                           name:'RBL Bank',                           category:'Pvt' },
  { regex: /\bBAND\b|BANDHAN/i,                           name:'Bandhan Bank',                       category:'Pvt' },
  { regex: /\bAUBK\b|AU.*SMALL|AU.*FINANCE/i,             name:'AU Small Finance Bank',              category:'SFB' },
];

function normalizeLenderName(rawName) {
  if (!rawName) return rawName;
  const d = rawName.toUpperCase().replace(/\s+/g, '');
  
  // High priority exact matches - very explicit to prevent misidentification
  if (d.includes('INDUSIND')) return 'IndusInd Bank';
  if (d.includes('ICICI')) return 'ICICI Bank';
  if (d.includes('IDFC')) return 'IDFC First Bank';
  if (d.includes('HDFC')) return 'HDFC Bank';
  if (d.includes('AXIS')) return 'Axis Bank';
  if (d.includes('KOTAK')) return 'Kotak Mahindra Bank';
  if (d.includes('YESBANK')) return 'Yes Bank';
  if (d.includes('SBIN') || d.includes('STATEBANK')) return 'State Bank of India (SBI)';
  if (d.includes('CITI')) return 'CITIBANK';
  if (d.includes('SCB') || d.includes('STANDARDCHARTERED')) return 'SCB';
  if (d.includes('AMEX') || d.includes('AMERICANEXPRESS')) return 'AMEX';

  for (const p of LENDER_PATTERNS) {
    if (p.regex.test(d) || p.regex.test(rawName)) return p.name;
  }
  return rawName;
}

/**
 * Pre-process CIBIL text from dense single-line-per-page format.
 * Many CIBIL PDFs (from Paisabazaar, CIBIL portal, etc.) extract as one long line per page.
 * This function detects that format and splits into proper multi-line text.
 */
function preprocessCibilText(rawText) {
  const text = (rawText || '').toString();
  const rawLines = text.split('\n').map(x => x.trim()).filter(Boolean);

  // Heuristic: if we have very few lines but lots of content, it's a dense format
  const totalChars = text.length;
  const avgLineLen = rawLines.length > 0 ? totalChars / rawLines.length : 0;
  if (rawLines.length > 150 || avgLineLen < 200) return text; // Already multi-line, no processing needed

  // Remove repeated page headers: "Report Number (ECN) : ... Report to CIBIL   Table of Contents"
  let cleaned = text.replace(/Report Number \(ECN\)\s*:\s*\d+\s*Report Date\s*:\s*\d{2}-\d{2}-\d{4}\s*Report to CIBIL\s*Table of Contents/gi, '\n');

  // Remove noise text that appears at end of pages
  cleaned = cleaned.replace(/This section (?:has information|shows|displays)[^.]*\./gi, '\n');
  cleaned = cleaned.replace(/Paid on time\s+1-89 days late\s+90\+ days late\s+Not Reported/gi, '\n');
  cleaned = cleaned.replace(/Powered by/gi, '');

  // Split Account Detail blocks: Each starts with "LENDER_NAME   Active/Closed  Account Number:"
  // Pattern: "BANKNAME   Active  Account Number:   XXXX1234"
  cleaned = cleaned.replace(/(?=(?:^|\s{2,})([A-Z][A-Z0-9 &.'\-]{2,40})\s{2,}(Active\*{0,2}|Closed)\s{2,}Account Number\s*:\s*)/gi, '\n---ACCOUNT_BREAK---\n');

  // Split summary section rows: Detect "LENDER_NAME   Loan Type   XXXX1234   Individual/Guarantor/Joint"
  // This is the summary table format
  const loanTypePattern = '(?:Personal Loan|Education Loan|Home Loan|Housing Loan|Vehicle Loan|Two Wheeler Loan|Used Car Loan|Gold Loan|Business Loan(?: General)?|Consumer Loan|Loan Against Property|Property Loan|Overdraft|Credit Card|Loan on Credit Card|Other)';

  // Split enquiry rows: "1   Personal Loan   KOTAK BANK   27-12-2025"
  // Pattern: number + purpose + institution + date
  cleaned = cleaned.replace(new RegExp(`(?=\\s{2,}(\\d{1,3})\\s{2,}(${loanTypePattern}|Credit Card|Other)\\s{2,}([A-Z][A-Z0-9 &.'\-]{2,60})\\s{2,}(\\d{2}-\\d{2}-\\d{4}))`, 'gi'), '\n');

  // Split summary table rows before each bank/institution name followed by loan type and account number
  cleaned = cleaned.replace(new RegExp(`(?=\\s{2,}([A-Z][A-Z0-9 &.'\-]{2,40})\\s{2,}(${loanTypePattern})\\s{2,}(XXXX[A-Z0-9\\-]{2,10}|[A-Z0-9X*]{4,}))`, 'gi'), '\n');

  // Split field labels in Account Details sections onto their own lines
  const fieldLabels = [
    'Account Opened Date', 'Account Closed Date', 'Last Bank Update',
    'Last Payment Date', 'Pay Start Date', 'Pay End Date', 'Repayment Tenure',
    'Loan Amount', 'Settlement Amount', 'Overdue Amount', 'EMI Amount',
    'Outstanding Balance', 'Credit Limit', 'Actual Last Payment',
    'Interest Rate', 'Collateral Type', 'Collateral', 'Suit Filed Status',
    'Cash Limit', 'Payment Frequency', 'Maximum Utilization',
    'Account Number', 'Account type', 'Account Status', 'Ownership',
    'Account Details', 'Payment History',
    'Written-O[\\x00\\uFFFD]?\\s*Principal\\s*Amount',
    'Written-O[\\x00\\uFFFD]?\\s*Total\\s*Amount',
  ];
  for (const label of fieldLabels) {
    cleaned = cleaned.replace(new RegExp(`\\s{2,}(?=${label}\\s)`, 'gi'), '\n');
  }

  // Split "Credit Enquiries" section header
  cleaned = cleaned.replace(/(?=Credit Enquiries)/gi, '\n');
  cleaned = cleaned.replace(/(?=Sr\.\s*No\.\s*Enquiry Purpose)/gi, '\n');
  cleaned = cleaned.replace(/(?=Summary:\s*(?:Loan Accounts|Credit Cards))/gi, '\n');
  cleaned = cleaned.replace(/(?=Account Details\s)/gi, '\n');
  cleaned = cleaned.replace(/(?=Contact Information)/gi, '\n');

  // Split score line: "754  GOOD" or "632  POOR"
  cleaned = cleaned.replace(/(\d{3})\s+(EXCELLENT|GOOD|FAIR|POOR|VERY\s*POOR|LOW|HIGH|NA)/gi, '\nSCORE: $1\n$2\n');

  // Handle "Hey Name," greeting on same line
  cleaned = cleaned.replace(/(Hey\s+[A-Za-z]+,)/gi, '\n$1\n');

  // Split Report Summary section
  cleaned = cleaned.replace(/(?=Report Summary)/gi, '\n');

  // Split "Active Loans" / "Active Credit Cards" summary
  cleaned = cleaned.replace(/(\d+)\s+(Active\s+(?:Loans?|Credit\s+Cards?))/gi, '\n$1 $2');
  cleaned = cleaned.replace(/(Total\s+(?:loan|limit))/gi, '\n$1');
  cleaned = cleaned.replace(/(Current\s+Outstanding)/gi, '\n$1');
  cleaned = cleaned.replace(/(Overdue\s+Payments)/gi, '\n$1');
  cleaned = cleaned.replace(/(Age\s+of\s+Accounts)/gi, '\n$1');
  cleaned = cleaned.replace(/(Recent\s+Enquiries)/gi, '\n$1');

  // Split Contact Information fields
  cleaned = cleaned.replace(/(?=Address Details)/gi, '\n');
  cleaned = cleaned.replace(/(?=Phone Number)/gi, '\n');
  cleaned = cleaned.replace(/(?=Email ID)/gi, '\n');
  cleaned = cleaned.replace(/(?=Mobile Phone)/gi, '\n');
  cleaned = cleaned.replace(/(?=Home Phone)/gi, '\n');
  cleaned = cleaned.replace(/(?=Office Phone)/gi, '\n');

  // Remove ACCOUNT_BREAK markers and clean up
  cleaned = cleaned.replace(/---ACCOUNT_BREAK---/g, '\n');

  // Clean up multiple newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

function parseCibilText(text) {
  const t = preprocessCibilText((text || '').toString());
  const lines = t.split('\n').map(x => x.trim()).filter(Boolean);
  const joined = lines.join('\n');
  const joinedFlat = lines.join(' ').replace(/\s+/g, ' ').trim();
  const upper = joinedFlat.toUpperCase();
  const typeRe = '(?:Personal\\s+Loan|Education\\s+Loan|Home\\s+Loan|Housing\\s+Loan|Vehicle\\s+Loan|Two\\s+Wheeler\\s+Loan|Used\\s+Car\\s+Loan|Gold\\s+Loan|Business\\s+Loan(?:\\s+General)?|Consumer\\s+Loan|Loan\\s+Against\\s+Property|Property\\s+Loan|Overdraft|Credit\\s+Card|Loan\\s+on\\s+Credit\\s+Card|Other)';

  const pickScore = () => {
    const m =
      joined.match(/CIBIL\s*SCORE[^0-9]{0,60}([3-9]\d{2})\b/i) ||
      joined.match(/\bSCORE[^0-9]{0,60}([3-9]\d{2})\b/i) ||
      joined.match(/\b([3-9]\d{2})\b\s*\n\s*Your\s+CIBIL\s+Score/i) ||
      joined.match(/Equifax\s+Score[^0-9]{0,60}([3-9]\d{2})\b/i) ||
      joined.match(/Experian\s+Score[^0-9]{0,60}([3-9]\d{2})\b/i) ||
      joined.match(/CRIF\s+Score[^0-9]{0,60}([3-9]\d{2})\b/i);
    if (!m) return undefined;
    const n = Number(m[1] || m[0].match(/\d{3}/)[0]);
    if (!Number.isFinite(n) || n < 300 || n > 900) return undefined;
    return n;
  };

  const pickDate = () => {
    const m =
      joined.match(/\bREPORT\s*DATE[^0-9]{0,20}(\d{2}[-\/]\d{2}[-\/]\d{4})/i) ||
      joined.match(/\bAS\s*ON[^0-9]{0,20}(\d{2}[-\/]\d{2}[-\/]\d{4})/i);
    return m ? m[1] : undefined;
  };

  const parseNum = (s) => {
    if (!s) return undefined;
    const n = Number(s.toString().replace(/[₹,\s]/g, ''));
    return Number.isFinite(n) ? n : undefined;
  };
  const pickLabeledNumber = (text, labelRe) => {
    const src = (text || '').toString();
    const re = new RegExp(`${labelRe.source}\\s*(?:Amount|Balance|Limit|Utilization|Payment|Principal|Total)?[^0-9A-Z-₹]{0,40}([₹]?\\s*-?\\d[\\d,]*(?:\\.\\d{1,2})?|NA)`, 'i');
    const m = src.match(re);
    if (!m || /^NA$/i.test(m[1])) return undefined;
    return parseNum(m[1]);
  };
  const pickLabeledDate = (text, labelRe) => {
    const src = (text || '').toString();
    const re = new RegExp(`${labelRe.source}\\s*(?:Date)?[^0-9A-Z]{0,40}(\\d{2}[-\\/]\\d{2}[-\\/]\\d{4}|NA)`, 'i');
    const m = src.match(re);
    if (!m || /^NA$/i.test(m[1])) return undefined;
    return parseDate(m[1]);
  };

  const monthRe = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
  const dpdTokenToDays = (value) => {
    const raw = (value || '').toString().trim().toUpperCase();
    if (!raw || raw === 'XXX' || raw === 'STD') return 0;
    const n = Number(raw.replace(/^0+(?=\d)/, ''));
    return Number.isFinite(n) ? n : 0;
  };
  const parseDpdHistory = (text) => {
    const out = [];
    const seen = new Set();
    const add = (month, value) => {
      const label = (month || '').toString().replace(/\s+/g, ' ').trim();
      if (!label) return;
      const days = dpdTokenToDays(value);
      const key = `${label.toUpperCase()}|${days}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ month: label, days });
    };

    // Very aggressive regex to catch "Month Year Value" in any combination of spacing
    const regex = new RegExp(`(${monthRe})\\s*((?:19|20)\\d{2})\\s*(\\d{1,3}|XXX|STD)`, 'gi');
    let m;
    while ((m = regex.exec(text)) !== null) {
      add(`${m[1]} ${m[2]}`, m[3]);
    }

    // Also catch "Month Year - Value"
    const regex2 = new RegExp(`(${monthRe})\\s*((?:19|20)\\d{2})\\s*-\\s*(\\d{1,3}|XXX|STD)`, 'gi');
    while ((m = regex2.exec(text)) !== null) {
      add(`${m[1]} ${m[2]}`, m[3]);
    }

    // Horizontal table format support
    if (out.length === 0) {
      const months = text.match(new RegExp(`\\b(${monthRe})\\b`, 'gi'));
      const years = text.match(/\b((?:19|20)\\d{2})\\b/g);
      const values = text.match(/\b(\\d{1,3}|XXX|STD)\\b/g);
      
      if (months && years && values && values.length >= months.length) {
        for (let i = 0; i < months.length; i++) {
          const year = years[Math.floor(i / 12)] || years[0];
          add(`${months[i]} ${year}`, values[i]);
        }
      }
    }

    if (out.length === 0) {
      // Fallback for vertical formats where month and value are on separate lines
      const lines = text.split(/\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const monthMatch = line.match(new RegExp(`^(${monthRe})\\s+((?:19|20)\\d{2})$`, 'i'));
        if (monthMatch) {
          const nextLine = (lines[i+1] || '').trim();
          const valMatch = nextLine.match(/^(\d{1,3}|XXX|STD)$/i);
          if (valMatch) add(`${monthMatch[1]} ${monthMatch[2]}`, valMatch[1]);
        }
      }
    }

    return out;
  };
  const accountKey = (a) => {
    const no = (a.account_no || '').toString().replace(/[^A-Z0-9]/gi, '').toUpperCase();
    const l = (a.lender || '').toString().toUpperCase()
      .replace(/\b(?:BANK|LTD|LIMITED|FINANCE|FIN|CREDIT|CARD|CORPORATION|CORP|SERVICES|SER|CO|NA)\b/g, ' ')
      .replace(/[^A-Z]/g, '')
      .slice(0, 15);
    return `${no}|${l}`;
  };
  const mergeAccountFields = (target, source) => {
    for (const field of [
      'ownership', 'opened_date', 'closed_date', 'account_status', 'last_update',
      'last_payment_date', 'sanctioned_amount', 'high_credit', 'credit_limit',
      'current_balance', 'overdue_amount', 'emi', 'actual_last_payment',
      'payment_frequency', 'repayment_tenure'
    ]) {
      if ((target[field] === undefined || target[field] === '' || target[field] === 0) && source[field] !== undefined) {
        target[field] = source[field];
      }
    }
  };

  const enquiries = {};
  const lastDays = joined.match(/\bENQUIR(?:Y|IES)\b[\s\S]{0,200}?\bLAST\s*(30|60|90|180|365)\s*DAYS\b[^0-9]{0,20}(\d{1,3})/gi) || [];
  for (const hit of lastDays) {
    const m = hit.match(/\bLAST\s*(30|60|90|180|365)\s*DAYS\b[^0-9]{0,20}(\d{1,3})/i);
    if (!m) continue;
    enquiries[`last_${m[1]}d`] = parseNum(m[2]) ?? enquiries[`last_${m[1]}d`];
  }

  const totalEnq =
    joined.match(/\bTOTAL\s*ENQUIR(?:Y|IES)\b[^0-9]{0,20}(\d{1,4})/i) ||
    joined.match(/\bENQUIR(?:Y|IES)\b[^0-9]{0,20}(\d{1,4})\b/i);
  if (totalEnq && totalEnq[1]) enquiries.total = parseNum(totalEnq[1]);

  const personal = {};

  const extractPan = (text) => {
    if (!text) return undefined;
    const labelMatch = text.match(/PAN\s*[:\-]?\s*([A-Z0-9\s\-]{10,20})/i);
    if (labelMatch) {
      const candidate = (labelMatch[1] || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (/^[A-Z]{5}\d{4}[A-Z]$/.test(candidate)) return candidate;
    }
    const rawMatch = text.match(/\b([A-Z]{5}\s*\d{4}\s*[A-Z])\b/i);
    if (rawMatch) {
      const candidate = (rawMatch[1] || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (/^[A-Z]{5}\d{4}[A-Z]$/.test(candidate)) return candidate;
    }
    const fallback = text.toUpperCase().replace(/[^A-Z0-9]/g, '').match(/([A-Z]{5}\d{4}[A-Z])/);
    return fallback ? fallback[1] : undefined;
  };

  const extractMobile = (text) => {
    if (!text) return undefined;
    const labelMatch = text.match(/\b(?:Mobile\s*Phone|Mobile(?:\s*No(?:\.)?)?|Mobile\s*Number|Phone(?:\s*Number)?|Telephone(?:\s*Number)?)\s*[:\-]?\s*([6-9][0-9\-\s]{9,14})\b/i);
    if (labelMatch) {
      const digits = (labelMatch[1] || '').replace(/[^0-9]/g, '');
      if (digits.length >= 10) return digits.slice(-10);
    }
    const fallback = text.match(/\b([6-9]\d{9})\b/);
    return fallback ? fallback[1] : undefined;
  };

  // Pass 0: Robust name and identification extraction
  const helloMatch = joined.match(/\b(?:Hello|Hey),?\s+([A-Z][a-zA-Z ]{2,60})/i);
  if (helloMatch) personal.name = helloMatch[1].trim();

  // Better name extraction for CIBIL format
  if (!personal.name) {
    const personalIdx = joined.toUpperCase().indexOf('PERSONAL DETAILS');
    if (personalIdx >= 0) {
      const personalSeg = joined.slice(personalIdx, personalIdx + 500);
      const nameLineMatch = personalSeg.match(/Name\s*\n\s*([A-Z][a-zA-Z ]{2,80})/i);
      if (nameLineMatch && !nameLineMatch[1].toUpperCase().includes('PERSONAL DETAILS')) personal.name = nameLineMatch[1].trim();
    }
  }

  personal.pan = extractPan(joined);
  personal.mobile = extractMobile(joined);

  const dobSearch = joined.match(/(?:Date\s*Of\s*Birth|DOB)\s*[:\-]?\s*(\d{2}[-\/]\d{2}[-\/]\d{4})/i) ||
                    joined.match(/\b(\d{2}[-\/]\d{2}[-\/]\d{4})\b(?=.*Gender)/i);
  if (dobSearch) personal.dob = parseDate(dobSearch[1]);

  const genderSearch = joined.match(/Gender\s*(Male|Female|Transgender)/i);
  if (genderSearch) personal.gender = genderSearch[1];

  const emailMatch = joined.match(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/);
  if (emailMatch && !personal.email) personal.email = emailMatch[1];

  const addresses = [];
  const labelLine = (s) => /^[A-Z][A-Z ]{2,30}\s*[:\-]/.test((s || '').toString());
  const stopAddress = (s) =>
    /\b(ACCOUNT|ACCT|ENQUIR(?:Y|IES)|INQUIR(?:Y|IES)|SCORE|CIBIL|DPD|CREDIT\s*FACILITY|PAYMENT\s*HISTORY)\b/i.test((s || '').toString()) ||
    labelLine(s);

  let addrBuf = [];
  let inAddr = false;
  for (const line of lines) {
    const m = line.match(/^([A-Z][A-Z \/_]{2,40})(?:\s*[:\-])?\s*(.*)$/);
    if (m) {
      const k = (m[1] || '').toString().trim().toUpperCase().replace(/\s+/g, ' ');
      let v = (m[2] || '').toString().trim();

      if (!v) {
        let nextIdx = lines.indexOf(line) + 1;
        while (nextIdx < lines.length && nextIdx < lines.indexOf(line) + 5) {
          const nextLine = (lines[nextIdx] || '').trim();
          if (nextLine && !nextLine.includes(':') && nextLine.length > 2) {
            v = nextLine;
            break;
          }
          if (nextLine.includes(':')) break;
          nextIdx++;
        }
      }

      if (/^(FULL\s*)?NAME$|^NAME$/.test(k)) {
        const cleanV = v.split('\n')[0].trim();
        const upperV = cleanV.toUpperCase();
        if (!personal.name || (personal.name.length < cleanV.length && !personal.name.toUpperCase().includes(upperV))) {
           if (!upperV.includes('PERSONAL DETAILS') && !upperV.includes('MEMBER NAME') && !/^\s*NAME\s*$/.test(upperV) && !upperV.includes('HELLO') && !upperV.includes('PAGE') && !upperV.includes('CIBIL')) {
             if (personal.name && (upperV.includes(personal.name.toUpperCase()) || personal.name.toUpperCase().includes(upperV))) {
                if (cleanV.length > 3 && !cleanV.includes('\n')) personal.name = cleanV;
             } else if (!personal.name) {
                if (cleanV.length > 3 && !cleanV.includes('\n')) personal.name = cleanV;
             }
           }
        }
      }
      else if (/^DATE OF BIRTH$|^DOB$/.test(k)) {
        if (!personal.dob) personal.dob = parseDate(v) || v;
      }
      else if (/^GENDER$|^SEX$/.test(k)) {
        if (!personal.gender) personal.gender = v;
      }
      else if (/^PAN$|^PERMANENT ACCOUNT NUMBER$|^ID NUMBER$/.test(k)) {
        if (!personal.pan) {
          const panMatch = v.match(/\b([A-Z]{5}\d{4}[A-Z])\b/i);
          if (panMatch) personal.pan = panMatch[1].toUpperCase();
        }
      }
      else if (/^MOBILE$|^MOBILE NUMBER$|^PHONE$|^PHONE NUMBER$|^TELEPHONE NUMBER$/.test(k) && !personal.mobile) {
        const phone = v.replace(/[^0-9]/g, '');
        if (phone.length >= 10) personal.mobile = phone.slice(-10);
      }
      else if (/^EMAIL$|^EMAIL ID$/.test(k) && !personal.email) personal.email = v;
      else if (/^COMPANY$|^EMPLOYER$|^ORGANIZATION$|^ORGANISATION$/.test(k) && !personal.company) personal.company = v;

      if (/ADDRESS/.test(k)) {
        if (addrBuf.length) {
          addresses.push(addrBuf.join(' ').replace(/\s+/g, ' ').trim());
          addrBuf = [];
        }
        if (v) addrBuf.push(v);
        inAddr = true;
      } else if (inAddr && v === '') {
        inAddr = false;
      }
      continue;
    }

    if (!inAddr) continue;
    if (stopAddress(line)) {
      if (addrBuf.length) addresses.push(addrBuf.join(' ').replace(/\s+/g, ' ').trim());
      addrBuf = [];
      inAddr = false;
      continue;
    }
    addrBuf.push(line);
  }
  if (addrBuf.length) addresses.push(addrBuf.join(' ').replace(/\s+/g, ' ').trim());
  if (addresses.length) personal.addresses = Array.from(new Set(addresses.filter(Boolean)));

  const enquiry_details = [];
  const enqDateRe = /\b(\d{2}[-\/]\d{2}[-\/]\d{4})\b/;
  
  // Extract enquiries using logical lines for better table row detection
  let enqSectionIdx = upper.indexOf('ENQUIRY PURPOSE');
  if (enqSectionIdx < 0) enqSectionIdx = upper.indexOf('CREDIT ENQUIRIES');
  
  if (enqSectionIdx >= 0) {
    let enqText = joined.slice(enqSectionIdx);
    const endIdx = enqText.slice(50).search(/\bSUMMARY:|\bACCOUNT DETAILS\b|\bCONTACT INFORMATION\b/i);
    if (endIdx > 0) enqText = enqText.slice(0, endIdx + 50);

    // Pattern: [SrNo] [Purpose] [Lender] [Date]
    // Use a very flexible regex to capture rows, requiring at least 2 spaces between columns
    const enqRowRe = /(\d{1,3})\s{2,}([A-Z][a-zA-Z\s]{2,40}?)\s{2,}([A-Z][A-Z0-9 &.'-]{2,60}?)\s{2,}(\d{2}[-\/]\d{2}[-\/]\d{4})/gi;
    let m;
    while ((m = enqRowRe.exec(enqText)) !== null) {
      const purpose = m[2].trim();
      const member = m[3].trim();
      const date = parseDate(m[4]);
      
      if (purpose && member && date && !/Report|Number|ECN|Table|Contents|Sr\. No|Date|Page/i.test(member) && !/Report|Number|ECN|Date/i.test(purpose)) {
        enquiry_details.push({ date, member, purpose });
      }
    }

    if (enquiry_details.length === 0) {
      const enqLines = enqText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      let current = {};
      for (let i = 0; i < enqLines.length; i++) {
        const line = enqLines[i];
        const memberMatch = line.match(/^(?:Member\s+Name)\s*[:\-]?\s*(.+)$/i);
        const dateMatch = line.match(/^(?:Date\s+Of\s+Enquiry)\s*[:\-]?\s*(.+)$/i);
        const purposeMatch = line.match(/^(?:Enquiry\s+Purpose)\s*[:\-]?\s*(.+)$/i);

        if (memberMatch) {
          if (current.member || current.date || current.purpose) {
            if (current.member && current.date && current.purpose) enquiry_details.push({ ...current });
            current = {};
          }
          current.member = memberMatch[1].trim();
          continue;
        }

        if (dateMatch) {
          current.date = parseDate(dateMatch[1].trim()) || undefined;
          continue;
        }

        if (purposeMatch) {
          current.purpose = purposeMatch[1].trim();
          continue;
        }

        // Support cases where the field label is on one line and value on the next line
        const labelOnlyMatch = line.match(/^(Member\s+Name|Date\s+Of\s+Enquiry|Enquiry\s+Purpose)\s*[:\-]?$/i);
        if (labelOnlyMatch && i + 1 < enqLines.length) {
          const nextValue = enqLines[i + 1].trim();
          if (/^Member\s+Name$/i.test(labelOnlyMatch[1])) {
            current.member = nextValue;
          } else if (/^Date\s+Of\s+Enquiry$/i.test(labelOnlyMatch[1])) {
            current.date = parseDate(nextValue) || undefined;
          } else if (/^Enquiry\s+Purpose$/i.test(labelOnlyMatch[1])) {
            current.purpose = nextValue;
          }
          i += 1;
          continue;
        }
      }
      if (current.member && current.date && current.purpose) enquiry_details.push({ ...current });
    }
  }

  // Fallback to line-by-line if global extraction found nothing
  if (enquiry_details.length === 0) {
    let inEnq = false;
    for (const line of lines) {
      if (!inEnq && /\bENQUIR(?:Y|IES)\b/i.test(line) && (/\bDETAIL|HISTORY|INFORMATION\b/i.test(line) || /\bPURPOSE\b/i.test(line))) {
        inEnq = true;
      }
      if (!inEnq) continue;
      if (/\bACCOUNT\b/i.test(line) && /\bTYPE\b/i.test(line)) break;
      if (/\bSUMMARY:\b/i.test(line)) break;

      const dm = line.match(enqDateRe);
       if (!dm) continue;
      
      const date = parseDate(dm[1]);
      let member = '';
      let purpose = '';
      let amount = undefined;
      const rest = line.replace(enqDateRe, '').trim();
      const parts = rest.split(/\s{2,}/).map(x => x.trim()).filter(Boolean);
      if (parts.length >= 2) {
        member = parts[0] || '';
        purpose = parts[1] || '';
        if (parts[2]) amount = parseNum(parts[2]);
      } else {
        const amt = rest.match(/\b(\d[\d,]{3,})\b(?!.*\b\d[\d,]{3,}\b)/);
        if (amt) amount = parseNum(amt[1]);
        purpose = rest;
      }
      if (member && !/Report|Number|ECN|Table|Date/i.test(member)) {
        enquiry_details.push({ date, member, purpose, amount, raw: line });
      }
    }
  }

  const accounts = [];
  let cur = null;
  const push = () => {
    if (!cur) return;
    if (Object.keys(cur).length) accounts.push(cur);
    cur = null;
  };

  const startRe = /^(ACCOUNT|ACCT)\s*TYPE\s*[:\-]\s*(.+)$/i;
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const accountNoLine = line.match(/^(?:ACCOUNT\s*(?:NUMBER|NO)|ACCT\s*(?:NUMBER|NO))\s*[:\-]?\s*(X{3,}\d{3,}|[A-Z0-9X*]{4,})$/i);
    if (accountNoLine) {
      if (!cur) {
        const prev = (lines[lineIdx - 1] || '').trim();
        cur = {
          account_no: accountNoLine[1].trim(),
          lender: /^[A-Z][A-Z0-9 &.'-]{2,80}$/.test(prev) && !/\b(?:ACCOUNT|DATE|STATUS|TYPE|OWNERSHIP)\b/i.test(prev) ? prev : undefined,
        };
      } else if (!cur.account_no) {
        cur.account_no = accountNoLine[1].trim();
      }
      continue;
    }
    const start = line.match(startRe);
    if (start) {
      if (cur && !cur.account_type) {
        cur.account_type = start[2].trim();
      } else {
        push();
        cur = { account_type: start[2].trim() };
      }
      continue;
    }
    const memberStart = line.match(/^(?:MEMBER\s*NAME|LENDER|BANK\s*NAME|FINANCIER|INSTITUTION)\s*[:\-]\s*(.+)$/i);
    if (memberStart && !cur) {
      cur = { lender: memberStart[1].trim() };
      continue;
    } else if (memberStart && cur && cur.lender && Object.keys(cur).length >= 2) {
      push();
      cur = { lender: memberStart[1].trim() };
      continue;
    }

    if (!cur) continue;

    const set = (k, re) => {
      const m = line.match(re);
      if (m && m[1] && cur[k] === undefined) cur[k] = m[1].toString().trim();
    };

    set('lender', /^(?:MEMBER\s*NAME|LENDER|BANK\s*NAME|FINANCIER|INSTITUTION)\s*[:\-]\s*(.+)$/i);
    set('account_status', /^(?:ACCOUNT\s*STATUS|STATUS)\s*[:\-]\s*(.+)$/i);
    set('ownership', /^(?:OWNERSHIP|ACCOUNT\s*HOLDER\s*TYPE)\s*[:\-]\s*(.+)$/i);
    set('opened_date', /^(?:DATE\s*OPENED|OPENED\s*DATE|DATE\s*OPEN)\s*[:\-]\s*(.+)$/i);
    set('closed_date', /^(?:DATE\s*CLOSED|CLOSED\s*DATE)\s*[:\-]\s*(.+)$/i);
    set('account_no', /^(?:ACCOUNT\s*(?:NUMBER|NO)|ACCT\s*(?:NUMBER|NO))\s*[:\-]?\s*(X{3,}\d{3,}|[A-Z0-9X*]{4,})$/i);

    const money = (k, re) => {
      const m = line.match(re);
      if (m && m[1] && cur[k] === undefined) cur[k] = parseNum(m[1]);
    };

    money('emi', /\bEMI\b[^0-9]{0,20}([\d,]+(?:\.\d{1,2})?)\b/i);
    money('current_balance', /\bCURRENT\s*(?:BALANCE|BAL|CURR\.?\s*BAL)\b[^0-9]{0,20}([\d,]+(?:\.\d{1,2})?)\b/i);
    money('sanctioned_amount', /\bSANCTION(?:ED)?\s*(?:AMOUNT)?\b[^0-9]{0,20}([\d,]+(?:\.\d{1,2})?)\b/i);
    money('high_credit', /\bHIGH\s*(?:CREDIT|CR)\b[^0-9]{0,20}([\d,]+(?:\.\d{1,2})?)\b/i);
    money('credit_limit', /\b(?:CREDIT\s*LIMIT|LIMIT)\b[^0-9]{0,20}([\d,]+(?:\.\d{1,2})?)\b/i);
    money('overdue_amount', /\b(?:OVERDUE|OD\s*AMOUNT|OVER\s*DUE)\b[^0-9]{0,20}([\d,]+(?:\.\d{1,2})?)\b/i);

    const lookahead = lines.slice(lineIdx, Math.min(lines.length, lineIdx + 4)).join(' ');
    if (cur.emi === undefined) cur.emi = pickLabeledNumber(lookahead, /\bEMI\b/i);
    if (cur.overdue_amount === undefined) cur.overdue_amount = pickLabeledNumber(lookahead, /\bOVERDUE\b/i);
    if (cur.current_balance === undefined) cur.current_balance = pickLabeledNumber(lookahead, /\b(?:OUTSTANDING|CURRENT)\b/i);
    if (cur.sanctioned_amount === undefined) cur.sanctioned_amount = pickLabeledNumber(lookahead, /\bLOAN\b/i);
    if (cur.actual_last_payment === undefined) cur.actual_last_payment = pickLabeledNumber(lookahead, /\bACTUAL\s+LAST\s+PAYMENT\b/i);
    if (cur.last_payment_date === undefined) cur.last_payment_date = pickLabeledDate(lookahead, /\bLAST\s+PAYMENT\b/i);

    if (/\b(WRITE\s*OFF|WRITTEN\s*OFF|SETTLED|SETTLEMENT|SUIT\s*FILED|WILFUL\s*DEFAULT|LOSS|SPECIAL\s*MENTION)\b/i.test(line)) {
      cur.adverse_flags = cur.adverse_flags || [];
      const f = line.toUpperCase();
      if (/WRITE\s*OFF|WRITTEN\s*OFF/i.test(f)) cur.adverse_flags.push('WRITTEN_OFF');
      if (/SETTLED|SETTLEMENT/i.test(f)) cur.adverse_flags.push('SETTLED');
      if (/SUIT\s*FILED/i.test(f)) cur.adverse_flags.push('SUIT_FILED');
      if (/WILFUL\s*DEFAULT/i.test(f)) cur.adverse_flags.push('WILFUL_DEFAULT');
      if (/\bLOSS\b/i.test(f)) cur.adverse_flags.push('LOSS');
      if (/SPECIAL\s*MENTION/i.test(f)) cur.adverse_flags.push('SMA');
      cur.adverse_flags = Array.from(new Set(cur.adverse_flags));
    }

    if (/\bDPD\b/i.test(line)) {
      const nums = (line.match(/\b\d{2,3}\b/g) || []).map(n => Number(n)).filter(n => Number.isFinite(n));
      const nonZero = nums.filter(n => n > 0);
      const max = nonZero.length ? Math.max(...nonZero) : 0;
      cur.dpd_max = Math.max(cur.dpd_max || 0, max);
    }

    if (new RegExp(`\\b${monthRe}\\b`, 'i').test(line) || /\b(?:\d{3}|XXX|STD)\b/i.test(line)) {
      cur._dpd_text = `${cur._dpd_text || ''}\n${line}`.trim();
    }
  }
  push();

  const summaryAccounts = [];

  // Helper to parse summary rows with better accuracy (handles potential 2-line wraps)
  const parseSummaryRows = (sectionText, isCC = false) => {
    const rows = [];
    const rawLines = sectionText.split('\n').map(l => l.trim()).filter(l => l);
    
    // Combine lines that look like they belong together (e.g. bank name split from rest of row)
    const lines = [];
    for (let i = 0; i < rawLines.length; i++) {
      let current = rawLines[i];
      // If current line is just a bank name and next line starts with account type, combine them
      if (i + 1 < rawLines.length) {
        const next = rawLines[i+1];
        const nextStartsWithType = new RegExp(`^${typeRe}`, 'i').test(next);
        if (!new RegExp(`${typeRe}`, 'i').test(current) && nextStartsWithType) {
          current += ' ' + next;
          i++;
        }
      }
      lines.push(current);
    }

    const rowRegex = new RegExp(`([A-Z][A-Z0-9 &.'-]{2,40})\\s+(${typeRe})\\s+([A-Z0-9X*]{4,})\\s+(Individual|Guarantor|Joint|Co-Applicant|Co Applicant|CoApplicant|Authorized User|Authorised User)\\s+(\\d{2}-\\d{2}-\\d{4})\\s+(Active\\*?\\*?|Closed|Settled|Written\\s*Off|Suit\\s*Filed|Wilful\\s*Default|Loss|Special\\s*Mention|SMA)\\s+(\\d{2}-\\d{2}-\\d{4})\\s+([\\d,NA-]+)\\s+([\\d,NA-]+)(?:\\s+([\\d,NA-]+))?(?:\\s+([\\d,NA-]+))?`, 'i');
    
    for (const line of lines) {
      const m = line.match(rowRegex);
      if (m) {
        const lenderRaw = m[1].trim();
        if (/\bDATE\b|\bACCOUNT\b|\bSTATUS\b|\bUPDATE\b|\bTYPE\b/i.test(lenderRaw)) continue;
        
        const lender = normalizeLenderName(lenderRaw);
        const account_type = m[2].trim();
        const n1 = parseNum(m[8]) || undefined;
        const n2 = parseNum(m[9]) || undefined;
        
        const rec = {
          lender,
          account_type,
          account_no: m[3].trim(),
          ownership: m[4].trim(),
          opened_date: parseDate(m[5]),
          account_status: m[6].replace(/\s+/g, ' ').trim(),
          last_update: parseDate(m[7]),
          current_balance: n2,
          overdue_amount: parseNum(m[10]) || undefined,
          emi: parseNum(m[11]) || undefined,
        };
        
        if (isCC || /credit\s*card/i.test(account_type)) {
          rec.high_credit = n1;
        } else {
          rec.sanctioned_amount = n1;
        }
        rows.push(rec);
      }
    }
    return rows;
  };

  // Pass 1: Summary: Loan Accounts
  const idxLoan = upper.indexOf('SUMMARY: LOAN ACCOUNTS');
  if (idxLoan >= 0) {
    const sectionStart = t.toUpperCase().indexOf('SUMMARY: LOAN ACCOUNTS');
    let sectionText = t.slice(sectionStart);
    const nextSectionIdx = sectionText.slice(20).search(/\bSUMMARY:|\bACCOUNT DETAILS\b/i);
    if (nextSectionIdx > 0) sectionText = sectionText.slice(0, nextSectionIdx + 20);
    
    summaryAccounts.push(...parseSummaryRows(sectionText, false));
  }

  // Pass 2: Summary: Credit Cards
  const idxCC = upper.indexOf('SUMMARY: CREDIT CARDS');
  if (idxCC >= 0) {
    const sectionStart = t.toUpperCase().indexOf('SUMMARY: CREDIT CARDS');
    let sectionText = t.slice(sectionStart);
    const nextSectionIdx = sectionText.slice(20).search(/\bSUMMARY:|\bACCOUNT DETAILS\b/i);
    if (nextSectionIdx > 0) sectionText = sectionText.slice(0, nextSectionIdx + 20);
    
    summaryAccounts.push(...parseSummaryRows(sectionText, true));
  }

  // Pass 3: Catch-all regex for accounts that might have been missed
  const seenSummaryKeys = new Set(summaryAccounts.map(accountKey));
  const accountNoRe = /\b([A-Z0-9X*]{4,})\b/gi;
  let mm;
  while ((mm = accountNoRe.exec(joinedFlat)) !== null) {
    const accountNo = (mm[1] || '').trim();
    if (!accountNo || /\b(?:ACCOUNT|NUMBER|NO|OWNERSHIP|TYPE|STATUS|DATE|AMOUNT|BALANCE|LIMIT|INSTITUTION|LENDER|SR|NO)\b/i.test(accountNo)) continue;
    const before = joinedFlat.slice(Math.max(0, mm.index - 150), mm.index).replace(/\s+/g, ' ').trim();
    const after = joinedFlat.slice(mm.index + accountNo.length, mm.index + accountNo.length + 250).replace(/\s+/g, ' ').trim();
    const beforeMatch = before.match(new RegExp(`(?:^|\\s)([A-Z][A-Z0-9 &.'-]{2,60})\\s+(${typeRe})\\s*$`, 'i'));
    const afterMatch = after.match(/^\s*(Individual|Guarantor|Joint|Co-Applicant|Co Applicant|CoApplicant|Authorized User|Authorised User)\s+(\d{2}-\d{2}-\d{4})\s+(Active\*?\*?|Closed|Settled|Written\*?\s*Off|Suit\*?\s*Filed|Wilful\*?\s*Default|Loss|Special\*?\s*Mention|SMA)\s+(\d{2}-\d{2}-\d{4})\s+([\d,NA-]+)\s+([\d,NA-]+)(?:\s+([\d,NA-]+))?(?:\s+([\d,NA-]+))/i);
    
    if (beforeMatch && afterMatch) {
      const lenderRaw = (beforeMatch[1] || '').trim();
      if (!lenderRaw || /\bDATE\b|\bACCOUNT\b|\bSTATUS\b|\bUPDATE\b/i.test(lenderRaw)) continue;
      const lender = normalizeLenderName(lenderRaw);
      const account_type = (beforeMatch[2] || '').trim();

      const rec = {
        lender,
        account_type,
        account_no: accountNo,
        ownership: (afterMatch[1] || '').trim(),
        opened_date: parseDate(afterMatch[2]),
        account_status: (afterMatch[3] || '').replace(/\s+/g, ' ').trim(),
        last_update: parseDate(afterMatch[4]),
      };
      const n1 = parseNum(afterMatch[5]);
      const n2 = parseNum(afterMatch[6]);
      const n3 = parseNum(afterMatch[7]);
      const n4 = parseNum(afterMatch[8]);

      if (/credit\s*card/i.test(account_type)) {
        rec.high_credit = n1;
        rec.current_balance = n2;
        rec.overdue_amount = n3;
        rec.emi = n4;
      } else {
        rec.sanctioned_amount = n1;
        rec.current_balance = n2;
        rec.overdue_amount = n3;
        rec.emi = n4;
      }

      const key = accountKey(rec);
      if (!seenSummaryKeys.has(key)) {
        seenSummaryKeys.add(key);
        summaryAccounts.push(rec);
      }
    }
  }

  for (const summary of summaryAccounts) {
    const key = accountKey(summary);
    const existing = accounts.find(a => accountKey(a) === key);
    if (existing) {
      mergeAccountFields(existing, summary);
    } else {
      accounts.push(summary);
    }
  }

  const detailSegments = joined.split(/(?=\b(?:MEMBER\s*NAME|LENDER|BANK\s*NAME|FINANCIER|INSTITUTION)\b|Account\s+Details\s+[A-Z][A-Z0-9 &.'-]{2,60}\s+(?:Active|Closed|Settled|Written|Suit|Wilful|Loss|SMA))/i);
  for (let i = 0; i < detailSegments.length; i++) {
    const segment = detailSegments[i];
    const searchWindow = segment;

    const segmentAccountNo =
      (segment.match(/\b(?:ACCOUNT\s*(?:NUMBER|NO)|ACCT\s*(?:NUMBER|NO))\s*[:\-]?\s*\n?\s*([A-Z0-9X*]{4,})/i) || [])[1] ||
      (segment.match(/\b([A-Z0-9X*]{4,})\b/i) || [])[1] ||
      '';
    const segmentLenderRaw =
      (segment.match(/\b(?:MEMBER\s*NAME|LENDER|BANK\s*NAME|FINANCIER|INSTITUTION)\s*[:\-]?\s*\n?\s*(.+?)(?:\n|$)/i) || [])[1] ||
      (segment.match(/^\s*([A-Z][A-Z0-9 &.'-]{2,80})\s*\n\s*Account\s+Number/im) || [])[1] ||
      (segment.match(/\b([A-Z][A-Z0-9 &.'-]{2,60})\s+(?:Active|Closed|Settled|Written\s*Off|Suit\s*Filed|Wilful\s*Default|Loss|Special\s*Mention|SMA)[*]*\s+Account Number:/i) || [])[1] ||
      (segment.match(/\b(?:Account\s+Information|Credit\s+Account)\s*\n\s*([A-Z][A-Z0-9 &.'-]{2,80})/i) || [])[1] ||
      '';
    const segmentLender = normalizeLenderName(segmentLenderRaw);
    const account_type = 
      (segment.match(/\b(?:ACCOUNT|ACCT)\s*TYPE\s*[:\-]?\s*\n?\s*(.+?)(?:\n|\s{2,}|$)/i) || [])[1] || 
      '';
    const account_status = 
      (segment.match(/\b(?:ACCOUNT\s*STATUS|STATUS|CREDIT\s+FACILITY\s+STATUS)\s*[:\-]?\s*\n?\s*([A-Z][A-Z\s-]{2,30})(?:\n|\s{2,}|$)/i) || [])[1] ||
      '';
    const detailAccount = {
      account_no: segmentAccountNo,
      lender: segmentLender.trim(),
      account_type: account_type.trim() || undefined,
      account_status: account_status.trim() || undefined,
      opened_date: pickLabeledDate(searchWindow, /\b(?:ACCOUNT\s+OPENED|DATE\s+OPENED\s*\/\s*DISBURSED)\b/i),
      closed_date: pickLabeledDate(searchWindow, /\b(?:ACCOUNT\s+CLOSED|DATE\s+CLOSED)\b/i),
      last_update: pickLabeledDate(searchWindow, /\b(?:LAST\s+BANK\s+UPDATE|DATE\s+REPORTED\s+AND\s+CERTIFIED)\b/i),
      last_payment_date: pickLabeledDate(searchWindow, /\b(?:LAST\s+PAYMENT|DATE\s+OF\s+LAST\s+PAYMENT)\b/i),
      sanctioned_amount: pickLabeledNumber(searchWindow, /\b(?:LOAN|SANCTIONED\s+AMOUNT|ORIGINAL\s+LOAN\s+AMOUNT|HIGH\s+CREDIT)\b/i),
      current_balance: pickLabeledNumber(searchWindow, /\b(?:OUTSTANDING|CURRENT\s+BALANCE|TOTAL\s+BALANCE)\b/i),
      overdue_amount: pickLabeledNumber(searchWindow, /\b(?:OVERDUE|AMOUNT\s+OVERDUE|PAST\s+DUE\s+AMOUNT)\b/i),
      emi: pickLabeledNumber(searchWindow, /\bEMI\b/i) || parseNum((searchWindow.match(/\bEMI\s*Amount\s*[:\-]?\s*([₹]?\s*[\d,]+)/i) || [])[1]),
      actual_last_payment: pickLabeledNumber(searchWindow, /\bACTUAL\s+LAST\s+PAYMENT\b/i),
    };

    const history = parseDpdHistory(segment);
    if (history.length) {
      detailAccount.dpd_history = history;
      detailAccount.dpd_max = history.reduce((max, h) => Math.max(max, Number(h.days) || 0), 0);
      detailAccount.dpd_delay_count = history.filter(h => (Number(h.days) || 0) > 0).length;
    }
    if (detailAccount.account_no || detailAccount.lender) {
      if (detailAccount.lender && /\b(?:ACCOUNT|DATE|STATUS|TYPE|OWNERSHIP|LIMIT|BALANCE|AMOUNT|REPORT|SUMMARY|ENQUIRY)\b/i.test(detailAccount.lender)) continue;
      if (detailAccount.account_no && /\b(?:ACCOUNT|NUMBER|NO|OWNERSHIP|TYPE|STATUS|DATE|AMOUNT|BALANCE|LIMIT|INSTITUTION|LENDER|SR|NO)\b/i.test(detailAccount.account_no)) continue;
      
      const key = accountKey(detailAccount);
      const existing = accounts.find(a => accountKey(a) === key);
      if (existing) mergeAccountFields(existing, detailAccount);
      else if (detailAccount.account_no && (detailAccount.lender || detailAccount.account_type)) accounts.push(detailAccount);
    }
  }

  for (const a of accounts) {
    if (a.dpd_history?.length) {
      a.dpd_max = Math.max(a.dpd_max || 0, ...a.dpd_history.map(h => Number(h.days) || 0));
      a.dpd_delay_count = a.dpd_history.filter(h => (Number(h.days) || 0) > 0).length;
      a.dpd_history_formatted = a.dpd_history
        .map(h => `${(h.month || '').toLowerCase()} - ${h.days}`)
        .join(', ');
    }
  }

  const dpd_max = accounts.reduce((m, a) => Math.max(m, Number(a.dpd_max) || 0), 0) || undefined;
  const adverse_flags = Array.from(new Set(accounts.flatMap(a => Array.isArray(a.adverse_flags) ? a.adverse_flags : []).filter(Boolean)));

  return {
    score: pickScore(),
    report_date: pickDate(),
    personal,
    enquiries,
    enquiry_details,
    accounts,
    dpd_max,
    adverse_flags,
    raw_char_count: t.length,
  };
}

function assessEligibility(bankAnalysis, cibil) {
  const score = cibil && Number.isFinite(Number(cibil.score)) ? Number(cibil.score) : undefined;
  const dpdMax = cibil && Number.isFinite(Number(cibil.dpd_max)) ? Number(cibil.dpd_max) : 0;
  const bounceCount = (bankAnalysis.bounce_charges || []).length;
  const monthKey = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr.toString().slice(0, 7);
    return d.toISOString().slice(0, 7);
  };
  const sumByMonth = (items, amountField) => {
    const out = {};
    for (const it of items || []) {
      const m = monthKey(it.date);
      if (!m) continue;
      const v = Number(it[amountField]) || 0;
      out[m] = (out[m] || 0) + v;
    }
    return out;
  };
  const salaryByMonth = sumByMonth(bankAnalysis.salary || [], 'amount');
  const emiByMonth = sumByMonth(bankAnalysis.emi_payments || bankAnalysis.loans || [], 'emi_amount');
  const rentByMonth = sumByMonth(bankAnalysis.rent || [], 'amount');
  const apyByMonth = sumByMonth(bankAnalysis.apy_pension || [], 'amount');
  const appRepayByMonth = sumByMonth((bankAnalysis.app_loans || []).filter(x => (x.type || '').toLowerCase() === 'repayment'), 'amount');
  const ccByMonth = sumByMonth(bankAnalysis.credit_card_payments || [], 'amount');
  const months = Object.keys(salaryByMonth).sort();
  const salaryMonths = months.filter(m => (salaryByMonth[m] || 0) > 0);
  const avgSalary = salaryMonths.length ? salaryMonths.reduce((s, m) => s + (salaryByMonth[m] || 0), 0) / salaryMonths.length : 0;
  const avgOverMonths = (byMonth) => {
    const ms = salaryMonths.length ? salaryMonths : Object.keys(byMonth);
    if (!ms.length) return 0;
    return ms.reduce((s, m) => s + (byMonth[m] || 0), 0) / ms.length;
  };
  const monthlyEmi = avgOverMonths(emiByMonth);
  const monthlyRent = avgOverMonths(rentByMonth);
  const monthlyApy = avgOverMonths(apyByMonth);
  const monthlyApp = avgOverMonths(appRepayByMonth);
  const monthlyCc = avgOverMonths(ccByMonth);
  const obligations = monthlyEmi + monthlyRent + monthlyApy + monthlyApp + monthlyCc;
  const foir = avgSalary > 0 ? obligations / avgSalary : undefined;
  const reasons = [];
  let decision = 'Needs Review';
  if (score !== undefined) {
    if (score < 650) reasons.push(`Low CIBIL score (${score})`);
    else if (score >= 750) reasons.push(`Strong CIBIL score (${score})`);
    else reasons.push(`Moderate CIBIL score (${score})`);
  } else {
    reasons.push('CIBIL score not detected in report text');
  }
  if (dpdMax >= 30) reasons.push(`Delinquency detected (DPD max ${dpdMax})`);
  if (bounceCount > 0) reasons.push(`${bounceCount} bounce/return charge(s) in statement`);
  if (foir !== undefined) reasons.push(`FOIR (fixed obligations / income) ~ ${(foir * 100).toFixed(0)}%`);
  if (score !== undefined && score < 650) decision = 'Unlikely';
  else if (dpdMax >= 30) decision = 'Unlikely';
  else if (foir !== undefined && foir > 0.6) decision = 'Unlikely';
  else if (score !== undefined && score >= 750 && foir !== undefined && foir <= 0.5 && dpdMax < 30) decision = 'Likely Eligible';
  return { decision, cibil_score: score, dpd_max: dpdMax || undefined, avg_monthly_income: avgSalary || undefined, avg_monthly_obligations: obligations || undefined, foir: foir !== undefined ? Number(foir.toFixed(4)) : undefined, bounce_count: bounceCount, reasons };
}

function assessUnderwriting(bankAnalysis, cibil) {
  const score = cibil && Number.isFinite(Number(cibil.score)) ? Number(cibil.score) : undefined;
  const dpdMax = cibil && Number.isFinite(Number(cibil.dpd_max)) ? Number(cibil.dpd_max) : 0;
  const accounts = Array.isArray(cibil?.accounts) ? cibil.accounts : [];
  const enquiries = cibil?.enquiries || {};
  const recentEnq = Number(enquiries.last_30d ?? enquiries.last_60d ?? enquiries.last_90d ?? 0) || 0;
  const norm = (s) => (s || '').toString().toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const isActive = (a) => {
    const st = norm(a?.account_status);
    if (!st) return true;
    if (/\bCLOSED|SETTLED|WRITTEN\s*OFF|CHARGEOFF|CHARGE\s*OFF|SUIT\s*FILED\b/.test(st)) return false;
    return true;
  };
  const classify = (a) => {
    const t = norm(a?.account_type);
    if (!t) return 'UNKNOWN';
    if (/\bCREDIT\s*CARD\b|\bCARD\b/.test(t)) return 'CREDIT_CARD';
    if (/\bHOME\b|\bHOUSING\b|\bMORTGAGE\b|\bHFL\b/.test(t)) return 'SECURED';
    if (/\bAUTO\b|\bCAR\b|\bVEHICLE\b|\bTWO\b/.test(t)) return 'SECURED';
    if (/\bGOLD\b/.test(t)) return 'SECURED';
    if (/\bPERSONAL\b|\bCONSUMER\b|\bUNSECURED\b/.test(t)) return 'UNSECURED';
    if (/\bBUSINESS\b|\bMSME\b|\bSME\b|\bTERM\b|\bWORKING\b/.test(t)) return 'BUSINESS';
    return 'OTHER';
  };
  const active = accounts.filter(isActive);
  const unsecured = active.filter(a => classify(a) === 'UNSECURED');
  const creditCards = active.filter(a => classify(a) === 'CREDIT_CARD');
  let hasSevere = false;
  for (const a of accounts) {
    const flags = Array.isArray(a.adverse_flags) ? a.adverse_flags : [];
    if (flags.includes('WRITTEN_OFF') || flags.includes('SETTLED') || flags.includes('SUIT_FILED') || flags.includes('WILFUL_DEFAULT') || flags.includes('LOSS')) {
      hasSevere = true;
      break;
    }
  }
  const ccUtil = (() => {
    let bal = 0, lim = 0;
    for (const a of creditCards) {
      bal += Number(a.current_balance) || 0;
      lim += Number(a.credit_limit) || 0;
    }
    if (!lim) return undefined;
    const u = bal / lim;
    return Number.isFinite(u) ? Number(u.toFixed(4)) : undefined;
  })();
  const bounceCount = (bankAnalysis?.bounce_charges || []).length;
  const eligibility = bankAnalysis && cibil ? assessEligibility(bankAnalysis, cibil) : undefined;
  const foir = eligibility?.foir, avgIncome = eligibility?.avg_monthly_income, avgObl = eligibility?.avg_monthly_obligations;
  const policy_flags = [];
  if (score !== undefined && score < 650) policy_flags.push('LOW_SCORE');
  if (score !== undefined && score >= 800) policy_flags.push('EXCELLENT_SCORE');
  if (dpdMax >= 30) policy_flags.push('DPD_30_PLUS');
  if (hasSevere) policy_flags.push('SEVERE_DEROGATORY');
  if (recentEnq >= 6) policy_flags.push('HIGH_ENQUIRIES');
  if (ccUtil !== undefined && ccUtil > 0.8) policy_flags.push('HIGH_CC_UTILIZATION');
  if (bounceCount >= 2) policy_flags.push('MULTIPLE_BOUNCES');
  if (foir !== undefined && foir > 0.6) policy_flags.push('HIGH_FOIR');
  const maxFoir = score === undefined ? undefined : score >= 780 ? 0.6 : score >= 720 ? 0.55 : score >= 680 ? 0.5 : 0.45;
  const maxEmi = (avgIncome !== undefined && maxFoir !== undefined) ? Math.max(0, (avgIncome * maxFoir) - (avgObl || 0)) : undefined;
  const grade = (() => {
    if (hasSevere || dpdMax >= 30) return 'D';
    if (score === undefined) return 'C';
    if (score >= 780 && (ccUtil === undefined || ccUtil <= 0.6) && recentEnq <= 3) return 'A';
    if (score >= 720) return 'B';
    if (score >= 650) return 'C';
    return 'D';
  })();
  const product = (code, label, minScore, allowDpd) => {
    const okScore = score === undefined ? false : score >= minScore;
    const okDpd = allowDpd ? dpdMax < 60 : dpdMax < 30;
    const okDerog = !hasSevere;
    return { code, label, eligible: Boolean(okScore && okDpd && okDerog), min_score: minScore };
  };
  return {
    grade, cibil_score: score, dpd_max: dpdMax || undefined, enquiries_recent: recentEnq || 0,
    accounts_total: accounts.length, accounts_active: active.length, unsecured_active: unsecured.length,
    credit_cards_active: creditCards.length, credit_card_utilization: ccUtil, bounce_count: bounceCount,
    foir, avg_monthly_income: avgIncome, avg_monthly_obligations: avgObl, max_foir_policy: maxFoir,
    additional_emi_capacity: maxEmi !== undefined ? Number(maxEmi.toFixed(2)) : undefined,
    policy_flags, product_eligibility: [
      product('PL', 'Personal Loan', 720, false),
      product('HL', 'Home Loan', 700, false),
      product('BL', 'Business Loan', 700, false),
      product('VL', 'Vehicle Loan', 680, false),
      product('CC', 'Credit Card', 720, false),
    ]
  };
}

module.exports = {
  parseCibilText,
  assessUnderwriting,
  assessEligibility,
  normalizeLenderName,
  preprocessCibilText
};
