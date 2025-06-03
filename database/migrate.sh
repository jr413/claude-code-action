#!/bin/bash

# TeleAI Pro データベースマイグレーション実行スクリプト
# 使用方法:
#   ./migrate.sh up    - すべてのマイグレーションを実行
#   ./migrate.sh down  - 最後のマイグレーションをロールバック
#   ./migrate.sh status - マイグレーションの状態を確認

set -e

# デフォルト設定（環境変数で上書き可能）
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-teleai_pro}
DB_USER=${DB_USER:-teleai_user}
DB_PASSWORD=${DB_PASSWORD:-}

MIGRATIONS_DIR="./migrations"
MIGRATIONS_TABLE="schema_migrations"

# データベース接続文字列
if [ -n "$DB_PASSWORD" ]; then
    export PGPASSWORD=$DB_PASSWORD
fi
PSQL="psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"

# マイグレーションテーブルの作成
create_migrations_table() {
    echo "マイグレーションテーブルを確認しています..."
    $PSQL -c "
        CREATE TABLE IF NOT EXISTS $MIGRATIONS_TABLE (
            version VARCHAR(255) PRIMARY KEY,
            applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );"
}

# マイグレーション状態の確認
check_status() {
    echo "=== マイグレーション状態 ==="
    echo "適用済みのマイグレーション:"
    $PSQL -c "SELECT version, applied_at FROM $MIGRATIONS_TABLE ORDER BY version;"
    
    echo -e "\n未適用のマイグレーション:"
    for file in $MIGRATIONS_DIR/*.sql; do
        if [[ $file =~ ([0-9]+_.+)\.sql$ ]] && [[ ! $file =~ \.down\.sql$ ]]; then
            version="${BASH_REMATCH[1]}"
            result=$($PSQL -t -c "SELECT COUNT(*) FROM $MIGRATIONS_TABLE WHERE version = '$version';")
            if [ $(echo $result | tr -d ' ') -eq 0 ]; then
                echo "  - $version"
            fi
        fi
    done
}

# マイグレーションの実行
migrate_up() {
    echo "マイグレーションを実行しています..."
    
    for file in $MIGRATIONS_DIR/*.sql; do
        if [[ $file =~ ([0-9]+_.+)\.sql$ ]] && [[ ! $file =~ \.down\.sql$ ]]; then
            version="${BASH_REMATCH[1]}"
            
            # すでに適用されているかチェック
            result=$($PSQL -t -c "SELECT COUNT(*) FROM $MIGRATIONS_TABLE WHERE version = '$version';")
            if [ $(echo $result | tr -d ' ') -eq 0 ]; then
                echo "実行中: $version"
                $PSQL -f "$file"
                $PSQL -c "INSERT INTO $MIGRATIONS_TABLE (version) VALUES ('$version');"
                echo "完了: $version"
            else
                echo "スキップ: $version (すでに適用済み)"
            fi
        fi
    done
    
    echo "マイグレーションが完了しました。"
}

# マイグレーションのロールバック
migrate_down() {
    echo "最新のマイグレーションをロールバックしています..."
    
    # 最新の適用済みマイグレーションを取得
    version=$($PSQL -t -c "SELECT version FROM $MIGRATIONS_TABLE ORDER BY version DESC LIMIT 1;" | tr -d ' ')
    
    if [ -z "$version" ]; then
        echo "ロールバックするマイグレーションがありません。"
        exit 0
    fi
    
    down_file="$MIGRATIONS_DIR/${version}.down.sql"
    
    if [ -f "$down_file" ]; then
        echo "ロールバック中: $version"
        $PSQL -f "$down_file"
        $PSQL -c "DELETE FROM $MIGRATIONS_TABLE WHERE version = '$version';"
        echo "完了: $version のロールバック"
    else
        echo "エラー: ロールバックファイルが見つかりません: $down_file"
        exit 1
    fi
}

# メイン処理
main() {
    case "$1" in
        up)
            create_migrations_table
            migrate_up
            ;;
        down)
            create_migrations_table
            migrate_down
            ;;
        status)
            create_migrations_table
            check_status
            ;;
        *)
            echo "使用方法: $0 {up|down|status}"
            echo "  up     - すべてのマイグレーションを実行"
            echo "  down   - 最後のマイグレーションをロールバック"
            echo "  status - マイグレーションの状態を確認"
            exit 1
            ;;
    esac
}

main "$@"