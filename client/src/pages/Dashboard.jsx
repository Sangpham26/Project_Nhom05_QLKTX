import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FileSpreadsheet,
  AlertCircle,
  AlertTriangle,
  Clock,
  BedDouble,
  ClipboardList,
  Wallet,
  ArrowRight,
  Bell,
  Building2,
  Users,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useAuth } from "../context/AuthContext";
import { useNotice, useLoad } from "../hooks/useLoad";
import { api, date, dateTime, money, labels } from "../services/api";
import { badge, calcOverduePenaltyRate } from "../utils/formatters";
import { StayRequestModal } from "./RequestsPage";
import PendingQueueSection from "../components/dashboard/PendingQueueSection.jsx";
import ActivityTimelineSection from "../components/dashboard/ActivityTimelineSection.jsx";
import {
  Modal,
  Metric,
  Section,
  Empty,
  Table,
  Toast,
} from "../components/common";

function ExportLogsModal({ onClose }) {
  const [mode, setMode] = useState("day"); // 'day' | 'week' | 'month' | 'all'
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const thisMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const [selectedDay, setSelectedDay] = useState(todayStr);
  const [selectedMonth, setSelectedMonth] = useState(thisMonthStr);
  const [exporting, setExporting] = useState(false);
  const [previewCount, setPreviewCount] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState("");

  const getRange = () => {
    let from = null;
    let to = null;
    let label = "";

    if (mode === "day") {
      from = new Date(`${selectedDay}T00:00:00`).toISOString();
      to = new Date(`${selectedDay}T23:59:59.999`).toISOString();
      label = `Ngày ${selectedDay}`;
    } else if (mode === "week") {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      from = sevenDaysAgo.toISOString();
      to = now.toISOString();
      label = `7 ngày gần nhất`;
    } else if (mode === "month") {
      const [year, month] = selectedMonth.split("-").map(Number);
      from = new Date(year, month - 1, 1).toISOString();
      to = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
      label = `Tháng ${selectedMonth}`;
    } else {
      label = `Toàn bộ thời gian`;
    }

    return { from, to, label };
  };

  useEffect(() => {
    let alive = true;
    setPreviewLoading(true);
    const { from, to } = getRange();
    const query = new URLSearchParams({ all: "true" });
    if (from) query.set("from", from);
    if (to) query.set("to", to);

    api(`/activity-logs?${query.toString()}`)
      .then((res) => {
        if (!alive) return;
        setPreviewCount(res.items?.length || 0);
        setPreviewLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setPreviewLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [mode, selectedDay, selectedMonth]);

  const handleExport = async () => {
    setExporting(true);
    setError("");
    try {
      const { from, to } = getRange();
      const query = new URLSearchParams({ all: "true" });
      if (from) query.set("from", from);
      if (to) query.set("to", to);

      const res = await api(`/activity-logs?${query.toString()}`);
      const logs = res.items || [];

      if (!logs.length) {
        setError(
          "Không có nhật ký nào trong khoảng thời gian đã chọn để xuất.",
        );
        setExporting(false);
        return;
      }

      const rows = logs.map((log, idx) => ({
        STT: idx + 1,
        "Thời gian":
          log.time || log.createdAt
            ? new Date(log.time || log.createdAt).toLocaleString("vi-VN")
            : "",
        "Hành động": log.action || "",
        "Tiêu đề": log.title || "",
        "Nội dung chi tiết": log.body || "",
        "Đối tượng": log.target || "",
        "Người thực hiện": log.actorName || "",
        "Vai trò":
          log.actorRole === "ADMIN"
            ? "Ban Giám đốc / QL Hệ thống"
            : log.actorRole === "STAFF"
              ? "Cán bộ Vận hành"
              : "Sinh viên",
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 20 },
        { wch: 28 },
        { wch: 40 },
        { wch: 55 },
        { wch: 20 },
        { wch: 25 },
        { wch: 24 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "NhatKyHoatDong");

      const fileSuffix =
        mode === "day"
          ? `Ngay_${selectedDay}`
          : mode === "week"
            ? `Tuan_7NgayGanNhat`
            : mode === "month"
              ? `Thang_${selectedMonth}`
              : "ToanBo";

      XLSX.writeFile(workbook, `NhatKyHeThong_${fileSuffix}.xlsx`);
      onClose();
    } catch (err) {
      setError(err.message || "Lỗi khi xuất file Excel.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal title="Xuất nhật ký hoạt động hệ thống" onClose={onClose}>
      <div style={{ display: "grid", gap: "18px" }}>
        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: "3px",
              color: "#b91c1c",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "13.5px",
              fontWeight: 700,
              color: "#1e293b",
            }}
          >
            Chọn khoảng thời gian xuất nhật ký:
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
              gap: "8px",
            }}
          >
            {[
              { id: "day", label: "Theo ngày" },
              { id: "week", label: "Theo tuần" },
              { id: "month", label: "Theo tháng" },
              { id: "all", label: "Toàn bộ" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setMode(t.id)}
                style={{
                  padding: "9px 12px",
                  borderRadius: "3px",
                  border:
                    mode === t.id ? "1.5px solid #ac482d" : "1px solid #d5d2c6",
                  background: mode === t.id ? "#fbf6f3" : "#ffffff",
                  color: mode === t.id ? "#ac482d" : "#475569",
                  fontWeight: mode === t.id ? 700 : 500,
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {mode === "day" && (
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#334155",
              }}
            >
              Chọn ngày cần xuất:
            </label>
            <input
              type="date"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              style={{
                width: "100%",
                minHeight: "40px",
                padding: "8px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: "3px",
                fontSize: "14px",
                color: "#1e293b",
                background: "#ffffff",
              }}
            />
          </div>
        )}

        {mode === "month" && (
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#334155",
              }}
            >
              Chọn tháng cần xuất:
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                width: "100%",
                minHeight: "40px",
                padding: "8px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: "3px",
                fontSize: "14px",
                color: "#1e293b",
                background: "#ffffff",
              }}
            />
          </div>
        )}

        {mode === "week" && (
          <div
            style={{
              padding: "10px 14px",
              background: "#f8fafc",
              borderRadius: "3px",
              border: "1px solid #e2e8f0",
              fontSize: "13px",
              color: "#475569",
            }}
          >
            Phạm vi: <strong>7 ngày gần nhất</strong> tính đến thời điểm hiện
            tại.
          </div>
        )}

        {mode === "all" && (
          <div
            style={{
              padding: "10px 14px",
              background: "#f8fafc",
              borderRadius: "3px",
              border: "1px solid #e2e8f0",
              fontSize: "13px",
              color: "#475569",
            }}
          >
            Phạm vi: <strong>Toàn bộ dữ liệu nhật ký</strong> lưu trong hệ
            thống.
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "3px",
            fontSize: "13.5px",
          }}
        >
          <span style={{ color: "#166534", fontWeight: 500 }}>
            Số lượng bản ghi thỏa mãn:
          </span>
          <strong style={{ fontSize: "15px", color: "#15803d" }}>
            {previewLoading ? "Đang đếm..." : `${previewCount ?? 0} nhật ký`}
          </strong>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "8px",
          }}
        >
          <button
            type="button"
            className="button button-outline"
            onClick={onClose}
            disabled={exporting}
          >
            Đóng
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={handleExport}
            disabled={exporting || previewLoading || previewCount === 0}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#0284c7",
              borderColor: "#0284c7",
            }}
          >
            <FileSpreadsheet size={16} />
            {exporting ? "Đang xuất Excel..." : "Xuất file Excel (.xlsx)"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Dashboard() {
  const { session } = useAuth();
  const role = session.user.role;
  const navigate = useNavigate();
  const [message, notice, clear] = useNotice();
  const [exportOpen, setExportOpen] = useState(false);
  const [stayModal, setStayModal] = useState(null);
  const catalog = useLoad("/catalog");
  const apps = useLoad("/applications?limit=20"),
    stays = useLoad("/stays?limit=10"),
    invoices = useLoad("/invoices?limit=100"),
    report = useLoad(role === "STUDENT" ? "/catalog" : "/report", []),
    requests = useLoad("/requests?limit=20"),
    logs = useLoad("/activity-logs?limit=30");
  const n = useLoad("/notifications?limit=15");
  useEffect(() => {
    const refresh = () => {
      apps.load();
      stays.load();
      invoices.load();
      report.load();
      requests.load();
      logs.load();
      n.load();
    };
    window.addEventListener("work-queue-changed", refresh);
    window.addEventListener("inbox-changed", refresh);
    return () => {
      window.removeEventListener("work-queue-changed", refresh);
      window.removeEventListener("inbox-changed", refresh);
    };
  }, [role]);

  // Thao tác duyệt / từ chối nhanh yêu cầu lưu trú từ Dashboard
  const handleApproveRequest = async (req) => {
    try {
      await api(`/requests/${req.id}/decision`, {
        method: "POST",
        body: {
          status: "APPROVED",
          note: "Duyệt nhanh từ bảng điều khiển Dashboard",
        },
      });
      notice(`Đã duyệt yêu cầu của sinh viên ${req.student?.fullName || ""}`);
      requests.load();
      logs.load();
    } catch (err) {
      notice(err.message, "error");
    }
  };

  const handleRejectRequest = async (req) => {
    try {
      await api(`/requests/${req.id}/decision`, {
        method: "POST",
        body: {
          status: "REJECTED",
          note: "Từ chối từ bảng điều khiển Dashboard",
        },
      });
      notice(`Đã từ chối yêu cầu của sinh viên ${req.student?.fullName || ""}`);
      requests.load();
      logs.load();
    } catch (err) {
      notice(err.message, "error");
    }
  };

  const handleApproveApp = (app) => {
    navigate(`/applications/${app.id}`);
  };

  const handleRejectApp = (app) => {
    navigate(`/applications/${app.id}`);
  };

  // Trích xuất 20 giao dịch thanh toán gần nhất
  const recentPayments = (invoices.data?.items || [])
    .flatMap((inv) =>
      (inv.payments || []).map((p) => {
        const sCode = inv.student?.studentCode || inv.student?.code || "—";
        const sName = inv.student?.fullName || "Sinh viên";
        const rCode = inv.room?.code || "—";
        const pMonth = inv.period?.month || "—";
        const pDate =
          p.createdAt ||
          (p.date
            ? p.date.length === 10
              ? p.date + "T10:30:00Z"
              : p.date
            : "");

        return {
          ...p,
          paymentDate: pDate,
          createdAt: pDate,
          studentName: sName,
          studentCode: sCode,
          roomCode: rCode,
          periodMonth: pMonth,
          invoiceId: inv.id,
        };
      }),
    )
    .sort((a, b) => new Date(b.paymentDate || 0) - new Date(a.paymentDate || 0))
    .slice(0, 20);

  const pendingApps = (apps.data?.items || [])
    .filter((x) => ["PENDING", "REVIEWING", "NEEDS_INFO"].includes(x.status))
    .slice(0, 10);
  const pendingRequests = (requests.data?.items || [])
    .filter((x) => x.status === "PENDING")
    .slice(0, 10);
  const activityLogs = (logs.data?.items || [])
    .slice()
    .sort(
      (a, b) =>
        new Date(b.time || b.createdAt || 0) -
        new Date(a.time || a.createdAt || 0),
    )
    .slice(0, 25);

  const active = stays.data?.items?.find((x) => x.status === "ACTIVE"),
    due =
      invoices.data?.items
        ?.filter((x) => x.balance > 0)
        .reduce((a, x) => a + x.balance, 0) || 0;

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const plannedEnd = active?.plannedEndDate;
  const stayDiffDays = useMemo(() => {
    if (!plannedEnd) return null;
    const dPlanned = new Date(`${plannedEnd}T00:00:00Z`);
    const dToday = new Date(`${todayStr}T00:00:00Z`);
    return Math.round((dPlanned - dToday) / 86400000);
  }, [plannedEnd, todayStr]);
  const isStayOverdue = stayDiffDays !== null && stayDiffDays < 0;
  const stayOverdueDays = isStayOverdue ? Math.abs(stayDiffDays) : 0;
  const stayPenaltyRate =
    active?.penaltyRate ||
    calcOverduePenaltyRate(
      active?.monthlyRoomFee || active?.room?.roomType?.fee,
    );

  return (
    <>
      {role === "STUDENT" ? (
        <>
          {/* Cảnh báo hạn chu kỳ lưu trú (10 ngày báo trước, 3 ngày chữ đỏ, quá hạn màu #222222 và icon đỏ) */}
          {active && active.actualEndDate ? (
            <div
              className="stay-deadline-alert"
              style={{
                background: "#f8fafc",
                border: "1px solid #cbd5e1",
              }}
            >
              <div className="stay-alert-content">
                <div
                  className="stay-alert-icon"
                  style={{
                    background: "#e2e8f0",
                    color: "#334155",
                    border: "1px solid #cbd5e1",
                  }}
                >
                  <Clock size={24} color="#334155" />
                </div>
                <div>
                  <div className="stay-alert-title" style={{ color: "#0f172a" }}>
                    ĐÃ DUYỆT TRẢ PHÒNG CUỐI CHU KỲ
                  </div>
                  <p className="stay-alert-desc" style={{ color: "#475569" }}>
                    Yêu cầu trả phòng đã được phê duyệt. Bạn tiếp tục lưu trú tại
                    phòng <strong>{active.room?.code}</strong> đến hết ngày{" "}
                    <strong>{date(active.actualEndDate)}</strong>.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            active &&
            stayDiffDays !== null &&
            stayDiffDays <= 10 &&
            (isStayOverdue ? (
              <div className="stay-deadline-alert stay-alert-dark">
                <div className="stay-alert-content">
                  <div className="stay-alert-icon">
                    <AlertCircle size={24} color="#dc2626" />
                  </div>
                  <div>
                    <div className="stay-alert-title">
                      ĐANG BỊ QUÁ HẠN LƯU TRÚ {stayOverdueDays} NGÀY!
                    </div>
                    <p className="stay-alert-desc">
                      Chu kỳ lưu trú phòng <strong>{active.room?.code}</strong>{" "}
                      đã hết hạn từ ngày <strong>{date(plannedEnd)}</strong>. Hệ
                      thống đang tính phí phạt trễ hạn{" "}
                      <strong>{money(stayPenaltyRate)}/ngày</strong> (Hiện tại:{" "}
                      <strong style={{ color: "#dc2626" }}>
                        {money(stayOverdueDays * stayPenaltyRate)}
                      </strong>
                      ). Vui lòng thực hiện <strong>Gia hạn ngay</strong> hoặc{" "}
                      <strong>Trả phòng</strong> để tránh phát sinh thêm phí
                      phạt.
                    </p>
                  </div>
                </div>
                <div className="stay-alert-actions">
                  <button
                    className="stay-btn-dark"
                    onClick={() => setStayModal({ type: "EXTEND" })}
                  >
                    Gia hạn ngay
                  </button>
                  <button
                    className="stay-btn-dark-outline"
                    onClick={() => setStayModal({ type: "RETURN" })}
                  >
                    Trả phòng
                  </button>
                </div>
              </div>
            ) : stayDiffDays <= 3 ? (
              <div className="stay-deadline-alert stay-alert-red">
                <div className="stay-alert-content">
                  <div className="stay-alert-icon">
                    <AlertTriangle size={24} color="#dc2626" />
                  </div>
                  <div>
                    <div className="stay-alert-title">
                      🚨 CẢNH BÁO: CHỈ CÒN{" "}
                      {stayDiffDays === 0
                        ? "HÔM NAY LÀ NGÀY CUỐI"
                        : `${stayDiffDays} NGÀY CUỐI`}{" "}
                      ĐỂ GIA HẠN LƯU TRÚ!
                    </div>
                    <p className="stay-alert-desc">
                      Chu kỳ lưu trú phòng <strong>{active.room?.code}</strong>{" "}
                      sẽ kết thúc vào ngày <strong>{date(plannedEnd)}</strong>.
                      Vui lòng gửi yêu cầu gia hạn hoặc trả phòng trước ngày này
                      để không bị phạt trễ hạn ({money(stayPenaltyRate)}/ngày).
                    </p>
                  </div>
                </div>
                <div className="stay-alert-actions">
                  <button
                    className="stay-btn-red"
                    onClick={() => setStayModal({ type: "EXTEND" })}
                  >
                    Gia hạn ngay
                  </button>
                  <button
                    className="stay-btn-red-outline"
                    onClick={() => setStayModal({ type: "RETURN" })}
                  >
                    Trả phòng
                  </button>
                </div>
              </div>
            ) : (
              <div className="stay-deadline-alert stay-alert-amber">
                <div className="stay-alert-content">
                  <div className="stay-alert-icon">
                    <Clock size={24} color="#b45309" />
                  </div>
                  <div>
                    <div className="stay-alert-title">
                      SẮP HẾT HẠN LƯU TRÚ CHU KỲ (CÒN {stayDiffDays} NGÀY)
                    </div>
                    <p className="stay-alert-desc">
                      Chu kỳ lưu trú phòng <strong>{active.room?.code}</strong>{" "}
                      sẽ kết thúc vào ngày <strong>{date(plannedEnd)}</strong>.
                      Bạn có thể gia hạn chu kỳ tiếp theo hoặc đăng ký trả phòng
                      ngay từ bây giờ.
                    </p>
                  </div>
                </div>
                <div className="stay-alert-actions">
                  <button
                    className="stay-btn-amber"
                    onClick={() => setStayModal({ type: "EXTEND" })}
                  >
                    Gia hạn lưu trú
                  </button>
                  <button
                    className="stay-btn-amber-outline"
                    onClick={() => setStayModal({ type: "RETURN" })}
                  >
                    Trả phòng
                  </button>
                </div>
              </div>
            )))}

          <div className="metrics-grid">
            <Metric
              icon={BedDouble}
              label="Phòng hiện tại"
              value={active?.room?.code || "Chưa có"}
              foot={active?.room?.building?.name || "Đăng ký để được bố trí"}
              tone="blue"
            />
            <Metric
              icon={ClipboardList}
              label="Hồ sơ gần nhất"
              value={
                apps.data?.items?.[0]
                  ? labels[apps.data.items[0].status]
                  : "Chưa gửi"
              }
              foot={
                apps.data?.items?.[0]
                  ? `Gửi ngày ${date(apps.data.items[0].createdAt)}`
                  : "Hãy gửi hồ sơ đăng ký"
              }
              tone="peach"
            />
            <Metric
              icon={Wallet}
              label="Còn phải đóng"
              value={money(due)}
              foot={`${invoices.data?.items?.filter((x) => x.balance > 0).length || 0} hóa đơn chưa tất toán`}
              tone="green"
            />
          </div>
          <div className="dashboard-grid">
            <Section
              title="Lưu trú của bạn"
              subtitle="Thông tin phòng và thời hạn hiện tại"
              action={
                <Link to="/stays" className="text-link">
                  Xem chi tiết <ArrowRight size={16} />
                </Link>
              }
            >
              {active ? (
                <div className="stay-preview">
                  <div className="stay-room">
                    <BedDouble size={26} />
                    <strong>{active.room?.code}</strong>
                    <span>{active.room?.building?.name}</span>
                  </div>
                  <div className="stay-info">
                    <div>
                      <span>Loại phòng</span>
                      <strong>{active.room?.roomType?.name}</strong>
                    </div>
                    <div>
                      <span>Ngày bắt đầu</span>
                      <strong>{date(active.startDate)}</strong>
                    </div>
                    <div>
                      <span>Dự kiến kết thúc</span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "wrap",
                          marginTop: "3px",
                        }}
                      >
                        <strong>{date(active.plannedEndDate)}</strong>
                        {stayDiffDays !== null &&
                          (isStayOverdue ? (
                            <span className="stay-badge-overdue-red">
                              Quá hạn {stayOverdueDays} ngày (Phạt{" "}
                              {money(stayOverdueDays * stayPenaltyRate)})
                            </span>
                          ) : stayDiffDays <= 3 ? (
                            <span
                              style={{
                                backgroundColor: "#fef2f2",
                                color: "#dc2626",
                                border: "1.5px solid #fca5a5",
                                borderRadius: "3px",
                                padding: "2px 8px",
                                fontSize: "12px",
                                fontWeight: 700,
                              }}
                            >
                              Còn {stayDiffDays} ngày cuối
                            </span>
                          ) : stayDiffDays <= 10 ? (
                            <span
                              style={{
                                backgroundColor: "#fef3c7",
                                color: "#b45309",
                                border: "1px solid #fcd34d",
                                borderRadius: "3px",
                                padding: "2px 8px",
                                fontSize: "12px",
                                fontWeight: 600,
                              }}
                            >
                              Còn {stayDiffDays} ngày
                            </span>
                          ) : null)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Empty
                  icon={BedDouble}
                  title="Chưa có phòng lưu trú"
                  detail="Gửi hồ sơ để bắt đầu hành trình ở KTX."
                />
              )}
            </Section>
            <Section
              title="Thông báo mới"
              subtitle="Cập nhật dành cho bạn"
              action={
                <Link to="/notifications" className="text-link">
                  Xem tất cả <ArrowRight size={16} />
                </Link>
              }
            >
              {n.data?.items?.length ? (
                <div className="feed-scroll-container">
                  {n.data.items.map((x) => (
                    <div className="feed-item" key={x.id}>
                      <span className="feed-dot" />
                      <div>
                        <strong>{x.title}</strong>
                        <p>{x.body}</p>
                        <small>{date(x.createdAt)}</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty icon={Bell} />
              )}
            </Section>
          </div>
          <Section
            title="Hóa đơn gần đây"
            subtitle="Theo dõi các khoản phải đóng"
            action={
              <Link to="/invoices" className="text-link">
                Tất cả hóa đơn <ArrowRight size={16} />
              </Link>
            }
          >
            {invoices.data?.items?.length ? (
              <Table
                items={invoices.data.items.slice(0, 4)}
                columns={[
                  {
                    key: "period",
                    label: "Kỳ thu",
                    render: (x) => x.period?.month,
                  },
                  {
                    key: "room",
                    label: "Phòng",
                    render: (x) => x.snapshot?.roomCode || x.room?.code || "—",
                  },
                  {
                    key: "total",
                    label: "Tổng tiền",
                    render: (x) => money(x.total),
                  },
                  {
                    key: "balance",
                    label: "Còn lại",
                    render: (x) => money(x.balance),
                  },
                  {
                    key: "status",
                    label: "Trạng thái",
                    render: (x) => badge(x.status),
                  },
                ]}
                onRow={(x) => (location.href = `/invoices/${x.id}`)}
              />
            ) : (
              <Empty icon={Wallet} />
            )}
          </Section>
          {stayModal && active && (
            <StayRequestModal
              currentStay={active}
              initialType={stayModal.type}
              onClose={() => setStayModal(null)}
              onSuccess={() => {
                const reqTypeLabel =
                  stayModal.type === "EXTEND"
                    ? "gia hạn lưu trú"
                    : "trả phòng KTX";
                setStayModal(null);
                stays.load();
                requests.load();
                notice(
                  `Đã gửi yêu cầu ${reqTypeLabel} thành công! Ban quản lý sẽ sớm xử lý yêu cầu của bạn.`,
                );
              }}
            />
          )}
        </>
      ) : (
        <>
          <div className="metrics-grid four">
            <Metric
              icon={Building2}
              label="Phòng đang quản lý"
              value={report.data?.rooms ?? "—"}
              foot={`${report.data?.vacant ?? 0} chỗ còn trống`}
              tone="blue"
            />
            <Metric
              icon={Users}
              label="Sinh viên nội trú"
              value={report.data?.activeStudents ?? "—"}
              foot="Đang lưu trú"
              tone="green"
            />
            <Metric
              icon={ClipboardList}
              label="Hồ sơ chờ duyệt"
              value={report.data?.pendingApplications ?? "—"}
              foot="Cần xử lý"
              tone="peach"
            />
            <Metric
              icon={Wallet}
              label="Còn phải thu"
              value={money(report.data?.outstanding)}
              foot="Từ các hóa đơn đã lập"
              tone="purple"
            />
          </div>

          <div className="dashboard-grid">
            <Section
              title="Tỷ lệ lấp đầy"
              subtitle="Sức chứa vận hành toàn KTX"
            >
              <div className="occupancy">
                <div
                  className="occupancy-ring"
                  style={{ "--percent": `${report.data?.occupancyRate || 0}%` }}
                >
                  <div>
                    <strong>{report.data?.occupancyRate || 0}%</strong>
                    <span>đã sử dụng</span>
                  </div>
                </div>
                <div className="occupancy-key">
                  <div>
                    <span className="key-dot blue" />
                    Đã ở <strong>{report.data?.occupied || 0}</strong>
                  </div>
                  <div>
                    <span className="key-dot pale" />
                    Còn trống <strong>{report.data?.vacant || 0}</strong>
                  </div>
                </div>
              </div>
            </Section>
            <Section
              title="Tình hình khoản thu"
              subtitle="Số liệu từ hóa đơn đã phát hành"
            >
              <div className="finance-bars">
                {[
                  ["Đã lập", report.data?.billed, "var(--accent)"],
                  ["Đã thu", report.data?.collected, "var(--success)"],
                  ["Còn nợ", report.data?.outstanding, "var(--warning)"],
                ].map(([label, value, color]) => (
                  <div key={label}>
                    <div>
                      <span>{label}</span>
                      <strong>{money(value)}</strong>
                    </div>
                    <div className="bar-track">
                      <span
                        style={{
                          width: `${report.data?.billed ? (value / report.data.billed) * 100 : 0}%`,
                          background: color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          {/* Lịch sử giao dịch thanh toán gần đây (giữ nguyên cấu trúc giao diện trước đó, mã biên lai duy nhất) */}
          <Section
            title="Lịch sử thanh toán gần đây"
            subtitle="Các khoản thu tiền phòng, điện nước mới nhất vừa ghi nhận vào hệ thống"
            action={
              <Link to="/invoices" className="text-link">
                Xem tất cả hóa đơn <ArrowRight size={16} />
              </Link>
            }
          >
            {recentPayments.length ? (
              <div className="dashboard-sticky-table">
                <Table
                  items={recentPayments}
                  columns={[
                    {
                      key: "paymentDate",
                      label: "Thời gian",
                      render: (p) => (
                        <span className="muted" style={{ fontSize: "13px" }}>
                          {dateTime(p.paymentDate || p.createdAt)}
                        </span>
                      ),
                    },
                    {
                      key: "student",
                      label: "Sinh viên",
                      render: (p) => (
                        <div>
                          <strong>{p.studentName}</strong>
                          <div
                            style={{ fontSize: "12px", color: "var(--muted)" }}
                          >
                            MSSV: {p.studentCode}
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "room",
                      label: "Phòng & Kỳ thu",
                      render: (p) => (
                        <span>
                          Phòng <strong>{p.roomCode}</strong> · Kỳ{" "}
                          {p.periodMonth}
                        </span>
                      ),
                    },
                    {
                      key: "method",
                      label: "Hình thức",
                      render: (p) => (
                        <span style={{ fontSize: "13px" }}>
                          {p.method === "TRANSFER"
                            ? "Chuyển khoản"
                            : "Tiền mặt"}
                        </span>
                      ),
                    },
                    {
                      key: "amount",
                      label: "Số tiền",
                      render: (p) => (
                        <strong
                          style={{ color: "#16a34a", fontSize: "14.5px" }}
                        >
                          +{money(p.amount)}
                        </strong>
                      ),
                    },
                  ]}
                  onRow={(p) => (location.href = `/invoices/${p.invoiceId}`)}
                />
              </div>
            ) : (
              <Empty icon={Wallet} title="Chưa có giao dịch thanh toán nào" />
            )}
          </Section>

          {/* Hồ sơ & Yêu cầu chờ xử lý (chia tab, duyệt nhanh) + Nhật ký hệ thống thời gian thực */}
          <div className="dashboard-grid">
            <PendingQueueSection
              pendingApps={pendingApps}
              pendingRequests={pendingRequests}
              dateTimeFormatter={dateTime}
              onApproveApp={handleApproveApp}
              onRejectApp={handleRejectApp}
              onApproveRequest={handleApproveRequest}
              onRejectRequest={handleRejectRequest}
            />
            <ActivityTimelineSection
              logsData={activityLogs}
              isLoading={logs.loading}
              onReload={() => logs.load()}
              onOpenExport={() => setExportOpen(true)}
              dateTimeFormatter={dateTime}
            />
          </div>
        </>
      )}

      {exportOpen && <ExportLogsModal onClose={() => setExportOpen(false)} />}
      <Toast message={message} onClose={() => clear(null)} />
    </>
  );
}

export default Dashboard;
