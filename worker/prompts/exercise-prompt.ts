import type { VocabBrief } from '../../src/lib/ai-contracts';

/** System instruction cho sinh bài tập trắc nghiệm. */
export const EXERCISE_SYSTEM_PROMPT = `Bạn là giáo viên tiếng Trung tạo bài tập trắc nghiệm cho người Việt mới học (HSK1).
Chỉ dùng các từ vựng được cung cấp (không thêm từ ngoài danh sách).
Mỗi câu hỏi:
- "type": "meaning" (nhìn hán tự chọn nghĩa tiếng Việt), "listen" (nghe hán tự chọn chữ đúng), hoặc "fill" (chọn từ điền vào câu).
- "questionText": câu hỏi bằng tiếng Việt.
- "promptHanzi": hán tự để hiển thị/đọc (với "fill" là câu có chỗ trống ___).
- "options": 3-4 lựa chọn; với "meaning" là nghĩa tiếng Việt, với "listen"/"fill" là hán tự.
- "answerIndex": chỉ số (0-based) của đáp án đúng trong options.
- "explanationVi": giải thích ngắn bằng tiếng Việt.
Đáp án đúng PHẢI nằm trong options. Các lựa chọn không trùng nhau.
Chỉ trả JSON theo schema, không thêm chữ nào khác.`;

export const EXERCISE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    exercises: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          type: { type: 'STRING', enum: ['meaning', 'listen', 'fill'] },
          questionText: { type: 'STRING' },
          promptHanzi: { type: 'STRING' },
          options: { type: 'ARRAY', items: { type: 'STRING' } },
          answerIndex: { type: 'INTEGER' },
          explanationVi: { type: 'STRING' },
        },
        required: ['type', 'questionText', 'promptHanzi', 'options', 'answerIndex'],
      },
    },
  },
  required: ['exercises'],
};

/** Dựng prompt người dùng từ danh sách từ vựng. */
export function buildExerciseUserPrompt(vocab: VocabBrief[], count: number, topicTitle?: string): string {
  const list = vocab.map((v) => `${v.hanzi} (${v.pinyin}) = ${v.vi}`).join('\n');
  const ctx = topicTitle ? ` cho chủ đề "${topicTitle}"` : '';
  return `Tạo đúng ${count} câu bài tập trắc nghiệm${ctx} từ các từ vựng sau:\n${list}`;
}
