/** Lưu/đọc mật khẩu AI ở localStorage. Gửi kèm mọi request /api/*. */

const KEY = 'lc-ai-passcode';

export function getPasscode(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setPasscode(code: string): void {
  try {
    localStorage.setItem(KEY, code);
  } catch {
    /* private mode / đầy bộ nhớ → bỏ qua */
  }
}

export function clearPasscode(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* bỏ qua */
  }
}
