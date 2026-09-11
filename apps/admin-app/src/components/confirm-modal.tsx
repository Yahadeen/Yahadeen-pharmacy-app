'use client';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(2px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: 'var(--modal-bg)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 24,
          maxWidth: 400,
          width: '90%',
          boxShadow: 'var(--shadow)',
        }}
      >
        <h3
          style={{
            fontSize: 20,
            fontWeight: 700,
            margin: '0 0 12px',
            color: 'var(--text)',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-muted)',
            margin: '0 0 20px',
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: destructive ? '#ef4444' : 'var(--brand)',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
