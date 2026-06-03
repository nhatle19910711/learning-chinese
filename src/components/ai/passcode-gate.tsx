import { useState, type ReactNode } from 'react';
import { getPasscode, setPasscode } from '../../lib/ai-passcode';
import './ai.css';

interface Props {
  children: ReactNode;
}

/**
 * Bọc các tính năng AI. Nếu chưa có mật khẩu → hiện form nhập (lưu localStorage).
 * Có mật khẩu → hiển thị nội dung con.
 */
export function PasscodeGate({ children }: Props) {
  const [code, setCode] = useState<string | null>(() => getPasscode());
  const [input, setInput] = useState('');

  if (code) return <>{children}</>;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setPasscode(trimmed);
    setCode(trimmed);
  };

  return (
    <div className="passcode-gate">
      <form className="passcode-card" onSubmit={submit}>
        <h2>🔒 Cần mật khẩu AI</h2>
        <p>Tính năng AI dùng chung một mật khẩu để tránh lạm dụng. Nhập mật khẩu được cấp:</p>
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Mật khẩu"
          autoFocus
        />
        <button type="submit" disabled={!input.trim()}>
          Mở khóa
        </button>
      </form>
    </div>
  );
}
