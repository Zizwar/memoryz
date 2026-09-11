#!/usr/bin/env bash
# MemoryZ — POSIX Shell / Bash Integration Functions
# Source this file in your ~/.bashrc or ~/.zshrc:
#   source /path/to/memoryz.sh
# Or curl directly:
#   source <(curl -s https://memoryz.wino.deno.net/client.sh)

MEMORYZ_DEFAULT_URL="https://memoryz.wino.deno.net"

_memoryz_get_config() {
  local key="$1"
  local config_file="$HOME/.memoryz/config.json"
  if [ -f "$config_file" ] && command -v grep >/dev/null 2>&1; then
    grep -o "\"$key\": *\"[^\"]*\"" "$config_file" 2>/dev/null | head -n1 | cut -d'"' -f4
  fi
}

_memoryz_token() {
  if [ -n "$MEMORYZ_API_KEY" ]; then
    echo "$MEMORYZ_API_KEY"
  elif [ -n "$MEMORYZ_TOKEN" ]; then
    echo "$MEMORYZ_TOKEN"
  else
    _memoryz_get_config "token"
  fi
}

_memoryz_url() {
  if [ -n "$MEMORYZ_URL" ]; then
    echo "${MEMORYZ_URL%/}"
  else
    local saved_url
    saved_url=$(_memoryz_get_config "url")
    if [ -n "$saved_url" ]; then
      echo "${saved_url%/}"
    else
      echo "$MEMORYZ_DEFAULT_URL"
    fi
  fi
}

memoryz_recall() {
  local query="$1"
  local limit="${2:-5}"
  local token
  token=$(_memoryz_token)
  local base_url
  base_url=$(_memoryz_url)

  if [ -z "$token" ]; then
    echo "Error: MemoryZ token missing. Export MEMORYZ_API_KEY or run memoryz init." >&2
    return 1
  fi

  local encoded_query
  encoded_query=$(printf '%s' "$query" | tr ' ' '+')

  curl -s -G \
    --data-urlencode "query=$query" \
    --data-urlencode "limit=$limit" \
    -H "X-API-Key: $token" \
    -H "Accept: application/json" \
    "$base_url/api/memories/recall"
}

memoryz_store() {
  local type="${1:-note}"
  local content="$2"
  local title="$3"
  local token
  token=$(_memoryz_token)
  local base_url
  base_url=$(_memoryz_url)

  if [ -z "$token" ]; then
    echo "Error: MemoryZ token missing." >&2
    return 1
  fi
  if [ -z "$content" ]; then
    echo "Usage: memoryz_store <type> <content> [title]" >&2
    return 1
  fi

  local json_payload
  if [ -n "$title" ]; then
    json_payload=$(printf '{"type":"%s","content":"%s","title":"%s"}' "$type" "$content" "$title")
  else
    json_payload=$(printf '{"type":"%s","content":"%s"}' "$type" "$content")
  fi

  curl -s -X POST \
    -H "X-API-Key: $token" \
    -H "Content-Type: application/json" \
    -d "$json_payload" \
    "$base_url/api/memories"
}

memoryz_context() {
  local query="$1"
  local limit="${2:-5}"
  local raw
  raw=$(memoryz_recall "$query" "$limit")
  
  if command -v node >/dev/null 2>&1; then
    node -e "
      const data = $raw;
      const mems = data.memories || [];
      if (!mems.length) process.exit(0);
      let out = '<memoryz_context>\n';
      mems.forEach(m => {
        out += '  <memory type=\"' + m.type + '\" title=\"' + (m.title||'') + '\">\n';
        out += '    ' + m.content.trim() + '\n';
        out += '  </memory>\n';
      });
      out += '</memoryz_context>';
      console.log(out);
    " 2>/dev/null
  else
    echo "$raw"
  fi
}
