import { useEffect } from "react";
import "./Toast.css";

export function Toast({ toast }) {
  if (!toast) return null;
  const icons = { success: "✓", error: "✕", info: "ℹ", warning: "⚠" };
  return (
    <div className={`toast toast-${toast.type}`}>
      <span className="toast-icon">{icons[toast.type] || "ℹ"}</span>
      <span>{toast.message}</span>
    </div>
  );
}

export function Modal({ title, onClose, children, footer }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({ message, onConfirm, onCancel, confirmText = "Подтвердить", danger }) {
  return (
    <Modal title="Подтверждение" onClose={onCancel} footer={
      <>
        <button className="btn btn-ghost" onClick={onCancel}>Отмена</button>
        <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm}>
          {confirmText}
        </button>
      </>
    }>
      <p style={{ color: "var(--muted2)", fontSize: 14, lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}