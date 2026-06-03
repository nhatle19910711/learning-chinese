import type { GradeRequest } from '../../src/lib/ai-contracts';

/** System instruction cho chấm & sửa câu. */
export const GRADE_SYSTEM_PROMPT = `Bạn là giáo viên tiếng Trung chấm bài cho người Việt mới học (trình độ HSK1).
Nhiệm vụ: kiểm tra câu tiếng Trung, sửa lỗi (ngữ pháp, dùng từ, trật tự từ, lượng từ), và GIẢI THÍCH bằng tiếng Việt.
- "corrected": câu tiếng Trung đúng/tự nhiên nhất (nếu câu đã đúng thì giữ nguyên).
- "correctedPinyin": pinyin có dấu thanh của câu corrected.
- "issues": mỗi lỗi gồm phần sai (original), phần sửa (correction), và giải thích NGẮN bằng tiếng Việt.
- "suggestionVi": một gợi ý ngắn bằng tiếng Việt để học tốt hơn.
- "correct": true nếu câu gốc đã đúng (không có lỗi đáng kể).
Chỉ trả JSON theo schema. Không thêm chữ nào ngoài JSON.`;

/** responseSchema (định dạng Gemini, type viết HOA) ép cấu trúc GradeResult. */
export const GRADE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    correct: { type: 'BOOLEAN' },
    corrected: { type: 'STRING' },
    correctedPinyin: { type: 'STRING' },
    issues: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          original: { type: 'STRING' },
          correction: { type: 'STRING' },
          explanationVi: { type: 'STRING' },
        },
        required: ['original', 'correction', 'explanationVi'],
      },
    },
    suggestionVi: { type: 'STRING' },
  },
  required: ['correct', 'corrected', 'correctedPinyin', 'issues', 'suggestionVi'],
};

/** Dựng phần prompt người dùng theo chế độ. */
export function buildGradeUserPrompt(req: GradeRequest): string {
  if (req.mode === 'translate') {
    return `Người học dịch câu tiếng Việt sau sang tiếng Trung.
Câu tiếng Việt gốc: "${req.prompt ?? ''}"
Bản dịch của người học: "${req.text}"
Hãy chấm bản dịch: đúng nghĩa chưa, tự nhiên chưa, có lỗi gì.`;
  }
  return `Kiểm tra và chấm câu tiếng Trung sau của người học: "${req.text}"`;
}
