import type { ChatTurn } from '../../src/lib/ai-contracts';
import type { Env, GeminiContent } from '../types';
import { errorResponse } from '../lib/http';
import { createSseStream, type SseStream } from '../lib/sse';
import { GeminiError, streamGemini } from '../lib/gemini-client';
import { HISTORY_LIMIT, MAX_OUTPUT_TOKENS } from '../config';
import { TUTOR_SYSTEM_PROMPT } from '../prompts/tutor-system-prompt';

interface ChatBody {
  messages?: ChatTurn[];
  systemContext?: string; // ngữ cảnh thêm (vd "đang học Bài 1")
}

/** POST /api/chat — gia sư chat, stream SSE. */
export async function handleChat(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return errorResponse(400, 'bad_request', 'Body không hợp lệ.');
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const contents = toContents(messages);
  if (!contents.length) return errorResponse(400, 'bad_request', 'Thiếu nội dung tin nhắn.');

  const system = body.systemContext
    ? `${TUTOR_SYSTEM_PROMPT}\n\nNgữ cảnh hiện tại: ${body.systemContext}`
    : TUTOR_SYSTEM_PROMPT;

  const sse = createSseStream();
  ctx.waitUntil(pipeToSse(env, system, contents, sse));
  return sse.response;
}

/** Map ChatTurn[] → GeminiContent[], cắt còn HISTORY_LIMIT lượt gần nhất. */
function toContents(messages: ChatTurn[]): GeminiContent[] {
  return messages
    .filter((m) => m && typeof m.text === 'string' && m.text.trim())
    .slice(-HISTORY_LIMIT)
    .map((m) => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.text }] }));
}

/** Stream Gemini → ghi SSE; bắt lỗi → event 'error'. */
async function pipeToSse(env: Env, system: string, contents: GeminiContent[], sse: SseStream): Promise<void> {
  try {
    for await (const text of streamGemini(env, {
      system,
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: MAX_OUTPUT_TOKENS },
    })) {
      await sse.writeData({ text });
    }
    await sse.writeEvent('done', { ok: true });
  } catch (e) {
    const code = e instanceof GeminiError ? e.code : 'server';
    await sse.writeEvent('error', { code, error: 'Lỗi gọi AI.' });
  } finally {
    await sse.close();
  }
}
