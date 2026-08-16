# SEO + AEO + GEO blog agent

One topic in → researched, written, illustrated, WordPress-ready article out.

Seven skills. Six do the work, one sequences them.

## Run order

```
                    TOPIC
                      │
      ┌───────────────┼───────────────┐
      │               │               │
      ▼               ▼               ▼
 ┌─────────┐   ┌─────────────┐  ┌──────────────┐
 │   seo   │   │ competitor- │  │  website-    │   steps 1-3 are
 │         │   │ site-       │  │  brand-      │   independent and
 │ brief   │   │ scraper     │  │  scraper     │   may run in parallel
 │ cluster │   │             │  │              │
 │ geo     │   │ gap matrix  │  │ voice+links  │
 └────┬────┘   └──────┬──────┘  └──────┬───────┘
      │               │                │
      │  research/    │  research/     │  outputs/_brand/
      │  *.md         │  competitor-   │  brand-profile.json
      │               │  analysis.md   │
      └───────────────┴────────┬───────┘
                               ▼
                  ┌────────────────────────┐
                  │ blog-writer-seo-aeo-geo│  step 4
                  │                        │
                  │ article.md  article.html│
                  │ post.json   seo-checklist.md
                  └────────────┬───────────┘
                               ▼
                  ┌────────────────────────┐
                  │  blog-image-generator  │  step 5
                  │  *.png + images.json   │
                  └────────────┬───────────┘
                               ▼
                  ┌────────────────────────┐
                  │  wordpress-publisher   │  step 6
                  │  dry-run → live draft  │
                  └────────────────────────┘

  content-agent-orchestrator owns this whole flow, the run folder,
  and run-manifest.json (the audit trail).
```

## The seven skills

| Skill | Job |
|---|---|
| `seo` | Content brief, keyword cluster, GEO/AI-answer analysis, single-page audits |
| `website-brand-scraper` | Reads your site → brand voice, services, internal-link map |
| `competitor-site-scraper` | Reads rival pages → coverage matrix and the gap to attack |
| `blog-writer-seo-aeo-geo` | Writes the article, meta, FAQ, schema, and a self-audit |
| `blog-image-generator` | Featured + supporting graphics with SEO filenames and alt text |
| `wordpress-publisher` | Uploads media and creates the draft via the WP REST API |
| `content-agent-orchestrator` | Runs all of the above in order and reports honestly |

> **`seo` is included here rather than used from `/mnt/skills/public/seo/`.**
> That skill does not exist in this environment — `/mnt/skills/public/` is a
> read-only mount containing only docx, pdf, pptx, xlsx, file-reading,
> frontend-design and product-self-knowledge. If an official one appears later,
> prefer it and delete `seo/`.

## Layout

```
.claude/skills/
├── agent.config.json          ← brand, competitors, WordPress, limits
├── install.sh                 ← mirrors these into /mnt/skills/user/
├── _shared/scripts/
│   ├── crawl_site.py          ← robots-aware crawler, SEO/AEO extraction
│   ├── make_images.py         ← Pillow renderer (featured/bar/checklist/comparison)
│   └── wp_publish.py          ← WP REST publisher with dry-run
├── seo/SKILL.md
├── website-brand-scraper/SKILL.md
├── competitor-site-scraper/SKILL.md
├── blog-writer-seo-aeo-geo/
│   ├── SKILL.md
│   └── references/aeo-geo-rules.md
├── blog-image-generator/SKILL.md
├── wordpress-publisher/SKILL.md
└── content-agent-orchestrator/SKILL.md
```

Output per run:

```
outputs/<topic-slug>/
├── research/     content-brief.md · keyword-cluster.md
│                 geo-analysis.md · competitor-analysis.md
├── content/      article.md · article.html · post.json
│                 seo-checklist.md · wordpress-draft-payload.json
├── images/       spec.json · *.png · images.json
└── run-manifest.json
outputs/_brand/brand-profile.json    (cached across runs)
```

## Setup

```bash
pip install requests Pillow

# WordPress (application password, not the account password)
export WP_SITE_URL=https://example.com
export WP_USERNAME=your-username
export WP_APP_PASSWORD='xxxx xxxx xxxx xxxx xxxx xxxx'

# optional: also register as user skills under /mnt/skills/user/
bash .claude/skills/install.sh
```

Point the agent at a different brand by editing `agent.config.json` only — no
SKILL.md changes needed.

## Usage

```
/content-agent-orchestrator <your topic>
```

Or invoke a single skill: `/seo cluster <topic>`,
`/blog-image-generator`, `/wordpress-publisher`.

## Design decisions worth knowing

**Skills live in the repo, not only in `/mnt/skills/user/`.** The container is
ephemeral; the repo is not. `install.sh` symlinks them into the user skills
directory for the layout the build guide describes, but the source of truth is
version-controlled and reviewable.

**Fetching degrades, it does not fail.** Every scraper tries
`crawl_site.py` → `WebFetch` → `WebSearch` and records which one worked.
Findings are labelled `verified-on-page` or `derived-from-SERP`, because a
summary of search snippets is not the same evidence as a page you read.

**Images are drawn, not diffused.** `make_images.py` renders from vectors and
text with Pillow, so numbers and labels in charts are always correct — the
thing image models reliably get wrong.

**No invented numbers.** No search volumes (no keyword API is available), no
prices without a cited source, no post IDs for drafts that were not created.
The `seo-checklist.md` records honest `fail` lines where a check could not be
performed.

**Draft, never live.** `wp_publish.py` posts `status: "draft"` unless told
otherwise in that specific run, and always preflights auth before uploading so
a failure leaves no orphaned media.
