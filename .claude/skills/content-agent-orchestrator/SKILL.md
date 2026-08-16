---
name: content-agent-orchestrator
description: Run the whole blog pipeline from a single topic — research, competitor analysis, keywords, GEO check, brand voice, writing, images, and a WordPress draft. Use when given a topic and asked to produce a finished blog post end to end, to "run the content agent", or to generate and publish an article without running each step by hand.
---

# Content agent orchestrator

One topic in, a reviewed WordPress draft out. This skill owns sequencing,
the run folder, and the manifest; the specialist skills own the work.

## Usage

```
/content-agent-orchestrator How Much Does LLM Optimization Cost for Small Businesses?
```

Optional flags the user may add: `--no-publish` (stop after images),
`--dry-run-publish` (payload only, no network), `--brand <url>` (override the
configured brand site).

## Step 0 — set up the run

1. Read `.claude/skills/agent.config.json`.
2. Slugify the topic: lowercase, hyphenated, stop-words dropped, ~5 words.
   `How Much Does LLM Optimization Cost for Small Businesses?` →
   `llm-optimization-cost-small-business`
3. Create `outputs/<slug>/{research,content,images}/`.
4. Start `outputs/<slug>/run-manifest.json` and append to it after **every**
   step — step name, skill used, status, artefacts written, tools used, and any
   degradation. The manifest is the audit trail; a step that is not in it did
   not happen.

## Pipeline

```
topic
  │
  ├─ 1. seo  ──────────────── /seo content-brief   → research/content-brief.md
  │                           /seo cluster         → research/keyword-cluster.md
  │                           /seo geo             → research/geo-analysis.md
  │
  ├─ 2. competitor-site-scraper (uses /seo page per rival)
  │                                                → research/competitor-analysis.md
  │
  ├─ 3. website-brand-scraper (cached; skip if fresh)
  │                                                → outputs/_brand/brand-profile.json
  │
  ├─ 4. blog-writer-seo-aeo-geo  → content/article.md, article.html,
  │                                post.json, seo-checklist.md
  │
  ├─ 5. blog-image-generator     → images/*.png, images/images.json
  │
  └─ 6. wordpress-publisher      → content/wordpress-draft-payload.json
                                   content/wordpress-result.json
```

**Steps 1–3 are independent of each other** and may run in parallel. Step 4
needs all three. Step 5 needs the article's numbers. Step 6 needs both.

## Step-by-step

### 1. Research (`seo` skill)

Run `content-brief`, then `cluster`, then `geo` on the topic. Three reports in
`research/`. Do not proceed if the brief could not establish search intent —
without it the writer has nothing to aim at.

### 2. Competitors (`competitor-site-scraper`)

Pass the primary keyword from the cluster. It picks rivals from the live SERP,
reads what it can, and writes the gap analysis. Note in the manifest how many
competitors were actually read and by which method.

### 3. Brand (`website-brand-scraper`)

Skip if `outputs/_brand/brand-profile.json` exists and is under 30 days old;
record `"skipped: cache fresh"` in the manifest.

**Checkpoint:** if the brand's subject matter is unrelated to the topic, stop
and tell the user before writing. An on-brand article about an off-brand topic
helps nobody, and this is their call, not yours.

### 4. Write (`blog-writer-seo-aeo-geo`)

Reads all four research files plus the brand profile. Produces the four content
files. Then read `content/seo-checklist.md` — if anything reads `fail`, fix it
now rather than carrying it forward.

### 5. Images (`blog-image-generator`)

Featured + at least two supporting graphics, drawn from numbers that appear in
the finished article. Look at the rendered PNGs before continuing.

### 6. Publish (`wordpress-publisher`)

Dry-run first, always. Read the payload. Then publish live only if credentials
are present and the user has not passed `--no-publish`. Draft status.

## Failure policy

Finish every step that can still run; never abandon the pipeline because one
step degraded.

| Situation | Do |
|---|---|
| A fetch tool is blocked | Fall back (crawler → WebFetch → WebSearch), label the finding's provenance, continue |
| Fewer than 3 competitors readable | Continue; record reduced confidence in the manifest and the final report |
| No WordPress credentials | Run the dry-run, hand over the payload as the deliverable, state plainly that no draft was created |
| An image fails to render | Fix the spec and re-render; ship the article only once the minimum image count is met |
| Brand/topic mismatch | Stop and ask before step 4 |

Never report a step as complete when it degraded. "Wrote 3 competitor profiles
from search snippets because page fetches were blocked" is a useful result;
"analysed 3 competitors" in the same situation is not true.

## Final report

When the run ends, give the user:

1. The pipeline diagram above, annotated with what actually ran and what
   degraded.
2. The acceptance checklist, each line marked from evidence on disk:
   - researched the topic
   - checked competitors
   - found keywords
   - wrote a full SEO+AEO+GEO article
   - made at least 2 images
   - saved everything in the right folders
   - created a WordPress draft
3. Paths to every artefact.
4. The article's headline metrics: word count, meta lengths, internal links,
   external citations, FAQ count.
5. Anything the user must do by hand (paste SEO meta, review a claim, supply
   credentials).

Mark a box ✅ only against a file you can point to. A box that did not happen
is ❌ with the reason — a checklist that always comes back all-green tells the
user nothing.
