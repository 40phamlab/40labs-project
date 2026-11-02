import { NextRequest, NextResponse } from 'next/server';
import { getFeed } from '@/lib/research/feed';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || undefined;
    const topic = searchParams.get('topic') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '12', 10);

    const feedResult = await getFeed({ q, topic, page, pageSize });

    const revalidateTime = q ? 300 : 3600;

    return NextResponse.json(feedResult, {
      status: 200,
      headers: {
        'Cache-Control': `public, s-maxage=${revalidateTime}, stale-while-revalidate=600`,
      },
    });
  } catch (error: any) {
    console.error('API /api/research error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching research feed', details: error?.message },
      { status: 500 }
    );
  }
}
