// INDIAN BANK STATEMENT ANALYZER v4.0
// Generic · All Indian Banks · Rule-Based · No AI Required
// Merged: best patterns + loan type system + RBI classification
// ================================================================

// ── LOAN TYPE MAP (RBI Classification) ──────────────────────────
const LOAN_TYPE_MAP = [
  { regex: /HOME.*LOAN|HOUSING.*LOAN|MORTGAGE|HFL|HOMELOAN|\bHL\b|GRUH|NHB|LICHFL|LIC.*HFL/i,
    code:'HL', label:'Home Loan', color:'blue', icon:'🏠' },
  { regex: /LAP\b|LOAN.*AGAINST.*PROP|PROP.*LOAN|MORTGAGE.*LOAN/i,
    code:'LAP', label:'Loan Against Property', color:'blue', icon:'🏢' },
  { regex: /CAR.*LOAN|AUTO.*LOAN|VEHICLE.*LOAN|TWO.*WHEEL|\bVL\b|CARLOAN|BIKE.*LOAN/i,
    code:'VL', label:'Vehicle Loan', color:'amber', icon:'🚗' },
  { regex: /EDUCATION.*LOAN|EDU.*LOAN|STUDENT.*LOAN|\bEL\b|VIDYA|SCHOLAR/i,
    code:'EL', label:'Education Loan', color:'teal', icon:'🎓' },
  { regex: /BUSINESS.*LOAN|\bBL\b|MSME|SME.*LOAN|WORKING.*CAP|TERM.*LOAN|MUDRA|COMMERCIAL/i,
    code:'BL', label:'Business Loan', color:'purple', icon:'💼' },
  { regex: /GOLD.*LOAN|\bGL\b|MUTHOOT|MANAPPURAM|PLEDGED.*GOLD/i,
    code:'GL', label:'Gold Loan', color:'amber', icon:'🥇' },
  { regex: /CONSUMER.*DUR|\bCDL\b|DURABLE.*LOAN|NO.*COST.*EMI/i,
    code:'CDL', label:'Consumer Durable Loan', color:'teal', icon:'📱' },
  { regex: /AGRI.*LOAN|KISAN|CROP.*LOAN|\bKCC\b|FARM.*LOAN|\bAGRI\b/i,
    code:'AL', label:'Agriculture Loan', color:'green', icon:'🌾' },
  { regex: /OVERDRAFT|\bOD\b|CREDIT.*LINE|CASH.*CREDIT/i,
    code:'OD', label:'Overdraft / Credit Line', color:'red', icon:'🔄' },
  { regex: /PERSONAL.*LOAN|\bPL\b|PERSLOAN|CONSUMER.*LOAN|UNSECURED/i,
    code:'PL', label:'Personal Loan', color:'red', icon:'👤' },
];

