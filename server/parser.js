// ============================================================
// UNIVERSAL BANK STATEMENT PARSER
// Supports: PDF, CSV, XLSX, XLS, TXT
// Extracts structured transaction rows from any format
// ============================================================

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");
const { parseAmount, parseDate } = require("./analyzer");

const MONEY_RE = /(?:\d{1,3}(?:,\s?\d{2,3})+|\d+)\.\d{2}/g;

function errWithCode(message, code) {
  const e = new Error(message);
  e.code = code;
  return e;
}

function render_page(pageData) {
  const render_options = {
    normalizeWhitespace: false,
    disableCombineTextItems: false,
  };

  return pageData.getTextContent(render_options).then((textContent) => {
    let lastY = null;
    let text = "";
    for (const item of textContent.items || []) {
      const y = item.transform?.[5];
      if (lastY === null || y === lastY) text += `${item.str} `;
      else text += `\n${item.str} `;
      lastY = y;
    }
    return text;
  });
}

async function extractPdfTextPdfjs(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = Buffer.isBuffer(buffer)
    ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    : buffer;
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({ data, disableWorker: true });
  const doc = await loadingTask.promise;
  let out = "";
  const pageCount = doc.numPages || 0;
  for (let i = 1; i <= pageCount; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    out += (tc.items || []).map((it) => it.str).join(" ") + "\n";
  }
  try {
    await doc.destroy();
  } catch {}
  return out;
}

function runExternal(cmd, args, timeoutMs = 300_000) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let killed = false;

    const t = setTimeout(() => {
      killed = true;
      try {
        child.kill("SIGKILL");
      } catch {}
      reject(errWithCode(`${cmd} timed out while doing OCR`, "OCR_TIMEOUT"));
    }, timeoutMs);

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", (e) => {
      clearTimeout(t);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(t);
      if (killed) return;
      resolve({ code: code ?? 0, stdout, stderr });
    });
  });
}

