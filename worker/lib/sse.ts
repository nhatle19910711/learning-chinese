/** Tiện ích tạo response SSE (text/event-stream) từ Worker. */

export interface SseStream {
  response: Response;
  writeData(obj: unknown): Promise<void>;
  writeEvent(event: string, obj: unknown): Promise<void>;
  close(): Promise<void>;
}

export function createSseStream(): SseStream {
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const response = new Response(readable, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    },
  });

  return {
    response,
    async writeData(obj) {
      await writer.write(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
    },
    async writeEvent(event, obj) {
      await writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(obj)}\n\n`));
    },
    async close() {
      await writer.close();
    },
  };
}
