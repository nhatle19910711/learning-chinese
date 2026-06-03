import type { Env } from '../types';

/** So sánh constant-time để tránh timing attack nhẹ. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Kiểm tra header x-app-passcode khớp secret APP_PASSCODE. */
export function checkPasscode(request: Request, env: Env): boolean {
  if (!env.APP_PASSCODE) return false; // chưa cấu hình secret → chặn hết
  const provided = request.headers.get('x-app-passcode') ?? '';
  return safeEqual(provided, env.APP_PASSCODE);
}
