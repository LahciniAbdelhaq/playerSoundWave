'use client';
import { Icon } from '@/components/Icon';
import { useToastStore } from '@/stores/toast';

const ICON = { success: 'music', info: 'loader', warning: 'triangle-alert', danger: 'circle-x' };

/** Renders the toast stack using the design's `.toast` component. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="toast-host" id="toastHost">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind} in`}>
          <div className="t-icon">
            <Icon name={ICON[t.kind]} size={18} />
          </div>
          <div className="t-body">
            <div className="t-title">{t.title}</div>
            {t.text && <div className="t-text">{t.text}</div>}
          </div>
          <button className="t-close" onClick={() => dismiss(t.id)}>
            <Icon name="x" size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
