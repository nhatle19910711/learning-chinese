import type { AiErrorCode } from '../../src/lib/ai-contracts';
import type { Env, GeminiPayload } from '../types';
import { DEFAULT_GEMINI_MODEL, GEMINI_BASE } from '../config';

/** Lỗi gọi Gemini, kèm mã chuẩn hóa để map sang thông báo người dùng. */
export class GeminiError extends Error {
  code: AiErrorCode;
  status: number;
  constructor(status: number) {
    super(`Gemini API error ${status}`);
    this.status = status;
    this.code = status === 429 ? 'quota_exceeded' : 'server';
    this.name = 'GeminiError';
  }
}

function modelName(env: Env): string {
  return env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
}

/** Dựng body request theo định dạng Gemini REST. */
function buildBody(p: GeminiPayload): Record<string, unknown> {
  const body: Record<string, unknown> = { contents: p.contents };
  if (p.system) {
    body.system_instruction = { role: 'user', parts: [{ text: p.system }] };
  }
  // Tắt "thinking" của Gemini 2.5: HSK1 không cần suy luận sâu, và thinking tokens
  // ăn hết maxOutputTokens → cụt câu trả lời / JSON. Tắt = nhanh, rẻ, ổn định hơn.
  body.generationConfig = { ...p.generationConfig, thinkingConfig: { thinkingBudget: 0 } };
  return body;
}

/**
 * Lấy danh sách API key. Ưu tiên GEMINI_API_KEYS (nhiều key, ngăn cách dấu phẩy)
 * để xoay vòng tăng quota; fallback GEMINI_API_KEY (1 key).
 */
function getKeys(env: Env): string[] {
  const multi = (env.GEMINI_API_KEYS ?? '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  if (multi.length) return multi;
  return env.GEMINI_API_KEY ? [env.GEMINI_API_KEY] : [];
}

/**
 * Gọi Gemini, tự xoay vòng key khi gặp lỗi (vd 429 hết quota của 1 key).
 * Trả Response thành công (status 2xx) hoặc ném GeminiError với status cuối cùng.
 */
async function fetchWithKeyRotation(
  env: Env,
  url: string,
  body: Record<string, unknown>,
): Promise<Response> {
  const keys = getKeys(env);
  if (!keys.length) throw new GeminiError(500); // chưa cấu hình key
  let lastStatus = 500;

  for (let i = 0; i < keys.length; i++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': keys[i] },
      body: JSON.stringify(body),
    });
    if (res.ok) return res;
    lastStatus = res.status;
    // Log lỗi để theo dõi qua `wrangler tail`; còn key khác → thử tiếp.
    console.error(
      `[gemini] key #${i + 1}/${keys.length} status ${res.status}`,
      await res.text().catch(() => ''),
    );
  }
  throw new GeminiError(lastStatus);
}

/** Trích text từ 1 object response/chunk của Gemini. */
function extractText(parsed: unknown): string {
  const candidates = (parsed as { candidates?: unknown[] })?.candidates;
  const first = candidates?.[0] as { content?: { parts?: { text?: string }[] } } | undefined;
  return first?.content?.parts?.[0]?.text ?? '';
}

/**
 * Stream text tăng dần từ Gemini (SSE). yield từng đoạn text increment.
 * Dùng cho chat / hội thoại.
 */
export async function* streamGemini(env: Env, p: GeminiPayload): AsyncGenerator<string> {
  const url = `${GEMINI_BASE}/${modelName(env)}:streamGenerateContent?alt=sse`;
  const res = await fetchWithKeyRotation(env, url, buildBody(p));
  if (!res.body) throw new GeminiError(500);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf('\n')) >= 0) {
      const text = parseSseLine(buffer.slice(0, nl));
      buffer = buffer.slice(nl + 1);
      if (text) yield text;
    }
  }
  // Flush dòng cuối còn sót (nếu body không kết thúc bằng newline).
  const tail = parseSseLine(buffer);
  if (tail) yield tail;
}

/** Parse 1 dòng SSE "data: {…}" → text increment (hoặc '' nếu không có). */
function parseSseLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data:')) return '';
  const json = trimmed.slice(5).trim();
  if (!json || json === '[DONE]') return '';
  try {
    return extractText(JSON.parse(json));
  } catch {
    return '';
  }
}

/**
 * Gọi non-stream, trả về text thô (chuỗi). Dùng cho chấm câu / sinh bài tập
 * (handler tự parse JSON từ chuỗi này).
 */
export async function generateGeminiText(env: Env, p: GeminiPayload): Promise<string> {
  const url = `${GEMINI_BASE}/${modelName(env)}:generateContent`;
  const res = await fetchWithKeyRotation(env, url, buildBody(p));
  const data = await res.json();
  return extractText(data);
}
