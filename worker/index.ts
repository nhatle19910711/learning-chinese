import type { Env } from './types';
import { errorResponse, jsonResponse } from './lib/http';
import { checkPasscode } from './lib/auth';
import { allow } from './lib/rate-limit';
import { handleChat } from './handlers/chat-handler';
import { handleGrade } from './handlers/grade-handler';
import { handleExercise } from './handlers/exercise-handler';
import { handleConversation } from './handlers/conversation-handler';
import { handleTranslate } from './handlers/translate-handler';

/**
 * Entry Worker: phục vụ cả static SPA (./dist) lẫn API /api/*.
 * Mặc định asset-first → /api/* (không khớp file) rơi vào đây.
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);

    // Health check — không cần passcode (kiểm tra Worker sống).
    if (pathname === '/api/health') return jsonResponse({ ok: true });

    if (pathname.startsWith('/api/')) {
      // 1) Gate mật khẩu chia sẻ.
      if (!checkPasscode(request, env)) {
        return errorResponse(401, 'unauthorized', 'Sai hoặc thiếu mật khẩu.');
      }
      // 2) Rate-limit nhẹ theo IP (best-effort).
      const ip = request.headers.get('cf-connecting-ip') ?? 'local';
      if (!allow(ip, Date.now())) {
        return errorResponse(429, 'rate_limited', 'Bạn thao tác hơi nhanh, thử lại sau giây lát.');
      }
      return routeApi(pathname, request, env, ctx);
    }

    // Còn lại: static assets / SPA fallback.
    return env.ASSETS.fetch(request);
  },
};

/** Dispatch các endpoint /api/* (handler thật bổ sung ở phase sau). */
function routeApi(
  pathname: string,
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Response | Promise<Response> {
  switch (pathname) {
    case '/api/chat':
      return handleChat(request, env, ctx);
    case '/api/grade':
      return handleGrade(request, env);
    case '/api/exercise':
      return handleExercise(request, env);
    case '/api/conversation':
      return handleConversation(request, env, ctx);
    case '/api/translate':
      return handleTranslate(request, env);
    default:
      return errorResponse(404, 'bad_request', 'Endpoint không tồn tại.');
  }
}
