// CIBIL REPORT PARSER
// Optimized for messy text reports, horizontal tables, and multi-row enquiries
// ===========================================================================

function parseDate(dateStr) {
  if (!dateStr) return null;
  const s = dateStr.toString().trim();
  const parts = s.split(/[-\/\s.]/);
  if (parts.length < 3) return null;
  let d, m, y;
  if (parts[0].length === 4) {
    y = parts[0];
    m = parts[1];
    d = parts[2];
  } else {
    d = parts[0];
    m = parts[1];
    y = parts[2];
  }
  if (y.length === 2) y = `20${y}`;
  const monthMap = {
    JAN: "01",
    FEB: "02",
    MAR: "03",
    APR: "04",
    MAY: "05",
    JUN: "06",
    JUL: "07",
    AUG: "08",
    SEP: "09",
    OCT: "10",
    NOV: "11",
    DEC: "12",
  };
  if (isNaN(m)) m = monthMap[m.toUpperCase().slice(0, 3)] || "01";
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

// ── LENDER REGISTRY (Standardized Names) ──────────────────────────
const LENDER_PATTERNS = [
  // Public Sector Banks (PSBs)
  { regex: /\bSBIN\b|STATE.*BANK.*INDIA|\bSBI\b/i, name: "State Bank of India (SBI)", category: "PSB" },
  { regex: /\bUBIN\b|UNION.*BANK/i, name: "Union Bank of India", category: "PSB" },
  { regex: /\bPUNB\b|PUNJAB.*NATIONAL|\bPNB\b/i, name: "Punjab National Bank (PNB)", category: "PSB" },
  { regex: /\bBARB\b|BANK.*BARODA|\bBOB\b/i, name: "Bank of Baroda (BOB)", category: "PSB" },
  { regex: /\bCNRB\b|CANARA.*BANK/i, name: "Canara Bank", category: "PSB" },
  { regex: /\bIOBA\b|INDIAN.*OVERSEAS/i, name: "Indian Overseas Bank (IOB)", category: "PSB" },
  { regex: /\bBKID\b|BANK.*INDIA\b/i, name: "Bank of India (BOI)", category: "PSB" },
  { regex: /\bMAHB\b|BANK.*MAHARASHTRA/i, name: "Bank of Maharashtra", category: "PSB" },
  { regex: /CENTRAL.*BANK.*INDIA|\bCBIN\b/i, name: "Central Bank of India", category: "PSB" },
  { regex: /\bUCO\b|UCO.*BANK/i, name: "UCO Bank", category: "PSB" },
  
  // Private Sector Banks (Pvt)
  { regex: /\bHDFC\b|HDFCBANK/i, name: "HDFC Bank", category: "Pvt" },
  { regex: /ICICI|ICICIBANK/i, name: "ICICI Bank", category: "Pvt" },
  { regex: /\bUTIB\b|AXIS.*BANK|AXISBANK/i, name: "Axis Bank", category: "Pvt" },
  { regex: /\bKKBK\b|KOTAK/i, name: "Kotak Mahindra Bank", category: "Pvt" },
  { regex: /\bYESB\b|YES.*BANK|YESBANK/i, name: "Yes Bank", category: "Pvt" },
  { regex: /\bINDB\b|INDUSIND|INDUS.*IND/i, name: "IndusInd Bank", category: "Pvt" },
  { regex: /\bFDRL\b|FEDERAL.*BANK/i, name: "Federal Bank", category: "Pvt" },
  { regex: /\bIDFB\b|IDFC/i, name: "IDFC First Bank", category: "Pvt" },
  { regex: /\bIBKL\b|\bIDBI\b/i, name: "IDBI Bank", category: "Pvt" },
  { regex: /\bIDIB\b|INDIAN.*BANK/i, name: "Indian Bank", category: "PSB" },
  { regex: /\bRBLB\b|\bRBL\b/i, name: "RBL Bank", category: "Pvt" },
  { regex: /\bBAND\b|BANDHAN/i, name: "Bandhan Bank", category: "Pvt" },

  // Small Finance Banks (SFBs)
  { regex: /\bAUBK\b|AU.*SMALL|AU.*FINANCE/i, name: "AU Small Finance Bank", category: "SFB" },
  { regex: /\bEQUITAS\b|EQUITAS\b/i, name: "Equitas Small Finance Bank", category: "SFB" },
  { regex: /\bESFB\b|UJJIVAN\b|UJJIVAN\s+SMALL/i, name: "Ujjivan Small Finance Bank", category: "SFB" },

  // NBFCs & Fintech (for reference, though less common in CIBIL)
  { regex: /SMFG|SMFGINDIACR|SMFG.*INDIA/i, name: "SMFG India Credit (Fullerton)", category: "NBFC" },
  { regex: /\bBAJAJ\b|BAJAJ.*FIN/i, name: "Bajaj Finance Ltd", category: "NBFC" },
  { regex: /\bTATA\s*CAPITAL\b|TATA.*FIN/i, name: "Tata Capital", category: "NBFC" },
  { regex: /L&T.*FIN|LNTFIN/i, name: "L&T Finance", category: "NBFC" },
  { regex: /MUTHOOT.*FIN|MUTHOOT/i, name: "Muthoot Finance", category: "NBFC" },
  { regex: /MANAPPURAM.*FIN|MANAPPURAM/i, name: "Manappuram Finance", category: "NBFC" },
  { regex: /\bSHRIRAM\b|SHRIRAM.*FIN/i, name: "Shriram Finance", category: "NBFC" },
  { regex: /\bMAHINDRA\b|MMFSL|MAHFIN/i, name: "Mahindra Finance", category: "NBFC" },
  { regex: /\bCHOLA\b|CHOLAMANDALAM/i, name: "Cholamandalam Finance", category: "NBFC" },
  { regex: /\bPIRAMAL\b|PIRAMAL.*FIN/i, name: "Piramal Finance", category: "NBFC" },
  { regex: /\bHOME\s*CREDIT\b|HOMECREDIT/i, name: "Home Credit", category: "NBFC" },
];

function normalizeLenderName(rawName) {
  if (!rawName) return rawName;
  const clean = rawName.toString().trim();
  if (clean.length < 2) return rawName;
  
  const d = clean.toUpperCase().replace(/\s+/g, "");

  // High priority exact matches - very explicit to prevent misidentification
  if (d.includes("INDUSIND")) return "IndusInd Bank";
  if (d.includes("ICICI")) return "ICICI Bank";
  if (d.includes("IDFC")) return "IDFC First Bank";
  if (d.includes("HDFC")) return "HDFC Bank";
  if (d.includes("AXIS")) return "Axis Bank";
  if (d.includes("KOTAK")) return "Kotak Mahindra Bank";
  if (d.includes("YESBANK")) return "Yes Bank";
  if (d.includes("SBIN") || d.includes("STATEBANK")) return "State Bank of India (SBI)";
  if (d.includes("CITI")) return "CITIBANK";
  if (d.includes("SCB") || d.includes("STANDARDCHARTERED")) return "Standard Chartered Bank";
  if (d.includes("AMEX") || d.includes("AMERICANEXPRESS")) return "American Express";
  if (d.includes("UNION") && d.includes("BANK")) return "Union Bank of India";
  if (d.includes("PUNJAB") && d.includes("NATIONAL")) return "Punjab National Bank (PNB)";
  if (d.includes("BARODA")) return "Bank of Baroda (BOB)";
  if (d.includes("CANARA")) return "Canara Bank";

  // CIBIL member ID codes
  if (d === "KANGRACBL") return "Kotak Mahindra Bank";
  if (d === "ADBIRLACAP") return "Aditya Birla Capital";
  if (d === "BHANIXFIN") return "Bhanix Finance";
  if (d === "MANBA") return "Manba Finance";
  if (d === "SMICC") return "SMFG India Credit (Fullerton)";
  if (d === "DMIFINANCE") return "DMI Finance";
  if (d === "AXISFIN") return "Axis Finance";
  if (d === "TCFSL") return "Tata Capital Financial Services";
  if (d === "EPIMONEY") return "EpiPay Money";
  if (d === "INCREDFINANCE") return "Incred Finance";
  if (d === "CHOLAINVSTFIN") return "Cholamandalam Investment & Finance";

  // Pattern matching
  for (const p of LENDER_PATTERNS) {
    if (p.regex.test(d) || p.regex.test(clean)) return p.name;
  }
  
  // Fallback: return cleaned version if it looks like a bank name
  if (clean.length >= 3 && /[A-Z]/.test(clean)) {
    return clean;
  }
  
  return rawName;
}

/**
 * Detect which bureau / source the CIBIL report came from.
 * Returns: 'transunion' | 'equifax' | 'crif' | 'paisabazaar' | 'cibil_tucici' | 'unknown'
 */
function detectCibilSource(text) {
  const t = (text || "").toString().toLowerCase();
  // 1) Direct TransUnion / CIBIL branding always wins (most common in India).
  //    "Report to CIBIL", "Hey <Name>", "Credit Score" with CIBIL/TransUnion logos,
  //    "Powered by TransUnion", etc.
  if (/report\s*to\s*cibil|powered\s*by\s*transunion|transunion\s*cibil/i.test(t)) {
    return "transunion";
  }
  // 2) CIBIL brand terms without TransUnion are also classified as TransUnion
  //    (CIBIL is a TransUnion company in India).
  if (/\bcibil\b|cibil\s*score|credit\s*information\s*bureau/i.test(t)) {
    return "transunion";
  }
  // 3) CRIF (uses "CreditVision" or CRIF markers)
  if (/crif\s*high\s*mark|credit\s*vision\s*report|\bcrif\b/i.test(t)) return "crif";
  // 4) Equifax (often used via "Credit Report" by Experian/Equifax; also "Equifax Score")
  if (/equifax\s*score|equifax\s*credit\s*report|\bequifax\b/i.test(t)) return "equifax";
  // 5) Paisabazaar-generated CIBIL report (delivered as CIBIL PDF but with PB branding)
  if (/paisabazaar|on\.paisabazaar|paisa\s*bazaar/i.test(t)) return "paisabazaar";
  return "unknown";
}

/**
 * Pre-process CIBIL text from dense single-line-per-page format or squished format.
 * Handles TransUnion CIBIL, Equifax, CRIF, and Paisabazaar reports.
 */
function preprocessCibilText(rawText) {
  let text = (rawText || "").toString();

  // Normalize windows line endings
  text = text.replace(/\r\n?/g, "\n");

  // 1) Handle squished labels (e.g. from Xavier PDF: "Account Number:XXXX9705Account type:")
  const squishedLabels = [
    "Account Opened Date",
    "Account Closed Date",
    "Last Bank Update",
    "Last Payment Date",
    "Pay Start Date",
    "Pay End Date",
    "Repayment Tenure",
    "Loan Amount",
    "Settlement Amount",
    "Overdue Amount",
    "EMI Amount",
    "Outstanding Balance",
    "Credit Limit",
    "Actual Last Payment",
    "Interest Rate",
    "Collateral Type",
    "Suit Filed Status",
    "Cash Limit",
    "Payment Frequency",
    "Maximum Utilization",
    "High Credit",
    "Account Number",
    "Account type",
    "Account Status",
    "Account No",
    "Ownership",
    "Opened Date",
    "Account Details",
    "Enquired on",
    "Enquiry Purpose",
    "Financial Institution",
    "Last Bank",
  ];

  for (const label of squishedLabels) {
    const safe = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Add newline before label if squished against alphanumeric
    text = text.replace(
      new RegExp(`(?<=[a-zA-Z0-9])(${safe})`, "g"),
      "\n$1",
    );
    // Add newline+colon+space after label if followed by value
    text = text.replace(
      new RegExp(`(${safe})\\s*:?\\s*(?=\\S)`, "g"),
      "\n$1: ",
    );
    // Also break header column row like "Account typeAccount NoOwnership..."
    text = text.replace(
      new RegExp(`\\b(${safe})\\b(?=[A-Z][a-z])`, "g"),
      "\n$1 ",
    );
    text = text.replace(
      new RegExp(`\\b(${safe})\\b(?!\\s*[:\\n])(?=[A-Z])`, "g"),
      "\n$1 ",
    );
  }

  // Strip "Report to CIBILTable of Contents" glue
  text = text.replace(/Report\s+to\s+CIBIL\s*Table\s+of\s+Contents/gi, "\n");
  text = text.replace(/Powered\s+by[^\n]*/gi, "");

  // Insert line breaks before known headers
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
    text = text.replace(
      new RegExp(`(?<=\\S)(${safe})`, "g"),
      "\n$1",
    );
  }

  // 2) Score line normalization.
  //    The score is typically a 3-digit number (300-900) on its own line, followed by
  //    a rating word (e.g. "VERY GOOD", "GOOD", "EXCELLENT", "FAIR", "POOR").
  //    The line BEFORE the score number often contains "1" (recent enquiries count).
  text = text.replace(
    /^([3-9]\d{2})\s*\n\s*(EXCELLENT|GOOD|FAIR|POOR|VERY\s*GOOD|VERY\s*POOR|LOW|HIGH|NA)\b/gim,
    "\nSCORE: $1\nRATING: $2\n",
  );
  text = text.replace(
    /\b(EXCELLENT|GOOD|FAIR|POOR|VERY\s*GOOD|VERY\s*POOR|LOW|HIGH|NA)\s*\n\s*([3-9]\d{2})\b/gim,
    "\nSCORE: $2\nRATING: $1\n",
  );
  // CIBIL Score: 798 pattern
  text = text.replace(
    /\bCIBIL\s*SCORE\b\s*[:\-]?\s*([3-9]\d{2})/gi,
    "\nCIBIL SCORE: $1",
  );
  // Equifax / Experian / CRIF score labels
  text = text.replace(
    /\b(Equifax|Experian|CRIF|CIBIL|TransUnion)\s*Score\b\s*[:\-]?\s*([3-9]\d{2})/gi,
    "\nCIBIL SCORE: $2",
  );

  // 3) Section / summary label newlines
  text = text.replace(/(\d+)\s+(Active\s+(?:Loans?|Credit\s+Cards?))/gi, "\n$1 $2");
  text = text.replace(/(Total\s+(?:loan|limit))/gi, "\n$1");
  text = text.replace(/(Current\s+Outstanding)/gi, "\n$1");
  text = text.replace(/(Overdue\s+Payments)/gi, "\n$1");
  text = text.replace(/(Age\s+of\s+Accounts)/gi, "\n$1");
  text = text.replace(/(Recent\s+Enquiries)/gi, "\n$1");
  text = text.replace(/(Hey\s+[A-Za-z]+,)/gi, "\n$1\n");
  // Be careful: only match short "This section..." footer sentences.
  // The previous greedy `[^.]*\.` could swallow thousands of characters when
  // a sentence runs across multiple "pages" without a period. Cap to ~300 chars.
  text = text.replace(/This section[^.\n]{0,300}\./gi, "\n");

  // 4) Break squished account-number rows in the summary table
  //    The squished format looks like: "YES BANKPersonal LoanXXXX9705Individual01-09-2025Active30-04-20262,00,0001,83,383"
  //    Insert a newline between the bank name and the account type (e.g. "BANK" + "Personal Loan").
  const loanTypePattern =
    "(?:Personal\\s+Loan|Education\\s+Loan|Home\\s+Loan|Housing\\s+Loan|Vehicle\\s+Loan|Two[\\s-]?Wheeler\\s+Loan|Used\\s+Car\\s+Loan|Gold\\s+Loan|Business\\s+Loan(?:\\s*[–-]\\s*General|\\s+General)?|Consumer\\s+Loan|Loan\\s+Against\\s+Property|Property\\s+Loan|Overdraft|Credit\\s+Card|Loan\\s+on\\s+Credit\\s+Card|Other)";
  text = text.replace(
    new RegExp(`([A-Z][A-Z0-9 &.'\\-]{2,60})(${loanTypePattern})`, "g"),
    "$1\n$2",
  );
  // Insert newline before masked account number token (XXXX1234)
  text = text.replace(
    /(?<=[A-Za-z])(XXXX[A-Z0-9]{3,})/g,
    "\n$1",
  );
  // Insert newline between account number and ownership/status keywords
  text = text.replace(
    /([A-Z0-9]{3,}(?:XXXX)?[A-Z0-9]{0,4})(Individual|Joint|Guarantor|Co-Applicant|Co Applicant|Authorised User|Authorized User|Primary)/g,
    "$1\n$2",
  );
  text = text.replace(
    /(Individual|Joint|Guarantor)(\d{2}[-\/]\d{2}[-\/]\d{4})/g,
    "$1\n$2",
  );
  text = text.replace(
    /(\d{2}[-\/]\d{2}[-\/]\d{4})(Active|Closed|Settled|Written\s*Off|Suit\s*Filed|Wilful\s*Default|Loss|SMA|Special\s*Mention)/g,
    "$1\n$2",
  );
  text = text.replace(
    /(Active|Closed|Settled|Written\s*Off|Suit\s*Filed|Wilful\s*Default|Loss|SMA|Special\s*Mention)(\d{2}[-\/]\d{2}[-\/]\d{4})/g,
    "$1\n$2",
  );
  text = text.replace(
    /(\d{2}[-\/]\d{2}[-\/]\d{4})([\d,]{4,})/g,
    "$1\n$2",
  );
  // Split squished money amounts in the summary table
  // Example: "2,00,0001,83,383" should become "2,00,000\n1,83,383"
  // Pattern: an Indian-style number followed directly by another Indian-style number
  // (with at least 4 digits after the comma boundary to disambiguate from a single big number).
  text = text.replace(
    /(\d{1,2},\d{2},\d{3})(\d{1,2},\d{2},\d{3})/g,
    "$1\n$2",
  );
  text = text.replace(
    /(\d{1,2},\d{2},\d{3})(-?\d{1,3})(?=\s|$|\n)/g,
    "$1\n$2",
  );
  // Split masked-account-number followed by date: "XXXX970501-09-2025"
  text = text.replace(
    /(XXXX[A-Z0-9]{3,7})(\d{2}-\d{2}-\d{4})/g,
    "$1\n$2",
  );

  // 5) Break squished enquiry rows: "1Housing LoanSBI22-04-2026"
  text = text.replace(
    /(?<=\b)(\d{1,3})(Housing\s+Loan|Personal\s+Loan|Credit\s+Card|Business\s+Loan(?:[ –-]General)?|Other|Education\s+Loan|Vehicle\s+Loan|Two[ -]?wheeler\s+Loan|Loan\s+on\s+Credit\s+Card|Gold\s+Loan|Property\s+Loan|Overdraft)/gi,
    "\n$1 $2",
  );
  text = text.replace(
    new RegExp(`(${loanTypePattern})([A-Z][A-Z0-9 &.'\\-]{2,60}?)(\\d{2}-\\d{2}-\\d{4})`, "g"),
    "$1\n$2\n$3",
  );

  // 6) Break account-details header block
  //    Format: "YES BANK\nActive\nAccount Number:XXXX9705Account type:Personal Loan..."
  //    Add newline between status word and "Account Number:"
  text = text.replace(
    /\b(Active|Closed|Settled|Written\s*Off|Suit\s*Filed|Wilful\s*Default|Loss|SMA)\s+(Account\s*Number\s*:?)/gi,
    "$1\n$2",
  );

  // Collapse runs of blank lines
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

function parseNum(value) {
  if (value == null) return undefined;

  const cleaned = String(value)
    .replace(/₹/g, '')
    .replace(/,/g, '')
    .trim();

  const num = Number(cleaned);

  return Number.isNaN(num) ? undefined : num;
}

function isJunkLenderName(s) {
  if (!s) return true;
  const t = s.trim();
  if (t.length < 2 || t.length > 80) return true;
  if (/^(Account|Date|Type|Status|Number|Ownership|Opened|Closed|Update|Amount|Balance|Limit|Loan|Institution|Financial|Outstanding|Sanctioned|Report|Summary|ENQUIRY|ENQUIRED|Sr\.|Section|Table|Contents|Page|Hello|Hey|Email|Phone|Mobile|Active|Closed)$/i.test(t))
    return true;
  if (/\b(?:Account|Date|Status|Type|Ownership|Opened|Closed|Update|Amount|Balance|Limit)\b/i.test(t))
    return true;
  return false;
}

function parsePaisabazaarSummary(text) {

  const rows = [];

  // Two-pass strategy:
  //  (a) Try to find rows with reasonable whitespace between fields
  //      (standard Paisabazaar / TransUnion CIBIL summary).
  //  (b) Fall back to a strict squished row regex for reports that
  //      have no whitespace between fields (e.g. certain CIBIL PDF
  //      exports and Equifax reports).
  //
  // The squished variant uses a smart amount matcher: a properly
  // comma-grouped Indian number (1,00,000 / 14,75,665 / 6,48,322)
  // OR a negative integer (-17) OR the literal NA.

  const accountNo = "(XXXX[A-Z0-9]{3,7}|[A-Z0-9X*]{6,})";
  const owner =
    "(?:Individual|Joint|Guarantor|Co-Applicant|Co Applicant|Authorised User|Authorized User|Primary|Secondary|Sole)";
  const status =
    "(?:Active\\*?\\*?|Closed|Settled|Written\\s*Off|Wilful\\s*Default|Suit\\*?\\s*Filed|Loss|SMA|Special\\s*Mention)";
  const dateRe = "(\\d{2}-\\d{2}-\\d{4})";
  // Indian comma-grouped number: like 1,00,000 / 14,75,665 / 6,48,322 / -17 / -1 / NA
  // The first format must be either XX,XX,XXX (Indian) or X,XXX (Western) or just digits.
  const amount =
    "((?:-?\\d{1,2},\\d{2},\\d{3})|(?:-?\\d{1,3},\\d{3})|(?:-?\\d+)|(?:NA))";

  const squishedRowRe = new RegExp(
    [
      "([A-Z][A-Z\\s&.\\-'\\u2013\\u2014]{2,60}?)", // 1: Lender
      "[\\s\\n]*(Personal Loan|Housing Loan|Education Loan|Home Loan|Vehicle Loan|Two-wheeler Loan|Used Car Loan|Gold Loan|Business Loan(?:\\s*[–-]\\s*General)?|Consumer Loan|Loan Against Property|Property Loan|Overdraft|Credit Card|Loan on Credit Card|Other)",
      `[\\s\\n]*(${accountNo})`,
      `[\\s\\n]*(${owner})`,
      `[\\s\\n]*${dateRe}`,
      `[\\s\\n]*(${status})`,
      `[\\s\\n]*${dateRe}`,
      `[\\s\\n]*${amount}`,
      `[\\s\\n]*${amount}`,
    ].join(""),
    "g",
  );

  let m;
  const seen = new Set();
  while ((m = squishedRowRe.exec(text)) !== null) {
    const lender = (m[1] || "").replace(/\s+/g, " ").trim();
    if (
      isJunkLenderName(lender) ||
      /\b(?:Account|Date|Status|Type|Ownership|Opened|Closed|Number)\b/i.test(lender)
    ) {
      continue;
    }
    const account_no = (m[3] || "").trim();
    const key = `${account_no}|${lender.toUpperCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      lender: normalizeLenderName(lender) || lender,
      account_type: (m[2] || "").trim(),
      account_no,
      ownership: (m[4] || "").trim(),
      opened_date: parseDate(m[5]),
      account_status: (m[6] || "").replace(/\s+/g, " ").trim(),
      last_update: parseDate(m[7]),
      sanctioned_amount: parseNum(m[8]),
      current_balance: parseNum(m[9]),
    });
  }

  console.log("PAISABAZAAR SUMMARY ROWS:", rows.length);

  return rows;
}

function parseCibilText(text) {
  const t = preprocessCibilText((text || "").toString());
  const lines = t
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
  const joined = lines.join("\n");


  const joinedFlat = lines.join(" ").replace(/\s+/g, " ").trim();
  const upper = joinedFlat.toUpperCase();
  const typeRe =
    "(?:Personal\\s+Loan|Education\\s+Loan|Home\\s+Loan|Housing\\s+Loan|Vehicle\\s+Loan|Two\\s+Wheeler\\s+Loan|Used\\s+Car\\s+Loan|Gold\\s+Loan|Business\\s+Loan(?:\\s+General)?|Consumer\\s+Loan|Loan\\s+Against\\s+Property|Property\\s+Loan|Overdraft|Credit\\s+Card|Loan\\s+on\\s+Credit\\s+Card|Other)";

  const pickScore = () => {
    // 1) Look for explicit labels (CIBIL SCORE, Equifax Score, etc.)
    const labeled =
      joined.match(/\bCIBIL\s*SCORE\b[^0-9]{0,30}([3-9]\d{2})\b/i) ||
      joined.match(/\bEquifax\s*Score\b[^0-9]{0,30}([3-9]\d{2})\b/i) ||
      joined.match(/\bExperian\s*Score\b[^0-9]{0,30}([3-9]\d{2})\b/i) ||
      joined.match(/\bCRIF\s*Score\b[^0-9]{0,30}([3-9]\d{2})\b/i) ||
      joined.match(/\bTransUnion\s*Score\b[^0-9]{0,30}([3-9]\d{2})\b/i) ||
      joined.match(/\bSCORE\s*[:\-]?\s*([3-9]\d{2})\b/i);
    if (labeled) {
      const n = Number(labeled[1]);
      if (Number.isFinite(n) && n >= 300 && n <= 900) return n;
    }
    // 2) Look for score near rating keywords (handles Xavier/TransUnion layout)
    const withRating =
      joined.match(/\b([3-9]\d{2})\b[^a-zA-Z0-9]{0,40}\b(EXCELLENT|GOOD|FAIR|POOR|VERY\s*GOOD|VERY\s*POOR|LOW|HIGH)\b/i) ||
      joined.match(/\b(EXCELLENT|GOOD|FAIR|POOR|VERY\s*GOOD|VERY\s*POOR|LOW|HIGH)\b[^a-zA-Z0-9]{0,40}\b([3-9]\d{2})\b/i);
    if (withRating) {
      const n = Number(withRating[1] || withRating[2]);
      if (Number.isFinite(n) && n >= 300 && n <= 900) return n;
    }
    // 3) Look for a 3-digit number 300-900 near "Your CIBIL Score" / "Your credit score"
    const contextual =
      joined.match(/\b([3-9]\d{2})\b[^a-zA-Z0-9]{0,40}\b(?:Your\s+)?(?:CIBIL|credit)\s*Score\b/i) ||
      joined.match(/\b(?:Your\s+)?(?:CIBIL|credit)\s*Score\b[^a-zA-Z0-9]{0,40}\b([3-9]\d{2})\b/i);
    if (contextual) {
      const n = Number(contextual[1]);
      if (Number.isFinite(n) && n >= 300 && n <= 900) return n;
    }
    // 4) Fallback: any 3-digit number 300-900 that isn't surrounded by other digits/commas
    const allNums = joined.match(/\b([3-9]\d{2})\b/g) || [];
    for (const c of allNums) {
      const n = Number(c);
      if (n >= 300 && n <= 900) return n;
    }
    return undefined;
  };

  const pickDate = () => {
    const m =
      joined.match(/\bREPORT\s*DATE[^0-9]{0,20}(\d{2}[-\/]\d{2}[-\/]\d{4})/i) ||
      joined.match(/\bAS\s*ON[^0-9]{0,20}(\d{2}[-\/]\d{2}[-\/]\d{4})/i);
    return m ? m[1] : undefined;
  };

  const parseNum = (s) => {
    if (!s) return undefined;
    const n = Number(s.toString().replace(/[₹,\s]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  };
  const pickLabeledNumber = (text, labelRe) => {
    const src = (text || "").toString();
    const re = new RegExp(
      `${labelRe.source}\\s*(?:Amount|Balance|Limit|Utilization|Payment|Principal|Total)?[^0-9A-Z-₹]{0,40}([₹]?\\s*-?\\d[\\d,]*(?:\\.\\d{1,2})?|NA)`,
      "i",
    );
    const m = src.match(re);
    if (!m || /^NA$/i.test(m[1])) return undefined;
    return parseNum(m[1]);
  };
  const pickLabeledDate = (text, labelRe) => {
    const src = (text || "").toString();
    const re = new RegExp(
      `${labelRe.source}\\s*(?:Date)?[^0-9A-Z]{0,40}(\\d{2}[-\\/]\\d{2}[-\\/]\\d{4}|NA)`,
      "i",
    );
    const m = src.match(re);
    if (!m || /^NA$/i.test(m[1])) return undefined;
    return parseDate(m[1]);
  };

  const monthRe =
    "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
  const dpdTokenToDays = (value) => {
    const raw = (value || "").toString().trim().toUpperCase();
    if (!raw || raw === "XXX" || raw === "STD") return 0;
    const n = Number(raw.replace(/^0+(?=\d)/, ""));
    return Number.isFinite(n) ? n : 0;
  };
  const parseDpdHistory = (text) => {
    const out = [];
    const seen = new Set();
    const add = (month, value) => {
      const label = (month || "").toString().replace(/\s+/g, " ").trim();
      if (!label) return;
      const days = dpdTokenToDays(value);
      const key = `${label.toUpperCase()}|${days}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ month: label, days });
    };

    // Very aggressive regex to catch "Month Year Value" in any combination of spacing
    const regex = new RegExp(
      `(${monthRe})\\s*((?:19|20)\\d{2})\\s*(\\d{1,3}|XXX|STD)`,
      "gi",
    );
    let m;
    while ((m = regex.exec(text)) !== null) {
      add(`${m[1]} ${m[2]}`, m[3]);
    }

    // Also catch "Month Year - Value"
    const regex2 = new RegExp(
      `(${monthRe})\\s*((?:19|20)\\d{2})\\s*-\\s*(\\d{1,3}|XXX|STD)`,
      "gi",
    );
    while ((m = regex2.exec(text)) !== null) {
      add(`${m[1]} ${m[2]}`, m[3]);
    }

    // Horizontal table format support
    if (out.length === 0) {
      const months = text.match(new RegExp(`\\b(${monthRe})\\b`, "gi"));
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
        const monthMatch = line.match(
          new RegExp(`^(${monthRe})\\s+((?:19|20)\\d{2})$`, "i"),
        );
        if (monthMatch) {
          const nextLine = (lines[i + 1] || "").trim();
          const valMatch = nextLine.match(/^(\d{1,3}|XXX|STD)$/i);
          if (valMatch) add(`${monthMatch[1]} ${monthMatch[2]}`, valMatch[1]);
        }
      }
    }

    return out;
  };
  const accountKey = (a) => {
    const no = (a.account_no || "")
      .toString()
      .replace(/[^A-Z0-9]/gi, "")
      .toUpperCase();
    const l = (a.lender || "")
      .toString()
      .toUpperCase()
      .replace(
        /\b(?:BANK|LTD|LIMITED|FINANCE|FIN|CREDIT|CARD|CORPORATION|CORP|SERVICES|SER|CO|NA)\b/g,
        " ",
      )
      .replace(/[^A-Z]/g, "")
      .slice(0, 15);
    return `${no}|${l}`;
  };
  const mergeAccountFields = (target, source) => {
    for (const field of [
      "ownership",
      "opened_date",
      "closed_date",
      "account_status",
      "last_update",
      "last_payment_date",
      "sanctioned_amount",
      "high_credit",
      "credit_limit",
      "current_balance",
      "overdue_amount",
      "emi",
      "actual_last_payment",
      "payment_frequency",
      "repayment_tenure",
    ]) {
      if (
        (target[field] === undefined ||
          target[field] === "" ||
          target[field] === 0) &&
        source[field] !== undefined
      ) {
        target[field] = source[field];
      }
    }
  };

  const enquiries = {};
  const lastDays =
    joined.match(
      /\bENQUIR(?:Y|IES)\b[\s\S]{0,200}?\bLAST\s*(30|60|90|180|365)\s*DAYS\b[^0-9]{0,20}(\d{1,3})/gi,
    ) || [];
  for (const hit of lastDays) {
    const m = hit.match(
      /\bLAST\s*(30|60|90|180|365)\s*DAYS\b[^0-9]{0,20}(\d{1,3})/i,
    );
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

    // 1) Look for explicit label like "PAN", "PAN Number", "Permanent Account Number"
    //    The PAN value MUST immediately follow the label (no other text in between),
    //    and cannot be a month name like "MONTHS", "YEARS", "RATING", "SCORE", "NA".
    const labelMatch = text.match(
      /\b(?:PAN|Permanent\s+Account\s+Number|ID\s+Number|ITIN\s*\/?\s*PAN)\s*[:\-]?\s*([A-Z]{5}\s*\d{4}\s*[A-Z])\b/i,
    );
    if (labelMatch) {
      const candidate = (labelMatch[1] || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
      if (/^[A-Z]{5}\d{4}[A-Z]$/.test(candidate)) {
        if (!isLikelyPanNoise(candidate)) return candidate;
      }
    }

    // 2) Look for PAN near keywords like "Income Tax", "PAN Card", "PAN:" in the
    //    same sentence (within ~40 chars).
    const contextual = text.match(
      /(?:PAN\s*Card|PAN\s*Number|PAN\s*[:\-]|Income\s*Tax\s*PAN|IT\s*PAN|holder'?s?\s+PAN)\s*[:\-]?\s*([A-Z]{5}\s*\d{4}\s*[A-Z])/i,
    );
    if (contextual) {
      const candidate = (contextual[1] || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
      if (/^[A-Z]{5}\d{4}[A-Z]$/.test(candidate) && !isLikelyPanNoise(candidate)) {
        return candidate;
      }
    }

    // 3) Fallback: look for any "[A-Z]{5}\d{4}[A-Z]" pattern in the text, but
    //    reject common false positives derived from "X years Y months" or
    //    "RATING / SCORE" sections.
    const fallback = text
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .match(/[A-Z]{5}\d{4}[A-Z]/g);
    if (fallback) {
      for (const c of fallback) {
        if (!isLikelyPanNoise(c)) return c;
      }
    }
    return undefined;
  };

  function isLikelyPanNoise(candidate) {
    if (!candidate) return true;
    const upper = candidate.toUpperCase();
    // A real PAN has these structural rules:
    //   1) Exactly 5 alphabetic chars at positions 1-5
    //   2) Exactly 4 digits at positions 6-9
    //   3) Exactly 1 alphabetic char at position 10
    //   4) The 4th character is one of P, C, A, F, T, B, L, H, J (status code)
    if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(upper)) return true;
    const c4 = upper.charAt(3);
    if (!"PCAFTBLHJ".includes(c4)) return true;
    // Reject obvious junk prefixes that arise from squished text:
    if (/^(XXXX|NXXX|MXXX|KXXX|0XXX|OXXX|SXXX|PXXX|AXXX|BXXX|CXXX|DXXX|EXXX|FXXX|GXXX|HXXX|IXXX|JXXX|LXXX|QXXX|RXXX|TXXX|UXXX|VXXX|WXXX|YXXX|ZXXX)/.test(upper))
      return true;
    // Reject common false positives from "INTEREST RATE X.XX%", "BALANCE XXXX",
    // "MONTHS XXXX", "YEARS XXXX", etc. that the regex can pick up
    // when consecutive words are joined by squished text.
    // We check BOTH the prefix and any 3+ char substring of the prefix.
    const PAN_FALSE_PREFIXES = [
      "MON", "YEA", "DAY", "RAT", "SCO", "STA", "CLO", "ACT", "OPE", "PAY",
      "HIS", "WRI", "INT", "BAL", "OVE", "OUT", "SAN", "HIG", "CRE", "LIM",
      "OWN", "DAT", "NUM", "PHO", "EMA", "AMO", "AMX", "MAT", "COL", "NOT",
      "TOT", "LOA", "INC", "EXP", "PRI", "VAL", "ANN", "TEN", "PER", "LAN",
      "PRO", "AMT", "MON", "PRO", "PAN", "FRO", "TO ", "RO", "TO",
      "INST", "LEND", "BAN", "ACC", "CRE", "LIM", "EXP", "DUE", "FEE",
      "PEN", "AMT", "AHO", "MOB", "EML", "ADD", "CTI", "CTY", "CTRY",
      "TRA", "NSU", "NION", "IND", "STA", "GEN", "GEN", "DER", "DUE", "DUE",
    ];
    const prefix5 = upper.slice(0, 5);
    for (const p of PAN_FALSE_PREFIXES) {
      if (p.length >= 3 && prefix5.includes(p)) return true;
    }
    // A real PAN rarely has the same letter repeated 3+ times in the 5-char prefix
    if (/^([A-Z])\1{2,}/.test(upper)) return true;
    return false;
  }

  function isEnquiryNoise(purpose, member) {
    if (!purpose || !member) return true;
    if (/Report|Number|ECN|Table|Contents|Sr\.?\s*No|Date|Page|Score|Rating|^Hey|^Hello/i.test(member)) return true;
    if (/Report|Number|ECN|Date|^Sr\.?\s*No|Table|Contents/i.test(purpose)) return true;
    if (member.length < 2 || purpose.length < 2) return true;
    return false;
  }

  const extractMobile = (text) => {
    if (!text) return undefined;
    // 1) Look for a labelled value like "Mobile Phone: 9920117216" or "Phone Number: ..."
    //    The label can be followed by ":" or directly by digits (squished text).
    const labelPatterns = [
      /(?:Mobile\s*Phone|Mobile\s*Number|Mobile\s*No\.?|Phone\s*Number|Phone\s*No\.?|Telephone|Contact\s*Number|Primary\s*Phone|Secondary\s*Phone)\s*[:\-]?\s*([6-9]\d{9})/i,
      /(?:Mobile\s*Phone|Mobile\s*Number|Mobile\s*No\.?|Phone\s*Number|Phone\s*No\.?|Telephone|Contact\s*Number|Primary\s*Phone|Secondary\s*Phone)\s*[:\-]?\s*((?:91)?[6-9]\d{9})/i,
    ];
    for (const re of labelPatterns) {
      const m = text.match(re);
      if (m) {
        const digits = (m[1] || "").replace(/[^0-9]/g, "").slice(-10);
        if (digits.length === 10) return digits;
      }
    }
    // 2) Fallback: any 10-digit number starting with 6-9. In squished text
    //    the number might be preceded by a letter (e.g. "ed9920117216"),
    //    so we strip non-digits from a wider window and look for the pattern.
    const cleaned = text.replace(/[^0-9]/g, "");
    // Try the cleaned text for 10-digit mobile numbers (Indian: starts 6-9)
    const m = cleaned.match(/[6-9]\d{9}/);
    if (m) return m[0];
    return undefined;
  };

  // Pass 0: Robust name and identification extraction
  const helloMatch = joined.match(
    /\b(?:Hello|Hey),?\s+([A-Z][a-zA-Z0-9 /.]{2,80})/i,
  );
  if (helloMatch) personal.name = helloMatch[1].trim();

  // Better name extraction for CIBIL format
  if (!personal.name) {
    const personalIdx = joined.toUpperCase().indexOf("PERSONAL DETAILS");
    if (personalIdx >= 0) {
      const personalSeg = joined.slice(personalIdx, personalIdx + 500);
      const nameLineMatch = personalSeg.match(
        /Name\s*\n\s*([A-Z][a-zA-Z ]{2,80})/i,
      );
      if (
        nameLineMatch &&
        !nameLineMatch[1].toUpperCase().includes("PERSONAL DETAILS")
      )
        personal.name = nameLineMatch[1].trim();
    }
  }

  personal.pan = extractPan(joined);
  personal.mobile = extractMobile(joined);

  const dobSearch =
    joined.match(
      /(?:Date\s*Of\s*Birth|DOB)\s*[:\-]?\s*(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
    ) || joined.match(/\b(\d{2}[-\/]\d{2}[-\/]\d{4})\b(?=.*Gender)/i);
  if (dobSearch) personal.dob = parseDate(dobSearch[1]);

  const genderSearch = joined.match(/Gender\s*(Male|Female|Transgender)/i);
  if (genderSearch) personal.gender = genderSearch[1];

  const emailMatch = joined.match(
    /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/,
  );
  if (emailMatch && !personal.email) personal.email = emailMatch[1];

  const addresses = [];
  const labelLine = (s) =>
    /^[A-Z][A-Z ]{2,30}\s*[:\-]/.test((s || "").toString());
  const stopAddress = (s) =>
    /\b(ACCOUNT|ACCT|ENQUIR(?:Y|IES)|INQUIR(?:Y|IES)|SCORE|CIBIL|DPD|CREDIT\s*FACILITY|PAYMENT\s*HISTORY)\b/i.test(
      (s || "").toString(),
    ) || labelLine(s);

  let addrBuf = [];
  let inAddr = false;
  for (const line of lines) {
    const m = line.match(/^([A-Z][A-Z \/_]{2,40})(?:\s*[:\-])?\s*(.*)$/);
    if (m) {
      const k = (m[1] || "")
        .toString()
        .trim()
        .toUpperCase()
        .replace(/\s+/g, " ");
      let v = (m[2] || "").toString().trim();

      if (!v) {
        let nextIdx = lines.indexOf(line) + 1;
        while (nextIdx < lines.length && nextIdx < lines.indexOf(line) + 5) {
          const nextLine = (lines[nextIdx] || "").trim();
          if (nextLine && !nextLine.includes(":") && nextLine.length > 2) {
            v = nextLine;
            break;
          }
          if (nextLine.includes(":")) break;
          nextIdx++;
        }
      }

      if (/^(FULL\s*)?NAME$|^NAME$/.test(k)) {
        const cleanV = v.split("\n")[0].trim();
        const upperV = cleanV.toUpperCase();
        if (
          !personal.name ||
          (personal.name.length < cleanV.length &&
            !personal.name.toUpperCase().includes(upperV))
        ) {
          if (
            !upperV.includes("PERSONAL DETAILS") &&
            !upperV.includes("MEMBER NAME") &&
            !/^\s*NAME\s*$/.test(upperV) &&
            !upperV.includes("HELLO") &&
            !upperV.includes("PAGE") &&
            !upperV.includes("CIBIL")
          ) {
            if (
              personal.name &&
              (upperV.includes(personal.name.toUpperCase()) ||
                personal.name.toUpperCase().includes(upperV))
            ) {
              if (cleanV.length > 3 && !cleanV.includes("\n"))
                personal.name = cleanV;
            } else if (!personal.name) {
              if (cleanV.length > 3 && !cleanV.includes("\n"))
                personal.name = cleanV;
            }
          }
        }
      } else if (/^DATE OF BIRTH$|^DOB$/.test(k)) {
        if (!personal.dob) personal.dob = parseDate(v) || v;
      } else if (/^GENDER$|^SEX$/.test(k)) {
        if (!personal.gender) personal.gender = v;
      } else if (/^PAN$|^PERMANENT ACCOUNT NUMBER$|^ID NUMBER$/.test(k)) {
        if (!personal.pan) {
          const panMatch = v.match(/\b([A-Z]{5}\d{4}[A-Z])\b/i);
          if (panMatch) personal.pan = panMatch[1].toUpperCase();
        }
      } else if (
        /^MOBILE$|^MOBILE NUMBER$|^PHONE$|^PHONE NUMBER$|^TELEPHONE NUMBER$/.test(
          k,
        ) &&
        !personal.mobile
      ) {
        const phone = v.replace(/[^0-9]/g, "");
        if (phone.length >= 10) personal.mobile = phone.slice(-10);
      } else if (/^EMAIL$|^EMAIL ID$/.test(k) && !personal.email)
        personal.email = v;
      else if (
        /^COMPANY$|^EMPLOYER$|^ORGANIZATION$|^ORGANISATION$/.test(k) &&
        !personal.company
      )
        personal.company = v;

      if (/ADDRESS/.test(k)) {
        if (addrBuf.length) {
          addresses.push(addrBuf.join(" ").replace(/\s+/g, " ").trim());
          addrBuf = [];
        }
        if (v) addrBuf.push(v);
        inAddr = true;
      } else if (inAddr && v === "") {
        inAddr = false;
      }
      continue;
    }

    if (!inAddr) continue;
    if (stopAddress(line)) {
      if (addrBuf.length)
        addresses.push(addrBuf.join(" ").replace(/\s+/g, " ").trim());
      addrBuf = [];
      inAddr = false;
      continue;
    }
    addrBuf.push(line);
  }
  if (addrBuf.length)
    addresses.push(addrBuf.join(" ").replace(/\s+/g, " ").trim());
  if (addresses.length)
    personal.addresses = Array.from(new Set(addresses.filter(Boolean)));

  const enquiry_details = [];
  const enqDateRe = /\b(\d{2}[-\/]\d{2}[-\/]\d{4})\b/;

  // Extract enquiries using logical lines for better table row detection
  let enqSectionIdx = upper.indexOf("ENQUIRY PURPOSE");
  if (enqSectionIdx < 0) enqSectionIdx = upper.indexOf("CREDIT ENQUIRIES");
  if (enqSectionIdx < 0) enqSectionIdx = upper.indexOf("CREDIT ENQUIRY");

  if (enqSectionIdx >= 0) {
    let enqText = joined.slice(enqSectionIdx);
    const endIdx = enqText
      .slice(50)
      .search(/\bSUMMARY:|\bACCOUNT DETAILS\b|\bCONTACT INFORMATION\b/i);
    if (endIdx > 0) enqText = enqText.slice(0, endIdx + 50);

    // =====================================================
    // ENQUIRY ROW EXTRACTION (handles TransUnion/Equifax/CRIF/Paisabazaar)
    // =====================================================

    // 1) Whitespace-separated rows (e.g. "1   Personal Loan   KOTAK BANK   27-12-2025")
    //    Works for TransUnion/Equifax/CRIF and any report that uses whitespace
    //    between columns. The pattern is flexible enough to handle single or
    //    multiple whitespace characters (including newlines).
    const enqRowRe = /(\d{1,3})\s+([A-Z][a-zA-Z][a-zA-Z\s\-–]{1,40}?)\s+([A-Z][A-Z0-9 &.'\-]{2,60}?)\s+(\d{2}[-\/]\d{2}[-\/]\d{4})/g;
    let m;
    while ((m = enqRowRe.exec(enqText)) !== null) {
      const purpose = m[2].trim();
      const member = m[3].trim();
      const date = parseDate(m[4]);
      if (purpose && member && date && !isEnquiryNoise(purpose, member)) {
        enquiry_details.push({ date, member, purpose });
      }
    }

    // 2) Squished rows (e.g. "1Housing LoanSBI22-04-2026")
    if (enquiry_details.length === 0) {
      const enqSquishedRe =
        /(\d{1,3})(Housing\s+Loan|Personal\s+Loan|Credit\s+Card|Business\s+Loan(?:\s*[–-]\s*General)?|Other|Education\s+Loan|Vehicle\s+Loan|Two[\s-]?wheeler\s+Loan|Loan\s+on\s+Credit\s+Card|Gold\s+Loan|Property\s+Loan|Overdraft|Consumer\s+Loan)([A-Z][A-Z0-9 &.'\-]{2,60}?)(\d{2}[-\/]\d{2}[-\/]\d{4})/gi;
      while ((m = enqSquishedRe.exec(enqText)) !== null) {
        const purpose = m[2].trim().replace(/\s+/g, " ");
        const member = m[3].trim().replace(/\s+/g, " ");
        const date = parseDate(m[4]);
        if (purpose && member && date && !isEnquiryNoise(purpose, member)) {
          enquiry_details.push({ date, member, purpose });
        }
      }
    }

    // 3) Line-by-line key:value pairs (some Equifax/CRIF formats)
    if (enquiry_details.length === 0) {
      const enqLines = enqText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      let current = {};
      for (let i = 0; i < enqLines.length; i++) {
        const line = enqLines[i];
        const memberMatch = line.match(/^(?:Member\s+Name|Financial\s+Institution|Lender|Bank)\s*[:\-]?\s*(.+)$/i);
        const dateMatch = line.match(
          /^(?:Date\s+Of\s+Enquiry|Enquired\s*on|Enquiry\s*Date)\s*[:\-]?\s*(.+)$/i,
        );
        const purposeMatch = line.match(
          /^(?:Enquiry\s*Purpose|Purpose)\s*[:\-]?\s*(.+)$/i,
        );

        if (memberMatch) {
          if (current.member || current.date || current.purpose) {
            if (current.member && current.date && current.purpose)
              enquiry_details.push({ ...current });
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
        const labelOnlyMatch = line.match(
          /^(Member\s+Name|Financial\s+Institution|Lender|Bank|Date\s+Of\s+Enquiry|Enquired\s*on|Enquiry\s*Date|Enquiry\s*Purpose|Purpose)\s*[:\-]?$/i,
        );
        if (labelOnlyMatch && i + 1 < enqLines.length) {
          const nextValue = enqLines[i + 1].trim();
          if (/^(Member\s+Name|Financial\s+Institution|Lender|Bank)$/i.test(labelOnlyMatch[1])) {
            current.member = nextValue;
          } else if (/^(Date\s+Of\s+Enquiry|Enquired\s*on|Enquiry\s*Date)$/i.test(labelOnlyMatch[1])) {
            current.date = parseDate(nextValue) || undefined;
          } else if (/^(Enquiry\s*Purpose|Purpose)$/i.test(labelOnlyMatch[1])) {
            current.purpose = nextValue;
          }
          i += 1;
          continue;
        }
      }
      if (current.member && current.date && current.purpose)
        enquiry_details.push({ ...current });
    }
  }

  // Fallback to line-by-line if global extraction found nothing
  if (enquiry_details.length === 0) {
    let inEnq = false;
    for (const line of lines) {
      if (
        !inEnq &&
        /\bENQUIR(?:Y|IES)\b/i.test(line) &&
        (/\bDETAIL|HISTORY|INFORMATION\b/i.test(line) ||
          /\bPURPOSE\b/i.test(line))
      ) {
        inEnq = true;
      }
      if (!inEnq) continue;
      if (/\bACCOUNT\b/i.test(line) && /\bTYPE\b/i.test(line)) break;
      if (/\bSUMMARY:\b/i.test(line)) break;

      const dm = line.match(enqDateRe);
      if (!dm) continue;

      const date = parseDate(dm[1]);
      let member = "";
      let purpose = "";
      let amount = undefined;
      const rest = line.replace(enqDateRe, "").trim();
      const parts = rest
        .split(/\s{2,}/)
        .map((x) => x.trim())
        .filter(Boolean);
      if (parts.length >= 2) {
        member = parts[0] || "";
        purpose = parts[1] || "";
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

  const paisabazaarAccounts = parsePaisabazaarSummary(joined);

  /**
   * Parse summary table rows from squished CIBIL format like:
   *   "YES BANK\nPersonal Loan\nXXXX9705\nIndividual\n01-09-2025\nActive\n30-04-2026\n2,00,000\n1,83,383"
   * This handles TransUnion CIBIL / Equifax / CRIF / Paisabazaar reports that
   * have no whitespace between fields.
   */
  const parseSquishedSummaryRows = (sectionText) => {
    const rows = [];
    const lines = sectionText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    // Join the lines back together in a flexible way: many "rows" may actually
    // be split across multiple lines because pdf-parse inserts linebreaks in
    // arbitrary places. So we work on a flat normalized version, then also
    // consider line-by-line.
    const flat = lines
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    // Build a robust row pattern:
    //   LENDER (bank name, e.g. "YES BANK", "BAJAJ FIN LTD")
    //   TYPE (Personal Loan, Housing Loan, Credit Card, ...)
    //   ACCT_NO (XXXX1234, with optional trailing letter like XXXX317L)
    //   OWNERSHIP (Individual, Joint, Guarantor, ...)
    //   OPENED_DATE (dd-mm-yyyy)
    //   STATUS (Active, Closed, Settled, ...)
    //   LAST_UPDATE (dd-mm-yyyy)
    //   AMOUNT_1 (sanctioned for loan, high_credit for credit card)
    //   AMOUNT_2 (outstanding balance)
    const accountNoToken = "XXXX[A-Z0-9]{3,7}|[A-Z0-9X*]{6,}";
    const ownerRe =
      "(?:Individual|Joint|Guarantor|Co-Applicant|Co Applicant|Authorised User|Authorized User|Primary|Secondary|Sole)";
    const statusRe =
      "(?:Active\\*?\\*?|Closed|Settled|Written\\s*Off|Wilful\\s*Default|Suit\\s*Filed|Loss|SMA|Special\\s*Mention)";
    const dateRe = "\\d{2}[-\\/]\\d{2}[-\\/]\\d{4}";
    const moneyRe = "[\\d,]+(?:\\.\\d{1,2})?|NA|\\-[\\d,]+|\\-";

    const rowRe = new RegExp(
      [
        "([A-Z][A-Z0-9 &.'\\-]{1,60}?)",        // 1: Lender
        `(?:\\s+|^)(${loanTypePatternExpanded()})`, // 2: Type
        `[\\s\\n]*(${accountNoToken})`,             // 3: Account number
        `[\\s\\n]*(${ownerRe})`,                    // 4: Ownership
        `[\\s\\n]*(${dateRe})`,                     // 5: Opened date
        `[\\s\\n]*(${statusRe})`,                   // 6: Status
        `[\\s\\n]*(${dateRe})`,                     // 7: Last update
        `[\\s\\n]*(${moneyRe})`,                    // 8: Amount 1 (sanctioned/high_credit)
        `[\\s\\n]*(${moneyRe})`,                    // 9: Amount 2 (outstanding)
      ].join(""),
      "g",
    );

    let m;
    const seen = new Set();
    while ((m = rowRe.exec(flat)) !== null) {
      const lenderRaw = (m[1] || "").trim();
      // Reject if lender is obviously a header/label, not a real bank name
      if (isJunkLenderName(lenderRaw)) continue;
      const lender = normalizeLenderName(lenderRaw);
      const rec = {
        lender: lender || lenderRaw,
        account_type: (m[2] || "").trim(),
        account_no: (m[3] || "").trim(),
        ownership: (m[4] || "").trim(),
        opened_date: parseDate(m[5]),
        account_status: (m[6] || "").replace(/\s+/g, " ").trim(),
        last_update: parseDate(m[7]),
        sanctioned_amount: parseNum(m[8]),
        current_balance: parseNum(m[9]),
      };
      if (!rec.account_no) continue;
      if (isCreditCardType(rec.account_type)) {
        rec.high_credit = rec.sanctioned_amount;
        rec.sanctioned_amount = undefined;
      }
      const key = `${normalizeAccountNo(rec.account_no)}|${rec.lender.toUpperCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(rec);
    }
    return rows;
  };



  function isCreditCardType(t) {
    return /credit\s*card/i.test(t || "");
  }

  function normalizeAccountNo(n) {
    return (n || "").toString().replace(/[^A-Z0-9]/gi, "").toUpperCase();
  }

  function loanTypePatternExpanded() {
    return [
      "Personal\\s+Loan",
      "Education\\s+Loan",
      "Home\\s+Loan",
      "Housing\\s+Loan",
      "Vehicle\\s+Loan",
      "Two[\\s-]?wheeler\\s+Loan",
      "Used\\s+Car\\s+Loan",
      "Gold\\s+Loan",
      "Business\\s+Loan(?:\\s*[–-]\\s*General|\\s+General)?",
      "Consumer\\s+Loan",
      "Loan\\s+Against\\s+Property",
      "Property\\s+Loan",
      "Overdraft",
      "Credit\\s+Card",
      "Loan\\s+on\\s+Credit\\s+Card",
      "Other",
    ].join("|");
  }

  // if (paisabazaarAccounts.length > 0) {
  //   accounts.push(...paisabazaarAccounts);
  // }

  const startRe = /^(ACCOUNT|ACCT)\s*TYPE\s*[:\-]\s*(.+)$/i;
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const accountNoLine = line.match(
      /^(?:ACCOUNT\s*(?:NUMBER|NO)|ACCT\s*(?:NUMBER|NO))\s*[:\-]?\s*(X{3,}\d{3,}|[A-Z0-9X*]{4,})$/i,
    );
    if (accountNoLine) {
      if (!cur) {
        // Look back to find a bank name line. TransUnion CIBIL format has the
        // bank name 1-2 lines before "Account Number:", e.g.:
        //   YES BANK
        //   Active
        //   Account Number:XXXX9705Account type:Personal Loan...
        const prev1 = (lines[lineIdx - 1] || "").trim();
        const prev2 = (lines[lineIdx - 2] || "").trim();
        const prev3 = (lines[lineIdx - 3] || "").trim();
        const isBankish = (raw) => {
          if (!raw) return false;
          let s = raw
            .replace(/^(?:Account\s+Details|Member\s+Name|Lender|Bank\s*Name|Financier|Institution)\s*[:\-]?\s*/i, "")
            .replace(/\s+(Active|Closed|Settled|Written\s*Off|Suit\s*Filed|Wilful\s*Default|Loss|SMA|Individual|Joint|Guarantor)$/i, "")
            .trim();
          if (!s) return false;
          return /^[A-Z][A-Z0-9 &.'\-]{2,80}$/i.test(s) &&
            !/\b(?:ACCOUNT|DATE|STATUS|TYPE|OWNERSHIP|OPENED|CLOSED|NUMBER|NO|INSTITUTION|LENDER|BANK\s*NAME|FINANCIER)\b/i.test(s) &&
            !/^(Active|Closed|Settled|Written\s*Off|Suit\s*Filed|Wilful\s*Default|Loss|SMA)$/i.test(s) &&
            isJunkLenderName(s) === false;
        };
        const stripLender = (raw) => {
          return raw
            .replace(/^(?:Account\s+Details|Member\s+Name|Lender|Bank\s*Name|Financier|Institution)\s*[:\-]?\s*/i, "")
            .replace(/\s+(Active|Closed|Settled|Written\s*Off|Suit\s*Filed|Wilful\s*Default|Loss|SMA|Individual|Joint|Guarantor)$/i, "")
            .trim();
        };
        let lenderGuess = undefined;
        if (isBankish(prev1)) {
          lenderGuess = normalizeLenderName(stripLender(prev1)) || stripLender(prev1);
        } else if (isBankish(prev2)) {
          lenderGuess = normalizeLenderName(stripLender(prev2)) || stripLender(prev2);
        } else if (isBankish(prev3)) {
          lenderGuess = normalizeLenderName(stripLender(prev3)) || stripLender(prev3);
        }
        cur = {
          account_no: accountNoLine[1].trim(),
          lender: lenderGuess,
        };
      } else if (!cur.account_no) {
        cur.account_no = accountNoLine[1].trim();
        if (!cur.lender) {
          const prev1 = (lines[lineIdx - 1] || "").trim();
          const prev2 = (lines[lineIdx - 2] || "").trim();
          const prev3 = (lines[lineIdx - 3] || "").trim();
          const isBankish2 = (raw) => {
            if (!raw) return false;
            let s = raw
              .replace(/^(?:Account\s+Details|Member\s+Name|Lender|Bank\s*Name|Financier|Institution)\s*[:\-]?\s*/i, "")
              .replace(/\s+(Active|Closed|Settled|Written\s*Off|Suit\s*Filed|Wilful\s*Default|Loss|SMA|Individual|Joint|Guarantor)$/i, "")
              .trim();
            if (!s) return false;
            return /^[A-Z][A-Z0-9 &.'\-]{2,80}$/i.test(s) &&
              !/\b(?:ACCOUNT|DATE|STATUS|TYPE|OWNERSHIP|OPENED|CLOSED|NUMBER|NO|INSTITUTION|LENDER|BANK\s*NAME|FINANCIER)\b/i.test(s) &&
              !/^(Active|Closed|Settled|Written\s*Off|Suit\s*Filed|Wilful\s*Default|Loss|SMA)$/i.test(s) &&
              isJunkLenderName(s) === false;
          };
          const stripLender2 = (raw) => {
            return raw
              .replace(/^(?:Account\s+Details|Member\s+Name|Lender|Bank\s*Name|Financier|Institution)\s*[:\-]?\s*/i, "")
              .replace(/\s+(Active|Closed|Settled|Written\s*Off|Suit\s*Filed|Wilful\s*Default|Loss|SMA|Individual|Joint|Guarantor)$/i, "")
              .trim();
          };
          if (isBankish2(prev1)) cur.lender = normalizeLenderName(stripLender2(prev1)) || stripLender2(prev1);
          else if (isBankish2(prev2)) cur.lender = normalizeLenderName(stripLender2(prev2)) || stripLender2(prev2);
          else if (isBankish2(prev3)) cur.lender = normalizeLenderName(stripLender2(prev3)) || stripLender2(prev3);
        }
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
    const memberStart = line.match(
      /^(?:MEMBER\s*NAME|LENDER|BANK\s*NAME|FINANCIER|INSTITUTION)\s*[:\-]\s*(.+)$/i,
    );
    if (memberStart && !cur) {
      cur = { lender: memberStart[1].trim() };
      continue;
    } else if (
      memberStart &&
      cur &&
      cur.lender &&
      Object.keys(cur).length >= 2
    ) {
      push();
      cur = { lender: memberStart[1].trim() };
      continue;
    }

    if (!cur) continue;

    const set = (k, re) => {
      const m = line.match(re);
      if (m && m[1] && cur[k] === undefined) cur[k] = m[1].toString().trim();
    };

    set(
      "lender",
      /^(?:MEMBER\s*NAME|LENDER|BANK\s*NAME|FINANCIER|INSTITUTION)\s*[:\-]\s*(.+)$/i,
    );
    set("account_status", /^(?:ACCOUNT\s*STATUS|STATUS)\s*[:\-]\s*(.+)$/i);
    set("ownership", /^(?:OWNERSHIP|ACCOUNT\s*HOLDER\s*TYPE)\s*[:\-]\s*(.+)$/i);
    set(
      "opened_date",
      /^(?:DATE\s*OPENED|OPENED\s*DATE|DATE\s*OPEN)\s*[:\-]\s*(.+)$/i,
    );
    set("closed_date", /^(?:DATE\s*CLOSED|CLOSED\s*DATE)\s*[:\-]\s*(.+)$/i);
    set(
      "account_no",
      /^(?:ACCOUNT\s*(?:NUMBER|NO)|ACCT\s*(?:NUMBER|NO))\s*[:\-]?\s*(X{3,}\d{3,}|[A-Z0-9X*]{4,})$/i,
    );

    const money = (k, re) => {
      const m = line.match(re);
      if (m && m[1] && cur[k] === undefined) cur[k] = parseNum(m[1]);
    };

    money("emi", /\bEMI\b[^0-9]{0,20}([\d,]+(?:\.\d{1,2})?)\b/i);
    money(
      "current_balance",
      /\bCURRENT\s*(?:BALANCE|BAL|CURR\.?\s*BAL)\b[^0-9]{0,20}([\d,]+(?:\.\d{1,2})?)\b/i,
    );
    money(
      "sanctioned_amount",
      /\bSANCTION(?:ED)?\s*(?:AMOUNT)?\b[^0-9]{0,20}([\d,]+(?:\.\d{1,2})?)\b/i,
    );
    money(
      "high_credit",
      /\bHIGH\s*(?:CREDIT|CR)\b[^0-9]{0,20}([\d,]+(?:\.\d{1,2})?)\b/i,
    );
    money(
      "credit_limit",
      /\b(?:CREDIT\s*LIMIT|LIMIT)\b[^0-9]{0,20}([\d,]+(?:\.\d{1,2})?)\b/i,
    );
    money(
      "overdue_amount",
      /\b(?:OVERDUE|OD\s*AMOUNT|OVER\s*DUE)\b[^0-9]{0,20}([\d,]+(?:\.\d{1,2})?)\b/i,
    );

    const lookahead = lines
      .slice(lineIdx, Math.min(lines.length, lineIdx + 4))
      .join(" ");
    if (cur.emi === undefined)
      cur.emi = pickLabeledNumber(lookahead, /\bEMI\b/i);
    if (cur.overdue_amount === undefined)
      cur.overdue_amount = pickLabeledNumber(lookahead, /\bOVERDUE\b/i);
    if (cur.current_balance === undefined)
      cur.current_balance = pickLabeledNumber(
        lookahead,
        /\b(?:OUTSTANDING|CURRENT)\b/i,
      );
    if (cur.sanctioned_amount === undefined)
      cur.sanctioned_amount = pickLabeledNumber(lookahead, /\bLOAN\b/i);
    if (cur.actual_last_payment === undefined)
      cur.actual_last_payment = pickLabeledNumber(
        lookahead,
        /\bACTUAL\s+LAST\s+PAYMENT\b/i,
      );
    if (cur.last_payment_date === undefined)
      cur.last_payment_date = pickLabeledDate(lookahead, /\bLAST\s+PAYMENT\b/i);

    if (
      /\b(WRITE\s*OFF|WRITTEN\s*OFF|SETTLED|SETTLEMENT|SUIT\s*FILED|WILFUL\s*DEFAULT|LOSS|SPECIAL\s*MENTION)\b/i.test(
        line,
      )
    ) {
      // Ignore if it's just an empty field label like "Settlement Amount NA" or "Suit Filed Status NA"
      if (!/(?:Settlement\s+Amount|Suit\s+Filed\s+Status)\s*NA/i.test(line)) {
        cur.adverse_flags = cur.adverse_flags || [];
        const f = line.toUpperCase();
        if (/WRITE\s*OFF|WRITTEN\s*OFF/i.test(f))
          cur.adverse_flags.push("WRITTEN_OFF");
        if (/SETTLED|SETTLEMENT/i.test(f)) cur.adverse_flags.push("SETTLED");
        if (/SUIT\s*FILED/i.test(f)) cur.adverse_flags.push("SUIT_FILED");
        if (/WILFUL\s*DEFAULT/i.test(f))
          cur.adverse_flags.push("WILFUL_DEFAULT");
        if (/\bLOSS\b/i.test(f)) cur.adverse_flags.push("LOSS");
        if (/SPECIAL\s*MENTION/i.test(f)) cur.adverse_flags.push("SMA");
        cur.adverse_flags = Array.from(new Set(cur.adverse_flags));
      }
    }

    if (/\bDPD\b/i.test(line)) {
      const nums = (line.match(/\b\d{2,3}\b/g) || [])
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n));
      const nonZero = nums.filter((n) => n > 0);
      const max = nonZero.length ? Math.max(...nonZero) : 0;
      cur.dpd_max = Math.max(cur.dpd_max || 0, max);
    }

    if (
      new RegExp(`\\b${monthRe}\\b`, "i").test(line) ||
      /\b(?:\d{3}|XXX|STD)\b/i.test(line)
    ) {
      cur._dpd_text = `${cur._dpd_text || ""}\n${line}`.trim();
    }
  }
  push();

  const summaryAccounts = [];

  // Helper to parse summary rows with better accuracy (handles potential 2-line wraps)
  const parseSummaryRows = (sectionText, isCC = false) => {
    const rows = [];
    const rawLines = sectionText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l);

    // Combine lines that look like they belong together (e.g bank name split from rest of row)
    const lines = [];
    for (let i = 0; i < rawLines.length; i++) {
      let current = rawLines[i];
      // If current line is just a bank name and next line starts with account type, combine them
      if (i + 1 < rawLines.length) {
        const next = rawLines[i + 1];
        const nextStartsWithType = new RegExp(`^${typeRe}`, "i").test(next);
        if (!new RegExp(`${typeRe}`, "i").test(current) && nextStartsWithType) {
          current += " " + next;
          i++;
        }
      }
      lines.push(current);
    }

    // Whitespace-separated row pattern (lender first - TransUnion/Paisabazaar)
    const rowRegex = new RegExp(
      `([A-Z][A-Z0-9 &.'\\-]{2,50})\\s+` +  // Lender
      `(${typeRe})\\s+` +  // Account type
      `(XXXX[A-Z0-9]+|[A-Z0-9X*]{4,})\\s+` +  // Account number
      `(Individual|Guarantor|Joint|Co-Applicant|Co Applicant|Authorized User|Authorised User)\\s+` +  // Ownership
      `(\\d{2}-\\d{2}-\\d{4})\\s+` +  // Opened date
      `(Active|Closed|Settled|Written\\s*Off|Suit\\s*Filed|Wilful\\s*Default|Loss|SMA)`,  // Status
      "i",
    );

    // Reversed pattern: type first, lender last (Harvinder/Equifax format)
    const rowRegexReversed = new RegExp(
      `(${typeRe})\\s+` +  // Account type
      `(XXXX[A-Z0-9]+|[A-Z0-9X*]{4,})\\s+` +  // Account number
      `(Individual|Guarantor|Joint|Co-Applicant|Co Applicant|Authorized User|Authorised User)\\s+` +  // Ownership
      `(\\d{2}-\\d{2}-\\d{4})\\s+` +  // Opened date
      `(Active|Closed|Settled|Written\\s*Off|Suit\\s*Filed|Wilful\\s*Default|Loss|SMA)\\s+` +  // Status
      `(\\d{2}-\\d{2}-\\d{4})\\s+` +  // Last update
      `([\\d,]+|NA)\\s+` +  // Amount 1
      `([\\d,]+|NA)\\s+` +  // Amount 2
      `([A-Z][A-Z0-9 &.'\\-]{2,50})`,  // Lender at end
      "i",
    );

    for (const line of lines) {
      const mFwd = line.match(rowRegex);
      const mRev = line.match(rowRegexReversed);
      let m, isReversed;
      if (mFwd && mRev) {
        // Both match — prefer reversed (has more fields, handles lender-at-end format)
        m = mRev;
        isReversed = true;
      } else if (mRev) {
        m = mRev;
        isReversed = true;
      } else if (mFwd) {
        m = mFwd;
        isReversed = false;
      } else {
        continue;
      }
      if (m) {
        const lenderRaw = isReversed ? (m[9] || "").trim() : (m[1] || "").trim();
        const account_type = isReversed ? m[1].trim() : m[2].trim();
        const account_no = isReversed ? m[2].trim() : m[3].trim();
        const ownership = isReversed ? m[3].trim() : m[4].trim();
        const opened_date = isReversed ? m[4] : m[5];
        const account_status = isReversed ? (m[5] || "").replace(/\s+/g, " ").trim() : (m[6] || "").replace(/\s+/g, " ").trim();
        const last_update = isReversed ? m[6] : m[7];
        const n1 = isReversed ? parseNum(m[7]) : parseNum(m[8]);
        const n2 = isReversed ? (m[8] === "NA" ? undefined : parseNum(m[8])) : parseNum(m[9]);

        if (/\b(?:DATE|ACCOUNT|STATUS|UPDATE|TYPE|OPENED|CLOSED|NUMBER|NO)\b/i.test(lenderRaw)) continue;
        if (lenderRaw.length < 3) continue;
        if (isJunkLenderName(lenderRaw)) continue;

        const lender = normalizeLenderName(lenderRaw);

        const rec = {
          lender: lender || lenderRaw,
          account_type,
          account_no,
          ownership,
          opened_date: parseDate(opened_date),
          account_status,
          last_update: parseDate(last_update),
          current_balance: n2,
          overdue_amount: undefined,
          emi: undefined,
        };

        if (isCC || /credit\s*card/i.test(account_type)) {
          rec.high_credit = n1;
        } else {
          rec.sanctioned_amount = n1;
        }
        rows.push(rec);
      }
    }

    // Also try the squished-row parser for tables without whitespace between fields
    // (TransUnion CIBIL / Equifax / CRIF / Paisabazaar).
    const squishedRows = parseSquishedSummaryRows(sectionText);
    for (const r of squishedRows) {
      // Skip duplicates by account_no + lender
      const exists = rows.find(
        (x) => x.account_no === r.account_no && x.lender === r.lender,
      );
      if (!exists) rows.push(r);
    }

    // Multi-line row parser: Paisabazaar format where each field is on its own line
    // Pattern: Lender, Type, AccountNo, Ownership, OpenedDate, Status, LastUpdate, Amount, Balance
    const dateRe = /^\d{2}-\d{2}-\d{4}$/;
    const statusRe = /^(?:Active|Closed|Settled|Written\s*Off|Suit\s*Filed|Wilful\s*Default|Loss|SMA|Special\s*Mention)$/i;
    const acctNoRe = /^(?:XXXX[A-Z0-9]+|[A-Z0-9X*]{4,})$/;
    const ownerRe = /^(?:Individual|Joint|Guarantor|Co-Applicant|Co Applicant|Authorized User|Authorised User)$/i;
    const typeReLocal = new RegExp(`^${typeRe}$`, "i");
    const moneyRe = /^[\d,]+(?:\.\d{1,2})?$/;

    for (let i = 0; i < rawLines.length - 8; i++) {
      const lenderRaw = rawLines[i];
      const acctType = rawLines[i + 1];
      const acctNo = rawLines[i + 2];
      const ownership = rawLines[i + 3];
      const openedDate = rawLines[i + 4];
      const status = rawLines[i + 5];
      const lastUpdate = rawLines[i + 6];
      const amt1 = rawLines[i + 7];
      const amt2 = rawLines[i + 8];

      if (
        lenderRaw.length >= 3 &&
        typeReLocal.test(acctType) &&
        acctNoRe.test(acctNo) &&
        ownerRe.test(ownership) &&
        dateRe.test(openedDate) &&
        statusRe.test(status) &&
        dateRe.test(lastUpdate) &&
        (moneyRe.test(amt1) || amt1 === "NA") &&
        (moneyRe.test(amt2) || amt2 === "NA")
      ) {
        if (isJunkLenderName(lenderRaw)) continue;
        const lender = normalizeLenderName(lenderRaw);
        const n1 = parseNum(amt1) || undefined;
        const n2 = (amt2 === "NA" ? undefined : parseNum(amt2)) || undefined;
        const rec = {
          lender: lender || lenderRaw,
          account_type: acctType,
          account_no: acctNo,
          ownership,
          opened_date: parseDate(openedDate),
          account_status: status,
          last_update: parseDate(lastUpdate),
          current_balance: n2,
        };
        if (isCC || /credit\s*card/i.test(acctType)) {
          rec.high_credit = n1;
        } else {
          rec.sanctioned_amount = n1;
        }
        const exists = rows.find((x) => x.account_no === rec.account_no);
        if (!exists) rows.push(rec);
        i += 8; // skip the 9 lines we just consumed
      }
    }

    return rows;
  };

  // Pass 1: Summary: Loan Accounts
  const idxLoan = upper.indexOf("SUMMARY: LOAN ACCOUNTS");
  if (idxLoan >= 0) {
    const sectionStart = t.toUpperCase().indexOf("SUMMARY: LOAN ACCOUNTS");
    let sectionText = t.slice(sectionStart);
    const nextSectionIdx = sectionText
      .slice(20)
      .search(/\bSUMMARY:|\bACCOUNT DETAILS\b/i);
    if (nextSectionIdx > 0)
      sectionText = sectionText.slice(0, nextSectionIdx + 20);

    summaryAccounts.push(...parseSummaryRows(sectionText, false));
  }

  // Pass 2: Summary: Credit Cards
  const idxCC = upper.indexOf("SUMMARY: CREDIT CARDS");
  if (idxCC >= 0) {
    const sectionStart = t.toUpperCase().indexOf("SUMMARY: CREDIT CARDS");
    let sectionText = t.slice(sectionStart);
    const nextSectionIdx = sectionText
      .slice(20)
      .search(/\bSUMMARY:|\bACCOUNT DETAILS\b/i);
    if (nextSectionIdx > 0)
      sectionText = sectionText.slice(0, nextSectionIdx + 20);

    summaryAccounts.push(...parseSummaryRows(sectionText, true));
  }

  // Pass 3: Catch-all regex for accounts that might have been missed
  const seenSummaryKeys = new Set(summaryAccounts.map(accountKey));
  const accountNoRe = /\b([A-Z0-9X*]{4,})\b/gi;
  let mm;
  while ((mm = accountNoRe.exec(joinedFlat)) !== null) {
    const accountNo = (mm[1] || "").trim();
    if (
      !accountNo ||
      /\b(?:ACCOUNT|NUMBER|NO|OWNERSHIP|TYPE|STATUS|DATE|AMOUNT|BALANCE|LIMIT|INSTITUTION|LENDER|SR|NO)\b/i.test(
        accountNo,
      )
    )
      continue;
    const before = joinedFlat
      .slice(Math.max(0, mm.index - 150), mm.index)
      .replace(/\s+/g, " ")
      .trim();
    const after = joinedFlat
      .slice(mm.index + accountNo.length, mm.index + accountNo.length + 250)
      .replace(/\s+/g, " ")
      .trim();
    const beforeMatch = before.match(
      new RegExp(
        `(?:^|\\s)([A-Z][A-Z0-9 &.'-]{2,60})\\s+(${typeRe})\\s*$`,
        "i",
      ),
    );
    const afterMatch = after.match(
      /^\s*(Individual|Guarantor|Joint|Co-Applicant|Co Applicant|CoApplicant|Authorized User|Authorised User)\s+(\d{2}-\d{2}-\d{4})\s+(Active\*?\*?|Closed|Settled|Written\*?\s*Off|Suit\*?\s*Filed|Wilful\*?\s*Default|Loss|Special\*?\s*Mention|SMA)\s+(\d{2}-\d{2}-\d{4})\s+([\d,NA-]+)\s+([\d,NA-]+)(?:\s+([\d,NA-]+))?(?:\s+([\d,NA-]+))/i,
    );

    if (beforeMatch && afterMatch) {
      const lenderRaw = (beforeMatch[1] || "").trim();
      if (
        !lenderRaw ||
        /\bDATE\b|\bACCOUNT\b|\bSTATUS\b|\bUPDATE\b/i.test(lenderRaw)
      )
        continue;
      const lender = normalizeLenderName(lenderRaw);
      const account_type = (beforeMatch[2] || "").trim();

      const rec = {
        lender,
        account_type,
        account_no: accountNo,
        ownership: (afterMatch[1] || "").trim(),
        opened_date: parseDate(afterMatch[2]),
        account_status: (afterMatch[3] || "").replace(/\s+/g, " ").trim(),
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

  // Dedup summaryAccounts by account_no only (keep first = correct reversed-regex match)
  {
    const beforeCount = summaryAccounts.length;
    const seenAccountNos = new Set();
    for (let i = 0; i < summaryAccounts.length; i++) {
      const s = summaryAccounts[i];
      if (s.account_no && seenAccountNos.has(s.account_no)) {
        summaryAccounts.splice(i, 1);
        i--;
      } else if (s.account_no) {
        seenAccountNos.add(s.account_no);
      }
    }
    if (summaryAccounts.length !== beforeCount) {
      console.log(`DEDUP: ${beforeCount} -> ${summaryAccounts.length} summary accounts`);
      // Show what XXXX7037 looks like after dedup
      const x7037 = summaryAccounts.find(s => s.account_no === 'XXXX7037');
      if (x7037) console.log(`  XXXX7037: lender=${x7037.lender} type=${x7037.account_type}`);
    }
  }

  for (const summary of summaryAccounts) {
    if (!summary.account_no) continue;
    const existing = accounts.find(
      (a) => a.account_no && summary.account_no && a.account_no === summary.account_no,
    );
    if (existing) {
      // Preserve DPD/adverse data from the main loop but use summary data for everything else
      const dpdData = {
        adverse_flags: existing.adverse_flags,
        dpd_history: existing.dpd_history,
        dpd_max: existing.dpd_max,
        dpd_delay_count: existing.dpd_delay_count,
        dpd_history_formatted: existing.dpd_history_formatted,
        _dpd_text: existing._dpd_text,
      };
      Object.assign(existing, summary);
      if (dpdData.adverse_flags && dpdData.adverse_flags.length) existing.adverse_flags = dpdData.adverse_flags;
      if (dpdData.dpd_history) existing.dpd_history = dpdData.dpd_history;
      if (dpdData.dpd_max) existing.dpd_max = dpdData.dpd_max;
      if (dpdData.dpd_delay_count) existing.dpd_delay_count = dpdData.dpd_delay_count;
      if (dpdData.dpd_history_formatted) existing.dpd_history_formatted = dpdData.dpd_history_formatted;
      if (dpdData._dpd_text) existing._dpd_text = dpdData._dpd_text;
    } else {
      accounts.push(summary);
    }
  }

  for (const p of paisabazaarAccounts) {
    const existing = accounts.find(
      a =>
        a.account_no &&
        p.account_no &&
        a.account_no === p.account_no
    );

    if (!existing) {
      accounts.push(p);
    }
  }

  // =====================================================
  // TRANSUNION DIRECT FORMAT: Member Name / Account Type / Account Number blocks
  // (e.g. Reshmi-style CIBIL reports with multi-line labeled blocks)
  // =====================================================
  {
    const rawLines = t.split("\n");
    const memberIndices = [];
    for (let i = 0; i < rawLines.length; i++) {
      if (rawLines[i].trim() === "Member Name") memberIndices.push(i);
    }
    // Also detect "Member NameXXX" squished format for enquiries
    if (memberIndices.length >= 2) {
      const squishedMemberRe = /^Member Name\s*([A-Z][A-Z0-9 &.'\-]{2,80})$/i;
      for (let i = 0; i < rawLines.length; i++) {
        const smMatch = rawLines[i].match(squishedMemberRe);
        if (smMatch && !memberIndices.includes(i)) {
          // This is a squished Member Name line (for enquiries), skip
        }
      }

      for (const mi of memberIndices) {
        const lender = (rawLines[mi + 1] || "").trim();
        const acctTypeLabel = (rawLines[mi + 2] || "").trim();
        const acctType = (rawLines[mi + 3] || "").trim();

        // Account number may be on same line as label ("Account Number: PLTLBORI...") or separate line
        let acctNo = "";
        let ownership = "";
        for (let k = mi + 4; k < Math.min(mi + 10, rawLines.length); k++) {
          const ll = rawLines[k].trim();
          const acctMatch = ll.match(/Account\s*Number\s*:?\s*(.+)/i);
          if (acctMatch && !acctNo) { acctNo = acctMatch[1].trim(); continue; }
          const ownMatch = ll.match(/Ownership\s*:?\s*(.+)/i);
          if (ownMatch) { ownership = ownMatch[1].trim(); break; }
          if (/^(?:ACCOUNT\s*DETAILS|Date\s*Reported)/i.test(ll)) break;
        }

        if (
          !acctNo || acctNo.length < 4 ||
          !lender || lender.length < 2 ||
          /\b(?:Account|Number|Type|Ownership|Status)\b/i.test(lender)
        ) continue;
        if (/\b(?:ACCOUNT|NUMBER|NO|TYPE|OWNERSHIP|STATUS|DATE|AMOUNT|BALANCE)\b/i.test(acctNo)) continue;

        const isCC = /credit\s*card/i.test(acctType);

        // Search backward for squished label-value lines (Sanctioned Amount₹X, Current Balance₹X)
        let sanctioned, balance, overdue, status, opened;
        for (let j = mi - 1; j >= Math.max(0, mi - 40); j--) {
          const l = rawLines[j];
          if (/^Sanctioned Amount/i.test(l)) sanctioned = parseNum(l.replace(/^Sanctioned Amount/i, ""));
          if (/^Current Balance/i.test(l)) balance = parseNum(l.replace(/^Current Balance/i, ""));
          if (/^Amount Overdue/i.test(l)) overdue = parseNum(l.replace(/^Amount Overdue/i, ""));
          if (/^Credit Facility Status/i.test(l)) {
            const s = l.replace(/^Credit Facility Status/i, "").trim();
            if (s && s !== "-") status = s;
          }
          if (/^Date Opened \/ Disbursed/i.test(l)) opened = l.replace(/^Date Opened \/ Disbursed/i, "").trim();
          if (/^Credit Limit/i.test(l) && isCC) {
            const v = parseNum(l.replace(/^Credit Limit/i, ""));
            if (v) sanctioned = v;
          }
        }

        // Search forward for more details (Date Opened, EMI, etc.)
        for (let j = mi + 8; j < Math.min(rawLines.length, mi + 50); j++) {
          const l = rawLines[j];
          if (/^Date Opened \/ Disbursed/i.test(l) && !opened) opened = l.replace(/^Date Opened \/ Disbursed/i, "").trim();
          if (/^Sanctioned Amount/i.test(l) && sanctioned === undefined) sanctioned = parseNum(l.replace(/^Sanctioned Amount/i, ""));
          if (/^Current Balance/i.test(l) && balance === undefined) balance = parseNum(l.replace(/^Current Balance/i, ""));
          if (/^Amount Overdue/i.test(l) && overdue === undefined) overdue = parseNum(l.replace(/^Amount Overdue/i, ""));
          if (/^Credit Facility Status/i.test(l) && !status) {
            const s = l.replace(/^Credit Facility Status/i, "").trim();
            if (s && s !== "-") status = s;
          }
          if (/^Credit Limit/i.test(l) && isCC && sanctioned === undefined) {
            const v = parseNum(l.replace(/^Credit Limit/i, ""));
            if (v) sanctioned = v;
          }
          if (/^EMI Amount/i.test(l)) {
            const v = parseNum(l.replace(/^EMI Amount/i, ""));
            if (v) {} // just skip
          }
          if (/^(?:Closed Account|OPEN ACCOUNTS|CLOSED ACCOUNTS|ENQUIR)/i.test(l)) break;
        }

        const normLender = normalizeLenderName(lender);
        const rec = {
          lender: normLender || lender,
          account_type: acctType || undefined,
          account_no: acctNo,
          ownership: ownership || undefined,
          opened_date: parseDate(opened),
          account_status: status || undefined,
          current_balance: balance,
          sanctioned_amount: sanctioned,
          overdue_amount: overdue,
        };
        const exists = accounts.find(a => a.account_no && rec.account_no && a.account_no === rec.account_no);
        if (exists) {
          if (rec.lender && (!exists.lender || /\b(?:Personal|Business|Housing)\b/i.test(exists.lender))) exists.lender = rec.lender;
          if (rec.account_type) exists.account_type = rec.account_type;
          if (rec.ownership) exists.ownership = rec.ownership;
          if (rec.opened_date) exists.opened_date = rec.opened_date;
          if (rec.account_status) exists.account_status = rec.account_status;
          if (rec.current_balance !== undefined) exists.current_balance = rec.current_balance;
          if (rec.sanctioned_amount !== undefined) exists.sanctioned_amount = rec.sanctioned_amount;
          if (rec.overdue_amount !== undefined) exists.overdue_amount = rec.overdue_amount;
        } else {
          accounts.push(rec);
        }
      }

      // Parse TransUnion enquiries: "Member NameXXX\nDate Of EnquiryDD/MM/YYYY\nEnquiry PurposeXXX"
      const enqSectionIdx = upper.indexOf("ENQUIRY DETAILS");
      if (enqSectionIdx >= 0) {
        const enqText = t.slice(enqSectionIdx);
        const enqLines = enqText.split("\n");
        for (let i = 0; i < enqLines.length - 2; i++) {
          const squishedMatch = enqLines[i].match(/^Member Name\s*([A-Z][A-Z0-9 &.'\-]{2,80})$/i);
          const normalMatch = enqLines[i].trim() === "Member Name";
          let member = "";
          if (squishedMatch) member = squishedMatch[1].trim();
          else if (normalMatch) member = (enqLines[i + 1] || "").trim();

          if (member && member.length > 1) {
            // Find Date Of Enquiry in next lines
            for (let j = i + 1; j < Math.min(i + 5, enqLines.length); j++) {
              const dateMatch = enqLines[j].match(/(?:Date Of Enquiry|Date\s*Of\s*Enquiry)\s*(\d{2}\/\d{2}\/\d{4})/i)
                || enqLines[j].match(/^(\d{2}\/\d{2}\/\d{4})$/);
              if (dateMatch) {
                const purposeMatch = enqLines.slice(j, j + 3).find(l => /Enquiry Purpose/i.test(l));
                const purpose = purposeMatch ? purposeMatch.replace(/.*Enquiry Purpose\s*/i, "").trim() : "";
                if (!/\b(?:Report|Number|ECN|Table|Date)\b/i.test(member)) {
                  const existingEnq = enquiry_details.find(
                    e => e.member === normalizeLenderName(member) && e.date === dateMatch[1]
                  );
                  if (!existingEnq) {
                    enquiry_details.push({
                      date: parseDate(dateMatch[1]) || dateMatch[1],
                      member: normalizeLenderName(member),
                      purpose,
                    });
                  }
                }
                break;
              }
            }
          }
        }
      }
    }
  }

  // const detailSegments = joined.split(/(?=\b(?:MEMBER\s*NAME|LENDER|BANK\s*NAME|FINANCIER|INSTITUTION)\b|Account\s+Details\s+[A-Z][A-Z0-9 &.'-]{2,60}\s+(?:Active|Closed|Settled|Written|Suit|Wilful|Loss|SMA))/i);
  // for (let i = 0; i < detailSegments.length; i++) {
  //   const segment = detailSegments[i];
  //   const searchWindow = segment;

  //   const segmentAccountNo =
  //     (segment.match(/\b(?:ACCOUNT\s*(?:NUMBER|NO)|ACCT\s*(?:NUMBER|NO))\s*[:\-]?\s*\n?\s*([A-Z0-9X*]{4,})/i) || [])[1] ||
  //     (segment.match(/\b([A-Z0-9X*]{4,})\b/i) || [])[1] ||
  //     '';
  //   const segmentLenderRaw =
  //     (segment.match(/\b(?:MEMBER\s*NAME|LENDER|BANK\s*NAME|FINANCIER|INSTITUTION)\s*[:\-]?\s*\n?\s*(.+?)(?:\n|$)/i) || [])[1] ||
  //     (segment.match(/^\s*([A-Z][A-Z0-9 &.'-]{2,80})\s*\n\s*Account\s+Number/im) || [])[1] ||
  //     (segment.match(/\b([A-Z][A-Z0-9 &.'-]{2,60})\s+(?:Active|Closed|Settled|Written\s*Off|Suit\s*Filed|Wilful\s*Default|Loss|Special\s*Mention|SMA)[*]*\s+Account Number:/i) || [])[1] ||
  //     (segment.match(/\b(?:Account\s+Information|Credit\s+Account)\s*\n\s*([A-Z][A-Z0-9 &.'-]{2,80})/i) || [])[1] ||
  //     '';
  //   const segmentLender = normalizeLenderName(segmentLenderRaw);
  //   const account_type =
  //     (segment.match(/\b(?:ACCOUNT|ACCT)\s*TYPE\s*[:\-]?\s*\n?\s*(.+?)(?:\n|\s{2,}|$)/i) || [])[1] ||
  //     '';
  //   const account_status =
  //     (segment.match(/\b(?:ACCOUNT\s*STATUS|STATUS|CREDIT\s+FACILITY\s+STATUS)\s*[:\-]?\s*\n?\s*([A-Z][A-Z\s-]{2,30})(?:\n|\s{2,}|$)/i) || [])[1] ||
  //     '';
  //   const detailAccount = {
  //     account_no: segmentAccountNo,
  //     lender: segmentLender.trim(),
  //     account_type: account_type.trim() || undefined,
  //     account_status: account_status.trim() || undefined,
  //     opened_date: pickLabeledDate(searchWindow, /\b(?:ACCOUNT\s+OPENED|DATE\s+OPENED\s*\/\s*DISBURSED)\b/i),
  //     closed_date: pickLabeledDate(searchWindow, /\b(?:ACCOUNT\s+CLOSED|DATE\s+CLOSED)\b/i),
  //     last_update: pickLabeledDate(searchWindow, /\b(?:LAST\s+BANK\s+UPDATE|DATE\s+REPORTED\s+AND\s+CERTIFIED)\b/i),
  //     last_payment_date: pickLabeledDate(searchWindow, /\b(?:LAST\s+PAYMENT|DATE\s+OF\s+LAST\s+PAYMENT)\b/i),
  //     sanctioned_amount: pickLabeledNumber(searchWindow, /\b(?:LOAN|SANCTIONED\s+AMOUNT|ORIGINAL\s+LOAN\s+AMOUNT|HIGH\s+CREDIT)\b/i),
  //     current_balance: pickLabeledNumber(searchWindow, /\b(?:OUTSTANDING|CURRENT\s+BALANCE|TOTAL\s+BALANCE)\b/i),
  //     overdue_amount: pickLabeledNumber(searchWindow, /\b(?:OVERDUE|AMOUNT\s+OVERDUE|PAST\s+DUE\s+AMOUNT)\b/i),
  //     emi: pickLabeledNumber(searchWindow, /\bEMI\b/i) || parseNum((searchWindow.match(/\bEMI\s*Amount\s*[:\-]?\s*([₹]?\s*[\d,]+)/i) || [])[1]),
  //     actual_last_payment: pickLabeledNumber(searchWindow, /\bACTUAL\s+LAST\s+PAYMENT\b/i),
  //   };

  //   const history = parseDpdHistory(segment);
  //   if (history.length) {
  //     detailAccount.dpd_history = history;
  //     detailAccount.dpd_max = history.reduce((max, h) => Math.max(max, Number(h.days) || 0), 0);
  //     detailAccount.dpd_delay_count = history.filter(h => (Number(h.days) || 0) > 0).length;
  //   }
  //   if (detailAccount.account_no || detailAccount.lender) {
  //     if (detailAccount.lender && /\b(?:ACCOUNT|DATE|STATUS|TYPE|OWNERSHIP|LIMIT|BALANCE|AMOUNT|REPORT|SUMMARY|ENQUIRY)\b/i.test(detailAccount.lender)) continue;
  //     if (detailAccount.account_no && /\b(?:ACCOUNT|NUMBER|NO|OWNERSHIP|TYPE|STATUS|DATE|AMOUNT|BALANCE|LIMIT|INSTITUTION|LENDER|SR|NO)\b/i.test(detailAccount.account_no)) continue;

  //     const key = accountKey(detailAccount);
  //     const existing = accounts.find(a => accountKey(a) === key);
  //     if (existing) mergeAccountFields(existing, detailAccount);
  //     else if (detailAccount.account_no && (detailAccount.lender || detailAccount.account_type)) accounts.push(detailAccount);
  //   }
  // }

  // =====================================================
  // BUILD DETAIL SEGMENTS
  // =====================================================

  const detailSegments = [];

  // Paisabazaar Account Details blocks
  const paisaSegments =
    joined.match(
      /Account\s+Details[\s\S]*?(?=Account\s+Details|Summary:|Credit\s+Enquiries|$)/gi,
    ) || [];

  detailSegments.push(...paisaSegments);

  // TransUnion style blocks
  const transSegments =
    joined.match(
      /(?:MEMBER\s*NAME|LENDER|BANK\s*NAME|FINANCIER|INSTITUTION)[\s\S]*?(?=(?:MEMBER\s*NAME|LENDER|BANK\s*NAME|FINANCIER|INSTITUTION)|$)/gi,
    ) || [];

  detailSegments.push(...transSegments);



  // =====================================================
  // PROCESS DETAIL SEGMENTS
  // =====================================================

  for (let i = 0; i < detailSegments.length; i++) {
    const segment = detailSegments[i];
    const searchWindow = segment;

    const segmentAccountNo =
      (segment.match(/Account\s*Number\s*:?\s*([A-Z0-9X*]{4,})/i) || [])[1] ||
      (segment.match(
        /\b(?:ACCOUNT\s*(?:NUMBER|NO)|ACCT\s*(?:NUMBER|NO))\s*[:\-]?\s*([A-Z0-9X*]{4,})/i,
      ) || [])[1] ||
      "";

    const extractLenderFromSegment = (seg) => {
      const isJunkLender = (s) =>
        !s ||
        isJunkLenderName(s) ||
        /\b(?:Account|Date|Type|Status|Number|Ownership|Amount|Balance|Opened|Closed)\b/i.test(s);

      // Pattern 1: TransUnion CIBIL "Account Details\n[BANK NAME]\n[Status]\n..."
      //   In this format, the bank name appears AFTER "Account Details" header on its own line
      //   OR appears at the START of the segment followed by status.
      let m = seg.match(
        /(?:^|\n)\s*([A-Z][A-Z0-9 &.'\-]{2,80})\s*\n\s*(?:Active|Closed|Settled|Written\s*Off|Suit\s*Filed|Wilful\s*Default|Loss|SMA)\s*(?:\n|$|Account)/i,
      );
      if (m && m[1] && !isJunkLender(m[1])) return m[1];

      // Pattern 2: "Account Details\n[BANK NAME]" — bank name immediately after
      m = seg.match(/Account\s+Details\s*\n\s*([A-Z][A-Z0-9 &.'\-]{2,80})/i);
      if (m && m[1] && !isJunkLender(m[1])) return m[1];

      // Pattern 3: "[BANK NAME] Active/Closed Account Number:..." all on consecutive lines
      m = seg.match(
        /([A-Z][A-Z0-9 &.'\-]{2,80})\s+(?:Active|Closed|Settled|Written\s*Off|Suit\s*Filed|Wilful\s*Default|Loss|SMA)\s+Account\s*Number\s*:/i,
      );
      if (m && m[1] && !isJunkLender(m[1])) return m[1];

      // Pattern 4: TransUnion/Equifax/CRIF explicit labels
      m = seg.match(
        /\b(?:MEMBER\s*NAME|LENDER|BANK\s*NAME|FINANCIAL\s*INSTITUTION|FINANCIER|INSTITUTION)\s*[:\-]?\s*\n?\s*(.+?)(?:\n|$)/i,
      );
      if (
        m && m[1] && m[1].length > 2 &&
        !/\b(?:Account|Date|Type|Status|Number|Ownership|Amount|Balance|Opened|Closed|N\/A|NA|—|-)\b/i.test(m[1])
      )
        return m[1];

      // Pattern 5: Bank name at start of segment followed by account type
      m = seg.match(
        /^\s*([A-Z][A-Z0-9 &.'\-]{2,80})\s+(?:Personal\s+Loan|Housing\s+Loan|Credit\s+Card|Home\s+Loan|Vehicle\s+Loan|Education\s+Loan|Business\s+Loan|Overdraft|Gold\s+Loan|Property\s+Loan)/i,
      );
      if (m && m[1] && !isJunkLender(m[1])) return m[1];

      // Pattern 6: Generic text before account number on same line
      const accountNoMatch = seg.match(
        /([A-Z][A-Z0-9 &.'\-]{2,80})\s+(?:XXXX[A-Z0-9]+|[A-Z0-9X*]{4,})\s+(?:Individual|Joint|Guarantor)/i,
      );
      if (accountNoMatch && accountNoMatch[1] && !isJunkLender(accountNoMatch[1]))
        return accountNoMatch[1];

      return "";
    };

    const segmentLenderRaw = extractLenderFromSegment(segment);
    const segmentLender = normalizeLenderName(segmentLenderRaw);

    // Debug logging for lender extraction
    if (segmentAccountNo && !segmentLender) {
      console.log(`[CIBIL] Empty lender for account ${segmentAccountNo}. Raw: "${segmentLenderRaw}", Segment preview: ${segment.slice(0, 200)}`);
    }

    const account_type =
      (segment.match(
        /\b(?:ACCOUNT|ACCT)\s*TYPE\s*[:\-]?\s*\n?\s*(.+?)(?:\n|\s{2,}|$)/i,
      ) || [])[1] || "";

    const account_status =
      (segment.match(
        /\b(?:ACCOUNT\s*STATUS|STATUS|CREDIT\s+FACILITY\s+STATUS)\s*[:\-]?\s*\n?\s*([A-Z][A-Z\s-]{2,30})(?:\n|\s{2,}|$)/i,
      ) || [])[1] || "";

    // Ensure lender is populated - use raw name if normalized is empty
    const finalLender = segmentLender && segmentLender.trim() 
      ? segmentLender.trim() 
      : (segmentLenderRaw && segmentLenderRaw.trim() 
        ? segmentLenderRaw.trim() 
        : "Unknown Lender");

    const detailAccount = {
      account_no: segmentAccountNo,
      lender: finalLender,
      account_type: account_type.trim() || undefined,
      account_status: account_status.trim() || undefined,

      opened_date: pickLabeledDate(
        searchWindow,
        /\b(?:ACCOUNT\s+OPENED|DATE\s+OPENED\s*\/\s*DISBURSED)\b/i,
      ),

      closed_date: pickLabeledDate(
        searchWindow,
        /\b(?:ACCOUNT\s+CLOSED|DATE\s+CLOSED)\b/i,
      ),

      last_update: pickLabeledDate(
        searchWindow,
        /\b(?:LAST\s+BANK\s+UPDATE|DATE\s+REPORTED\s+AND\s+CERTIFIED)\b/i,
      ),

      last_payment_date: pickLabeledDate(
        searchWindow,
        /\b(?:LAST\s+PAYMENT|DATE\s+OF\s+LAST\s+PAYMENT)\b/i,
      ),

      sanctioned_amount: pickLabeledNumber(
        searchWindow,
        /\b(?:LOAN|SANCTIONED\s+AMOUNT|ORIGINAL\s+LOAN\s+AMOUNT|HIGH\s+CREDIT)\b/i,
      ),

      current_balance: pickLabeledNumber(
        searchWindow,
        /\b(?:OUTSTANDING|CURRENT\s+BALANCE|TOTAL\s+BALANCE)\b/i,
      ),

      overdue_amount: pickLabeledNumber(
        searchWindow,
        /\b(?:OVERDUE|AMOUNT\s+OVERDUE|PAST\s+DUE\s+AMOUNT)\b/i,
      ),

      emi:
        pickLabeledNumber(searchWindow, /\bEMI\b/i) ||
        parseNum(
          (searchWindow.match(/\bEMI\s*Amount\s*[:\-]?\s*([₹]?\s*[\d,]+)/i) ||
            [])[1],
        ),

      actual_last_payment: pickLabeledNumber(
        searchWindow,
        /\bACTUAL\s+LAST\s+PAYMENT\b/i,
      ),
    };

    const history = parseDpdHistory(segment);

    if (history.length) {
      detailAccount.dpd_history = history;
      detailAccount.dpd_max = history.reduce(
        (max, h) => Math.max(max, Number(h.days) || 0),
        0,
      );

      detailAccount.dpd_delay_count = history.filter(
        (h) => (Number(h.days) || 0) > 0,
      ).length;
    }



    if (detailAccount.account_no && detailAccount.account_no !== "Report") {
      const key = accountKey(detailAccount);

      // const existing = accounts.find((a) => accountKey(a) === key);

      // if (existing) {
      //   mergeAccountFields(existing, detailAccount);
      // } else if (
      //   detailAccount.account_no &&
      //   (detailAccount.lender || detailAccount.account_type)
      // ) {
      //   accounts.push(detailAccount);
      // }
      const existing = accounts.find(a =>
        a.account_no &&
        detailAccount.account_no &&
        a.account_no === detailAccount.account_no
      );

      if (existing) {
        mergeAccountFields(existing, detailAccount);

        const history = parseDpdHistory(segment);

        if (history.length) {
          existing.dpd_history = history;
          existing.dpd_max = Math.max(...history.map(x => x.days));
          existing.dpd_delay_count =
            history.filter(x => x.days > 0).length;
        }
      }
    }
  }

  for (const a of accounts) {
    if (a.dpd_history?.length) {
      a.dpd_max = Math.max(
        a.dpd_max || 0,
        ...a.dpd_history.map((h) => Number(h.days) || 0),
      );
      a.dpd_delay_count = a.dpd_history.filter(
        (h) => (Number(h.days) || 0) > 0,
      ).length;
      a.dpd_history_formatted = a.dpd_history
        .map((h) => `${(h.month || "").toLowerCase()} - ${h.days}`)
        .join(", ");
    }
  }

  const dpd_max =
    accounts.reduce((m, a) => Math.max(m, Number(a.dpd_max) || 0), 0) ||
    undefined;
  const adverse_flags = Array.from(
    new Set(
      accounts
        .flatMap((a) => (Array.isArray(a.adverse_flags) ? a.adverse_flags : []))
        .filter(Boolean),
    ),
  );

  // Deduplicate enquiry_details by member+date
  const seenEnq = new Set();
  const dedupedEnq = [];
  for (const e of enquiry_details) {
    const normMember = normalizeLenderName(e.member || "")
      .replace(/[^A-Z0-9]/gi, "")
      .toUpperCase()
      .replace(/FINANCE|BANK|LTD|LIMITED|FINANCECORP/gi, "");
    let normDate = "";
    if (e.date) {
      const parsed = parseDate(e.date);
      if (parsed) normDate = parsed.replace(/-/g, "");
      else normDate = (e.date || "").replace(/[^0-9]/g, "");
    }
    const key = `${normMember}|${normDate}`;
    if (!seenEnq.has(key)) {
      seenEnq.add(key);
      dedupedEnq.push(e);
    }
  }
  enquiry_details.length = 0;
  enquiry_details.push(...dedupedEnq);

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
  const score =
    cibil && Number.isFinite(Number(cibil.score))
      ? Number(cibil.score)
      : undefined;
  const dpdMax =
    cibil && Number.isFinite(Number(cibil.dpd_max)) ? Number(cibil.dpd_max) : 0;
  const bounceCount = (bankAnalysis.bounce_charges || []).length;
  const monthKey = (dateStr) => {
    if (!dateStr) return "";
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
  const salaryByMonth = sumByMonth(bankAnalysis.salary || [], "amount");
  const emiByMonth = sumByMonth(
    bankAnalysis.emi_payments || bankAnalysis.loans || [],
    "emi_amount",
  );
  const rentByMonth = sumByMonth(bankAnalysis.rent || [], "amount");
  const apyByMonth = sumByMonth(bankAnalysis.apy_pension || [], "amount");
  const appRepayByMonth = sumByMonth(
    (bankAnalysis.app_loans || []).filter(
      (x) => (x.type || "").toLowerCase() === "repayment",
    ),
    "amount",
  );
  const ccByMonth = sumByMonth(
    bankAnalysis.credit_card_payments || [],
    "amount",
  );
  const months = Object.keys(salaryByMonth).sort();
  const salaryMonths = months.filter((m) => (salaryByMonth[m] || 0) > 0);
  const avgSalary = salaryMonths.length
    ? salaryMonths.reduce((s, m) => s + (salaryByMonth[m] || 0), 0) /
    salaryMonths.length
    : 0;
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
  const obligations =
    monthlyEmi + monthlyRent + monthlyApy + monthlyApp + monthlyCc;
  const foir = avgSalary > 0 ? obligations / avgSalary : undefined;
  const reasons = [];
  let decision = "Needs Review";
  if (score !== undefined) {
    if (score < 650) reasons.push(`Low CIBIL score (${score})`);
    else if (score >= 750) reasons.push(`Strong CIBIL score (${score})`);
    else reasons.push(`Moderate CIBIL score (${score})`);
  } else {
    reasons.push("CIBIL score not detected in report text");
  }
  if (dpdMax >= 30) reasons.push(`Delinquency detected (DPD max ${dpdMax})`);
  if (bounceCount > 0)
    reasons.push(`${bounceCount} bounce/return charge(s) in statement`);
  if (foir !== undefined)
    reasons.push(
      `FOIR (fixed obligations / income) ~ ${(foir * 100).toFixed(0)}%`,
    );
  if (score !== undefined && score < 650) decision = "Unlikely";
  else if (dpdMax >= 30) decision = "Unlikely";
  else if (foir !== undefined && foir > 0.6) decision = "Unlikely";
  else if (
    score !== undefined &&
    score >= 750 &&
    foir !== undefined &&
    foir <= 0.5 &&
    dpdMax < 30
  )
    decision = "Likely Eligible";
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
  const score =
    cibil && Number.isFinite(Number(cibil.score))
      ? Number(cibil.score)
      : undefined;
  const dpdMax =
    cibil && Number.isFinite(Number(cibil.dpd_max)) ? Number(cibil.dpd_max) : 0;
  const accounts = Array.isArray(cibil?.accounts) ? cibil.accounts : [];
  const enquiries = cibil?.enquiries || {};
  const recentEnq =
    Number(
      enquiries.last_30d ?? enquiries.last_60d ?? enquiries.last_90d ?? 0,
    ) || 0;
  const norm = (s) =>
    (s || "")
      .toString()
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const isActive = (a) => {
    const st = norm(a?.account_status);
    if (!st) return true;
    if (
      /\bCLOSED|SETTLED|WRITTEN\s*OFF|CHARGEOFF|CHARGE\s*OFF|SUIT\s*FILED\b/.test(
        st,
      )
    )
      return false;
    return true;
  };
  const classify = (a) => {
    const t = norm(a?.account_type);
    if (!t) return "UNKNOWN";
    if (/\bCREDIT\s*CARD\b|\bCARD\b/.test(t)) return "CREDIT_CARD";
    if (/\bHOME\b|\bHOUSING\b|\bMORTGAGE\b|\bHFL\b/.test(t)) return "SECURED";
    if (/\bAUTO\b|\bCAR\b|\bVEHICLE\b|\bTWO\b/.test(t)) return "SECURED";
    if (/\bGOLD\b/.test(t)) return "SECURED";
    if (/\bPERSONAL\b|\bCONSUMER\b|\bUNSECURED\b/.test(t)) return "UNSECURED";
    if (/\bBUSINESS\b|\bMSME\b|\bSME\b|\bTERM\b|\bWORKING\b/.test(t))
      return "BUSINESS";
    return "OTHER";
  };
  const active = accounts.filter(isActive);
  const unsecured = active.filter((a) => classify(a) === "UNSECURED");
  const creditCards = active.filter((a) => classify(a) === "CREDIT_CARD");
  let hasSevere = false;
  for (const a of accounts) {
    const flags = Array.isArray(a.adverse_flags) ? a.adverse_flags : [];
    if (
      flags.includes("WRITTEN_OFF") ||
      flags.includes("SETTLED") ||
      flags.includes("SUIT_FILED") ||
      flags.includes("WILFUL_DEFAULT") ||
      flags.includes("LOSS")
    ) {
      hasSevere = true;
      break;
    }
  }
  const ccUtil = (() => {
    let bal = 0,
      lim = 0;
    for (const a of creditCards) {
      bal += Number(a.current_balance) || 0;
      lim += Number(a.credit_limit) || 0;
    }
    if (!lim) return undefined;
    const u = bal / lim;
    return Number.isFinite(u) ? Number(u.toFixed(4)) : undefined;
  })();
  const bounceCount = (bankAnalysis?.bounce_charges || []).length;
  const eligibility =
    bankAnalysis && cibil ? assessEligibility(bankAnalysis, cibil) : undefined;
  const foir = eligibility?.foir,
    avgIncome = eligibility?.avg_monthly_income,
    avgObl = eligibility?.avg_monthly_obligations;
  const policy_flags = [];
  if (score !== undefined && score < 650) policy_flags.push("LOW_SCORE");
  if (score !== undefined && score >= 800) policy_flags.push("EXCELLENT_SCORE");
  if (dpdMax >= 30) policy_flags.push("DPD_30_PLUS");
  if (hasSevere) policy_flags.push("SEVERE_DEROGATORY");
  if (recentEnq >= 6) policy_flags.push("HIGH_ENQUIRIES");
  if (ccUtil !== undefined && ccUtil > 0.8)
    policy_flags.push("HIGH_CC_UTILIZATION");
  if (bounceCount >= 2) policy_flags.push("MULTIPLE_BOUNCES");
  if (foir !== undefined && foir > 0.6) policy_flags.push("HIGH_FOIR");
  const maxFoir =
    score === undefined
      ? undefined
      : score >= 780
        ? 0.6
        : score >= 720
          ? 0.55
          : score >= 680
            ? 0.5
            : 0.45;
  const maxEmi =
    avgIncome !== undefined && maxFoir !== undefined
      ? Math.max(0, avgIncome * maxFoir - (avgObl || 0))
      : undefined;
  const grade = (() => {
    if (hasSevere || dpdMax >= 30) return "D";
    if (score === undefined) return "C";
    if (
      score >= 780 &&
      (ccUtil === undefined || ccUtil <= 0.6) &&
      recentEnq <= 3
    )
      return "A";
    if (score >= 720) return "B";
    if (score >= 650) return "C";
    return "D";
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
    additional_emi_capacity:
      maxEmi !== undefined ? Number(maxEmi.toFixed(2)) : undefined,
    policy_flags,
    product_eligibility: [
      product("PL", "Personal Loan", 720, false),
      product("HL", "Home Loan", 700, false),
      product("BL", "Business Loan", 700, false),
      product("VL", "Vehicle Loan", 680, false),
      product("CC", "Credit Card", 720, false),
    ],
  };
}

module.exports = {
  parseCibilText,
  assessUnderwriting,
  assessEligibility,
  normalizeLenderName,
  preprocessCibilText,
  parsePaisabazaarSummary,
  detectCibilSource,
  isJunkLenderName,
};
