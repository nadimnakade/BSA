const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parseFile } = require('./parser');
const { analyzeTransactions, parseCibilText, assessUnderwriting } = require('./analyzer');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use((req, res, next) => { res.setTimeout(0); next(); });

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.csv', '.xlsx', '.xls', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext) ? cb(null, true) : cb(new Error(`Only ${allowed.join(', ')} allowed`));
  }
});

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

const normStr = (v) => (v ?? '').toString().trim();

async function extractPdfTextPdfjs(buffer, password) {
  const p = normStr(password);
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const data = Buffer.isBuffer(buffer)
      ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
      : buffer;
    const loadingTask = pdfjs.getDocument({ data, password: p || undefined, disableWorker: true });
    const doc = await loadingTask.promise;
    let out = '';
    const pageCount = doc.numPages || 0;
    for (let i = 1; i <= pageCount; i++) {
      const page = await doc.getPage(i);
      const tc = await page.getTextContent();
      out += (tc.items || []).map(it => it.str).join(' ') + '\n';
    }
    try { await doc.destroy(); } catch {}
    return out;
  } catch (e) {
    const msg = (e?.message || '').toString();
    const name = (e?.name || '').toString();
    const isPassword = /password/i.test(msg) || /password/i.test(name) || /encrypted/i.test(msg);
    const isWrongPassword = /incorrect password/i.test(msg) || /wrong password/i.test(msg);
    if (isWrongPassword) throw new Error('Incorrect CIBIL PDF password. Please re-check and try again.');
    if (isPassword && !p) throw new Error('CIBIL PDF is password-protected. Please enter the PDF password and re-upload.');
    throw new Error(msg || 'Failed to read PDF text');
  }
}

