import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), 'reviews.csv');
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json(
        { success: false, message: 'reviews.csv not found on server' },
        { status: 404 }
      );
    }
    const content = fs.readFileSync(csvPath, 'utf-8');
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="reviews.csv"',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error reading sample file' },
      { status: 500 }
    );
  }
}
