---
name: wordpress-publisher
description: Upload a finished article and its images to WordPress as a draft via the REST API — media with alt text, featured image, categories, tags, slug, excerpt and SEO meta. Use when asked to publish to WordPress, create a WP draft, push a post to a site, or upload blog media.
---

# WordPress publisher

Creates a **draft** (never a live post unless explicitly told otherwise) from a
finished bundle in `outputs/<slug>/`.

## Credentials

Read from environment variables only — never from a file in the repo, never
from the chat:

```bash
export WP_SITE_URL=https://example.com          # no trailing slash, no /wp-admin
export WP_USERNAME=your-wp-username
export WP_APP_PASSWORD='xxxx xxxx xxxx xxxx xxxx xxxx'
```

`WP_APP_PASSWORD` is a WordPress **application password**, not the account
password: WP Admin → Users → Profile → Application Passwords → Add New. It is a
scoped, revocable credential. Never echo it, never write it into a file, never
put it in a commit.

Requirements on the site: WordPress 5.6+, REST API reachable at
`/wp-json/wp/v2`, and the user holding at least the Author role (Editor to set
categories and tags).

## Step 1 — preflight

Check the bundle exists and is complete:

```
outputs/<slug>/content/post.json      # title, slug, excerpt, meta, taxonomies
outputs/<slug>/content/article.html   # body HTML
outputs/<slug>/images/images.json     # manifest with alt text, one role:"featured"
```

Then **always dry-run first**:

```bash
python3 .claude/skills/_shared/scripts/wp_publish.py \
  --bundle outputs/<slug> --dry-run
```

This makes no network call. It writes
`content/wordpress-draft-payload.json` — the exact sequence of REST requests,
with credentials redacted. Read it and check the title, slug, excerpt, meta,
taxonomies, image count and featured-image selection before going live.

## Step 2 — publish

```bash
python3 .claude/skills/_shared/scripts/wp_publish.py --bundle outputs/<slug>
```

The script, in order:

1. `GET /wp-json/wp/v2/users/me` — proves the endpoint is reachable **and** the
   credentials work, before uploading anything. A failure here leaves no
   orphaned media on the site.
2. `POST /media` per image, then `POST /media/<id>` to set `alt_text`, title and
   caption. Alt text comes from the manifest.
3. Rewrites `src="images/…"` in the body to the uploaded media URLs.
4. Resolves category and tag names to term IDs via `GET /categories?search=`,
   creating any that do not exist.
5. `POST /posts` with `status: "draft"` and `featured_media` set from the image
   whose `role` is `featured`.
6. Writes `content/wordpress-result.json` with the post ID, status and edit URL.

## Step 3 — verify and report

Report back: post ID, status, the `wp-admin` edit URL, media IDs, and which
categories or tags were newly created. Tell the user the post is a **draft
awaiting their review** — this skill does not publish live.

## SEO plugin meta

The script sends both Yoast (`_yoast_wpseo_*`) and Rank Math
(`rank_math_*`) meta keys. WordPress silently drops post meta that is not
registered as REST-visible, so on many sites these will not stick. That is not
a script bug. If the meta does not appear, either register the keys with
`register_post_meta(..., ['show_in_rest' => true])` on the site, use the
plugin's own REST integration, or tell the user to paste the meta title and
description from `post.json` into the plugin box manually. Say which — do not
report the meta as set when it may not be.

## Failure modes

| Exit | Meaning | Fix |
|---|---|---|
| 2 | Bundle incomplete or env vars missing | Check the three required files; export the variables |
| 3 | Host unreachable | Network egress blocked, wrong URL, or site down. Do not retry blindly — report the host |
| 4 | HTTP 401/403 | Wrong username, revoked application password, or a security plugin blocking REST auth |
| 4 | HTTP 400 on `/posts` | Usually an invalid term ID or a `meta` key the site rejects |

Some hosts strip the `Authorization` header (a known Apache/CGI issue) or block
`/wp-json` behind a WAF. If auth fails despite correct credentials, that is the
usual cause — report it rather than working around it.

## Rules

- **Draft by default.** Publishing live requires the user to say so explicitly
  in that run.
- Never invent a post ID or an edit URL. If the publish did not happen, say it
  did not happen and hand over the dry-run payload as the deliverable.
- Never commit `wordpress-result.json` if it contains anything sensitive; it
  normally holds only IDs and public URLs.
