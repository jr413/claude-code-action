"""UraAka Insights Analyzer - Streamlit ダッシュボード。

自動投稿・DM・ターゲティング機能は一切含まない、公開データの分析専用ツール。
"""

from datetime import datetime

import pandas as pd
import plotly.express as px
import streamlit as st

from src import storage
from src.analysis.comparison import compare_accounts, diff_against_self
from src.analysis.success_patterns import generate_insights, summarize_top_posts, top_posts
from src.analysis.trends import WEEKDAYS, category_distribution, media_usage_rate, posts_to_dataframe, top_hashtags
from src.collectors import manual as manual_collector
from src.collectors import x_api
from src.export import export_csv, export_pdf_report, find_japanese_font
from src.models import Account

st.set_page_config(page_title="UraAka Insights Analyzer", layout="wide")
storage.init_db()

st.title("UraAka Insights Analyzer")
st.caption("公開投稿データの統計分析のみを行うツールです。自動投稿・いいね・フォロー・DM 送信の機能はありません。")

accounts = storage.list_accounts()
account_names = [a.username for a in accounts]

with st.sidebar:
    st.header("分析対象アカウント")
    with st.form("add_account_form", clear_on_submit=True):
        new_username = st.text_input("ユーザー名（@なし）")
        new_display_name = st.text_input("表示名（任意）")
        is_self = st.checkbox("自分のアカウント")
        if st.form_submit_button("登録") and new_username.strip():
            username = new_username.strip().lstrip("@")
            storage.add_account(Account(username=username, display_name=new_display_name, is_self=is_self))
            st.rerun()

    if account_names:
        st.divider()
        st.subheader("データ取り込み")
        target = st.selectbox("対象アカウント", account_names)

        with st.expander("公式 X API から取得"):
            max_results = st.slider("取得件数", 5, 100, 30)
            if st.button("取得する"):
                try:
                    count = storage.upsert_posts(x_api.fetch_recent_posts(target, max_results=max_results))
                    st.success(f"{count} 件取得しました")
                except x_api.XApiError as e:
                    st.error(str(e))

        with st.expander("CSV アップロード"):
            st.caption("必須列: " + ", ".join(manual_collector.REQUIRED_CSV_COLUMNS))
            uploaded = st.file_uploader("CSV を選択", type="csv")
            if uploaded is not None and st.button("取り込む"):
                try:
                    count = storage.upsert_posts(manual_collector.parse_csv(uploaded))
                    st.success(f"{count} 件取り込みました")
                except (ValueError, KeyError) as e:
                    st.error(str(e))

        with st.expander("手動で1件入力"):
            with st.form("manual_post_form", clear_on_submit=True):
                text = st.text_area("投稿テキスト")
                created_date = st.date_input("投稿日")
                created_time = st.time_input("投稿時刻")
                c1, c2 = st.columns(2)
                likes = c1.number_input("いいね", min_value=0)
                reposts = c2.number_input("リポスト", min_value=0)
                quotes = c1.number_input("引用", min_value=0)
                replies = c2.number_input("返信", min_value=0)
                has_image = st.checkbox("画像あり")
                has_video = st.checkbox("動画あり")
                tags = st.text_input("ハッシュタグ（カンマ区切り）")
                if st.form_submit_button("追加") and text.strip():
                    storage.upsert_posts([
                        manual_collector.build_post_from_form(
                            account_username=target,
                            text=text,
                            created_at=datetime.combine(created_date, created_time),
                            like_count=int(likes),
                            repost_count=int(reposts),
                            quote_count=int(quotes),
                            reply_count=int(replies),
                            has_image=has_image,
                            has_video=has_video,
                            hashtags=[t.strip().lstrip("#") for t in tags.split(",") if t.strip()],
                        )
                    ])
                    st.success("追加しました")

if not account_names:
    st.info("サイドバーから分析対象アカウントを登録してください。")
    st.stop()

all_df = posts_to_dataframe(storage.get_posts())


