# Publish this post by hand — no terminal needed

About 10 minutes. Everything is copy-paste. You will end up with a **draft**
that you review and publish yourself.

Files in this folder:

| File | What it's for |
|---|---|
| `paste-into-wordpress.html` | The article body. You paste this. |
| 4 × `.png` | The images. You upload these. |
| `faq-schema.json` | Optional — step 7. Skip if unsure. |

---

## Step 1 — Create the post

1. Log in to `bluetarg.com/wp-admin`
2. Left menu → **Posts** → **Add New**

## Step 2 — Title

Paste into the title box at the top:

```
How Much Does LLM Optimization Cost for Small Businesses?
```

## Step 3 — Paste the article body

This is the only slightly fiddly part. Do it in this order:

1. Click the **⋮** (three vertical dots) at the **top right** of the editor
2. Choose **Code editor**  *(on some versions: "Editor" → "Code editor")*
3. Open `paste-into-wordpress.html`, select all the text, copy it
4. Paste it into the big empty box
5. Click the **⋮** again → **Visual editor** to switch back

You should now see the whole article laid out, with four lines that read
`>>> IMAGE 1 GOES HERE <<<`. Those are your placeholders.

## Step 4 — Add the four images

For each one, in order:

1. Click on the line that says `>>> IMAGE 1 GOES HERE <<<` and **delete that text**
2. With your cursor on the now-empty line, click the **+** button
3. Choose **Image** → **Upload** → pick the file from the table below
4. With the image selected, open the **Block** tab in the right sidebar and
   paste the **alt text** into the "Alternative text" box

| Marker | Upload this file | Alt text to paste |
|---|---|---|
| IMAGE 1 | `llm-optimization-cost-small-business.png` | `Guide to LLM optimization costs for small businesses in 2026` |
| IMAGE 2 | `llm-optimization-cost-by-delivery-model.png` | `Monthly LLM optimization cost 2026: DIY $29-250, freelancer $500-2,000, AI-assisted $800-999, agency $1,500-5,000` |
| IMAGE 3 | `llm-optimization-cost-factors.png` | `Five factors driving LLM optimization price: engine coverage, prompt volume, content output, technical health, markets` |
| IMAGE 4 | `llm-optimization-ready-or-wait.png` | `When a small business is ready for an LLM optimization retainer versus fixing free fundamentals first` |

**Don't skip the alt text.** It's what gets the images found in Google Images
and read by screen readers.

## Step 5 — Featured image

In the right sidebar → **Post** tab → **Featured image** → **Set featured
image** → pick `llm-optimization-cost-small-business.png` (it's already in your
Media Library from step 4).

## Step 6 — Fill in the settings

All in the right sidebar, **Post** tab:

**URL / Permalink** — click the URL and set the slug to:
```
llm-optimization-cost-small-business
```

**Categories** — tick or create:
```
Guides
```

**Tags** — paste this whole line into the tags box (commas create separate tags):
```
LLM optimization, GEO, AEO, AI search, small business, pricing
```

**Excerpt** — expand the "Excerpt" panel and paste:
```
LLM optimization costs small businesses $29 to $5,000 per month in 2026. A breakdown of DIY tools, freelancer, AI-assisted and agency pricing — plus the four conditions under which you should not buy a retainer yet.
```

### SEO plugin box (Yoast or Rank Math)

Scroll to the bottom of the edit screen. If you have Yoast or Rank Math
installed you'll see their panel. Click "Edit snippet" and fill in:

**SEO title** (47 characters — under the 60 limit):
```
LLM Optimization Cost for Small Business (2026)
```

**Meta description** (141 characters — under the 155 limit):
```
LLM optimization costs small businesses $29-$5,000/month in 2026. Real prices for DIY tools, freelancers and agencies - plus when not to buy.
```

**Focus keyphrase / keyword**:
```
llm optimization cost
```

If you don't have an SEO plugin, skip this — the post still works.

## Step 7 — FAQ schema (optional, skip if unsure)

This helps the FAQ show up directly in Google and in AI answers. It's a nice
bonus, not a requirement.

- **If you have Rank Math or Yoast Premium:** skip this file entirely. Use their
  FAQ block instead, or let the plugin generate it — doing both creates
  duplicate schema, which is worse than none.
- **Otherwise:** add a **Custom HTML** block at the very bottom of the post,
  and paste this, replacing `PASTE_HERE` with the entire contents of
  `faq-schema.json`:

```
<script type="application/ld+json">PASTE_HERE</script>
```

If WordPress strips it out when you save, your site blocks scripts in posts —
that's fine, just leave it out.

## Step 8 — Save as draft

Click **Save draft** (top right). **Do not click Publish yet.**

Then click **Preview** and read it through. Check that:

- all four images appear and aren't stretched
- the two tables look right on mobile
- the links work

Publish when you're happy with it.

---

## One thing to think about first

bluetarg.com is about organic dog nutrition. This article is about AI search
pricing for small businesses. It'll publish fine, but it's off-topic for your
site, and search engines reward sites that stay in their lane.

If you'd rather have a post that actually fits, ask for one on a dog-nutrition
topic — you'll get the same package, but the writing will match your site and
the internal links will point somewhere useful.
