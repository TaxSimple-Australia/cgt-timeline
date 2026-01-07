// Document Processor - Extracts timeline data from uploaded documents

import type {
  DocumentType,
  ProcessedDocument,
  ExtractedData,
  DateMention,
  AmountMention,
  AddressMention,
  TimelineAction,
} from '@/types/ai-builder';
import type { Property, TimelineEvent } from '@/store/timeline';
import { LLMFactory } from '../llm/LLMFactory';

export interface DocumentProcessorConfig {
  llmProvider: string;
}

export class DocumentProcessor {
  private config: DocumentProcessorConfig;

  constructor(config: DocumentProcessorConfig) {
    this.config = config;
  }

  /**
   * Process a document and extract timeline data
   */
  async process(file: File): Promise<ProcessedDocument> {
    const documentType = this.getDocumentType(file);
    const rawText = await this.extractContent(file, documentType);
    const extractedData = await this.extractWithLLM(rawText);
    const suggestedActions = this.generateActions(extractedData);

    return {
      type: documentType,
      filename: file.name,
      extractedData,
      confidence: this.calculateConfidence(extractedData),
      rawText,
      suggestedActions,
    };
  }

  /**
   * Determine document type from file
   */
  private getDocumentType(file: File): DocumentType {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const mimeType = file.type.toLowerCase();

    if (mimeType === 'application/pdf' || extension === 'pdf') {
      return 'pdf';
    }
    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)) {
      return 'image';
    }
    if (mimeType.includes('spreadsheet') || ['xlsx', 'xls'].includes(extension)) {
      return 'excel';
    }
    if (mimeType === 'text/csv' || extension === 'csv') {
      return 'csv';
    }
    if (mimeType.includes('word') || ['docx', 'doc'].includes(extension)) {
      return 'word';
    }
    return 'text';
  }

  /**
   * Extract raw content from document
   */
  private async extractContent(file: File, type: DocumentType): Promise<string> {
    switch (type) {
      case 'pdf':
        return this.extractPDFText(file);
      case 'image':
        return this.extractImageText(file);
      case 'text':
      case 'csv':
        return this.extractTextContent(file);
      default:
        return this.extractTextContent(file);
    }
  }

  /**
   * Extract text from PDF using browser-based parsing
   */
  private async extractPDFText(file: File): Promise<string> {
    // For client-side PDF parsing, we'll use the file content
    // In production, this would use pdf.js or server-side processing
    const arrayBuffer = await file.arrayBuffer();

    // Basic PDF text extraction (simplified)
    // For production, use pdf.js or send to server for processing
    const text = await this.basicPDFParse(arrayBuffer);
    return text;
  }

  /**
   * Basic PDF parsing (simplified for client-side)
   */
  private async basicPDFParse(arrayBuffer: ArrayBuffer): Promise<string> {
    // This is a simplified version - in production use pdf.js
    // or server-side processing with pdf-parse
    const bytes = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const content = decoder.decode(bytes);

    // Extract text between stream markers (simplified)
    const textMatches = content.match(/\(([^)]+)\)/g) || [];
    const extractedText = textMatches
      .map((match) => match.slice(1, -1))
      .filter((text) => text.length > 2)
      .join(' ');

    return extractedText || 'Unable to extract PDF text. Please process on server.';
  }

  /**
   * Extract text from image using Vision API
   */
  private async extractImageText(file: File): Promise<string> {
    // Convert image to base64 for Vision API
    const base64 = await this.fileToBase64(file);

    // Use LLM vision capabilities to extract text
    try {
      const llmService = LLMFactory.getProvider(this.config.llmProvider);
      const response = await llmService.chat({
        messages: [
          {
            role: 'user',
            content: `Extract all text and relevant property/financial information from this image.
            Look for: property addresses, dates, amounts, purchase prices, sale prices, rental information.

            [Image: ${base64.substring(0, 100)}...]`,
          },
        ],
        temperature: 0.1,
      });
      return response.content;
    } catch {
      return 'Unable to extract image text. Vision API not available.';
    }
  }

  /**
   * Extract plain text content
   */
  private async extractTextContent(file: File): Promise<string> {
    return await file.text();
  }

  /**
   * Convert file to base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1] || result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Use LLM to extract structured data from document content
   */
  private async extractWithLLM(content: string): Promise<ExtractedData> {
    const prompt = `Analyze the following document content and extract property and CGT timeline information.

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

    try {
      const llmService = LLMFactory.getProvider(this.config.llmProvider);
      const response = await llmService.chat({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        maxTokens: 4096,
      });

      // Parse JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this.normalizeExtractedData(parsed);
      }
    } catch (error) {
      console.error('LLM extraction error:', error);
    }

    // Return empty data if extraction fails
    return {
      properties: [],
      events: [],
      dates: [],
      amounts: [],
      addresses: [],
    };
  }

  /**
   * Normalize extracted data
   */
  private normalizeExtractedData(data: Record<string, unknown>): ExtractedData {
    return {
      properties: (data.properties as Partial<Property>[]) || [],
      events: (data.events as Partial<TimelineEvent>[]) || [],
      dates: (data.dates as DateMention[]) || [],
      amounts: (data.amounts as AmountMention[]) || [],
      addresses: (data.addresses as AddressMention[]) || [],
    };
  }

  /**
   * Generate timeline actions from extracted data
   */
  private generateActions(data: ExtractedData): TimelineAction[] {
    const actions: TimelineAction[] = [];

    // Create add property actions
    data.properties.forEach((prop, index) => {
      if (prop.address) {
        actions.push({
          id: `suggested-${Date.now()}-${index}`,
          type: 'ADD_PROPERTY',
          timestamp: new Date(),
          payload: {
            property: {
              name: (prop as { name?: string }).name || '',
              address: prop.address || '',
              purchasePrice: prop.purchasePrice,
              purchaseDate: prop.purchaseDate ? new Date(prop.purchaseDate as unknown as string) : undefined,
              color: '',
            },
          },
          description: `Add property: ${prop.address}`,
        });
      }
    });

    // Create add event actions
    data.events.forEach((event, index) => {
      const eventData = event as Record<string, unknown>;
      if (eventData.type && eventData.date) {
        actions.push({
          id: `suggested-event-${Date.now()}-${index}`,
          type: 'ADD_EVENT',
          timestamp: new Date(),
          payload: {
            event: {
              propertyId: '', // Will be resolved later
              type: eventData.type as TimelineEvent['type'],
              date: new Date(eventData.date as string),
              title: (eventData.description as string) || '',
              amount: eventData.amount as number,
              position: 0,
              color: '#6B7280',
            },
          },
          description: `Add ${eventData.type} event`,
        });
      }
    });

    return actions;
  }

  /**
   * Calculate confidence score for extracted data
   */
  private calculateConfidence(data: ExtractedData): number {
    let score = 0;
    let total = 0;

    // Properties with addresses
    if (data.properties.length > 0) {
      const withAddress = data.properties.filter((p) => p.address).length;
      score += (withAddress / data.properties.length) * 30;
      total += 30;
    }

    // Properties with prices
    if (data.properties.length > 0) {
      const withPrice = data.properties.filter((p) => p.purchasePrice).length;
      score += (withPrice / data.properties.length) * 20;
      total += 20;
    }

    // Dates found
    if (data.dates.length > 0) {
      score += Math.min(data.dates.length * 5, 25);
      total += 25;
    }

    // Amounts found
    if (data.amounts.length > 0) {
      score += Math.min(data.amounts.length * 5, 25);
      total += 25;
    }

    return total > 0 ? score / total : 0;
  }
}
