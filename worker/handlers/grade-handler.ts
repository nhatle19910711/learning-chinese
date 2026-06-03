import type { GradeRequest, GradeResult } from '../../src/lib/ai-contracts';
import type { Env } from '../types';
import { errorResponse, jsonResponse } from '../lib/http';
import { GeminiError, generateGeminiText } from '../lib/gemini-client';
import { parseAiJson } from '../lib/parse-json';
import { GRADE_SCHEMA, GRADE_SYSTEM_PROMPT, buildGradeUserPrompt } from '../prompts/grade-prompt';

const MAX_LEN = 200;

/** POST /api/grade — chấm & sửa câu, trả JSON GradeResult. */
export async function handleGrade(request: Request, env: Env): Promise<Response> {
  let body: GradeRequest;
  try {
    body = (await request.json()) as GradeRequest;
  } catch {
    return errorResponse(400, 'bad_request', 'Body không hợp lệ.');
  }

  const text = (body.text ?? '').trim();
  if (!text) return errorResponse(400, 'bad_request', 'Thiếu câu cần chấm.');
  if (text.length > MAX_LEN) return errorResponse(400, 'bad_request', 'Câu quá dài.');
  const mode = body.mode === 'translate' ? 'translate' : 'check';

  try {
    const raw = await generateGeminiText(env, {
      system: GRADE_SYSTEM_PROMPT,
      contents: [{ role: 'user', parts: [{ text: buildGradeUserPrompt({ ...body, mode, text }) }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 700,
        responseMimeType: 'application/json',
        responseSchema: GRADE_SCHEMA,
      },
    });
    const result = parseAiJson<GradeResult>(raw);
    if (!result || typeof result.corrected !== 'string') {
      return errorResponse(502, 'bad_ai_response', 'AI trả dữ liệu không hợp lệ.');
    }
    return jsonResponse(result);
  } catch (e) {
    if (e instanceof GeminiError) return errorResponse(e.status === 429 ? 429 : 502, e.code, 'Lỗi gọi AI.');
    return errorResponse(500, 'server', 'Lỗi máy chủ.');
  }
}
