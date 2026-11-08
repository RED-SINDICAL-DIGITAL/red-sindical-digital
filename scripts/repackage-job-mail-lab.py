#!/usr/bin/env python3
"""Repackage the frozen *synthetic* Bolsa email QA ZIP, never a deployable Worker."""
from pathlib import Path
from tempfile import NamedTemporaryFile
import os
import sys
import zipfile

root = Path(__file__).resolve().parents[1]
worker = root / "releases/uadav-bolsa-mail-lab-11766.js"
archive = root / "releases/uadav-bolsa-mail-lab-11766.zip"
payload = worker.read_bytes()
if not payload.startswith(b"/* SYNTHETIC MAIL RECOVERY QA ONLY."):
    raise SystemExit("Refusing non-synthetic QA payload")
if not archive.is_file():
    raise SystemExit("Frozen QA archive is missing")
with zipfile.ZipFile(archive) as old:
    if old.testzip() is not None:
        raise SystemExit("Existing QA ZIP is corrupt")
    infos = old.infolist()
    if sum(info.filename == "worker.js" for info in infos) != 1:
        raise SystemExit("Expected one worker.js in synthetic QA archive")
    with NamedTemporaryFile(dir=archive.parent, suffix=".zip", delete=False) as tmp:
        temp_path = Path(tmp.name)
    try:
        with zipfile.ZipFile(temp_path, "w") as new:
            new.comment = old.comment
            for info in infos:
                contents = payload if info.filename == "worker.js" else old.read(info.filename)
                new.writestr(info, contents)
        with zipfile.ZipFile(temp_path) as verified:
            if verified.testzip() is not None or verified.read("worker.js") != payload:
                raise SystemExit("Generated ZIP validation failed")
        os.replace(temp_path, archive)
    finally:
        temp_path.unlink(missing_ok=True)
print("Synthetic mail recovery ZIP rebuilt from generated JS; no remote service used.")
