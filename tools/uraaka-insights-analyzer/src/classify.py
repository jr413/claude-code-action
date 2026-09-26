"""投稿テキストの簡易カテゴリ分類（キーワードベース）。"""

from .models import CONTENT_CATEGORIES

_KEYWORDS = {
    "エロ": ["エロ", "えっち", "性癖", "秘密", "大人の"],
    "愚痴": ["疲れた", "しんどい", "つらい", "嫌になる", "無理"],
    "自慢": ["買った", "行ってきた", "達成", "1位", "褒められ"],
    "ユーモア": ["笑", "www", "草", "面白い", "ネタ"],
    "日常": ["今日", "朝", "昼", "夜ご飯", "散歩", "天気"],
}


def classify_text(text: str) -> str:
    scores = {category: 0 for category in CONTENT_CATEGORIES}
    lowered = text.lower()
    for category, keywords in _KEYWORDS.items():
        scores[category] = sum(1 for k in keywords if k.lower() in lowered)
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "その他"