// ── LENDER REGISTRY (100+ Indian Banks/NBFCs) ───────────────────
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
  { regex: /\bICIC\b|\bICICI\b/i,                         name:'ICICI Bank',                         category:'Pvt' },
  { regex: /\bUTIB\b|AXIS.*BANK/i,                        name:'Axis Bank',                          category:'Pvt' },
  { regex: /\bKKBK\b|KOTAK/i,                             name:'Kotak Mahindra Bank',                 category:'Pvt' },
  { regex: /\bYESB\b|YES.*BANK/i,                         name:'Yes Bank',                           category:'Pvt' },
  { regex: /\bINDB\b|INDUS.*IND/i,                        name:'IndusInd Bank',                      category:'Pvt' },
  { regex: /\bFDRL\b|FEDERAL.*BANK/i,                     name:'Federal Bank',                       category:'Pvt' },
  { regex: /\bIDFB\b|\bIDFC\b/i,                          name:'IDFC First Bank',                    category:'Pvt' },
  { regex: /\bIBKL\b|\bIDBI\b/i,                          name:'IDBI Bank',                          category:'Pvt' },
  { regex: /\bIDIB\b|INDIAN.*BANK/i,                      name:'Indian Bank',                        category:'PSB' },
  { regex: /\bRBLB\b|\bRBL\b/i,                           name:'RBL Bank',                           category:'Pvt' },
  { regex: /\bBAND\b|BANDHAN/i,                           name:'Bandhan Bank',                       category:'Pvt' },
  { regex: /\bAUBK\b|AU.*SMALL|AU.*FINANCE/i,             name:'AU Small Finance Bank',              category:'SFB' },
  // Co-operative Banks
  { regex: /\bSRCB\b|SARASWAT/i,                          name:'Saraswat Bank',                      category:'Coop' },
  { regex: /\bDNSB\b|DOMBIVLI/i,                          name:'Dombivli Nagari Sahakari Bank',       category:'Coop' },
  { regex: /\bKJSB\b|KALYAN.*JANATA/i,                    name:'Kalyan Janata Sahakari Bank',         category:'Coop' },
  { regex: /\bTDCB\b/i,                                   name:'Thane District Central Bank',         category:'Coop' },
  // NBFCs
  { regex: /SMFG|SMFGINDIACR|SMFG.*INDIA/i,               name:'SMFG India Credit',                  category:'NBFC' },
  { regex: /BAJAJ.*FIN|BAJAJFIN/i,                         name:'Bajaj Finance Ltd',                  category:'NBFC' },
  { regex: /TATA.*CAP|TATACAP/i,                           name:'Tata Capital',                       category:'NBFC' },
  { regex: /ADITYA.*BIRLA|ABFL/i,                          name:'Aditya Birla Finance',               category:'NBFC' },
  { regex: /FULLERTON|FULLERTONIND/i,                      name:'Fullerton India Credit',              category:'NBFC' },
  { regex: /L&T.*FIN|LNTFIN/i,                             name:'L&T Finance',                        category:'NBFC' },
  { regex: /MUTHOOT/i,                                     name:'Muthoot Finance',                    category:'NBFC' },
  { regex: /MANAPPURAM/i,                                  name:'Manappuram Finance',                 category:'NBFC' },
  { regex: /SHRIRAM.*FIN|SHRIRAM.*TRANS/i,                 name:'Shriram Finance',                    category:'NBFC' },
  { regex: /MAHINDRA.*FIN|MAHFIN/i,                        name:'Mahindra Finance',                   category:'NBFC' },
  { regex: /\bCHOLA\b|CHOLAMANDALAM/i,                     name:'Cholamandalam Finance',              category:'NBFC' },
  { regex: /HERO.*FINCORP|HEROFIN/i,                       name:'Hero FinCorp',                       category:'NBFC' },
  { regex: /FINAGLE/i,                                     name:'Finagle (Kotak)',                    category:'Fintech' },
  { regex: /\bIIFL\b|INDIA.*INFOLINE/i,                    name:'IIFL Finance',                       category:'NBFC' },
  // HFCs
  { regex: /PIRAMAL|PIRAMALMORT|PIRAMAL.*CAP/i,            name:'Piramal Capital & Housing Finance',  category:'HFC' },
  { regex: /LICHFL|LIC.*HFL|LIC.*HOUSING/i,                name:'LIC Housing Finance',                category:'HFC' },
  { regex: /INDIABULL.*HOUSING|IBHFL/i,                    name:'Indiabulls Housing Finance',         category:'HFC' },
  // Payments Banks
  { regex: /\bPPIW\b|PAYTM.*PAYMENTS/i,                   name:'Paytm Payments Bank',                category:'PB' },
  { regex: /\bFINO\b/i,                                    name:'Fino Payments Bank',                 category:'PB' },
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

