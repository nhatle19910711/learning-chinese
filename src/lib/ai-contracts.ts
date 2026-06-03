/**
 * Hợp đồng (types) dùng chung giữa frontend và Cloudflare Worker.
 * KHÔNG phụ thuộc DOM/React → worker import lại được (DRY).
 * Các type theo từng tính năng (GradeResult, Exercise…) bổ sung ở phase tương ứng.
 */

export type ChatRole = 'user' | 'model';

/** Một lượt hội thoại gửi giữa client ↔ worker. */
export interface ChatTurn {
  role: ChatRole;
  text: string;
}

export interface ChatRequest {
  messages: ChatTurn[];
}

/** Mã lỗi chuẩn hóa để client map sang thông báo tiếng Việt. */
export type AiErrorCode =
  | 'unauthorized' // sai/thiếu mật khẩu
  | 'rate_limited' // thao tác quá nhanh (per-isolate)
  | 'quota_exceeded' // Gemini 429 — hết quota free
  | 'bad_request' // payload không hợp lệ
  | 'bad_ai_response' // AI trả dữ liệu không parse được
  | 'network' // mất kết nối phía client
  | 'server'; // lỗi máy chủ khác

/** Body lỗi nhất quán từ worker. */
export interface AiErrorBody {
  error: string;
  code: AiErrorCode;
}

// ── Phase 03: Chấm & sửa câu ────────────────────────────────────────────────

export type GradeMode = 'check' | 'translate';

export interface GradeRequest {
  mode: GradeMode;
  text: string; // câu tiếng Trung người học nhập (hoặc bản dịch)
  prompt?: string; // câu tiếng Việt gốc (khi mode = translate)
}

export interface GradeIssue {
  original: string; // phần sai
  correction: string; // sửa lại
  explanationVi: string; // giải thích tiếng Việt
}

export interface GradeResult {
  correct: boolean;
  corrected: string; // câu tiếng Trung đã sửa hoàn chỉnh
  correctedPinyin: string;
  issues: GradeIssue[];
  suggestionVi: string; // gợi ý cải thiện
}

// ── Phase 04: Bài tập động ───────────────────────────────────────────────────

export type ExerciseType = 'meaning' | 'listen' | 'fill';

/** Một từ vựng tối giản gửi cho AI (không cần toàn bộ VocabItem). */
export interface VocabBrief {
  hanzi: string;
  pinyin: string;
  vi: string;
}

export interface ExerciseRequest {
  vocab: VocabBrief[];
  topicTitle?: string; // tên bài học (ngữ cảnh)
  count: number;
}

/** Một câu bài tập AI sinh ra (map sang McqQuestion để render). */
export interface Exercise {
  type: ExerciseType;
  questionText: string; // câu hỏi (tiếng Việt)
  promptHanzi: string; // hán tự để hiện hoặc đọc
  options: string[];
  answerIndex: number;
  explanationVi?: string;
}

export interface ExerciseResponse {
  exercises: Exercise[];
}

// ── Dịch Việt ↔ Trung ────────────────────────────────────────────────────────

export type TranslateDirection = 'vi2zh' | 'zh2vi';

export interface TranslateRequest {
  direction: TranslateDirection;
  text: string;
}

/** Kết quả dịch — luôn trả bộ ba hán tự + pinyin + nghĩa Việt (đối xứng 2 chiều). */
export interface TranslateResult {
  hanzi: string; // câu tiếng Trung (kết quả nếu vi2zh, hoặc câu gốc nếu zh2vi)
  pinyin: string; // pinyin của hanzi
  vi: string; // câu tiếng Việt (kết quả nếu zh2vi, hoặc câu gốc nếu vi2zh)
  note?: string; // ghi chú ngắn (cách dùng, lưu ý)
}
