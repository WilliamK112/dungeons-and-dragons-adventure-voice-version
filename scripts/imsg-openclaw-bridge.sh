#!/usr/bin/env bash
set -euo pipefail

CHAT_ID="${1:-172}"
LOG_DIR="${HOME}/.openclaw/imsg-bridge"
LOG_FILE="${LOG_DIR}/openclaw-bridge-chat-${CHAT_ID}.log"
SEEN_FILE="${LOG_DIR}/openclaw-bridge-chat-${CHAT_ID}.seen"

mkdir -p "$LOG_DIR"
touch "$LOG_FILE" "$SEEN_FILE"

trim_seen() {
  local n
  n=$(wc -l < "$SEEN_FILE" 2>/dev/null || echo 0)
  if [ "$n" -gt 1200 ]; then
    tail -n 600 "$SEEN_FILE" > "${SEEN_FILE}.tmp" && mv "${SEEN_FILE}.tmp" "$SEEN_FILE"
  fi
}

echo "[openclaw-imsg-bridge] watching chat ${CHAT_ID}" | tee -a "$LOG_FILE"

# Expected line example:
# 2026-03-13T00:42:48.480Z [recv] +13478668326: Hello
imsg watch --chat-id "$CHAT_ID" --attachments | while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  ts="$(date '+%Y-%m-%d %H:%M:%S')"
  echo "[$ts] $line" >> "$LOG_FILE"

  # Handle inbound only; ignore sent lines to avoid loops.
  if [[ "$line" != *"[recv]"* ]]; then
    continue
  fi

  # Parse number + message body.
  sender=$(echo "$line" | sed -nE 's/.*\[recv\]\s+([^:]+):\s+.*/\1/p')
  body=$(echo "$line" | sed -nE 's/.*\[recv\]\s+[^:]+:\s*(.*)$/\1/p')

  [[ -z "$sender" || -z "$body" ]] && continue

  # Dedup exact inbound payload.
  key="${sender}|${body}"
  if grep -Fxq "$key" "$SEEN_FILE"; then
    continue
  fi
  echo "$key" >> "$SEEN_FILE"
  trim_seen

  # Route to OpenClaw agent and deliver reply back to same iMessage sender.
  # --deliver sends assistant response to the target channel/recipient.
  openclaw agent \
    --channel imessage \
    --to "$sender" \
    --message "$body" \
    --deliver \
    --timeout 120 \
    >> "$LOG_FILE" 2>&1 || {
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] bridge-error: failed to process inbound message from ${sender}" >> "$LOG_FILE"
    }
done
