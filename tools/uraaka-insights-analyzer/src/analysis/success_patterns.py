"""人気投稿（エンゲージメント上位）の特徴抽出。参考情報の提示のみ。"""

import pandas as pd

from .trends import category_distribution, media_usage_rate


def top_posts(df: pd.DataFrame, top_pct: float = 0.1, min_count: int = 5) -> pd.DataFrame:
    if df.empty:
        return df
    n = max(min_count, int(len(df) * top_pct))
    return df.sort_values("engagement_score", ascending=False).head(n)


def summarize_top_posts(df: pd.DataFrame, top_pct: float = 0.1) -> dict:
    if df.empty:
        return {}
    top_df = top_posts(df, top_pct=top_pct)
    return {
        "sample_size": len(top_df),
        "avg_engagement_top": round(float(top_df["engagement_score"].mean()), 1),
        "avg_engagement_overall": round(float(df["engagement_score"].mean()), 1),
        "avg_text_length_top": round(float(top_df["text_length"].mean()), 1),
        "avg_text_length_overall": round(float(df["text_length"].mean()), 1),
        "best_hours": top_df["hour"].value_counts().head(3).index.tolist(),
        "category_distribution_top": category_distribution(top_df).to_dict(),
        "category_distribution_overall": category_distribution(df).to_dict(),
        "media_usage_top": media_usage_rate(top_df),
        "media_usage_overall": media_usage_rate(df),
    }


def generate_insights(summary: dict) -> list[str]:
    if not summary:
        return ["分析対象の投稿データがまだありません。"]

    insights = []
    top_media = summary["media_usage_top"]
    all_media = summary["media_usage_overall"]
    if top_media["image"] > all_media["image"] + 0.1:
        insights.append(
            f"画像付き投稿は人気投稿の{top_media['image']:.0%}を占め、"
            f"全体平均({all_media['image']:.0%})より高い傾向があります。"
        )
    if top_media["video"] > all_media["video"] + 0.1:
        insights.append(f"動画付き投稿は人気投稿の{top_media['video']:.0%}を占めています。")

    top_categories = summary["category_distribution_top"]
    if top_categories:
        best = max(top_categories, key=top_categories.get)
        insights.append(f"人気投稿では「{best}」系のコンテンツが多く見られます。")

    if summary["best_hours"]:
        hours = "、".join(f"{h}時台" for h in summary["best_hours"])
        insights.append(f"人気投稿が多い時間帯: {hours}")

    diff = summary["avg_text_length_top"] - summary["avg_text_length_overall"]
    if abs(diff) > 10:
        insights.append(f"人気投稿は全体平均より文章が{'長め' if diff > 0 else '短め'}の傾向があります。")

    return insights or ["明確な傾向差は見つかりませんでした。"]
