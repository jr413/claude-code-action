"""投稿傾向分析：時間帯・頻度・コンテンツ分類・メディア利用・ハッシュタグ。"""

from collections import Counter

import pandas as pd

from ..models import Post

WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
COLUMNS = [
    "account_username", "post_id", "text", "created_at", "like_count", "repost_count",
    "quote_count", "reply_count", "has_image", "has_video", "hashtags", "content_category",
    "engagement_score", "text_length", "hour", "weekday",
]


def posts_to_dataframe(posts: list[Post]) -> pd.DataFrame:
    if not posts:
        return pd.DataFrame(columns=COLUMNS)
    df = pd.DataFrame([vars(p) for p in posts])
    df["created_at"] = pd.to_datetime(df["created_at"])
    df["engagement_score"] = [p.engagement_score for p in posts]
    df["text_length"] = df["text"].str.len()
    df["hour"] = df["created_at"].dt.hour
    df["weekday"] = df["created_at"].dt.day_name()
    return df


def hourly_distribution(df: pd.DataFrame) -> pd.Series:
    return df.groupby("hour").size().reindex(range(24), fill_value=0)


def weekday_distribution(df: pd.DataFrame) -> pd.Series:
    return df.groupby("weekday").size().reindex(WEEKDAYS, fill_value=0)


def category_distribution(df: pd.DataFrame) -> pd.Series:
    return df["content_category"].value_counts()


def media_usage_rate(df: pd.DataFrame) -> dict:
    if df.empty:
        return {"image": 0.0, "video": 0.0, "text_only": 0.0}
    image = df["has_image"].astype(bool)
    video = df["has_video"].astype(bool)
    return {
        "image": float(image.mean()),
        "video": float(video.mean()),
        "text_only": float((~image & ~video).mean()),
    }


def top_hashtags(df: pd.DataFrame, n: int = 10) -> list[tuple]:
    counter = Counter()
    for tags in df["hashtags"]:
        counter.update(tags)
    return counter.most_common(n)


def posting_frequency_per_day(df: pd.DataFrame) -> float:
    if df.empty:
        return 0.0
    span_days = max((df["created_at"].max() - df["created_at"].min()).days, 1)
    return len(df) / span_days
