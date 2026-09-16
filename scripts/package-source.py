#!/usr/bin/env python3
"""Assemble the hand-over archive from the committed tree plus git history.

Tracked files come from `git ls-files` so build output, dependencies and runtime
state never leak into the archive. `.git` rides along so the author keeps a
restorable backup of every step rather than only the final snapshot.
"""
import subprocess
import zipfile
from pathlib import Path

ROOT = Path("/workspace/project")
PREFIX = "faisal-reports-platform"


def main() -> None:
    files = subprocess.run(
        ["git", "ls-files"], cwd=ROOT, capture_output=True, text=True, check=True
    ).stdout.split()
    missing = [f for f in files if not (ROOT / f).exists()]
    if missing:
        raise SystemExit(f"tracked but absent on disk: {missing}")

    out = ROOT / "public/downloads/faisal-reports-platform-source.zip"
    out.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for f in files:
            z.write(ROOT / f, arcname=f"{PREFIX}/{f}")
        for p in sorted((ROOT / ".git").rglob("*")):
            if p.is_file():
                z.write(p, arcname=f"{PREFIX}/.git/{p.relative_to(ROOT / '.git')}")

    print(f"{len(files)} tracked files + git history -> {out}")
    print(f"{out.stat().st_size / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    main()
