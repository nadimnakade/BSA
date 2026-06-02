// INDIAN BANK STATEMENT ANALYZER v4.0
// Generic · All Indian Banks · Rule-Based · No AI Required
// Merged: best patterns + loan type system + RBI classification
// ================================================================

// ── LOAN TYPE MAP (RBI Classification) ──────────────────────────
// const LOAN_TYPE_MAP = [
//   { regex: /HOME.*LOAN|HOUSING.*LOAN|MORTGAGE|HFL|HOMELOAN|\bHL\b|GRUH|NHB|LICHFL|LIC.*HFL/i,
//     code:'HL', label:'Home Loan', color:'blue', icon:'🏠' },
//   { regex: /LAP\b|LOAN.*AGAINST.*PROP|PROP.*LOAN|MORTGAGE.*LOAN/i,
//     code:'LAP', label:'Loan Against Property', color:'blue', icon:'🏢' },
//   { regex: /CAR.*LOAN|AUTO.*LOAN|VEHICLE.*LOAN|TWO.*WHEEL|\bVL\b|CARLOAN|BIKE.*LOAN/i,
//     code:'VL', label:'Vehicle Loan', color:'amber', icon:'🚗' },
//   { regex: /EDUCATION.*LOAN|EDU.*LOAN|STUDENT.*LOAN|\bEL\b|VIDYA|SCHOLAR/i,
//     code:'EL', label:'Education Loan', color:'teal', icon:'🎓' },
//   { regex: /BUSINESS.*LOAN|\bBL\b|MSME|SME.*LOAN|WORKING.*CAP|TERM.*LOAN|MUDRA|COMMERCIAL/i,
//     code:'BL', label:'Business Loan', color:'purple', icon:'💼' },
//   { regex: /GOLD.*LOAN|\bGL\b|MUTHOOT|MANAPPURAM|PLEDGED.*GOLD/i,
//     code:'GL', label:'Gold Loan', color:'amber', icon:'🥇' },
//   { regex: /CONSUMER.*DUR|\bCDL\b|DURABLE.*LOAN|NO.*COST.*EMI/i,
//     code:'CDL', label:'Consumer Durable Loan', color:'teal', icon:'📱' },
//   { regex: /AGRI.*LOAN|KISAN|CROP.*LOAN|\bKCC\b|FARM.*LOAN|\bAGRI\b/i,
//     code:'AL', label:'Agriculture Loan', color:'green', icon:'🌾' },
//   { regex: /OVERDRAFT|\bOD\b|CREDIT.*LINE|CASH.*CREDIT/i,
//     code:'OD', label:'Overdraft / Credit Line', color:'red', icon:'🔄' },
//   { regex: /PERSONAL.*LOAN|\bPL\b|PERSLOAN|CONSUMER.*LOAN|UNSECURED/i,
//     code:'PL', label:'Personal Loan', color:'red', icon:'👤' },
// ];


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
// ── LENDER REGISTRY (100+ Indian Banks/NBFCs) ───────────────────
const LENDER_PATTERNS = [
  // ── PUBLIC SECTOR BANKS (PSB) ─────────────────────────────────
  { regex: /\bSBI\b|STATE\s*BANK|SBIN/i, name: 'State Bank of India (SBI)', category: 'PSB' },
  { regex: /\bUBIN\b|UNION.*BANK/i, name: 'Union Bank of India', category: 'PSB' },
  { regex: /\bPUNB\b|PUNJAB\s*NATIONAL|\bPNB\b/i, name: 'Punjab National Bank (PNB)', category: 'PSB' },
  { regex: /\bBARB\b|BANK\s*OF\s*BARODA|\bBOB\b/i, name: 'Bank of Baroda (BOB)', category: 'PSB' },
  { regex: /\bCNRB\b|CANARA.*BANK/i, name: 'Canara Bank', category: 'PSB' },
  { regex: /\bIOBA\b|INDIAN.*OVERSEAS/i, name: 'Indian Overseas Bank (IOB)', category: 'PSB' },
  { regex: /\bBKID\b|BANK\s*OF\s*INDIA\b/i, name: 'Bank of India (BOI)', category: 'PSB' },
  { regex: /\bMAHB\b|BANK.*MAHARASHTRA/i, name: 'Bank of Maharashtra', category: 'PSB' },
  { regex: /CENTRAL\s*BANK\b|CBIN/i, name: 'Central Bank of India', category: 'PSB' },
  { regex: /\bUCO\b|UCOBANK/i, name: 'UCO Bank', category: 'PSB' },
  { regex: /\bIDBI\b|IDBIBANK|IBKL/i, name: 'IDBI Bank', category: 'PSB' },
  { regex: /\bINDIAN\b|INDIANBANK|IDIB/i, name: 'Indian Bank', category: 'PSB' },

  // ── PRIVATE SECTOR BANKS (Pvt) ────────────────────────────────
  { regex: /\bHDFC\b|HDFCBANK/i, name: 'HDFC Bank', category: 'Pvt' },
  { regex: /\bICICI\b|ICICIBANK/i, name: 'ICICI Bank', category: 'Pvt' },
  { regex: /\bAXIS\b|AXISBANK|UTIB/i, name: 'Axis Bank', category: 'Pvt' },
  { regex: /\bKOTAK\b|KOTAKBANK|KKBK/i, name: 'Kotak Mahindra Bank', category: 'Pvt' },
  { regex: /\bYES\b|YESBANK|YESB/i, name: 'Yes Bank', category: 'Pvt' },
  { regex: /\bINDUSIND\b|INDUS.*IND|INDB/i, name: 'IndusInd Bank', category: 'Pvt' },
  { regex: /\bIDFC\b|IDFCBANK|IDFB/i, name: 'IDFC First Bank', category: 'Pvt' },
  { regex: /\bFEDERAL\b|FEDERALBANK|FDRL/i, name: 'Federal Bank', category: 'Pvt' },
  { regex: /\bRBL\b|RBLBANK|RBLB/i, name: 'RBL Bank', category: 'Pvt' },
  { regex: /\bBANDHAN\b|BANDHANBANK|\bBAND\b/i, name: 'Bandhan Bank', category: 'Pvt' },

  // ── SMALL FINANCE BANKS (SFB) ─────────────────────────────────
  { regex: /\bAU\s*SMALL\b|AUBANK|AUBK|AU.*FINANCE/i, name: 'AU Small Finance Bank', category: 'SFB' },
  { regex: /\bEQUITY\b|EQUITAS|ESFB/i, name: 'Equitas Small Finance Bank', category: 'SFB' },

  // ── CO-OPERATIVE BANKS (Coop) ─────────────────────────────────
  { regex: /\bSRCB\b|SARASWAT/i, name: 'Saraswat Bank', category: 'Coop' },
  { regex: /\bDNSB\b|DOMBIVLI/i, name: 'Dombivli Nagari Sahakari Bank', category: 'Coop' },
  { regex: /\bKJSB\b|KALYAN.*JANATA/i, name: 'Kalyan Janata Sahakari Bank', category: 'Coop' },
  { regex: /\bTDCB\b/i, name: 'Thane District Central Bank', category: 'Coop' },

  // ── NON-BANKING FINANCIAL COMPANIES & FINTECHS (NBFC / Fintech) ──
  { regex: /SMFG|SMFGINDIACR|SMFG.*INDIA/i, name: 'SMFG India Credit (Fullerton)', category: 'NBFC' },
  { regex: /\bBAJAJ\b|BAJAJ.*FIN|BJFL/i, name: 'Bajaj Finance Ltd', category: 'NBFC' },
  { regex: /\bTATA\s*CAPITAL\b|TATA.*FIN|TATACAP/i, name: 'Tata Capital', category: 'NBFC' },
  { regex: /\bADITYA\s*BIRLA\b|ABCAP|ABFL/i, name: 'Aditya Birla Capital', category: 'NBFC' },
  { regex: /L&T.*FIN|LNTFIN/i, name: 'L&T Finance', category: 'NBFC' },
  { regex: /MUTHOOT.*FIN|MUTHOOT/i, name: 'Muthoot Finance', category: 'NBFC' },
  { regex: /MANAPPURAM.*FIN|MANAPPURAM/i, name: 'Manappuram Finance', category: 'NBFC' },
  { regex: /\bPOONAWALLA\b|POONAWALLA.*FIN/i, name: 'Poonawalla Fincorp', category: 'NBFC' },
  { regex: /\bSHRIRAM\b|SHRIRAM.*FIN|SHRIRAM.*TRANS/i, name: 'Shriram Finance', category: 'NBFC' },
  { regex: /\bMAHINDRA\b|MMFSL|MAHFIN/i, name: 'Mahindra Finance', category: 'NBFC' },
  { regex: /\bCHOLA\b|CHOLAMANDALAM/i, name: 'Cholamandalam Finance', category: 'NBFC' },
  { regex: /\bHERO\b|HERO.*FIN\b|HEROFIN/i, name: 'Hero Fincorp', category: 'NBFC' },
  { regex: /\bHDB\b|HDBFS/i, name: 'HDB Financial Services', category: 'NBFC' },
  { regex: /\bKOTAK\s*MAHINDRA\s*INVEST\b|KMIL/i, name: 'Kotak Mahindra Investments', category: 'NBFC' },
  { regex: /\bIIFL\b|IIFL.*FIN|INDIA.*INFOLINE/i, name: 'IIFL Finance', category: 'NBFC' },
  { regex: /\bPIRAMAL\b|PIRAMAL.*FIN/i, name: 'Piramal Finance', category: 'NBFC' },
  { regex: /\bHOME\s*CREDIT\b|HOMECREDIT/i, name: 'Home Credit', category: 'NBFC' },
  { regex: /\bKREDITBEE\b|KRAZYBEE/i, name: 'KreditBee', category: 'NBFC' },
  { regex: /\bCASHE\b|BHANIX/i, name: 'CASHe', category: 'NBFC' },
  { regex: /\bMONEYVIEW\b|WHIZDM/i, name: 'MoneyView', category: 'NBFC' },
  { regex: /\bEARLYSALARY\b|FIBE/i, name: 'Fibe (EarlySalary)', category: 'NBFC' },
  { regex: /\bPAYSENSE\b/i, name: 'PaySense', category: 'NBFC' },
  { regex: /FINAGLE/i, name: 'Finagle (Kotak)', category: 'Fintech' },

  // ── HOUSING FINANCE COMPANIES (HFC) ───────────────────────────
  { regex: /PIRAMALMORT|PIRAMAL.*CAP/i, name: 'Piramal Capital & Housing Finance', category: 'HFC' },
  { regex: /LICHFL|LIC.*HFL|LIC.*HOUSING/i, name: 'LIC Housing Finance', category: 'HFC' },
  { regex: /INDIABULL.*HOUSING|IBHFL/i, name: 'Indiabulls Housing Finance', category: 'HFC' },

  // ── PAYMENTS BANKS (PB) ───────────────────────────────────────
  { regex: /\bPPIW\b|PAYTM.*PAYMENTS/i, name: 'Paytm Payments Bank', category: 'PB' },
  { regex: /\bFINO\b/i, name: 'Fino Payments Bank', category: 'PB' }
];

