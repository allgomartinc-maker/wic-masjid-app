---
name: blog-writer-seo-aeo-geo
description: Write a complete, publication-ready blog post optimised for Google rankings, featured-snippet/answer-box capture, and citation by AI engines like ChatGPT, Gemini, Perplexity and AI Overviews. Produces title, meta title, meta description, slug, body with headings, FAQ section with schema, and internal links. Use after research and brand analysis are done, or whenever asked to write an SEO article, AEO/GEO-optimised content, or a blog post in a brand's voice.
---

# Blog writer — SEO + AEO + GEO

Writes the article. Inputs are the research already on disk; outputs are the
files the image generator and publisher consume.

## Inputs (read all of these first)

| File | Gives you |
|---|---|
| `research/content-brief.md` | intent, outline, must-answer questions, gap |
| `research/keyword-cluster.md` | primary / secondary / long-tail keywords |
| `research/competitor-analysis.md` | table stakes, the gap, depth benchmark |
| `research/geo-analysis.md` | the AI-citation checklist to satisfy |
| `outputs/_brand/brand-profile.json` | voice, audience, internal links, CTA |
| `.claude/skills/agent.config.json` | word counts, limits, minimums |

If any is missing, say so and either run the producing skill or write with the
gap explicitly noted. Do not silently invent the missing input.

See `references/aeo-geo-rules.md` for the full ruleset this skill enforces.

## The three optimisations, in one article

- **SEO** gets it ranked: keyword placement, structure, internal links, depth.
- **AEO** gets it into the answer box: a short extractable answer under every
  question heading.
- **GEO** gets it quoted by LLMs: self-contained, specific, attributed claims.

They do not conflict. A page that answers a question crisply in its own right
wins all three. Write for the reader; the structure below is what makes that
reader-first answer machine-readable too.

## Structure

**Title (H1).** Front-load the primary keyword. Question-form titles win for
question queries. ≤ 65 characters. Add the year only if the topic is
time-sensitive (pricing, tools, regulations) — and then keep it accurate.

**Answer block — the single most important element.** Immediately under the
H1, before any preamble: a 40–60 word direct answer to the title question,
containing the specific number, range or verdict. No throat-clearing, no "in
this article we will". This is what the snippet and the LLM lift.

**Intro (60–100 words).** Who this is for, what they will be able to decide by
the end. Ends by pointing at the first section.

**Body (5–9 H2 sections).** Each H2 owns one secondary keyword and is phrased
as a reader would ask it. Under every H2: a 1–3 sentence direct answer, then
the detail. Use H3s for sub-questions. Include at minimum one table and one
list — both are extracted verbatim into AI answers and snippets.

**FAQ (5+ questions).** Real long-tail questions from the research, not
invented ones. Each answer 40–70 words, self-contained, answering in the first
sentence. Emit `FAQPage` JSON-LD covering exactly these Q&As.

**Conclusion.** The decision the reader should now make, plus one clear CTA
from the brand profile. No new information.

## Non-negotiable rules

1. **Never fabricate.** Every number, price, statistic and quote traces to a
   source URL in the research files. No source → cut the claim or write
   "varies by provider". A confidently wrong price is worse than no price.
2. **Attribute in-sentence.** "According to Cast AI's 2026 analysis, …" — an
   attribution that survives being quoted out of context, unlike a bare link.
3. **Date time-sensitive claims.** "As of August 2026" next to prices and
   tool capabilities.
4. **Self-contained paragraphs.** No "as we saw above", no dangling "this" or
   "it" referring across a heading. Assume each paragraph is quoted alone.
5. **Keyword placement, not density.** Primary keyword in: H1, the answer
   block, one H2, the first 100 words, meta title, meta description, slug, the
   featured-image filename and alt. Then stop. Write naturally; use synonyms
   and related entities.
6. **Internal links.** At least `content_defaults.internal_links_min` (3),
   drawn only from `brand_profile.internal_links` — links to pages that exist.
   Descriptive anchors. Never "click here".
7. **External citations.** At least 4, to authoritative non-competitor
   sources, opening the claim they support.
8. **Voice.** Match `brand_profile.voice`, including its sample sentences.
9. **No AI tells.** Cut "In today's fast-paced digital landscape", "delve",
   "unlock the power of", "it's important to note that", "navigate the
   complexities of". Vary sentence length. Prefer concrete nouns to abstract
   ones.
10. **Cannibalisation.** If `brand_profile.cannibalisation_risk` names a page
    already targeting this keyword, stop and recommend updating that page
    instead. Say it before writing 1,800 words nobody should publish.

## Outputs

Write all four into `outputs/<slug>/content/`:

### `article.md`
Human-readable draft for review. Full body in Markdown, with a front-matter
block carrying the meta fields.

### `article.html`
The WordPress body. Clean semantic HTML — `<h2>`, `<h3>`, `<p>`, `<ul>`,
`<table>`, `<img>`, `<a>`. No `<h1>` (WordPress renders the title), no inline
styles, no `<html>`/`<body>` wrapper. Append the JSON-LD in a
`<script type="application/ld+json">` block. Reference images as
`src="images/<filename>"`.

### `post.json`
Exactly the shape `wp_publish.py` expects:

```json
{
  "title": "", "slug": "", "status": "draft",
  "excerpt": "", "meta_title": "", "meta_description": "",
  "focus_keyword": "", "categories": [], "tags": [],
  "body_file": "article.html"
}
```

- `meta_title` ≤ 60 chars, `meta_description` ≤ 155 chars — count them, do not
  estimate. The description must contain the primary keyword and a reason to
  click, and read as a sentence rather than a keyword list.
- `slug` is lowercase-hyphenated, 3–6 words, keyword-bearing, no stop-word
  padding, no year.

### `seo-checklist.md`
Self-audit. Every rule above listed with `pass` / `fail` and the evidence
(actual character counts, actual link count, actual word count). An honest
`fail` is useful; a `pass` you did not verify is not.

## Word count

Target `content_defaults.target_word_count`, adjusted to the competitor depth
benchmark. Beat the median, do not pad to beat the maximum. Length that does
not add information costs rankings rather than winning them.
