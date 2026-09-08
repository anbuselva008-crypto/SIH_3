import mammoth from 'mammoth';
import AdmZip from 'adm-zip';

export interface ParsedSection {
  title: string;
  text: string;
  pageOrSlide: number;
}

export interface ParsedDocument {
  text: string;
  pageOrSectionCount: number;
  fileType: 'pdf' | 'pptx' | 'docx' | 'txt';
  sections: ParsedSection[];
}

export class DocumentParser {
  /**
   * Parses buffer based on file extension and MIME type.
   */
  public static async parse(
    buffer: Buffer,
    originalFilename: string,
    mimeType?: string
  ): Promise<ParsedDocument> {
    const ext = originalFilename.split('.').pop()?.toLowerCase() || '';

    let parsedDoc: ParsedDocument;

    switch (ext) {
      case 'pdf':
        parsedDoc = await this.parsePdf(buffer, originalFilename);
        break;
      case 'pptx':
        parsedDoc = await this.parsePptx(buffer, originalFilename);
        break;
      case 'docx':
        parsedDoc = await this.parseDocx(buffer, originalFilename);
        break;
      case 'txt':
        parsedDoc = this.parseTxt(buffer, originalFilename);
        break;
      default:
        throw new Error(
          `Unsupported file format (.${ext}). Supported formats: PDF, PPTX, DOCX, TXT.`
        );
    }

    // Validate extracted text quantity (reject empty / scanned non-OCR PDFs)
    const cleanedTotal = parsedDoc.text.replace(/\s+/g, ' ').trim();
    if (cleanedTotal.length < 50) {
      throw new Error(
        "We couldn't extract enough text from this document. Please upload a text-based PDF/PPTX/DOCX or another approved learning material."
      );
    }

    return parsedDoc;
  }

  /**
   * PDF parser using pdf-parse.
   */
  private static async parsePdf(buffer: Buffer, filename: string): Promise<ParsedDocument> {
    try {
      // Dynamic import to support both CJS and ESM bundle modes cleanly
      const pdfModule = await import('pdf-parse');
      const pdf = (pdfModule as any).default || pdfModule;
      
      const data = await pdf(buffer);
      const totalPages = data.numpages || 1;
      const rawText = data.text || '';

      // Break into sections by form feed or page approximations if present
      const rawPages = rawText.split(/\f|\n{3,}/).filter((p: string) => p.trim().length > 0);
      const sections: ParsedSection[] = (rawPages.length > 0 ? rawPages : [rawText]).map(
        (pageContent: string, idx: number) => ({
          title: `Page ${idx + 1}`,
          text: pageContent.trim(),
          pageOrSlide: idx + 1,
        })
      );

      return {
        text: rawText,
        pageOrSectionCount: totalPages,
        fileType: 'pdf',
        sections,
      };
    } catch (err) {
      console.error(`[DocumentParser] Error parsing PDF (${filename}):`, err);
      throw new Error(
        `Failed to parse PDF document (${filename}). Please ensure it is not password-protected or corrupted.`
      );
    }
  }

  /**
   * PPTX parser using adm-zip to inspect slide XML contents.
   */
  private static async parsePptx(buffer: Buffer, filename: string): Promise<ParsedDocument> {
    try {
      const zip = new AdmZip(buffer);
      const zipEntries = zip.getEntries();

      // Find all slide XML files (ppt/slides/slide1.xml, etc.)
      const slideEntries = zipEntries
        .filter((entry) => entry.entryName.match(/^ppt\/slides\/slide\d+\.xml$/i))
        .sort((a, b) => {
          const numA = parseInt(a.entryName.replace(/\D/g, ''), 10) || 0;
          const numB = parseInt(b.entryName.replace(/\D/g, ''), 10) || 0;
          return numA - numB;
        });

      if (slideEntries.length === 0) {
        throw new Error('No slides found in the PPTX archive.');
      }

      const sections: ParsedSection[] = [];
      let fullText = '';

      for (let i = 0; i < slideEntries.length; i++) {
        const slideXml = slideEntries[i].getData().toString('utf8');
        // Extract all text inside <a:t>...</a:t>
        const matches = slideXml.match(/<a:t[^>]*>(.*?)<\/a:t>/gi) || [];
        const slideTexts = matches
          .map((m) => m.replace(/<[^>]+>/g, '').trim())
          .filter((t) => t.length > 0);

        const slideContent = slideTexts.join(' ');
        if (slideContent.length > 0) {
          sections.push({
            title: `Slide ${i + 1}`,
            text: slideContent,
            pageOrSlide: i + 1,
          });
          fullText += `[Slide ${i + 1}]\n${slideContent}\n\n`;
        }
      }

      return {
        text: fullText.trim(),
        pageOrSectionCount: slideEntries.length,
        fileType: 'pptx',
        sections,
      };
    } catch (err) {
      console.error(`[DocumentParser] Error parsing PPTX (${filename}):`, err);
      throw new Error(
        `Failed to parse PPTX presentation (${filename}). Please ensure it is a valid PowerPoint file.`
      );
    }
  }

  /**
   * DOCX parser using mammoth.
   */
  private static async parseDocx(buffer: Buffer, filename: string): Promise<ParsedDocument> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const rawText = result.value || '';
      
      // Split into approximate paragraphs/sections
      const paragraphs = rawText
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      const sections: ParsedSection[] = [];
      const chunkSize = 4; // 4 paragraphs per logical section
      for (let i = 0; i < paragraphs.length; i += chunkSize) {
        const chunk = paragraphs.slice(i, i + chunkSize).join('\n\n');
        const sectionNum = Math.floor(i / chunkSize) + 1;
        sections.push({
          title: `Section ${sectionNum}`,
          text: chunk,
          pageOrSlide: sectionNum,
        });
      }

      return {
        text: rawText,
        pageOrSectionCount: Math.max(1, sections.length),
        fileType: 'docx',
        sections: sections.length > 0 ? sections : [{ title: 'Main Document', text: rawText, pageOrSlide: 1 }],
      };
    } catch (err) {
      console.error(`[DocumentParser] Error parsing DOCX (${filename}):`, err);
      throw new Error(
        `Failed to parse Word document (${filename}). Please ensure it is a valid .docx file.`
      );
    }
  }

  /**
   * Plain text parser.
   */
  private static parseTxt(buffer: Buffer, _filename: string): ParsedDocument {
    const rawText = buffer.toString('utf-8');
    const sections: ParsedSection[] = rawText
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      .map((text, idx) => ({
        title: `Part ${idx + 1}`,
        text,
        pageOrSlide: idx + 1,
      }));

    return {
      text: rawText,
      pageOrSectionCount: Math.max(1, sections.length),
      fileType: 'txt',
      sections: sections.length > 0 ? sections : [{ title: 'Full Text', text: rawText, pageOrSlide: 1 }],
    };
  }
}
