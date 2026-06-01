# Project Analysis — Bank Statement Analyzer v2.0 (Rule-based)

## 1) Overview
This repo is a **local, rule-based** bank statement analyzer for Indian bank statements.

- **Backend**: Express API that parses uploaded statements (PDF/CSV/XLSX/TXT), runs a rule-based categorizer, and returns structured results.
- **Frontend**: React + Vite UI that uploads statements, displays detected categories in dashboard tabs, and triggers exports.

## 2) Tech stack
### Backend (server/)
- Node.js + Express
- Parsing & utilities:
  - `pdf-parse` (PDF text extraction)
  - `pdfjs-dist` (PDFjs-based fallback text extraction)
  - Optional OCR path using `ocrmypdf` / `tesseract` (via `parser.js`)
  - `csv-parse` (CSV)
  - `xlsx` (XLS/XLSX)
- Delivery:
  - Multipart uploads via `multer`

Key server files:
- `server/index.js`: Express routes + file upload pipeline
- `server/parser.js`: universal parser for PDFs/CSVs/XLSXs/TXT
- `server/analyzer.js`: main rule-based engine and transaction classification

### Frontend (client/)
- React + Vite
- UI components under `client/src/components/`
- Charts with `recharts`
- PDF.js dependency is present for client-side highlight/viewer features

Key client files:
- `client/src/App.jsx`: orchestrates upload/analyze flows and routes to Dashboard
- `client/src/components/*`: dashboard tabs and result views

## 3) Repository structure
```
bank-analyzer/
├─ client/
│  └─ src/
│     ├─ App.jsx
│     ├─ main.jsx
│     └─ components/
│        ├─ Dashboard.jsx
│        ├─ UploadZone.jsx
│        ├─ OverviewTab.jsx
│        ├─ CreditsTab.jsx
│        ├─ LoansTab.jsx
│        ├─ ...
├─ server/
│  ├─ index.js
│  ├─ parser.js
│  ├─ analyzer.js
│  └─ uploads/           (example inputs / test files)
└─ README.md
```

## 4) Backend flow (end-to-end)
### A) Upload & API entrypoint
Route: **POST** `/api/analyze`

In `server/index.js`:
1. `multer` stores file in `server/uploads/`.
2. `parseFile(filePath, originalName)` extracts structured transactions.
3. `analyzeTransactions(transactions)` categorizes everything into sections.
4. Response includes:
   - `extraction` metadata
   - `analysis` categorized output
   - transaction counts
5. Uploaded temp file is removed in a `finally` block.

### B) Parser responsibilities (`server/parser.js`)
Handles **all input formats**:
- **PDF**:
  - classifies pages via `pdfjs-dist` text-item counts to decide if OCR may be needed
  - tries `pdf-parse` first, then `pdfjs-dist` fallback, then OCR fallback
  - throws specific coded errors when parsing fails (e.g., scanned-only PDFs)
- **CSV/XLSX**:
  - normalizes column names into common fields: `date`, `description`, `debit`, `credit`, `balance`
- **TXT**:
  - uses narrative/table text parsing logic

### C) Rule-based analysis (`server/analyzer.js`)
Main export: `analyzeTransactions(transactions)`

1. Sorts transactions by date.
2. Computes account summary (credits, debits, net balance, period).
3. Iterates each transaction and runs detectors on `description/narration` and amounts.
4. Builds category arrays:
   - `salary`
   - `pf_epfo`
   - `loan_disbursements`
   - `emi_payments` (+ legacy alias `loans`)
   - `rent`
   - `sip_investments`
   - `insurance`
   - `app_loans`
   - `credit_card_payments`
   - `utilities`, `stock_market`, `apy_pension`, `govt_scheme_credits`, etc.
5. Links **processing fees** to disbursements when both occur within the same month (or within ~7 days).
6. Computes `insights`:
   - avg monthly salary
   - total EMI monthly
   - obligation-to-income ratio
   - savings rate
7. Generates `risk_flags` and `recommendations` using heuristic thresholds.
8. Produces `loan_summary` keyed by lender.

## 5) Classification rules (what gets detected)
Detection is driven by **regex dictionaries and keyword lists**:
- Loan type inference:
  - `LOAN_TYPE_MAP` maps patterns to HL/LAP/VL/EL/BL/GL/CDL/AL/OD/PL, etc.
- Lender identification:
  - `LENDER_PATTERNS` includes many Indian PSBs/Pvts/NBFCs/HFCs and fintech lenders.
