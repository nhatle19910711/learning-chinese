import type { TranslateRequest, TranslateResult } from '../../src/lib/ai-contracts';
import type { Env } from '../types';
import { errorResponse, jsonResponse } from '../lib/http';
import { GeminiError, generateGeminiText } from '../lib/gemini-client';
import { parseAiJson } from '../lib/parse-json';
import { TRANSLATE_SCHEMA, TRANSLATE_SYSTEM_PROMPT, buildTranslateUserPrompt } from '../prompts/translate-prompt';

const MAX_LEN = 500;

/** POST /api/translate — dịch Việt ↔ Trung, trả JSON TranslateResult. */
export async function handleTranslate(request: Request, env: Env): Promise<Response> {
  let body: TranslateRequest;
  try {
    body = (await request.json()) as TranslateRequest;
  } catch {
    return errorResponse(400, 'bad_request', 'Body không hợp lệ.');
  }

  const text = (body.text ?? '').trim();
  if (!text) return errorResponse(400, 'bad_request', 'Thiếu nội dung cần dịch.');
  if (text.length > MAX_LEN) return errorResponse(400, 'bad_request', 'Văn bản quá dài.');
  const direction = body.direction === 'zh2vi' ? 'zh2vi' : 'vi2zh';

  try {
    const raw = await generateGeminiText(env, {
      system: TRANSLATE_SYSTEM_PROMPT,
      contents: [{ role: 'user', parts: [{ text: buildTranslateUserPrompt(direction, text) }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 600,
        responseMimeType: 'application/json',
        responseSchema: TRANSLATE_SCHEMA,
      },
    });
    const result = parseAiJson<TranslateResult>(raw);
    if (!result || typeof result.hanzi !== 'string' || typeof result.vi !== 'string') {
      return errorResponse(502, 'bad_ai_response', 'AI trả dữ liệu không hợp lệ.');
    }
    return jsonResponse(result);
  } catch (e) {
    if (e instanceof GeminiError) return errorResponse(e.status === 429 ? 429 : 502, e.code, 'Lỗi gọi AI.');
    return errorResponse(500, 'server', 'Lỗi máy chủ.');
  }
}
