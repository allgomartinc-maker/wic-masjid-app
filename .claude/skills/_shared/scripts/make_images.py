#!/usr/bin/env python3
"""
Render blog images from a JSON spec.

The blog-image-generator skill writes a spec describing the images an article
needs; this script renders them deterministically with Pillow. Everything is
drawn from vectors and text, so output is crisp, on-brand, reproducible, and
free of the artefacts a diffusion model puts in charts and labels.

    python3 make_images.py --spec spec.json --outdir outputs/<slug>/images

Supported image types
  featured    1200x630 hero card (eyebrow + title + brand footer)
  bar_chart   horizontal bars with value labels — cost/price comparisons
  checklist   numbered or ticked list card — steps, factors, takeaways
  comparison  two-column "this vs that" card

The spec's `alt` text for each image is copied into images.json, which the
wordpress-publisher skill reads when uploading media.
"""

from __future__ import annotations

import argparse
import json
import os
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit("Pillow is required:  pip install Pillow")

FONT_CANDIDATES = {
    "bold": [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
    ],
    "regular": [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
    ],
}

DEFAULT_PALETTE = {
    "ink": "#0F2436",
    "surface": "#FFFFFF",
    "muted": "#5A6B7B",
    "accent": "#1F7A8C",
    "accent_soft": "#DCEEF2",
    "wash": "#F4F8FA",
}


