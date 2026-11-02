import { NextRequest, NextResponse } from 'next/server';
import { getPaperById } from '@/lib/research/feed';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const paper = await getPaperById(id);

    if (!paper) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    return NextResponse.json(paper, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error: any) {
    console.error(`API /api/research/[id] error:`, error);
    return NextResponse.json(
      { error: 'Internal server error while fetching paper', details: error?.message },
      { status: 500 }
    );
  }
}
