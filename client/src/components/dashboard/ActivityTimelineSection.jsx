import React, { useState, useMemo } from "react";
import {
  RotateCw,
  CreditCard,
  ClipboardList,
  BedDouble,
  ShieldCheck,
  FileSpreadsheet,
  Clock,
} from "lucide-react";

// Vietnamese relative time helper
function formatRelativeTime(dateString) {
  if (!dateString) return "Vừa xong";
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return "Vừa xong";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
  if (diffSec < 172800) return "Hôm qua";
  return `${Math.floor(diffSec / 86400)} ngày trước`;
}

// Event type classifier
function classifyEvent(title = "", body = "") {
  const text = `${title} ${body}`.toLowerCase();
  if (text.includes("thanh toán") || text.includes("thu tiền") || text.includes("hóa đơn")) {
    return { type: "payment", icon: CreditCard, colorClass: "payment" };
  }
  if (text.includes("hồ sơ") || text.includes("duyệt") || text.includes("đăng ký")) {
    return { type: "application", icon: ClipboardList, colorClass: "application" };
  }
  if (text.includes("phòng") || text.includes("chuyển") || text.includes("giường") || text.includes("lưu trú")) {
    return { type: "room", icon: BedDouble, colorClass: "room" };
  }
  if (text.includes("đăng nhập") || text.includes("mật khẩu") || text.includes("khóa") || text.includes("quyền")) {
    return { type: "auth", icon: ShieldCheck, colorClass: "auth" };
  }
  return { type: "system", icon: Clock, colorClass: "system" };
}

export default function ActivityTimelineSection({
  logsData = [],
  isLoading = false,
  onReload,
  onOpenExport,
  dateTimeFormatter,
}) {
  const [categoryFilter, setCategoryFilter] = useState("ALL"); // ALL | payment | application | room
  const [roleFilter, setRoleFilter] = useState(""); // "" | "ADMIN" | "STAFF"

  // Filter logs
  const filteredLogs = useMemo(() => {
    return (logsData || []).filter((log) => {
      const { type } = classifyEvent(log.title, log.body);
      const matchCat = categoryFilter === "ALL" || type === categoryFilter;
      const matchRole = !roleFilter || log.actorRole === roleFilter;
      return matchCat && matchRole;
    }).slice(0, 10);
  }, [logsData, categoryFilter, roleFilter]);

  return (
    <div className="section-card" role="region" aria-label="Nhật ký hoạt động hệ thống">
      <div className="section-head">
        <div>
          <h2>Nhật ký hoạt động hệ thống</h2>
          <p>Ghi nhận toàn bộ thao tác nghiệp vụ của mọi vai trò theo thời gian thực</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Manual refresh button */}
          <button
            type="button"
            onClick={onReload}
            title="Tải lại nhật ký ngay lập tức"
            aria-label="Tải lại nhật ký"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#475569",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <RotateCw size={14} style={{ animation: isLoading ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="timeline-toolbar">
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "payment", label: "Thanh toán" },
            { id: "application", label: "Hồ sơ" },
            { id: "room", label: "Phòng ở" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`trans-filter-pill ${categoryFilter === cat.id ? "active" : ""}`}
              onClick={() => setCategoryFilter(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <select
          className="dash-filter-select"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Lọc theo vai trò thực hiện"
        >
          <option value="">Tất cả người thực hiện</option>
          <option value="ADMIN">Quản trị viên (Admin)</option>
          <option value="STAFF">Nhân viên KTX</option>
        </select>
      </div>

      {/* Timeline items */}
      <div className="timeline-container" style={{ maxHeight: "330px", overflowY: "auto", paddingRight: "4px" }}>
        {filteredLogs.length === 0 ? (
          <div className="dash-empty-state">
            <div className="dash-empty-icon" style={{ background: "#f1f5f9", color: "#64748b" }}>
              <Clock size={24} />
            </div>
            <strong className="dash-empty-title">Không có hoạt động nào</strong>
            <p className="dash-empty-desc">Chưa có sự kiện nào tương ứng với bộ lọc được chọn.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const { icon: EventIcon, colorClass } = classifyEvent(log.title, log.body);
            const exactTime = dateTimeFormatter(log.time || log.createdAt);
            const relTime = formatRelativeTime(log.time || log.createdAt);

            return (
              <div key={log.id} className="timeline-item">
                <div className={`timeline-node-icon ${colorClass}`} aria-hidden="true">
                  <EventIcon size={16} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px" }}>
                    <strong style={{ fontSize: "13px", color: "#0f172a" }}>{log.title}</strong>
                    <span
                      style={{ fontSize: "11px", color: "#64748b", whiteSpace: "nowrap" }}
                      title={`Thời gian chính xác: ${exactTime}`}
                    >
                      {relTime}
                    </span>
                  </div>

                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#475569", lineHeight: 1.4 }}>
                    {log.body}
                  </p>

                  <div style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 600,
                        padding: "1px 6px",
                        borderRadius: "4px",
                        background: log.actorRole === "ADMIN" ? "#fef2f2" : "#eff6ff",
                        color: log.actorRole === "ADMIN" ? "#dc2626" : "#2563eb",
                      }}
                    >
                      {log.actorRole === "ADMIN" ? "Quản trị viên" : "Nhân viên"}
                    </span>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>{exactTime}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer & Excel Export (màu xanh lá) */}
      <div
        style={{
          marginTop: "12px",
          paddingTop: "12px",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <span style={{ fontSize: "12px", color: "#64748b" }}>
          Đang hiển thị <strong>{filteredLogs.length}</strong> nhật ký gần nhất
        </span>

        {onOpenExport && (
          <button
            type="button"
            className="button button-outline button-sm"
            onClick={onOpenExport}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12.5px",
              fontWeight: 600,
              padding: "5px 12px",
              borderRadius: "8px",
              color: "#16a34a",
              borderColor: "#86efac",
              background: "#ecfdf5",
            }}
          >
            <FileSpreadsheet size={14} color="#16a34a" />
            Xuất nhật ký Excel
          </button>
        )}
      </div>
    </div>
  );
}
