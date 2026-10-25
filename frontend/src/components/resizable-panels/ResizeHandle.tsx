import { Separator } from 'react-resizable-panels';

import styles from './ResizeHandle.module.css';

export default function ResizeHandle({
  className = '',
  collapsed = false,
  id,
}: {
  className?: string;
  collapsed?: boolean;
  id?: string;
}) {
  return (
    <Separator
      className={[styles.ResizeHandleOuter, className].join(' ')}
      id={id}
    >
      <div
        className={styles.ResizeHandleInner}
        data-collapsed={collapsed || undefined}
      ></div>
    </Separator>
  );
}
