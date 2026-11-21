#!/usr/bin/env python3
"""Validate Electron artifacts and immutable Tauri sunset feeds."""
import base64
import argparse
import hashlib
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse
from check_electron_release_assets import verify_release

def validate_sunset(manifest, tag):
    if manifest.get("version") != tag.removeprefix("v"):
        raise ValueError("Tauri version must match sunset tag")
    if not manifest.get("platforms"):
        raise ValueError("Missing Tauri platforms")
    for entry in manifest["platforms"].values():
        url = urlparse(entry.get("url", ""))
        prefix = f"/debpalash/VoiceStudio/releases/download/{tag}/"
        if url.scheme != "https" or url.netloc != "github.com" or not url.path.startswith(prefix):
            raise ValueError("Tauri URLs must point to immutable sunset assets")
        if not entry.get("signature"):
            raise ValueError("Missing Tauri signature")

def channel_for(version):
    """`X.Y.Z` is Stable, `X.Y.Z-beta.N` is Beta; any other shape is not a release."""
    if re.fullmatch(r"\d+\.\d+\.\d+", version):
        return "stable"
    if re.fullmatch(r"\d+\.\d+\.\d+-beta\.\d+", version):
        return "beta"
    raise ValueError(f"Not a stable or beta release version: {version}")

def prepare(assets, tag, sunset_tag=None, missing=None):
    """Verify the assets as release `tag` and write its notes and SHA256SUMS.txt.

    The notes are the CHANGELOG section verbatim. In a rehearsal `tag` is the one
    the package version would get and does not exist yet.
    `missing` (rehearsals only) collects build legs that produced nothing instead
    of stopping at the first, so the legs that did build are still verified; the
    caller must fail on a non-empty list.
    """
    version = json.loads(Path("package.json").read_text(encoding="utf-8"))["version"]
    if tag != f"v{version}":
        raise ValueError("Tag must match package version")
    channel = channel_for(version)
    files = [p for p in assets.iterdir() if p.is_file()]
    release = {"tagName": tag, "isPrerelease": channel == "beta", "assets": [
        {"name": p.name, "size": p.stat().st_size,
         "digest": "sha256:" + hashlib.sha256(p.read_bytes()).hexdigest()}
        for p in files]}
    installers = ("mac-arm64.dmg", "mac-x64.dmg", "linux-x64.deb")
    absent_installers = [s for s in installers if not (assets / f"VoiceStudio-{version}-{s}").is_file()]
    if missing is not None:
        # Recorded before any check can fail (the caller writes the list even then).
        missing.extend(f"installer {suffix}" for suffix in absent_installers)
    verify_release(release, assets, channel=channel, version=version, missing=missing)
    for manifest in assets.glob(f"electron-{channel}-*.yml"):
        text = manifest.read_text(encoding="utf-8")
        artifact = re.search(r"^\s+- url:\s*(.+)$", text, re.M)[1].strip().strip("'\"")
        expected = re.search(r"^\s{4}sha512:\s*(.+)$", text, re.M)[1].strip().strip("'\"")
        actual = base64.b64encode(hashlib.sha512((assets / artifact).read_bytes()).digest()).decode()
        if actual != expected:
            raise ValueError("Updater payload checksum mismatch")
    if absent_installers and missing is None:
        raise ValueError(f"Missing installer: {absent_installers[0]}")
    # Archived Tauri clients read `latest/download`, which never serves a
    # prerelease, so betas carry no sunset feeds.
    if sunset_tag and channel == "stable":
        for name in ("latest.json", "latest-user.json"):
            validate_sunset(json.loads((assets / name).read_text(encoding="utf-8")), sunset_tag)
    section = re.search(rf"^## \[{re.escape(version)}\][^\n]*\n(.*?)(?=^## |\Z)",
                        Path("CHANGELOG.md").read_text(encoding="utf-8"), re.M | re.S)
    if not section or not section[1].strip():
        raise ValueError("Write versioned CHANGELOG notes before release")
    notes = section[1].strip() + "\n"
    (assets / "RELEASE_NOTES.md").write_text(notes, encoding="utf-8")
    (assets / "SHA256SUMS.txt").write_text("\n".join(
        f"{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.name}" for p in sorted(files)
        if p.name not in {"SHA256SUMS.txt", "RELEASE_NOTES.md"}) + "\n", encoding="utf-8")

def rehearsal_target():
    """The tag package.json's version would get, for a rehearsal."""
    version = json.loads(Path("package.json").read_text(encoding="utf-8"))["version"]
    channel_for(version)  # a rehearsal needs a releasable version shape too
    return f"v{version}"


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--assets", type=Path)
    selector = parser.add_mutually_exclusive_group()
    selector.add_argument("--tag")
    selector.add_argument("--rehearsal", action="store_true",
                          help="No tag exists yet: verify as the tag package.json's version would get")
    parser.add_argument("--missing-report", type=Path,
                        help="With --rehearsal: verify the legs that built, list the ones that did not here")
    parser.add_argument("--sunset-tag")
    parser.add_argument("--print-channel", action="store_true",
                        help="Print stable or beta for the package version and exit")
    args = parser.parse_args()
    if args.print_channel:
        print(channel_for(json.loads(Path("package.json").read_text(encoding="utf-8"))["version"]))
    elif args.missing_report and not args.rehearsal:
        parser.error("--missing-report is only for --rehearsal; a release needs every leg")
    elif args.assets and args.rehearsal:
        tag = rehearsal_target()
        missing = [] if args.missing_report else None
        try:
            prepare(args.assets, tag, args.sunset_tag, missing=missing)
        finally:
            # Also when another leg is broken: the absent legs are already known
            # and the rehearsal's last step lists them; the error still fails this step.
            if args.missing_report:
                args.missing_report.write_text("".join(f"{item}\n" for item in missing), encoding="utf-8")
                for item in missing:
                    print(f"::error::Rehearsal is missing {item}: its build leg failed", file=sys.stderr)
    elif args.assets and args.tag:
        prepare(args.assets, args.tag, args.sunset_tag)
    else:
        parser.error("--assets and --tag (or --rehearsal) are required")
