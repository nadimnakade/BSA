# 🏦 Bank Statement Analyzer v2.0
### Rule-Based · No AI · No Cloud · 100% Private · Instant Results

Analyzes Indian bank statements to detect salary, loan EMIs, rent, SIPs, insurance,
app loans, family transfers, APY pension and more — all via pattern matching, no AI needed.

---

## ✅ Prerequisites
- **Node.js** v18+ → https://nodejs.org

That's it. No Ollama. No AI. No API keys.

---

## 🚀 Quick Start (3 steps)

### Step 1 — Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### Step 2 — Start the backend server
```bash
cd server
node index.js
# Runs on http://localhost:5000
```

### Step 3 — Start the frontend
```bash
cd client
npm run dev
# Opens on http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

## 📁 Supported File Formats

| Format | Notes |
|--------|-------|
| **PDF** | Text-based PDFs (Union Bank, HDFC, SBI, ICICI etc.) |
| **CSV** | Transaction exports from net banking portals |
| **XLSX / XLS** | Excel exports from bank portals |
| **TXT** | Plain text transaction data |

---

## 🔍 What Gets Detected

| Category | Details |
|----------|---------|
| 💰 Salary | NACH/NEFT credits, AI Airport, Infosys, TCS etc. |
| 🏦 Loan EMIs | SMFG India Credit, Piramal, HDFC, SBI, Bajaj etc. |
| 🧾 Loan Type | PL / HL / BL / AL / EL / GL inference from standard narration terms |
| 💳 Loan Disbursement | Generic disbursement detection (DISB/DISBUR/LOAN DISB) with loan type |
| 🏠 Rent | Keyword-based detection from UPI/NEFT descriptions |
| 📈 SIP / MF | Groww, Zerodha, CAMS, Paytm Money, direct funds |
| 🛡 Insurance | LIC, HDFC Life, ICICI Pru, SBI Life, PMSBY, PMJJBY |
| 📱 App Loans | KreditBee, LazyPay, Navi, mPokket, CASHe, Finagle, EarlySalary etc. |
| 🔄 Transfers | Family/internal transfers (NISHIKANT pattern detection) |
| 📅 Monthly | Month-by-month cashflow breakdown |
| 🏛 APY Pension | Atal Pension Yojana auto-debits |
| ⚡ Utilities | Electricity, gas, internet, OTT, food delivery |
| 💳 Credit Card | Auto-debit CC payments |
| 🏦 PF Credits | EPFO / Employee Provident Fund credits |
| 💡 Insights | EMI ratio, savings rate, risk flags, recommendations |

---

## 🧭 Dashboard Tabs

The dashboard splits key categories into dedicated tabs:

- Salary
- PF/EPFO
- EMI (with loan type)
- Loan Disbursement (with loan type)
- Credit Card
- Investments, App Loans, Transfers, Monthly, Insights

All tables include search, sort, and filters where applicable.

---

## 📤 Export (XLSX / CSV)

Use the dashboard export buttons to download a single file containing:

- Summary
- Insights (including risk flags + recommendations)
- Obligations (EMI/APY/Rent/App-loan repayments/Credit-card payments)
- Monthly (monthly cashflow + monthly obligations breakdown)

XLSX exports multiple sheets in one workbook. CSV exports sections in one file.

---

## 🧾 Extra Fields (Cross-Bank)

Where present in the statement narration or CSV/XLSX columns, the analyzer attaches extra identifiers to Salary / PF / EMI / Disbursement / Credit Card rows:

- reference_id, txn_id, utr, rrn, cheque_no
- mandate_id, nach_umrn
- loan_account_masked
- lender_raw, lender_normalized
- disbursement_id
- emi_cycle, emi_day
- principal_amount, interest_amount
- processing_fee (heuristic: debits like “processing fee / doc charges / stamp duty” linked near disbursement)

---

## 📦 Project Structure

```
bank-analyzer/
├── server/
│   ├── index.js        ← Express API (file upload + text endpoints)
│   ├── parser.js       ← PDF/CSV/XLSX/TXT parser + row normalizer
│   ├── analyzer.js     ← Rule-based transaction categorizer (main engine)
│   └── package.json
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── main.jsx
│   │   └── components/
│   │       ├── Header.jsx
│   │       ├── UploadZone.jsx
│   │       ├── LoadingScreen.jsx
│   │       ├── Dashboard.jsx
│   │       ├── SummaryCards.jsx
│   │       ├── OverviewTab.jsx      ← Charts
│   │       ├── CreditsTab.jsx       ← Salary + income
│   │       ├── LoansTab.jsx         ← EMIs + APY + CC
│   │       ├── InvestmentsTab.jsx   ← SIPs + Insurance
│   │       ├── AppLoansTab.jsx      ← App loans
│   │       ├── TransfersTab.jsx     ← Family transfers
│   │       ├── MonthlyTab.jsx       ← Monthly cashflow
│   │       └── InsightsTab.jsx      ← Health metrics + flags
│   └── package.json
└── README.md
```

---

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze` | Upload file (multipart/form-data, field: `statement`) |
| POST | `/api/analyze-text` | Paste text `{ "text": "..." }` |
| POST | `/api/parse-only` | Debug: returns raw parsed transactions |
| POST | `/api/debug-pdf-text` | Debug: shows pdf-parse extracted text + parsed sample counts |
| POST | `/api/export-summary?format=xlsx|csv` | Export summary + insights + obligations + monthly in one file |
| GET | `/api/health` | Server health check |

---

## 🛠 Extending the Analyzer

All detection rules are in `server/analyzer.js`. To add a new lender:

```js
// In LOAN_EMI_PATTERNS array:
{ regex: /YOUR_LENDER_NAME/i, bank: 'Your Lender', type: 'personal' }

// In APP_LOAN_PATTERNS array:
{ regex: /YOUR_APP/i, name: 'YourApp' }
```

---

## 🔒 Privacy
- All processing is **100% local** on your machine
- No data is sent anywhere
- Files are deleted immediately after parsing

Built with React + Express + pdf-parse + csv-parse + xlsx
