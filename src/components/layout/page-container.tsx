import type { ReactNode } from 'react';
import './layout.css';

/** Container responsive: full-width trên điện thoại, giới hạn bề ngang trên laptop. */
export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="page-container">{children}</div>;
}
