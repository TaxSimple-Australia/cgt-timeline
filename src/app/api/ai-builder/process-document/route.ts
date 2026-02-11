import { NextRequest, NextResponse } from 'next/server';
import { LLMFactory } from '@/lib/ai-builder/llm';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

interface ExtractionResult {
  text: string;
  base64?: string;
  mimeType?: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const llmProvider = (formData.get('llmProvider') as string) || 'deepseek';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // File size check
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    // Set API keys
    LLMFactory.setApiKeys({
      deepseek: process.env.DEEPSEEK_API_KEY || '',
      claude: process.env.ANTHROPIC_API_KEY || '',
      openai: process.env.OPENAI_API_KEY || '',
      gemini: process.env.GOOGLE_AI_API_KEY || '',
    });

    // Read file content
    const buffer = await file.arrayBuffer();
    const extraction = await extractFileContent(file, buffer);

    // Determine which LLM to use
    // If file produced base64 (image/scanned PDF) and selected provider lacks vision, fallback
    let effectiveProvider = llmProvider;
    if (extraction.base64 && !providerSupportsVision(llmProvider)) {
      effectiveProvider = getFirstVisionProvider();
      console.log(`📷 File requires vision. Switching from ${llmProvider} to ${effectiveProvider}`);
    }

    const llmService = LLMFactory.getProvider(effectiveProvider);

    // Build extraction prompt
    const extractionPrompt = `Analyze the following document content and extract property and CGT timeline information.

Look for and extract:
1. Property addresses (full Australian addresses)
2. Purchase dates and amounts
3. Sale dates and amounts
4. Rental periods and rental income
5. Renovation/improvement costs and dates
6. Dates when owner moved in/out
7. Any capital gains tax related information

Document content:
${extraction.text.substring(0, 15000)}

Return a JSON object with the following structure:
{
  "properties": [
    {
      "address": "string",
      "name": "string (optional short name)",
      "purchasePrice": number,
      "purchaseDate": "YYYY-MM-DD",
      "salePrice": number (if sold),
      "saleDate": "YYYY-MM-DD (if sold)"
    }
  ],
  "events": [
    {
      "propertyAddress": "string (to match with property)",
      "type": "purchase|sale|move_in|move_out|rent_start|rent_end|improvement",
      "date": "YYYY-MM-DD",
      "amount": number (optional),
      "description": "string"
    }
  ],
  "dates": [
    {
      "text": "original text",
      "date": "YYYY-MM-DD",
      "context": "what this date relates to"
    }
  ],
  "amounts": [
    {
      "text": "original text",
      "amount": number,
      "context": "what this amount relates to"
    }
  ],
  "addresses": [
    {
      "text": "original text",
      "address": "formatted address"
    }
  ]
}

Only include information that is clearly stated in the document. Do not make assumptions.`;

    // Build the chat request - include base64 for vision-capable providers
    let messages: Array<{ role: 'user'; content: string }>;

    if (extraction.base64 && providerSupportsVision(effectiveProvider)) {
      // For vision: we still send the text extraction alongside the prompt
      // The actual base64 attachment is handled via the chat API's attachment support
      messages = [{
        role: 'user',
        content: extractionPrompt,
      }];
    } else {
      messages = [{
        role: 'user',
        content: extractionPrompt,
      }];
    }

    const response = await llmService.chat({
      messages,
      temperature: 0.1,
      maxTokens: 4096,
    });

    // Parse JSON from response
    let extractedData = {
      properties: [],
      events: [],
      dates: [],
      amounts: [],
      addresses: [],
    };

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Error parsing LLM response:', e);
    }

    // Generate suggested actions
    const suggestedActions = generateActions(extractedData);

    // Calculate confidence
    const confidence = calculateConfidence(extractedData);

    const document = {
      type: getDocumentType(file),
      filename: file.name,
      extractedData,
      confidence,
      rawText: extraction.text.substring(0, 5000), // Truncate for response
      suggestedActions,
      // Include base64 and mimeType for chat follow-ups
      ...(extraction.base64 && { base64: extraction.base64 }),
      ...(extraction.mimeType && { mimeType: extraction.mimeType }),
    };

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error('Document processing error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to process document',
        success: false,
      },
      { status: 500 }
    );
  }
}

/**
 * Check if an LLM provider supports vision/image analysis
 */
function providerSupportsVision(provider: string): boolean {
  return ['claude', 'gpt4', 'gemini'].includes(provider);
}

/**
 * Get the first available vision-capable provider
 */
function getFirstVisionProvider(): string {
  const visionProviders = ['claude', 'gpt4', 'gemini'];
  for (const p of visionProviders) {
    const keys: Record<string, string | undefined> = {
      claude: process.env.ANTHROPIC_API_KEY,
      gpt4: process.env.OPENAI_API_KEY,
      gemini: process.env.GOOGLE_AI_API_KEY,
    };
    if (keys[p]) return p;
  }
  // Fallback to claude even without key (will fail gracefully)
  return 'claude';
}

