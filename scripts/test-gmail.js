/**
 * Gmail API テストスクリプト
 *
 * 使い方:
 * 1. .env.localに全てのGMAIL_*環境変数を設定
 * 2. このスクリプトを実行: node scripts/test-gmail.js
 */

const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;
const FROM_EMAIL = process.env.GMAIL_FROM_EMAIL;
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google';

console.log('\n📧 Gmail API 設定確認\n');

// 環境変数チェック
let hasError = false;

if (!CLIENT_ID) {
  console.error('❌ GMAIL_CLIENT_IDが設定されていません');
  hasError = true;
} else {
  console.log('✅ GMAIL_CLIENT_ID: ' + CLIENT_ID.substring(0, 20) + '...');
}

if (!CLIENT_SECRET) {
  console.error('❌ GMAIL_CLIENT_SECRETが設定されていません');
  hasError = true;
} else {
  console.log('✅ GMAIL_CLIENT_SECRET: ' + CLIENT_SECRET.substring(0, 10) + '...');
}

if (!REFRESH_TOKEN) {
  console.error('❌ GMAIL_REFRESH_TOKENが設定されていません');
  hasError = true;
} else {
  console.log('✅ GMAIL_REFRESH_TOKEN: ' + REFRESH_TOKEN.substring(0, 20) + '...');
}

if (!FROM_EMAIL) {
  console.error('❌ GMAIL_FROM_EMAILが設定されていません');
  hasError = true;
} else {
  console.log('✅ GMAIL_FROM_EMAIL: ' + FROM_EMAIL);
}

if (hasError) {
  console.error('\n環境変数を.env.localに設定してください');
  process.exit(1);
}

// Gmail API接続テスト
async function testGmailConnection() {
  try {
    console.log('\n📨 Gmail API接続テスト中...\n');

    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: REFRESH_TOKEN,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // プロフィール情報を取得（API接続確認）
    const profile = await gmail.users.getProfile({ userId: 'me' });

    console.log('✅ Gmail API接続成功!');
    console.log('メールアドレス:', profile.data.emailAddress);
    console.log('合計メッセージ数:', profile.data.messagesTotal);
    console.log('\n準備完了! アプリケーションからメール送信できます。\n');

  } catch (error) {
    console.error('\n❌ Gmail API接続エラー:\n');

    if (error.message.includes('invalid_grant')) {
      console.error('リフレッシュトークンが無効または期限切れです。');
      console.error('scripts/get-gmail-token.js を実行して新しいトークンを取得してください。');
    } else if (error.message.includes('invalid_client')) {
      console.error('クライアントIDまたはシークレットが正しくありません。');
    } else {
      console.error(error.message);
    }

    console.error('\n');
    process.exit(1);
  }
}

testGmailConnection();
