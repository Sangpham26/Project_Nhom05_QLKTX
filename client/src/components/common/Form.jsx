import React, { useState } from "react";
import { Trash2, ArrowRight } from "lucide-react";
import Field from "./Field";

export default function Form({
  fields,
  initial = {},
  onSave,
  onCancel,
  submit = "Lưu thông tin",
  children,
  resetOnChange = {},
  className = "",
  onDelete,
  deleteLabel = "Xóa",
}) {
  const [values, setValues] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const change = (e) => {
    const { name, value } = e.target;
    setValues((previous) => {
      const next = { ...previous, [name]: value };
      for (const field of resetOnChange[name] || []) next[field] = "";
      return next;
    });
  };
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave(values);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={save} className={className}>
      <div className="form-grid">
        {(typeof fields === "function" ? fields(values) : fields).map((f) => (
          <Field key={f.name} {...f} value={values[f.name]} onChange={change} />
        ))}
      </div>
      {typeof children === "function" ? children(values) : children}
      {error && <div className="inline-error">{error}</div>}
      <div
        className="modal-actions"
        style={
          onDelete
            ? {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }
            : undefined
        }
      >
        {onDelete && (
          <button
            type="button"
            className="button button-danger"
            style={{
              background: "#fff1f2",
              color: "#dc2626",
              borderColor: "#fecdd3",
              marginRight: "auto",
            }}
            onClick={onDelete}
          >
            <Trash2 size={16} />
            {deleteLabel}
          </button>
        )}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginLeft: onDelete ? "auto" : undefined,
          }}
        >
          <button
            type="button"
            className="button button-ghost"
            onClick={onCancel}
          >
            Hủy
          </button>
          <button className="button button-primary" disabled={busy}>
            {busy ? "Đang lưu..." : submit}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </form>
  );
}
