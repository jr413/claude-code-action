# TeleAI Pro データベーススキーマドキュメント

## 概要

このドキュメントは、TeleAI Proのエンタープライズデータモデルのデータベーススキーマについて説明します。このスキーマは、音声ファイルの管理、文字起こし、分析結果、およびユーザー管理をサポートするように設計されています。

## データベース構造

### テーブル一覧

1. **users** - ユーザー情報を管理
2. **sessions** - ユーザーセッションを管理
3. **audio_files** - アップロードされた音声ファイルを管理
4. **transcriptions** - 音声ファイルの文字起こし結果を管理
5. **analyses** - 文字起こしの分析結果を管理

### リレーションシップ

```
users (1) ──┬──< (N) sessions
            ├──< (N) audio_files ──< (N) transcriptions ──< (N) analyses
            ├──< (N) transcriptions
            └──< (N) analyses
```

## テーブル詳細

### users テーブル

ユーザーアカウント情報を格納します。

| カラム名 | データ型 | 制約 | 説明 |
|---------|----------|------|------|
| id | UUID | PRIMARY KEY | ユーザーID |
| email | VARCHAR(255) | UNIQUE NOT NULL | メールアドレス |
| username | VARCHAR(100) | UNIQUE NOT NULL | ユーザー名 |
| full_name | VARCHAR(255) | | フルネーム |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | 更新日時 |
| deleted_at | TIMESTAMP WITH TIME ZONE | | 削除日時（論理削除） |
| is_active | BOOLEAN | DEFAULT TRUE NOT NULL | アクティブフラグ |
| role | VARCHAR(50) | DEFAULT 'user' NOT NULL | ロール（user/admin/moderator） |

### sessions テーブル

ユーザーのログインセッション情報を管理します。

| カラム名 | データ型 | 制約 | 説明 |
|---------|----------|------|------|
| id | UUID | PRIMARY KEY | セッションID |
| user_id | UUID | NOT NULL, FK(users) | ユーザーID |
| token | VARCHAR(500) | UNIQUE NOT NULL | セッショントークン |
| ip_address | INET | | IPアドレス |
| user_agent | TEXT | | ユーザーエージェント |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | 作成日時 |
| expires_at | TIMESTAMP WITH TIME ZONE | NOT NULL | 有効期限 |
| is_active | BOOLEAN | DEFAULT TRUE NOT NULL | アクティブフラグ |

### audio_files テーブル

アップロードされた音声ファイルの情報を管理します。

| カラム名 | データ型 | 制約 | 説明 |
|---------|----------|------|------|
| id | UUID | PRIMARY KEY | ファイルID |
| user_id | UUID | NOT NULL, FK(users) | アップロードユーザーID |
| file_name | VARCHAR(255) | NOT NULL | ファイル名 |
| file_path | TEXT | NOT NULL | ファイルパス |
| file_size | BIGINT | NOT NULL, CHECK > 0 | ファイルサイズ（バイト） |
| mime_type | VARCHAR(100) | NOT NULL | MIMEタイプ |
| duration_seconds | INTEGER | | 音声の長さ（秒） |
| sample_rate | INTEGER | | サンプリングレート |
| bit_rate | INTEGER | | ビットレート |
| channels | INTEGER | | チャンネル数 |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | 更新日時 |
| deleted_at | TIMESTAMP WITH TIME ZONE | | 削除日時（論理削除） |
| status | VARCHAR(50) | DEFAULT 'uploaded' NOT NULL | ステータス |
| metadata | JSONB | | メタデータ |

ステータス値：
- `uploaded` - アップロード完了
- `processing` - 処理中
- `processed` - 処理完了
- `failed` - 処理失敗
- `deleted` - 削除済み

### transcriptions テーブル

音声ファイルの文字起こし結果を格納します。

| カラム名 | データ型 | 制約 | 説明 |
|---------|----------|------|------|
| id | UUID | PRIMARY KEY | 文字起こしID |
| audio_file_id | UUID | NOT NULL, FK(audio_files) | 音声ファイルID |
| user_id | UUID | NOT NULL, FK(users) | ユーザーID |
| transcription_text | TEXT | NOT NULL | 文字起こしテキスト |
| language_code | VARCHAR(10) | NOT NULL | 言語コード（例：ja, en） |
| confidence_score | DECIMAL(5,4) | CHECK 0-1 | 信頼度スコア |
| word_count | INTEGER | | 単語数 |
| processing_time_ms | INTEGER | | 処理時間（ミリ秒） |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | 更新日時 |
| status | VARCHAR(50) | DEFAULT 'pending' NOT NULL | ステータス |
| error_message | TEXT | | エラーメッセージ |
| metadata | JSONB | | メタデータ |