- Salary identification:
  - keyword-based detection plus NACH/NEFT/IMPS/RTGS logic
  - employer inference from `SALARY_SOURCE_MAP` and NACH token patterns
- NACH/autodebit detection:
  - `NACH_PATTERNS`
- Loan EMI repayment:
  - requires NACH + EMI keywords or patterns for known lenders
  - captures loan metadata (lender, loan type, loan account masked, UTR/RRN/mandate where available)
- Loan disbursement:
  - detects disbursement keywords on credit side (DISB/DISBURSE/LOAN CREDIT/PROCEED/SANCTION)
  - or known NBFC/HFC high-credit patterns
- Rent:
  - keyword list (`RENT_KEYWORDS`) typically present in descriptions
- SIP / MF:
  - detects mutual fund transaction platforms (Groww, Zerodha, CAMS, Paytm Money, etc.)
- Insurance:
  - detects providers and types via `INSURANCE_PATTERNS`
- App loans:
  - detects lenders/apps via `APP_LOAN_PATTERNS`
- Credit card payments:
  - scoring-based classifier + metadata extraction (platform/channel/issuer, last4)
- Bounce/charges:
  - detects return/unpaid/penalty keywords; classifies channel (NACH/ECS/ACH/SI/Cheque)

## 6) API endpoints summary
From `server/index.js`:
- **GET** `/api/health`
  - returns `{status:'ok', mode:'rule-based', version:'2.0'}`

- **POST** `/api/analyze`
  - multipart/form-data field: `statement`
  - returns: `{ success, filename, transaction_count, extraction, analysis }`

- **POST** `/api/analyze-cibil`
  - multipart/form-data field: `cibil`, optional `cibil_password`
  - returns: CIBIL parsing + underwriting assessment

- **POST** `/api/analyze-text`
  - JSON body: `{ "text": "..." }`
  - returns analysis for pasted transaction text

- **POST** `/api/export-summary?format=xlsx|csv`
  - expects `analysis` payload in body; generates workbook or single CSV

- **POST** `/api/export-cibil?format=xlsx|csv`
  - expects `analysis.cibil` payload and creates CIBIL export

- **POST** `/api/parse-only`
  - debug: returns raw parsed transaction sample + extraction metadata

- **POST** `/api/debug-pdf-text`
  - debug: extracts PDF text (pdf-parse + parser paths) and returns parsed counts

## 7) Frontend responsibilities
`client/src/App.jsx` orchestrates:
- modes:
  - `statement` (default)
  - `cibil`
- upload interactions:
  - calls `/api/analyze` with multipart statement
  - calls `/api/analyze-cibil` with multipart CIBIL
  - calls `/api/analyze-text` for pasted text
- renders:
  - `UploadZone` when no result
  - `Dashboard` once analysis is returned

Dashboard tabs map directly onto analyzer outputs (salary/loans/investments/transfers/monthly/insights, etc.).

## 8) Key data model (implicit contract)
The UI expects `analysis` to include:
- category arrays (each with `date`, `description`, `amount` and sometimes metadata)
- `monthly_summary` keyed by month
- `insights` fields:
  - obligation-to-income ratio
  - savings rate
  - risk_flags
  - recommendations

Additionally, the analyzer keeps legacy aliases for backward compatibility:
- `emi_payments` is also exposed as `loans`
- `pf_epfo` is also exposed as `pf_credits`

## 9) Reliability & performance notes (observed from code)
- Parsing pipeline uses **multi-stage fallbacks** for PDFs:
  1. classify page text density
  2. `pdf-parse` + `pagerender`
  3. pdfjs extraction
  4. OCR fallback (which depends on Ghostscript/Tesseract on Windows)
- Analyzer is fully offline and deterministic: purely regex/heuristic-based.
- Export routes compute totals and reshape outputs for XLSX/CSV.

## 10) What’s already solid
- Strong separation of concerns:
  - parser vs analyzer vs server routing
- Many lender/app/platform patterns already included.
- Extra metadata extraction for transaction identifiers.
- Debug endpoints exist to troubleshoot extraction quality.

## 11) Suggested next documentation improvements (optional)
If you want this analysis doc to be even more useful, add:
- a **sample `analysis` JSON schema** (one real example)
- a **mapping table**: detector → analyzer output field → UI tab
- a troubleshooting section: common upload failures and how to use debug endpoints.