async function extractPdfTextOcr(filePath) {
  const sidecar = `${filePath}.ocr.txt`;
  const outPdf = `${filePath}.ocr.pdf`;
  try {
    try {
      fs.unlinkSync(sidecar);
    } catch {}
    try {
      fs.unlinkSync(outPdf);
    } catch {}

    const args = ["-m", "ocrmypdf", "--skip-text", "--sidecar", sidecar, filePath, outPdf, "--quiet"];
    const r = await runExternal("python", args, 600_000);

    if (r.code === 0 && fs.existsSync(sidecar)) {
      const t = fs.readFileSync(sidecar, "utf-8");
      if ((t || "").trim().length > 50) return t;
    }
    const detail = (r.stderr || r.stdout || "").toString().trim();
    if (/Could not find program 'gswin64c'/i.test(detail) || /ghostscript/i.test(detail)) {
      throw errWithCode(
        "OCR requires Ghostscript on Windows for this method. Install Ghostscript (gswin64c) OR use the fallback OCR path (pypdfium2+tesseract) by keeping tesseract installed. If you can’t install system dependencies, export CSV/XLSX from netbanking.",
        "OCR_NOT_AVAILABLE",
      );
    }
    if (r.code !== 0) {
      const msg = detail ? `OCR failed (ocrmypdf): ${detail.slice(0, 600)}` : "OCR failed (ocrmypdf).";
      throw errWithCode(msg, "OCR_FAILED");
    }
  } catch (e) {
    if (e?.code !== "ENOENT") {
      const msg = (e?.message || "").toString();
      if (/password/i.test(msg) || /encrypted/i.test(msg)) {
        throw errWithCode("This PDF is password-protected. Please upload an unlocked statement PDF or export CSV/XLSX.", "PDF_PASSWORD");
      }
      if (e?.code === "OCR_FAILED") throw e;
      if (e?.code === "OCR_NOT_AVAILABLE") throw e;
    }
  } finally {
    try {
      if (fs.existsSync(sidecar)) fs.unlinkSync(sidecar);
    } catch {}
    try {
      if (fs.existsSync(outPdf)) fs.unlinkSync(outPdf);
    } catch {}
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bank-ocr-"));
  try {
    const renderScript =
      "import sys, os\n" +
      "import pypdfium2 as pdfium\n" +
      "pdf_path=sys.argv[1]\n" +
      "out_dir=sys.argv[2]\n" +
      "pdf=pdfium.PdfDocument(pdf_path)\n" +
      "for i in range(len(pdf)):\n" +
      "  page=pdf[i]\n" +
      "  img=page.render(scale=2.0).to_pil()\n" +
      "  p=os.path.join(out_dir, f'page-{i+1:04d}.png')\n" +
      "  img.save(p)\n" +
      "  print(p)\n";

    const r = await runExternal("python", ["-c", renderScript, filePath, tmpDir], 600_000);
    if (r.code !== 0) {
      const detail = (r.stderr || r.stdout || "").toString().trim();
      const msg = detail ? `PDF render failed (pypdfium2): ${detail.slice(0, 600)}` : "PDF render failed (pypdfium2).";
      throw errWithCode(msg, "OCR_FAILED");
    }

    const images = (r.stdout || "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((p) => /\.png$/i.test(p));

    if (!images.length) throw errWithCode("OCR failed: no images produced from PDF.", "OCR_FAILED");

    let out = "";
    for (const imgPath of images) {
      const tr = await runExternal("tesseract", [imgPath, "stdout", "-l", "eng"], 600_000);
      if (tr.code !== 0) {
        const detail = (tr.stderr || tr.stdout || "").toString().trim();
        const msg = detail ? `OCR failed (tesseract): ${detail.slice(0, 600)}` : "OCR failed (tesseract).";
        throw errWithCode(msg, "OCR_FAILED");
      }
      out += (tr.stdout || "") + "\n";
    }

    if ((out || "").trim().length > 50) return out;
    throw errWithCode("OCR completed but produced no readable text. Please export CSV/XLSX from netbanking.", "OCR_FAILED");
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

async function parseFile(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  switch (ext) {
    case ".pdf":
      return await parsePDF(filePath);
    case ".csv":
      return await parseCSV(filePath);
    case ".xlsx":
    case ".xls":
      return await parseXLSX(filePath);
    case ".txt":
      return parseText(fs.readFileSync(filePath, "utf-8"));
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}

// ---- PDF PARSER ----
// Extracts text then applies row detection heuristics
// async function parsePDF(filePath) {
//   const pdfParse = require("pdf-parse");
//   const buffer = fs.readFileSync(filePath);
//   const data = await pdfParse(buffer);
//   const tx1 = parseText(data.text);
//   if (tx1.length) return tx1;
//   const tx2 = parseUnionBankText(data.text);
//   return tx2;
// }

async function parsePDF(filePath) {
  let raw = "";
  try {
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(fs.readFileSync(filePath), {
      // Use page render to get better text extraction
      pagerender: render_page,
    });
    raw = data.text;
  } catch (e) {
    console.error("[PDF] pdf-parse error:", e.message);
    // Try without custom renderer
    try {
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(fs.readFileSync(filePath));
      raw = data.text;
    } catch (e2) {
      throw new Error(`PDF parsing failed: ${e2.message}`);
    }
  }

  if ((raw || "").trim().length < 50) {
    try {
      raw = await extractPdfTextPdfjs(filePath);
    } catch (e) {
      console.error("[PDF] pdfjs text extraction error:", e?.message || e);
    }
  }

  if ((raw || "").trim().length < 50) {
    try {
      raw = await extractPdfTextOcr(filePath);
    } catch (e) {
      if (e?.code) throw e;
      console.error("[PDF] OCR error:", e?.message || e);
    }
  }

  console.log("[PDF] raw text length:", (raw || "").length);
  if ((raw || "").trim().length < 50) {
    throw errWithCode(
      "No extractable text found in this PDF. This looks like a scanned/image-only statement. Please export CSV/XLSX from netbanking or download a text-based PDF.",
      "PDF_SCANNED",
    );
  }

  console.log("[PDF] first 800 chars:\n", raw.slice(0, 800));

  let txns = parseText(raw);
  console.log("[PDF] Generic text parser:", txns.length);
  if (txns.length >= 2) return txns;

  txns = parseUnionBankText(raw);
  console.log("[PDF] Union Bank parser:", txns.length);
  if (txns.length >= 2) return txns;

  throw errWithCode(
    "We could extract text from this PDF, but couldn't detect transaction rows reliably. Please export CSV/XLSX from netbanking (recommended) or share a text-based PDF statement.",
    "PDF_PARSE_NO_ROWS",
  );
}

// ---- TEXT PARSER ----
// Handles both tabular and narrative bank statement text
function parseText(text) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const transactions = [];

  // Detect column headers
  const headerPatterns = [
    /date/i,
    /tran.*id/i,
    /utr/i,
    /withdrawal|debit/i,
    /deposit|credit/i,
    /balance/i,
    /narr|remark|desc/i,
  ];

  let headerLineIdx = -1;
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    const matches = headerPatterns.filter((p) => p.test(lines[i])).length;
    if (matches >= 3) {
      headerLineIdx = i;
      break;
    }
  }

  // Try structured row extraction
  const dateRegex =
    /\b(\d{4}-\d{2}-\d{2}|\d{2}[-\/]\d{2}[-\/]\d{2,4}|\d{2}[-\/][A-Za-z]{3}[-\/]\d{2,4}|\d{2}\s+[A-Za-z]{3}\s+\d{2,4}|\d{2}[A-Za-z]{3}\d{2,4})\b/;

  let currentTx = null;

  for (
    let i = headerLineIdx >= 0 ? headerLineIdx + 1 : 0;
    i < lines.length;
    i++
  ) {
    const line = lines[i];

    // Skip page headers/footers
    if (
      /page no|statement of account|account statement|customer id|account no|account type|branch|micr|ifsc|for any queries|savings account transactions|withdrawal|deposit|opening balance|closing balance|currency/i.test(
        line,
      )
    )
      continue;

    const dateMatch = line.match(dateRegex);

    if (dateMatch) {
      if (/\b\d{2}\s+[A-Za-z]{3}\s+\d{4}\s*(?:to|-)\s*\d{2}\s+[A-Za-z]{3}\s+\d{4}\b/i.test(line)) continue;
      if (currentTx) transactions.push(currentTx);

      // Extract all numbers from line
      const amounts = [];
      let m;
      MONEY_RE.lastIndex = 0;
      while ((m = MONEY_RE.exec(line)) !== null) {
        amounts.push(parseAmount(m[0]));
      }
      if (!amounts.length) {
        currentTx = null;
        continue;
      }

      // Remove date from line to get description
      const desc = line.replace(dateRegex, "").trim();

      // Detect debit/credit/balance from amounts
      // Strategy: last amount is usually balance, second-to-last is the transaction
      let debit = 0,
        credit = 0,
        balance = 0;

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
        debit,
        credit,
        balance,
        raw: line,
        _source: { type: "text", line_start: i + 1, line_end: i + 1 },
        source_excerpt: line,
      };
    } else if (currentTx) {
      if (currentTx.balance === 0) {
        const amounts = [];
        let m;
        MONEY_RE.lastIndex = 0;
        while ((m = MONEY_RE.exec(line)) !== null) amounts.push(parseAmount(m[0]));

        if (amounts.length >= 2) {
          currentTx.balance = amounts[amounts.length - 1] || 0;
          const txAmt = amounts[amounts.length - 2] || 0;
          if (!currentTx.debit && !currentTx.credit && txAmt)
            currentTx.debit = txAmt;
        }
      }
      // Continuation line (description, UTR, remarks)
      if (!/^\d+$/.test(line) && line.length > 2) {
        currentTx.description = (currentTx.description + " " + line).trim();
        currentTx._source.line_end = i + 1;
        currentTx.source_excerpt = (
          currentTx.source_excerpt +
          "\n" +
          line
        ).trim();
      }
    }
  }
  if (currentTx) transactions.push(currentTx);

  // Post-process: fill debit/credit using balance deltas
  let lastBalance = null;
  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const prevBalance = lastBalance;
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
    if (tx.balance !== 0) lastBalance = tx.balance;

    // Clean description
    tx.description = cleanDesc(tx.description || tx.raw || "");
  }

  // Remove invalid rows
  return transactions.filter(
    (t) => t.date && (t.debit > 0 || t.credit > 0 || t.balance > 0),
  );
}

// ---- UNION BANK PDF SPECIFIC PARSER ----
// Handles the specific format seen in the uploaded statement
function parseUnionBankText(text) {
  const transactions = [];
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Pattern: DD-MM-YYYY\nHH:MM:SS  then description lines then amounts
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Check if this line is a date
    const dateMatch = line.match(
      /^(\d{2}[-\/](?:\d{2}|[A-Za-z]{3})[-\/]\d{2,4})/,
    );
    if (dateMatch) {
      const rawDate = dateMatch[1];
      const date = parseDate(rawDate);
      const descLines = [];
      let debit = 0,
        credit = 0,
        balance = 0;
      const sourceStart = i + 1;
      let sourceEnd = i + 1;
      i++;

      // Collect description lines until we hit amounts
      while (i < lines.length) {
        const l = lines[i];
        const nextDateMatch = l.match(
          /^(\d{2}[-\/](?:\d{2}|[A-Za-z]{3})[-\/]\d{2,4})/,
        );
        if (nextDateMatch) break;

        if (/^\d{2}:\d{2}(:\d{2})?$/.test(l)) {
          sourceEnd = i + 1;
          i++;
          continue;
        }

        // Extract amounts
        const amounts = [];
        let m;
        MONEY_RE.lastIndex = 0;
        while ((m = MONEY_RE.exec(l)) !== null) amounts.push(parseAmount(m[0]));

        if (amounts.length >= 2) {
          balance = amounts[amounts.length - 1] || 0;
          const txAmt = amounts[amounts.length - 2] || 0;
          if (/cr\b|credit/i.test(l)) credit = txAmt;
          else debit = txAmt;
          descLines.push(l.replace(/[\d][\d,\s]*\.\d{2}/g, "").trim());
          sourceEnd = i + 1;
          i++;
          break;
        }

        if (l && !/^page no\d*/i.test(l)) descLines.push(l);
        sourceEnd = i + 1;
        i++;
      }

      const description = descLines.join(" ").replace(/\s+/g, " ").trim();
      if (date && description) {
        transactions.push({
          date,
          description: cleanDesc(description),
          debit,
          credit,
          balance,
          raw: description,
          _source: {
            type: "unionbank-text",
            line_start: sourceStart,
            line_end: sourceEnd,
          },
          source_excerpt: lines.slice(sourceStart - 1, sourceEnd).join("\n"),
        });
      }
    } else {
      i++;
    }
  }

  // Fix debit/credit using balance deltas
  for (let j = 0; j < transactions.length; j++) {
    const tx = transactions[j];
    const prev = j > 0 ? transactions[j - 1].balance : null;
    if (prev !== null && tx.balance > 0) {
      const delta = tx.balance - prev;
      if (delta > 0) {
        tx.credit = delta;
        tx.debit = 0;
      } else if (delta < 0) {
        tx.debit = Math.abs(delta);
        tx.credit = 0;
      }
    }
  }

  return transactions.filter((t) => t.date && (t.debit > 0 || t.credit > 0));
}

