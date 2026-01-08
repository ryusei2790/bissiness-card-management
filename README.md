# 名刺管理・メール送信アプリ

Notionデータベースと連携した名刺管理とメール一括送信システム

## 機能

- 📧 **メール一括送信**: 宛先を選択して複数人に一括でメール送信
- 👤 **名刺管理**: 名刺の登録・編集・削除
- 🔄 **Notion同期**: Notionデータベースから名刺情報を同期
- 📋 **送信履歴**: メール送信履歴の閲覧

## 技術スタック

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Firestore, Notion
- **Email**: Gmail API
- **Deploy**: Cloud Run

## セットアップ

### 1. 必要な環境

- Node.js 18以上
- npm または yarn

### 2. パッケージインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.local` ファイルを作成し、以下を設定:

```env
# Notion API
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_database_id

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account@project.iam.gserviceaccount.com

# Gmail API
GMAIL_CLIENT_ID=your_google_client_id
GMAIL_CLIENT_SECRET=your_google_client_secret
GMAIL_REFRESH_TOKEN=your_refresh_token
GMAIL_FROM_EMAIL=your_gmail_address@gmail.com

# NextAuth (オプション - 認証が必要な場合)
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 4. 外部サービスのセットアップ

#### Notion

1. [Notion Integrations](https://www.notion.so/my-integrations) で新規Integration作成
2. APIキーを取得
3. Notionでデータベース作成
4. 以下のプロパティを追加:
   - **会社名** (Title)
   - **名前** (Rich Text)
   - **メールアドレス** (Email)
   - **送信テキスト** (Rich Text)
   - **タグ** (Multi-select) - オプション
5. データベースにIntegrationを接続

#### Firebase

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクト作成
2. Firestore Database を有効化
3. サービスアカウントの秘密鍵を生成
4. `project_id`, `client_email`, `private_key` を環境変数に設定

#### Gmail API

**メリット**: 個人のGmailアカウントで無料で1日500通まで送信可能

**セットアップ手順:**

1. **Google Cloud Console でプロジェクト作成**
   - [Google Cloud Console](https://console.cloud.google.com/) にアクセス
   - 新規プロジェクトを作成（既存のFirebaseプロジェクトでもOK）

2. **Gmail API を有効化**
   - 「APIとサービス」→「ライブラリ」→「Gmail API」を検索
   - 「有効にする」をクリック

3. **OAuth同意画面を設定**（初回のみ）

   **重要**: この設定を行わないと認証時に403エラーが発生します！

   - 「APIとサービス」→「OAuth同意画面」をクリック

   **ステップ1: OAuth同意画面**
   - User Type: **外部** を選択
   - 「作成」ボタンをクリック

   **ステップ2: アプリ情報**
   - アプリ名: `Business Card App`（任意の名前でOK）
   - ユーザーサポートメール: **あなたのGmailアドレス**を選択
   - アプリのロゴ: 空欄でOK
   - アプリのドメイン: すべて空欄でOK
   - 承認済みドメイン: 空欄でOK
   - デベロッパーの連絡先情報: **あなたのGmailアドレス**を入力
   - 「保存して次へ」をクリック

   **ステップ3: スコープ**（重要！）

   **Gmail送信権限を追加する必要があります:**

   - 「スコープを追加または削除」ボタンをクリック
   - フィルタに「gmail」と入力して検索
   - 以下のスコープにチェックを入れる:
     ```
     https://www.googleapis.com/auth/gmail.send
     ```
     - 説明: 「Gmail でメールを送信する」
   - 「更新」ボタンをクリック
   - 追加されたスコープが表示されることを確認
   - 「保存して次へ」をクリック

   **注意**: このスコープを追加しないと、後で「Request had insufficient authentication scopes」エラーが発生します！

   **ステップ4: テストユーザー**（最重要！）
   - 「ADD USERS」ボタンをクリック
   - **あなたのGmailアドレス**を入力（例: `yourname@gmail.com`）
   - 「追加」をクリック
   - 追加されたメールアドレスが表示されることを確認
   - 「保存して次へ」をクリック

   **ステップ5: 概要**
   - 設定内容を確認
   - 「ダッシュボードに戻る」をクリック

   **確認ポイント:**
   - ✅ 公開ステータス: **テスト中**
   - ✅ User Type: **外部**
   - ✅ テストユーザー: **あなたのGmailアドレスが表示されている**

4. **OAuth 2.0 認証情報を作成**
   - 「APIとサービス」→「認証情報」
   - 「認証情報を作成」→「OAuth クライアント ID」を選択
   - アプリケーションの種類: **ウェブアプリケーション**
   - 名前: `Gmail API Client`（任意）
   - **承認済みのリダイレクトURI**の「URIを追加」をクリック:
     ```
     http://localhost:3000/api/auth/callback/google
     ```
   - 「作成」をクリック
   - 表示されたダイアログから以下をコピー:
     - **クライアントID**（例: `123456789-abc.apps.googleusercontent.com`）
     - **クライアントシークレット**（例: `GOCSPX-xxxxxxxxxxxx`）

5. **.env.localにクライアント情報を設定**

   取得したクライアントIDとシークレットを`.env.local`に追加:

   ```env
   GMAIL_CLIENT_ID=あなたのクライアントID
   GMAIL_CLIENT_SECRET=あなたのクライアントシークレット
   GMAIL_FROM_EMAIL=あなたのGmailアドレス@gmail.com
   ```

6. **リフレッシュトークンを取得**

   **方法A: スクリプトを使う（推奨）**

   ```bash
   node scripts/get-gmail-token.js
   ```

   画面の指示に従って:
   1. 表示されたURLをブラウザで開く
   2. Googleアカウントでログイン
   3. 権限を許可
   4. リダイレクトされたURLから `code=` の後ろの部分をコピー
   5. ターミナルに貼り付け
   6. 表示されたリフレッシュトークンを`.env.local`にコピー

   **方法B: 手動で実行**

   ステップ1: 認証URLを生成

   ```bash
   node -e "
   const { google } = require('googleapis');
   const oauth2Client = new google.auth.OAuth2(
     'あなたのクライアントID',
     'あなたのクライアントシークレット',
     'http://localhost:3000/api/auth/callback/google'
   );
   const url = oauth2Client.generateAuthUrl({
     access_type: 'offline',
     scope: ['https://www.googleapis.com/auth/gmail.send'],
     prompt: 'consent'
   });
   console.log('以下のURLをブラウザで開いてください:');
   console.log(url);
   "
   ```


   ステップ2: ブラウザで認証
   - 上記で表示されたURLをブラウザで開く
   - Googleアカウントでログイン
   - 「Business Card Appが次の許可をリクエストしています」と表示される
   - 「許可」をクリック
   - **404エラーページが表示されますが、これは正常です！**
   - **ブラウザのアドレスバー**からURLをコピー
   - 例: `http://localhost:3000/api/auth/callback/google?code=4/0AanRRrt...xyz&scope=...`
   - **`code=` の後ろから `&scope` の前まで**をコピー（例: `4/0AanRRrt...xyz`）

   ステップ3: リフレッシュトークンを取得

   ```bash
   node -e "
   const { google } = require('googleapis');
   const oauth2Client = new google.auth.OAuth2(
     'あなたのクライアントID',
     'あなたのクライアントシークレット',
     'http://localhost:3000/api/auth/callback/google'
   );
   oauth2Client.getToken('リダイレクトURLのcode=の後ろの部分').then(({ tokens }) => {
     console.log('リフレッシュトークン:', tokens.refresh_token);
   });
   "
   ```

   **重要**: `code=` の後ろの部分だけをコピーしてください（`&scope=...` は不要）

