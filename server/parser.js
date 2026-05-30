// ============================================================
// UNIVERSAL BANK STATEMENT PARSER
// Supports: PDF, CSV, XLSX, XLS, TXT
// Extracts structured transaction rows from any format
// ============================================================

const fs = require('fs');
const path = require('path');
const { parseAmount, parseDate } = require('./analyzer');

async function parseFile(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  switch (ext) {
    case '.pdf':  return await parsePDF(filePath);
    case '.csv':  return await parseCSV(filePath);
    case '.xlsx':
    case '.xls':  return await parseXLSX(filePath);
    case '.txt':  return parseText(fs.readFileSync(filePath, 'utf-8'));
    default: throw new Error(`Unsupported file type: ${ext}`);
  }
}

// ---- PDF PARSER ----
// Extracts text then applies row detection heuristics
async function parsePDF(filePath) {
  const pdfParse = require('pdf-parse');
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  const tx1 = parseText(data.text);
  if (tx1.length) return tx1;
  const tx2 = parseUnionBankText(data.text);
  return tx2;
}

// ---- TEXT PARSER ----
// Handles both tabular and narrative bank statement text
function parseText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const transactions = [];

  // Detect column headers
  const headerPatterns = [
    /date/i, /tran.*id/i, /utr/i, /withdrawal|debit/i, /deposit|credit/i, /balance/i, /narr|remark|desc/i
  ];

  let headerLineIdx = -1;
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const matches = headerPatterns.filter(p => p.test(lines[i])).length;
    if (matches >= 3) { headerLineIdx = i; break; }
  }

  // Try structured row extraction
  const dateRegex = /\b(\d{4}-\d{2}-\d{2}|\d{2}[-\/]\d{2}[-\/]\d{2,4}|\d{2}[-\/][A-Za-z]{3}[-\/]\d{2,4}|\d{2}\s+[A-Za-z]{3}\s+\d{2,4})\b/;

  let currentTx = null;

  for (let i = (headerLineIdx >= 0 ? headerLineIdx + 1 : 0); i < lines.length; i++) {
    const line = lines[i];

    // Skip page headers/footers
    if (/page no|statement of account|customer id|account no|branch|micr|ifsc|for any queries/i.test(line)) continue;

    const dateMatch = line.match(dateRegex);

    if (dateMatch) {
      if (currentTx) transactions.push(currentTx);

      // Extract all numbers from line
      const amounts = [];
      let m;
      const re = /[\d][\d,\s]*\.\d{2}/g;
      while ((m = re.exec(line)) !== null) {
        amounts.push(parseAmount(m[0]));
      }

      // Remove date from line to get description
      const desc = line.replace(dateRegex, '').trim();

      // Detect debit/credit/balance from amounts
      // Strategy: last amount is usually balance, second-to-last is the transaction
      let debit = 0, credit = 0, balance = 0;

      if (amounts.length >= 3) {
        balance = amounts[amounts.length - 1];
        // Look for debit or credit markers
        if (/withdrawal|debit|dr\b/i.test(line)) {
          debit = amounts[amounts.length - 2];
        } else if (/deposit|credit|cr\b/i.test(line)) {
          credit = amounts[amounts.length - 2];
        } else {
          // Infer from balance change context later
          debit = amounts[amounts.length - 2];
        }
      } else if (amounts.length === 2) {
        balance = amounts[1];
        debit = amounts[0];
      } else if (amounts.length === 1) {
        balance = amounts[0];
      }

      currentTx = {
        date: parseDate(dateMatch[1]),
        description: desc,
        debit: 0, credit: 0, balance,
        raw: line
      };

    } else if (currentTx) {
      if (currentTx.balance === 0) {
        const amounts = [];
        let m;
        const re = /[\d][\d,\s]*\.\d{2}/g;
        while ((m = re.exec(line)) !== null) amounts.push(parseAmount(m[0]));

        if (amounts.length >= 2) {
          currentTx.balance = amounts[amounts.length - 1] || 0;
          const txAmt = amounts[amounts.length - 2] || 0;
          if (!currentTx.debit && !currentTx.credit && txAmt) currentTx.debit = txAmt;
        }
      }
      // Continuation line (description, UTR, remarks)
      if (!/^\d+$/.test(line) && line.length > 2) {
        currentTx.description = (currentTx.description + ' ' + line).trim();
      }
    }
  }
  if (currentTx) transactions.push(currentTx);

  // Post-process: fill debit/credit using balance deltas
  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const prevBalance = i > 0 ? transactions[i-1].balance : null;

    if (prevBalance !== null && tx.balance !== 0) {
      const delta = tx.balance - prevBalance;
      if (delta > 0) {
        tx.credit = delta;
        tx.debit = 0;
      } else if (delta < 0) {
        tx.debit = Math.abs(delta);
        tx.credit = 0;
      }
    }

    // Clean description
    tx.description = cleanDesc(tx.description || tx.raw || '');
  }

  // Remove invalid rows
  return transactions.filter(t => t.date && (t.debit > 0 || t.credit > 0 || t.balance > 0));
}

