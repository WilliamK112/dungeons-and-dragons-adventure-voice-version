/**
 * PromptTrace integration for D&D Adventure
 * Sends trace events to the PromptTrace dashboard (local or cloud).
 *
 * Set VITE_PROMPTTRACE_URL in your .env to point to a cloud instance:
 *   VITE_PROMPTTRACE_URL=https://your-prompttrace.railway.app/api/ingest
 *
 * Falls back to localhost:4310 for local dev.
 * Silently no-ops if the dashboard is unreachable — never breaks the game.
 */

const PROMPTTRACE_URL =
  (import.meta.env?.VITE_PROMPTTRACE_URL as string | undefined) ||
  'http://localhost:4310/api/ingest';

function uuid(): string {
  try { return crypto.randomUUID(); } catch { return String(Date.now() + Math.random()); }
}

export interface TraceOptions {
  endpoint: string;
  model: string;
  provider?: string;
  requestType?: 'text' | 'image' | 'video' | 'tool_call';
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  cacheHit?: boolean;
}

/**
 * Wrap any async LLM call with tracing.
 *
 * Usage:
 *   const result = await traced({ endpoint: 'story.generate', model: 'gemini-2.5-flash' }, () => ai.models.generateContent(...));
 */
export async function traced<T>(opts: TraceOptions, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  const spanId = uuid();
  let status: 'ok' | 'error' = 'ok';
  let errorCategory: string | null = null;
  let errorMsg = '';

  try {
    const result = await fn();
    return result;
  } catch (e: any) {
    status = 'error';
    errorMsg = String(e?.message || e);
    errorCategory =
      /429|quota|resource_exhausted/i.test(errorMsg) ? 'quota' :
      /403|permission|forbidden/i.test(errorMsg)     ? 'permission' :
      /timeout|etimedout|aborted/i.test(errorMsg)    ? 'timeout' :
      /network|fetch|econn/i.test(errorMsg)          ? 'network' : 'unknown';
    throw e;
  } finally {
    const end = Date.now();
    const inTok  = opts.inputTokens  ?? null;
    const outTok = opts.outputTokens ?? null;

    const event = {
      span_id:              spanId,
      timestamp_start:      new Date(start).toISOString(),
      timestamp_end:        new Date(end).toISOString(),
      latency_ms:           end - start,
      provider:             opts.provider ?? 'gemini',
      model:                opts.model,
      endpoint:             opts.endpoint,
      request_type:         opts.requestType ?? 'text',
      status,
      error_category:       errorCategory,
      error_message_preview: errorMsg?.slice(0, 300) || undefined,
      input_tokens:         inTok,
      output_tokens:        outTok,
      total_tokens:         (inTok != null && outTok != null) ? inTok + outTok : opts.totalTokens ?? null,
      estimated_cost_usd:   null,
      pricing_source:       'dnd-app',
      retries:              { count: 0, finalOutcome: status === 'ok' ? 'success' : 'failed' },
      cache:                { hit: opts.cacheHit ?? false },
      redaction_applied:    false,
    };

    fetch(PROMPTTRACE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      keepalive: true,
    }).catch(() => { /* dashboard offline — silently skip */ });
  }
}
