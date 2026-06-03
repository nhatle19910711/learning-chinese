import type { AiErrorCode } from '../../lib/ai-contracts';
import './ai.css';

/** Map mã lỗi → thông báo tiếng Việt thân thiện. */
const MESSAGES: Record<AiErrorCode, string> = {
  unauthorized: 'Sai mật khẩu AI. Hãy kiểm tra lại.',
  rate_limited: 'Bạn thao tác hơi nhanh. Thử lại sau giây lát.',
  quota_exceeded: 'Gọi AI quá nhanh (giới hạn miễn phí ~20 lượt/phút). Đợi ~30 giây rồi thử lại.',
  bad_request: 'Yêu cầu không hợp lệ.',
  bad_ai_response: 'AI trả về dữ liệu không đọc được. Thử lại nhé.',
  network: 'Mất kết nối mạng. Kiểm tra Internet rồi thử lại.',
  server: 'Có lỗi máy chủ. Thử lại sau.',
};

interface Props {
  code: AiErrorCode | null;
  onRetry?: () => void;
}

export function AiErrorBanner({ code, onRetry }: Props) {
  if (!code) return null;
  // Sai mật khẩu → mật khẩu đã bị xóa; cho người dùng nhập lại bằng cách tải lại.
  if (code === 'unauthorized') {
    return (
      <div className="ai-error-banner" role="alert">
        <span>{MESSAGES.unauthorized}</span>
        <button type="button" onClick={() => window.location.reload()}>
          Nhập lại mật khẩu
        </button>
      </div>
    );
  }
  return (
    <div className="ai-error-banner" role="alert">
      <span>{MESSAGES[code]}</span>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Thử lại
        </button>
      )}
    </div>
  );
}
