#!/usr/bin/env bash
set -euo pipefail

CHAT_ID="${1:-172}"
AUTO_ACK="${AUTO_ACK:-0}"   # default OFF to prevent loops
LOG_DIR="${HOME}/.openclaw/imsg-bridge"
LOG_FILE="${LOG_DIR}/chat-${CHAT_ID}.log"
STATE_FILE="${LOG_DIR}/chat-${CHAT_ID}.seen"
LOCK_FILE="${LOG_DIR}/chat-${CHAT_ID}.ack.lock"
ACK_TEXT="✅ 收到你的消息。我这边桥接在线，正在处理。"

mkdir -p "$LOG_DIR"
touch "$LOG_FILE" "$STATE_FILE"

trim_seen() {
  local n
  n=$(wc -l < "$STATE_FILE" 2>/dev/null || echo 0)
  if [ "$n" -gt 500 ]; then
    tail -n 300 "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
  fi
}

echo "[imsg-bridge] watching chat ${CHAT_ID} (AUTO_ACK=${AUTO_ACK})" | tee -a "$LOG_FILE"

imsg watch --chat-id "$CHAT_ID" --attachments | while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  ts="$(date '+%Y-%m-%d %H:%M:%S')"
  echo "[$ts] $line" >> "$LOG_FILE"

  # Never react to our own ACK text
  if [[ "$line" == *"$ACK_TEXT"* ]]; then
    continue
  fi

  # De-dup exact line
  if grep -Fxq "$line" "$STATE_FILE"; then
    continue
  fi
  echo "$line" >> "$STATE_FILE"
  trim_seen

  # AUTO ACK is opt-in only
  if [[ "$AUTO_ACK" != "1" ]]; then
    continue
  fi

  # Rate limit ACKs: at most one every 20s
  now=$(date +%s)
  last=0
  if [[ -f "$LOCK_FILE" ]]; then
    last=$(cat "$LOCK_FILE" 2>/dev/null || echo 0)
  fi
  if (( now - last < 20 )); then
    continue
  fi

  if [[ "$line" == *":"* ]]; then
    echo "$now" > "$LOCK_FILE"
    imsg send --chat-id "$CHAT_ID" --text "$ACK_TEXT" --service auto >/dev/null 2>&1 || true
  fi
done
