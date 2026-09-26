"""公式 X API v2 を使った公開投稿データの取得。ログインやスクレイピングは行わない。"""

import os
from datetime import datetime

import requests

from ..classify import classify_text
from ..models import Post

_API_BASE = "https://api.twitter.com/2"


class XApiError(RuntimeError):
    pass


def _headers() -> dict:
    token = os.environ.get("X_BEARER_TOKEN")
    if not token:
        raise XApiError("X_BEARER_TOKEN が設定されていません。手動入力機能を利用してください。")
    return {"Authorization": f"Bearer {token}"}


def fetch_user_id(username: str) -> str:
    resp = requests.get(f"{_API_BASE}/users/by/username/{username}", headers=_headers(), timeout=10)
    if resp.status_code != 200:
        raise XApiError(f"ユーザー取得に失敗しました ({resp.status_code}): {resp.text}")
    return resp.json()["data"]["id"]


def fetch_recent_posts(username: str, max_results: int = 50) -> list[Post]:
    user_id = fetch_user_id(username)
    resp = requests.get(
        f"{_API_BASE}/users/{user_id}/tweets",
        headers=_headers(),
        params={
            "max_results": max(5, min(max_results, 100)),
            "tweet.fields": "created_at,public_metrics,entities,attachments",
            "media.fields": "type",
            "expansions": "attachments.media_keys",
        },
        timeout=15,
    )
    if resp.status_code != 200:
        raise XApiError(f"投稿取得に失敗しました ({resp.status_code}): {resp.text}")
    return parse_timeline_response(username, resp.json())


def parse_timeline_response(username: str, body: dict) -> list[Post]:
    media_types = {m["media_key"]: m["type"] for m in body.get("includes", {}).get("media", [])}
    posts = []
    for tweet in body.get("data", []):
        metrics = tweet.get("public_metrics", {})
        types = [media_types.get(k) for k in tweet.get("attachments", {}).get("media_keys", [])]
        text = tweet.get("text", "")
        posts.append(
            Post(
                account_username=username,
                post_id=tweet["id"],
                text=text,
                created_at=datetime.strptime(tweet["created_at"], "%Y-%m-%dT%H:%M:%S.%fZ"),
                like_count=metrics.get("like_count", 0),
                repost_count=metrics.get("retweet_count", 0),
                quote_count=metrics.get("quote_count", 0),
                reply_count=metrics.get("reply_count", 0),
                has_image="photo" in types,
                has_video="video" in types or "animated_gif" in types,
                hashtags=[h["tag"] for h in tweet.get("entities", {}).get("hashtags", [])],
                content_category=classify_text(text),
            )
        )
    return posts
