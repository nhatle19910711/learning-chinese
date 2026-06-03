/**
 * Parse JSON từ output AI một cách phòng thủ: gỡ fence ```json, lấy đoạn {…} hoặc […].
 * Trả null nếu không parse được (handler map sang lỗi bad_ai_response).
 */
export function parseAiJson<T>(raw: string): T | null {
  let s = raw.trim();
  // gỡ fence ```json … ``` hoặc ``` … ```
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }
  // cắt từ ký tự { hoặc [ đầu tiên đến } hoặc ] cuối cùng
  const firstObj = s.indexOf('{');
  const firstArr = s.indexOf('[');
  const start =
    firstArr === -1 ? firstObj : firstObj === -1 ? firstArr : Math.min(firstObj, firstArr);
  const end = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'));
  if (start >= 0 && end > start) s = s.slice(start, end + 1);

  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}