// ---- UNION BANK PDF SPECIFIC PARSER ----
// Handles the specific format seen in the uploaded statement
function parseUnionBankText(text) {
  const transactions = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Pattern: DD-MM-YYYY\nHH:MM:SS  then description lines then amounts
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Check if this line is a date
    const dateMatch = line.match(/^(\d{2}[-\/](?:\d{2}|[A-Za-z]{3})[-\/]\d{2,4})/);
    if (dateMatch) {
      const rawDate = dateMatch[1];
      const date = parseDate(rawDate);
      const descLines = [];
      let debit = 0, credit = 0, balance = 0;
      i++;

      // Collect description lines until we hit amounts
      while (i < lines.length) {
        const l = lines[i];
        const nextDateMatch = l.match(/^(\d{2}[-\/](?:\d{2}|[A-Za-z]{3})[-\/]\d{2,4})/);
        if (nextDateMatch) break;

        if (/^\d{2}:\d{2}(:\d{2})?$/.test(l)) {
          i++;
          continue;
        }

        // Extract amounts
        const amounts = [];
        let m;
        const re = /[\d][\d,\s]*\.\d{2}/g;
        while ((m = re.exec(l)) !== null) amounts.push(parseAmount(m[0]));

        if (amounts.length >= 2) {
          balance = amounts[amounts.length - 1] || 0;
          const txAmt = amounts[amounts.length - 2] || 0;
          if (/cr\b|credit/i.test(l)) credit = txAmt;
          else debit = txAmt;
          descLines.push(l.replace(/[\d][\d,\s]*\.\d{2}/g, '').trim());
          i++;
          break;
        }

        if (l && !/^page no\d*/i.test(l)) descLines.push(l);
        i++;
      }

      const description = descLines.join(' ').replace(/\s+/g, ' ').trim();
      if (date && description) {
        transactions.push({ date, description: cleanDesc(description), debit, credit, balance, raw: description });
      }
    } else {
      i++;
    }
  }

  // Fix debit/credit using balance deltas
  for (let j = 0; j < transactions.length; j++) {
    const tx = transactions[j];
    const prev = j > 0 ? transactions[j-1].balance : null;
    if (prev !== null && tx.balance > 0) {
      const delta = tx.balance - prev;
      if (delta > 0) { tx.credit = delta; tx.debit = 0; }
      else if (delta < 0) { tx.debit = Math.abs(delta); tx.credit = 0; }
    }
  }

  return transactions.filter(t => t.date && (t.debit > 0 || t.credit > 0));
}

// ---- CSV PARSER ----
async function parseCSV(filePath) {
  const { parse } = require('csv-parse/sync');
  const content = fs.readFileSync(filePath, 'utf-8');

  let records;
  try {
    records = parse(content, {
      columns: true, skip_empty_lines: true, trim: true,
      relax_quotes: true, relax_column_count: true
    });
  } catch {
    // Try without headers
    records = parse(content, {
      skip_empty_lines: true, trim: true, relax_quotes: true, relax_column_count: true
    });
    if (!records.length) return [];
    // Use first row as headers
    const headers = records[0];
    records = records.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] || ''; });
      return obj;
    });
  }

  return records.map(row => normalizeRow(row)).filter(t => t.date && (t.debit > 0 || t.credit > 0));
}

// ---- XLSX PARSER ----
async function parseXLSX(filePath) {
  const XLSX = require('xlsx');
  const workbook = XLSX.readFile(filePath);
  const allTx = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (rows.length < 2) continue;

    // Find header row
    let headerIdx = 0;
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const row = rows[i].map(c => c.toString().toLowerCase());
      if (row.some(c => c.includes('date')) && row.some(c => c.includes('amount') || c.includes('debit') || c.includes('credit'))) {
        headerIdx = i;
        break;
      }
    }

    const headers = rows[headerIdx].map(c => c.toString().toLowerCase().trim());

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      const obj = {};
      headers.forEach((h, j) => { obj[h] = row[j] !== undefined ? row[j].toString() : ''; });
      const tx = normalizeRow(obj);
      if (tx.date && (tx.debit > 0 || tx.credit > 0)) allTx.push(tx);
    }
  }

  return allTx;
}

// ---- ROW NORMALIZER ----
// Maps various column name conventions to standard fields
function normalizeRow(row) {
  const keys = Object.keys(row);

  const find = (...patterns) => {
    for (const p of patterns) {
      const k = keys.find(k => new RegExp(p, 'i').test(k));
      if (k && row[k] !== undefined && row[k] !== '') return row[k].toString();
    }
    return '';
  };

  const dateRaw = find('date', 'txn.*date', 'tran.*date', 'value.*date', 'posting.*date');
  const desc = find('narr', 'remark', 'desc', 'particular', 'detail', 'transac.*desc', 'tran.*desc', 'memo');
  const debitRaw = find('withdrawal', 'debit', 'dr', 'debit.*amount', 'dr.*amount', 'amount.*dr');
  const creditRaw = find('deposit', 'credit', 'cr', 'credit.*amount', 'cr.*amount', 'amount.*cr');
  const balanceRaw = find('balance', 'closing.*bal', 'avail.*bal', 'running.*bal');
  const amountRaw = find('^amount$', '^amt$', 'amount', 'amt', 'transaction.*amount', 'txn.*amount');

  let debit = parseAmount(debitRaw);
  let credit = parseAmount(creditRaw);

  // If single amount column, check dr/cr indicator
  if (!debit && !credit && amountRaw) {
    const typeCol = find('type', 'dr.*cr', 'cr.*dr', 'tran.*type');
    const typeVal = typeCol.toUpperCase();
    const amt = parseAmount(amountRaw);
    if (typeVal.includes('DR') || typeVal.includes('DEBIT') || typeVal.includes('WD')) debit = Math.abs(amt);
    else if (typeVal.includes('CR') || typeVal.includes('CREDIT') || typeVal.includes('DEP')) credit = Math.abs(amt);
    else if (amt < 0) debit = Math.abs(amt);
    else credit = Math.abs(amt);
  }

  return {
    date: parseDate(dateRaw),
    description: cleanDesc(desc),
    debit,
    credit,
    balance: parseAmount(balanceRaw),
    raw: JSON.stringify(row)
  };
}

function cleanDesc(desc) {
  return desc
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E\u0900-\u097F]/g, '')
    .trim()
    .slice(0, 200);
}

module.exports = { parseFile, parseText, parseUnionBankText, normalizeRow };
