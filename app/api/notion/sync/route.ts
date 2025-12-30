import { NextResponse } from 'next/server';
import { fetchNotionDatabase } from '@/lib/notion/client';
import { createCard, updateCard, getCardByNotionId, getCardByEmail } from '@/lib/firebase/firestore';

export async function POST() {
  try {
    // Notionからデータを取得
    console.log('Starting Notion sync...');
    const notionData = await fetchNotionDatabase();
    console.log(`Fetched ${notionData.length} records from Notion`);

    let syncedCount = 0;
    let updatedCount = 0;
    let createdCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const data of notionData) {
      try {
        console.log(`Processing card: ${data.name} (${data.email})`);

        // notionIdで既存の名刺を検索
        let existingCard = await getCardByNotionId(data.notionId);
        console.log(`Existing card by notionId:`, existingCard ? 'Yes' : 'No');

        // notionIdで見つからなければ、メールアドレスで検索
        if (!existingCard) {
          existingCard = await getCardByEmail(data.email);
          console.log(`Existing card by email:`, existingCard ? 'Yes' : 'No');
        }

        if (existingCard) {
          // 既存の名刺が見つかった場合
          if (existingCard.notionId === data.notionId) {
            // 同じnotionIdの場合は更新
            console.log(`Updating card: ${existingCard.id}`);
            await updateCard(existingCard.id, {
              companyName: data.companyName,
              name: data.name,
              email: data.email,
              messageTemplate: data.messageTemplate,
              tags: data.tags,
            });
            updatedCount++;
            console.log(`Card updated successfully`);
          } else {
            // メールアドレスが重複している場合はスキップ
            console.log(`Skipping card due to duplicate email: ${data.email}`);
            skippedCount++;
          }
        } else {
          // 新規作成
          console.log(`Creating new card for: ${data.name}`);
          const newCard = await createCard(data);
          createdCount++;
          console.log(`Card created successfully with ID: ${newCard.id}`);
        }

        syncedCount++;
      } catch (error: any) {
        const errorMsg = `${data.email}: ${error.message}`;
        errors.push(errorMsg);
        console.error('Sync error for card:', errorMsg, error);
      }
    }

    console.log(`Sync completed: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped, ${errors.length} errors`);

    return NextResponse.json({
      success: true,
      syncedCount,
      createdCount,
      updatedCount,
      skippedCount,
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
