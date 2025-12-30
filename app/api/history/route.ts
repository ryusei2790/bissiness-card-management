import { NextRequest, NextResponse } from 'next/server';
import { getMailHistory } from '@/lib/firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // ページネーション パラメータのバリデーション
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: '無効なページネーションパラメータです' },
        { status: 400 }
      );
    }

    const { history, total } = await getMailHistory(page, limit);

    return NextResponse.json({
      history,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Error in GET /api/history:', error);
    return NextResponse.json(
      { error: error.message || '送信履歴の取得に失敗しました' },
      { status: 500 }
    );
  }
}
