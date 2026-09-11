"""
MemoryZ — Sovereign Agentic Memory Substrate (Python SDK & Micro-Client)
Zero external dependencies. Pure standard library (urllib + json).

Usage:
    import memoryz

    # Recall relevant memories
    memories = memoryz.recall("developer preferences")

    # Get formatted XML context for LLM prompt injection
    context_xml = memoryz.get_context("database migration")

    # Store a new persistent memory atom
    memoryz.store("Use port 4000 for staging server", memory_type="env")
"""

import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional

DEFAULT_SERVER_URL = "https://memoryz.wino.deno.net"
CONFIG_FILE = Path.home() / ".memoryz" / "config.json"


def load_config() -> Dict[str, str]:
    """Loads configuration from environment variables or ~/.memoryz/config.json."""
    saved: Dict[str, Any] = {}
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
        except Exception:
            pass

    token = (
        os.environ.get("MEMORYZ_API_KEY")
        or os.environ.get("MEMORYZ_TOKEN")
        or saved.get("token")
        or ""
    )
    url = (
        os.environ.get("MEMORYZ_URL")
        or saved.get("url")
        or DEFAULT_SERVER_URL
    ).rstrip("/")

    return {"token": token, "url": url}


def recall(
    query: str = "",
    memory_type: Optional[str] = None,
    limit: int = 5,
    token: Optional[str] = None,
    url: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Recalls memories using semantic vector search and time-decay scoring."""
    cfg = load_config()
    active_token = token or cfg["token"]
    active_url = (url or cfg["url"]).rstrip("/")

    if not active_token:
        raise ValueError(
            "MemoryZ token missing. Set MEMORYZ_API_KEY environment variable or run 'memoryz init'."
        )

    params: Dict[str, str] = {"limit": str(limit)}
    if query:
        params["query"] = query
    if memory_type:
        params["type"] = memory_type

    endpoint = f"{active_url}/api/memories/recall?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(
        endpoint,
        headers={
            "X-API-Key": active_token,
            "Accept": "application/json",
            "User-Agent": "MemoryZ-Python-SDK/1.0",
        },
        method="GET",
    )

    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data.get("memories", [])


def store(
    content: str,
    memory_type: str = "note",
    title: Optional[str] = None,
    token: Optional[str] = None,
    url: Optional[str] = None,
) -> Dict[str, Any]:
    """Stores a new memory atom with automatic 768-dim Gemini vector embedding."""
    cfg = load_config()
    active_token = token or cfg["token"]
    active_url = (url or cfg["url"]).rstrip("/")

    if not active_token:
        raise ValueError("MemoryZ token missing.")
    if not content:
        raise ValueError("Content is required.")

    payload = {
        "type": memory_type,
        "content": content,
    }
    if title:
        payload["title"] = title

    body_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"{active_url}/api/memories",
        data=body_bytes,
        headers={
            "X-API-Key": active_token,
            "Content-Type": "application/json",
            "User-Agent": "MemoryZ-Python-SDK/1.0",
        },
        method="POST",
    )

    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))


def get_context(
    query: str = "",
    limit: int = 5,
    token: Optional[str] = None,
    url: Optional[str] = None,
) -> str:
    """Returns an XML context block formatted specifically for LLM prompt injection."""
    memories = recall(query=query, limit=limit, token=token, url=url)
    if not memories:
        return ""

    lines = ["<memoryz_context>"]
    for m in memories:
        m_type = m.get("type", "note")
        title = m.get("title", "")
        score = m.get("recall_score", 0)
        content = m.get("content", "").strip()
        lines.append(f'  <memory type="{m_type}" title="{title}" score="{score}">')
        lines.append(f"    {content}")
        lines.append("  </memory>")
    lines.append("</memoryz_context>")
    return "\n".join(lines)


def vault_store(
    key_name: str,
    secret_value: str,
    passphrase: str,
    token: Optional[str] = None,
    url: Optional[str] = None,
) -> Dict[str, Any]:
    """Stores an encrypted secret in the Zero-Knowledge vault."""
    cfg = load_config()
    active_token = token or cfg["token"]
    active_url = (url or cfg["url"]).rstrip("/")

    payload = {
        "key_name": key_name,
        "secret_value": secret_value,
        "passphrase": passphrase,
    }
    body_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"{active_url}/api/vault",
        data=body_bytes,
        headers={
            "X-API-Key": active_token,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))


def vault_get(
    key_name: str,
    passphrase: str,
    token: Optional[str] = None,
    url: Optional[str] = None,
) -> str:
    """Decrypts and retrieves a secret on-the-fly from the Zero-Knowledge vault."""
    cfg = load_config()
    active_token = token or cfg["token"]
    active_url = (url or cfg["url"]).rstrip("/")

    payload = {
        "key_name": key_name,
        "passphrase": passphrase,
    }
    body_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"{active_url}/api/vault/retrieve",
        data=body_bytes,
        headers={
            "X-API-Key": active_token,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        return data.get("secret_value", "")


if __name__ == "__main__":
    # Command line interface fallback for Python environments
    args = sys.argv[1:]
    cmd = args[0] if args else "help"

    if cmd == "recall":
        q = " ".join(args[1:]) if len(args) > 1 else ""
        results = recall(q)
        print(json.dumps(results, indent=2, ensure_ascii=False))
    elif cmd == "context":
        q = " ".join(args[1:]) if len(args) > 1 else ""
        print(get_context(q))
    elif cmd == "store":
        if len(args) < 2:
            print("Usage: python memoryz.py store <content> [type] [title]")
            sys.exit(1)
        cnt = args[1]
        t = args[2] if len(args) > 2 else "note"
        tit = args[3] if len(args) > 3 else None
        res = store(cnt, memory_type=t, title=tit)
        print(json.dumps(res, indent=2, ensure_ascii=False))
    else:
        print("MemoryZ Python Micro-Client")
        print("Usage:")
        print("  python memoryz.py recall <query>")
        print("  python memoryz.py context <query>")
        print("  python memoryz.py store <content> [type] [title]")
