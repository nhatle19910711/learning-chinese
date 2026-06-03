import { useRef } from 'react';
import { useProgress } from '../../progress/progress-context';
import { exportProgressJson, importProgressJson } from '../../lib/progress-store';
import './progress-tools.css';

/** Sao lưu / khôi phục / xóa tiến độ. localStorage có thể mất khi xóa cache trình duyệt. */
export function ProgressTools() {
  const { state, importProgress, resetProgress } = useProgress();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const blob = new Blob([exportProgressJson(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tien-do-hoc-tieng-trung.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file
      .text()
      .then((text) => importProgress(importProgressJson(text)))
      .catch(() => alert('Tệp không hợp lệ.'));
    e.target.value = '';
  };

  const handleReset = () => {
    if (window.confirm('Xóa toàn bộ tiến độ học? Không thể hoàn tác.')) resetProgress();
  };

  return (
    <section className="progress-tools">
      <h2 className="progress-tools__title text-muted">Quản lý tiến độ</h2>
      <div className="progress-tools__actions">
        <button type="button" className="btn" onClick={handleExport}>
          ⬇️ Sao lưu
        </button>
        <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
          ⬆️ Khôi phục
        </button>
        <button type="button" className="btn progress-tools__reset" onClick={handleReset}>
          🗑️ Xóa tiến độ
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          onChange={handleImportFile}
          hidden
        />
      </div>
    </section>
  );
}
