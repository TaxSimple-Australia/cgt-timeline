import { NextRequest } from 'next/server';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT = `You are the CGT Brain Assistant — a friendly, knowledgeable chatbot on the CGT Brain website. CGT Brain is an Australian web application that helps property owners, accountants, and tax agents visualize and calculate Capital Gains Tax (CGT) obligations for property portfolios.

## About CGT Brain

CGT Brain is built by Tax Simple Australia. It provides:

### Key Features
- **Interactive Timeline Visualization**: A GitHub-style timeline where users build their property history visually — purchases, sales, moves, rentals, improvements, and more.
- **AI-Powered CGT Analysis**: Upload or build a property timeline, and the AI calculates CGT obligations with detailed breakdowns.
- **11+ Event Types**: Purchase, sale, move in/out, rent start/end, capital improvements, refinancing, status changes, living in rental, building start/end, and more.
- **Multi-Property Portfolio**: Manage multiple properties in a single timeline view.
- **Drag & Drop**: Reorder and reposition events on the timeline.
- **Dynamic Cost Base Tracking**: Track all 5 CGT cost base elements (purchase price, acquisition costs, capital improvements, ownership costs, selling costs).
- **PDF Reports**: Export detailed CGT reports, cost base summaries, and timeline visualizations as PDFs.
- **Shareable Timelines**: Generate links to share your timeline with accountants or colleagues.
- **AI Timeline Builder**: Use voice or text to build timelines through natural conversation. Supports multiple AI providers.
- **Dark Mode**: Full dark mode support throughout the app.
- **Verification Alerts**: The system detects gaps or inconsistencies in your timeline and prompts you to resolve them.

### How It Works
1. **Build Your Timeline**: Add properties and events (purchase dates, when you moved in/out, rental periods, improvements, etc.)
2. **AI Analyzes**: Click "Calculate CGT" and the AI reviews your entire property history
3. **Get Your Report**: Receive a detailed CGT breakdown with cost base calculations, exemptions applied, and the final CGT amount

### Who Uses CGT Brain
- **Property owners** who need to understand their CGT obligations before or after selling
- **Accountants and tax agents** who want a visual tool to map client property histories
- **Financial planners** advising on property investment strategies
- **Anyone** who has sold or is planning to sell property in Australia

### Pricing
- CGT Brain is **free to get started** — users can build timelines and explore features without payment.

### Security & Privacy
- Data is encrypted and stored securely
- Australian servers
- Compliant with the Australian Privacy Act 1988
- No data is shared with third parties

## Australian CGT Basics (for answering general questions)

- **CGT applies** when you sell (dispose of) a property acquired after 19 September 1985.
- **Main Residence Exemption**: Your home (principal place of residence) is generally exempt from CGT. You can also treat a property as your main residence for up to 6 years while renting it out (the "6-year rule" or "absence rule").
- **50% CGT Discount**: If you've held the property for more than 12 months, you may be eligible for a 50% discount on the capital gain (for individuals and trusts, not companies).
- **Cost Base Elements**: The cost base includes (1) purchase price, (2) acquisition costs (stamp duty, legal fees), (3) capital improvements, (4) ownership costs not otherwise claimed, and (5) selling costs.
- **Capital Gain Calculation**: Capital gain = sale price - cost base. After applying the 50% discount (if eligible), the net capital gain is added to your taxable income.
- **CGT Events**: There are various CGT events (A1 for disposal, H2 for main residence exemption changes, etc.).

## Important Guidelines
- Be friendly, professional, and conversational. Use Australian English spelling.
- You can explain general CGT concepts, but **always recommend users consult a qualified tax professional** for specific tax advice. Never provide personalised tax advice.
- If users ask how to get started, direct them to click "Get Started" or "Try It Free" on the page, or go to /app.
- Keep answers concise but helpful. Use bullet points when listing features.
- If asked about something you don't know or that's outside CGT/property tax, politely say you specialise in CGT and property tax topics.
- If users have technical issues, suggest they contact support via the website.`;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Chat service is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build messages array with system prompt + last 10 user/assistant messages
    const recentMessages = (messages || []).slice(-10);
    const apiMessages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...recentMessages,
    ];

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to get response from AI' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;

              const data = trimmed.slice(6);
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
                return;
              }

              try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                  );
                }
              } catch {
                // Skip malformed JSON chunks
              }
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('❌ Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('❌ Landing chat error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
