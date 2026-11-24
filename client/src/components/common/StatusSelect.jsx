import React from "react";
import { labels } from "../../services/api";

export default function StatusSelect({ value, onChange }) {
  return (
    <select
      className="small-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Tất cả trạng thái</option>
      {[
        "PENDING",
        "REVIEWING",
        "NEEDS_INFO",
        "APPROVED",
        "REJECTED",
        "ACTIVE",
        "ENDED",
        "UNPAID",
        "PARTIAL",
        "PAID",
      ].map((x) => (
        <option key={x} value={x}>
          {labels[x]}
        </option>
      ))}
    </select>
  );
}
