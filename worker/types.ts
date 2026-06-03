/** Types nội bộ của Worker. Hợp đồng dùng chung nằm ở src/lib/ai-contracts.ts. */

/** Biến môi trường + binding của Worker (khớp wrangler.jsonc + secrets). */
export interface Env {
  ASSETS: Fetcher; // binding static assets (phục vụ SPA)
  GEMINI_API_KEY: string; // secret — 1 key (fallback)
  GEMINI_API_KEYS?: string; // secret — nhiều key ngăn cách dấu phẩy (xoay vòng tăng quota)
  APP_PASSCODE: string; // secret — mật khẩu chia sẻ
  GEMINI_MODEL?: string; // optional override model
}

/** Một khối nội dung gửi cho Gemini (định dạng API). */
export interface GeminiContent {
  role: 'user' | 'model';
  parts: { text: string }[];
}

/** generationConfig của Gemini. */
export interface GeminiGenConfig {
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
  responseSchema?: unknown;
}

/** Payload chuẩn hóa truyền vào gemini-client. */
export interface GeminiPayload {
  system?: string; // system instruction (persona/format)
  contents: GeminiContent[];
  generationConfig?: GeminiGenConfig;
}
