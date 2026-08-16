#!/usr/bin/env python3
"""
Crawl a website and extract the SEO/AEO signals the blog agent needs.

Used by both the website-brand-scraper (own site) and the
competitor-site-scraper (rival sites) skills. It is deliberately dependency
light: `requests` plus the standard library, so it runs anywhere.

For each page it extracts: title, meta description, canonical, H1/H2/H3
outline, word count, internal + external links, JSON-LD schema types, and
FAQ pairs (both schema.org FAQPage entries and question-shaped headings).

    python3 crawl_site.py https://example.com --max-pages 25 --out site.json

Exit codes
  0  crawl completed (possibly with per-page errors recorded in the JSON)
  3  the host could not be reached at all — network egress is blocked or the
     site is down. The calling skill should fall back to WebFetch/WebSearch.
  2  bad usage
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.parse as urlparse
import urllib.robotparser as robotparser
from html.parser import HTMLParser

try:
    import requests
except ImportError:
    sys.exit("requests is required:  pip install requests")

USER_AGENT = "BlogAgentBot/1.0 (+content research; respects robots.txt)"
BLOCK_TAGS = {"script", "style", "noscript", "template", "svg"}
HEADING_TAGS = {"h1", "h2", "h3"}
QUESTION_RE = re.compile(
    r"^\s*(how|what|why|when|where|which|who|can|do|does|is|are|should|will|"
    r"much|many)\b.*\?\s*$",
    re.IGNORECASE,
)


class PageParser(HTMLParser):
    """Pull structure out of an HTML page without a third-party parser."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.meta_description = ""
        self.meta_robots = ""
        self.canonical = ""
        self.headings: list[dict] = []
        self.links: list[dict] = []
        self.jsonld_blocks: list[str] = []
        self.text_parts: list[str] = []

        self._tag_stack: list[str] = []
        self._capture: str | None = None
        self._buf: list[str] = []
        self._link_href: str | None = None
        self._in_jsonld = False

    # -- helpers ---------------------------------------------------------
    def _flush(self) -> str:
        text = re.sub(r"\s+", " ", "".join(self._buf)).strip()
        self._buf = []
        return text

    @property
    def _suppressed(self) -> bool:
        return any(t in BLOCK_TAGS for t in self._tag_stack)

    # -- HTMLParser hooks ------------------------------------------------
    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        self._tag_stack.append(tag)
        attr = {k.lower(): (v or "") for k, v in attrs}

        if tag == "title" and not self.title:
            self._capture, self._buf = "title", []
        elif tag == "meta":
            name = attr.get("name", "").lower()
            if name == "description" and not self.meta_description:
                self.meta_description = attr.get("content", "").strip()
            elif name == "robots":
                self.meta_robots = attr.get("content", "").strip()
            elif attr.get("property", "").lower() == "og:description" and not self.meta_description:
                self.meta_description = attr.get("content", "").strip()
        elif tag == "link" and "canonical" in attr.get("rel", "").lower():
            self.canonical = attr.get("href", "").strip()
        elif tag in HEADING_TAGS:
            self._capture, self._buf = tag, []
        elif tag == "a" and attr.get("href"):
            self._link_href = attr["href"]
            self._capture, self._buf = "a", []
        elif tag == "script" and "ld+json" in attr.get("type", "").lower():
            self._in_jsonld, self._buf = True, []

    def handle_endtag(self, tag):
        tag = tag.lower()

        if tag == "script" and self._in_jsonld:
            self.jsonld_blocks.append("".join(self._buf))
            self._in_jsonld, self._buf = False, []
        elif self._capture == tag:
            text = self._flush()
            if tag == "title":
                self.title = text
            elif tag in HEADING_TAGS:
                if text:
                    self.headings.append({"level": int(tag[1]), "text": text})
            elif tag == "a":
                if self._link_href:
                    self.links.append({"href": self._link_href, "anchor": text})
                self._link_href = None
            self._capture = None

        while self._tag_stack:
            if self._tag_stack.pop() == tag:
                break

    def handle_data(self, data):
        if self._in_jsonld or self._capture:
            self._buf.append(data)
        if not self._suppressed:
            self.text_parts.append(data)

    def error(self, message):  # py<3.10 compatibility shim
        pass


