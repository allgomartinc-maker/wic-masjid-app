---
name: seo
description: Research a topic for search and AI-answer visibility — content briefs, single-page SEO audits, keyword clusters, and GEO (AI search) checks. Use when asked to research a topic before writing, audit a URL's on-page SEO, find keywords for a subject, or assess how a topic is answered by ChatGPT/Gemini/Perplexity/AI Overviews. Provides the /seo content-brief, /seo page, /seo cluster and /seo geo commands the content-agent-orchestrator depends on.
---

# SEO / AEO / GEO research

Four research commands. Each writes a Markdown report into
`<output_root>/<topic-slug>/research/` so later skills can read the findings
instead of re-deriving them.

> **Note on provenance.** This skill was authored for this repo because the
> `/mnt/skills/public/seo/` skill referenced in the build guide does not exist
> in this environment (`/mnt/skills/public/` is a read-only mount containing
> only docx, pdf, pptx, xlsx, file-reading, frontend-design and
> product-self-knowledge). If an official `seo` skill is added later, prefer it
> and delete this one.

## Tooling and its limits

| Need | Tool | Notes |
|---|---|---|
| SERP + "what does the web say" | `WebSearch` | Routed through Anthropic; works even when direct egress is blocked. |
| Read a specific page | `WebFetch` | Blocked by the egress proxy in some environments. |
| Bulk page structure | `_shared/scripts/crawl_site.py` | Needs direct network. Exits 3 when blocked. |

**Always record which tool produced each finding.** If `WebFetch` and the
crawler are both blocked, fall back to `WebSearch` and label those findings
`derived-from-SERP` rather than `verified-on-page`. Never present a summary of
search snippets as if you had read the page.

## Commands

### `/seo content-brief <topic>`

Produces the brief the writer works from. Steps:

1. `WebSearch` the topic verbatim. Record the top 10 results (title + URL).
2. `WebSearch` 3–5 reformulations: the question form, the "cost/price" form,
   the "best/vs" form, the "how to" form. Note which pages recur — recurrence
   across formulations signals topical authority Google already trusts.
3. Extract from the results: the dominant **search intent**
   (informational / commercial / transactional / navigational), the content
   format that ranks (listicle, guide, calculator, comparison), and the
   typical depth.
4. Harvest **People Also Ask**-style questions from result titles and snippets.
5. Identify the **content gap**: subtopics few or no ranking pages cover.

Write `research/content-brief.md` with: target query, intent, recommended
format and word count, the H2 outline to write against, must-answer questions,
entities and terms to include, the gap to exploit, and a Sources list.

### `/seo page <url>`

On-page audit of a single URL — use on competitor pages.

Try `WebFetch` first; if blocked, try
`python3 _shared/scripts/crawl_site.py <url> --max-pages 1`; if both fail, say
so and gather what you can via `WebSearch`.

Report, in `research/page-audit-<domain>.md`: title tag and length, meta
description and length, H1, the full H2/H3 outline, word count, schema types
present (`FAQPage`, `Article`, `HowTo`, `Product`…), FAQ blocks, internal links
with anchors, external citations, and **the three things this page does well
plus the three gaps to beat it on**.

### `/seo cluster <topic>`

Builds the keyword cluster. There is no paid keyword API here, so derive the
cluster from SERP evidence and label volumes qualitatively — never invent
numeric search volumes.

1. Run `WebSearch` across intent modifiers: `cost`, `price`, `how much`,
   `best`, `vs`, `for small business`, `worth it`, `pricing`, `calculator`.
2. Group what comes back into: **primary keyword** (one), **secondary**
   (3–6, each deserving its own H2), **long-tail / question** (8–15, these
   become FAQ entries and H3s), and **entities** (tools, vendors, standards,
   named concepts that must appear for topical completeness).
3. For each keyword note intent and an estimated difficulty of
   `low` / `medium` / `high`, justified by who ranks (forums and small blogs →
   low; entrenched vendor and review sites → high).

Write `research/keyword-cluster.md` as a table, plus a one-line mapping of
which keyword owns which H2.

### `/seo geo <topic>`

GEO = Generative Engine Optimization: getting cited *inside* AI answers.

1. `WebSearch` the topic phrased as a natural question, the way someone would
   ask ChatGPT. Record which domains the answer-style results draw on — those
   are the current citation winners.
2. Assess what makes them citable and write the requirements the article must
   meet. Score the plan against this checklist:

   - **Extractable answer.** A 40–60 word direct answer sits immediately under
     the H1 and under each question heading, before any elaboration.
   - **Question-shaped headings.** Headings match how people ask, not clever
     wordplay.
   - **Self-contained claims.** Each paragraph makes sense quoted alone —
     no "as mentioned above", no orphaned pronouns.
   - **Specific numbers with units and dates.** "$300–$1,500 per month (2026)"
     beats "affordable". LLMs preferentially quote specifics.
   - **Named sources.** Attribute figures in-sentence ("according to X"), which
     survives extraction where a bare hyperlink does not.
   - **Structured data.** `FAQPage` + `Article` JSON-LD.
   - **Comparison tables and lists.** Both are lifted verbatim into answers.
   - **Freshness signals.** Explicit "as of <month year>" and a dated update line.
   - **Entity coverage.** Every major named tool/vendor/concept in the space
     appears at least once.

Write `research/geo-analysis.md`: current AI-answer landscape, the citation
winners and why, the checklist scored `pass` / `fix`, and concrete instructions
for the writer.

## Rules

- Cite a real URL for every factual claim; if you cannot, mark it
  `[unverified]` and let the writer drop it.
- Never fabricate search volume, difficulty scores, or traffic estimates.
- Prefer sources dated within 18 months for anything about pricing or AI tools.
- Keep every report skimmable: tables and bullets, not essays.
