import { NextRequest, NextResponse } from 'next/server';
import { generateSuggestedReply, detectLlmConfig } from '@/lib/llm-client';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { review_id, product, rating, review_text, summary, topics } = body;

    if (!review_text && !summary) {
      return NextResponse.json(
        { success: false, message: 'Missing review text or summary' },
        { status: 400 }
      );
    }

    const config = detectLlmConfig();

    const suggestedReply = await generateSuggestedReply(
      {
        review_id: review_id || 'RXXX',
        product: product || 'Product',
        rating: typeof rating === 'number' ? rating : null,
        rating_raw: String(rating || ''),
        date: '',
        review_text: review_text || '',
        cleaned_text: review_text || '',
        text_hash: '',
        is_empty: false,
        is_duplicate: false,
        duplicate_of: null,
        status: 'valid',
      },
      {
        sentiment: 'negative',
        summary: summary || review_text,
        topics: Array.isArray(topics) ? topics : ['quality'],
      },
      config
    );

    return NextResponse.json({
      success: true,
      reply: suggestedReply,
    });
  } catch (error: any) {
    console.error('API Error in /api/suggest-reply:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to generate suggested reply',
      },
      { status: 500 }
    );
  }
}
