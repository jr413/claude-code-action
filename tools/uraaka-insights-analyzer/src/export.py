"""CSV / PDF エクスポート。"""

import io
from pathlib import Path

import pandas as pd
from fpdf import FPDF
from fpdf.enums import WrapMode

# fpdf2 のコアフォントは Latin-1 のみ対応のため、日本語対応フォントを探して埋め込む。
_JP_FONT_CANDIDATES = [
    "/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf",
    "/usr/share/fonts/truetype/fonts-japanese-gothic.ttf",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc",
    "C:/Windows/Fonts/meiryo.ttc",
    "C:/Windows/Fonts/msgothic.ttc",
]


def export_csv(df: pd.DataFrame) -> bytes:
    return df.to_csv(index=False).encode("utf-8-sig")


def find_japanese_font() -> str | None:
    return next((p for p in _JP_FONT_CANDIDATES if Path(p).exists()), None)


def export_pdf_report(title: str, summary: dict, insights: list[str], font_path: str | None = "auto") -> bytes:
    if font_path == "auto":
        font_path = find_japanese_font()

    pdf = FPDF()
    pdf.add_page()
    if font_path:
        pdf.add_font("jp", "", font_path)
        font = "jp"
        fmt = str
    else:
        font = "Helvetica"
        fmt = lambda s: str(s).encode("latin-1", errors="replace").decode("latin-1")  # noqa: E731

    def line(text: str, size: int, height: float) -> None:
        pdf.set_font(font, "", size)
        pdf.multi_cell(0, height, fmt(text), new_x="LMARGIN", new_y="NEXT", wrapmode=WrapMode.CHAR)

    line(title, 16, 10)
    if not font_path:
        line("(Japanese font not found - non-Latin characters replaced)", 8, 5)

    pdf.ln(4)
    line("Summary", 12, 8)
    for key, value in summary.items():
        if not isinstance(value, dict):
            line(f"{key}: {value}", 10, 6)

    pdf.ln(4)
    line("Insights", 12, 8)
    for text in insights:
        line(f"- {text}", 10, 6)

    buffer = io.BytesIO()
    pdf.output(buffer)
    return buffer.getvalue()
