import React from "react";
import Modal from "./Modal";

export default function Confirm({ title, detail, onConfirm, onClose, busy }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="confirm-detail">{detail}</p>
      <div className="modal-actions">
        <button className="button button-ghost" onClick={onClose}>
          Hủy
        </button>
        <button
          className="button button-primary"
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? "Đang xử lý..." : "Xác nhận"}
        </button>
      </div>
    </Modal>
  );
}
