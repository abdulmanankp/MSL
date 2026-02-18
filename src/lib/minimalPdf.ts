/**
 * Minimal PDF generator for pdfme templates
 * Creates a blank single-page PDF using pdf-lib
 */

// Simple PDF header and structure for a minimal blank PDF
// This is a valid PDF that can be used as a template base
export function createMinimalPDF(): Uint8Array {
  // Minimal valid PDF in binary format (a single blank A4 page)
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << >> /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
trailer
<< /Size 4 /Root 1 0 R >>
startxref
229
%%EOF`;

  // Convert string to Uint8Array
  const encoder = new TextEncoder();
  return encoder.encode(pdfContent);
}

/**
 * Creates a minimal PDF as base64 string
 * Useful for storing in JSON or database
 */
export function createMinimalPDFBase64(): string {
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << >> /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
trailer
<< /Size 4 /Root 1 0 R >>
startxref
229
%%EOF`;

  // In Node.js environment
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(pdfContent).toString('base64');
  }
  
  // In browser environment, use base64 encoding
  return btoa(pdfContent);
}

/**
 * Loads the template PDF from the server
 * Falls back to minimal PDF if not found
 */
export async function loadDefaultTemplatePdf(apiUrl: string): Promise<string> {
  try {
    const url = apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`;
    const response = await fetch(`${url}get-pdf-template`, { mode: 'cors' });
    
    if (!response.ok) {
      console.warn('Failed to load template PDF from server, using minimal PDF');
      return createMinimalPDFBase64();
    }
    
    const pdfBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(pdfBuffer);
    const binaryString = String.fromCharCode(...uint8Array);
    return btoa(binaryString);
  } catch (err) {
    console.warn('Error loading template PDF:', err);
    return createMinimalPDFBase64();
  }
}

/**
 * Validates if a basePdf is valid
 */
export function isValidBasePdf(basePdf: Uint8Array | string | null | undefined): boolean {
  if (!basePdf) return false;
  if (basePdf instanceof Uint8Array) return basePdf.length > 0;
  if (typeof basePdf === 'string') {
    // Accept non-empty strings (could be URL, base64, or data URI)
    return basePdf.length > 0;
  }
  return false;
}
