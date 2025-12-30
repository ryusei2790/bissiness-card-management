import { google } from 'googleapis';
import { MailRecipient } from '@/types/mail';

export interface SendEmailResult {
  success: boolean;
  sentCount: number;
  failedEmails: string[];
  error?: string;
}

// Gmail API クライアントの初期化
function getGmailClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google'
  );

  // リフレッシュトークンを設定
  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

// メールをBase64エンコード（UTF-8対応）
function createMessage(to: string, subject: string, body: string, from: string): string {
  // 件名をRFC 2047形式でエンコード（UTF-8）
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`;

  // 本文をBase64エンコード
  const encodedBody = Buffer.from(body, 'utf-8').toString('base64');

  // MIMEヘッダー付きメッセージを構築
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    encodedBody,
  ].join('\r\n');

  // メッセージ全体をBase64 URL-safeエンコード（Gmail API用）
  const encodedMessage = Buffer.from(message, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return encodedMessage;
}

// 複数の宛先に一括メール送信
export async function sendBulkEmails(
  recipients: MailRecipient[],
  subject: string,
  body: string
): Promise<SendEmailResult> {
  try {
    // 環境変数チェック
    if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
      throw new Error('Gmail API認証情報が設定されていません');
    }

    if (!process.env.GMAIL_REFRESH_TOKEN) {
      throw new Error('Gmail リフレッシュトークンが設定されていません');
    }

    if (!process.env.GMAIL_FROM_EMAIL) {
      throw new Error('送信元メールアドレスが設定されていません');
    }

    if (recipients.length === 0) {
      return {
        success: true,
        sentCount: 0,
        failedEmails: [],
      };
    }

    const gmail = getGmailClient();
    const from = process.env.GMAIL_FROM_EMAIL;

    let sentCount = 0;
    const failedEmails: string[] = [];

    // 各宛先にメール送信（Gmail APIは一括送信非対応のため順次送信）
    for (const recipient of recipients) {
      try {
        const encodedMessage = createMessage(
          recipient.email,
          subject,
          body,
          from
        );

        await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: encodedMessage,
          },
        });

        sentCount++;

        // Gmail APIのレート制限対策（100ms待機）
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error: any) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
        failedEmails.push(recipient.email);
      }
    }

    // 結果を返す
    if (sentCount === 0) {
      return {
        success: false,
        sentCount: 0,
        failedEmails,
        error: 'すべてのメール送信に失敗しました',
      };
    }

    return {
      success: true,
      sentCount,
      failedEmails,
    };
  } catch (error: any) {
    console.error('Error sending bulk emails:', error);
    return {
      success: false,
      sentCount: 0,
      failedEmails: recipients.map((r) => r.email),
      error: error.message || 'メールの送信に失敗しました',
    };
  }
}

// 単一のメールを送信（テスト用）
export async function sendSingleEmail(
  to: string,
  subject: string,
  body: string
): Promise<boolean> {
  try {
    if (!process.env.GMAIL_FROM_EMAIL) {
      throw new Error('Gmail設定が不完全です');
    }

    const gmail = getGmailClient();
    const encodedMessage = createMessage(
      to,
      subject,
      body,
      process.env.GMAIL_FROM_EMAIL
    );

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    return true;
  } catch (error) {
    console.error('Error sending single email:', error);
    return false;
  }
}
