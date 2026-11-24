import React from "react";
import { labels } from "../services/api";

/**
 * Hiển thị huy hiệu (Badge) trạng thái kèm màu sắc tương ứng
 */
export const badge = (value) => (
  <span
    className={`badge badge-${String(value || "").toLowerCase()}`}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      margin: 0,
    }}
  >
    {labels[value] || value || "—"}
  </span>
);

/**
 * Hiển thị text xám mờ hoặc dấu gạch ngang nếu rỗng
 */
export const Text = ({ children }) => <span className="muted">{children || "—"}</span>;

/**
 * Danh sách tùy chọn thời hạn lưu trú (1, 3, 6, 12 tháng)
 */
export const durationOptions = [1, 3, 6, 12].map((months) => ({
  value: String(months),
  label: `${months} tháng`,
}));

/**
 * Tính ngày kết thúc sau N tháng tính từ ngày bắt đầu
 */
export function endAfterMonths(startDate, months) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate || "") ||
    ![1, 3, 6, 12].includes(Number(months))
  )
    return "";
  const start = new Date(`${startDate}T00:00:00Z`);
  if (
    Number.isNaN(start.getTime()) ||
    start.toISOString().slice(0, 10) !== startDate
  )
    return "";
  const target = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + Number(months), 1),
  );
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(start.getUTCDate(), lastDay));
  return target.toISOString().slice(0, 10);
}

/**
 * Định dạng khoảng thời gian lưu trú trong kỳ (DD/MM - DD/MM)
 */
export function formatStayPeriod(snap) {
  if (!snap?.stayStartInPeriod || !snap?.stayEndInPeriod) return "";
  const sParts = String(snap.stayStartInPeriod).split("-");
  const eParts = String(snap.stayEndInPeriod).split("-");
  if (sParts.length === 3 && eParts.length === 3) {
    return `${sParts[2]}/${sParts[1]} - ${eParts[2]}/${eParts[1]}`;
  }
  return "";
}