def font(weight: str, size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES[weight]:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    for path in FONT_CANDIDATES["regular"]:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def wrap(draw, text: str, fnt, max_width: int) -> list[str]:
    words, lines, current = text.split(), [], ""
    for word in words:
        trial = f"{current} {word}".strip()
        if draw.textlength(trial, font=fnt) <= max_width or not current:
            current = trial
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def fit_title(draw, text: str, max_width: int, max_lines: int, start: int, floor: int):
    """Shrink the title until it fits the box — never let it overflow."""
    size = start
    while size > floor:
        fnt = font("bold", size)
        lines = wrap(draw, text, fnt, max_width)
        if len(lines) <= max_lines:
            return fnt, lines, size
        size -= 4
    fnt = font("bold", floor)
    return fnt, wrap(draw, text, fnt, max_width)[:max_lines], floor


def brand_footer(draw, spec, pal, width, height, pad):
    """Accent rule + brand wordmark along the bottom of a card."""
    brand = spec.get("brand", {})
    label = brand.get("name", "")
    site = brand.get("site", "")
    y = height - pad - 26
    draw.line([(pad, y - 22), (pad + 72, y - 22)], fill=pal["accent"], width=5)
    if label:
        draw.text((pad, y), label, font=font("bold", 24), fill=pal["ink"])
    if site:
        f = font("regular", 20)
        draw.text((width - pad - draw.textlength(site, font=f), y + 3), site, font=f, fill=pal["muted"])


def render_featured(spec, pal, out_path):
    w, h = spec.get("width", 1200), spec.get("height", 630)
    pad = 72
    img = Image.new("RGB", (w, h), pal["surface"])
    d = ImageDraw.Draw(img)

    # Soft geometric field on the right — visual interest without stock art.
    d.rectangle([w - 260, 0, w, h], fill=pal["wash"])
    d.ellipse([w - 210, 80, w - 30, 260], fill=pal["accent_soft"])
    d.ellipse([w - 150, 300, w - 60, 390], fill=pal["accent"])
    d.rectangle([w - 230, 430, w - 70, 470], fill=pal["accent_soft"])
    d.rectangle([w - 230, 490, w - 130, 530], fill=pal["accent_soft"])

    text_w = w - (pad * 2) - 280
    y = pad + 10

    eyebrow = spec.get("eyebrow", "")
    if eyebrow:
        f = font("bold", 22)
        d.text((pad, y), eyebrow.upper(), font=f, fill=pal["accent"])
        y += 46

    fnt, lines, size = fit_title(d, spec.get("title", ""), text_w, 4, 62, 34)
    for line in lines:
        d.text((pad, y), line, font=fnt, fill=pal["ink"])
        y += int(size * 1.22)

    sub = spec.get("subtitle", "")
    if sub:
        y += 12
        f = font("regular", 26)
        for line in wrap(d, sub, f, text_w)[:3]:
            d.text((pad, y), line, font=f, fill=pal["muted"])
            y += 36

    brand_footer(d, spec, pal, w, h, pad)
    img.save(out_path, "PNG", optimize=True)


def render_bar_chart(spec, pal, out_path):
    w, h = spec.get("width", 1200), spec.get("height", 800)
    pad = 72
    img = Image.new("RGB", (w, h), pal["surface"])
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w, 10], fill=pal["accent"])

    y = pad
    fnt, lines, size = fit_title(d, spec.get("title", ""), w - pad * 2, 2, 44, 30)
    for line in lines:
        d.text((pad, y), line, font=fnt, fill=pal["ink"])
        y += int(size * 1.25)

    if spec.get("subtitle"):
        f = font("regular", 22)
        for line in wrap(d, spec["subtitle"], f, w - pad * 2)[:2]:
            d.text((pad, y), line, font=f, fill=pal["muted"])
            y += 32
    y += 24

    series = spec.get("series", [])
    if not series:
        raise ValueError("bar_chart needs a non-empty 'series'")

    label_font, note_font = font("bold", 24), font("regular", 22)
    label_w = max(d.textlength(s["label"], font=label_font) for s in series)
    label_w = min(label_w, (w - pad * 2) * 0.42)

    # Reserve room for the footer, plus a clear band for the footnote so the
    # two never collide.
    footnote_room = 52 if spec.get("footnote") else 0
    footer_room = 110 + footnote_room
    available = h - y - footer_room
    row_h = max(48, min(96, int(available / max(len(series), 1))))
    bar_h = int(row_h * 0.52)

    bar_x = pad + label_w + 28
    # The value note is drawn to the right of each bar, so the track must stop
    # far enough from the edge that the widest note still fits on canvas.
    note_w = max(d.textlength(s.get("note", str(s["value"])), font=note_font) for s in series)
    bar_max = int(w - pad - bar_x - note_w - 32)
    top = max(s["value"] for s in series) or 1

    for s in series:
        d.text((pad, y + (bar_h - 24) // 2), s["label"], font=label_font, fill=pal["ink"])
        d.rectangle([bar_x, y, bar_x + bar_max, y + bar_h], fill=pal["wash"])
        length = max(6, int(bar_max * (s["value"] / top)))
        d.rectangle([bar_x, y, bar_x + length, y + bar_h], fill=s.get("color", pal["accent"]))
        note = s.get("note", str(s["value"]))
        d.text((bar_x + length + 16, y + (bar_h - 22) // 2), note, font=note_font, fill=pal["ink"])
        y += row_h

    if spec.get("footnote"):
        f = font("regular", 19)
        # Sits above the footer's accent rule (drawn at h - pad - 48).
        fy = h - pad - 96
        for line in wrap(d, spec["footnote"], f, w - pad * 2)[:2]:
            d.text((pad, fy), line, font=f, fill=pal["muted"])
            fy += 26
    brand_footer(d, spec, pal, w, h, pad)
    img.save(out_path, "PNG", optimize=True)


def render_checklist(spec, pal, out_path):
    w, h = spec.get("width", 1200), spec.get("height", 800)
    pad = 72
    img = Image.new("RGB", (w, h), pal["surface"])
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w, 10], fill=pal["accent"])

    y = pad
    fnt, lines, size = fit_title(d, spec.get("title", ""), w - pad * 2, 2, 44, 30)
    for line in lines:
        d.text((pad, y), line, font=fnt, fill=pal["ink"])
        y += int(size * 1.25)
    y += 18

    items = spec.get("items", [])
    if not items:
        raise ValueError("checklist needs a non-empty 'items'")

    numbered = spec.get("numbered", True)
    available = h - y - 130
    row_h = max(56, min(104, int(available / max(len(items), 1))))
    body = font("regular", 26)
    badge = font("bold", 24)

    for i, item in enumerate(items, 1):
        cy = y + row_h // 2 - 22
        d.ellipse([pad, cy, pad + 44, cy + 44], fill=pal["accent_soft"])
        mark = str(i) if numbered else "✓"
        d.text(
            (pad + 22 - d.textlength(mark, font=badge) / 2, cy + 8),
            mark,
            font=badge,
            fill=pal["accent"],
        )
        text_lines = wrap(d, item, body, w - pad * 2 - 70)[:2]
        ty = y + (row_h - len(text_lines) * 34) // 2
        for line in text_lines:
            d.text((pad + 68, ty), line, font=body, fill=pal["ink"])
            ty += 34
        y += row_h

    brand_footer(d, spec, pal, w, h, pad)
    img.save(out_path, "PNG", optimize=True)


def render_comparison(spec, pal, out_path):
    w, h = spec.get("width", 1200), spec.get("height", 800)
    pad = 72
    img = Image.new("RGB", (w, h), pal["surface"])
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w, 10], fill=pal["accent"])

    y = pad
    fnt, lines, size = fit_title(d, spec.get("title", ""), w - pad * 2, 2, 44, 30)
    for line in lines:
        d.text((pad, y), line, font=fnt, fill=pal["ink"])
        y += int(size * 1.25)
    y += 20

    columns = spec.get("columns", [])
    if len(columns) != 2:
        raise ValueError("comparison needs exactly 2 'columns'")

    gap = 32
    col_w = (w - pad * 2 - gap) // 2
    col_h = h - y - 130
    head, body = font("bold", 28), font("regular", 23)

    for idx, col in enumerate(columns):
        x = pad + idx * (col_w + gap)
        d.rectangle([x, y, x + col_w, y + col_h], fill=pal["wash"])
        d.rectangle([x, y, x + col_w, y + 66], fill=pal["accent"] if idx else pal["ink"])
        for line in wrap(d, col.get("heading", ""), head, col_w - 40)[:1]:
            d.text((x + 20, y + 18), line, font=head, fill=pal["surface"])
        iy = y + 90
        for item in col.get("items", []):
            d.ellipse([x + 22, iy + 9, x + 32, iy + 19], fill=pal["accent"])
            for line in wrap(d, item, body, col_w - 64)[:3]:
                d.text((x + 46, iy), line, font=body, fill=pal["ink"])
                iy += 31
            iy += 12

    brand_footer(d, spec, pal, w, h, pad)
    img.save(out_path, "PNG", optimize=True)


