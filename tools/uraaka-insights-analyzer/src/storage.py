"""ローカル SQLite へのデータ永続化。外部への送信は一切行わない。"""

import json
import sqlite3
from datetime import datetime
from pathlib import Path

from .models import Account, Post

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "uraaka_insights.db"


def _connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.execute(
            """CREATE TABLE IF NOT EXISTS accounts (
                username TEXT PRIMARY KEY, display_name TEXT,
                is_self INTEGER DEFAULT 0, added_at TEXT)"""
        )
        conn.execute(
            """CREATE TABLE IF NOT EXISTS posts (
                post_id TEXT PRIMARY KEY, account_username TEXT, text TEXT,
                created_at TEXT, like_count INTEGER, repost_count INTEGER,
                quote_count INTEGER, reply_count INTEGER, has_image INTEGER,
                has_video INTEGER, hashtags TEXT, content_category TEXT)"""
        )


def add_account(account: Account) -> None:
    with _connect() as conn:
        conn.execute(
            """INSERT INTO accounts (username, display_name, is_self, added_at)
               VALUES (?, ?, ?, ?)
               ON CONFLICT(username) DO UPDATE SET
                 display_name = excluded.display_name, is_self = excluded.is_self""",
            (account.username, account.display_name, int(account.is_self), account.added_at.isoformat()),
        )


def list_accounts() -> list[Account]:
    with _connect() as conn:
        rows = conn.execute("SELECT * FROM accounts ORDER BY added_at").fetchall()
    return [
        Account(
            username=r["username"],
            display_name=r["display_name"] or "",
            is_self=bool(r["is_self"]),
            added_at=datetime.fromisoformat(r["added_at"]),
        )
        for r in rows
    ]


def upsert_posts(posts: list[Post]) -> int:
    if not posts:
        return 0
    with _connect() as conn:
        conn.executemany(
            """INSERT INTO posts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(post_id) DO UPDATE SET
                 like_count = excluded.like_count, repost_count = excluded.repost_count,
                 quote_count = excluded.quote_count, reply_count = excluded.reply_count,
                 content_category = excluded.content_category""",
            [
                (
                    p.post_id, p.account_username, p.text, p.created_at.isoformat(),
                    p.like_count, p.repost_count, p.quote_count, p.reply_count,
                    int(p.has_image), int(p.has_video),
                    json.dumps(p.hashtags, ensure_ascii=False), p.content_category,
                )
                for p in posts
            ],
        )
    return len(posts)


def get_posts(account_username: str | None = None) -> list[Post]:
    with _connect() as conn:
        if account_username:
            rows = conn.execute(
                "SELECT * FROM posts WHERE account_username = ? ORDER BY created_at",
                (account_username,),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM posts ORDER BY created_at").fetchall()
    return [
        Post(
            account_username=r["account_username"],
            post_id=r["post_id"],
            text=r["text"],
            created_at=datetime.fromisoformat(r["created_at"]),
            like_count=r["like_count"],
            repost_count=r["repost_count"],
            quote_count=r["quote_count"],
            reply_count=r["reply_count"],
            has_image=bool(r["has_image"]),
            has_video=bool(r["has_video"]),
            hashtags=json.loads(r["hashtags"] or "[]"),
            content_category=r["content_category"] or "その他",
        )
        for r in rows
    ]
