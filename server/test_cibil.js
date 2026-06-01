const fs = require('fs');
const path = require('path');
const { parseCibilText } = require('./analyzer');

async function extractPdfTextPdfjs(buffer) {
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const data = Buffer.isBuffer(buffer)
      ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
      : buffer;
    const loadingTask = pdfjs.getDocument({ data, disableWorker: true, password: '15051979' });
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
  const filePath = path.join(__dirname, 'uploads', 'cibil.pdf');
  const text = await extractCibilText(filePath);
  fs.writeFileSync('cibil_text.txt', text);
  console.log("Extracted text saved to cibil_text.txt");
  
  const parsed = parseCibilText(text);
  console.log(JSON.stringify(parsed, null, 2));
}

run().catch(console.error);
