#!/usr/bin/env bash
# Install the blog-agent skills into the Claude skills directory.
#
# The skills are authored in this repo (.claude/skills/) so they survive
# container restarts and are code-reviewable. Claude Code discovers project
# skills from .claude/skills/ automatically, so this script is only needed
# when you also want them registered as *user* skills under /mnt/skills/user/
# (the layout described in the build guide).
#
# Usage:
#   bash .claude/skills/install.sh            # symlink (default; edits stay live)
#   bash .claude/skills/install.sh --copy     # copy instead of symlink
#
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="${SKILLS_USER_DIR:-/mnt/skills/user}"
MODE="symlink"
[[ "${1:-}" == "--copy" ]] && MODE="copy"

SKILLS=(
  seo
  website-brand-scraper
  competitor-site-scraper
  blog-writer-seo-aeo-geo
  blog-image-generator
  wordpress-publisher
  content-agent-orchestrator
)

if ! mkdir -p "$DEST" 2>/dev/null; then
  echo "ERROR: cannot create $DEST (read-only mount?)." >&2
  echo "The skills still work as project skills from $SRC — no install needed." >&2
  exit 1
fi

for skill in "${SKILLS[@]}"; do
  if [[ ! -f "$SRC/$skill/SKILL.md" ]]; then
    echo "SKIP  $skill (no SKILL.md)" >&2
    continue
  fi
  rm -rf "${DEST:?}/$skill"
  if [[ "$MODE" == "symlink" ]]; then
    ln -s "$SRC/$skill" "$DEST/$skill"
  else
    cp -R "$SRC/$skill" "$DEST/$skill"
  fi
  echo "OK    $skill -> $DEST/$skill ($MODE)"
done

# Shared config + scripts must be reachable from the installed copies.
rm -rf "${DEST:?}/_shared" "${DEST:?}/agent.config.json"
if [[ "$MODE" == "symlink" ]]; then
  ln -s "$SRC/_shared" "$DEST/_shared"
  ln -s "$SRC/agent.config.json" "$DEST/agent.config.json"
else
  cp -R "$SRC/_shared" "$DEST/_shared"
  cp "$SRC/agent.config.json" "$DEST/agent.config.json"
fi
echo "OK    _shared + agent.config.json -> $DEST ($MODE)"
echo
echo "Installed ${#SKILLS[@]} skills to $DEST"
