/**
 * Convert markdown content to PDF using pdfmake
 * This creates vector-based PDFs with searchable text and small file sizes
 */

export interface PDFContent {
  text?: string | any[];
  style?: string | string[];
  bold?: boolean;
  italics?: boolean;
  decoration?: string;
  margin?: number[];
  color?: string;
  fontSize?: number;
  alignment?: string;
  ul?: any[];
  ol?: any[];
  table?: {
    body: any[][];
    widths?: any[];
  };
  layout?: string;
  pageBreak?: string;
}

/**
 * Parse markdown and convert to pdfmake document definition
 */
export function markdownToPdfContent(markdown: string): PDFContent[] {
  const content: PDFContent[] = [];

  if (!markdown || markdown.trim() === '') {
    return [{ text: 'No content available', style: 'h3' }];
  }

  const lines = markdown.split('\n');

  let i = 0;
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];
  let tableAlignments: string[] = [];
  let inList = false;
  let listItems: PDFContent[] = [];
  let listType: 'ul' | 'ol' = 'ul';

  const sanitizeText = (text: string): string => {
    // Remove or replace problematic characters
    return text.replace(/[^\x00-\x7F]/g, (char) => {
      const charCode = char.charCodeAt(0);

      // Handle common special characters
      if (char === '✅') return '[OK]';
      if (char === '❌') return '[X]';
      if (char === '⚠️') return '[!]';
      if (char === '💰') return '$';
      if (char === '📝') return 'Note:';
      if (char === '🔍') return '';
      if (char === '🎯') return '*';
      if (char === '🏠') return 'Property';
      if (char === '📊') return '';
      if (char === '✓') return '[OK]';
      if (char === '×') return '[X]';
      if (charCode === 8217 || charCode === 8216) return "'"; // Smart quotes
      if (charCode === 8220 || charCode === 8221) return '"'; // Smart double quotes
      if (charCode === 8211 || charCode === 8212) return '-'; // En dash, em dash

      // For other non-ASCII characters, keep them or return empty
      return char;
    });
  };

  const flushList = () => {
    try {
      if (inList && listItems.length > 0) {
        content.push({
          [listType]: listItems,
          margin: [0, 5, 0, 10] as [number, number, number, number],
        });
        listItems = [];
        inList = false;
      }
    } catch (e) {
      console.error('Error flushing list:', e);
    }
  };

  const flushTable = () => {
    try {
      if (inTable && tableRows.length > 0 && tableRows[0] && tableRows[0].length > 0) {
        const widths = new Array(tableRows[0].length).fill('auto');
        content.push({
          table: {
            body: tableRows.map((row, rowIndex) =>
              row.map(cell => ({
                text: sanitizeText((cell || '').trim()),
                style: rowIndex === 0 ? 'tableHeader' : 'tableCell',
                bold: rowIndex === 0,
              }))
            ),
            widths,
          },
          layout: 'lightHorizontalLines',
          margin: [0, 5, 0, 15] as [number, number, number, number],
        });
        tableRows = [];
        tableAlignments = [];
        inTable = false;
      }
    } catch (e) {
      console.error('Error flushing table:', e);
      inTable = false;
      tableRows = [];
    }
  };

  const flushCodeBlock = () => {
    if (inCodeBlock && codeBlockContent.length > 0) {
      content.push({
        text: sanitizeText(codeBlockContent.join('\n')),
        style: 'code',
        margin: [0, 5, 0, 10] as [number, number, number, number],
      });
      codeBlockContent = [];
      inCodeBlock = false;
    }
  };

  while (i < lines.length) {
    try {
      let line = lines[i];

    // Handle code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        flushList();
        flushTable();
        inCodeBlock = true;
      }
      i++;
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      i++;
      continue;
    }

    // Handle tables
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      flushList();
      if (!inTable) {
        inTable = true;
        const cells = line.split('|').filter(cell => cell.trim() !== '');
        tableRows.push(cells.map(c => c.trim()));
      } else if (line.includes('---') || line.includes(':-:') || line.includes(':--')) {
        // Alignment row - skip but note alignments
        tableAlignments = line.split('|').filter(cell => cell.trim() !== '');
      } else {
        const cells = line.split('|').filter(cell => cell.trim() !== '');
        tableRows.push(cells.map(c => c.trim()));
      }
      i++;
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Handle empty lines
    if (line.trim() === '') {
      flushList();
      i++;
      continue;
    }

    // Handle headings
    if (line.startsWith('#')) {
      flushList();
      const level = line.match(/^#+/)?.[0].length || 1;
      const text = sanitizeText(line.replace(/^#+\s*/, '').trim());

      const styles: { [key: number]: string } = {
        1: 'h1',
        2: 'h2',
        3: 'h3',
        4: 'h4',
      };

      content.push({
        text,
        style: styles[level] || 'h4',
        margin: [0, level === 1 ? 20 : 15, 0, 10] as [number, number, number, number],
      });
      i++;
      continue;
    }

    // Handle unordered lists
    if (line.match(/^[\s]*[-*]\s+/)) {
      if (!inList || listType !== 'ul') {
        flushList();
        inList = true;
        listType = 'ul';
      }
      const text = sanitizeText(line.replace(/^[\s]*[-*]\s+/, '').trim());
      listItems.push(parseInlineFormatting(text));
      i++;
      continue;
    }

    // Handle ordered lists
    if (line.match(/^[\s]*\d+\.\s+/)) {
      if (!inList || listType !== 'ol') {
        flushList();
        inList = true;
        listType = 'ol';
      }
      const text = sanitizeText(line.replace(/^[\s]*\d+\.\s+/, '').trim());
      listItems.push(parseInlineFormatting(text));
      i++;
      continue;
    }

    // Handle horizontal rules
    if (line.match(/^---+$/)) {
      flushList();
      content.push({
        text: '',
        margin: [0, 10, 0, 10] as [number, number, number, number],
        decoration: 'lineThrough',
      });
      i++;
      continue;
    }

    // Handle blockquotes
    if (line.startsWith('>')) {
      flushList();
      const text = sanitizeText(line.replace(/^>\s*/, '').trim());
      content.push({
        text,
        style: 'quote',
        margin: [20, 5, 0, 10] as [number, number, number, number],
      });
      i++;
      continue;
    }

    // Handle regular paragraphs
    flushList();
    if (line.trim() !== '') {
      content.push({
        ...parseInlineFormatting(sanitizeText(line)),
        margin: [0, 0, 0, 10] as [number, number, number, number],
      });
    }
    i++;
    } catch (lineError) {
      console.error(`Error processing line ${i}:`, lineError, 'Line content:', lines[i]);
      // Skip problematic line and continue
      i++;
    }
  }

  // Flush any remaining content
  flushList();
  flushTable();
  flushCodeBlock();

  return content.length > 0 ? content : [{ text: 'Content could not be parsed', style: 'h3' }];
}

