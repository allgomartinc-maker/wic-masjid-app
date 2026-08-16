#!/usr/bin/env python3
"""
Publish a finished article bundle to WordPress as a draft.

Talks to the WordPress REST API (/wp-json/wp/v2) using an application
password. It uploads each image as media with its alt text, resolves category
and tag names to term IDs (creating missing terms), then creates the post with
the featured image attached.

    export WP_SITE_URL=https://example.com
    export WP_USERNAME=editor
    export WP_APP_PASSWORD='xxxx xxxx xxxx xxxx xxxx xxxx'
    python3 wp_publish.py --bundle outputs/<slug>
    python3 wp_publish.py --bundle outputs/<slug> --dry-run   # no network

Expected bundle layout
  content/post.json      title, slug, excerpt, meta, categories, tags, body_file
  content/article.html   the post body (WordPress block/classic HTML)
  images/images.json     manifest from make_images.py (filename, alt, role)

--dry-run writes content/wordpress-draft-payload.json containing the exact
requests that would be sent, with credentials redacted. Use it to verify the
payload before touching a live site.

Exit codes
  0 success (or dry run rendered)      2 bad usage / bad bundle
  3 site unreachable (network egress)  4 auth or API rejection
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import sys

try:
    import requests
    from requests.auth import HTTPBasicAuth
except ImportError:
    sys.exit("requests is required:  pip install requests")

TIMEOUT = 45


def die(code: int, message: str):
    print(f"ERROR: {message}", file=sys.stderr)
    sys.exit(code)


def load_bundle(bundle: str) -> tuple[dict, str, list]:
    post_path = os.path.join(bundle, "content", "post.json")
    if not os.path.exists(post_path):
        die(2, f"missing {post_path}")
    with open(post_path, encoding="utf-8") as fh:
        post = json.load(fh)

    body_file = os.path.join(bundle, "content", post.get("body_file", "article.html"))
    if not os.path.exists(body_file):
        die(2, f"missing body file {body_file}")
    with open(body_file, encoding="utf-8") as fh:
        body = fh.read()

    images: list = []
    manifest_path = os.path.join(bundle, "images", "images.json")
    if os.path.exists(manifest_path):
        with open(manifest_path, encoding="utf-8") as fh:
            images = json.load(fh).get("images", [])

    for required in ("title",):
        if not post.get(required):
            die(2, f"post.json is missing required field: {required}")
    return post, body, images


def build_post_payload(post: dict, body: str, featured_id, term_ids: dict) -> dict:
    payload = {
        "title": post["title"],
        "content": body,
        "status": post.get("status", "draft"),
        "excerpt": post.get("excerpt", ""),
        "comment_status": post.get("comment_status", "open"),
    }
    if post.get("slug"):
        payload["slug"] = post["slug"]
    if post.get("author_id"):
        payload["author"] = post["author_id"]
    if featured_id:
        payload["featured_media"] = featured_id
    if term_ids.get("categories"):
        payload["categories"] = term_ids["categories"]
    if term_ids.get("tags"):
        payload["tags"] = term_ids["tags"]

    # Yoast and Rank Math both read post meta; sending both keys is harmless
    # when only one plugin is installed. Requires the meta keys to be
    # registered as REST-visible on the site, otherwise WordPress ignores them.
    meta = {}
    if post.get("meta_title"):
        meta["_yoast_wpseo_title"] = post["meta_title"]
        meta["rank_math_title"] = post["meta_title"]
    if post.get("meta_description"):
        meta["_yoast_wpseo_metadesc"] = post["meta_description"]
        meta["rank_math_description"] = post["meta_description"]
    if post.get("focus_keyword"):
        meta["_yoast_wpseo_focuskw"] = post["focus_keyword"]
        meta["rank_math_focus_keyword"] = post["focus_keyword"]
    if meta:
        payload["meta"] = meta
    return payload


def dry_run(bundle, post, body, images, site_url, term_names):
    base = f"{site_url.rstrip('/')}/wp-json/wp/v2" if site_url else "<WP_SITE_URL>/wp-json/wp/v2"
    requests_log = []

    for i, img in enumerate(images):
        requests_log.append(
            {
                "step": f"upload media {i + 1}/{len(images)}",
                "method": "POST",
                "url": f"{base}/media",
                "headers": {
                    "Authorization": "Basic <WP_USERNAME:WP_APP_PASSWORD redacted>",
                    "Content-Disposition": f'attachment; filename="{img["filename"]}"',
                    "Content-Type": mimetypes.guess_type(img["filename"])[0] or "image/png",
                },
                "body": f"<binary {img.get('bytes', 0)} bytes from {img['path']}>",
                "follow_up": {
                    "method": "POST",
                    "url": f"{base}/media/<new_id>",
                    "json": {"alt_text": img["alt"], "title": img.get("title", ""), "caption": img.get("caption", "")},
                },
            }
        )

    for taxonomy, names in term_names.items():
        for name in names:
            requests_log.append(
                {
                    "step": f"resolve {taxonomy} term",
                    "method": "GET",
                    "url": f"{base}/{taxonomy}?search={name}",
                    "on_missing": {"method": "POST", "url": f"{base}/{taxonomy}", "json": {"name": name}},
                }
            )

    featured_placeholder = "<media_id of featured image>" if any(
        i.get("role") == "featured" for i in images
    ) else None
    payload = build_post_payload(
        post, body, featured_placeholder, {"categories": ["<term_ids>"], "tags": ["<term_ids>"]}
    )
    preview = dict(payload)
    preview["content"] = f"<{len(body):,} chars of HTML — see content/article.html>"

    requests_log.append(
        {
            "step": "create post",
            "method": "POST",
            "url": f"{base}/posts",
            "headers": {"Authorization": "Basic <redacted>", "Content-Type": "application/json"},
            "json": preview,
        }
    )

    out = {
        "mode": "dry-run",
        "site": site_url or "<WP_SITE_URL not set>",
        "status_to_be_created": post.get("status", "draft"),
        "image_count": len(images),
        "content_bytes": len(body.encode("utf-8")),
        "requests": requests_log,
        "full_post_payload_without_content": {k: v for k, v in payload.items() if k != "content"},
    }
    path = os.path.join(bundle, "content", "wordpress-draft-payload.json")
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=2, ensure_ascii=False)
    print(f"dry run OK — {len(requests_log)} requests planned")
    print(f"payload written to {path}")
    return 0


def resolve_terms(session, base, auth, taxonomy, names) -> list:
    ids = []
    for name in names:
        resp = session.get(f"{base}/{taxonomy}", params={"search": name, "per_page": 100}, auth=auth, timeout=TIMEOUT)
        resp.raise_for_status()
        match = next((t for t in resp.json() if t["name"].lower() == name.lower()), None)
        if match:
            ids.append(match["id"])
            print(f"  {taxonomy}: '{name}' -> {match['id']}")
            continue
        created = session.post(f"{base}/{taxonomy}", json={"name": name}, auth=auth, timeout=TIMEOUT)
        if created.status_code >= 400:
            print(f"  WARN could not create {taxonomy} '{name}': {created.text[:200]}", file=sys.stderr)
            continue
        new_id = created.json()["id"]
        ids.append(new_id)
        print(f"  {taxonomy}: created '{name}' -> {new_id}")
    return ids


def main() -> int:
    ap = argparse.ArgumentParser(description="Publish an article bundle to WordPress as a draft.")
    ap.add_argument("--bundle", required=True, help="path to outputs/<topic-slug>")
    ap.add_argument("--dry-run", action="store_true", help="render the payload without any network call")
    ap.add_argument("--status", help="override post status (default from post.json, else draft)")
    args = ap.parse_args()

    post, body, images = load_bundle(args.bundle)
    if args.status:
        post["status"] = args.status
    post.setdefault("status", "draft")

    term_names = {
        "categories": post.get("categories", []),
        "tags": post.get("tags", []),
    }

    site = os.environ.get("WP_SITE_URL", "").rstrip("/")
    user = os.environ.get("WP_USERNAME", "")
    password = os.environ.get("WP_APP_PASSWORD", "")

    if args.dry_run:
        return dry_run(args.bundle, post, body, images, site, term_names)

    missing = [n for n, v in (("WP_SITE_URL", site), ("WP_USERNAME", user), ("WP_APP_PASSWORD", password)) if not v]
    if missing:
        die(2, "missing environment variables: " + ", ".join(missing) + " (or pass --dry-run)")

    base = f"{site}/wp-json/wp/v2"
    auth = HTTPBasicAuth(user, password)
    session = requests.Session()
    session.headers["User-Agent"] = "BlogAgentPublisher/1.0"

    # Preflight: prove the API is reachable AND the credentials work before
    # uploading anything, so a failure never leaves orphaned media behind.
    try:
        probe = session.get(f"{base}/users/me", auth=auth, timeout=TIMEOUT)
    except requests.RequestException as exc:
        die(3, f"cannot reach {base} — {exc}\nHint: network egress may be blocked for this host.")
    if probe.status_code in (401, 403):
        die(4, f"authentication rejected (HTTP {probe.status_code}): {probe.text[:300]}")
    if probe.status_code >= 400:
        die(4, f"REST API error (HTTP {probe.status_code}): {probe.text[:300]}")
    print(f"authenticated as {probe.json().get('name', user)} on {site}")

    featured_id = None
    uploaded = []
    for img in images:
        mime = mimetypes.guess_type(img["filename"])[0] or "image/png"
        with open(img["path"], "rb") as fh:
            resp = session.post(
                f"{base}/media",
                data=fh.read(),
                headers={
                    "Content-Disposition": f'attachment; filename="{img["filename"]}"',
                    "Content-Type": mime,
                },
                auth=auth,
                timeout=TIMEOUT * 2,
            )
        if resp.status_code >= 400:
            die(4, f"media upload failed for {img['filename']} (HTTP {resp.status_code}): {resp.text[:300]}")
        media = resp.json()
        session.post(
            f"{base}/media/{media['id']}",
            json={"alt_text": img["alt"], "title": img.get("title", ""), "caption": img.get("caption", "")},
            auth=auth,
            timeout=TIMEOUT,
        )
        uploaded.append({"id": media["id"], "filename": img["filename"], "source_url": media.get("source_url")})
        print(f"  uploaded {img['filename']} -> media {media['id']}")
        if img.get("role") == "featured" and featured_id is None:
            featured_id = media["id"]

    # Point the article body at the real uploaded URLs.
    for img, up in zip(images, uploaded):
        if up.get("source_url"):
            body = body.replace(f'src="images/{img["filename"]}"', f'src="{up["source_url"]}"')
            body = body.replace(f'src="./images/{img["filename"]}"', f'src="{up["source_url"]}"')

    term_ids = {}
    for taxonomy, names in term_names.items():
        term_ids[taxonomy] = resolve_terms(session, base, auth, taxonomy, names) if names else []

    payload = build_post_payload(post, body, featured_id, term_ids)
    resp = session.post(f"{base}/posts", json=payload, auth=auth, timeout=TIMEOUT)
    if resp.status_code >= 400:
        die(4, f"post creation failed (HTTP {resp.status_code}): {resp.text[:500]}")
    created = resp.json()

    result = {
        "mode": "live",
        "post_id": created["id"],
        "status": created["status"],
        "link": created.get("link"),
        "edit_url": f"{site}/wp-admin/post.php?post={created['id']}&action=edit",
        "featured_media": featured_id,
        "uploaded_media": uploaded,
        "categories": term_ids.get("categories", []),
        "tags": term_ids.get("tags", []),
    }
    out_path = os.path.join(args.bundle, "content", "wordpress-result.json")
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(result, fh, indent=2, ensure_ascii=False)

    print(f"\ncreated {created['status']} post {created['id']}")
    print(f"edit: {result['edit_url']}")
    print(f"result written to {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
