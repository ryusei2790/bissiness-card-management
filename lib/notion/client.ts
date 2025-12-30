import { Client } from '@notionhq/client';
import { CardFormData } from '@/types/card';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const databaseId = process.env.NOTION_DATABASE_ID!;

interface NotionCardData extends CardFormData {
  notionId: string;
}

// Notionデータベースからすべてのデータを取得
export async function fetchNotionDatabase(): Promise<NotionCardData[]> {
  try {
    if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
      throw new Error('Notion APIキーまたはデータベースIDが設定されていません');
    }

    const response = await notion.databases.query({
      database_id: databaseId,
    });

    const cards: NotionCardData[] = [];

    for (const page of response.results) {
      if ('properties' in page) {
        try {
          const card: NotionCardData = {
            notionId: page.id,
            companyName: extractTitle(page.properties),
            name: extractRichText(page.properties, '名前') || '',
            email: extractEmail(page.properties, 'メールアドレス') || '',
            messageTemplate: extractRichText(page.properties, '送信テキスト') || '',
            tags: extractMultiSelect(page.properties, 'タグ'),
          };

          // 必須フィールドがすべて存在する場合のみ追加
          if (card.companyName && card.name && card.email) {
            cards.push(card);
          }
        } catch (error) {
          console.error('Error parsing Notion page:', error);
          // 個別のページエラーは無視して継続
        }
      }
    }

    return cards;
  } catch (error) {
    console.error('Error fetching Notion database:', error);
    throw new Error('Notionデータベースの取得に失敗しました');
  }
}

// Notionプロパティからタイトル（会社名）を抽出
function extractTitle(properties: any): string {
  for (const key in properties) {
    const property = properties[key];
    if (property.type === 'title' && property.title && property.title.length > 0) {
      return property.title[0].plain_text || '';
    }
  }
  return '';
}

// Notionプロパティから Rich Text を抽出
function extractRichText(properties: any, propertyName: string): string {
  const property = properties[propertyName];
  if (!property) return '';

  if (property.type === 'rich_text' && property.rich_text && property.rich_text.length > 0) {
    return property.rich_text.map((text: any) => text.plain_text).join('');
  }

  return '';
}

// Notionプロパティから Email を抽出
function extractEmail(properties: any, propertyName: string): string {
  const property = properties[propertyName];
  if (!property) return '';

  if (property.type === 'email' && property.email) {
    return property.email;
  }

  return '';
}

// Notionプロパティから Multi-select を抽出
function extractMultiSelect(properties: any, propertyName: string): string[] {
  const property = properties[propertyName];
  if (!property) return [];

  if (property.type === 'multi_select' && property.multi_select) {
    return property.multi_select.map((option: any) => option.name);
  }

  return [];
}
