import io
import sys
from datetime import datetime, timedelta
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.analysis.comparison import compare_accounts, diff_against_self
from src.analysis.success_patterns import generate_insights, summarize_top_posts
from src.analysis.trends import (
    category_distribution,
    hourly_distribution,
    media_usage_rate,
    posting_frequency_per_day,
    posts_to_dataframe,
    top_hashtags,
)
from src.classify import classify_text
from src.collectors.manual import parse_csv
from src.collectors.x_api import parse_timeline_response
from src.export import export_csv, export_pdf_report, find_japanese_font
from src.models import Post


def make_post(account="alice", hours_ago=0, likes=10, reposts=1, has_image=False, text="今日は散歩", tags=None):
    return Post(
        account_username=account,
        post_id=f"{account}-{hours_ago}-{likes}",
        text=text,
        created_at=datetime(2026, 1, 10, 12) - timedelta(hours=hours_ago),
        like_count=likes,
        repost_count=reposts,
        has_image=has_image,
        hashtags=tags or [],
        content_category=classify_text(text),
    )


def test_engagement_score():
    post = make_post(likes=10, reposts=2)
    post.quote_count = 3
    post.reply_count = 1
    assert post.engagement_score == 10 + 4 + 6 + 1


def test_classify_text():
    assert classify_text("疲れたし、しんどい") == "愚痴"
    assert classify_text("無関係な文章") == "その他"


def test_empty_dataframe():
    df = posts_to_dataframe([])
    assert df.empty and "engagement_score" in df.columns
    assert generate_insights(summarize_top_posts(df)) == ["分析対象の投稿データがまだありません。"]


def test_trends():
    posts = [make_post(hours_ago=h * 24, has_image=h % 2 == 0, tags=["a", "b"] if h else ["a"]) for h in range(5)]
    df = posts_to_dataframe(posts)
    assert hourly_distribution(df).sum() == 5
    assert category_distribution(df).sum() == 5
    assert media_usage_rate(df)["image"] == pytest.approx(0.6)
    assert top_hashtags(df, n=1) == [("a", 5)]
    assert posting_frequency_per_day(df) == pytest.approx(5 / 4)


def test_success_patterns():
    posts = [make_post(hours_ago=h, likes=(10 - h) * 10, has_image=h < 2) for h in range(10)]
    summary = summarize_top_posts(posts_to_dataframe(posts), top_pct=0.2)
    assert summary["sample_size"] == 5
    insights = generate_insights(summary)
    assert any("画像付き投稿" in s for s in insights)


def test_compare_and_diff():
    posts = [make_post("alice", h, likes=50) for h in range(5)] + [make_post("bob", h, likes=5) for h in range(5)]
    comparison = compare_accounts(posts_to_dataframe(posts))
    assert list(comparison["account_username"]) == ["alice", "bob"]
    diff = diff_against_self(comparison, "bob")
    assert diff.iloc[0]["account_username"] == "alice"
    assert diff.iloc[0]["avg_engagement_diff"] < 0


def test_parse_csv():
    csv = io.StringIO(
        "account_username,text,created_at,like_count,repost_count,quote_count,reply_count,has_image,hashtags\n"
        "alice,今日は散歩,2026-01-01 10:00,5,1,0,2,true,\"a, b\"\n"
        "alice,草,2026-01-02 22:00,3,,0,0,false,\n"
    )
    posts = parse_csv(csv)
    assert len(posts) == 2
    assert posts[0].has_image is True and posts[1].has_image is False
    assert posts[0].hashtags == ["a", "b"] and posts[1].hashtags == []
    assert posts[1].repost_count == 0


def test_parse_csv_missing_columns():
    with pytest.raises(ValueError):
        parse_csv(io.StringIO("account_username,text\nalice,hi\n"))


def test_parse_timeline_response():
    body = {
        "data": [{
            "id": "1", "text": "今日は散歩 #walk", "created_at": "2026-01-01T10:00:00.000Z",
            "public_metrics": {"like_count": 3, "retweet_count": 1, "quote_count": 0, "reply_count": 2},
            "entities": {"hashtags": [{"tag": "walk"}]},
            "attachments": {"media_keys": ["m1"]},
        }],
        "includes": {"media": [{"media_key": "m1", "type": "photo"}]},
    }
    [post] = parse_timeline_response("alice", body)
    assert post.has_image and not post.has_video
    assert post.hashtags == ["walk"] and post.repost_count == 1


def test_export_csv_and_pdf_without_font():
    df = posts_to_dataframe([make_post(hours_ago=h) for h in range(3)])
    assert b"post_id" in export_csv(df)
    summary = summarize_top_posts(df)
    pdf = export_pdf_report("Report", summary, generate_insights(summary), font_path=None)
    assert pdf[:4] == b"%PDF"


@pytest.mark.skipif(find_japanese_font() is None, reason="日本語フォントが見つからない環境")
def test_export_pdf_with_japanese_font():
    df = posts_to_dataframe([make_post(hours_ago=h) for h in range(3)])
    summary = summarize_top_posts(df)
    pdf = export_pdf_report("テストレポート", summary, generate_insights(summary))
    assert pdf[:4] == b"%PDF"