function parseDate(s) {
  if (!s) return undefined;
  const d = s.toString().trim();
  const m = d.match(/(\d{1,2})[-\/\s](\d{1,2}|[A-Z]{3})[-\/\s](\d{2,4})/i);
  if (!m) return undefined;
  let day = m[1];
  let mon = m[2];
  let year = m[3];
  if (year.length === 2) year = '20' + year;
  const months = { JAN:'01', FEB:'02', MAR:'03', APR:'04', MAY:'05', JUN:'06', JUL:'07', AUG:'08', SEP:'09', OCT:'10', NOV:'11', DEC:'12' };
  if (isNaN(mon)) mon = months[mon.toUpperCase().slice(0, 3)] || '01';
  return `${year}-${mon.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function parseCibilText(text) {
  const t = (text || '').toString();
  const lines = t.split('\n').map(x => x.trim()).filter(Boolean);
  const joined = lines.join('\n');
  const joinedFlat = lines.join(' ').replace(/\s+/g, ' ').trim();

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
  
  // Pass 0: Robust name and identification extraction
  const helloMatch = joined.match(/\bHello,\s+([A-Z][A-Z ]{2,60})/i);
  if (helloMatch) personal.name = helloMatch[1].trim();

  // Better name extraction for CIBIL format
  if (!personal.name) {
    const personalIdx = joined.toUpperCase().indexOf('PERSONAL DETAILS');
    if (personalIdx >= 0) {
      const personalSeg = joined.slice(personalIdx, personalIdx + 500);
      const nameLineMatch = personalSeg.match(/Name\s*\n\s*([A-Z][A-Z ]{2,80})/i);
      if (nameLineMatch && !nameLineMatch[1].toUpperCase().includes('PERSONAL DETAILS')) personal.name = nameLineMatch[1].trim();
    }
  }

  const panSearch = joined.match(/([A-Z]{5}\d{4}[A-Z])/);
  if (panSearch) personal.pan = panSearch[1];

  const dobSearch = joined.match(/Date\s*Of\s*Birth\s*(\d{2}[-\/]\d{2}[-\/]\d{4})/i);
  if (dobSearch) personal.dob = parseDate(dobSearch[1]);

  const genderSearch = joined.match(/Gender\s*(Male|Female|Transgender)/i);
  if (genderSearch) personal.gender = genderSearch[1];

  const personalStartIdx = joined.toUpperCase().indexOf('PERSONAL DETAILS');
  const identificationIdx = joined.toUpperCase().indexOf('IDENTIFICATION DETAILS');
  
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
      let v = (m[2] || '').toString().trim();

      // Check if k is just the label and value is on next line (common in new CIBIL format)
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
             // If existing name was just a greeting prefix, overwrite it
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
    const enqIdx = joined.toUpperCase().indexOf('ENQUIRY DETAILS');
    if (enqIdx >= 0) {
      const enqSeg = joined.slice(enqIdx);
      const enqSegments = enqSeg.split(/(?=Member\s*Name|Date\s*Of\s*Enquiry|Enquiry\s*Purpose)/i);
      let currentEnq = null;
      for (let i = 0; i < enqSegments.length; i++) {
        let seg = enqSegments[i];
        const memberMatch = seg.match(/Member\s*Name\s*[:\-]?\s*\n?\s*(.+?)(?:\n|$)/i);
        const dateMatch = seg.match(/Date\s*Of\s*Enquiry\s*[:\-]?\s*\n?\s*(\d{2}[-\/]\d{2}[-\/]\d{4})/i);
        const purposeMatch = seg.match(/Enquiry\s*Purpose\s*[:\-]?\s*\n?\s*(.+?)(?:\n|$)/i);

        if (memberMatch) {
          if (currentEnq && currentEnq.member && currentEnq.date) {
            enquiry_details.push(currentEnq);
          }
          currentEnq = { member: memberMatch[1].trim(), raw: seg.trim() };
        }
        
        if (dateMatch) {
          if (!currentEnq) currentEnq = { raw: seg.trim() };
          currentEnq.date = parseDate(dateMatch[1]);
          currentEnq.raw = (currentEnq.raw || '') + '\n' + seg.trim();
        }

        if (purposeMatch) {
          if (!currentEnq) currentEnq = { raw: seg.trim() };
          currentEnq.purpose = purposeMatch[1].trim();
          currentEnq.raw = (currentEnq.raw || '') + '\n' + seg.trim();
        }
      }
      if (currentEnq && currentEnq.member && currentEnq.date) {
        enquiry_details.push(currentEnq);
      }
    }
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
    
    // Equifax / New CIBIL format support
    if (line.match(/^Member\s*Name/i) && !line.includes(':')) {
      const nextLine = (lines[lineIdx + 1] || '').trim();
      if (nextLine && !nextLine.match(/[:\-]/) && nextLine.length > 2) {
        if (cur && Object.keys(cur).length >= 2) push();
        cur = { lender: nextLine };
        lineIdx++; // Skip next line as it was the lender name
        continue;
      }
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
  const upper = joinedFlat.toUpperCase();
  const typeRe = '(?:Personal\\s+Loan|Education\\s+Loan|Home\\s+Loan|Housing\\s+Loan|Vehicle\\s+Loan|Two\\s+Wheeler\\s+Loan|Used\\s+Car\\s+Loan|Gold\\s+Loan|Business\\s+Loan(?:\\s+General)?|Consumer\\s+Loan|Loan\\s+Against\\s+Property|Property\\s+Loan|Overdraft|Credit\\s+Card|Loan\\s+on\\s+Credit\\s+Card|Other)';

  // Pass 1: Summary: Loan Accounts
  const idxLoan = upper.indexOf('SUMMARY: LOAN ACCOUNTS');
  if (idxLoan >= 0) {
    let seg = joinedFlat.slice(idxLoan, idxLoan + 40000);
    const hdr = seg.toUpperCase().indexOf('OUTSTANDING BALANCE');
    if (hdr >= 0) seg = seg.slice(hdr + 'OUTSTANDING BALANCE'.length);
    const rowRe = new RegExp(`([A-Z][A-Z0-9 &.'-]{2,80}?)\\s+(${typeRe})\\s+([A-Z0-9X*-]{4,})\\s+(Individual|Guarantor|Joint|Co-Applicant|Co Applicant|CoApplicant|Authorized User|Authorised User)\\s+(\\d{2}-\\d{2}-\\d{4})\\s+(Active\\*?\\*?|Closed|Settled|Written\\s*Off|Suit\\s*Filed|Wilful\\s*Default|Loss|Special\\s*Mention|SMA)\\s+(\\d{2}-\\d{2}-\\d{4})\\s+([\\d,]+)\\s+([\\d,]+)(?:\\s+([\\d,]+))?(?:\\s+([\\d,]+))?`, 'gi');
    let m;
    while ((m = rowRe.exec(seg)) !== null) {
      const lender = (m[1] || '').toString().trim();
      if (!lender || /\bDATE\b|\bACCOUNT\b|\bSTATUS\b|\bUPDATE\b/i.test(lender)) continue;
      const account_type = (m[2] || '').toString().trim();
      const n1 = parseNum(m[8]) || undefined;
      const n2 = parseNum(m[9]) || undefined;
      summaryAccounts.push({
        lender,
        account_type,
        account_no: (m[3] || '').trim(),
        ownership: (m[4] || '').trim(),
        opened_date: parseDate(m[5]),
        account_status: (m[6] || '').replace(/\s+/g, ' ').trim(),
        last_update: parseDate(m[7]),
        sanctioned_amount: /credit\s*card/i.test(account_type) ? undefined : n1,
        high_credit: /credit\s*card/i.test(account_type) ? n1 : undefined,
        current_balance: n2,
        overdue_amount: parseNum(m[10]) || undefined,
        emi: parseNum(m[11]) || undefined,
      });
    }
  }

  // Pass 2: Summary: Credit Cards
  const idxCC = upper.indexOf('SUMMARY: CREDIT CARDS');
  if (idxCC >= 0) {
    let seg = joinedFlat.slice(idxCC, idxCC + 40000);
    const hdr = seg.toUpperCase().indexOf('OUTSTANDING BALANCE');
    if (hdr >= 0) seg = seg.slice(hdr + 'OUTSTANDING BALANCE'.length);
    const rowRe = new RegExp(`([A-Z][A-Z0-9 &.'-]{2,80}?)\\s+(${typeRe})\\s+([A-Z0-9X*-]{4,})\\s+(Individual|Guarantor|Joint|Co-Applicant|Co Applicant|CoApplicant|Authorized User|Authorised User)\\s+(\\d{2}-\\d{2}-\\d{4})\\s+(Active\\*?\\*?|Closed|Settled|Written\\s*Off|Suit\\s*Filed|Wilful\\s*Default|Loss|Special\\s*Mention|SMA)\\s+(\\d{2}-\\d{2}-\\d{4})\\s+([\\d,NA-]+)\\s+([\\d,NA-]+)(?:\\s+([\\d,NA-]+))?(?:\\s+([\\d,NA-]+))?`, 'gi');
    let m;
    while ((m = rowRe.exec(seg)) !== null) {
      const lender = (m[1] || '').toString().trim();
      if (!lender || /\bDATE\b|\bACCOUNT\b|\bSTATUS\b|\bUPDATE\b/i.test(lender)) continue;
      const account_type = (m[2] || '').toString().trim();
      const n1 = parseNum(m[8]) || undefined;
      const n2 = parseNum(m[9]) || undefined;
      summaryAccounts.push({
        lender,
        account_type,
        account_no: (m[3] || '').trim(),
        ownership: (m[4] || '').trim(),
        opened_date: parseDate(m[5]),
        account_status: (m[6] || '').replace(/\s+/g, ' ').trim(),
        last_update: parseDate(m[7]),
        high_credit: n1,
        current_balance: n2,
        overdue_amount: parseNum(m[10]) || undefined,
        emi: parseNum(m[11]) || undefined,
      });
    }
  }

  // Pass 3: Catch-all regex for accounts that might have been missed
  const seenSummaryKeys = new Set(summaryAccounts.map(accountKey));
  const accountNoRe = /\b(?:[X*]{2,}[A-Z0-9*-]*|[0-9]{4,}[A-Z0-9X*-]*)\b/gi;
  let mm;
  while ((mm = accountNoRe.exec(joinedFlat)) !== null) {
    const accountNo = (mm[1] || '').trim();
    const before = joinedFlat.slice(Math.max(0, mm.index - 180), mm.index).replace(/\s+/g, ' ').trim();
    const after = joinedFlat.slice(mm.index + accountNo.length, mm.index + accountNo.length + 260).replace(/\s+/g, ' ').trim();
    
    // Improved beforeMatch to avoid capturing previous account data
    const beforeMatch = before.match(new RegExp(`(?:^|\\s)([A-Z][A-Z0-9 &.'-]{2,60})\\s+(${typeRe})\\s*$`, 'i'));
    const afterMatch = after.match(/^\s*(Individual|Guarantor|Joint|Co-Applicant|Co Applicant|CoApplicant|Authorized User|Authorised User)\s+(\d{2}-\d{2}-\d{4})\s+(Active\*?\*?|Closed|Settled|Written\\s*Off|Suit\\s*Filed|Wilful\\s*Default|Loss|Special\\s*Mention|SMA)\s+(\d{2}-\d{2}-\d{4})\s+([\\d,NA-]+)\s+([\\d,NA-]+)(?:\s+([\\d,NA-]+))?(?:\s+([\\d,NA-]+))?/i);
    
    if (!beforeMatch || !afterMatch) continue;
    const lender = (beforeMatch[1] || '').replace(/\b(?:FINANCIAL\s+INSTITUTION|ACCOUNT\s+TYPE|ENQUIRY\s+PURPOSE|SR\s+NO|SUMMARY|DETAILS|REPORT|DATE|STATUS|UPDATE|NA)\b/gi, ' ').trim();
    const account_type = (beforeMatch[2] || '').trim();
    if (!lender || lender.length < 2 || /\b(?:DATE|ACCOUNT|STATUS|UPDATE|DETAILS|SUMMARY|REPORT)\b/i.test(lender) || /\d{2}-\d{2}-\d{4}/.test(lender) || lender.includes('XXXX')) continue;

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

  for (const summary of summaryAccounts) {
    const key = accountKey(summary);
    const existing = accounts.find(a => accountKey(a) === key);
    if (existing) {
      mergeAccountFields(existing, summary);
    } else {
      accounts.push(summary);
    }
  }

  const detailSegments = joined.split(/(?=\b(?:MEMBER\s*NAME|LENDER|BANK\s*NAME|FINANCIER|INSTITUTION|ACCOUNT\s+DETAILS|ACCOUNT\s+INFORMATION|CREDIT\s+ACCOUNT)\b)/i);
  const dpdByAccount = new Map();
  for (let i = 0; i < detailSegments.length; i++) {
    const segment = detailSegments[i];
    const prevSegment = i > 0 ? detailSegments[i - 1] : '';
    const searchWindow = prevSegment + '\n' + segment;

    const segmentAccountNo =
      (segment.match(/\b(?:ACCOUNT\s*(?:NUMBER|NO)|ACCT\s*(?:NUMBER|NO))\s*[:\-]?\s*\n?\s*([A-Z0-9X*-]{4,30})/i) || [])[1] ||
      (segment.match(/\b(?:[X*]{2,}[A-Z0-9*-]*|[0-9]{4,}[A-Z0-9X*-]*)\b/i) || [])[1] ||
      '';
    const segmentLender =
      (segment.match(/\b(?:MEMBER\s*NAME|LENDER|BANK\s*NAME|FINANCIER|INSTITUTION)\s*[:\-]?\s*\n?\s*(.+?)(?:\n|$)/i) || [])[1] ||
      (segment.match(/Account\s+Details\s+([A-Z][A-Z0-9 &.'-]{2,80})/i) || [])[1] ||
      (segment.match(/^\s*([A-Z][A-Z0-9 &.'-]{2,80})\s*\n\s*Account\s+Number/im) || [])[1] ||
      (segment.match(/\b([A-Z][A-Z0-9 &.'-]{2,60})\s+(?:Active|Closed|Settled|Written\s*Off|Suit\s*Filed|Wilful\s*Default|Loss|Special\s*Mention|SMA)[*]*\s+Account Number:/i) || [])[1] ||
      (segment.match(/\b(?:Account\s+Information|Credit\s+Account)\s*\n\s*([A-Z][A-Z0-9 &.'-]{2,80})/i) || [])[1] ||
      '';
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
      const key = accountKey(detailAccount);
      const existing = accounts.find(a => accountKey(a) === key) ||
        accounts.find(a => detailAccount.account_no && (a.account_no || '').toString().replace(/[^A-Z0-9]/gi, '').toUpperCase() === detailAccount.account_no.toString().replace(/[^A-Z0-9]/gi, '').toUpperCase());
      if (existing) mergeAccountFields(existing, detailAccount);
      else if (detailAccount.account_no && (detailAccount.lender || detailAccount.account_type)) accounts.push(detailAccount);
    }
  }

  const isClosedAccount = (a) => {
    const st = (a?.account_status || '').toString().toUpperCase();
    return /CLOSED|SETTLED|WRITTEN\s*OFF|CHARGEOFF|CHARGE\s*OFF|SUIT\s*FILED/i.test(st) || !!a?.closed_date;
  };

  if (accounts.length) {
    const seen = new Set();
    const uniq = [];
    for (const a of accounts) {
      const key = `${(a.account_no || '').toString().trim()}|${(a.lender || '').toString().trim()}|${(a.account_type || '').toString().trim()}`;
      if (!a.account_no || seen.has(key)) continue;
      seen.add(key);
      uniq.push(a);
    }
    const finalUniq = [];
    const noMap = new Map();
    for (const a of uniq) {
      const no = (a.account_no || '').toString().replace(/[^A-Z0-9]/gi, '').toUpperCase();
      if (!no) {
        finalUniq.push(a);
        continue;
      }
      if (noMap.has(no)) {
        const existing = noMap.get(no);
        const l1 = (existing.lender || '').toUpperCase();
        const l2 = (a.lender || '').toUpperCase();
        if (l1.includes(l2) || l2.includes(l1) || l1.slice(0, 5) === l2.slice(0, 5)) {
          if (l2.length < l1.length && l2.length > 3) {
            const old = { ...existing };
            Object.assign(existing, a);
            mergeAccountFields(existing, old);
          } else {
            mergeAccountFields(existing, a);
          }
          continue;
        }
      }
      finalUniq.push(a);
      noMap.set(no, a);
    }
    accounts.length = 0;
    accounts.push(...finalUniq);
  }

  for (const a of accounts) {
    if (a.dpd_history?.length) {
      a.dpd_max = Math.max(a.dpd_max || 0, ...a.dpd_history.map(h => Number(h.days) || 0));
      a.dpd_delay_count = a.dpd_history.filter(h => (Number(h.days) || 0) > 0).length;
      a.dpd_history_formatted = a.dpd_history
        .map(h => `${(h.month || '').toLowerCase()} - ${h.days}`)
        .join(', ');
    }
    delete a._dpd_text;
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
const NACH_PATTERNS = [
  /^NACH\//i, /^NACH\s/i, /^ECS\//i, /^ECS\s/i,
  /^ACH\//i, /^EMANCH\//i, /^SI\//i, /^SI\s/i,
  /E-?MANDATE/i, /\bMANDATE\b/i, /AUTO\s*DEBIT/i,
  /NACH.*DEBIT/i, /ECS.*DEBIT/i,
];

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
  { regex: /UTI.*MF/i,                        platform:'UTI MF' },
  { regex: /KOTAK.*MF/i,                      platform:'Kotak MF' },
  { regex: /TATA.*MF/i,                       platform:'Tata MF' },
  { regex: /CANARA.*ROBECO/i,                 platform:'Canara Robeco MF' },
  { regex: /DSP.*MF/i,                        platform:'DSP MF' },
  { regex: /IDFC.*MF|BANDHAN.*MF/i,           platform:'Bandhan MF' },
  { regex: /HSBC.*MF/i,                       platform:'HSBC MF' },
  { regex: /FRANKLIN.*TEMPLETON/i,            platform:'Franklin Templeton MF' },
];

function analyzeTransactions(transactions) {
  const txns = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const analysis = {
    salary: [],
    pf_epfo: [],
    loans: [], // alias for emi_payments
    emi_payments: [],
    loan_disbursements: [],
    apy_pension: [],
    rent: [],
    app_loans: [],
    credit_card_payments: [],
    stock_market: [],
    insurance: [],
    utilities: [],
    transfers_in: [],
    transfers_out: [],
    bounce_charges: [],
    account_summary: {},
    monthly_summary: {},
    insights: {
      avg_monthly_salary: 0,
      total_emi_monthly: 0,
      obligation_to_income_ratio: 0,
      savings_rate: 0,
      risk_flags: [],
      recommendations: []
    },
    loan_summary: {}
  };

  if (!txns.length) return analysis;

  let totalCredits = 0;
  let totalDebits = 0;
  const periodStart = txns[0].date;
  const periodEnd = txns[txns.length - 1].date;

  for (const t of txns) {
    const desc = normUpper(t.description);
    const amt = Number(t.amount) || 0;
    const type = (t.type || '').toUpperCase();

    if (type === 'CREDIT') totalCredits += amt;
    else if (type === 'DEBIT') totalDebits += amt;

    // Detect Salary
    const salary = detectSalary(t);
    if (salary) analysis.salary.push(salary);

    // Detect PF/EPFO
    if (type === 'CREDIT' && (desc.includes('EPFO') || desc.includes('PFUND') || desc.includes('PROV FUND'))) {
      analysis.pf_epfo.push(t);
    }

    // Detect Loan Disbursement
    const disb = detectLoanDisbursement(t);
    if (disb) analysis.loan_disbursements.push(disb);

    // Detect EMI
    const emi = detectLoanEMI(t);
    if (emi) {
      analysis.emi_payments.push(emi);
      analysis.loans.push(emi);
    }

    // Detect APY
    if (type === 'DEBIT' && (desc.includes('APY') || desc.includes('ATAL PENSION'))) {
      analysis.apy_pension.push(t);
    }

    // Detect Rent
    const rent = detectRent(t);
    if (rent) analysis.rent.push(rent);

    // Detect App Loans
    const appLoan = detectAppLoan(t);
    if (appLoan) analysis.app_loans.push(appLoan);

    // Detect Credit Card
    const cc = detectCreditCardPayment(t);
    if (cc) analysis.credit_card_payments.push(cc);

    // Detect Stock Market
    const stock = detectStockMarket(t);
    if (stock) analysis.stock_market.push(stock);

    // Detect Insurance
    const ins = detectInsurance(t);
    if (ins) analysis.insurance.push(ins);

    // Detect Utilities
    const util = detectUtilities(t);
    if (util) analysis.utilities.push(util);

    // Detect Transfers
    const trans = detectTransfers(t);
    if (trans) {
      if (type === 'CREDIT') analysis.transfers_in.push(trans);
      else analysis.transfers_out.push(trans);
    }

    // Detect Bounce Charges
    const bounce = detectBounceCharges(t);
    if (bounce) analysis.bounce_charges.push(bounce);
  }

  // Account Summary
  analysis.account_summary = {
    period: `${periodStart} to ${periodEnd}`,
    transaction_count: txns.length,
    total_credits: totalCredits,
    total_debits: totalDebits,
    net_balance: totalCredits - totalDebits
  };

  // Monthly Summary & Insights
  computeMonthlySummary(analysis, txns);
  computeInsights(analysis);
  computeLoanSummary(analysis);

  return analysis;
}

function detectSalary(t) {
  if (t.type !== 'CREDIT' || t.amount < 5000) return null;
  const desc = normUpper(t.description);
  if (anyMatch(desc, SALARY_KEYWORDS)) {
    return { ...t, employer: inferSalaryEmployer(t.description) };
  }
  if (desc.includes('NACH') && !anyMatch(desc, ['REJECT', 'RETURN', 'BOUNCE'])) {
    return { ...t, employer: inferSalaryEmployer(t.description) };
  }
  return null;
}

function inferSalaryEmployer(desc) {
  const d = normUpper(desc);
  for (const [key, name] of Object.entries(SALARY_SOURCE_MAP)) {
    if (d.includes(key)) return name;
  }
  const nachMatch = desc.match(/NACH\/([^\/]+)/i);
  if (nachMatch) return nachMatch[1].trim();
  const salMatch = desc.match(/SAL(?:ARY)?\s+(?:FOR\s+)?(?:[A-Z]{3,}\s+)?([A-Z0-9 &.-]{3,})/i);
  if (salMatch) return salMatch[1].trim();
  return 'Unknown Employer';
}

function detectLoanEMI(t) {
  if (t.type !== 'DEBIT' || t.amount < 500) return null;
  const desc = normUpper(t.description);
  const isEmi = anyMatch(desc, NACH_PATTERNS) || desc.includes('EMI') || desc.includes('LOAN') || desc.includes('MANDATE');
  if (!isEmi) return null;
  
  const lender = LENDER_PATTERNS.find(p => p.regex.test(desc));
  const loanType = LOAN_TYPE_MAP.find(p => p.regex.test(desc));
  
  return {
    ...t,
    emi_amount: t.amount,
    bank: lender ? lender.name : 'Unknown Lender',
    type: loanType ? loanType.code : 'PL',
    loan_category: loanType ? loanType.label : 'Personal Loan',
    ...extractTxnMeta(t.description)
  };
}

function detectLoanDisbursement(t) {
  if (t.type !== 'CREDIT' || t.amount < 5000) return null;
  const desc = normUpper(t.description);
  if (!anyMatch(desc, [/DISB/i, /LOAN/i, /FINANCE/i, /CREDIT/i])) return null;
  if (anyMatch(desc, SALARY_KEYWORDS)) return null;

  const lender = LENDER_PATTERNS.find(p => p.regex.test(desc));
  const loanType = LOAN_TYPE_MAP.find(p => p.regex.test(desc));

  return {
    ...t,
    bank: lender ? lender.name : 'Unknown Lender',
    loan_type: loanType ? loanType.code : 'PL',
    loan_category: loanType ? loanType.label : 'Personal Loan',
    ...extractTxnMeta(t.description)
  };
}

function detectAppLoan(t) {
  const desc = normUpper(t.description);
  const app = APP_LOAN_PATTERNS.find(p => p.regex.test(desc));
  if (!app) return null;

  return {
    ...t,
    app_name: app.name,
    type: t.type === 'CREDIT' ? 'Credit' : 'Repayment',
    ...extractTxnMeta(t.description)
  };
}

function detectRent(t) {
  if (t.type !== 'DEBIT' || t.amount < 2000) return null;
  const desc = normUpper(t.description);
  if (desc.includes('RENT') || desc.includes('HOUSE RENT')) {
    return { ...t, payee: 'Unknown' };
  }
  return null;
}

function detectStockMarket(t) {
  const desc = normUpper(t.description);
  const platforms = ['ZERODHA', 'KITE', 'UPSTOX', 'GROWW', 'ANGEL', 'FYERS', '5PAISA', 'ICICI DIRECT', 'HDFC SEC', 'NUVAMA', 'EDELWEISS'];
  const isStock = platforms.some(p => desc.includes(p)) || anyMatch(desc, [/NSE/i, /BSE/i, /DEMAT/i, /DP CHARGES/i]);
  if (!isStock) return null;

  return {
    ...t,
    direction: t.type === 'CREDIT' ? 'credit' : 'debit',
    platform: platforms.find(p => desc.includes(p)) || 'Stock Market',
    ...extractTxnMeta(t.description)
  };
}

function detectInsurance(t) {
  if (t.type !== 'DEBIT') return null;
  const desc = normUpper(t.description);
  if (desc.includes('INSURANCE') || desc.includes('PREMIUM') || desc.includes('LIC ') || desc.includes('HDFC LIFE') || desc.includes('ICICI PRU')) {
    return { ...t, provider: 'Insurance' };
  }
  return null;
}

function detectUtilities(t) {
  if (t.type !== 'DEBIT') return null;
  const desc = normUpper(t.description);
  if (desc.includes('ELECTRICITY') || desc.includes('WATER') || desc.includes('GAS') || desc.includes('MOBILE') || desc.includes('INTERNET') || desc.includes('RECHARGE')) {
    return { ...t, category: 'Utility' };
  }
  return null;
}

function detectTransfers(t) {
  const desc = normUpper(t.description);
  if (desc.includes('TRANSFER') || desc.includes('OWN ACC') || desc.includes('SELF')) {
    return { ...t };
  }
  return null;
}

function detectBounceCharges(t) {
  const desc = normUpper(t.description);
  if (anyMatch(desc, [/RETURN/i, /BOUNCE/i, /REJECT/i, /PENALTY/i, /INSUFFICIENT/i, /FUNDS/i])) {
    return { ...t };
  }
  return null;
}

function detectCreditCardPayment(t) {
  if (t.type !== 'DEBIT') return null;
  const desc = normUpper(t.description);
  if (desc.includes('CREDIT CARD') || desc.includes('CC PAYMENT') || desc.includes('CARD BILL')) {
    return { ...t, ...extractTxnMeta(t.description) };
  }
  return null;
}

function extractTxnMeta(desc) {
  const meta = {};
  const utrMatch = desc.match(/\b([A-Z0-9]{12,})\b/i);
  if (utrMatch) meta.utr = utrMatch[1];
  const rrnMatch = desc.match(/\b(\d{12})\b/);
  if (rrnMatch) meta.rrn = rrnMatch[1];
  return meta;
}

function computeMonthlySummary(analysis, txns) {
  const summary = {};
  for (const t of txns) {
    const month = t.date.slice(0, 7);
    if (!summary[month]) {
      summary[month] = { credits: 0, debits: 0, salary: 0, emi: 0, apy: 0, transfers_in: 0, transfers_out: 0, closing_balance: 0 };
    }
    const amt = Number(t.amount) || 0;
    if (t.type === 'CREDIT') summary[month].credits += amt;
    else summary[month].debits += amt;
    summary[month].closing_balance = t.balance || 0;
  }
  
  for (const s of analysis.salary) summary[s.date.slice(0, 7)].salary += s.amount;
  for (const e of analysis.emi_payments) summary[e.date.slice(0, 7)].emi += e.amount;
  for (const a of analysis.apy_pension) summary[a.date.slice(0, 7)].apy += a.amount;
  for (const i of analysis.transfers_in) summary[i.date.slice(0, 7)].transfers_in += i.amount;
  for (const o of analysis.transfers_out) summary[o.date.slice(0, 7)].transfers_out += o.amount;

  analysis.monthly_summary = summary;
}

function computeInsights(analysis) {
  const months = Object.keys(analysis.monthly_summary);
  if (!months.length) return;

  const totalSalary = analysis.salary.reduce((s, x) => s + x.amount, 0);
  analysis.insights.avg_monthly_salary = totalSalary / months.length;

  const totalEmi = analysis.emi_payments.reduce((s, x) => s + x.amount, 0);
  analysis.insights.total_emi_monthly = totalEmi / months.length;

  if (analysis.insights.avg_monthly_salary > 0) {
    analysis.insights.obligation_to_income_ratio = (analysis.insights.total_emi_monthly / analysis.insights.avg_monthly_salary) * 100;
  }

  const totalCredits = analysis.account_summary.total_credits;
  const totalDebits = analysis.account_summary.total_debits;
  if (totalCredits > 0) {
    analysis.insights.savings_rate = ((totalCredits - totalDebits) / totalCredits) * 100;
  }

  if (analysis.insights.obligation_to_income_ratio > 50) {
    analysis.insights.risk_flags.push('High debt-to-income ratio');
    analysis.insights.recommendations.push('Consider reducing non-essential expenses');
  }
  if (analysis.bounce_charges.length > 0) {
    analysis.insights.risk_flags.push('Bounces detected in statement');
    analysis.insights.recommendations.push('Maintain sufficient balance for EMIs');
  }
}

function computeLoanSummary(analysis) {
  const summary = {};
  for (const e of analysis.emi_payments) {
    const bank = e.bank || 'Unknown';
    if (!summary[bank]) summary[bank] = { count: 0, total_paid: 0, last_emi: null };
    summary[bank].count++;
    summary[bank].total_paid += e.amount;
    summary[bank].last_emi = e.date;
  }
  analysis.loan_summary = summary;
}

module.exports = {
  LOAN_TYPE_MAP,
  LENDER_PATTERNS,
  SALARY_KEYWORDS,
  NACH_PATTERNS,
  APP_LOAN_PATTERNS,
  SIP_PATTERNS,
  SALARY_SOURCE_MAP,
  normalizeDesc,
  normUpper,
  anyMatch,
  parseDate,
  parseCibilText,
  crossVerifyCibil,
  assessEligibility,
  assessUnderwriting,
  analyzeTransactions,
};