// ---- CSV PARSER ----
async function parseCSV(filePath) {
  const { parse } = require("csv-parse/sync");
  const content = fs.readFileSync(filePath, "utf-8");

  let records;
  try {
    records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
    });
  } catch {
    // Try without headers
    records = parse(content, {
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
    });
    if (!records.length) return [];
    // Use first row as headers
    const headers = records[0];
    records = records.slice(1).map((row) => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] || "";
      });
      return obj;
    });
  }

  return records
    .map((row, idx) => {
      const tx = normalizeRow(row);
      tx._source = { type: "csv", row: idx + 2 };
      tx.source_excerpt = JSON.stringify(row);
      return tx;
    })
    .filter((t) => t.date && (t.debit > 0 || t.credit > 0));
}

// ---- XLSX PARSER ----
async function parseXLSX(filePath) {
  const XLSX = require("xlsx");
  const workbook = XLSX.readFile(filePath);
  const allTx = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    if (rows.length < 2) continue;

    // Find header row
    let headerIdx = 0;
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const row = rows[i].map((c) => c.toString().toLowerCase());
      if (
        row.some((c) => c.includes("date")) &&
        row.some(
          (c) =>
            c.includes("amount") || c.includes("debit") || c.includes("credit"),
        )
      ) {
        headerIdx = i;
        break;
      }
    }

    const headers = rows[headerIdx].map((c) =>
      c.toString().toLowerCase().trim(),
    );

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      const obj = {};
      headers.forEach((h, j) => {
        obj[h] = row[j] !== undefined ? row[j].toString() : "";
      });
      const tx = normalizeRow(obj);
      if (tx.date && (tx.debit > 0 || tx.credit > 0)) {
        tx._source = { type: "xlsx", sheet: sheetName, row: i + 1 };
        tx.source_excerpt = JSON.stringify(obj);
        allTx.push(tx);
      }
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
      const k = keys.find((k) => new RegExp(p, "i").test(k));
      if (k && row[k] !== undefined && row[k] !== "") return row[k].toString();
    }
    return "";
  };

  const dateRaw = find(
    "date",
    "txn.*date",
    "tran.*date",
    "value.*date",
    "posting.*date",
  );
  const desc = find(
    "narr",
    "remark",
    "desc",
    "particular",
    "detail",
    "transac.*desc",
    "tran.*desc",
    "memo",
  );
  const debitRaw = find(
    "withdrawal",
    "debit",
    "dr",
    "debit.*amount",
    "dr.*amount",
    "amount.*dr",
  );
  const creditRaw = find(
    "deposit",
    "credit",
    "cr",
    "credit.*amount",
    "cr.*amount",
    "amount.*cr",
  );
  const balanceRaw = find(
    "balance",
    "closing.*bal",
    "avail.*bal",
    "running.*bal",
  );
  const amountRaw = find(
    "^amount$",
    "^amt$",
    "amount",
    "amt",
    "transaction.*amount",
    "txn.*amount",
  );

  let debit = parseAmount(debitRaw);
  let credit = parseAmount(creditRaw);

  // If single amount column, check dr/cr indicator
  if (!debit && !credit && amountRaw) {
    const typeCol = find("type", "dr.*cr", "cr.*dr", "tran.*type");
    const typeVal = typeCol.toUpperCase();
    const amt = parseAmount(amountRaw);
    if (
      typeVal.includes("DR") ||
      typeVal.includes("DEBIT") ||
      typeVal.includes("WD")
    )
      debit = Math.abs(amt);
    else if (
      typeVal.includes("CR") ||
      typeVal.includes("CREDIT") ||
      typeVal.includes("DEP")
    )
      credit = Math.abs(amt);
    else if (amt < 0) debit = Math.abs(amt);
    else credit = Math.abs(amt);
  }

  return {
    date: parseDate(dateRaw),
    description: cleanDesc(desc),
    debit,
    credit,
    balance: parseAmount(balanceRaw),
    raw: JSON.stringify(row),
  };
}

function cleanDesc(desc) {
  return desc
    .replace(/\s+/g, " ")
    .replace(/[^\x20-\x7E\u0900-\u097F]/g, "")
    .trim()
    .slice(0, 200);
}

module.exports = { parseFile, parseText, parseUnionBankText, normalizeRow };
