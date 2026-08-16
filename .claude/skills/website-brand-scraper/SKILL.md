---
name: website-brand-scraper
description: Read the user's own website to build a reusable brand profile — voice, audience, services, proof points, and the internal-link map used for linking new articles. Use before writing any on-brand content, when asked to "learn our brand voice", "scrape our site", or when a blog post needs real internal links to existing pages.
---

# Website brand scraper

Turns the brand's own site into `outputs/_brand/brand-profile.json` — a cached
profile the writer reads so every article sounds like the brand and links to
pages that actually exist.

Read `.claude/skills/agent.config.json` for `brand.site_url` and
`brand.voice_profile_path`.

## When to re-run

The profile is cached. Reuse it if it is under 30 days old and the site has not
changed. Re-run when the brand adds services, relaunches, or the user asks.

## Step 1 — crawl

```bash
python3 .claude/skills/_shared/scripts/crawl_site.py "$BRAND_URL" \
  --max-pages 30 --delay 1 --out outputs/_brand/raw-crawl.json
```

Prioritise, in order: home, about, services/products, pricing, contact, the
blog index, and the 10 most recent posts.

**If the crawler exits 3** (network egress blocked), fall back to `WebFetch`
per URL. If `WebFetch` is blocked too, use `WebSearch` with `site:<domain>` and
targeted queries to recover the page inventory and positioning from titles,
snippets and indexed URLs. Record the degraded method in the profile's
`provenance` field and mark the affected fields `confidence: "low"` — never let
a reader assume a SERP-derived voice profile was read off the site.

## Step 2 — extract the profile

Read the crawl output and write `outputs/_brand/brand-profile.json`:

```json
{
  "brand_name": "", "site_url": "", "tagline": "",
  "provenance": { "method": "crawl|webfetch|websearch", "pages_read": 0, "date": "" },
  "audience": { "primary": "", "secondary": "", "pain_points": [] },
  "voice": {
    "tone": "e.g. warm, plain-spoken, evidence-first",
    "person": "second person / first person plural",
    "sentence_style": "short declaratives; minimal jargon",
    "reading_level": "grade 8-10",
    "vocabulary_prefers": [], "vocabulary_avoids": [],
    "sample_sentences": ["3-5 verbatim sentences from the site"]
  },
  "offering": { "services": [], "differentiators": [], "proof_points": [] },
  "internal_links": [
    { "url": "", "title": "", "topic": "", "suggested_anchor": "", "type": "service|blog|about|contact" }
  ],
  "existing_blog_topics": [],
  "cannibalisation_risk": ["urls already targeting the planned keyword"],
  "brand_colors": [], "cta": { "primary": "", "url": "" },
  "confidence": "high|medium|low"
}
```

Rules for the fields that matter most:

- **voice.sample_sentences** must be verbatim from the site. They anchor the
  writer far better than adjectives do.
- **internal_links** should hold 10–25 genuinely linkable pages, each with a
  natural-language `suggested_anchor` — never "click here" and never the raw
  URL. Include the topic so the writer can match links to context.
- **cannibalisation_risk** is the important one: list any existing URL already
  targeting the planned keyword. The writer must either target a different
  angle or recommend updating the existing post instead of publishing a rival.
- Do not invent services, clients, or credentials. Absent evidence, leave the
  field empty and note it.

## Step 3 — report

Print a short summary: pages read, voice in one sentence, number of linkable
pages found, and any cannibalisation risk. Flag it loudly if the site's actual
subject is unrelated to the topic being written — that mismatch is the user's
call to make, not something to paper over.