7. **リフレッシュトークンを.env.localに追加**

   ステップ3で取得したリフレッシュトークンを`.env.local`に追加:

   ```env
   GMAIL_REFRESH_TOKEN=取得したリフレッシュトークン
   ```

8. **接続テスト**

   Gmail API接続が正しく設定されているか確認:

   ```bash
   node scripts/test-gmail.js
   ```

   成功すれば「✅ Gmail API接続成功!」と表示されます。

**注意事項:**
- Gmailの1日の送信上限: 500通/日
- レート制限: アプリでは100msの待機時間を設定済み
- 本番環境では必ずSecret Managerを使用してください

### 5. アプリケーションの起動

#### 方法1: 開発モード（推奨 - 開発時）

```bash
npm run dev
```

http://localhost:3000 にアクセス

- ホットリロード対応
- 開発ツール使用可能
- 高速な起動

#### 方法2: Dockerを使用（本番環境と同じ挙動を確認）

**必要な環境:**
- Docker Desktop または Docker Engine

**手順:**

1. **Dockerイメージをビルド**

```bash
docker build -t business-card-app .
```

2. **Dockerコンテナを起動**

```bash
docker run -p 8080:8080 --env-file .env.local business-card-app
```

3. **ブラウザでアクセス**

http://localhost:8080 にアクセス