/**
 * Parse inline formatting (bold, italic, code, links)
 */
function parseInlineFormatting(text: string): PDFContent {
  // Simple approach: handle basic formatting
  // For production, you might want to use a proper markdown parser

  const parts: any[] = [];
  let current = text;

  // Very basic parsing - in production, use a proper markdown parser
  // This handles simple cases

  // Check for inline code
  if (current.includes('`')) {
    const regex = /`([^`]+)`/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(current)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: current.substring(lastIndex, match.index) });
      }
      parts.push({
        text: match[1],
        style: 'inlineCode',
      });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < current.length) {
      parts.push({ text: current.substring(lastIndex) });
    }

    return { text: parts.length > 0 ? parts : current };
  }

  // Check for bold
  if (current.includes('**')) {
    const regex = /\*\*([^*]+)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(current)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: current.substring(lastIndex, match.index) });
      }
      parts.push({
        text: match[1],
        bold: true,
      });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < current.length) {
      parts.push({ text: current.substring(lastIndex) });
    }

    return { text: parts.length > 0 ? parts : current };
  }

  return { text: current };
}

/**
 * Create document definition for PDF
 */
async function createDocDefinition(markdown: string): Promise<any> {
  // Dynamic import for client-side only
  const pdfMakeModule = await import('pdfmake/build/pdfmake');
  const pdfFontsModule = await import('pdfmake/build/vfs_fonts');

  // Access the default exports correctly
  const pdfMake = (pdfMakeModule as any).default || pdfMakeModule;
  const pdfFonts = (pdfFontsModule as any).default || pdfFontsModule;

  // Set fonts
  if (pdfMake.vfs === undefined) {
    pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.vfs;
  }

  const content = markdownToPdfContent(markdown);

  return {
    pdfMake,
    docDefinition: {
      content,
      styles: {
        h1: {
          fontSize: 24,
          bold: true,
          color: '#1a1a1a',
          margin: [0, 20, 0, 10],
        },
        h2: {
          fontSize: 20,
          bold: true,
          color: '#2a2a2a',
          margin: [0, 15, 0, 8],
        },
        h3: {
          fontSize: 16,
          bold: true,
          color: '#3a3a3a',
          margin: [0, 12, 0, 6],
        },
        h4: {
          fontSize: 14,
          bold: true,
          color: '#4a4a4a',
          margin: [0, 10, 0, 5],
        },
        quote: {
          italics: true,
          color: '#555555',
        },
        code: {
          fontSize: 9,
          color: '#333333',
          background: '#f5f5f5',
          margin: [5, 5, 5, 5],
        },
        inlineCode: {
          fontSize: 10,
          color: '#d63384',
          background: '#f8f8f8',
        },
        tableHeader: {
          bold: true,
          fontSize: 11,
          color: '#1a1a1a',
          fillColor: '#f0f0f0',
        },
        tableCell: {
          fontSize: 10,
          color: '#333333',
        },
      },
      defaultStyle: {
        fontSize: 11,
        color: '#333333',
        lineHeight: 1.3,
      },
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      header: (currentPage: number, pageCount: number) => {
        return {
          text: 'CGT Analysis Report',
          alignment: 'center',
          fontSize: 10,
          color: '#666666',
          margin: [0, 20, 0, 0],
        };
      },
      footer: (currentPage: number, pageCount: number) => {
        return {
          text: `Page ${currentPage} of ${pageCount}`,
          alignment: 'center',
          fontSize: 9,
          color: '#666666',
          margin: [0, 0, 0, 20],
        };
      },
    },
  };
}

/**
 * Generate PDF from markdown content
 */
export async function generatePDFFromMarkdown(
  markdown: string,
  filename: string = 'document.pdf'
): Promise<void> {
  try {
    console.log('Starting PDF generation...');
    console.log('Markdown length:', markdown.length);

    const { pdfMake, docDefinition } = await createDocDefinition(markdown);

    console.log('Document definition created');

    // Generate and download PDF
    const pdfDocGenerator = pdfMake.createPdf(docDefinition);
    console.log('PDF generator created');

    pdfDocGenerator.download(filename);
    console.log('Download triggered');
  } catch (error) {
    console.error('Error in generatePDFFromMarkdown:', error);
    throw error;
  }
}

/**
 * Generate PDF as a Blob (for email attachments)
 */
export async function generatePDFBlob(markdown: string): Promise<Blob> {
  try {
    console.log('Starting PDF blob generation...');
    console.log('Markdown length:', markdown.length);

    const { pdfMake, docDefinition } = await createDocDefinition(markdown);

    console.log('Document definition created');

    // Generate PDF as blob
    const pdfDocGenerator = pdfMake.createPdf(docDefinition);
    console.log('PDF generator created');

    return new Promise<Blob>((resolve, reject) => {
      pdfDocGenerator.getBlob((blob: Blob) => {
        console.log('PDF blob generated, size:', blob.size);
        resolve(blob);
      });
    });
  } catch (error) {
    console.error('Error in generatePDFBlob:', error);
    throw error;
  }
}