def _walk_jsonld(node, types: set, faqs: list) -> None:
    """Collect @type values and FAQPage question/answer pairs."""
    if isinstance(node, list):
        for item in node:
            _walk_jsonld(item, types, faqs)
        return
    if not isinstance(node, dict):
        return

    node_type = node.get("@type")
    for t in [node_type] if isinstance(node_type, str) else (node_type or []):
        if isinstance(t, str):
            types.add(t)

    if node.get("@type") == "Question" or ("name" in node and "acceptedAnswer" in node):
        answer = node.get("acceptedAnswer") or {}
        if isinstance(answer, list):
            answer = answer[0] if answer else {}
        body = answer.get("text", "") if isinstance(answer, dict) else ""
        faqs.append(
            {
                "question": re.sub(r"<[^>]+>", " ", str(node.get("name", ""))).strip(),
                "answer": re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", str(body))).strip()[:600],
                "source": "schema",
            }
        )

    for value in node.values():
        if isinstance(value, (dict, list)):
            _walk_jsonld(value, types, faqs)


def analyse(url: str, html: str, root_netloc: str) -> dict:
    parser = PageParser()
    try:
        parser.feed(html)
    except Exception as exc:  # malformed markup should not kill the crawl
        return {"url": url, "error": f"parse failed: {exc}"}

    schema_types: set[str] = set()
    faqs: list[dict] = []
    for block in parser.jsonld_blocks:
        try:
            _walk_jsonld(json.loads(block), schema_types, faqs)
        except json.JSONDecodeError:
            continue

    # Question-shaped headings count as FAQ intent even without schema markup.
    seen_q = {f["question"].lower() for f in faqs}
    for h in parser.headings:
        if QUESTION_RE.match(h["text"]) and h["text"].lower() not in seen_q:
            faqs.append({"question": h["text"], "answer": "", "source": "heading"})
            seen_q.add(h["text"].lower())

    internal, external = [], []
    for link in parser.links:
        try:
            absolute = urlparse.urljoin(url, link["href"])
        except ValueError:
            continue
        parsed = urlparse.urlparse(absolute)
        if parsed.scheme not in ("http", "https"):
            continue
        entry = {"url": absolute.split("#")[0], "anchor": link["anchor"][:120]}
        (internal if parsed.netloc == root_netloc else external).append(entry)

    body_text = re.sub(r"\s+", " ", " ".join(parser.text_parts)).strip()

    return {
        "url": url,
        "title": parser.title,
        "meta_description": parser.meta_description,
        "meta_robots": parser.meta_robots,
        "canonical": parser.canonical,
        "word_count": len(body_text.split()),
        "headings": parser.headings,
        "h1": [h["text"] for h in parser.headings if h["level"] == 1],
        "schema_types": sorted(schema_types),
        "faqs": faqs,
        "internal_links": _dedupe(internal)[:80],
        "external_links": _dedupe(external)[:40],
        "text_excerpt": body_text[:1500],
    }


def _dedupe(links: list[dict]) -> list[dict]:
    seen, out = set(), []
    for link in links:
        if link["url"] not in seen:
            seen.add(link["url"])
            out.append(link)
    return out