ステータス値：
- `pending` - 処理待ち
- `processing` - 処理中
- `completed` - 完了
- `failed` - 失敗

### analyses テーブル

文字起こしの分析結果を格納します。

| カラム名 | データ型 | 制約 | 説明 |
|---------|----------|------|------|
| id | UUID | PRIMARY KEY | 分析ID |
| transcription_id | UUID | NOT NULL, FK(transcriptions) | 文字起こしID |
| user_id | UUID | NOT NULL, FK(users) | ユーザーID |
| analysis_type | VARCHAR(100) | NOT NULL | 分析タイプ |
| summary | TEXT | | 要約 |
| key_points | JSONB | | 重要ポイント |
| sentiment_score | DECIMAL(3,2) | CHECK -1 to 1 | 感情スコア |
| entities | JSONB | | エンティティ |
| topics | JSONB | | トピック |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | 更新日時 |
| processing_time_ms | INTEGER | | 処理時間（ミリ秒） |
| status | VARCHAR(50) | DEFAULT 'pending' NOT NULL | ステータス |
| error_message | TEXT | | エラーメッセージ |
| metadata | JSONB | | メタデータ |

## インデックス

パフォーマンス最適化のため、以下の複合インデックスを作成しています：

### 複合インデックス
- `idx_audio_files_user_created` - audio_files(user_id, created_at DESC)
- `idx_transcriptions_user_created` - transcriptions(user_id, created_at DESC)
- `idx_analyses_user_created` - analyses(user_id, created_at DESC)
- `idx_analyses_type_status` - analyses(analysis_type, status)

### 単一カラムインデックス
- `idx_users_created_at` - users(created_at DESC)
- `idx_sessions_expires_at` - sessions(expires_at)
- `idx_audio_files_status` - audio_files(status)
- `idx_transcriptions_audio_file` - transcriptions(audio_file_id)
- `idx_transcriptions_status` - transcriptions(status)
- `idx_analyses_transcription` - analyses(transcription_id)

### 部分インデックス
- `idx_users_active_role` - users(is_active, role) WHERE deleted_at IS NULL
- `idx_audio_files_user_created` - WHERE deleted_at IS NULL
- `idx_audio_files_status` - WHERE deleted_at IS NULL
- `idx_sessions_expires_at` - WHERE is_active = TRUE

## ビュー

### user_statistics

ユーザーごとの統計情報を提供します。

```sql
SELECT 
    id,
    username,
    email,
    total_audio_files,
    total_transcriptions,
    total_analyses,
    last_upload_at,
    last_transcription_at,
    last_analysis_at
FROM user_statistics;
```

### processing_status_summary

各エンティティの処理状況のサマリーを提供します。

```sql
SELECT 
    entity_type,
    status,
    count
FROM processing_status_summary;
```

## マイグレーション

マイグレーションファイルは `database/migrations/` ディレクトリに格納されています：

1. `001_create_initial_schema.sql` - 初期スキーマの作成
2. `001_create_initial_schema.down.sql` - 初期スキーマのロールバック
3. `002_add_sample_data.sql` - サンプルデータの追加（開発環境用）
4. `002_add_sample_data.down.sql` - サンプルデータの削除

### マイグレーションの実行

```bash
# マイグレーションの実行
psql -U username -d database_name -f database/migrations/001_create_initial_schema.sql

# ロールバック
psql -U username -d database_name -f database/migrations/001_create_initial_schema.down.sql
```

## セキュリティ考慮事項

1. **論理削除**: `users`と`audio_files`テーブルには`deleted_at`カラムがあり、物理削除の代わりに論理削除を使用します。

2. **カスケード削除**: 外部キー制約には`ON DELETE CASCADE`を設定し、親レコードが削除された場合に関連レコードも自動的に削除されます。

3. **データ検証**: CHECK制約により、データの整合性を保証します（例：confidence_scoreは0-1の範囲）。

4. **セッション管理**: セッションには有効期限があり、期限切れのセッションは定期的にクリーンアップする必要があります。

## パフォーマンス最適化

1. **複合インデックス**: よく使用される検索パターンに基づいて複合インデックスを作成しています。

2. **部分インデックス**: 論理削除されていないレコードのみを対象とする部分インデックスを使用して、クエリパフォーマンスを向上させています。

3. **JSONB型**: 柔軟なメタデータ格納のためにJSONB型を使用し、GINインデックスによる高速検索が可能です。

4. **ビュー**: 頻繁に使用される集計クエリをビューとして定義し、パフォーマンスと可読性を向上させています。

## 今後の拡張予定

- パーティショニングの実装（大規模データ対応）
- 全文検索インデックスの追加
- 監査ログテーブルの追加
- APIレート制限のためのテーブル追加