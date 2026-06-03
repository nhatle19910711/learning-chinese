import type { Exercise, ExerciseRequest, ExerciseResponse } from '../../src/lib/ai-contracts';
import type { Env } from '../types';
import { errorResponse, jsonResponse } from '../lib/http';
import { GeminiError, generateGeminiText } from '../lib/gemini-client';
import { parseAiJson } from '../lib/parse-json';
import { EXERCISE_SCHEMA, EXERCISE_SYSTEM_PROMPT, buildExerciseUserPrompt } from '../prompts/exercise-prompt';

const MAX_COUNT = 10;

/** POST /api/exercise — sinh bài tập trắc nghiệm, trả JSON ExerciseResponse. */
export async function handleExercise(request: Request, env: Env): Promise<Response> {
  let body: ExerciseRequest;
  try {
    body = (await request.json()) as ExerciseRequest;
  } catch {
    return errorResponse(400, 'bad_request', 'Body không hợp lệ.');
  }

  const vocab = Array.isArray(body.vocab) ? body.vocab.filter((v) => v && v.hanzi) : [];
  if (!vocab.length) return errorResponse(400, 'bad_request', 'Thiếu danh sách từ vựng.');
  const count = Math.min(Math.max(1, Number(body.count) || 5), MAX_COUNT);

  try {
    const raw = await generateGeminiText(env, {
      system: EXERCISE_SYSTEM_PROMPT,
      contents: [
        { role: 'user', parts: [{ text: buildExerciseUserPrompt(vocab, count, body.topicTitle) }] },
      ],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 1400,
        responseMimeType: 'application/json',
        responseSchema: EXERCISE_SCHEMA,
      },
    });
    const parsed = parseAiJson<ExerciseResponse>(raw);
    const exercises = (parsed?.exercises ?? []).filter(isValidExercise);
    if (!exercises.length) return errorResponse(502, 'bad_ai_response', 'AI không tạo được bài tập hợp lệ.');
    return jsonResponse({ exercises });
  } catch (e) {
    if (e instanceof GeminiError) return errorResponse(e.status === 429 ? 429 : 502, e.code, 'Lỗi gọi AI.');
    return errorResponse(500, 'server', 'Lỗi máy chủ.');
  }
}

/** Lọc câu hỏi hợp lệ: đủ option, đáp án nằm trong tầm, options không rỗng. */
function isValidExercise(ex: Exercise): boolean {
  return (
    !!ex &&
    Array.isArray(ex.options) &&
    ex.options.length >= 2 &&
    ex.options.every((o) => typeof o === 'string' && o.trim()) &&
    Number.isInteger(ex.answerIndex) &&
    ex.answerIndex >= 0 &&
    ex.answerIndex < ex.options.length &&
    typeof ex.promptHanzi === 'string' &&
    typeof ex.questionText === 'string'
  );
}
