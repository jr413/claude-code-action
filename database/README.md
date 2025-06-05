# TeleAI Enterprise データベース設計

## 概要

このディレクトリには、TeleAI Enterpriseプラットフォームのデータベーススキーマとマイグレーションファイルが含まれています。音声ファイル、文字起こし、分析結果、ユーザー管理のための包括的なデータモデルを提供します。

## スキーマ構造

### テーブル一覧

1. **users** - ユーザーアカウント情報
2. **sessions** - ユーザーセッション管理
3. **audio_files** - 音声ファイルメタデータ
4. **transcriptions** - 文字起こし結果
5. **analyses** - 分析結果

### 主要な関係性

- **users → audio_files**: 1対多の関係（ユーザーは複数のファイルを所有）
- **audio_files → transcriptions**: 1対多の関係（1つのファイルに複数の文字起こし）
- **transcriptions → analyses**: 1対多の関係（1つの文字起こしに複数の分析）

## パフォーマンス最適化

### インデックス戦略

1. **複合インデックス**: `user_id + created_at` による高速クエリ
2. **包含インデックス**: よく使用されるカラムを含めてクエリ効率を向上
3. **部分インデックス**: 特定の条件でのみインデックスを作成
4. **全文検索インデックス**: 文字起こしテキストの高速検索

### クエリ最適化

```sql
-- ユーザーの最近のファイルを取得（最適化済み）
SELECT file_name, file_size, duration_seconds, created_at
FROM audio_files
WHERE user_id = :user_id
ORDER BY created_at DESC
LIMIT 10;
```

## セキュリティ考慮事項

1. **外部キー制約**: データ整合性の保証
2. **チェック制約**: 不正なデータの防止
3. **ユニーク制約**: 重複データの防止
4. **パスワードハッシュ**: 平文パスワードは保存しない

## マイグレーション手順

### 初期セットアップ

```bash
# PostgreSQLの場合
psql -U your_username -d your_database -f database/schema/teleai_enterprise_schema.sql

# MySQLの場合（一部構文の調整が必要）
mysql -u your_username -p your_database < database/schema/teleai_enterprise_schema.sql
```

### スキーマの更新

将来のマイグレーションファイルは `database/migrations/` ディレクトリに追加されます。

## データベース選択

このスキーマはPostgreSQL用に最適化されていますが、以下のデータベースでも使用可能です：

- **PostgreSQL 12+** (推奨)
- **MySQL 8.0+** (一部調整必要)
- **SQLite** (開発環境用、一部機能制限あり)

## メンテナンス

### 定期的なタスク

1. **インデックスの再構築**
   ```sql
   REINDEX TABLE audio_files;
   REINDEX TABLE transcriptions;
   ```

2. **統計情報の更新**
   ```sql
   ANALYZE audio_files;
   ANALYZE transcriptions;
   ```

3. **古いセッションのクリーンアップ**
   ```sql
   DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP;
   ```

## 監視とメトリクス

### 重要な監視ポイント

1. **テーブルサイズ**: 特に `audio_files` と `transcriptions`
2. **インデックス使用率**: 未使用インデックスの特定
3. **クエリパフォーマンス**: 遅いクエリの特定と最適化
4. **接続数**: データベース接続プールの監視

### パフォーマンスベースライン

- 単一ユーザーのファイル一覧取得: < 50ms
- 文字起こし検索: < 100ms
- 分析結果の集計: < 200ms

## トラブルシューティング

### よくある問題

1. **パフォーマンス低下**
   - インデックスの確認
   - クエリプランの分析
   - 統計情報の更新

2. **ストレージ不足**
   - 古いデータのアーカイブ
   - パーティショニングの検討

3. **デッドロック**
   - トランザクションの見直し
   - ロック順序の統一

## 今後の拡張計画

1. **パーティショニング**: 大規模データ対応
2. **レプリケーション**: 読み取り負荷分散
3. **キャッシュ層**: Redis/Memcachedの導入
4. **時系列データ**: TimescaleDBの検討