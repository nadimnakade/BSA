const fs = require('fs');
const path = require('path');
const { parseCibilText } = require('./cibil_parser');

async function extractPdfTextPdfjs(buffer) {
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const data = Buffer.isBuffer(buffer)
      ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
      : buffer;
    const loadingTask = pdfjs.getDocument({ data, disableWorker: true, password: '' });
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
    throw new Error(e.message || 'Failed to read PDF text');
  }
}

async function extractCibilText(filePath) {
  const buffer = fs.readFileSync(filePath);
  try {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    const text = data.text || '';
    if (text.trim().length > 20) return text;
  } catch (e) {}
  return extractPdfTextPdfjs(buffer);
}

async function run() {
  const filePath = path.join(__dirname, 'uploads', 'CIBIL Report- Reshmi (1) (1).pdf');
  const text = await extractCibilText(filePath);
  fs.writeFileSync('reshmi_text_raw.txt', text);
  console.log("Extracted text length:", text.length);
  console.log("First 3000 chars:\n", text.substring(0, 3000));
  console.log("\n\n=== PARSING ===");
  const parsed = parseCibilText(text);
  console.log("SCORE:", parsed.score);
  console.log("NAME:", parsed.personal?.name);
  console.log("MOBILE:", parsed.personal?.mobile);
  console.log("PAN:", parsed.personal?.pan);
  console.log("ACCOUNTS:", parsed.accounts?.length);
  console.log("ENQUIRIES:", parsed.enquiry_details?.length);
  if (parsed.accounts) {
    for (const a of parsed.accounts) {
      console.log(`  ${a.account_no} | ${a.lender} | ${a.account_type} | bal=${a.current_balance} | sanct=${a.sanctioned_amount} | ${a.account_status}`);
    }
  }
}

run().catch(console.error);
