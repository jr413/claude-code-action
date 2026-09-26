"""複数アカウントの比較分析。"""

import pandas as pd

from .trends import media_usage_rate, posting_frequency_per_day

NUMERIC_COLS = ["post_count", "avg_engagement", "posts_per_day", "image_rate", "video_rate", "avg_text_length"]


def compare_accounts(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame()
    rows = []
    for username, group in df.groupby("account_username"):
        media = media_usage_rate(group)
        rows.append(
            {
                "account_username": username,
                "post_count": len(group),
                "avg_engagement": float(group["engagement_score"].mean()),
                "posts_per_day": posting_frequency_per_day(group),
                "top_category": group["content_category"].value_counts().idxmax(),
                "image_rate": media["image"],
                "video_rate": media["video"],
                "avg_text_length": float(group["text_length"].mean()),
            }
        )
    return pd.DataFrame(rows).sort_values("avg_engagement", ascending=False).reset_index(drop=True)


def diff_against_self(comparison_df: pd.DataFrame, self_username: str) -> pd.DataFrame:
    """自分のアカウントと他アカウントとの差分（自分 - 他）。"""
    if comparison_df.empty or self_username not in comparison_df["account_username"].values:
        return pd.DataFrame()
    me = comparison_df[comparison_df["account_username"] == self_username].iloc[0]
    others = comparison_df[comparison_df["account_username"] != self_username]
    return pd.DataFrame(
        [
            {"account_username": row["account_username"], **{f"{c}_diff": me[c] - row[c] for c in NUMERIC_COLS}}
            for _, row in others.iterrows()
        ]
    )