// ── SALARY KEYWORDS ─────────────────────────────────────────────
const SALARY_KEYWORDS = [
  'SALARY',
  'PAYROLL',
  'WAGES',
  'STIPEND',
  'BONUS',
  'INCENTIVE',
  'SAL/',
  'SAL ',
  'NEFT.*SALARY',
  'IMPS.*SALARY',
  'RTGS.*SALARY',
  'NACH.*SALARY',
  'NACH.*PAYROLL',
];

function normalizeDesc(desc) {
  return (desc || '')
    .toString()
    .replace(/\s+/g, ' ')
    .trim();
}

function normUpper(desc) {
  return normalizeDesc(desc).toUpperCase();
}

function anyMatch(desc, patterns) {
  for (const p of patterns) {
    if (p instanceof RegExp) {
      if (p.test(desc)) return true;
    } else if (typeof p === 'string') {
      if (new RegExp(p, 'i').test(desc)) return true;
    }
  }
  return false;
}

function parseCibilText(text) {
  const t = (text || '').toString();
  const lines = t.split('\n').map(x => x.trim()).filter(Boolean);
  const joined = lines.join('\n');
  const joinedFlat = lines.join(' ').replace(/\s+/g, ' ').trim();

  const pickScore = () => {
    const m =
      joined.match(/CIBIL\s*SCORE[^0-9]{0,60}([3-9]\d{2})\b/i) ||
      joined.match(/\bSCORE[^0-9]{0,60}([3-9]\d{2})\b/i);
    if (!m) return undefined;
    const n = Number(m[1]);
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
    const n = Number(s.toString().replace(/[,\s]/g, ''));
    return Number.isFinite(n) ? n : undefined;
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
  const addresses = [];
  const labelLine = (s) => /^[A-Z][A-Z ]{2,30}\s*[:\-]/.test((s || '').toString());
  const stopAddress = (s) =>
    /\b(ACCOUNT|ACCT|ENQUIR(?:Y|IES)|INQUIR(?:Y|IES)|SCORE|CIBIL|DPD|CREDIT\s*FACILITY|PAYMENT\s*HISTORY)\b/i.test((s || '').toString()) ||
    labelLine(s);

  let addrBuf = [];
  let inAddr = false;
  for (const line of lines) {
    const m = line.match(/^([A-Z][A-Z \/_]{2,40})\s*[:\-]\s*(.*)$/);
    if (m) {
      const k = (m[1] || '').toString().trim().toUpperCase().replace(/\s+/g, ' ');
      const v = (m[2] || '').toString().trim();

      if (/^(FULL\s*)?NAME$|^NAME$/.test(k) && !personal.name) personal.name = v;
      else if (/^DATE OF BIRTH$|^DOB$/.test(k) && !personal.dob) personal.dob = v;
      else if (/^GENDER$|^SEX$/.test(k) && !personal.gender) personal.gender = v;
      else if (/^PAN$|^PERMANENT ACCOUNT NUMBER$/.test(k) && !personal.pan) personal.pan = v;
      else if (/^MOBILE$|^MOBILE NUMBER$|^PHONE$|^PHONE NUMBER$/.test(k) && !personal.mobile) personal.mobile = v;
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

  if (!personal.name) {
    const m = joined.match(/\bHey\s+([A-Z][A-Za-z]+)\b/i) || joined.match(/\b([A-Z][A-Za-z]+)'s\s+Credit\s+Report\b/i);
    if (m && m[1]) personal.name = m[1].trim();
  }

  if (!personal.mobile) {
    const m =
      joinedFlat.match(/\bMobile\s*Phone\s+(\d{10})\b/i) ||
      joinedFlat.match(/\bPhone\s*Number\b[\s\S]{0,120}?\b(\d{10})\b/i) ||
      joinedFlat.match(/\b(\d{10})\b/);
    if (m && m[1]) personal.mobile = m[1];
  }

  if (!personal.email) {
    const m = joinedFlat.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    if (m) personal.email = m[0];
  }

  if (!personal.addresses || !personal.addresses.length) {
    const upper = joinedFlat.toUpperCase();
    const idx = upper.lastIndexOf('ADDRESS DETAILS');
    if (idx >= 0) {
      const seg = joinedFlat.slice(idx, idx + 8000);
      const addrRe = /([A-Z0-9:#,\-\/ .]{15,}?)\s*,\s*(\d{6})\s*,\s*([A-Za-z]{2,})\s+(Residence\s+Address|O\s*ce\s+Address|Office\s+Address)\b/gi;
      const found = [];
      let mm;
      while ((mm = addrRe.exec(seg)) !== null) {
        let a = `${mm[1]}, ${mm[2]}, ${mm[3]}`.replace(/\s+/g, ' ').trim();
        a = a.replace(/^Address Details\s+Address\s+Category\s+Date\s+Reported\s+/i, '');
        if (a.length >= 10) found.push(a);
      }
      if (found.length) personal.addresses = Array.from(new Set(found));
    }
  }

  const enquiry_details = [];
  const enqDateRe = /\b(\d{2}[-\/]\d{2}[-\/]\d{4})\b/;
  let inEnq = false;
  for (const line of lines) {
    if (!inEnq && /\bENQUIR(?:Y|IES)\b/i.test(line) && /\bDETAIL|HISTORY|INFORMATION\b/i.test(line)) {
      inEnq = true;
      continue;
    }
    if (!inEnq && (/\bENQUIR(?:Y|IES)\s+PURPOSE\b/i.test(line) || /\bENQUIRE[D|D]\s+ON\b/i.test(line) || /\bENQUIR(?:IED|ED)\s+ON\b/i.test(line))) {
      inEnq = true;
      continue;
    }
    if (!inEnq) continue;
    if (/\bACCOUNT\b/i.test(line) && /\bTYPE\b/i.test(line)) break;
    const dm = line.match(enqDateRe);
    if (!dm) continue;
    if (/\bREPORT\s+NUMBER\b/i.test(line) || /\bTABLE\s+OF\s+CONTENTS\b/i.test(line)) continue;
    if (/\bLAST\s*(30|60|90|180|365)\s*DAYS\b/i.test(line)) continue;
    if (/\bTOTAL\s*ENQUIR/i.test(line)) continue;

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
    enquiry_details.push({ date, member, purpose, amount, raw: line });
  }

  if (!enquiry_details.length) {
    const upper = joinedFlat.toUpperCase();
    const start = upper.indexOf('CREDIT ENQUIRIES');
    if (start >= 0) {
      let seg = joinedFlat.slice(start, start + 25000);
      const hdr = seg.toUpperCase().indexOf('ENQUIRED ON');
      if (hdr >= 0) seg = seg.slice(hdr + 'ENQUIRED ON'.length);
      const purposeRe = '(?:PERSONAL\\s+LOAN|EDUCATION\\s+LOAN|HOME\\s+LOAN|VEHICLE\\s+LOAN|TWO\\s+WHEELER\\s+LOAN|GOLD\\s+LOAN|BUSINESS\\s+LOAN(?:\\s+GENERAL)?|CONSUMER\\s+LOAN|LOAN\\s+AGAINST\\s+PROPERTY|CREDIT\\s+CARD|OVERDRAFT|OTHER)';
      const rowRe = new RegExp(`\\b(\\d{1,3})\\s+(${purposeRe})\\s+([A-Z][A-Z0-9 &]{2,80})\\s+(\\d{2}-\\d{2}-\\d{4})\\b`, 'gi');
      let m;
      while ((m = rowRe.exec(seg)) !== null) {
        const sr = Number(m[1]);
        if (!Number.isFinite(sr) || sr < 1 || sr > 300) continue;
        const member = (m[3] || '').trim();
        if (!member || /\bREPORT\b|\bCONTENTS\b/i.test(member)) continue;
        const purpose = (m[2] || '').toString().trim();
        if (!purpose || purpose.length < 3) continue;
        enquiry_details.push({
          date: parseDate(m[4]),
          member,
          purpose,
          amount: undefined,
          raw: m[0]
        });
      }
    }
  }

  if (enquiry_details.length && enquiries.total === undefined) enquiries.total = enquiry_details.length;

  const accounts = [];
  let cur = null;
  const push = () => {
    if (!cur) return;
    if (Object.keys(cur).length) accounts.push(cur);
    cur = null;
  };

  const startRe = /^(ACCOUNT|ACCT)\s*TYPE\s*[:\-]\s*(.+)$/i;
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const start = line.match(startRe);
    if (start) {
      push();
      cur = { account_type: start[2].trim() };
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
    if (!cur.last_payment_date) {
      const labelRe = /^(?:LAST\s*PAYMENT\s*DATE|DATE\s*OF\s*LAST\s*PAYMENT|LASTBANKDATE|LAST\s*BANK\s*DATE)\s*[:\-]?\s*(.*)$/i;
      const m = line.match(labelRe);
      if (m) {
        const dateRaw = (m[1] || '').toString().trim();
        if (dateRaw) {
          cur.last_payment_date = parseDate(dateRaw) || dateRaw;
        } else if (idx + 1 < lines.length) {
          const nextLine = lines[idx + 1].trim();
          if (/^\d{2}[\/-]\d{2}[\/-]\d{2,4}$/.test(nextLine)) {
            cur.last_payment_date = parseDate(nextLine) || nextLine;
          }
        }
      }
    }

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
  }
  push();

  if (!accounts.some(a => a && a.account_no)) {
    const upper = joinedFlat.toUpperCase();
    const idx = upper.indexOf('SUMMARY: LOAN ACCOUNTS');
    if (idx >= 0) {
      let seg = joinedFlat.slice(idx, idx + 40000);
      const hdr = seg.toUpperCase().indexOf('OUTSTANDING BALANCE');
      if (hdr >= 0) seg = seg.slice(hdr + 'OUTSTANDING BALANCE'.length);
      const typeRe = '(?:Personal\\s+Loan|Education\\s+Loan|Home\\s+Loan|Vehicle\\s+Loan|Two\\s+Wheeler\\s+Loan|Gold\\s+Loan|Business\\s+Loan(?:\\s+General)?|Consumer\\s+Loan|Loan\\s+Against\\s+Property|Overdraft|Credit\\s+Card|Other)';
      const rowRe = new RegExp(`([A-Z][A-Z0-9 &.'-]{2,80}?)\\s+(${typeRe})\\s+(X{3,}\\d{3,})\\s+(Individual|Guarantor|Joint|Co-Applicant|Co Applicant|CoApplicant|Authorized User|Authorised User)\\s+(\\d{2}-\\d{2}-\\d{4})\\s+(Active\\*?\\*?|Closed|Settled|Written\\s*Off|Suit\\s*Filed|Wilful\\s*Default|Loss|Special\\s*Mention|SMA)\\s+(\\d{2}-\\d{2}-\\d{4})\\s+([\\d,]+)\\s+([\\d,]+)`, 'gi');
      let m;
      while ((m = rowRe.exec(seg)) !== null) {
        const lender = (m[1] || '').toString().trim();
        if (!lender || /\bDATE\b|\bACCOUNT\b|\bSTATUS\b|\bUPDATE\b/i.test(lender)) continue;
        accounts.push({
          lender,
          account_type: (m[2] || '').toString().trim(),
          account_no: (m[3] || '').trim(),
          ownership: (m[4] || '').trim(),
          opened_date: parseDate(m[5]),
          account_status: (m[6] || '').replace(/\s+/g, ' ').trim(),
          last_update: parseDate(m[7]),
          sanctioned_amount: parseNum(m[8]) || undefined,
          current_balance: parseNum(m[9]) || undefined,
        });
      }
    }
  }

  if (accounts.length) {
    const seen = new Set();
    const uniq = [];
    for (const a of accounts) {
      const key = `${(a.account_no || '').toString().trim()}|${(a.lender || '').toString().trim()}|${(a.account_type || '').toString().trim()}`;
      if (!a.account_no || seen.has(key)) continue;
      seen.add(key);
      uniq.push(a);
    }
    accounts.length = 0;
    accounts.push(...uniq);
  }

  const dpd_max = accounts.reduce((m, a) => Math.max(m, Number(a.dpd_max) || 0), 0) || undefined;
  const adverse_flags = Array.from(new Set(accounts.flatMap(a => Array.isArray(a.adverse_flags) ? a.adverse_flags : []).filter(Boolean)));

  return {
    score: (() => {
      const s = pickScore();
      if (s !== undefined) return s;
      const m = joinedFlat.match(/\b([3-9]\d{2})\b\s+(EXCELLENT|VERY\s*GOOD|GOOD|FAIR|POOR)\b/i);
      if (!m) return undefined;
      const n = Number(m[1]);
      if (!Number.isFinite(n) || n < 300 || n > 900) return undefined;
      return n;
    })(),
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

function crossVerifyCibil(bankAnalysis, cibil) {
  if (!bankAnalysis || !cibil || !Array.isArray(cibil.accounts)) return undefined;

  const normName = (s) => (s || '').toString().toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = (s) => normName(s).split(' ').filter(x => x.length >= 4);

  const stmt = [];
  for (const e of bankAnalysis.emi_payments || bankAnalysis.loans || []) {
    if (e && e.bank) stmt.push(e.bank);
  }
  for (const k of Object.keys(bankAnalysis.loan_summary || {})) stmt.push(k);

  const stmtNames = Array.from(new Set(stmt.map(normName))).filter(x => x && !/UNKNOWN/.test(x));
  const cibilNames = Array.from(new Set(cibil.accounts.map(a => normName(a.lender)).filter(Boolean)));

  const isMatch = (a, b) => {
    if (!a || !b) return false;
    if (a.includes(b) || b.includes(a)) return true;
    const ta = tokens(a);
    const tb = tokens(b);
    if (!ta.length || !tb.length) return false;
    const setB = new Set(tb);
    let hit = 0;
    for (const t of ta) if (setB.has(t)) hit++;
    return hit >= 1;
  };

  const matched = [];
  const missing_in_statement = [];
  for (const cn of cibilNames) {
    const found = stmtNames.find(sn => isMatch(cn, sn));
    if (found) matched.push({ cibil_lender: cn, statement_lender: found });
    else missing_in_statement.push(cn);
  }

  const missing_in_cibil = [];
  for (const sn of stmtNames) {
    const found = cibilNames.find(cn => isMatch(cn, sn));
    if (!found) missing_in_cibil.push(sn);
  }

  return { matched, missing_in_statement, missing_in_cibil };
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

  return {
    decision,
    cibil_score: score,
    dpd_max: dpdMax || undefined,
    avg_monthly_income: avgSalary || undefined,
    avg_monthly_obligations: obligations || undefined,
    foir: foir !== undefined ? Number(foir.toFixed(4)) : undefined,
    bounce_count: bounceCount,
    reasons,
  };
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
    if (/\bCLOSED\b/.test(st)) return false;
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
    let bal = 0;
    let lim = 0;
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

  const foir = eligibility?.foir;
  const avgIncome = eligibility?.avg_monthly_income;
  const avgObl = eligibility?.avg_monthly_obligations;

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
  const maxEmi = (avgIncome !== undefined && maxFoir !== undefined)
    ? Math.max(0, (avgIncome * maxFoir) - (avgObl || 0))
    : undefined;

  const grade = (() => {
    if (hasSevere) return 'D';
    if (dpdMax >= 30) return 'D';
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
    return {
      code,
      label,
      eligible: Boolean(okScore && okDpd && okDerog),
      min_score: minScore,
    };
  };

  const product_eligibility = [
    product('PL', 'Personal Loan', 720, false),
    product('HL', 'Home Loan', 700, false),
    product('BL', 'Business Loan', 700, false),
    product('VL', 'Vehicle Loan', 680, false),
    product('CC', 'Credit Card', 720, false),
  ];

  return {
    grade,
    cibil_score: score,
    dpd_max: dpdMax || undefined,
    enquiries_recent: recentEnq || 0,
    accounts_total: accounts.length,
    accounts_active: active.length,
    unsecured_active: unsecured.length,
    credit_cards_active: creditCards.length,
    credit_card_utilization: ccUtil,
    bounce_count: bounceCount,
    foir,
    avg_monthly_income: avgIncome,
    avg_monthly_obligations: avgObl,
    max_foir_policy: maxFoir,
    additional_emi_capacity: maxEmi !== undefined ? Number(maxEmi.toFixed(2)) : undefined,
    policy_flags,
    product_eligibility,
  };
}

const SALARY_SOURCE_MAP = {
  'AI AIRPORT':'AI Airport Services Ltd', 'AIAIRPORT':'AI Airport Services Ltd',
  'INFOSYS':'Infosys BPO Ltd',            'WIPRO':'Wipro Ltd',
  'TCS':'Tata Consultancy Services',      'HCL':'HCL Technologies',
  'COGNIZANT':'Cognizant Technology',     'ACCENTURE':'Accenture',
};

// ── NACH / ECS PATTERNS ─────────────────────────────────────────
const NACH_PATTERNS = [ /^NACH\//i, /^NACH\s/i, /^ECS\//i, /^ECS\s/i, /^ACH\//i, /^EMANCH\//i, /^SI\//i, /^SI\s/i,  /E-?MANDATE/i, /\bMANDATE\b/i, /AUTO\s*DEBIT/i,/NACH.*DEBIT/i, /ECS.*DEBIT/i];

// ── APP LOAN PATTERNS (30+) ─────────────────────────────────────
const APP_LOAN_PATTERNS = [
  { regex: /KREDITBEE|KREDIT.*BEE/i,         name:'KreditBee',     maxApr:36 },
  { regex: /LAZYPAY|LAZY.*PAY/i,             name:'LazyPay',       maxApr:36 },
  { regex: /MONEYTAP|MONEY.*TAP/i,           name:'MoneyTap',      maxApr:36 },
  { regex: /\bNAVI\b/i,                      name:'Navi',          maxApr:36 },
  { regex: /MPOKKET|M.*POKKET/i,             name:'mPokket',       maxApr:48 },
  { regex: /PAYSENSE|PAY.*SENSE/i,           name:'PaySense',      maxApr:36 },
  { regex: /\bCASHE\b/i,                    name:'CASHe',          maxApr:36 },
  { regex: /EARLYSALARY|EARLY.*SALARY|\bFIBE\b/i, name:'Fibe',    maxApr:36 },
  { regex: /STASHFIN/i,                      name:'StashFin',      maxApr:36 },
  { regex: /\bSLICE\b/i,                    name:'Slice',          maxApr:30 },
  { regex: /\bJUPITER\b/i,                  name:'Jupiter',        maxApr:30 },
  { regex: /\bNIRA\b/i,                     name:'Nira',           maxApr:36 },
  { regex: /SMARTCOIN/i,                     name:'SmartCoin',     maxApr:48 },
  { regex: /KISSHT|RING.*LOAN/i,             name:'Kissht/Ring',   maxApr:36 },
  { regex: /\bFREO\b|FREOPAY/i,             name:'Freo',           maxApr:30 },
  { regex: /ZESTMONEY|ZEST.*MONEY/i,         name:'ZestMoney',     maxApr:36 },
  { regex: /AXIO|CAPITALFLOAT/i,             name:'Axio',          maxApr:36 },
  { regex: /\bDHANI\b/i,                    name:'Dhani',          maxApr:42 },
  { regex: /INDIALENDS/i,                    name:'IndiaLends',     maxApr:36 },
  { regex: /LOANTAP/i,                       name:'LoanTap',       maxApr:36 },
  { regex: /KRAZYBEE/i,                      name:'KrazyBee',      maxApr:48 },
  { regex: /RUPEEK/i,                        name:'Rupeek',        maxApr:24 },
  { regex: /BHARATPE.*LOAN/i,                name:'BharatPe Loan', maxApr:36 },
  { regex: /LENDINGKART/i,                   name:'Lendingkart',   maxApr:36 },
  { regex: /FINNABLE/i,                      name:'Finnable',      maxApr:36 },
  { regex: /OXYZO/i,                         name:'Oxyzo',         maxApr:24 },
  { regex: /INDIFI/i,                        name:'Indifi',        maxApr:36 },
  { regex: /FAIRCENT/i,                      name:'Faircent',      maxApr:36 },
  { regex: /MONEYVIEW/i,                     name:'MoneyView',     maxApr:36 },
  { regex: /\bPREFR\b/i,                    name:'Prefr',          maxApr:36 },
  { regex: /FINAGLE/i,                       name:'Finagle',       maxApr:40 },
];

// const APP_LOAN_PATTERNS = [
//   { regex: /KREDITBEE|KREDIT.*BEE/i, name:'KreditBee', maxApr:36 }, { regex: /LAZYPAY|LAZY.*PAY/i, name:'LazyPay', maxApr:36 }, { regex: /MONEYTAP|MONEY.*TAP/i, name:'MoneyTap', maxApr:36 }, { regex: /\bNAVI\b/i, name:'Navi', maxApr:36 }, { regex: /MPOKKET|M.*POKKET/i, name:'mPokket', maxApr:48 }, { regex: /PAYSENSE|PAY.*SENSE/i, name:'PaySense', maxApr:36 }, { regex: /\bCASHE\b/i, name:'CASHe', maxApr:36 }, { regex: /EARLYSALARY|EARLY.*SALARY|\bFIBE\b/i, name:'Fibe', maxApr:36 }, { regex: /STASHFIN/i, name:'StashFin', maxApr:36 }, { regex: /\bSLICE\b/i, name:'Slice', maxApr:30 }, { regex: /\bJUPITER\b/i, name:'Jupiter', maxApr:30 }, { regex: /\bNIRA\b/i, name:'Nira', maxApr:36 }, { regex: /SMARTCOIN/i, name:'SmartCoin', maxApr:48 }, { regex: /KISSHT|RING.*LOAN/i, name:'Kissht/Ring', maxApr:36 }, { regex: /\bFREO\b|FREOPAY/i, name:'Freo', maxApr:30 }, { regex: /ZESTMONEY|ZEST.*MONEY/i, name:'ZestMoney', maxApr:36 }, { regex: /AXIO|CAPITALFLOAT/i, name:'Axio', maxApr:36 }, { regex: /\bDHANI\b/i, name:'Dhani', maxApr:42 }, { regex: /INDIALENDS/i, name:'IndiaLends', maxApr:36 }, { regex: /LOANTAP/i, name:'LoanTap', maxApr:36 }, { regex: /KRAZYBEE/i, name:'KrazyBee', maxApr:48 }, { regex: /RUPEEK/i, name:'Rupeek', maxApr:24 }, { regex: /BHARATPE.*LOAN/i, name:'BharatPe Loan', maxApr:36 }, { regex: /LENDINGKART/i, name:'Lendingkart', maxApr:36 }, { regex: /FINNABLE/i, name:'Finnable', maxApr:36 }, { regex: /OXYZO/i, name:'Oxyzo', maxApr:24 }, { regex: /INDIFI/i, name:'Indifi', maxApr:36 }, { regex: /FAIRCENT/i, name:'Faircent', maxApr:36 }, { regex: /MONEYVIEW/i, name:'MoneyView', maxApr:36 }, { regex: /\bPREFR\b/i, name:'Prefr', maxApr:36 }, { regex: /FINAGLE/i, name:'Finagle', maxApr:40 }
// ];
// const SIP_PATTERNS = [
//   { regex: /GROWW/i, platform:'Groww' }, { regex: /ZERODHA.*COIN|ZERODHA.*MF/i, platform:'Zerodha Coin' }, { regex: /PAYTM.*MONEY|PAYTMMONEY/i, platform:'Paytm Money' }, { regex: /\bCAMS\b|CAMSONLINE/i, platform:'CAMS' }, { regex: /BSE.*STAR|BSESTAR/i, platform:'BSE Star MF' }, { regex: /MF.*UTIL|MFUTILITY/i, platform:'MF Utility' }, { regex: /MIRAE/i, platform:'Mirae Asset MF' }, { regex: /NIPPON.*MF|NIPPON.*INDIA/i, platform:'Nippon India MF' }, { regex: /AXIS.*MF/i, platform:'Axis MF' }, { regex: /HDFC.*MF/i, platform:'HDFC MF' }, { regex: /SBI.*MF/i, platform:'SBI MF' }, { regex: /ICICI.*MF|ICICI.*PRU.*MF/i, platform:'ICICI Prudential MF' }, { regex: /UTI.*MF/i, platform:'UTI MF' }, { regex: /KOTAK.*MF/i, platform:'Kotak MF' }, { regex: /TATA.*MF/i, platform:'Tata MF' }, { regex: /CANARA.*ROBECO/i, platform:'Canara Robeco MF' }, { regex: /DSP.*MF/i, platform:'DSP MF' }, { regex: /IDFC.*MF|BANDHAN.*MF/i, platform:'Bandhan MF' }, { regex: /HSBC.*MF/i, platform:'HSBC MF' }, { regex: /FRANKLIN.*TEMPLETON/i, platform:'Franklin Templeton MF' }
// ];

// ── SIP / MF PLATFORMS ──────────────────────────────────────────
const SIP_PATTERNS = [
  { regex: /GROWW/i,                          platform:'Groww' },
  { regex: /ZERODHA.*COIN|ZERODHA.*MF/i,      platform:'Zerodha Coin' },
  { regex: /PAYTM.*MONEY|PAYTMMONEY/i,        platform:'Paytm Money' },
  { regex: /\bCAMS\b|CAMSONLINE/i,            platform:'CAMS' },
  { regex: /BSE.*STAR|BSESTAR/i,              platform:'BSE Star MF' },
  { regex: /MF.*UTIL|MFUTILITY/i,             platform:'MF Utility' },
  { regex: /MIRAE/i,                          platform:'Mirae Asset MF' },
  { regex: /NIPPON.*MF|NIPPON.*INDIA/i,       platform:'Nippon India MF' },
  { regex: /AXIS.*MF/i,                       platform:'Axis MF' },
  { regex: /HDFC.*MF/i,                       platform:'HDFC MF' },
  { regex: /SBI.*MF/i,                        platform:'SBI MF' },
  { regex: /ICICI.*MF|ICICI.*PRU.*MF/i,       platform:'ICICI Prudential MF' },
  { regex: /KOTAK.*MF/i,                      platform:'Kotak MF' },
  { regex: /DSP\b.*MF|DSP.*MUTUAL/i,          platform:'DSP MF' },
  { regex: /CANARA.*ROB|CANROB/i,             platform:'Canara Robeco MF' },
  { regex: /FRANKLIN.*TEMP|FRANKLINTEMP/i,    platform:'Franklin Templeton MF' },
  { regex: /MOTILAL.*OSWAL|MOTILAL/i,         platform:'Motilal Oswal MF' },
  { regex: /INVESCO/i,                        platform:'Invesco MF' },
  { regex: /EDELWEISS.*MF/i,                  platform:'Edelweiss MF' },
  { regex: /MUTUAL.*FUND|MF.*SIP|SIP.*MF/i,  platform:'Mutual Fund' },
];

// ── STOCK MARKET / BROKING PLATFORMS ────────────────────────────
const STOCK_MARKET_PATTERNS = [
  { regex: /ZERODHA|KITE\b|KITEAPP|\bCOIN\b/i,             platform:'Zerodha' },
  { regex: /UPSTOX|UPSTX/i,                                 platform:'Upstox' },
  { regex: /ANGEL\s*ONE|ANGEL\s*BROKING|ANGELBRK/i,         platform:'Angel One' },
  { regex: /FYERS/i,                                         platform:'Fyers' },
  { regex: /5PAISA|FIVE\s*PAISA/i,                           platform:'5paisa' },
  { regex: /\bDHAN\b|RAISE\s*FIN/i,                         platform:'Dhan' },
  { regex: /ALICE\s*BLUE/i,                                  platform:'Alice Blue' },
  { regex: /SHOONYA|FINVASIA/i,                              platform:'Shoonya' },
  { regex: /PROSTOCKS/i,                                     platform:'ProStocks' },
  { regex: /\bSAMCO\b/i,                                    platform:'Samco' },
  { regex: /INDMONEY/i,                                      platform:'INDmoney' },
  { regex: /ICICI\s*DIRECT|ICICIDIRECT/i,                    platform:'ICICI Direct' },
  { regex: /HDFC\s*SEC|HDFCSEC|HDFC\s*SKY/i,                platform:'HDFC Securities' },
  { regex: /KOTAK\s*SEC|KOTAKSEC|KOTAK\s*NEO/i,             platform:'Kotak Securities' },
  { regex: /AXIS\s*DIRECT|AXISDIRECT/i,                      platform:'Axis Direct' },
  { regex: /SBI\s*SEC|SBI\s*SECURITIES/i,                    platform:'SBI Securities' },
  { regex: /NUVAMA|EDELWEISS\s*BROKING|EDELWEISS\s*SEC/i,   platform:'Nuvama' },
  { regex: /SHAREKHAN/i,                                     platform:'Sharekhan' },
  { regex: /MOTILAL\s*OSWAL|MOSL/i,                         platform:'Motilal Oswal' },
  { regex: /VENTURA/i,                                       platform:'Ventura Wealth' },
  { regex: /\bGEOJIT\b/i,                                   platform:'Geojit' },
  { regex: /ANAND\s*RATHI/i,                                 platform:'Anand Rathi' },
  { regex: /NIRMAL\s*BANG/i,                                 platform:'Nirmal Bang' },
  { regex: /RELIGARE/i,                                      platform:'Religare' },
  { regex: /ARIHANT\s*CAP/i,                                 platform:'Arihant Capital' },
  { regex: /BONANZA/i,                                       platform:'Bonanza' },
  { regex: /CHOICE\s*FINX|CHOICE\s*BROKING/i,               platform:'Choice FinX' },
];

// ── INSURANCE PATTERNS ──────────────────────────────────────────
const INSURANCE_PATTERNS = [
  { regex: /\bLIC\b|LICINDIA|LIC.*PREM/i,           provider:'LIC',                        type:'life' },
  { regex: /HDFC.*LIFE|HDFCLIFE/i,                   provider:'HDFC Life',                  type:'life' },
  { regex: /ICICI.*PRU.*LIFE|ICICIPRULIFE/i,         provider:'ICICI Prudential Life',      type:'life' },
  { regex: /SBI.*LIFE|SBILIFE/i,                     provider:'SBI Life',                   type:'life' },
  { regex: /MAX.*LIFE|MAXLIFE/i,                     provider:'Max Life',                   type:'life' },
  { regex: /BAJAJ.*ALLIANZ|BAJAJALLIANZ/i,           provider:'Bajaj Allianz',              type:'life' },
  { regex: /KOTAK.*LIFE|KOTAKLIFE/i,                 provider:'Kotak Life',                 type:'life' },
  { regex: /TATA.*AIA|TATAAIA/i,                     provider:'Tata AIA Life',              type:'life' },
  { regex: /STAR.*HEALTH|STARHEALTH/i,               provider:'Star Health',                type:'health' },
  { regex: /NIVA.*BUPA|NIVABUPA/i,                   provider:'Niva Bupa',                  type:'health' },
  { regex: /CARE.*HEALTH|CAREHEALTH/i,               provider:'Care Health',                type:'health' },
  { regex: /NEW.*INDIA.*ASSU|NEWINDIAASSUR/i,        provider:'New India Assurance',        type:'health' },
  { regex: /NATIONAL.*INSURANCE/i,                   provider:'National Insurance',          type:'health' },
  { regex: /DIGIT.*INSURANCE|\bDIGIT\b/i,            provider:'Digit Insurance',            type:'general' },
  { regex: /RELIANCE.*GENERAL/i,                     provider:'Reliance General Insurance', type:'general' },
  { regex: /PMSBY/i,                                 provider:'PMSBY (Govt)',               type:'accidental' },
  { regex: /PMJJBY/i,                                provider:'PMJJBY (Govt)',              type:'life' },
  { regex: /INSURANCE.*PREM|INS.*PREM|PREM.*INS/i,  provider:'Insurance Premium',          type:'general' },
];

// ── UTILITY PATTERNS ────────────────────────────────────────────
const UTILITY_PATTERNS = [
  { regex: /MSEDCL|MSEB\b|MAHAVITARAN|MAHAVITRAN/i,   category:'electricity' },
  { regex: /BSES\b|BESCOM|TPDDL|TNEB|WBSEDCL|CESC\b|APEPDCL/i, category:'electricity' },
  { regex: /JIO\b|JIOFIBER|JIONET/i,                   category:'internet/mobile' },
  { regex: /AIRTEL\b|BHARTI.*AIRTEL/i,                 category:'mobile' },
  { regex: /VODAFONE|VODA\b/i,                         category:'mobile' },
  { regex: /\bBSNL\b/i,                               category:'mobile' },
  { regex: /GOOGLE.*UTIL|gpay.*utility|GOOGLE.*PAY.*UTIL/i, category:'utility' },
  { regex: /MAHANAGAR.*GAS|MGL\b|IGL\b|ADANI.*GAS|GAIL\b/i, category:'gas' },
  { regex: /NETFLIX|AMAZON.*PRIME|HOTSTAR|DISNEY\+|SONY.*LIV|ZEE5/i, category:'OTT' },
  { regex: /SWIGGY|ZOMATO/i,                           category:'food delivery' },
  { regex: /IBIBO|MAKEMYTRIP|GOIBIBO|YATRA\b|IXIGO/i, category:'travel' },
  { regex: /BBMP\b|MCGM\b|\bBMC\b|PROPERTY.*TAX/i,    category:'municipal tax' },
];

// ── RENT KEYWORDS ───────────────────────────────────────────────
const RENT_KEYWORDS = [
  'RENT','HOUSE RENT','H RENT','FLAT RENT','ROOM RENT',
  'LANDLORD','OWNER RENT','MAKAN','PG RENT','HOSTEL RENT',
  'ACCOMMODATION','LEASE RENT'
];

// ── PF / EPFO ───────────────────────────────────────────────────
const PF_PATTERNS = [
  /EPFO/i, /EMPLOYEE.*PROVIDENT/i, /PROVIDENT.*FUND/i,
  /\bEPF\b/i, /PF.*CREDIT/i, /PF.*SETTLE/i, /PROVIDENT/i,
];

// ── GOVT SCHEME PATTERNS ────────────────────────────────────────
const GOVT_SCHEME_PATTERNS = [
  { regex: /LADKI.*BAH|LADKI BAHIN/i, name:'Ladki Bahin Yojana',    type:'govt_scheme' },
  { regex: /PM.*KISAN/i,              name:'PM Kisan',              type:'govt_scheme' },
  { regex: /JANDHAN/i,                name:'Jan Dhan Scheme',       type:'govt_scheme' },
  { regex: /\bDBT\b/i,               name:'DBT Credit',             type:'govt_scheme' },
  { regex: /APB\//i,                  name:'Aadhaar Payment Bridge', type:'govt_scheme' },
];

// ── DISBURSEMENT KEYWORDS ───────────────────────────────────────
const DISBURSEMENT_KEYWORDS = [
  /DISBURSE/i, /DISBUR/i, /DISBURSAL/i,
  /LOAN.*CREDIT/i, /LOAN.*PROCEED/i, /SANCTION.*AMT/i,
  /TERM.*LOAN.*CR/i, /PL.*DISBUR/i,
];

// ════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════

function parseAmount(str) {
  if (!str) return 0;
  let clean = str.toString().replace(/₹/g, '').trim();
  if (clean.startsWith('(') && clean.endsWith(')')) clean = `-${clean.slice(1, -1)}`;
  clean = clean.replace(/[,\s]/g, '').replace(/(dr|cr)$/i, '');
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

  const mon = { jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
                jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12' };
  const dMonY = s.match(/^(\d{2})[-\/\s]([A-Za-z]{3})[-\/\s](\d{2,4})/);
  if (dMonY) {
    const mm = mon[dMonY[2].toLowerCase()];
    const yyyy = dMonY[3].length === 2 ? `20${dMonY[3]}` : dMonY[3];
    if (mm) return `${yyyy}-${mm}-${dMonY[1]}`;
  }

  const dMonYCompact = s.match(/^(\d{2})([A-Za-z]{3})(\d{2,4})/);
  if (dMonYCompact) {
    const mm = mon[dMonYCompact[2].toLowerCase()];
    const yyyy = dMonYCompact[3].length === 2 ? `20${dMonYCompact[3]}` : dMonYCompact[3];
    if (mm) return `${yyyy}-${mm}-${dMonYCompact[1]}`;
  }

  return s.split(' ')[0];
}

function monthKey(dateStr) {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr.slice(0, 7);
  return d.toLocaleDateString('en-IN', { month:'short', year:'numeric' });
}

function fmt(n) {
  if (!n || isNaN(n)) return '0';
  if (n >= 10000000) return `${(n/10000000).toFixed(2)}Cr`;
  if (n >= 100000)   return `${(n/100000).toFixed(2)}L`;
  if (n >= 1000)     return `${(n/1000).toFixed(1)}K`;
  return n.toFixed(0);
}

// ── Loan type from description ───────────────────────────────────
function detectLoanType(desc) {
  for (const p of LOAN_TYPE_MAP) {
    if (p.regex.test(desc)) return { code:p.code, label:p.label, color:p.color, icon:p.icon };
  }
  return { code:'PL', label:'Personal Loan', color:'red', icon:'👤' };
}

// ── Lender from description ──────────────────────────────────────
function detectLender(desc) {
  for (const p of LENDER_PATTERNS) {
    if (p.regex.test(desc)) return { name:p.name, category:p.category };
  }
  return null;
}

// ── Infer lender name from NACH/ACH/ECS token ───────────────────
function inferAutoDebitLender(desc) {
  const s = (desc || '').toString();
  const m = s.match(/(?:^|\b)(?:NACH|ACH|ECS|SI|EMANCH)\/([^\/\s]+)/i);
  if (!m) return '';
  const token = (m[1] || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 24);
  return token.length >= 3 ? token.toUpperCase() : '';
}

// ── Salary employer name ─────────────────────────────────────────
function inferSalaryEmployer(desc) {
  const upper = (desc || '').toUpperCase();
  for (const [key, name] of Object.entries(SALARY_SOURCE_MAP)) {
    if (upper.includes(key)) return name;
  }
  const salaryPay = desc.match(/\bSALARY(?:\s*PAYMENT)?\s*\/\s*([A-Z0-9 &.'-]{3,})/i);
  if (salaryPay) return salaryPay[1].replace(/\s+/g, ' ').trim().slice(0, 50);
  const nachMatch = desc.match(/NACH\/\d+\/\d+\/(.+)/i);
  if (nachMatch) return nachMatch[1].replace(/\//g,' ').trim().slice(0,50);
  const channelMatch = desc.match(/\b(NEFT|IMPS|RTGS)\b[:\s\-\/]+(.+)/i);
  if (channelMatch) {
    let s = (channelMatch[2] || '').toString();
    s = s
      .replace(/\bUTR[:\s\-]*[A-Z0-9]{10,25}\b/gi, ' ')
      .replace(/\bRRN[:\s\-]*[0-9]{10,18}\b/gi, ' ')
      .replace(/\b[A-Z]{4}0[A-Z0-9]{6}\b/g, ' ')
      .replace(/\b(?:CR|DR|CREDIT|DEBIT)\b/gi, ' ')
      .replace(/\b(?:SALARY|PAYROLL|WAGES|STIPEND|BONUS|INCENTIVE)\b/gi, ' ')
      .replace(/[\/\-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (s) return s.slice(0, 50);
  }
  const autoToken = inferAutoDebitLender(desc);
  if (autoToken) return autoToken;
  return 'Salary Credit';
}

// ── Extract transaction metadata (UTR, ref, NACH, loan A/c) ─────
function extractTxnMeta(desc, tx) {
  const text  = (desc || '').toString();
  const find  = (re) => { const m = text.match(re); return m ? (m[1]||'').trim() : ''; };

  const utr           = find(/\bUTR[:\s\-]*([A-Z0-9]{10,25})\b/i);
  const rrn           = find(/\bRRN[:\s\-]*([0-9]{10,18})\b/i);
  const nach_ref      = find(/\bNACH\/\d{1,4}\/\d{6,20}\b/i);
  const reference_id  = find(/\bREF(?:ERENCE)?[:\s\-]*([A-Z0-9\-]{6,30})\b/i) || nach_ref;
  const txn_id        = find(/\bTRAN(?:SACTION)?\s*ID[:\s\-]*([A-Z0-9\-]{6,30})\b/i) ||
                        find(/\bT\d{7,12}\b/i);
  const cheque_no     = find(/\bCHQ(?:UE)?\s*(?:NO|NUMBER)?[:\s\-]*([0-9]{4,10})\b/i);
  const nach_umrn     = find(/\bUMRN[:\s\-]*([A-Z0-9]{10,30})\b/i);
  const mandate_id    = find(/\bMANDATE[:\s\-]*([A-Z0-9\-]{6,30})\b/i);

  const loan_account_raw =
    find(/\bLOAN\s*(?:A\/C|AC|ACCOUNT)\s*(?:NO|NUMBER)?[:\s\-]*([Xx*]*\d{3,10})\b/i) ||
    find(/\bA\/C\s*(?:NO|NUMBER)?[:\s\-]*([Xx*]*\d{3,10})\b/i);
  const loan_account_masked = loan_account_raw
    ? loan_account_raw.replace(/[^0-9Xx*]/g,'').slice(-10) : '';

  const principal_raw  = find(/\bPRIN(?:CIPAL)?[:\s\-]*([\d,]+\.\d{2})\b/i);
  const interest_raw   = find(/\bINT(?:EREST)?[:\s\-]*([\d,]+\.\d{2})\b/i);
  const principal_amount = principal_raw ? parseAmount(principal_raw) : 0;
  const interest_amount  = interest_raw  ? parseAmount(interest_raw)  : 0;

  const emiCycleMatch = text.toUpperCase().match(/\b(MONTHLY|MTHLY|QUARTERLY|WEEKLY)\b/);
  const emi_cycle = emiCycleMatch ? emiCycleMatch[1] : '';
  const emiDayM   = text.toUpperCase().match(/\bEMI(?:\s*ON)?\s*(\d{1,2})(?:ST|ND|RD|TH)?\b/);
  const emi_day   = emiDayM ? emiDayM[1] : '';

  const src = tx && tx._source ? tx._source : null;
  return {
    reference_id:         reference_id || undefined,
    utr:                  utr          || undefined,
    rrn:                  rrn          || undefined,
    nach_ref:             nach_ref     || undefined,
    nach_umrn:            nach_umrn    || undefined,
    mandate_id:           mandate_id   || undefined,
    txn_id:               txn_id       || undefined,
    cheque_no:            cheque_no    || undefined,
    loan_account_masked:  loan_account_masked || undefined,
    lender_raw:           inferAutoDebitLender(text) || undefined,
    emi_cycle:            emi_cycle    || undefined,
    emi_day:              emi_day      || undefined,
    principal_amount:     principal_amount || undefined,
    interest_amount:      interest_amount  || undefined,
    source_type:          src ? (src.type  || undefined) : undefined,
    source_sheet:         src ? (src.sheet || undefined) : undefined,
    source_row:           src ? src.row    : undefined,
    source_page:          src ? src.page   : undefined,
  };
}

// ════════════════════════════════════════════════════════════════
// DETECTION FUNCTIONS
// ════════════════════════════════════════════════════════════════

function detectSalary(desc, amount, isCredit) {
  const d = normalizeDesc(desc);
  if (!isCredit) return null;
  if (anyMatch(d, SALARY_KEYWORDS)) return inferSalaryEmployer(d);

  if (detectNACH(d)) {
    const negative = /\b(EMI|INSTAL+MENT|SALARY|LOAN|REPAY|APY|PENSION|INSURANCE|PREM|SIP|MUTUAL|MF\b|CARD|CC\b|BILLDESK|DEMAT|DP\s*CHARGES|CDSL|NSDL|PAYOUT|PAYIN)\b/i;
    if (!negative.test(d) && amount >= 5000) return inferSalaryEmployer(d);
  }

  const channel = /\b(NEFT|IMPS|RTGS)\b/i.test(d);
  if (channel && amount >= 5000) {
    const salaryLike = /\b(SALARY|PAYROLL|WAGES|STIPEND|BONUS|INCENTIVE|SAL\/|\bSAL\b)\b/i;
    const negative = /\b(LOAN|DISB|DISBURSE|SANCTION|OD\b|OVERDRAFT|CREDIT\s*LIMIT)\b/i;
    if (!negative.test(d) && salaryLike.test(d)) return inferSalaryEmployer(d);
  }

  return null;
}

function detectNACH(desc) {
  return NACH_PATTERNS.some(p => p.test(desc));
}

function detectLoanEMI(desc, amount) {
  if (/\b(RETURN|INSUFFICIENT|SIGNATURE|ERRORS|DISCREPANCY|DAMAGE|OVERWRITING|CLOSED|FROZEN|BOUNCE|BOUNCED|FAILED|FAILURE|UNPAID|REJECT|REJECTED|CHARGE|CHARGES|PENALTY)\b/i.test(desc)) return null;
  // Check known lenders first
  for (const p of LENDER_PATTERNS) {
    if (p.regex.test(desc) && detectNACH(desc)) {
      const loanType = detectLoanType(desc);
      return { bank: p.name, bank_category: p.category, loan_type: loanType };
    }
  }
  // Generic NACH with EMI keyword or large amount
  const isAutoDebit = detectNACH(desc);
  if (!isAutoDebit && !/EMI|LOAN\s*INST|INSTALMENT|REPAY/i.test(desc)) return null;
  if (isAutoDebit && amount >= 500) {
    const lender = detectLender(desc);
    const loanType = detectLoanType(desc);
    return {
      bank: lender ? lender.name : (inferAutoDebitLender(desc) || 'Unknown Lender (NACH)'),
      bank_category: lender ? lender.category : 'Unknown',
      loan_type: loanType,
    };
  }
  return null;
}

function detectLoanDisbursement(desc, amount, isCredit) {
  if (!isCredit || amount < 5000) return null;
  // Explicit disbursement keywords
  for (const p of DISBURSEMENT_KEYWORDS) {
    if (p.test(desc)) {
      const lender = detectLender(desc) || { name:'Unknown Lender', category:'Unknown' };
      return { lender:lender.name, lender_category:lender.category, loan_type:detectLoanType(desc) };
    }
  }
  // Known NBFC/HFC large credit via NEFT
  for (const p of LENDER_PATTERNS) {
    if (p.regex.test(desc) && (p.category==='NBFC'||p.category==='HFC') && amount >= 50000) {
      return { lender:p.name, lender_category:p.category, loan_type:detectLoanType(desc) };
    }
  }
  return null;
}

function detectPF(desc) {
  return PF_PATTERNS.some(p => p.test(desc));
}

function detectAppLoan(desc) {
  for (const p of APP_LOAN_PATTERNS) {
    if (p.regex.test(desc)) return { name:p.name, maxApr:p.maxApr };
  }
  return null;
}

function detectSIP(desc) {
  const d = (desc || '').toUpperCase();
  const isMf = /\bMF\b|MUTUAL|SIP|FOLIO|AMC\b|\bCAMS\b|KFIN|KARVY/i.test(d);
  const isStock = /\bNSE\b|\bBSE\b|\bEQUITY\b|\bSTOCK\b|\bSHARES?\b|\bBROK/i.test(d);
  if (isStock && !isMf) return null;
  for (const p of SIP_PATTERNS) {
    if (p.regex.test(desc)) {
      if (!isMf && /GROWW|ZERODHA|PAYTM|MOTILAL/i.test(p.platform)) continue;
      return p.platform;
    }
  }
  return null;
}

function detectStockMarket(desc) {
  if (!desc) return null;
  const d = normUpper(desc);
  const isMf = /\bMF\b|MUTUAL|SIP|FOLIO|AMC\b|\bCAMS\b|KFIN|KARVY/i.test(d);
  const isStock = /\bNSE\b|\bBSE\b|\bEQUITY\b|\bSTOCK\b|\bSHARES?\b|\bBROK(ING)?\b|DP\s*CHARGES|\bDEMAT\b|CDSL|NSDL|\bPAYOUT\b|\bPAYIN\b|\bMARGIN\b|\bFNO\b|F&O|\bFUTURES\b|\bOPTIONS\b|\bINTRADAY\b|\bIPO\b/i.test(d);
  const isUpi = /\bUPI\b|\bUPIAR\b|\bUPI\//i.test(d);
  for (const p of STOCK_MARKET_PATTERNS) {
    if (!p.regex.test(desc)) continue;
    if (isMf && !isStock) return null;
    return { platform: p.platform };
  }
  if (isStock && !isMf) {
    if (isUpi) {
      const strong = /DP\s*CHARGES|\bDEMAT\b|CDSL|NSDL|\bPAYOUT\b|\bPAYIN\b|\bFNO\b|F&O|\bFUTURES\b|\bOPTIONS\b|\bINTRADAY\b/i;
      if (!strong.test(d)) return null;
    }
    return { platform:'Stock Market' };
  }
  return null;
}

function detectInsurance(desc) {
  for (const p of INSURANCE_PATTERNS) {
    if (p.regex.test(desc)) return { provider:p.provider, type:p.type };
  }
  return null;
}

function detectRent(desc) {
  const d = desc.toUpperCase();
  return RENT_KEYWORDS.some(kw => d.includes(kw));
}

function detectUtility(desc) {
  for (const p of UTILITY_PATTERNS) { if (p.regex.test(desc)) return p.category; }
  return null;
}

function detectAPY(desc) {
  return /\bAPY\b|ATAL.*PENSION|TRTR.*APY/i.test(desc);
}

function classifyCreditCardPayment(desc) {
  const text = normalizeDesc(desc);
  const d = text.toUpperCase();

  const signalsStrong = [
    /\bCREDIT\s*CARD\b/i,
    /\bCRDT\s*CARD\b/i,
    /\bCARD\s*(?:BILL|DUE)\b/i,
    /\bCC\s*(?:PAYMENT|PAY|PMT)\b/i,
    /\bCREDITCARD\b/i,
  ];

  const signalsIssuer = [
    /\bCARD\b.*\bPAYMENT\b/i,
    /\bVISA\b/i,
    /\bMASTERCARD\b/i,
    /\bRUPAY\b/i,
  ];

  const negatives = [
    /\bUPI\b/i,
    /\bUPIAR\b/i,
    /\bUPI\//i,
  ];

  let score = 0;
  if (anyMatch(d, signalsStrong)) score += 6;
  if (/\bBILLDESK\b/i.test(d) && /\b(CARD|CC|CREDIT)\b/i.test(d)) score += 3;
  if (anyMatch(d, signalsIssuer) && /\b(CARD|CC)\b/i.test(d)) score += 2;

  if (/\bPAID\s+VIA\s+CRED\b/i.test(d) || /\bCREDPAY\b/i.test(d)) return null;

  const isUpi = anyMatch(text, negatives);
  if (isUpi && score < 5) score -= 4;

  if (score < 4) return null;

  const ccMeta = parseCreditCardPaymentMeta(text);
  return { confidence: Math.min(1, Math.max(0.4, score / 10)), ...ccMeta };
}

function detectBounceOrCharges(desc) {
  const d = normUpper(desc);

  const isBounce =
    /\bBOUNCE(D)?\b/.test(d) ||
    /\bRETURN\b/.test(d) ||
    /\bUNPAID\b/.test(d) ||
    /\bREJECT(ED)?\b/.test(d) ||
    /\bFAILED\b|\bFAILURE\b/.test(d) ||
    /\bINSUFFICIENT\s*FUNDS\b/.test(d) ||
    /\bRETURN\s*MEMO\b/.test(d);

  const isCharge =
    /\bCHARGES?\b/.test(d) ||
    /\bCHG\b/.test(d) ||
    /\bPENALTY\b/.test(d) ||
    /\bBOUNCE\s*CHARGES?\b/.test(d) ||
    /\bRETURN\s*CHARGES?\b/.test(d);

  if (!isBounce && !isCharge) return null;

  let category = 'Charges/Returns';
  if (/\b(EMI|INSTAL+MENT)\b/.test(d)) category = 'EMI Bounce/Charges';
  else if (/\b(NACH|ECS|ACH|SI|E-?MANDATE|MANDATE)\b/.test(d)) category = 'Auto-debit Return/Charges';
  else if (/\b(CHQ|CHEQUE)\b/.test(d)) category = 'Cheque Bounce/Charges';

  let channel = '';
  if (/\bNACH\b/.test(d)) channel = 'NACH';
  else if (/\bECS\b/.test(d)) channel = 'ECS';
  else if (/\bACH\b/.test(d)) channel = 'ACH';
  else if (/\bSI\b/.test(d) || /\bE-?MANDATE\b/.test(d) || /\bMANDATE\b/.test(d)) channel = 'SI/Mandate';
  else if (/\bCHQ\b/.test(d) || /\bCHEQUE\b/.test(d)) channel = 'Cheque';

  return { category, channel: channel || undefined };
}

function parseCreditCardPaymentMeta(desc) {
  const text = (desc || '').toString();
  const upper = text.toUpperCase();

  let platform = '';
  if (/\bPAID\s+VIA\s+CRED\b/i.test(upper) || /\bCREDPAY\b/i.test(upper)) platform = 'CRED';
  else if (/\bBILLDESK\b/i.test(upper)) platform = 'BillDesk';

  let channel = '';
  if (/\bUPI\b/i.test(upper) || /\bUPIAR\b/i.test(upper) || /\bUPI\//i.test(text)) channel = 'UPI';
  else if (/\bNEFT\b/i.test(upper)) channel = 'NEFT';
  else if (/\bIMPS\b/i.test(upper)) channel = 'IMPS';
  else if (/\bRTGS\b/i.test(upper)) channel = 'RTGS';
  else if (/\bNETBANK\b/i.test(upper)) channel = 'NETBANKING';

  let issuer_bank = '';
  const credBank = text.match(/PAID\s+VIA\s+CRED\/([^\/]{2,60})/i);
  if (credBank && credBank[1]) issuer_bank = credBank[1].replace(/\s+/g, ' ').trim();
  if (!issuer_bank) {
    const m = upper.match(/\b(HDFC|ICICI|SBI|AXIS|KOTAK|INDUSIND|YESB|YES\s*BANK|IDFC|RBL|AU\s*BANK|FEDERAL|PNB|BOB|CANARA|UNION\s*BANK)\b/i);
    if (m) issuer_bank = m[0].replace(/\s+/g, ' ').trim();
  }

  let payee = '';
  const upi = text.match(/UPI\/([^\/\s]{2,80})/i);
  if (upi && upi[1]) payee = upi[1].trim();

  let last4 = '';
  const m4 = upper.match(/\b(?:CARD|CC)\b[^0-9X]*(?:XX|X{2,}|\*{2,})\s*(\d{4})\b/);
  if (m4 && m4[1]) last4 = m4[1];

  const cc_display =
    platform === 'CRED' ? `CRED → ${issuer_bank || 'Credit Card'}` :
    platform === 'BillDesk' ? `BillDesk → ${issuer_bank || 'Credit Card'}` :
    issuer_bank ? `Card Payment → ${issuer_bank}` :
    'Card Payment';

  return {
    cc_platform: platform || undefined,
    cc_channel: channel || undefined,
    cc_issuer_bank: issuer_bank || undefined,
    cc_payee: payee || undefined,
    cc_last4: last4 || undefined,
    cc_display,
  };
}

function detectGovtScheme(desc) {
  for (const p of GOVT_SCHEME_PATTERNS) {
    if (p.regex.test(desc)) return { name:p.name, type:p.type };
  }
  return null;
}

// ════════════════════════════════════════════════════════════════
// MAIN ANALYZER
// ════════════════════════════════════════════════════════════════
function analyzeTransactions(transactions) {
  const result = {
    account_summary: {
      total_credits:0, total_debits:0, net_balance:0,
      transaction_count: transactions.length,
      period:'', opening_balance:0, closing_balance:0,
    },
    // ── Dedicated sections (new tabs) ──
    salary:             [],
    pf_epfo:            [],
    loan_disbursements: [],
    emi_payments:       [],
    // ── Other categories ──
    other_income:       [],
    rent:               [],
    sip_investments:    [],
    insurance:          [],
    app_loans:          [],
    utilities:          [],
    credit_card_payments:[],
    bounce_charges:      [],
    stock_market:       [],
    apy_pension:        [],
    govt_scheme_credits:[],
    other_debits:       [],
    // ── Legacy keys (keep for backward compat) ──
    loans:              [],      // alias of emi_payments
    pf_credits:         [],      // alias of pf_epfo credits
    // ── Summaries ──
    monthly_summary: {},
    loan_summary:    {},
    insights: {
      obligation_to_income_ratio:0,
      savings_rate:0,
      avg_monthly_salary:0,
      total_emi_monthly:0,
      total_disbursed:0,
      estimated_total_debt:0,
      risk_flags:[],
      recommendations:[],
      additional_fields_needed:[],
    },
  };

  if (!transactions.length) return result;

  transactions.sort((a,b) => new Date(a.date) - new Date(b.date));
  result.account_summary.period = `${transactions[0].date} to ${transactions[transactions.length-1].date}`;

  const emiSeen       = new Set();
  const processingFees = [];

  for (const tx of transactions) {
    const desc    = (tx.description || tx.remarks || '').trim();
    const debit   = parseAmount(tx.debit  || tx.withdrawal || 0);
    const credit  = parseAmount(tx.credit || tx.deposit    || 0);
    const isCredit = credit > 0;
    const isDebit  = debit  > 0;
    const date    = tx.date || '';
    const balance = parseAmount(tx.balance || 0);
    const month   = monthKey(date);
    const meta    = extractTxnMeta(desc, tx);

    // ── Monthly init ─────────────────────────────────────────────
    if (!result.monthly_summary[month]) {
      result.monthly_summary[month] = {
        credits:0, debits:0, salary:0, emi:0, pf:0, disbursements:0,
        closing_balance:0, transfers_out:0, transfers_in:0
      };
    }
    const ms = result.monthly_summary[month];
    if (isCredit) { ms.credits += credit; result.account_summary.total_credits += credit; }
    if (isDebit)  { ms.debits  += debit;  result.account_summary.total_debits  += debit;  }
    if (balance > 0) ms.closing_balance = balance;

    // ════════════════════════════════
    // CREDIT SIDE
    // ════════════════════════════════
    if (isCredit) {
      // 1. LOAN DISBURSEMENT
      const disb = detectLoanDisbursement(desc, credit, true);
      if (disb) {
        const rec = {
          date, description:desc,
          lender:            disb.lender,
          lender_category:   disb.lender_category,
          loan_type_code:    disb.loan_type.code,
          loan_type_label:   disb.loan_type.label,
          loan_type_icon:    disb.loan_type.icon,
          loan_type_color:   disb.loan_type.color,
          amount:            credit,
          mode: /NEFT/i.test(desc)?'NEFT':/IMPS/i.test(desc)?'IMPS':/RTGS/i.test(desc)?'RTGS':'NEFT',
          loan_account_number: meta.loan_account_masked||'',
          sanction_amount:   credit,
          ...meta,
        };
        result.loan_disbursements.push(rec);
        ms.disbursements += credit;
        continue;
      }

      // 2. SALARY
      const employer = detectSalary(desc, credit, true);
      if (employer) {
        result.salary.push({
          date, description:desc, employer, amount:credit,
          mode:/NACH/i.test(desc)?'NACH':/NEFT/i.test(desc)?'NEFT':/IMPS/i.test(desc)?'IMPS':'Other',
          month, ...meta,
        });
        ms.salary += credit;
        continue;
      }

      // 3. PF / EPFO
      if (detectPF(desc)) {
        const rec = { date, description:desc, amount:credit, type:'credit', source:/EPFO/i.test(desc)?'EPFO':'Employer PF', ...meta };
        result.pf_epfo.push(rec);
        result.pf_credits.push(rec);
        ms.pf += credit;
        continue;
      }

      // 4. GOVT SCHEME
      const govt = detectGovtScheme(desc);
      if (govt) {
        result.govt_scheme_credits.push({ date, description:desc, amount:credit, scheme_name:govt.name, type:govt.type });
        continue;
      }

      // 5. STOCK MARKET (credit = sale / payout)
      const smCredit = detectStockMarket(desc);
      if (smCredit) {
        result.stock_market.push({ date, direction:'credit', platform:smCredit.platform, amount:credit, description:desc, ...meta });
        continue;
      }

      // 6. OTHER INCOME
      result.other_income.push({ date, description:desc.slice(0,80), amount:credit, type:'other' });
    }

    // ════════════════════════════════
    // DEBIT SIDE
    // ════════════════════════════════
    if (isDebit) {
      // Processing fee — stash for later linkage to disbursement
      if (/PROCESSING\s*FEE|DOC(?:UMENTATION)?\s*CHARGES?|STAMP\s*DUTY|DISBURSAL\s*CHARGES?|LOAN\s*CHARGES?/i.test(desc)) {
        processingFees.push({ date, amount:debit, description:desc, ...meta });
      }

      const bounce = detectBounceOrCharges(desc);
      if (bounce) {
        result.bounce_charges.push({ date, description: desc, amount: debit, ...bounce, ...meta });
        continue;
      }

      // 1. APY PENSION
      if (detectAPY(desc)) {
        result.apy_pension.push({ date, description:desc, amount:debit, ...meta });
        continue;
      }

      // 2. LOAN EMI
      const emiInfo = detectLoanEMI(desc, debit);
      if (emiInfo) {
        const key = `${date}|${emiInfo.bank}|${emiInfo.loan_type.code}|${debit}`;
        if (!emiSeen.has(key)) {
          emiSeen.add(key);
          const rec = {
            date, description:desc,
            bank:            emiInfo.bank,
            bank_category:   emiInfo.bank_category,
            loan_type_code:  emiInfo.loan_type.code,
            loan_type_label: emiInfo.loan_type.label,
            loan_type_icon:  emiInfo.loan_type.icon,
            loan_type_color: emiInfo.loan_type.color,
            emi_amount:      debit,
            month,
            mode: detectNACH(desc) ? 'NACH/ECS' : 'Manual',
            loan_account_number: meta.loan_account_masked || '',
            ...meta,
          };
          result.emi_payments.push(rec);
          result.loans.push(rec); // backward compat

          // Loan summary
          if (!result.loan_summary[emiInfo.bank]) {
            result.loan_summary[emiInfo.bank] = {
              bank:            emiInfo.bank,
              bank_category:   emiInfo.bank_category,
              loan_type_code:  emiInfo.loan_type.code,
              loan_type_label: emiInfo.loan_type.label,
              loan_type_icon:  emiInfo.loan_type.icon,
              loan_type_color: emiInfo.loan_type.color,
              emi_amount:      debit,
              count:           0,
              total_paid:      0,
            };
          }
          result.loan_summary[emiInfo.bank].count++;
          result.loan_summary[emiInfo.bank].total_paid += debit;
          ms.emi += debit;
        }
        continue;
      }

      // 3. INSURANCE
      const ins = detectInsurance(desc);
      if (ins) {
        result.insurance.push({ date, provider:ins.provider, policy_type:ins.type, amount:debit, description:desc, ...meta });
        continue;
      }

      // 4. STOCK MARKET
      const smDebit = detectStockMarket(desc);
      if (smDebit) {
        result.stock_market.push({ date, direction:'debit', platform:smDebit.platform, amount:debit, description:desc, ...meta });
        continue;
      }

      // 5. SIP
      const sip = detectSIP(desc);
      if (sip) {
        result.sip_investments.push({ date, fund_name:desc.slice(0,60), platform:sip, amount:debit, description:desc, ...meta });
        continue;
      }

      // 6. APP LOANS
      const app = detectAppLoan(desc);
      if (app) {
        result.app_loans.push({ date, app_name:app.name, max_apr:app.maxApr, amount:debit, type:'repayment', description:desc, ...meta });
        continue;
      }

      // 7. RENT
      if (detectRent(desc)) {
        result.rent.push({ date, payee:desc.slice(0,50), amount:debit, description:desc, mode:'UPI', ...meta });
        continue;
      }

      // 8. CREDIT CARD
      const cc = classifyCreditCardPayment(desc);
      if (cc) {
        result.credit_card_payments.push({ date, description:desc, amount:debit, ...cc, ...meta });
        continue;
      }

      // 9. PF DEBIT (employee contribution)
      if (detectPF(desc)) {
        result.pf_epfo.push({ date, description:desc, amount:debit, type:'debit', source:'Employee PF contribution', ...meta });
        ms.pf += debit;
        continue;
      }

      // 10. UTILITIES
      const util = detectUtility(desc);
      if (util) {
        result.utilities.push({ date, description:desc.slice(0,60), amount:debit, category:util, ...meta });
        continue;
      }

      // Fallthrough
      result.other_debits.push({ date, description:desc.slice(0,80), amount:debit });
    }
  }

  // ── Link processing fees to disbursements ───────────────────────
  if (processingFees.length && result.loan_disbursements.length) {
    const byMonth = {};
    for (const d of result.loan_disbursements) {
      const m = monthKey(d.date);
      if (!byMonth[m]) byMonth[m] = [];
      byMonth[m].push(d);
    }
    for (const fee of processingFees) {
      const candidates = byMonth[monthKey(fee.date)] || [];
      if (!candidates.length) continue;
      let picked = candidates.length === 1 ? candidates[0] : null;
      if (!picked) {
        const fd = new Date(fee.date);
        for (const d of candidates) {
          const dd = new Date(d.date);
          if (!isNaN(dd) && Math.abs((fd-dd)/(86400000)) <= 7) { picked=d; break; }
        }
      }
      if (picked) picked.processing_fee = (picked.processing_fee||0) + (fee.amount||0);
    }
  }

  // ── COMPUTE INSIGHTS ────────────────────────────────────────────
  const salaryMonths = result.salary.length > 0
    ? new Set(result.salary.map(s => monthKey(s.date))).size : 1;

  result.insights.avg_monthly_salary =
    result.salary.reduce((s,x) => s+x.amount, 0) / salaryMonths;

  const emiByBank = {};
  for (const e of result.emi_payments) {
    if (!emiByBank[e.bank] || e.emi_amount > emiByBank[e.bank])
      emiByBank[e.bank] = e.emi_amount;
  }
  result.insights.total_emi_monthly    = Object.values(emiByBank).reduce((a,b)=>a+b,0);
  result.insights.total_disbursed      = result.loan_disbursements.reduce((s,x)=>s+x.amount,0);
  result.insights.estimated_total_debt = result.insights.total_emi_monthly * 36;

  const apyMonthly = result.apy_pension.length > 0
    ? result.apy_pension.reduce((s,x)=>s+x.amount,0) / salaryMonths : 0;

  result.insights.obligation_to_income_ratio = result.insights.avg_monthly_salary > 0
    ? Math.round(((result.insights.total_emi_monthly + apyMonthly) / result.insights.avg_monthly_salary) * 100)
    : 0;

  result.account_summary.net_balance =
    result.account_summary.total_credits - result.account_summary.total_debits;

  const totalMonths = Object.keys(result.monthly_summary).length || 1;
  const avgCredit = result.account_summary.total_credits / totalMonths;
  const avgDebit  = result.account_summary.total_debits  / totalMonths;
  result.insights.savings_rate = avgCredit > 0
    ? Math.round(((avgCredit - avgDebit) / avgCredit) * 100) : 0;

  // ── RISK FLAGS ──────────────────────────────────────────────────
  const R = result.insights.risk_flags;
  const ratio = result.insights.obligation_to_income_ratio;
  if (ratio > 60) R.push(`EMI obligation ratio is ${ratio}% — critical (RBI safe limit: 40%)`);
  else if (ratio > 40) R.push(`EMI obligation ratio is ${ratio}% — moderate risk`);

  const allBals = transactions.filter(t=>t.balance).map(t=>parseAmount(t.balance));
  if (allBals.length) {
    const minBal = Math.min(...allBals);
    if (minBal < 500) R.push(`Balance dropped to ₹${minBal.toFixed(2)} — near-zero liquidity`);
  }
  if (result.app_loans.length > 0)
    R.push(`${result.app_loans.length} app loan repayment(s) — high-interest debt (24–48% APR)`);
  if (result.loan_disbursements.length > 0)
    R.push(`${result.loan_disbursements.length} fresh loan disbursement(s) totalling ₹${fmt(result.insights.total_disbursed)}`);
  if (result.sip_investments.length === 0)
    R.push('No SIP/mutual fund investment detected — wealth creation gap');
  if (result.insurance.filter(i=>i.policy_type==='life').length === 0)
    R.push('No life insurance premium detected — financial protection gap');
  if (Object.keys(result.loan_summary).length > 2)
    R.push(`${Object.keys(result.loan_summary).length} active loans — debt consolidation recommended`);
  const ccTotal = result.credit_card_payments.reduce((s,x)=>s+x.amount,0);
  if (ccTotal > 0) R.push(`Credit card payments: ₹${fmt(ccTotal)} — monitor revolving debt`);

  // ── RECOMMENDATIONS ─────────────────────────────────────────────
  const Rec = result.insights.recommendations;
  if (result.sip_investments.length === 0)
    Rec.push('Start SIP: ₹1,000/month in index funds builds wealth through compounding');
  if (result.insurance.length === 0)
    Rec.push('Get term life (₹1Cr cover ~₹700/month) + health insurance (₹5L cover ~₹500/month)');
  if (ratio > 50)
    Rec.push('Loan consolidation or part-prepayment recommended to bring EMI ratio below 40%');
  if (result.app_loans.length > 0)
    Rec.push('Clear high-interest app loans first — they charge 24–48% APR vs 10–18% bank loans');
  if (result.pf_epfo.filter(p=>p.type==='credit').length > 0)
    Rec.push('PF withdrawal detected — consider VPF top-up for tax-free retirement returns');
  if (result.insights.savings_rate < 10)
    Rec.push('Savings rate below 10% — budget review needed to identify discretionary spending');

  // ── ADDITIONAL FIELDS NEEDED ────────────────────────────────────
  result.insights.additional_fields_needed = [
    'Loan Account Number (LAN) — links disbursement to EMI repayment',
    'Principal vs Interest split — for tax benefit (Sec 24b / 80C)',
    'Outstanding Loan Balance — from loan statement or net banking',
    'Loan Tenure (months) — to project future cash outflows',
    'Interest Rate (ROI %) — fixed or floating (MCLR/EBLR based)',
    'Processing Fee — one-time charge at disbursement',
    'Bounce / Penal Charges — indicates missed EMI',
    'Co-applicant Name — for joint loan products',
    'Security / Collateral Type — for HL, LAP, GL',
    'Moratorium Period — for EL or restructured loans',
    'Employer Name on Payslip — to verify salary consistency',
    'UAN Number — to link EPFO account with salary account',
    'TDS Certificate (Form 16) — for gross vs net salary reconciliation',
    'GST / Business Turnover — for BL underwriting',
  ];

  return result;
}

module.exports = { analyzeTransactions, parseAmount, parseDate, fmt, parseCibilText, crossVerifyCibil, assessEligibility, assessUnderwriting };




// BANK STATEMENT ANALYZER - TRANSACTION CLASSIFICATION & INSIGHTS - GPT BRANCH
// ===========================================================================






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

// const SALARY_SOURCE_MAP = { 'AI AIRPORT':'AI Airport Services Ltd', 'AIAIRPORT':'AI Airport Services Ltd', 'INFOSYS':'Infosys BPO Ltd', 'WIPRO':'Wipro Ltd', 'TCS':'Tata Consultancy Services', 'HCL':'HCL Technologies', 'COGNIZANT':'Cognizant Technology', 'ACCENTURE':'Accenture' };



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
  computeMonthlySummary(analysis, txns);
  computeInsights(analysis);
  computeLoanSummary(analysis);
  analysis.pf_credits = analysis.pf_epfo || [];
  analysis.sip_investments = analysis.sip_investments || [];
  analysis.family_transfers = { in: analysis.transfers_in || [], out: analysis.transfers_out || [] };
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
