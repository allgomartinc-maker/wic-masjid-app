---
name: competitor-site-scraper
description: Read competitor websites and ranking pages to map their content coverage, FAQs, structure and internal linking, then identify the topic gaps worth attacking. Use when asked to analyse competitors, check what rivals cover, find content gaps, or research the pages currently ranking for a target keyword.
---

# Competitor site scraper

Answers one question: **what do the pages beating us actually contain, and what
are they all missing?** Writes `research/competitor-analysis.md` and
`research/competitor-raw.json` into the run folder.

## Step 1 — choose the competitors

Two sources, merged:

1. **Topic-level (primary).** The pages currently ranking — run `WebSearch` on
   the target keyword and take the top organic results. These are the real
   competitors for this article, whoever they are.
2. **Brand-level.** Any `competitors.seed_urls` in
   `.claude/skills/agent.config.json`.

Cap at `competitors.max_per_run` (default 5). Exclude the brand's own domain,
pure directories, and marketplaces unless they genuinely rank.

## Step 2 — read each competitor

Per competitor, try in order:

```bash
# whole-site view (blog index, sitemap, topic breadth)
python3 .claude/skills/_shared/scripts/crawl_site.py "$URL" \
  --max-pages 15 --delay 1 --out outputs/<slug>/research/comp-<domain>.json
```

then `WebFetch` on the specific ranking URL, then `WebSearch` with
`site:<domain> <topic>` as the last resort. **Record which method succeeded for
each competitor** — findings from search snippets are weaker evidence than a
page you actually read, and the writer needs to know the difference.

Respect `robots.txt` (the crawler does this by default), keep the delay at 1s
or more, and never attempt to bypass a paywall or login.

## Step 3 — capture per competitor

- URL, title tag, meta description, H1
- Full H2/H3 outline — this is the highest-value artefact; it shows the
  subtopic set readers and Google expect
- Word count and content format (guide / listicle / comparison / calculator)
- FAQ questions (schema `FAQPage` entries and question-shaped headings)
- Schema types present
- Specific numbers, prices and data points cited, with their sources
- Internal linking pattern — which of their own pages they push readers to
- Publication or update date, if shown
- Obvious weaknesses: thin sections, no pricing specifics, undated claims,
  region mismatch, pure sales pitch with no substance

## Step 4 — synthesise the gap analysis

`research/competitor-analysis.md` must contain:

1. **Coverage matrix** — subtopics down the rows, competitors across the
   columns, ✅/❌ in the cells. This makes the gap visible at a glance.
2. **Table stakes** — subtopics *everyone* covers. Omitting these looks
   incomplete to both readers and Google; the article must include them.
3. **The gap** — subtopics nobody covers well, ranked by how much a reader
   would value them. This is where the article wins.
4. **Depth benchmark** — median word count, heading count and FAQ count, so
   the writer knows what "competitive" means here in numbers.
5. **Format to beat** — what the winning page looks like structurally.
6. **Angles to avoid** — where a competitor is so entrenched that competing
   head-on is wasted effort.

## Rules

- Never copy competitor sentences, headings, or structure verbatim into the
  brief. Extract *what* they cover; the article decides *how* to say it.
- Distinguish "not covered" from "not found" — a blocked fetch is not evidence
  of a gap. Say which one you have.
- If fewer than 3 competitors could be read by any method, say so plainly; a
  gap analysis built on one page is a guess, and the orchestrator should note
  the reduced confidence in the run manifest.