**Dockerコンテナの停止:**

```bash
# 実行中のコンテナを確認
docker ps

# コンテナを停止
docker stop <CONTAINER_ID>
```

**Dockerを使うメリット:**
- ✅ 本番環境（Cloud Run）と同じ環境でテスト可能
- ✅ 依存関係の問題を回避
- ✅ 環境の統一（チーム開発時）

**いつDockerを使うべきか:**
- Cloud Runにデプロイする前の動作確認
- 本番環境特有のバグを調査する時
- チームメンバーと環境を統一したい時

**開発中は `npm run dev` で十分です！**

## 完全な実行フロー（初回セットアップからアプリ起動まで）

### ステップ1: プロジェクトのセットアップ

```bash
# 1. 依存関係をインストール
npm install

# 2. 環境変数ファイルを作成
cp .env.local.example .env.local  # または手動で .env.local を作成

# 3. .env.local に各種APIキーを設定（上記の「環境変数の設定」を参照）
```

### ステップ2: 外部サービスの準備

1. **Notion**: データベース作成 + Integration接続
2. **Firebase**: プロジェクト作成 + Firestore有効化 + 秘密鍵取得
3. **Gmail API**: OAuth認証設定 + リフレッシュトークン取得

### ステップ3: アプリケーションの起動

**開発モードで起動:**
```bash
npm run dev
```

**Dockerで起動（本番環境確認）:**
```bash
# イメージビルド
docker build -t business-card-app .

# コンテナ起動
docker run -p 8080:8080 --env-file .env.local business-card-app
```

### ステップ4: ブラウザでアクセス

- 開発モード: http://localhost:3000
- Docker: http://localhost:8080

## 使い方

### 1. Notionから名刺を同期

1. 「名刺管理」ページへ移動
2. 「📥 Notionから同期」ボタンをクリック
3. Notionデータベースの内容がFirestoreに同期されます

### 1-2. CSVファイルから名刺をインポート

1. 「名刺管理」ページへ移動
2. 「📤 CSVインポート」ボタンをクリック
3. スプレッドシートをCSV形式で保存したファイルを選択
4. 自動的にデータが解析され、Firestoreに保存されます

**CSVファイルの形式:**

以下のカラムを含むCSVファイルをサポートしています:

| カラム名 | 必須 | 説明 | マッピング先 |
|---------|------|------|------------|
| 企業名 | ✓ | 会社名 | `companyName` |
| 担当者名 | ✓ | 担当者の氏名 | `name` |
| 連絡先(メール) | ✓ | メールアドレス | `email` |
| メモ | - | メール送信時のテンプレート | `messageTemplate` |
| エリア | - | タグとして保存 | `tags` (エリア:xxx) |
| アプローチ状況 | - | タグとして保存 | `tags` (状況:xxx) |
| 担当部署 | - | タグとして保存 | `tags` (部署:xxx) |
| 役職 | - | タグとして保存 | `tags` (役職:xxx) |
| 連絡手段 | - | タグとして保存 | `tags` (連絡:xxx) |
| HP | - | (無視されます) | - |
| 所在 | - | (無視されます) | - |
| 連絡先(電話) | - | (無視されます) | - |

**サンプルCSV:**

プロジェクトルートに `sample.csv` を用意しています。

