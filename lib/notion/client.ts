import { Client } from '@notionhq/client';
import { CardFormData } from '@/types/card';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// データベースIDをハイフン付きフォーマットに変換
function formatDatabaseId(id: string): string {
  // 既にハイフンが含まれている場合はそのまま返す
  if (id.includes('-')) {
    return id;
  }
  // ハイフンなしの32文字の場合、UUID形式に変換
  // 形式: 8-4-4-4-12
  if (id.length === 32) {
    return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
  }
  return id;
}

const databaseId = formatDatabaseId(process.env.NOTION_DATABASE_ID!);

interface NotionCardData extends CardFormData {
  notionId: string;
}

// Notionデータベースからすべてのデータを取得
export async function fetchNotionDatabase(): Promise<NotionCardData[]> {
  try {
    if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
      throw new Error('Notion APIキーまたはデータベースIDが設定されていません');
    }

    // まずデータベース情報を取得してデータソースIDを抽出
    console.log('Fetching database with ID:', databaseId);
    const database = await notion.databases.retrieve({
      database_id: databaseId,
    });
    console.log('Database retrieved:', JSON.stringify(database, null, 2));

    // データベースから最初のデータソースIDを取得
    if (!('data_sources' in database) || !database.data_sources || database.data_sources.length === 0) {
      console.error('Database object:', database);
      throw new Error('データベースにデータソースが見つかりません');
    }

    const dataSourceId = database.data_sources[0].id;
    console.log('Using data source ID:', dataSourceId);

    // データソースをクエリ
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
    });
    console.log('Query response:', JSON.stringify(response, null, 2));

    const cards: NotionCardData[] = [];

    for (const page of response.results) {
      if ('properties' in page) {
        try {
          // Notionのプロパティ名に合わせてマッピング
          // title (代表者名) -> name
          // Company -> companyName
          // Email -> email
          // Text -> messageTemplate
          const card: NotionCardData = {
            notionId: page.id,
            companyName: extractRichText(page.properties, 'Company') || '',
            name: extractTitle(page.properties) || '', // titleフィールド（代表者名）
            email: extractEmail(page.properties, 'Email') || '',
            messageTemplate: extractRichText(page.properties, 'Text') || '',
            tags: extractMultiSelect(page.properties, 'タグ'),
          };

          console.log('Parsed card:', card);

          // 必須フィールドがすべて存在する場合のみ追加
          if (card.companyName && card.name && card.email) {
            cards.push(card);
          } else {
            console.log('Skipping card due to missing fields:', {
              companyName: card.companyName,
              name: card.name,
              email: card.email,
            });
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
