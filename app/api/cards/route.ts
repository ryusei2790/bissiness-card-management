import { NextRequest, NextResponse } from 'next/server';
import { getCards, createCard } from '@/lib/firebase/firestore';
import { CardFormData } from '@/types/card';

// GET: 名刺一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;

    const cards = await getCards(search);

    return NextResponse.json(cards);
  } catch (error: any) {
    console.error('Error in GET /api/cards:', error);
    return NextResponse.json(
      { error: error.message || '名刺の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// POST: 名刺新規作成
export async function POST(request: NextRequest) {
  try {
    const data: CardFormData = await request.json();

    // バリデーション
    if (!data.companyName || !data.name || !data.email) {
      return NextResponse.json(
        { error: '会社名、名前、メールアドレスは必須です' },
        { status: 400 }
      );
    }

    // メールアドレスの簡易バリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      );
    }

    const card = await createCard(data);

    return NextResponse.json(card, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/cards:', error);
    return NextResponse.json(
      { error: error.message || '名刺の作成に失敗しました' },
      { status: 500 }
    );
  }
}
