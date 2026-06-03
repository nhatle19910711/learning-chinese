/** Tách lượt model dạng "ZH: …\nPINYIN: …\nVI: …" (chịu được lúc đang stream dở). */

export interface ParsedTurn {
  zh: string;
  pinyin: string;
  vi: string;
  hasFormat: boolean; // true nếu nhận ra ít nhất 1 nhãn
}

function field(raw: string, label: string): string {
  // . không khớp newline → chỉ lấy phần còn lại của dòng chứa nhãn.
  const m = raw.match(new RegExp(`${label}\\s*:\\s*(.*)`, 'i'));
  return m ? m[1].trim() : '';
}

export function parseTurn(raw: string): ParsedTurn {
  const zh = field(raw, 'ZH');
  const pinyin = field(raw, 'PINYIN');
  const vi = field(raw, 'VI');
  return { zh, pinyin, vi, hasFormat: Boolean(zh || pinyin || vi) };
}
