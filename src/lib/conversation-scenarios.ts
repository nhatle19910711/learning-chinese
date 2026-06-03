/** Metadata kịch bản hội thoại — dùng chung client (picker) + worker (map → system prompt). */

export interface ScenarioMeta {
  id: string;
  title: string;
  icon: string;
  hint: string; // mô tả ngắn cho người học
}

export const CONVERSATION_SCENARIOS: ScenarioMeta[] = [
  { id: 'greeting', title: 'Làm quen', icon: '👋', hint: 'Chào hỏi, giới thiệu bản thân' },
  { id: 'cafe', title: 'Gọi món', icon: '☕', hint: 'Gọi đồ uống/món ăn ở quán' },
  { id: 'shopping', title: 'Mua sắm', icon: '🛍️', hint: 'Hỏi giá, mua đồ ở cửa hàng' },
  { id: 'directions', title: 'Hỏi đường', icon: '🗺️', hint: 'Hỏi và nghe chỉ đường' },
];

export function getScenarioMeta(id: string): ScenarioMeta | undefined {
  return CONVERSATION_SCENARIOS.find((s) => s.id === id);
}
