import type { ParsedSection } from './documentParser.ts';

export interface DocumentChunk {
  index: number;
  sectionTitle: string;
  pageOrSlide: number;
  content: string;
  charCount: number;
}

export class TextChunker {
  /**
   * Normalizes raw text by removing non-printable/control characters and excess whitespace.
   */
  public static normalize(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Chunks parsed sections into structured content blocks with page/slide references.
   */
  public static chunkSections(
    sections: ParsedSection[],
    maxChunkChars: number = 2500
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    let chunkIndex = 1;

    for (const sec of sections) {
      const normalized = this.normalize(sec.text);
      if (normalized.length === 0) continue;

      if (normalized.length <= maxChunkChars) {
        chunks.push({
          index: chunkIndex++,
          sectionTitle: sec.title,
          pageOrSlide: sec.pageOrSlide,
          content: normalized,
          charCount: normalized.length,
        });
      } else {
        // Subdivide section if too long
        const paragraphs = normalized.split(/\n\s*\n/);
        let currentSub = '';

        for (const p of paragraphs) {
          if (currentSub.length + p.length > maxChunkChars && currentSub.length > 0) {
            chunks.push({
              index: chunkIndex++,
              sectionTitle: `${sec.title} (Part ${chunks.length + 1})`,
              pageOrSlide: sec.pageOrSlide,
              content: currentSub.trim(),
              charCount: currentSub.trim().length,
            });
            currentSub = '';
          }
          currentSub += (currentSub.length > 0 ? '\n\n' : '') + p;
        }

        if (currentSub.trim().length > 0) {
          chunks.push({
            index: chunkIndex++,
            sectionTitle: `${sec.title}`,
            pageOrSlide: sec.pageOrSlide,
            content: currentSub.trim(),
            charCount: currentSub.trim().length,
          });
        }
      }
    }

    return chunks;
  }

  /**
   * Selects high-signal chunks up to a total character limit for prompt efficiency and Groq speed.
   */
  public static selectContentForPrompt(
    chunks: DocumentChunk[],
    maxTotalChars: number = 9000
  ): { formattedText: string; selectedCount: number } {
    let accumulated = '';
    let count = 0;

    for (const c of chunks) {
      const block = `--- [${c.sectionTitle} / Reference: ${c.pageOrSlide}] ---\n${c.content}\n\n`;
      if (accumulated.length + block.length > maxTotalChars && count > 0) {
        break;
      }
      accumulated += block;
      count++;
    }

    return {
      formattedText: accumulated.trim(),
      selectedCount: count,
    };
  }
}
