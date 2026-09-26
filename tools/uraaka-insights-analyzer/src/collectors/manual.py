"""手動入力（CSV アップロード / フォーム入力）によるデータ取り込み。"""

import uuid
from datetime import datetime

import pandas as pd

from ..classify import classify_text
from ..models import Post

REQUIRED_CSV_COLUMNS = [
    "account_username", "text", "created_at",
    "like_count", "repost_count", "quote_count", "reply_count",
]


def _to_bool(value) -> bool:
    if isinstance(value, str):
        return value.strip().lower() in ("1", "true", "yes", "y", "はい")
    return bool(value) and not pd.isna(value)


def _to_int(value) -> int:
    return 0 if pd.isna(value) else int(value)


def parse_csv(file) -> list[Post]:
    df = pd.read_csv(file)
    missing = [c for c in REQUIRED_CSV_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"CSV に必要な列がありません: {', '.join(missing)}")

    posts = []
    for _, row in df.iterrows():
        text = str(row["text"])
        raw_tags = row.get("hashtags", "")
        tags = [] if pd.isna(raw_tags) else [t.strip() for t in str(raw_tags).split(",") if t.strip()]
        raw_id = row.get("post_id")
        posts.append(
            Post(
                account_username=str(row["account_username"]),
                post_id=str(uuid.uuid4()) if raw_id is None or pd.isna(raw_id) else str(raw_id),
                text=text,
                created_at=pd.to_datetime(row["created_at"]).to_pydatetime(),
                like_count=_to_int(row["like_count"]),
                repost_count=_to_int(row["repost_count"]),
                quote_count=_to_int(row["quote_count"]),
                reply_count=_to_int(row["reply_count"]),
                has_image=_to_bool(row.get("has_image", False)),
                has_video=_to_bool(row.get("has_video", False)),
                hashtags=tags,
                content_category=classify_text(text),
            )
        )
    return posts


def build_post_from_form(
    account_username: str,
    text: str,
    created_at: datetime,
    like_count: int = 0,
    repost_count: int = 0,
    quote_count: int = 0,
    reply_count: int = 0,
    has_image: bool = False,
    has_video: bool = False,
    hashtags: list | None = None,
) -> Post:
    return Post(
        account_username=account_username,
        post_id=str(uuid.uuid4()),
        text=text,
        created_at=created_at,
        like_count=like_count,
        repost_count=repost_count,
        quote_count=quote_count,
        reply_count=reply_count,
        has_image=has_image,
        has_video=has_video,
        hashtags=hashtags or [],
        content_category=classify_text(text),
    )
