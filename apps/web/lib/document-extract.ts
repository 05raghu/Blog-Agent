// Extracts plain text from an uploaded document (PDF, DOCX, TXT, MD)

export interface ExtractedDocument {
  text: string;
  filename: string;
}

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const MAX_EXTRACTED_CHARS = 50_000; // cap how much source text we carry forward

export async function extractDocumentText(file: File): Promise<ExtractedDocument> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File too large (max ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB)`);
  }

  const filename = file.name;
  const ext = filename.toLowerCase().split('.').pop();
  const buffer = Buffer.from(await file.arrayBuffer());

  let text: string;

  switch (ext) {
    case 'pdf': {
      // Import the internal lib directly, bypassing pdf-parse's index.js —
      // its top-level debug block reads a bundled test fixture when
      // `module.parent` is falsy (common under Next.js's server bundling),
      // which throws ENOENT outside the package's own directory.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = require('pdf-parse/lib/pdf-parse.js');
      const result = await pdfParse(buffer);
      text = result.text;
      break;
    }
    case 'docx': {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
      break;
    }
    case 'txt':
    case 'md': {
      text = buffer.toString('utf-8');
      break;
    }
    default:
      throw new Error(`Unsupported file type: .${ext}. Use .pdf, .docx, .txt, or .md`);
  }

  text = text.trim();

  if (!text) {
    throw new Error('No extractable text found in document');
  }

  if (text.length > MAX_EXTRACTED_CHARS) {
    text = text.substring(0, MAX_EXTRACTED_CHARS);
  }

  return { text, filename };
}
