import { NextRequest, NextResponse } from 'next/server';
import { getCardById, saveMailHistory } from '@/lib/firebase/firestore';
import { sendBulkEmails } from '@/lib/gmail/client';
import { MailSendRequest, MailRecipient } from '@/types/mail';

export async function POST(request: NextRequest) {
  try {
    const { cardIds, subject, body }: MailSendRequest = await request.json();

    // バリデーション
    if (!cardIds || cardIds.length === 0) {
      return NextResponse.json(
        { error: '宛先を選択してください' },
        { status: 400 }
      );
    }

    if (!subject || !body) {
      return NextResponse.json(
        { error: '件名と本文を入力してください' },
        { status: 400 }
      );
    }

    // 名刺情報を取得して宛先リストを作成
    const recipients: MailRecipient[] = [];
    const notFoundIds: string[] = [];

    for (const id of cardIds) {
      const card = await getCardById(id);
      if (card) {
        recipients.push({
          cardId: id,
          email: card.email,
          name: card.name,
          companyName: card.companyName,
        });
      } else {
        notFoundIds.push(id);
      }
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: '有効な宛先が見つかりません' },
        { status: 400 }
      );
    }

    // メールを一括送信
    const result = await sendBulkEmails(recipients, subject, body);

    // 送信履歴を保存
    try {
      await saveMailHistory({
        recipients,
        subject,
        body,
        sentAt: new Date(),
        status: result.success ? 'success' : 'failed',
        errors: result.failedEmails.map((email) => ({
          email,
          message: '送信失敗',
        })),
      });
    } catch (error) {
      console.error('Error saving mail history:', error);
      // 履歴保存エラーは警告のみで処理を継続
    }

    // レスポンス
    return NextResponse.json({
      success: result.success,
      sentCount: result.sentCount,
      failedEmails: result.failedEmails,
      notFoundIds: notFoundIds.length > 0 ? notFoundIds : undefined,
      message: result.success
        ? `${result.sentCount}件のメールを送信しました`
        : 'メールの送信に失敗しました',
    });
  } catch (error: any) {
    console.error('Error in POST /api/mail/send:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'メール送信処理に失敗しました',
      },
      { status: 500 }
    );
  }
}
