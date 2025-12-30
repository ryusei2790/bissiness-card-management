import { NextResponse } from 'next/server';
import { fetchNotionDatabase } from '@/lib/notion/client';
import { createCard, updateCard, getCardByNotionId } from '@/lib/firebase/firestore';

export async function POST() {
  try {
    // Notionからデータを取得
    const notionData = await fetchNotionDatabase();

    let syncedCount = 0;
    let updatedCount = 0;
    let createdCount = 0;
    const errors: string[] = [];

    for (const data of notionData) {
      try {
        // notionIdで既存の名刺を検索
        const existingCard = await getCardByNotionId(data.notionId);

        if (existingCard) {
          // 既存の名刺を更新
          await updateCard(existingCard.id, {
            companyName: data.companyName,
            name: data.name,
            email: data.email,
            messageTemplate: data.messageTemplate,
            tags: data.tags,
          });
          updatedCount++;
        } else {
          // 新規作成
          await createCard(data);
          createdCount++;
        }

        syncedCount++;
      } catch (error: any) {
        const errorMsg = `${data.email}: ${error.message}`;
        errors.push(errorMsg);
        console.error('Sync error for card:', errorMsg);
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount,
      createdCount,
      updatedCount,
      totalNotionRecords: notionData.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Notion sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Notion同期に失敗しました',
      },
      { status: 500 }
    );
  }
}
