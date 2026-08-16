# AEO and GEO reference

Detail behind the rules in `SKILL.md`. Read when writing or auditing an
article, or when a rule's rationale is unclear.

---

## The distinction

**SEO** — being *ranked* by a search engine. Blue links. Optimises for
crawlability, relevance, authority, depth.

**AEO** (Answer Engine Optimization) — being *the answer*. Featured snippets,
People Also Ask, voice results, AI Overviews. Optimises for extractability: can
a machine lift 40–60 words from this page that fully answer the question?

**GEO** (Generative Engine Optimization) — being *cited* by ChatGPT, Gemini,
Perplexity, Copilot. The engine synthesises an answer from several sources and
names the ones it used. Optimises for quotability and verifiability.

The three reward the same underlying thing — a page that answers a real
question directly, specifically, and with sources — and differ only in the unit
of extraction: the page, the passage, the sentence.

---

## The extractable answer block

The single highest-leverage element. Directly under the H1 and under every
question-shaped H2/H3:

- **40–60 words.** Under 40 is too thin to answer; over 60 stops being liftable.
- **Answer in the first sentence.** Not context, not a definition of the field.
- **Contain the specific.** The number, the range, the verdict, the yes/no.
- **Self-contained.** Readable with zero surrounding context.

Bad:
> LLM optimization pricing is a complex topic that depends on many factors.
> In this section we'll explore what drives the cost.

Good:
> LLM optimization costs small businesses **$500 to $5,000 per month** in 2026,
> depending on delivery model. DIY tools run $50–$150 monthly, freelancers
> $500–$2,000, and specialist agencies $2,000–$5,000. Most small businesses
> spend $1,000–$2,500 monthly for managed AI-search visibility.

The second answers the question, carries the numbers, and survives being quoted
alone. That is all three optimisations at once.

---

## What makes a passage quotable by an LLM

Generative engines chunk pages, embed the chunks, retrieve the relevant ones,
and synthesise. A chunk that arrives without its context is useless — so:

| Property | Why it matters |
|---|---|
| No cross-references | "As mentioned above" is meaningless in a retrieved chunk |
| No orphan pronouns | A chunk starting "This costs more because…" cannot be used |
| Numbers with units and dates | "$1,200/month (2026)" is quotable; "affordable" is not |
| In-sentence attribution | "According to Gartner" survives; a bare `<a>` does not |
| One idea per paragraph | Clean chunk boundaries |
| Headings that restate the question | The heading is retrieved with the chunk |

**Specificity beats fluency.** Between two well-written pages, engines cite the
one with concrete figures, named entities and dated claims.

---

## Structured data

Minimum for an informational article:

- **`Article`** (or `BlogPosting`) — headline, description, author,
  `datePublished`, `dateModified`, `image`.
- **`FAQPage`** — must mirror the visible FAQ exactly. Markup that does not
  match visible content is a guidelines violation and can trigger a manual
  action.
- **`HowTo`** — only for genuinely sequential instructions.
- **`BreadcrumbList`** — when the site has a real hierarchy.

Nest under a single `@graph` where multiple types apply. Validate mentally
against required fields; a malformed block is ignored entirely.

---

## Entity coverage

Search and generative engines model topics as entity graphs. A page about LLM
optimisation pricing is expected to mention the relevant entities — the tools,
vendors, model providers, standards, and named concepts in that space. Missing
them reads as incomplete coverage.

Take the entity list from the keyword cluster's `entities` group. Each should
appear at least once, naturally, in a sentence that says something true about
it. Do not list entities for their own sake — a bare name-drop adds nothing and
reads as stuffing.

---

## Freshness

For pricing, tools, models and regulations:

- State the date in prose: "As of August 2026…"
- Set `dateModified` in the `Article` schema.
- Show a visible "Last updated" line.
- Prefer sources under 18 months old; label older ones with their date in the
  sentence so the reader can discount them.

Undated pricing claims are the most common reason an otherwise good page stops
being cited: an engine cannot tell whether the number is current.

---

## Tables and lists

Both are lifted verbatim into AI answers and snippets more often than prose.

- Give every table a header row and a caption sentence before it.
- Keep cells short and parallel — a cell is a data point, not a paragraph.
- Prefer a table wherever the reader is comparing options on shared dimensions.
- Use ordered lists for sequences, unordered for sets. Do not use a list where
  a sentence would do; three-word bullets carry no information.

---

## AI-writing tells to cut

Phrases that signal generated text and add nothing:

> In today's fast-paced digital landscape · delve into · unlock the power of ·
> it's important to note that · navigate the complexities of · in the realm of ·
> a testament to · when it comes to · at the end of the day · robust solution ·
> game-changer · leverage (as a verb, mostly) · seamless · cutting-edge

Structural tells matter as much as vocabulary: every paragraph the same length,
every section opening with a definition, every list exactly three items,
relentless triads. Vary the rhythm. Let some sections be two sentences and
others six, because that is what the content requires.

---

## Quick audit

Before shipping, confirm:

- [ ] 40–60 word answer block under the H1, containing the key number
- [ ] Every H2 phrased as a question or clear statement of what it answers
- [ ] A direct answer opens every section
- [ ] At least one table and one list
- [ ] 5+ FAQ questions taken from real research, with matching `FAQPage` JSON-LD
- [ ] `Article` schema with `datePublished` and `dateModified`
- [ ] Every number sourced, attributed in-sentence, and dated
- [ ] No paragraph depends on another for meaning
- [ ] 3+ internal links to pages that exist, descriptive anchors
- [ ] 4+ external citations to authoritative non-competitors
- [ ] Meta title ≤ 60 chars, meta description ≤ 155 chars — counted, not estimated
- [ ] Every major entity from the cluster mentioned at least once
- [ ] No phrase from the tells list above
