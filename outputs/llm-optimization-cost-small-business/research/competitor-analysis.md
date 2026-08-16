# Competitor analysis — LLM optimization cost for small businesses

**Skill:** `competitor-site-scraper`
**Primary keyword:** `llm optimization cost`

## Method and its limits — read this first

| Attempted | Result |
|---|---|
| `crawl_site.py` (direct HTTP) | **Blocked** — egress proxy returns 403 on CONNECT (verified, exit code 3) |
| `WebFetch` per competitor URL | **Blocked** — `EGRESS_BLOCKED` for every non-Anthropic domain |
| `WebSearch` (site + topic queries) | **Worked** — 6 queries |

Every finding below is **`derived-from-SERP`**: titles, snippets, and search
summaries. No competitor page was read directly.

**What this means for confidence:** the pricing figures are reliable (they
appear verbatim in snippets and recur across independent sources). The
*structural* claims — heading counts, word counts, presence or absence of a
section — are inferred and could be wrong. The coverage matrix below is
therefore evidence of what competitors **advertise in the SERP**, not a
verified audit of their page bodies. Per the skill's rules: absence here is
"not found", not proven "not covered".

---

## Competitors identified (from the live SERP)

| # | Domain | Page | Read? |
|---|---|---|---|
| 1 | webfx.com | How Much Does GEO Cost in 2026? | SERP only |
| 2 | stackmatix.com | AEO Services Pricing / AEO Optimization Cost | SERP only |
| 3 | gushwork.ai | GEO Pricing: Cost Breakdown & Monthly Fees | SERP only |
| 4 | teamai.com | What Is the Cost of GEO in 2026? | SERP only |
| 5 | thedigitalelevator.com | AEO and GEO Pricing Guide | SERP only |

Supporting observations also drawn from keygrow.co, revvgrowth.com,
aiadvantageagency.com, indexly.ai, tribeupacademy.com, hubspot.com.

---

## Coverage matrix

Subtopic × competitor. ✅ = evidenced in SERP data · ❔ = not found (may still
be present on the page) · ❌ = evidenced as absent.

| Subtopic | WebFX | Stackmatix | Gushwork | TeamAI | DigitalElevator |
|---|---|---|---|---|---|
| Headline monthly range | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tier table by delivery model | ✅ | ✅ | ✅ | ✅ | ❔ |
| DIY tool pricing | ✅ | ✅ | ❔ | ✅ | ❔ |
| Named tool prices (Profound/Peec/Otterly) | ❔ | ❔ | ❔ | ❔ | ❔ |
| Freelancer rates | ❔ | ✅ | ✅ | ❔ | ❔ |
| What's in a retainer | ❔ | ✅ | ✅ | ❔ | ✅ |
| Cost drivers | ✅ | ✅ | ✅ | ✅ | ❔ |
| Time to results | ❔ | ❔ | ✅ | ❔ | ❔ |
| ROI framework | ❔ | ✅ | ❔ | ❔ | ❔ |
| One-time audit price | ❔ | ✅ | ❔ | ❔ | ❔ |
| **Overlap with existing SEO spend** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **When NOT to buy** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **First-year total budget** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Free/zero-cost actions first** | ❌ | ❌ | ❌ | ❌ | ❔ |
| Author is selling the service | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Table stakes — must include or the page looks thin

1. A headline monthly range with a typical figure
2. A tier table: DIY / freelancer / agency (and an AI-powered middle tier,
   which is newly common in 2026 pricing pages)
3. What a retainer actually covers
4. The factors that move the price
5. An FAQ block

## The gap — where this article wins

Ranked by reader value:

1. **Overlap with existing SEO spend.** No competitor addresses whether a
   business already paying an SEO retainer is being asked to pay twice for
   schema markup, FAQ content and citation building. This is the single most
   valuable unanswered question in the SERP.
2. **When not to buy yet.** Every page assumes the reader should purchase. None
   names the prerequisites (real site content, Google Business Profile,
   reviews, working SEO fundamentals) that must exist before a retainer can
   return anything.
3. **First-year total.** Everyone quotes monthly; small businesses budget
   annually and need setup + retainer + tooling summed.
4. **The genuinely free tier.** Schema markup, FAQ pages, Business Profile
   completeness and review generation cost time, not money. Agency-authored
   pages have no incentive to lead with this.
5. **Named per-tool prices in context.** Indexly covers tool pricing in
   isolation; no pricing guide integrates named tool costs into the DIY tier.

## Depth benchmark

| Metric | Competitor median (estimated from SERP) | Target |
|---|---|---|
| Word count | ~1,800 | 1,900–2,200 |
| H2 sections | 6–8 | 8–9 |
| FAQ questions | 4–6 | 6+ |
| Pricing tables | 1 | 1 (denser) |
| Named external sources | low — most cite only themselves | 6+ |

## Format to beat

A 1,800-word agency pricing guide: range up top, tier table, cost-factor list,
soft CTA, short FAQ. Well-executed but uniformly seller-authored.

**How to beat it:** same structure, then add the four gap sections. Cite named
competitors' own published prices as evidence — a page that quotes WebFX's
$3,000/month alongside Otterly's $29/month is more useful, and more citable,
than any single seller's page can be.

## Angles to avoid

- Competing on "what is GEO" — HubSpot and WebFX own the definitional query
  with far greater domain authority.
- Publishing our own rate card. The winning position here is neutral advisor;
  a price list converts this into just another page in the matrix above.

## Confidence

**Medium.** Five competitors identified and cross-referenced across six
independent queries, but **zero pages read directly**. Pricing figures recur
across independent sources and are treated as reliable. Structural claims are
inferred. Re-run this step in an environment with egress access before making
strategic decisions off the coverage matrix.
