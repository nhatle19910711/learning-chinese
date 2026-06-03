/** Màu theo thanh điệu (quy ước phổ biến trong dạy tiếng Trung). */
export const TONE_COLORS: Record<number, string> = {
  1: '#d23b3b', // thanh 1 – đỏ
  2: '#e08a1e', // thanh 2 – cam
  3: '#1f9d57', // thanh 3 – lục
  4: '#2f6fd0', // thanh 4 – lam
  0: '#8b8f99', // khinh thanh – xám
};

export const TONE_LABELS: Record<number, string> = {
  1: 'Thanh 1 (cao bằng)',
  2: 'Thanh 2 (đi lên)',
  3: 'Thanh 3 (xuống lên)',
  4: 'Thanh 4 (xuống)',
  0: 'Khinh thanh',
};

export function toneColor(tone: number): string {
  return TONE_COLORS[tone] ?? 'inherit';
}
