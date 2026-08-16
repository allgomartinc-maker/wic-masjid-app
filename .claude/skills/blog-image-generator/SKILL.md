---
name: blog-image-generator
description: Create a featured image and supporting graphics for a blog post, with SEO-friendly filenames, correct dimensions and descriptive alt text. Use when an article needs images, a hero/featured image, charts or diagrams for publication, or when preparing media for a WordPress upload.
---

# Blog image generator

Produces publication-ready PNGs plus an `images.json` manifest that the
wordpress-publisher uploads. Images are rendered from vectors and text by
`_shared/scripts/make_images.py`, which means labels and numbers are always
legible and correct — the failure mode diffusion models have with charts and
text.

## Step 1 — decide what the article needs

Minimum: **1 featured image + 2 supporting images.** Choose supporting images
that carry information the prose cannot show at a glance:

| Article contains | Use type |
|---|---|
| Prices, ranges, tiers, any comparison of magnitudes | `bar_chart` |
| Steps, factors, a checklist, "what affects X" | `checklist` |
| Two options weighed against each other (DIY vs agency, A vs B) | `comparison` |
| The hero card | `featured` |

Every supporting image must restate a real number or claim from the article.
An image that decorates but informs nothing is not worth the page weight.

## Step 2 — write the spec

Create `outputs/<slug>/images/spec.json`. Pull `palette` and `brand` from
`.claude/skills/agent.config.json` (use the brand's real colours if the
website-brand-scraper found them).

```json
{
  "brand": { "name": "Bluetarg", "site": "bluetarg.com" },
  "palette": { "ink": "#0F2436", "accent": "#1F7A8C", "accent_soft": "#DCEEF2",
               "wash": "#F4F8FA", "surface": "#FFFFFF", "muted": "#5A6B7B" },
  "images": [
    { "type": "featured", "role": "featured",
      "filename": "llm-optimization-cost-small-business.png",
      "width": 1200, "height": 630,
      "eyebrow": "Pricing guide", "title": "How Much Does LLM Optimization Cost?",
      "subtitle": "Real 2026 price ranges for small businesses",
      "alt": "Guide to LLM optimization costs for small businesses in 2026" },

    { "type": "bar_chart", "filename": "llm-optimization-cost-by-tier.png",
      "title": "Monthly cost by service tier",
      "subtitle": "Typical small-business ranges, 2026",
      "series": [
        { "label": "DIY tools", "value": 150, "note": "$50–$150/mo" },
        { "label": "Freelancer", "value": 900, "note": "$500–$900/mo" }
      ],
      "footnote": "Ranges compiled from published 2026 agency pricing.",
      "alt": "Bar chart comparing monthly LLM optimization costs: DIY tools $50–150, freelancer $500–900" }
  ]
}
```

### Filenames

Lowercase, hyphenated, keyword-bearing, `.png`. Include the primary keyword in
the featured image filename. No dates, no `image1`, no underscores.

### Alt text — the part that matters

Alt text is read by screen readers, Google Images, and increasingly by AI
answer engines. Write it as a sentence describing **what the image shows**,
including the actual numbers for data graphics.

- Good: `Bar chart comparing monthly LLM optimization costs: DIY tools $50–150, freelancer $500–900, agency $2,000–5,000`
- Bad: `LLM optimization cost chart` (says nothing), `llm optimization cost small business pricing seo` (keyword stuffing)

Keep it under ~125 characters where possible, never stuff keywords, and never
start with "Image of". The script **refuses to render an image with no alt
text** — this is deliberate.

## Step 3 — render

```bash
python3 .claude/skills/_shared/scripts/make_images.py \
  --spec outputs/<slug>/images/spec.json \
  --outdir outputs/<slug>/images
```

Writes the PNGs and `images/images.json` (filename, path, role, alt, caption,
dimensions, byte size). Non-zero exit means at least one image failed — read
the `failures` array in the manifest, fix the spec, re-run.

## Step 4 — verify

Open each PNG with the Read tool and actually look at it. Check: no clipped or
overflowing text, bars proportional to their values, labels matching the
article's numbers, adequate contrast. Fix and re-render rather than shipping a
broken graphic.

Then reference them in the article HTML as
`<img src="images/<filename>" alt="<same alt text>" width="..." height="...">`
— the publisher rewrites those `src` paths to the uploaded media URLs.

## Adding a new image type

Add a `render_<name>(spec, palette, out_path)` function to
`make_images.py` and register it in the `RENDERERS` dict. Keep the same
signature and honour `brand_footer` for visual consistency.