**注意事項:**
- 既に同じメールアドレスが登録されている場合、その行はスキップされます
- 必須項目(企業名、担当者名、メールアドレス)が欠けている行はスキップされます
- 無効なメールアドレスの行はスキップされます

### 2. メールを一括送信

1. トップページ（メール送信）を開く
2. 左側の名刺リストから送信先をチェックボックスで選択
3. 右側で件名と本文を入力
4. 「送信」ボタンをクリック

### 3. 送信履歴を確認

1. 「送信履歴」ページへ移動
2. 過去の送信履歴を確認できます
3. 詳細をクリックすると本文や宛先リストが表示されます

## Cloud Runへのデプロイ

### 1. Google Cloud プロジェクトの準備

```bash
# プロジェクトIDを設定
gcloud config set project YOUR_PROJECT_ID

# 必要なAPIを有効化
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 2. イメージのビルドとプッシュ

```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/business-card-app
```

### 3. Cloud Runにデプロイ

```bash
gcloud run deploy business-card-app \
  --image gcr.io/YOUR_PROJECT_ID/business-card-app \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars "NOTION_API_KEY=your_key" \
  --set-env-vars "NOTION_DATABASE_ID=your_db_id" \
  --set-env-vars "FIREBASE_PROJECT_ID=your_project_id" \
  --set-env-vars "GMAIL_CLIENT_ID=your_client_id" \
  --set-env-vars "GMAIL_CLIENT_SECRET=your_client_secret" \
  --set-env-vars "GMAIL_REFRESH_TOKEN=your_refresh_token" \
  --set-env-vars "GMAIL_FROM_EMAIL=your_email"
```

推奨: 機密情報は Secret Manager を使用してください

```bash
# Secretを作成
echo -n "your-api-key" | gcloud secrets create notion-api-key --data-file=-

# Secret Managerを使用してデプロイ
gcloud run deploy business-card-app \
  --image gcr.io/YOUR_PROJECT_ID/business-card-app \
  --platform managed \
  --region asia-northeast1 \
  --update-secrets NOTION_API_KEY=notion-api-key:latest
```

## プロジェクト構造

```
├── app/                    # Next.js App Router
│   ├── page.tsx           # トップ画面（メール送信）
│   ├── cards/             # 名刺管理
│   ├── history/           # 送信履歴
│   └── api/               # API Routes
├── components/            # UIコンポーネント
├── lib/                   # ビジネスロジック
│   ├── firebase/         # Firestore操作
│   ├── notion/           # Notion API
│   └── gmail/            # Gmail API（メール送信）
├── types/                 # TypeScript型定義
└── Dockerfile            # Cloud Run用
```

## トラブルシューティング

### Notion API接続エラー

- IntegrationがデータベースにConnectされているか確認
- APIキーとデータベースIDが正しいか確認

### Firebase接続エラー

- 秘密鍵の改行が正しく処理されているか確認
- `replace(/\\n/g, '\n')` が適用されているか確認

### Gmail API認証エラー

**エラー 403: access_denied が発生する場合**

このエラーは、OAuth同意画面の設定が不完全なことが原因です:

1. **テストユーザーが追加されているか確認**
   - [Google Cloud Console](https://console.cloud.google.com/) にアクセス
   - 「APIとサービス」→「OAuth同意画面」
   - 「テストユーザー」セクションを確認
   - あなたのGmailアドレスが追加されていない場合:
     - 「ADD USERS」をクリック
     - Gmailアドレスを入力して「追加」
     - 「保存」をクリック

2. **ブラウザのキャッシュをクリア**
   - シークレットモード/プライベートブラウジングで再試行

3. **Gmail APIが有効化されているか確認**
   - 「APIとサービス」→「ライブラリ」→「Gmail API」
   - ステータスが「有効」になっているか確認

**404エラーが表示される（正常な動作）**

認証後に404ページが表示されるのは正常です：

1. **ブラウザのアドレスバーを確認**
   - URLに `code=` パラメータが含まれていることを確認
   - 例: `http://localhost:3000/api/auth/callback/google?code=4/0AanRRrt...xyz&scope=...`

