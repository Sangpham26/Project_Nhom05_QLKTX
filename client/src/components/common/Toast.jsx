import React from "react";
import { X, CheckCircle2 } from "lucide-react";

export default function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className={`toast ${message.type}`}>
      <span>
        {message.type === "error" ? (
          <X size={18} />
        ) : (
          <CheckCircle2 size={18} />
        )}
      </span>
      {message.text}
      <button onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
}
