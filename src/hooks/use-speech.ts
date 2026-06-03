import { useCallback, useEffect, useState } from 'react';

/**
 * Phát âm tiếng Trung qua Web Speech API.
 * Giọng zh-CN phụ thuộc thiết bị → expose `isSupported` để UI hiện fallback.
 */
export function useSpeech() {
  const [zhVoice, setZhVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [ready, setReady] = useState(false);

  const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;

  useEffect(() => {
    if (!synth) {
      setReady(true);
      return;
    }
    const pickVoice = () => {
      const voices = synth.getVoices();
      const zh = voices.find((v) => v.lang.toLowerCase().startsWith('zh')) ?? null;
      setZhVoice(zh);
      if (voices.length > 0) setReady(true);
    };
    pickVoice();
    // getVoices() có thể rỗng lúc đầu (load bất đồng bộ)
    synth.addEventListener('voiceschanged', pickVoice);
    return () => synth.removeEventListener('voiceschanged', pickVoice);
  }, [synth]);

  const speak = useCallback(
    (text: string, rate = 0.8) => {
      if (!synth) return;
      synth.cancel(); // dừng câu đang đọc
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN';
      u.rate = rate;
      if (zhVoice) u.voice = zhVoice;
      synth.speak(u);
    },
    [synth, zhVoice],
  );

  // Có API + đã load voices + có giọng tiếng Trung
  const isSupported = Boolean(synth) && ready && zhVoice !== null;

  return { speak, isSupported };
}
