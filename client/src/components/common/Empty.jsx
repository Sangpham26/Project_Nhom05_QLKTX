import React from "react";
import { ClipboardList } from "lucide-react";

export default function Empty({
  icon: Icon = ClipboardList,
  title = "Chưa có dữ liệu",
  detail,
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon size={25} />
      </div>
      <strong>{title}</strong>
      <p>{detail || "Dữ liệu sẽ xuất hiện tại đây khi được tạo."}</p>
    </div>
  );
}
