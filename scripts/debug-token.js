/**
 * Gmail API トークン情報デバッグスクリプト
 * リフレッシュトークンに含まれているスコープを確認します
 */

const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google';

console.log('\n🔍 Gmail APIトークン情報デバッグ\n');

async function debugToken() {
  try {
    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: REFRESH_TOKEN,
    });

    // アクセストークンを取得
    console.log('📡 アクセストークンを取得中...\n');
    const { credentials } = await oauth2Client.refreshAccessToken();

    console.log('✅ トークン情報:');
    console.log('アクセストークン:', credentials.access_token?.substring(0, 30) + '...');
    console.log('トークンタイプ:', credentials.token_type);
    console.log('有効期限:', new Date(credentials.expiry_date || 0).toLocaleString('ja-JP'));

    if (credentials.scope) {
      console.log('\n📋 含まれているスコープ:');
      const scopes = credentials.scope.split(' ');
      scopes.forEach((scope, index) => {
        console.log(`  ${index + 1}. ${scope}`);
        if (scope.includes('gmail.send')) {
          console.log('     ✅ gmail.sendスコープが含まれています!');
        }
      });

      if (!credentials.scope.includes('gmail.send')) {
        console.log('\n❌ 問題発見: gmail.sendスコープが含まれていません!');
        console.log('\n解決方法:');
        console.log('1. ブラウザのキャッシュとCookieをクリア (重要!)');
        console.log('2. シークレットモード/プライベートブラウジングで再度認証');
        console.log('3. 認証時に必ず「すべて選択」をチェック');
        console.log('4. scripts/get-gmail-token.js を再実行');
      }
    } else {
      console.log('\n⚠️  スコープ情報が見つかりません');
    }

    console.log('\n');

  } catch (error) {
    console.error('\n❌ エラー:', error.message);
    console.error('\n');
    process.exit(1);
  }
}

debugToken();