RENDERERS = {
    "featured": render_featured,
    "bar_chart": render_bar_chart,
    "checklist": render_checklist,
    "comparison": render_comparison,
}


def main() -> int:
    ap = argparse.ArgumentParser(description="Render blog images from a JSON spec.")
    ap.add_argument("--spec", required=True)
    ap.add_argument("--outdir", required=True)
    args = ap.parse_args()

    with open(args.spec, encoding="utf-8") as fh:
        spec = json.load(fh)

    pal = {**DEFAULT_PALETTE, **spec.get("palette", {})}
    brand = spec.get("brand", {})
    os.makedirs(args.outdir, exist_ok=True)

    manifest, failures = [], []
    for item in spec.get("images", []):
        kind = item.get("type")
        if kind not in RENDERERS:
            failures.append(f"{item.get('filename', '?')}: unknown type {kind!r}")
            continue
        if not item.get("alt"):
            failures.append(f"{item.get('filename', '?')}: missing alt text (required for image SEO)")
            continue

        item.setdefault("brand", brand)
        path = os.path.join(args.outdir, item["filename"])
        try:
            RENDERERS[kind](item, pal, path)
        except Exception as exc:
            failures.append(f"{item['filename']}: {exc}")
            continue

        with Image.open(path) as im:
            width, height = im.size
        manifest.append(
            {
                "filename": item["filename"],
                "path": path,
                "type": kind,
                "role": item.get("role", "supporting"),
                "alt": item["alt"],
                "title": item.get("title", ""),
                "caption": item.get("caption", ""),
                "width": width,
                "height": height,
                "bytes": os.path.getsize(path),
            }
        )
        print(f"rendered {path} ({width}x{height}, {os.path.getsize(path):,} bytes)")

    manifest_path = os.path.join(args.outdir, "images.json")
    with open(manifest_path, "w", encoding="utf-8") as fh:
        json.dump({"images": manifest, "failures": failures}, fh, indent=2, ensure_ascii=False)
    print(f"\nmanifest: {manifest_path} ({len(manifest)} images)")

    for f in failures:
        print(f"FAILED  {f}", file=sys.stderr)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