async function extractCibilText(filePath, originalName, password) {
  const ext = path.extname(originalName).toLowerCase();
  if (ext === '.txt') return fs.readFileSync(filePath, 'utf-8');
  const buffer = fs.readFileSync(filePath);
  try {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    const text = data.text || '';
    if (text.trim().length > 20) return text;
  } catch (e) {
    const msg = (e?.message || '').toString();
    const isPassword = /password/i.test(msg) || /encrypted/i.test(msg);
    if (!isPassword && !normStr(password)) throw e;
  }
  return extractPdfTextPdfjs(buffer, password);
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', mode: 'rule-based', version: '2.0' }));

// --- FILE UPLOAD ANALYZE ---
app.post('/api/analyze', upload.single('statement'), async (req, res) => {
  const statementFile = req.file;
  const filePath = statementFile?.path;
  try {
    if (!statementFile) return res.status(400).json({ error: 'No statement file uploaded' });
    console.log(`\n[Analyze] ${statementFile.originalname} (${(statementFile.size/1024).toFixed(1)} KB)`);

    const transactions = await parseFile(filePath, statementFile.originalname);
    console.log(`[Parse] Extracted ${transactions.length} transactions`);

    if (!transactions.length) {
      const ext = path.extname(statementFile.originalname).toLowerCase();
      if (ext === '.pdf') {
        try {
          const pdfParse = require('pdf-parse');
          const buffer = fs.readFileSync(filePath);
          const data = await pdfParse(buffer);
          const text = data.text || '';
          if (text.trim().length < 50) {
            return res.status(400).json({ error: 'No extractable text found in this PDF. If it is a scanned/image PDF, export CSV/XLSX from netbanking or use a text-based PDF.' });
          }
        } catch {}
      }
      return res.status(400).json({ error: 'No transactions found. Try /api/debug-pdf-text (PDF) or /api/parse-only to see what was extracted.' });
    }

    const analysis = analyzeTransactions(transactions);

    console.log(`[Analyze] Done — ${transactions.length} txns, salary: ${analysis.salary.length}, loans: ${analysis.loans.length}`);

    res.json({ success: true, filename: statementFile.originalname, transaction_count: transactions.length, analysis });
  } catch (err) {
    console.error('[Error]', err.message);
    if (['PDF_SCANNED', 'PDF_PARSE_NO_ROWS', 'OCR_NOT_AVAILABLE', 'OCR_TIMEOUT', 'OCR_FAILED', 'PDF_PASSWORD'].includes(err?.code)) {
      return res.status(400).json({ error: err.message, error_code: err.code });
    }
    res.status(500).json({ error: err.message });
  } finally {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
});

app.post('/api/analyze-cibil', upload.single('cibil'), async (req, res) => {
  const filePath = req.file?.path;
  const cibilPassword = normStr(req.body?.cibil_password);
  try {
    if (!req.file) return res.status(400).json({ error: 'No CIBIL file uploaded' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext !== '.pdf' && ext !== '.txt') return res.status(400).json({ error: 'CIBIL report must be PDF or TXT' });

    const cibilText = await extractCibilText(filePath, req.file.originalname, cibilPassword);

    const cibil = parseCibilText(cibilText);
    const analysis = analyzeTransactions([]);
    analysis.cibil = { filename: req.file.originalname, ...cibil };
    analysis.underwriting = assessUnderwriting(analysis, analysis.cibil);

    res.json({ success: true, filename: req.file.originalname, transaction_count: 0, analysis });
  } catch (err) {
    const msg = (err?.message || 'Failed to parse CIBIL report').toString();
    if (/password/i.test(msg) || /CIBIL/i.test(msg)) return res.status(400).json({ error: msg });
    res.status(500).json({ error: msg });
  } finally {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
});

// --- TEXT PASTE ANALYZE ---
app.post('/api/analyze-text', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length < 30) return res.status(400).json({ error: 'Text too short' });

    const { parseText } = require('./parser');
    const transactions = parseText(text);
    console.log(`[Text] Extracted ${transactions.length} transactions`);

    if (!transactions.length) {
      return res.status(400).json({ error: 'No transactions found in pasted text.' });
    }

    const analysis = analyzeTransactions(transactions);
    res.json({ success: true, filename: 'Pasted Text', transaction_count: transactions.length, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/export-summary', async (req, res) => {
  try {
    const format = (req.query.format || 'xlsx').toString().toLowerCase();
    const { analysis, filename } = req.body || {};
    if (!analysis) return res.status(400).json({ error: 'Missing analysis' });

    const safeBase = (filename || 'statement')
      .toString()
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[^a-z0-9\-_ ]/gi, '')
      .trim()
      .slice(0, 60) || 'statement';

    const as = analysis.account_summary || {};
    const salaryTotal = (analysis.salary || []).reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const pfTotal = (analysis.pf_credits || []).reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const emiTotal = (analysis.loans || []).reduce((s, x) => s + (Number(x.emi_amount) || 0), 0);
    const disbTotal = (analysis.loan_disbursements || []).reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const ccTotal = (analysis.credit_card_payments || []).reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const apyTotal = (analysis.apy_pension || []).reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const rentTotal = (analysis.rent || []).reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const appLoanTotal = (analysis.app_loans || []).reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const totalObligations = emiTotal + apyTotal + ccTotal + rentTotal + appLoanTotal;

    const summaryRows = [
      ['Report', 'Bank Statement Analyzer v2'],
      ['Generated At', new Date().toISOString()],
      ['Filename', filename || '—'],
      ['Period', as.period || '—'],
      ['Transaction Count', as.transaction_count ?? '—'],
      ['Total Credits', as.total_credits ?? 0],
      ['Total Debits', as.total_debits ?? 0],
      ['Net Balance', as.net_balance ?? 0],
      ['Salary Total', salaryTotal],
      ['PF/EPFO Total', pfTotal],
      ['EMI Total', emiTotal],
      ['APY Pension Total', apyTotal],
      ['Rent Total', rentTotal],
      ['App Loan Payments Total', appLoanTotal],
      ['Total Obligations', totalObligations],
      ['Loan Disbursement Total', disbTotal],
      ['Credit Card Payments Total', ccTotal],
    ];

    const ins = analysis.insights || {};
    const insightsRows = [
      ['Avg Monthly Salary', ins.avg_monthly_salary ?? 0],
      ['Total EMI Monthly', ins.total_emi_monthly ?? 0],
      ['Obligation-to-Income Ratio (%)', ins.obligation_to_income_ratio ?? 0],
      ['Savings Rate (%)', ins.savings_rate ?? 0],
    ];

    const riskFlags = Array.isArray(ins.risk_flags) ? ins.risk_flags : [];
    const recs = Array.isArray(ins.recommendations) ? ins.recommendations : [];
    const obligations = [
      ...(analysis.loans || []).map(x => ({
        date: x.date || '',
        category: 'EMI',
        party: x.bank || '',
        loan_type: x.type || '',
        amount: Number(x.emi_amount) || 0,
        description: x.description || '',
      })),
      ...(analysis.apy_pension || []).map(x => ({
        date: x.date || '',
        category: 'APY',
        party: 'Atal Pension Yojana',
        loan_type: '',
        amount: Number(x.amount) || 0,
        description: x.description || '',
      })),
      ...(analysis.credit_card_payments || []).map(x => ({
        date: x.date || '',
        category: 'Credit Card',
        party: '',
        loan_type: '',
        amount: Number(x.amount) || 0,
        description: x.description || '',
      })),
      ...(analysis.rent || []).map(x => ({
        date: x.date || '',
        category: 'Rent',
        party: x.payee || '',
        loan_type: '',
        amount: Number(x.amount) || 0,
        description: x.description || '',
      })),
      ...(analysis.app_loans || []).map(x => ({
        date: x.date || '',
        category: (x.type || '').toLowerCase() === 'credit' ? 'App Loan Credit' : 'App Loan Repayment',
        party: x.app_name || '',
        loan_type: '',
        amount: Number(x.amount) || 0,
        description: x.description || '',
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const monthKey = (dateStr) => {
      if (!dateStr) return 'Unknown';
      const d = new Date(dateStr);
      if (isNaN(d)) return dateStr.toString().slice(0, 7);
      return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    };

    const sumByMonth = (items, getAmount, filterFn) => {
      const out = {};
      for (const it of items || []) {
        if (filterFn && !filterFn(it)) continue;
        const m = monthKey(it.date || '');
        out[m] = (out[m] || 0) + (Number(getAmount(it)) || 0);
      }
      return out;
    };

    const ms = analysis.monthly_summary || {};
    const ccByMonth = sumByMonth(analysis.credit_card_payments, x => x.amount);
    const rentByMonth = sumByMonth(analysis.rent, x => x.amount);
    const appRepayByMonth = sumByMonth(analysis.app_loans, x => x.amount, x => (x.type || '').toLowerCase() === 'repayment');
    const appCreditByMonth = sumByMonth(analysis.app_loans, x => x.amount, x => (x.type || '').toLowerCase() === 'credit');

    const monthlyRows = Object.keys(ms).map(m => {
      const r = ms[m] || {};
      const credits = Number(r.credits) || 0;
      const debits = Number(r.debits) || 0;
      const salary = Number(r.salary) || 0;
      const emi = Number(r.emi) || 0;
      const apy = Number(r.apy) || 0;
      const transfers_out = Number(r.transfers_out) || 0;
      const transfers_in = Number(r.transfers_in) || 0;
      const closing_balance = Number(r.closing_balance) || 0;
      const cc_payments = ccByMonth[m] || 0;
      const rent = rentByMonth[m] || 0;
      const app_loan_repayments = appRepayByMonth[m] || 0;
      const app_loan_credits = appCreditByMonth[m] || 0;
      const surplus = credits - debits;
      const obligations_core = emi + apy;
      const obligations_total = obligations_core + cc_payments + rent + app_loan_repayments;

      return {
        month: m,
        credits,
        debits,
        surplus,
        salary,
        emi,
        apy,
        credit_card_payments: cc_payments,
        rent,
        app_loan_repayments,
        app_loan_credits,
        obligations_core,
        obligations_total,
        transfers_out,
        transfers_in,
        closing_balance
      };
    });

    if (format === 'csv') {
      const esc = (v) => {
        const s = (v ?? '').toString();
        if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
      };

      const lines = [];
      lines.push('Summary');
      lines.push('Field,Value');
      for (const [k, v] of summaryRows) lines.push(`${esc(k)},${esc(v)}`);
      lines.push('');
      lines.push('Insights');
      lines.push('Field,Value');
      for (const [k, v] of insightsRows) lines.push(`${esc(k)},${esc(v)}`);
      lines.push('');
      lines.push('Risk Flags');
      lines.push('Item');
      for (const r of riskFlags) lines.push(`${esc(r)}`);
      lines.push('');
      lines.push('Recommendations');
      lines.push('Item');
      for (const r of recs) lines.push(`${esc(r)}`);
      lines.push('');
      lines.push('Obligations');
      lines.push('Date,Category,Party,Loan Type,Amount,Description');
      for (const o of obligations) {
        lines.push(`${esc(o.date)},${esc(o.category)},${esc(o.party)},${esc(o.loan_type)},${esc(o.amount)},${esc(o.description)}`);
      }
      lines.push('');
      lines.push('Monthly Summary');
      lines.push('Month,Credits,Debits,Surplus,Salary,EMI,APY,Credit Card Payments,Rent,App Loan Repayments,App Loan Credits,Obligations Core,Obligations Total,Transfers Out,Transfers In,Closing Balance');
      for (const r of monthlyRows) {
        lines.push([
          esc(r.month), esc(r.credits), esc(r.debits), esc(r.surplus), esc(r.salary), esc(r.emi), esc(r.apy),
          esc(r.credit_card_payments), esc(r.rent), esc(r.app_loan_repayments), esc(r.app_loan_credits),
          esc(r.obligations_core), esc(r.obligations_total), esc(r.transfers_out), esc(r.transfers_in), esc(r.closing_balance)
        ].join(','));
      }

      const csv = lines.join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${safeBase}-summary-insights.csv"`);
      return res.send(csv);
    }

    const XLSX = require('xlsx');
    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.aoa_to_sheet([['Field', 'Value'], ...summaryRows]);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    const wsInsights = XLSX.utils.aoa_to_sheet([
      ['Field', 'Value'],
      ...insightsRows,
      [],
      ['Risk Flags'],
      ...riskFlags.map(x => [x]),
      [],
      ['Recommendations'],
      ...recs.map(x => [x]),
    ]);
    XLSX.utils.book_append_sheet(wb, wsInsights, 'Insights');

    const wsObl = XLSX.utils.json_to_sheet(obligations, {
      header: ['date', 'category', 'party', 'loan_type', 'amount', 'description']
    });
    XLSX.utils.book_append_sheet(wb, wsObl, 'Obligations');

    const wsMonthly = XLSX.utils.json_to_sheet(monthlyRows, {
      header: [
        'month', 'credits', 'debits', 'surplus', 'salary', 'emi', 'apy',
        'credit_card_payments', 'rent', 'app_loan_repayments', 'app_loan_credits',
        'obligations_core', 'obligations_total', 'transfers_out', 'transfers_in', 'closing_balance'
      ]
    });
    XLSX.utils.book_append_sheet(wb, wsMonthly, 'Monthly');

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${safeBase}-summary-insights.xlsx"`);
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/export-cibil', async (req, res) => {
  try {
    const format = (req.query.format || 'xlsx').toString().toLowerCase();
    const { analysis, filename } = req.body || {};
    const cibil = analysis?.cibil || null;
    if (!cibil || cibil.error) return res.status(400).json({ error: cibil?.error || 'Missing CIBIL analysis' });

    const safeBase = (filename || cibil.filename || 'cibil')
      .toString()
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[^a-z0-9\-_ ]/gi, '')
      .trim()
      .slice(0, 60) || 'cibil';

    const personal = cibil.personal || {};
    const enquiries = cibil.enquiries || {};
    const enquiryDetails = Array.isArray(cibil.enquiry_details) ? cibil.enquiry_details : [];
    const accounts = Array.isArray(cibil.accounts) ? cibil.accounts : [];
    const adverse = Array.isArray(cibil.adverse_flags) ? cibil.adverse_flags : [];

    const summaryRows = [
      ['Report', 'CIBIL Analyzer'],
      ['Generated At', new Date().toISOString()],
      ['Filename', cibil.filename || filename || '—'],
      ['Report Date', cibil.report_date || '—'],
      ['CIBIL Score', cibil.score ?? '—'],
      ['DPD Max', cibil.dpd_max ?? '—'],
      ['Accounts Detected', accounts.length],
      ['Enquiries Total', enquiries.total ?? '—'],
    ];

    const personalRows = [
      ['Name', personal.name || '—'],
      ['DOB', personal.dob || '—'],
      ['Gender', personal.gender || '—'],
      ['PAN', personal.pan || '—'],
      ['Mobile', personal.mobile || '—'],
      ['Email', personal.email || '—'],
      ['Company', personal.company || '—'],
    ];

    const activeLoans = accounts.map(a => ({
      lender: a.lender || '',
      account_type: a.account_type || '',
      account_status: a.account_status || '',
      opened_date: a.opened_date || '',
      closed_date: a.closed_date || '',
      emi: Number(a.emi) || 0,
      loan_amount: Number(a.sanctioned_amount) || 0,
      high_credit: Number(a.high_credit) || 0,
      credit_limit: Number(a.credit_limit) || 0,
      remaining_balance: Number(a.current_balance) || 0,
      overdue_amount: Number(a.overdue_amount) || 0,
      dpd_max: a.dpd_max ?? '',
      adverse_flags: Array.isArray(a.adverse_flags) ? a.adverse_flags.join('|') : '',
    }));

    const enquiriesRows = enquiryDetails.map(e => ({
      date: e.date || '',
      member: e.member || '',
      purpose: e.purpose || '',
      amount: Number(e.amount) || 0,
      raw: e.raw || '',
    }));

    if (format === 'csv') {
      const esc = (v) => {
        const s = (v ?? '').toString();
        if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
      };

      const lines = [];
      lines.push('Summary');
      lines.push('Field,Value');
      for (const [k, v] of summaryRows) lines.push(`${esc(k)},${esc(v)}`);
      lines.push('');
      lines.push('Personal Information');
      lines.push('Field,Value');
      for (const [k, v] of personalRows) lines.push(`${esc(k)},${esc(v)}`);
      lines.push('');
      lines.push('Addresses');
      lines.push('Address');
      for (const a of (personal.addresses || [])) lines.push(`${esc(a)}`);
      lines.push('');
      lines.push('Adverse Flags');
      lines.push('Flag');
      for (const f of adverse) lines.push(`${esc(f)}`);
      lines.push('');
      lines.push('Active Loans');
      lines.push('Lender,Type,Status,Opened Date,Closed Date,EMI,Loan Amount,High Credit,Credit Limit,Remaining Balance,Overdue Amount,DPD Max,Adverse Flags');
      for (const r of activeLoans) {
        lines.push([
          esc(r.lender), esc(r.account_type), esc(r.account_status), esc(r.opened_date), esc(r.closed_date),
          esc(r.emi), esc(r.loan_amount), esc(r.high_credit), esc(r.credit_limit),
          esc(r.remaining_balance), esc(r.overdue_amount), esc(r.dpd_max), esc(r.adverse_flags)
        ].join(','));
      }
      lines.push('');
      lines.push('Inquiry');
      lines.push('Date,Member,Purpose,Amount,Raw');
      for (const r of enquiriesRows) {
        lines.push([esc(r.date), esc(r.member), esc(r.purpose), esc(r.amount), esc(r.raw)].join(','));
      }

      const csv = lines.join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${safeBase}-cibil.csv"`);
      return res.send(csv);
    }

    const XLSX = require('xlsx');
    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.aoa_to_sheet([['Field', 'Value'], ...summaryRows]);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    const wsPersonal = XLSX.utils.aoa_to_sheet([
      ['Field', 'Value'],
      ...personalRows,
      [],
      ['Addresses'],
      ...(personal.addresses || []).map(x => [x]),
      [],
      ['Adverse Flags'],
      ...adverse.map(x => [x]),
    ]);
    XLSX.utils.book_append_sheet(wb, wsPersonal, 'Personal');

    const wsLoans = XLSX.utils.json_to_sheet(activeLoans, {
      header: [
        'lender', 'account_type', 'account_status', 'opened_date', 'closed_date',
        'emi', 'loan_amount', 'high_credit', 'credit_limit',
        'remaining_balance', 'overdue_amount', 'dpd_max', 'adverse_flags'
      ]
    });
    XLSX.utils.book_append_sheet(wb, wsLoans, 'Active Loans');

    const wsEnq = XLSX.utils.json_to_sheet(enquiriesRows, {
      header: ['date', 'member', 'purpose', 'amount', 'raw']
    });
    XLSX.utils.book_append_sheet(wb, wsEnq, 'Inquiry');

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${safeBase}-cibil.xlsx"`);
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- RAW TRANSACTIONS (for debugging) ---
app.post('/api/parse-only', upload.single('statement'), async (req, res) => {
  const filePath = req.file?.path;
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const transactions = await parseFile(filePath, req.file.originalname);
    res.json({ count: transactions.length, sample: transactions.slice(0, 20) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
});

app.post('/api/debug-pdf-text', upload.single('statement'), async (req, res) => {
  const filePath = req.file?.path;
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext !== '.pdf') return res.status(400).json({ error: 'Only PDF supported for this endpoint' });

    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    const text = data.text || '';

    const { parseText, parseUnionBankText } = require('./parser');
    const txGeneric = parseText(text);
    const txUnion = parseUnionBankText(text);

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    res.json({
      filename: req.file.originalname,
      extracted: { char_count: text.length, line_count: lines.length },
      samples: {
        head: lines.slice(0, 120),
        tail: lines.slice(Math.max(0, lines.length - 60))
      },
      parsed: {
        generic_count: txGeneric.length,
        union_count: txUnion.length,
        generic_sample: txGeneric.slice(0, 5),
        union_sample: txUnion.slice(0, 5)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
});

const server = app.listen(PORT, () => {
  console.log(`\n🏦 Bank Statement Analyzer v2 (Rule-Based — No AI needed)`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   Supports: PDF · CSV · XLSX · TXT\n`);
});
server.keepAliveTimeout = 0;
server.headersTimeout = 0;
