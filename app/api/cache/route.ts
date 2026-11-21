import { NextResponse } from 'next/server';
import { reviewCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  const stats = reviewCache.stats();
  return NextResponse.json({
    success: true,
    ...stats,
  });
}

export async function DELETE() {
  reviewCache.clear();
  return NextResponse.json({
    success: true,
    message: 'Cache successfully cleared',
  });
}
