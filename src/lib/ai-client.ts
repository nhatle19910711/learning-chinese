import { clearPasscode, getPasscode } from './ai-passcode';
import type { AiErrorCode } from './ai-contracts';

/** Lỗi gọi AI có mã chuẩn hóa (UI map sang thông báo tiếng Việt). */
export class AiError extends Error {
  code: AiErrorCode;
  constructor(code: AiErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'AiError';
  }
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'content-type': 'application/json' };
  const code = getPasscode();
  if (code) h['x-app-passcode'] = code;
  return h;
}

function errorFromStatus(status: number): AiError {
  if (status === 401) return new AiError('unauthorized', 'Sai hoặc thiếu mật khẩu.');
  if (status === 429) return new AiError('rate_limited', 'Thao tác quá nhanh hoặc đã hết lượt AI.');
  return new AiError('server', `Lỗi máy chủ (${status}).`);
}

/** Đọc mã lỗi từ body server nếu có, fallback theo status. */
async function toAiError(res: Response): Promise<AiError> {
  const data = (await res.json().catch(() => null)) as { code?: AiErrorCode; error?: string } | null;
  const err = data?.code ? new AiError(data.code, data.error ?? 'Lỗi.') : errorFromStatus(res.status);
  // Mật khẩu sai → xóa khỏi localStorage để cổng hiện lại sau khi tải lại.
  if (err.code === 'unauthorized') clearPasscode();
  return err;
}

/** POST trả JSON (chấm câu, sinh bài tập). */
export async function postJson<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { method: 'POST', headers: headers(), body: JSON.stringify(body), signal });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new AiError('network', 'Mất kết nối mạng.');
  }
  if (!res.ok) throw await toAiError(res);
  return res.json() as Promise<T>;
}

/**
 * POST nhận SSE: gọi onToken cho mỗi đoạn text. Resolve khi stream kết thúc.
 * Hủy bằng AbortSignal.
 */
export async function postStream(
  path: string,
  body: unknown,
  onToken: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(path, { method: 'POST', headers: headers(), body: JSON.stringify(body), signal });
  } catch (e) {
    if ((e as Error).name === 'AbortError') return;
    throw new AiError('network', 'Mất kết nối mạng.');
  }
  if (!res.ok || !res.body) throw await toAiError(res);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let sep: number;
      while ((sep = buffer.indexOf('\n\n')) >= 0) {
        const block = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        parseSseBlock(block, onToken);
      }
    }
    // Flush khối cuối còn sót (nếu stream không kết thúc bằng \n\n).
    if (buffer.trim()) parseSseBlock(buffer, onToken);
  } catch (e) {
    if ((e as Error).name === 'AbortError') return;
    throw e;
  }
}

/** Parse 1 khối SSE ("event: x\n data: {...}"). */
function parseSseBlock(block: string, onToken: (t: string) => void): void {
  let event = 'message';
  const dataLines: string[] = [];
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
  }
  if (!dataLines.length) return;
  const raw = dataLines.join('');

  if (event === 'error') {
    let parsed: { code?: AiErrorCode; error?: string } | null = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      /* giữ null */
    }
    throw new AiError(parsed?.code ?? 'server', parsed?.error ?? 'Lỗi AI.');
  }
  if (event === 'done') return;

  try {
    const d = JSON.parse(raw) as { text?: string };
    if (typeof d.text === 'string') onToken(d.text);
  } catch {
    /* bỏ qua khối lỗi */
  }
}
