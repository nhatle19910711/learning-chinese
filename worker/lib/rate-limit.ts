import { RATE_LIMIT } from '../config';

interface Bucket {
  tokens: number;
  ts: number; // ms của lần cập nhật cuối
}

// Best-effort, per-isolate (không phân tán giữa các edge). Đủ cho quy mô 1-2 người.
const buckets = new Map<string, Bucket>();

/** Token bucket: trả false nếu vượt giới hạn. */
export function allow(ip: string, nowMs: number): boolean {
  const { capacity, refillPerSec } = RATE_LIMIT;
  const b = buckets.get(ip) ?? { tokens: capacity, ts: nowMs };
  const elapsedSec = Math.max(0, (nowMs - b.ts) / 1000);
  b.tokens = Math.min(capacity, b.tokens + elapsedSec * refillPerSec);
  b.ts = nowMs;
  if (b.tokens < 1) {
    buckets.set(ip, b);
    return false;
  }
  b.tokens -= 1;
  buckets.set(ip, b);
  return true;
}
