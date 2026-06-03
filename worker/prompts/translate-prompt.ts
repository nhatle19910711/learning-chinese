import type { TranslateDirection } from '../../src/lib/ai-contracts';

/** System instruction cho dịch Việt ↔ Trung. */
export const TRANSLATE_SYSTEM_PROMPT = `Bạn là công cụ dịch Việt–Trung cho người Việt đang học tiếng Trung.
Trả JSON {hanzi, pinyin, vi, note}:
- "hanzi": câu/từ tiếng Trung (giản thể).
- "pinyin": pinyin có dấu thanh của hanzi.
- "vi": câu tiếng Việt tự nhiên, đúng nghĩa.
- "note": ghi chú NGẮN bằng tiếng Việt (cách dùng, lưu ý, từ đồng nghĩa) nếu hữu ích; nếu không cần thì để chuỗi rỗng.
Dịch chính xác, tự nhiên, ưu tiên cách diễn đạt thông dụng. Chỉ trả JSON, không thêm chữ nào khác.`;

/** responseSchema (định dạng Gemini, type viết HOA) ép cấu trúc TranslateResult. */
export const TRANSLATE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    hanzi: { type: 'STRING' },
    pinyin: { type: 'STRING' },
    vi: { type: 'STRING' },
    note: { type: 'STRING' },
  },
  required: ['hanzi', 'pinyin', 'vi'],
};

/** Dựng phần prompt người dùng theo chiều dịch. */
export function buildTranslateUserPrompt(direction: TranslateDirection, text: string): string {
  return direction === 'vi2zh'
    ? `Dịch câu tiếng Việt sau sang tiếng Trung: "${text}"`
    : `Dịch câu tiếng Trung sau sang tiếng Việt: "${text}"`;
}
