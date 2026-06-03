import { useSpeech } from '../../hooks/use-speech';
import { parseTurn } from '../../lib/conversation-turn-parser';
import type { ConvTurn } from '../../hooks/use-conversation';

interface Props {
  turn: ConvTurn;
}

export function DialogueTurn({ turn }: Props) {
  const { speak, isSupported } = useSpeech();

  if (turn.role === 'user') {
    return (
      <div className="dlg dlg--user">
        <div className="dlg__bubble">{turn.text}</div>
      </div>
    );
  }

  const parsed = parseTurn(turn.text);

  return (
    <div className="dlg dlg--model">
      <div className="dlg__bubble">
        {parsed.hasFormat ? (
          <>
            <p className="dlg__zh">
              {parsed.zh || '…'}
              {parsed.zh && isSupported && (
                <button type="button" onClick={() => speak(parsed.zh)} title="Nghe">
                  🔊
                </button>
              )}
            </p>
            {parsed.pinyin && <p className="dlg__pinyin">{parsed.pinyin}</p>}
            {parsed.vi && <p className="dlg__vi">{parsed.vi}</p>}
          </>
        ) : (
          <p className="dlg__zh">{turn.text || '…'}</p>
        )}
      </div>
    </div>
  );
}
