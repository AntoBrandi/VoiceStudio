"""The fork's update feed and release links follow config/app.json.

Installed fork builds must update from the fork's own GitHub releases. A
hard-coded upstream release URL (for example one arriving in an upstream merge)
would silently move them back onto upstream's builds, so release URLs are
derived from ``releaseRepository`` and nothing in the shipped app or its
packaging may name upstream's releases directly.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / "config" / "app.json").read_text(encoding="utf-8"))

# The app, its packaging config and the scripts that write update metadata.
SHIPPED = [
    *sorted((ROOT / "electron" / "src").rglob("*.ts")),
    *sorted((ROOT / "electron" / "src").rglob("*.tsx")),
    *sorted((ROOT / "electron" / "src").rglob("*.js")),
    ROOT / "electron" / "electron-builder.config.mjs",
    ROOT / "electron" / "scripts" / "embed-appimage-update.mjs",
    ROOT / "electron" / "tests" / "update-package-contract.mjs",
]
UPSTREAM_RELEASES = re.compile(
    r"github\.com/debpalash/VoiceStudio/releases"
    r"|api\.github\.com/repos/debpalash/VoiceStudio"
    r"|gh-releases-zsync\|debpalash\|"
)


def test_release_repository_is_the_fork():
    assert CONFIG["releaseRepository"] == "AntoBrandi/VoiceStudio"


def test_shipped_code_never_names_upstream_releases():
    offenders = []
    for path in SHIPPED:
        if re.search(r"\.test\.(ts|tsx|js)$", path.name):
            continue
        for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            if UPSTREAM_RELEASES.search(line):
                offenders.append(f"{path.relative_to(ROOT)}:{number}: {line.strip()}")
    assert not offenders, (
        "Derive release URLs from RELEASES_URL / RELEASES_API_URL "
        "(config/app-config.mjs) instead:\n" + "\n".join(offenders)
    )


def test_fork_release_workflow_publishes_the_feed_the_app_reads():
    workflow = (ROOT / ".github" / "workflows" / "fork-release.yml").read_text(encoding="utf-8")
    # The packaged channel and both manifest names the updater can request.
    assert "VOICESTUDIO_UPDATE_CHANNEL: electron-stable-linux-x64" in workflow
    assert "electron-stable-linux-x64-linux.yml" in workflow
    assert "electron-beta-linux-x64-linux.yml" in workflow
    # `latest` is what the Stable feed (releases/latest/download) resolves.
    assert "--latest" in workflow
    # The fork version keeps the only shape the updater compares.
    assert '"$base-beta.$((1000 + GITHUB_RUN_NUMBER))"' in workflow
