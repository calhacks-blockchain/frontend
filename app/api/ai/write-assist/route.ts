import { NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

type Action = 'proofread' | 'rewrite' | 'compose';

interface WriteAssistRequest {
  action: Action;
  text?: string;
  prompt?: string;
  context?: {
    fieldLabel?: string;
    companyName?: string;
    tagline?: string;
    [key: string]: string | undefined;
  };
  maxLength?: number;
}

function buildPrompt(request: WriteAssistRequest): string {
  const { action, text, prompt, context, maxLength } = request;
  const limit = maxLength || 1000;
  const fieldLabel = context?.fieldLabel || 'text';

  switch (action) {
    case 'proofread':
      return `Review and correct any spelling, grammar, or punctuation errors in the following text. Maintain the original meaning and tone. Only fix errors, don't rewrite. Keep the response under ${limit} characters.

Text: ${text}`;

    case 'rewrite':
      return `Rewrite the following text to be more clear, compelling, and professional. This is for a ${fieldLabel} in a startup pitch. Keep the core message but improve clarity and impact. Keep the response under ${limit} characters.

Text: ${text}`;

    case 'compose':
      const contextLines = Object.entries(context || {})
        .filter(([key, value]) => value && key !== 'fieldLabel')
        .map(([key, value]) => `- ${key}: ${value}`)
        .join('\n');

      return `Write a compelling ${fieldLabel} for a startup pitch based on this prompt: ${prompt}

${contextLines ? `Context:\n${contextLines}\n` : ''}
Keep it professional, concise, and compelling. Keep the response under ${limit} characters.`;

    default:
      throw new Error('Invalid action');
  }
}

export async function POST(request: Request) {
  try {
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const body: WriteAssistRequest = await request.json();
    const { action, text, prompt } = body;

    // Validation
    if (!action || !['proofread', 'rewrite', 'compose'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be proofread, rewrite, or compose.' },
        { status: 400 }
      );
    }

    if ((action === 'proofread' || action === 'rewrite') && !text) {
      return NextResponse.json(
        { error: 'Text is required for proofread and rewrite actions.' },
        { status: 400 }
      );
    }

    if (action === 'compose' && !prompt) {
      return NextResponse.json(
        { error: 'Prompt is required for compose action.' },
        { status: 400 }
      );
    }

    // Build the prompt
    const systemPrompt = buildPrompt(body);

    // Call Claude API
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: systemPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Claude API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate suggestion' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const suggestion = data.content?.[0]?.text || '';

    if (!suggestion) {
      return NextResponse.json(
        { error: 'No suggestion generated' },
        { status: 500 }
      );
    }

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('Write assist error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}


