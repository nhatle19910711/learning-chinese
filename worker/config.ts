/** Hằng số cấu hình cho Worker proxy Gemini. */

export const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Model mặc định. ⚠️ Xác minh model free mới nhất trên Google AI Studio trước khi deploy.
 * Đổi model = đổi 1 dòng (hoặc đặt biến môi trường GEMINI_MODEL).
 */
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

/** Giới hạn token đầu ra để tiết kiệm quota free. */
export const MAX_OUTPUT_TOKENS = 800;

/** Số lượt hội thoại gần nhất giữ lại khi gửi cho Gemini (tiết kiệm token). */
export const HISTORY_LIMIT = 10;

/** Rate-limit best-effort per-isolate (token bucket theo IP). */
export const RATE_LIMIT = {
  capacity: 20, // số request tối đa dồn lại
  refillPerSec: 0.5, // hồi 0.5 token/giây ≈ 30 req/phút
};
