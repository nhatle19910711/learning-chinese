import { CONVERSATION_SCENARIOS } from '../../lib/conversation-scenarios';

interface Props {
  onPick: (scenarioId: string) => void;
}

export function ScenarioPicker({ onPick }: Props) {
  return (
    <div className="scenario-picker">
      <header className="conv__head">
        <h1>💬 Luyện hội thoại</h1>
        <p className="text-muted">Chọn tình huống. AI sẽ đóng vai và nói chuyện với bạn bằng tiếng Trung.</p>
      </header>
      <div className="scenario-grid">
        {CONVERSATION_SCENARIOS.map((s) => (
          <button key={s.id} type="button" className="card scenario-card" onClick={() => onPick(s.id)}>
            <span className="scenario-card__icon">{s.icon}</span>
            <span className="scenario-card__title">{s.title}</span>
            <span className="text-muted scenario-card__hint">{s.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
