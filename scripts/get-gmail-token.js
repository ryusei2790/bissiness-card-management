/**
 * Gmail API リフレッシュトークン取得スクリプト
 *
 * 使い方:
 * 1. Google Cloud ConsoleでOAuth 2.0クライアントIDを作成
 * 2. GMAIL_CLIENT_IDとGMAIL_CLIENT_SECRETを.env.localに設定
 * 3. このスクリプトを実行: node scripts/get-gmail-token.js
 */

const { google } = require('googleapis');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ エラー: GMAIL_CLIENT_IDとGMAIL_CLIENT_SECRETを.env.localに設定してください');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// ステップ1: 認証URLを生成
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/gmail.send'],
  prompt: 'consent' // 毎回リフレッシュトークンを取得
});

console.log('\n📧 Gmail APIリフレッシュトークン取得\n');
console.log('ステップ1: 以下のURLをブラウザで開いてください:\n');
console.log(authUrl);
console.log('\n');

// ステップ2: 認証コードを入力
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('ステップ2: 認証後のリダイレクトURLから「code=...」の部分をコピーしてここに貼り付けてください:\n', async (code) => {
  try {
    // ステップ3: トークンを取得
    const { tokens } = await oauth2Client.getToken(code.trim());

    console.log('\n✅ 成功! 以下を.env.localに追加してください:\n');
    console.log('GMAIL_REFRESH_TOKEN=' + tokens.refresh_token);
    console.log('\n');

    if (tokens.access_token) {
      console.log('アクセストークンも取得されました（自動で更新されます）:');
      console.log('Access Token:', tokens.access_token.substring(0, 20) + '...');
    }

  } catch (error) {
    console.error('\n❌ エラー:', error.message);
    console.error('認証コードが正しいか確認してください');
  }

  rl.close();
});
