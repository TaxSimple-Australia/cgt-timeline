import { NextRequest, NextResponse } from 'next/server';
import { LLMFactory } from '@/lib/ai-builder/llm';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const llmProvider = (formData.get('llmProvider') as string) || 'deepseek';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
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
    const content = await extractFileContent(file, buffer);

    // Use LLM to extract structured data
    const llmService = LLMFactory.getProvider(llmProvider);

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
${content.substring(0, 15000)}

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

    const response = await llmService.chat({
      messages: [{ role: 'user', content: extractionPrompt }],
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
      rawText: content.substring(0, 5000), // Truncate for response
      suggestedActions,
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

async function extractFileContent(file: File, buffer: ArrayBuffer): Promise<string> {
  const mimeType = file.type.toLowerCase();
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  // Text files
  if (
    mimeType.startsWith('text/') ||
    ['txt', 'csv', 'md'].includes(extension)
  ) {
    const decoder = new TextDecoder();
    return decoder.decode(buffer);
  }

  // PDF (basic extraction - for production use pdf-parse)
  if (mimeType === 'application/pdf' || extension === 'pdf') {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const content = decoder.decode(buffer);

    // Basic PDF text extraction
    const textMatches = content.match(/\(([^)]+)\)/g) || [];
    const extractedText = textMatches
      .map((match) => match.slice(1, -1))
      .filter((text) => text.length > 2 && /[a-zA-Z]/.test(text))
      .join(' ');

    return extractedText || 'PDF content could not be extracted directly. The document may need OCR processing.';
  }

  // Default: try to decode as text
  const decoder = new TextDecoder('utf-8', { fatal: false });
  return decoder.decode(buffer);
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
