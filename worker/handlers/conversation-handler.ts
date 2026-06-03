import type { ChatTurn } from '../../src/lib/ai-contracts';
import type { Env, GeminiContent } from '../types';
import { errorResponse } from '../lib/http';
import { createSseStream, type SseStream } from '../lib/sse';
import { GeminiError, streamGemini } from '../lib/gemini-client';
import { HISTORY_LIMIT } from '../config';
import { CONVERSATION_OPENER, systemForScenario } from '../prompts/conversation-scenarios';

interface ConvBody {
  scenarioId?: string;
  messages?: ChatTurn[];
}

/** POST /api/conversation — luyện hội thoại roleplay, stream SSE. */
export async function handleConversation(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  let body: ConvBody;
  try {
    body = (await request.json()) as ConvBody;
  } catch {
    return errorResponse(400, 'bad_request', 'Body không hợp lệ.');
  }

  const system = body.scenarioId ? systemForScenario(body.scenarioId) : null;
  if (!system) return errorResponse(400, 'bad_request', 'Kịch bản không hợp lệ.');

  const contents = toContents(Array.isArray(body.messages) ? body.messages : []);
  // Chưa có lượt nào → mồi để AI mở đầu hội thoại.
  if (!contents.length) contents.push({ role: 'user', parts: [{ text: CONVERSATION_OPENER }] });

  const sse = createSseStream();
  ctx.waitUntil(pipeToSse(env, system, contents, sse));
  return sse.response;
}

function toContents(messages: ChatTurn[]): GeminiContent[] {
  return messages
    .filter((m) => m && typeof m.text === 'string' && m.text.trim())
    .slice(-HISTORY_LIMIT)
    .map((m) => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.text }] }));
}

async function pipeToSse(env: Env, system: string, contents: GeminiContent[], sse: SseStream): Promise<void> {
  try {
    for await (const text of streamGemini(env, {
      system,
      contents,
      generationConfig: { temperature: 0.8, maxOutputTokens: 300 },
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
