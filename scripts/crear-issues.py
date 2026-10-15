#!/usr/bin/env python3
"""Crea etiquetas e issues en GitHub a partir de tareas/backlog-etapa-1.md.

Idempotente: si ya existe un issue cuyo título empieza con "T-xxx:", no lo duplica.
Las referencias "T-xxx" del cuerpo se convierten en "#<número>" en una segunda pasada.

Uso:
  python3 scripts/crear-issues.py --repo usuario/repositorio [--dry-run]
Requiere la CLI `gh` autenticada.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKLOG = ROOT / "tareas" / "backlog-etapa-1.md"
LABELS = ROOT / ".github" / "labels.json"

HEADER = re.compile(
    r"^## (?P<id>T-\d+) · (?P<title>.+)\n"
    r"- \*\*Área:\*\* (?P<area>\S+) · \*\*Ola:\*\* (?P<ola>\d) · "
    r"\*\*Depende de:\*\* (?P<deps>[^·]+?) · \*\*Necesita a Arle:\*\* (?P<arle>.+)$",
    re.M,
)


def parse_backlog() -> list[dict]:
    text = BACKLOG.read_text(encoding="utf-8")
    matches = list(HEADER.finditer(text))
    tasks = []
    for i, m in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[m.end():end].strip().rstrip("-").strip()
        deps = [d.strip() for d in m["deps"].split(",") if d.strip() not in ("—", "")]
        tasks.append({
            "id": m["id"], "title": m["title"].strip(), "area": m["area"], "ola": m["ola"],
            "deps": deps, "arle": m["arle"].strip().startswith("sí"), "body": body,
            "arle_detail": m["arle"].strip(),
        })
    return tasks


def gh(args: list[str], dry: bool, capture: bool = False) -> str:
    if dry:
        print("  [dry-run] gh " + " ".join(args[:6]) + (" …" if len(args) > 6 else ""))
        return ""
    res = subprocess.run(["gh", *args], check=True, text=True,
                         capture_output=capture)
    return res.stdout if capture else ""


def render_body(task: dict, numbers: dict[str, int]) -> str:
    def link(tid: str) -> str:
        return f"#{numbers[tid]}" if tid in numbers else tid

    deps = ", ".join(link(d) for d in task["deps"]) or "—"
    body = re.sub(r"\bT-\d{3}\b", lambda m: link(m.group(0)), task["body"])
    return (
        f"**Tarea:** {task['id']} · **Área:** {task['area']} · **Ola:** {task['ola']}\n"
        f"**Depende de:** {deps}\n"
        f"**Necesita a Arle:** {task['arle_detail']}\n\n"
        f"> Antes de empezar, leé `AGENTS.md`. No empieces si alguna dependencia sigue abierta.\n\n"
        f"{body}\n"
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True)
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    tasks = parse_backlog()
    print(f"{len(tasks)} tareas en el backlog")

    print("Etiquetas…")
    for lb in json.loads(LABELS.read_text(encoding="utf-8")):
        gh(["label", "create", lb["name"], "--repo", a.repo, "--color", lb["color"],
            "--description", lb["description"], "--force"], a.dry_run)

    existing: dict[str, int] = {}
    if not a.dry_run:
        out = gh(["issue", "list", "--repo", a.repo, "--state", "all", "--limit", "500",
                  "--json", "number,title"], False, capture=True)
        for it in json.loads(out or "[]"):
            m = re.match(r"^(T-\d+):", it["title"])
            if m:
                existing[m.group(1)] = it["number"]

    print("Issues…")
    numbers = dict(existing)
    for t in tasks:
        if t["id"] in numbers:
            print(f"  {t['id']} ya existe (#{numbers[t['id']]})")
            continue
        labels = [f"area:{t['area']}", f"ola:{t['ola']}",
                  "estado:listo-para-codex" if not t["deps"] else "estado:bloqueada"]
        if t["arle"]:
            labels.append("necesita-a-arle")
        args = ["issue", "create", "--repo", a.repo, "--title", f"{t['id']}: {t['title']}",
                "--body", render_body(t, numbers)]
        for lb in labels:
            args += ["--label", lb]
        url = gh(args, a.dry_run, capture=True).strip()
        if url:
            numbers[t["id"]] = int(url.rstrip("/").rsplit("/", 1)[-1])
            print(f"  {t['id']} → #{numbers[t['id']]}")

    print("Enlazando dependencias…")
    for t in tasks:
        if t["id"] in numbers and not a.dry_run:
            gh(["issue", "edit", str(numbers[t["id"]]), "--repo", a.repo,
                "--body", render_body(t, numbers)], False)
    print("Listo.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
