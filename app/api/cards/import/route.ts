import { NextRequest, NextResponse } from 'next/server';
import { createCard, getCardByEmail } from '@/lib/firebase/firestore';
import Papa from 'papaparse';
import { CardFormData } from '@/types/card';
import Encoding from 'encoding-japanese';

interface SpreadsheetRow {
  '企業名': string;
  'HP': string;
  '連絡手段': string;
  'エリア': string;
  '所在': string;
  '連絡先(メール)': string;
  '連絡先(電話)': string;
  'アプローチ状況': string;
  'メモ': string;
  '担当部署': string;
  '担当者名': string;
  '役職': string;
  [key: string]: string; // 動的なキーにも対応
}

// カラム名の正規化（全角・半角スペース、タブを除去し、全角カッコを半角に統一）
function normalizeColumnName(name: string): string {
  return name
    .replace(/[\s\u3000\t]/g, '') // スペース・タブ削除
    .replace(/（/g, '(')  // 全角カッコを半角に
    .replace(/）/g, ')'); // 全角カッコを半角に
}

// カラム名のマッピング（柔軟な対応）
function getColumnValue(row: any, ...possibleNames: string[]): string | undefined {
  // 正規化されたキーでマッピングを作成
  const normalizedRow: { [key: string]: string } = {};
  Object.keys(row).forEach(key => {
    const normalizedKey = normalizeColumnName(key);
    normalizedRow[normalizedKey] = row[key];
  });

  // 可能な名前から値を取得
  for (const name of possibleNames) {
    const normalizedName = normalizeColumnName(name);
    if (normalizedRow[normalizedName]) {
      return normalizedRow[normalizedName];
    }
  }
  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      );
    }

    // CSVファイルかチェック
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'CSVファイルを選択してください' },
        { status: 400 }
      );
    }

    // ファイルをバイナリとして読み込み、エンコーディングを検出
    const arrayBuffer = await file.arrayBuffer();
    const codes = new Uint8Array(arrayBuffer);
    
    // エンコーディングを検出
    const detectedEncoding = Encoding.detect(codes);
    console.log('Detected encoding:', detectedEncoding);
    
    // UTF-8に変換
    const unicodeArray = Encoding.convert(codes, {
      to: 'UNICODE',
      from: detectedEncoding || 'AUTO',
      type: 'array'
    });
    
    // 文字列に変換
    const text = Encoding.codeToString(unicodeArray);
    console.log('CSV text preview:', text.substring(0, 200));

    // PapaparseでCSVをパース
    const parseResult = Papa.parse<SpreadsheetRow>(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (parseResult.errors.length > 0) {
      console.error('CSV parse errors:', parseResult.errors);
      return NextResponse.json(
        { error: 'CSVファイルの解析に失敗しました', details: parseResult.errors },
        { status: 400 }
      );
    }

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // デバッグ: CSVのヘッダーを確認
    if (parseResult.data.length > 0) {
      const headers = Object.keys(parseResult.data[0]);
      console.log('CSV Headers (original):', headers);
      console.log('CSV Headers (normalized):', headers.map(h => normalizeColumnName(h)));
      console.log('First row sample:', parseResult.data[0]);
    }

    for (const row of parseResult.data) {
      try {
        // 柔軟なカラム名マッピング
        let companyName = getColumnValue(row, '企業名', '会社名', 'Company')?.trim();
        let name = getColumnValue(row, '担当者名', '名前', 'Name', '氏名')?.trim();
        const email = getColumnValue(row, '連絡先(メール)', 'メール', 'Email', 'メールアドレス', '連絡先（メール）')?.trim();

        // 担当者名が空の場合、企業名から抽出を試みる
        if (companyName && !name) {
          // 企業名を担当者名として使用
          name = companyName;
          console.log(`担当者名が空のため、企業名を使用: ${name}`);
        }

        console.log('Processing row:', { companyName, name, email, rawRow: row });

        if (!companyName || !name || !email) {
          skippedCount++;
          const availableKeys = Object.keys(row).join(', ');
          errors.push(`行をスキップ: 必須項目が不足 (企業名: ${companyName}, 担当者名: ${name}, メール: ${email}). 利用可能なキー: ${availableKeys}`);
          continue;
        }

        // メールアドレスのバリデーション
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          skippedCount++;
          errors.push(`行をスキップ: 無効なメールアドレス (${email})`);
          continue;
        }

        // タグの作成
        const tags: string[] = [];
        const area = getColumnValue(row, 'エリア', 'Area')?.trim();
        const status = getColumnValue(row, 'アプローチ状況', '状況', 'Status')?.trim();
        const dept = getColumnValue(row, '担当部署', '部署', 'Department')?.trim();
        const position = getColumnValue(row, '役職', 'Position')?.trim();
        const contact = getColumnValue(row, '連絡手段', 'Contact')?.trim();

        if (area) tags.push(`エリア:${area}`);
        if (status) tags.push(`状況:${status}`);
        if (dept) tags.push(`部署:${dept}`);
        if (position) tags.push(`役職:${position}`);
        if (contact) tags.push(`連絡:${contact}`);

        // CardFormDataの作成
        const memo = getColumnValue(row, 'メモ', 'Memo', 'Note')?.trim();
        const cardData: CardFormData = {
          companyName,
          name,
          email,
          messageTemplate: memo || '',
          tags: tags.length > 0 ? tags : undefined,
        };

        // 既存のカードをチェック
        const existingCard = await getCardByEmail(email);

        if (existingCard) {
          // 既存のカードがある場合はスキップ
          skippedCount++;
          console.log(`Skipping card due to duplicate email: ${email}`);
        } else {
          // 新規作成
          await createCard(cardData);
          createdCount++;
          console.log(`Card created successfully: ${name} (${email})`);
        }
      } catch (error: any) {
        const errorMsg = `${row['連絡先(メール)']}: ${error.message}`;
        errors.push(errorMsg);
        console.error('Import error for row:', errorMsg, error);
      }
    }

    console.log(`Import completed: ${createdCount} created, ${skippedCount} skipped, ${errors.length} errors`);

    return NextResponse.json({
      success: true,
      createdCount,
      skippedCount,
      totalRows: parseResult.data.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('CSV import error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'CSVのインポートに失敗しました',
      },
      { status: 500 }
    );
  }
}