2. **認証コードを抽出**
   - `code=` の後ろから `&scope` の前までをコピー
   - 例: URLが `...?code=4/0AanRRrt...xyz&scope=...` なら `4/0AanRRrt...xyz` だけをコピー

3. **リフレッシュトークンを取得**
   - コピーした認証コードを使ってステップ3を実行

**エラー invalid_grant（認証コードが無効）が発生する場合**

- 認証コードは1回のみ使用可能です
- URLから新しい認証コードを取得してください
- `code=` の後ろの部分**だけ**をコピー（`&scope=...` 以降は不要）
- 例: `code=4/0AanRRrt...xyz` の `4/0AanRRrt...xyz` だけをコピー

**エラー「リフレッシュトークンが無効または期限切れです」が発生する場合**

このエラーは、`.env.local`の`GMAIL_REFRESH_TOKEN`に**認証コード**（一度しか使えない）を設定してしまっている可能性があります。

**認証コードとリフレッシュトークンの違い:**

| 種類 | 形式 | 使用回数 | 用途 |
|------|------|----------|------|
| **認証コード** | `4/0ATX87l...` で始まる短い文字列 | **1回のみ** | リフレッシュトークンを取得するための一時的なコード |
| **リフレッシュトークン** | `1//0gHZ...` で始まる長い文字列 | **何度でも** | Gmail APIへのアクセスを継続的に許可するトークン |

**解決方法:**

1. `.env.local`の`GMAIL_REFRESH_TOKEN`を確認
   - `4/0ATX...` で始まる場合 → **認証コード**なので、リフレッシュトークンに変換する必要があります
   - `1//0gHZ...` で始まる場合 → すでにリフレッシュトークンです

2. 認証コードの場合は、以下のコマンドで**リフレッシュトークン**を取得:

   ```bash
   node scripts/get-gmail-token.js
   ```

3. 画面の指示に従って:
   - ブラウザで認証URLを開く
   - Googleアカウントでログインして許可
   - 404ページのURLから`code=`の後ろの部分をコピー
   - ターミナルに貼り付け
   - 表示された**リフレッシュトークン**（`1//0gHZ...`で始まる）を`.env.local`に設定

4. 再度接続テストを実行:

   ```bash
   node scripts/test-gmail.js
   ```

   成功すれば「✅ Gmail API接続成功!」と表示されます。

**エラー「Request had insufficient authentication scopes」が発生する場合**

このエラーは、リフレッシュトークンに必要な権限（スコープ）が含まれていないことが原因です。

**原因**: OAuth同意画面でGmail送信スコープ（`https://www.googleapis.com/auth/gmail.send`）が追加されていない

**解決方法:**

1. **Google Cloud Console → APIとサービス → OAuth同意画面**に移動

2. **「アプリを編集」ボタンをクリック**

3. **「保存して次へ」を2回クリックして「スコープ」ページに移動**

4. **「スコープを追加または削除」ボタンをクリック**

5. **フィルタで「gmail」を検索**

6. **以下のスコープにチェック:**
   ```
   https://www.googleapis.com/auth/gmail.send
   ```
   - 説明: 「Gmail でメールを送信する」

7. **「更新」→「保存して次へ」で完了**

8. **リフレッシュトークンを再取得:**
   ```bash
   node scripts/get-gmail-token.js
   ```
   - 新しい認証URLをブラウザで開く
   - 今回は「Gmail でメールを送信する」権限が表示されるはず
   - 許可してリフレッシュトークンを取得
   - `.env.local`に新しいトークンを設定

9. **再テスト:**
   ```bash
   node scripts/test-gmail.js
   ```

### Gmail API送信失敗

- OAuth 2.0認証情報が正しく設定されているか確認
- リフレッシュトークンが有効か確認（期限切れの場合は再取得）
- Gmail APIが有効化されているか確認
- 1日の送信上限（500通）に達していないか確認
- 環境変数が正しく設定されているか確認:
  - `GMAIL_CLIENT_ID`
  - `GMAIL_CLIENT_SECRET`
  - `GMAIL_REFRESH_TOKEN`
  - `GMAIL_FROM_EMAIL`

## ライセンス

MIT
