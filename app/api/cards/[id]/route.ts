import { NextRequest, NextResponse } from 'next/server';
import { getCardById, updateCard, deleteCard } from '@/lib/firebase/firestore';
import { CardFormData } from '@/types/card';

// GET: 名刺詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const card = await getCardById(id);

    if (!card) {
      return NextResponse.json({ error: '名刺が見つかりません' }, { status: 404 });
    }

    return NextResponse.json(card);
  } catch (error: any) {
    console.error('Error in GET /api/cards/[id]:', error);
    return NextResponse.json(
      { error: error.message || '名刺の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// PUT: 名刺更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data: Partial<CardFormData> = await request.json();

    // メールアドレスが含まれている場合はバリデーション
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return NextResponse.json(
          { error: '有効なメールアドレスを入力してください' },
          { status: 400 }
        );
      }
    }

    const card = await updateCard(id, data);

    return NextResponse.json(card);
  } catch (error: any) {
    console.error('Error in PUT /api/cards/[id]:', error);
    return NextResponse.json(
      { error: error.message || '名刺の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// DELETE: 名刺削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteCard(id);

    return NextResponse.json({ success: true, message: '名刺を削除しました' });
  } catch (error: any) {
    console.error('Error in DELETE /api/cards/[id]:', error);
    return NextResponse.json(
      { error: error.message || '名刺の削除に失敗しました' },
      { status: 500 }
    );
  }
}
