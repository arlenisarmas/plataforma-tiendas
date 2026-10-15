#!/usr/bin/env python3
"""Crea etiquetas e issues en GitHub a partir de tareas/backlog-etapa-1.md.

Idempotente: si ya existe un issue cuyo título empieza con "T-xxx:", no lo duplica.
Las referencias "T-xxx" del cuerpo se convierten en "#<número>" en una segunda pasada.

Uso:
  python3 scripts/crear-issues.py --repo usuario/repositorio [--dry-run]
Requiere la CLI `gh` autenticada (usa solo la API REST).
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


def api(method: str, path: str, payload: dict | None, dry: bool) -> object:
    """Llama a la API REST de GitHub mediante `gh api`."""
    if dry:
        print(f"  [dry-run] {method} {path}")
        return {}
    args = ["gh", "api", "--method", method, path]
    if payload is not None:
        args += ["--input", "-"]
    res = subprocess.run(args, input=json.dumps(payload) if payload is not None else None,
                         text=True, capture_output=True)
    if res.returncode != 0:
        raise RuntimeError(f"{method} {path}: {res.stderr.strip() or res.stdout.strip()}")
    return json.loads(res.stdout) if res.stdout.strip() else {}


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
    existing_labels = set()
    if not a.dry_run:
        existing_labels = {lb["name"] for lb in api("GET", f"repos/{a.repo}/labels?per_page=100", None, False)}
    for lb in json.loads(LABELS.read_text(encoding="utf-8")):
        data = {"name": lb["name"], "color": lb["color"], "description": lb["description"]}
        if lb["name"] in existing_labels:
            api("PATCH", f"repos/{a.repo}/labels/{lb['name'].replace(':', '%3A')}", data, a.dry_run)
        else:
            api("POST", f"repos/{a.repo}/labels", data, a.dry_run)

    existing: dict[str, int] = {}
    if not a.dry_run:
        for it in api("GET", f"repos/{a.repo}/issues?state=all&per_page=100", None, False):
            m = re.match(r"^(T-\d+):", it["title"])
            if m and "pull_request" not in it:
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
        res = api("POST", f"repos/{a.repo}/issues",
                  {"title": f"{t['id']}: {t['title']}", "body": render_body(t, numbers),
                   "labels": labels}, a.dry_run)
        if res:
            numbers[t["id"]] = res["number"]
            print(f"  {t['id']} → #{res['number']}")

    print("Enlazando dependencias…")
    for t in tasks:
        if t["id"] in numbers and not a.dry_run:
            api("PATCH", f"repos/{a.repo}/issues/{numbers[t['id']]}",
                {"body": render_body(t, numbers)}, False)
    print("Listo.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
