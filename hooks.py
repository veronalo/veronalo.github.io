"""Small HTML performance improvements applied during MkDocs builds."""

from __future__ import annotations

import re


IMG_TAG = re.compile(r"<img\b[^>]*>", re.IGNORECASE)


def _lazy_image(match: re.Match[str]) -> str:
    tag = match.group(0)
    if " loading=" not in tag.lower():
        tag = tag[:-1] + ' loading="lazy">'
    if " decoding=" not in tag.lower():
        tag = tag[:-1] + ' decoding="async">'
    return tag


def on_page_content(html: str, **_kwargs: object) -> str:
    """Lazy-load article images; CSS hero backgrounds are unaffected."""
    return IMG_TAG.sub(_lazy_image, html)
