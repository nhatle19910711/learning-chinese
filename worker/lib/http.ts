import type { AiErrorCode } from '../../src/lib/ai-contracts';

/** Trả JSON response (same-origin → không cần CORS header). */
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

/** Trả lỗi theo định dạng AiErrorBody nhất quán. */
export function errorResponse(status: number, code: AiErrorCode, message: string): Response {
  return jsonResponse({ error: message, code }, status);
}