def discover_urls(session, base: str, limit: int, log: list) -> list[str]:
    """Prefer the sitemap; fall back to links found on the homepage."""
    found: list[str] = []
    netloc = urlparse.urlparse(base).netloc

    candidates = [urlparse.urljoin(base, p) for p in ("/sitemap.xml", "/sitemap_index.xml", "/wp-sitemap.xml")]
    queue, depth = list(candidates), 0
    while queue and len(found) < limit * 4 and depth < 25:
        sm_url = queue.pop(0)
        depth += 1
        try:
            resp = session.get(sm_url, timeout=20)
            if resp.status_code != 200 or "<" not in resp.text[:200]:
                continue
        except requests.RequestException:
            continue
        locs = re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", resp.text)
        if "<sitemapindex" in resp.text[:600].lower():
            queue.extend(locs[:20])
            log.append(f"sitemap index {sm_url} -> {len(locs)} child sitemaps")
        else:
            fresh = [u for u in locs if urlparse.urlparse(u).netloc == netloc]
            found.extend(fresh)
            log.append(f"sitemap {sm_url} -> {len(fresh)} urls")

    if not found:
        log.append("no sitemap; falling back to homepage link discovery")
        try:
            resp = session.get(base, timeout=20)
            page = analyse(base, resp.text, netloc)
            found = [base] + [l["url"] for l in page.get("internal_links", [])]
        except requests.RequestException as exc:
            log.append(f"homepage fetch failed: {exc}")

    ordered = [base] + [u for u in _unique(found) if u != base]
    return ordered


def _unique(items):
    seen, out = set(), []
    for i in items:
        if i not in seen:
            seen.add(i)
            out.append(i)
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description="Crawl a site for SEO/AEO signals.")
    ap.add_argument("base_url")
    ap.add_argument("--max-pages", type=int, default=20)
    ap.add_argument("--delay", type=float, default=1.0, help="seconds between requests")
    ap.add_argument("--out", help="write JSON here instead of stdout")
    ap.add_argument("--ignore-robots", action="store_true")
    args = ap.parse_args()

    base = args.base_url.rstrip("/")
    if not base.startswith(("http://", "https://")):
        base = "https://" + base
    netloc = urlparse.urlparse(base).netloc
    if not netloc:
        print("error: could not parse a hostname from the URL", file=sys.stderr)
        return 2

    session = requests.Session()
    session.headers["User-Agent"] = USER_AGENT
    log: list[str] = []

    # Reachability probe first, so a blocked network fails loudly and early
    # instead of producing a silently empty report.
    try:
        session.get(base, timeout=25)
    except requests.RequestException as exc:
        print(
            json.dumps(
                {
                    "base_url": base,
                    "status": "unreachable",
                    "error": str(exc),
                    "hint": "Network egress may be blocked. Fall back to the "
                    "WebFetch tool, or WebSearch if WebFetch is also blocked.",
                },
                indent=2,
            )
        )
        return 3

    robots = robotparser.RobotFileParser()
    if not args.ignore_robots:
        try:
            robots.set_url(urlparse.urljoin(base, "/robots.txt"))
            robots.read()
            log.append("robots.txt loaded")
        except Exception:
            robots = None
            log.append("robots.txt unavailable; proceeding politely")
    else:
        robots = None
        log.append("robots.txt ignored by flag")

    urls = discover_urls(session, base, args.max_pages, log)
    pages, skipped = [], []

    for url in urls:
        if len(pages) >= args.max_pages:
            break
        if robots and not robots.can_fetch(USER_AGENT, url):
            skipped.append({"url": url, "reason": "disallowed by robots.txt"})
            continue
        try:
            resp = session.get(url, timeout=25)
            if resp.status_code != 200:
                skipped.append({"url": url, "reason": f"HTTP {resp.status_code}"})
                continue
            if "html" not in resp.headers.get("Content-Type", "").lower():
                skipped.append({"url": url, "reason": "not HTML"})
                continue
            pages.append(analyse(url, resp.text, netloc))
        except requests.RequestException as exc:
            skipped.append({"url": url, "reason": str(exc)})
        time.sleep(args.delay)

    report = {
        "base_url": base,
        "status": "ok",
        "pages_crawled": len(pages),
        "pages_discovered": len(urls),
        "crawl_log": log,
        "skipped": skipped[:40],
        "pages": pages,
    }

    payload = json.dumps(report, indent=2, ensure_ascii=False)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as fh:
            fh.write(payload)
        print(f"wrote {args.out}: {len(pages)} pages crawled, {len(skipped)} skipped")
    else:
        print(payload)
    return 0


if __name__ == "__main__":
    sys.exit(main())
