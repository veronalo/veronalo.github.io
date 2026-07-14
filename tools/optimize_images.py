"""Optimize MkDocs raster images and keep originals outside ``docs``.

Run from the repository root:

    python tools/optimize_images.py

JPEG and PNG files below the selected content directories are resized to a
maximum edge of 1600 px and written as WebP. The originals are moved to
``source-images`` using the same relative path, so MkDocs will not publish
them. Text references in Markdown and theme files are updated automatically.
"""

from __future__ import annotations

import re
import shutil
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
ARCHIVE = ROOT / "source-images"
IMAGE_DIRS = (DOCS / "assets" / "img", DOCS / "images")
EXTRA_IMAGES = (DOCS / "assets" / "logo2.png",)
TEXT_GLOBS = (
    "mkdocs.yml",
    "docs/**/*.md",
    "docs/**/*.html",
    "docs/**/*.css",
    "overrides/**/*.html",
    "overrides/**/*.css",
)
MAX_EDGE = 1600
WEBP_QUALITY = 80


def candidate_images() -> list[Path]:
    images: list[Path] = [path for path in EXTRA_IMAGES if path.exists()]
    for directory in IMAGE_DIRS:
        if directory.exists():
            images.extend(
                path
                for path in directory.rglob("*")
                if path.is_file()
                and "备选" not in path.parts
                and path.suffix.lower() in {".jpg", ".jpeg", ".png"}
            )
    return sorted(images)


def convert(source: Path) -> Path:
    destination = source.with_suffix(".webp")
    archive_path = ARCHIVE / source.relative_to(ROOT)
    archive_path.parent.mkdir(parents=True, exist_ok=True)

    # Keep an existing hand-tuned WebP (the home hero images use these).
    if not destination.exists():
        with Image.open(source) as opened:
            image = ImageOps.exif_transpose(opened)
            image.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)

            has_alpha = image.mode in {"RGBA", "LA"} or "transparency" in image.info
            if has_alpha:
                image = image.convert("RGBA")
            else:
                image = image.convert("RGB")

            destination.parent.mkdir(parents=True, exist_ok=True)
            image.save(destination, "WEBP", quality=WEBP_QUALITY, method=6)

    if archive_path.exists():
        raise FileExistsError(f"Archive already exists: {archive_path}")
    shutil.move(source, archive_path)
    return destination


def update_references(replacements: dict[str, str]) -> int:
    changed = 0
    files: set[Path] = set()
    for pattern in TEXT_GLOBS:
        files.update(ROOT.glob(pattern))

    for path in sorted(files):
        original = path.read_text(encoding="utf-8")
        updated = original
        for old_name, new_name in replacements.items():
            updated = re.sub(re.escape(old_name) + r"(?=[\"')\s?#]|$)", new_name, updated)
        if updated != original:
            path.write_text(updated, encoding="utf-8", newline="")
            changed += 1
    return changed


def main() -> None:
    replacements: dict[str, str] = {}
    before = 0
    after = 0

    for source in candidate_images():
        before += source.stat().st_size
        destination = convert(source)
        after += destination.stat().st_size
        replacements[source.name] = destination.name
        print(f"{source.relative_to(ROOT)} -> {destination.relative_to(ROOT)}")

    changed = update_references(replacements)
    saved = before - after
    print(f"Converted {len(replacements)} images; updated {changed} text files.")
    print(f"Published image size: {before / 1024**2:.2f} MiB -> {after / 1024**2:.2f} MiB ({saved / 1024**2:.2f} MiB saved).")


if __name__ == "__main__":
    main()
