/**
 * Gmail API メール送信テストスクリプト
 * 実際にメール送信機能をテストします
 */

const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;
const FROM_EMAIL = process.env.GMAIL_FROM_EMAIL;
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google';

console.log('\n📧 Gmail API メール送信テスト\n');

// メールをBase64エンコード
function createMessage(to, subject, body, from) {
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    '',
    body,
  ].join('\n');

  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return encodedMessage;
}

async function testSendEmail() {
  try {
    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: REFRESH_TOKEN,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    console.log('📨 テストメール送信中...');
    console.log(`送信元: ${FROM_EMAIL}`);
    console.log(`送信先: ${FROM_EMAIL} (自分宛にテスト送信)\n`);

    const encodedMessage = createMessage(
      FROM_EMAIL, // 自分宛に送信
      'Gmail API テスト送信',
      'このメールはGmail APIのテスト送信です。\n\n正常に動作しています！',
      FROM_EMAIL
    );

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log('✅ メール送信成功!');
    console.log('メッセージID:', result.data.id);
    console.log('\nGmail APIは正常に動作しています。');
    console.log(`${FROM_EMAIL} の受信トレイを確認してください。\n`);

  } catch (error) {
    console.error('\n❌ メール送信エラー:\n');

    if (error.message.includes('insufficient')) {
      console.error('スコープが不足しています。');
      console.error('これは予期しないエラーです。debug-token.jsではスコープが確認できています。');
    } else if (error.message.includes('Daily sending quota exceeded')) {
      console.error('1日の送信上限(500通)を超えました。明日再度お試しください。');
    } else {
      console.error(error.message);
    }

    console.error('\n');
    process.exit(1);
  }
}

testSendEmail();