def account_df(username: str) -> pd.DataFrame:
    return all_df[all_df["account_username"] == username]


tab_overview, tab_success, tab_compare, tab_export = st.tabs(["概要", "人気投稿分析", "比較", "エクスポート"])

with tab_overview:
    selected = st.selectbox("アカウント", account_names, key="overview")
    df = account_df(selected)
    if df.empty:
        st.info("投稿データがまだありません。")
    else:
        c1, c2, c3 = st.columns(3)
        c1.metric("投稿数", len(df))
        c2.metric("平均エンゲージメント", f"{df['engagement_score'].mean():.1f}")
        c3.metric("平均文字数", f"{df['text_length'].mean():.0f}")

        st.subheader("投稿時間帯ヒートマップ（曜日 × 時間）")
        heat = df.pivot_table(index="weekday", columns="hour", values="post_id", aggfunc="count", fill_value=0)
        heat = heat.reindex(index=WEEKDAYS, columns=range(24), fill_value=0)
        st.plotly_chart(px.imshow(heat, aspect="auto", color_continuous_scale="Blues"), width="stretch")

        left, right = st.columns(2)
        with left:
            st.subheader("コンテンツ分類")
            cats = category_distribution(df)
            st.plotly_chart(px.pie(values=cats.values, names=cats.index), width="stretch")
        with right:
            st.subheader("メディア利用率")
            st.bar_chart(pd.Series(media_usage_rate(df)))

        st.subheader("エンゲージメントの推移")
        st.plotly_chart(px.line(df.sort_values("created_at"), x="created_at", y="engagement_score", markers=True), width="stretch")

        st.subheader("よく使われるハッシュタグ")
        tags = top_hashtags(df)
        if tags:
            st.dataframe(pd.DataFrame(tags, columns=["hashtag", "count"]), width="stretch")
        else:
            st.caption("ハッシュタグは見つかりませんでした。")

with tab_success:
    selected = st.selectbox("アカウント", account_names, key="success")
    df = account_df(selected)
    if df.empty:
        st.info("投稿データがまだありません。")
    else:
        top_pct = st.slider("上位何%を人気投稿とするか", 5, 30, 10) / 100
        summary = summarize_top_posts(df, top_pct=top_pct)
        st.subheader("参考インサイト")
        for text in generate_insights(summary):
            st.markdown(f"- {text}")
        st.subheader("人気投稿一覧")
        st.dataframe(
            top_posts(df, top_pct=top_pct)[["created_at", "text", "engagement_score", "content_category", "like_count", "repost_count"]],
            width="stretch",
        )

with tab_compare:
    chosen = st.multiselect("比較するアカウント", account_names, default=account_names[:2])
    if len(chosen) < 2:
        st.info("2つ以上選択してください。")
    else:
        comparison = compare_accounts(all_df[all_df["account_username"].isin(chosen)])
        if comparison.empty:
            st.info("選択したアカウントの投稿データがありません。")
        else:
            st.dataframe(comparison, width="stretch")
            st.plotly_chart(px.bar(comparison, x="account_username", y="avg_engagement"), width="stretch")
            me = next((a.username for a in accounts if a.is_self and a.username in chosen), None)
            if me:
                st.subheader(f"自分（@{me}）との差分（自分 − 相手）")
                st.dataframe(diff_against_self(comparison, me), width="stretch")

with tab_export:
    selected = st.selectbox("アカウント", account_names, key="export")
    df = account_df(selected)
    if df.empty:
        st.info("投稿データがまだありません。")
    else:
        st.download_button("CSV をダウンロード", export_csv(df), f"{selected}_posts.csv", "text/csv")
        if find_japanese_font() is None:
            st.warning("日本語フォントが見つからないため、PDF の日本語は置換されます。")
        if st.button("PDF レポートを作成"):
            summary = summarize_top_posts(df)
            pdf = export_pdf_report(f"@{selected} Insights Report", summary, generate_insights(summary))
            st.download_button("PDF をダウンロード", pdf, f"{selected}_report.pdf", "application/pdf")