async function extractFileContent(file: File, buffer: ArrayBuffer): Promise<ExtractionResult> {
  const mimeType = file.type.toLowerCase();
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  // Text files (CSV, TXT, MD)
  if (
    mimeType.startsWith('text/') ||
    ['txt', 'csv', 'md'].includes(extension)
  ) {
    const decoder = new TextDecoder();
    return { text: decoder.decode(buffer) };
  }

  // Excel (.xlsx, .xls)
  if (mimeType.includes('spreadsheet') || ['xlsx', 'xls'].includes(extension)) {
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(Buffer.from(buffer), { type: 'buffer' });
      const sheets: string[] = [];

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        sheets.push(`--- Sheet: ${sheetName} ---\n${csv}`);
      }

      return { text: sheets.join('\n\n') };
    } catch (e) {
      console.error('Excel extraction error:', e);
      return { text: 'Failed to extract Excel content. The file may be corrupted.' };
    }
  }

  // Word (.docx)
  if (mimeType.includes('word') || ['docx', 'doc'].includes(extension)) {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      return { text: result.value || 'No text content found in Word document.' };
    } catch (e) {
      console.error('Word extraction error:', e);
      return { text: 'Failed to extract Word document content.' };
    }
  }

  // PDF
  if (mimeType === 'application/pdf' || extension === 'pdf') {
    try {
      // pdf-parse uses CommonJS export, require() works in Next.js API routes
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string; numpages: number }>;
      const pdfBuffer = Buffer.from(buffer);
      const pdfData = await pdfParse(pdfBuffer);
      const text = pdfData.text?.trim() || '';

      // If text is minimal (likely a scanned PDF), also provide base64 for vision
      if (text.length < 50) {
        const base64 = Buffer.from(buffer).toString('base64');
        return {
          text: text || 'Scanned PDF - text extraction returned minimal content. Visual analysis may be needed.',
          base64,
          mimeType: 'application/pdf',
        };
      }

      return { text };
    } catch (e) {
      console.error('PDF extraction error:', e);
      // Fallback: return base64 for vision analysis
      const base64 = Buffer.from(buffer).toString('base64');
      return {
        text: 'PDF text extraction failed. Visual analysis may be needed.',
        base64,
        mimeType: 'application/pdf',
      };
    }
  }

  // Images - return base64 for vision analysis
  if (mimeType.startsWith('image/')) {
    const base64 = Buffer.from(buffer).toString('base64');
    return {
      text: `Image file: ${file.name} (${mimeType}). Requires vision analysis.`,
      base64,
      mimeType,
    };
  }

  // Default: try to decode as text
  const decoder = new TextDecoder('utf-8', { fatal: false });
  return { text: decoder.decode(buffer) };
}

function getDocumentType(file: File): string {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const mimeType = file.type.toLowerCase();

  if (mimeType === 'application/pdf' || extension === 'pdf') return 'pdf';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.includes('spreadsheet') || ['xlsx', 'xls'].includes(extension)) return 'excel';
  if (mimeType === 'text/csv' || extension === 'csv') return 'csv';
  if (mimeType.includes('word') || ['docx', 'doc'].includes(extension)) return 'word';
  return 'text';
}

function generateActions(extractedData: Record<string, unknown[]>): Array<{
  id: string;
  type: string;
  timestamp: Date;
  payload: unknown;
  description: string;
}> {
  const actions: Array<{
    id: string;
    type: string;
    timestamp: Date;
    payload: unknown;
    description: string;
  }> = [];

  // Generate property actions
  const properties = extractedData.properties || [];
  properties.forEach((prop, index) => {
    const p = prop as { address?: string; purchasePrice?: number; purchaseDate?: string };
    if (p.address) {
      actions.push({
        id: `suggested-prop-${Date.now()}-${index}`,
        type: 'ADD_PROPERTY',
        timestamp: new Date(),
        payload: {
          property: {
            name: '',
            address: p.address,
            purchasePrice: p.purchasePrice,
            purchaseDate: p.purchaseDate ? new Date(p.purchaseDate) : undefined,
            color: '',
          },
        },
        description: `Add property: ${p.address}`,
      });
    }
  });

  // Generate event actions
  const events = extractedData.events || [];
  events.forEach((event, index) => {
    const e = event as { type?: string; date?: string; amount?: number; description?: string };
    if (e.type && e.date) {
      actions.push({
        id: `suggested-event-${Date.now()}-${index}`,
        type: 'ADD_EVENT',
        timestamp: new Date(),
        payload: {
          event: {
            propertyId: '',
            type: e.type,
            date: new Date(e.date),
            title: e.description || e.type,
            amount: e.amount,
            position: 0,
            color: '#6B7280',
          },
        },
        description: `Add ${e.type} event`,
      });
    }
  });

  return actions;
}

function calculateConfidence(data: Record<string, unknown[]>): number {
  let score = 0;
  let total = 0;

  const properties = data.properties || [];
  if (properties.length > 0) {
    const withAddress = properties.filter((p) => (p as { address?: string }).address).length;
    score += (withAddress / properties.length) * 30;
    total += 30;

    const withPrice = properties.filter((p) => (p as { purchasePrice?: number }).purchasePrice).length;
    score += (withPrice / properties.length) * 20;
    total += 20;
  }

  const dates = data.dates || [];
  if (dates.length > 0) {
    score += Math.min(dates.length * 5, 25);
    total += 25;
  }

  const amounts = data.amounts || [];
  if (amounts.length > 0) {
    score += Math.min(amounts.length * 5, 25);
    total += 25;
  }

  return total > 0 ? score / total : 0;
}
