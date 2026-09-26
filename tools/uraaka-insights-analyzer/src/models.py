"""公開投稿データの分析用データモデル。"""

from dataclasses import dataclass, field
from datetime import datetime

CONTENT_CATEGORIES = ["日常", "エロ", "ユーモア", "愚痴", "自慢", "その他"]


@dataclass
class Account:
    username: str
    display_name: str = ""
    is_self: bool = False
    added_at: datetime = field(default_factory=datetime.now)


@dataclass
class Post:
    account_username: str
    post_id: str
    text: str
    created_at: datetime
    like_count: int = 0
    repost_count: int = 0
    quote_count: int = 0
    reply_count: int = 0
    has_image: bool = False
    has_video: bool = False
    hashtags: list = field(default_factory=list)
    content_category: str = "その他"

    @property
    def engagement_score(self) -> float:
        return self.like_count + self.repost_count * 2 + self.quote_count * 2 + self.reply_count
