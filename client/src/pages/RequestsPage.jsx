import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus,
  RotateCw,
  DoorOpen,
  AlertTriangle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotice, useLoad } from "../hooks/useLoad";
import { api, date, money, labels } from "../services/api";
import { badge, endAfterMonths } from "../utils/formatters";
import {
  Toast,
  Loading,
  Empty,
  Modal,
  Table,
  Pager,
  PageTitle,
  SearchBar,
  Section,
  Form,
} from "../components/common";

function StayRequestModal({
  currentStay,
  initialType = "EXTEND",
  onClose,
  onSuccess,
}) {
  const [type, setType] = useState(initialType);
  const [months, setMonths] = useState(3);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const plannedEnd = currentStay?.plannedEndDate || todayStr;

  // Tính số ngày chênh lệch & phạt trễ hạn
  const { diffDays, isOverdue, overdueDays, penaltyAmount } = useMemo(() => {
    const dPlanned = new Date(`${plannedEnd}T00:00:00Z`);
    const dToday = new Date(`${todayStr}T00:00:00Z`);
    const diff = Math.round((dPlanned - dToday) / 86400000);
    const overdue = diff < 0;
    const days = overdue ? Math.abs(diff) : 0;
    const rate = 25000;
    return {
      diffDays: diff,
      isOverdue: overdue,
      overdueDays: days,
      penaltyRate: rate,
      penaltyAmount: days * rate,
    };
  }, [plannedEnd, todayStr]);

  const addDays = (dateStr, days) => {
    const d = new Date(`${dateStr}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const calcEndAfterMonths = (startDateStr, m) => {
    return endAfterMonths(startDateStr, m);
  };

  // Tính ngày bắt đầu chu kỳ mới & ngày dự kiến kết thúc theo đúng nghiệp vụ
  const { startDateForCycle, desiredEndDate } = useMemo(() => {
    if (type === "EXTEND") {
      let start;
      if (!isOverdue) {
        // Gia hạn trước khi phạt: lấy ngày hôm sau của chu kỳ trước
        start = addDays(plannedEnd, 1);
      } else {
        // Gia hạn khi quá hạn: tính ngày hôm sau của ngày bị phạt (ngày mai)
        start = addDays(todayStr, 1);
      }
      const end = calcEndAfterMonths(start, months);
      return { startDateForCycle: start, desiredEndDate: end };
    } else {
      // RETURN
      if (!isOverdue) {
        // Trả phòng đúng hạn: tự động lấy ngày dự kiến kết thúc
        return { startDateForCycle: plannedEnd, desiredEndDate: plannedEnd };
      } else {
        // Quá hạn: lấy ngày hôm sau của ngày phạt
        const retDate = addDays(todayStr, 1);
        return { startDateForCycle: retDate, desiredEndDate: retDate };
      }
    }
  }, [type, isOverdue, plannedEnd, todayStr, months]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Vui lòng nhập lý do.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api("/requests", {
        method: "POST",
        body: {
          type,
          months: type === "EXTEND" ? months : undefined,
          desiredDate: desiredEndDate,
          reason: reason.trim(),
        },
      });
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || "Không thể gửi yêu cầu.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={
        type === "EXTEND" ? "Gia hạn lưu trú KTX" : "Đăng ký trả phòng KTX"
      }
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        {/* Banner tình trạng hạn */}
        {isOverdue ? (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#ffffff",
              border: "1.5px solid #222222",
              color: "#222222",
              fontSize: "13.5px",
              lineHeight: "1.5",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: 700,
                marginBottom: "4px",
                color: "#222222",
              }}
            >
              <AlertCircle size={18} color="#dc2626" />
              Đang bị quá hạn lưu trú {overdueDays} ngày!
            </div>
            <div style={{ color: "#444444" }}>
              Chu kỳ cũ đã kết thúc vào ngày <strong>{date(plannedEnd)}</strong>
              . Hệ thống đang tính phí phạt trễ hạn:{" "}
              <strong style={{ color: "#dc2626" }}>
                {overdueDays} ngày × 25.000 ₫ = {money(penaltyAmount)}
              </strong>
              .
              {type === "EXTEND"
                ? ` Chu kỳ gia hạn mới sẽ bắt đầu tính từ ngày mai (${date(startDateForCycle)}).`
                : ` Ngày trả phòng được xác định là ngày mai (${date(desiredEndDate)}).`}
            </div>
          </div>
        ) : diffDays <= 3 ? (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#fef2f2",
              border: "1.5px solid #f87171",
              color: "#991b1b",
              fontSize: "13.5px",
              lineHeight: "1.5",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: 700,
                marginBottom: "4px",
              }}
            >
              <AlertTriangle size={18} color="#dc2626" />
              Cảnh báo: Chỉ còn{" "}
              {diffDays === 0
                ? "hôm nay là ngày cuối"
                : `${diffDays} ngày cuối`}
              !
            </div>
            <div>
              Chu kỳ lưu trú sẽ kết thúc vào ngày{" "}
              <strong>{date(plannedEnd)}</strong>. Vui lòng gửi yêu cầu sớm để
              không phát sinh phí phạt trễ hạn (25.000 ₫/ngày).
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              background: "#f0fdf4",
              border: "1px solid #86efac",
              color: "#166534",
              fontSize: "13px",
            }}
          >
            Chu kỳ hiện tại đến ngày <strong>{date(plannedEnd)}</strong> (còn{" "}
            {diffDays} ngày).
          </div>
        )}

        {/* Chọn loại yêu cầu */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "6px",
              color: "var(--text-body, #334155)",
            }}
          >
            Loại yêu cầu <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <div className="stay-type-selector">
            <button
              type="button"
              className={`stay-type-btn ${type === "EXTEND" ? "active" : ""}`}
              onClick={() => setType("EXTEND")}
            >
              <RotateCw size={17} /> Gia hạn lưu trú
            </button>
            <button
              type="button"
              className={`stay-type-btn ${type === "RETURN" ? "active-return" : ""}`}
              onClick={() => setType("RETURN")}
            >
              <DoorOpen size={17} /> Trả phòng KTX
            </button>
          </div>
        </div>

        {/* Nếu chọn Gia hạn: Chọn chu kỳ tháng */}
        {type === "EXTEND" && (
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "6px",
                color: "var(--text-body, #334155)",
              }}
            >
              Chọn chu kỳ gia hạn <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div className="duration-pills">
              {[
                { m: 1, text: "1 tháng" },
                { m: 3, text: "3 tháng" },
                { m: 6, text: "6 tháng" },
                { m: 12, text: "12 tháng" },
              ].map((opt) => (
                <button
                  key={opt.m}
                  type="button"
                  className={`duration-pill ${months === opt.m ? "active" : ""}`}
                  onClick={() => setMonths(opt.m)}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bảng chi tiết tính toán chu kỳ */}
        <div className="stay-calc-card">
          <div className="stay-calc-row">
            <span>Phòng lưu trú:</span>
            <strong>
              {currentStay?.room?.code || "—"} (
              {currentStay?.room?.roomType?.name || "KTX"})
            </strong>
          </div>
          {type === "EXTEND" ? (
            <>
              <div className="stay-calc-row">
                <span>Ngày bắt đầu chu kỳ mới:</span>
                <div style={{ textAlign: "right" }}>
                  <strong>{date(startDateForCycle)}</strong>
                  <small
                    style={{
                      display: "block",
                      fontWeight: 400,
                      color: "#64748b",
                      fontSize: "12px",
                    }}
                  >
                    {isOverdue
                      ? "(Ngày hôm sau của ngày phạt)"
                      : "(Ngày hôm sau của chu kỳ trước)"}
                  </small>
                </div>
              </div>
              <div className="stay-calc-row">
                <span>Ngày dự kiến kết thúc:</span>
                <strong style={{ color: "#2563eb", fontSize: "14.5px" }}>
                  {date(desiredEndDate)}
                </strong>
              </div>
            </>
          ) : (
            <div className="stay-calc-row">
              <span>Ngày trả phòng dự kiến:</span>
              <div style={{ textAlign: "right" }}>
                <strong style={{ color: "#ea580c", fontSize: "14.5px" }}>
                  {date(desiredEndDate)}
                </strong>
                <small
                  style={{
                    display: "block",
                    fontWeight: 400,
                    color: "#64748b",
                    fontSize: "12px",
                  }}
                >
                  {isOverdue
                    ? "(Ngày hôm sau của ngày phạt)"
                    : "(Tự động theo hạn kết thúc chu kỳ)"}
                </small>
              </div>
            </div>
          )}
          {isOverdue && (
            <div
              className="stay-calc-row"
              style={{
                background: "#fef2f2",
                margin: "8px -16px -14px -16px",
                padding: "10px 16px",
                borderRadius: "0 0 11px 11px",
                borderTop: "1px dashed #fca5a5",
              }}
            >
              <span style={{ color: "#991b1b", fontWeight: 600 }}>
                Phí phạt trễ hạn tính đến nay:
              </span>
              <strong className="stay-penalty-highlight">
                {overdueDays} ngày × 25.000 ₫ = {money(penaltyAmount)}
              </strong>
            </div>
          )}
        </div>

        {/* Lý do */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "6px",
              color: "var(--text-body, #334155)",
            }}
          >
            Lý do yêu cầu <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <textarea
            required
            rows={3}
            className="input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              type === "EXTEND"
                ? "Ví dụ: Tiếp tục theo học kỳ tiếp theo tại trường..."
                : "Ví dụ: Đã hoàn tất khóa học / chuyển về gia đình..."
            }
            style={{
              width: "100%",
              borderRadius: "8px",
              padding: "10px 12px",
              border: "1.5px solid #cbd5e1",
              resize: "vertical",
            }}
          />
        </div>

        {error && (
          <div className="inline-error" style={{ margin: 0 }}>
            {error}
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: "6px" }}>
          <button
            type="button"
            className="button button-ghost"
            onClick={onClose}
            disabled={busy}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="button button-primary"
            disabled={busy}
            style={
              isOverdue
                ? { background: "#222222", borderColor: "#222222" }
                : diffDays <= 3
                  ? { background: "#dc2626", borderColor: "#dc2626" }
                  : {}
            }
          >
            {busy ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function RequestsPage() {
  const { session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const own = session.user.role === "STUDENT",
    stays = useLoad("/stays?limit=100");
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [form, setForm] = useState(false),
    [decision, setDecision] = useState(null),
    [message, notice, clear] = useNotice();

  useEffect(() => {
    if (location.state?.openRequest) {
      setDecision(location.state.openRequest);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  const data = useLoad(
    `/requests?page=${page}&search=${encodeURIComponent(search)}&status=${status}`,
  );
  useEffect(() => {
    if (own) return;
    const refresh = () => data.load();
    window.addEventListener("work-queue-changed", refresh);
    return () => window.removeEventListener("work-queue-changed", refresh);
  }, [own, page, search, status]);
  const current = stays.data?.items?.find((x) => x.status === "ACTIVE");
  const save = async (v) => {
    await api("/requests", { method: "POST", body: v });
    setForm(false);
    setPage(1);
    setSearch("");
    setStatus("");
    if (page === 1 && !search && !status) data.load();
    notice("Đã gửi yêu cầu lưu trú.");
  };
  const decide = async (v) => {
    if (
      !window.confirm(
        v.status === "APPROVED"
          ? "Xác nhận duyệt yêu cầu và cập nhật lưu trú?"
          : "Xác nhận từ chối yêu cầu?",
      )
    )
      return;
    await api(`/requests/${decision.id}/decision`, { method: "POST", body: v });
    setDecision(null);
    data.load();
    notice("Đã xử lý yêu cầu.");
  };
  return (
    <>
      <PageTitle
        kicker="YÊU CẦU LƯU TRÚ"
        title={own ? "Gia hạn & trả phòng" : "Xử lý yêu cầu lưu trú"}
        description={
          own
            ? "Gửi yêu cầu và theo dõi kết quả xử lý."
            : "Duyệt gia hạn hoặc trả phòng cho sinh viên."
        }
        action={
          own &&
          current && (
            <button
              className="button button-primary"
              onClick={() => setForm(true)}
            >
              <Plus size={17} />
              Tạo yêu cầu
            </button>
          )
        }
      />
      <Section
        title="Danh sách yêu cầu"
        subtitle={`${data.data?.total || 0} yêu cầu`}
      >
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        >
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            {["PENDING", "APPROVED", "REJECTED"].map((x) => (
              <option key={x} value={x}>
                {labels[x]}
              </option>
            ))}
          </select>
        </SearchBar>
        {data.error ? (
          <div className="inline-error">{data.error}</div>
        ) : data.loading ? (
          <Loading />
        ) : data.data?.items?.length ? (
          <>
            <Table
              items={data.data.items}
              columns={[
                ...(!own
                  ? [
                      {
                        key: "student",
                        label: "Sinh viên",
                        render: (x) => <strong>{x.student?.fullName}</strong>,
                      },
                    ]
                  : []),
                { key: "type", label: "Loại", render: (x) => badge(x.type) },
                { key: "room", label: "Phòng", render: (x) => x.room?.code },
                {
                  key: "desiredDate",
                  label: "Hạn mong muốn",
                  render: (x) => (
                    <div>
                      <div>{date(x.desiredDate)}</div>
                      {x.months && (
                        <small className="muted" style={{ display: "block" }}>
                          Chu kỳ {x.months} tháng
                        </small>
                      )}
                    </div>
                  ),
                },
                {
                  key: "overdueDays",
                  label: "Tình trạng",
                  render: (x) =>
                    x.overdueDays > 0 ? (
                      <span
                        style={{
                          display: "inline-block",
                          backgroundColor: "#fef2f2",
                          color: "#dc2626",
                          border: "1.5px solid #f87171",
                          borderRadius: "9999px",
                          padding: "2px 10px",
                          fontSize: "12px",
                          fontWeight: 700,
                        }}
                      >
                        Quá hạn {x.overdueDays} ngày ({money(x.penaltyAmount)})
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-block",
                          backgroundColor: "#f0fdf4",
                          color: "#166534",
                          border: "1px solid #86efac",
                          borderRadius: "9999px",
                          padding: "2px 8px",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        Đúng hạn
                      </span>
                    ),
                },
                {
                  key: "reason",
                  label: "Lý do",
                  render: (x) => (
                    <div
                      title={x.reason}
                      style={{
                        maxWidth: "180px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        cursor: "pointer",
                      }}
                    >
                      {x.reason || "—"}
                    </div>
                  ),
                },
                {
                  key: "status",
                  label: "Trạng thái",
                  render: (x) => badge(x.status),
                },
                {
                  key: "handledAt",
                  label: "Ngày xử lý",
                  render: (x) => date(x.handledAt),
                },
                {
                  key: "rejectionReason",
                  label: "Ghi chú",
                  render: (x) => x.rejectionReason || "—",
                },
                ...(!own
                  ? [
                      {
                        key: "action",
                        label: "Thao tác",
                        render: (x) =>
                          x.status === "PENDING" ? (
                            <button
                              className="table-action"
                              onClick={() => setDecision(x)}
                            >
                              Xử lý
                            </button>
                          ) : (
                            "—"
                          ),
                      },
                    ]
                  : []),
              ]}
            />
            <Pager data={data.data} page={page} setPage={setPage} />
          </>
        ) : (
          <Empty icon={FileText} title="Chưa có yêu cầu" />
        )}
      </Section>
      {form && current && (
        <StayRequestModal
          currentStay={current}
          onClose={() => setForm(false)}
          onSuccess={() => {
            setForm(false);
            setPage(1);
            data.load();
            notice("Đã gửi yêu cầu lưu trú thành công.");
          }}
        />
      )}
      {decision && (
        <Modal
          title={`Xử lý yêu cầu ${labels[decision.type]?.toLowerCase()}`}
          onClose={() => setDecision(null)}
        >
          <p className="modal-intro">
            {decision.student?.fullName} · {decision.room?.code} · Ngày mong
            muốn {date(decision.desiredDate)}
          </p>
          <div
            style={{
              margin: "10px 0 16px 0",
              padding: "12px 14px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              fontSize: "13.5px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#64748b",
                marginBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              Lý do gửi yêu cầu của sinh viên:
            </div>
            <div style={{ color: "#1e293b", lineHeight: 1.5, fontWeight: 500 }}>
              "{decision.reason || "Không ghi rõ lý do."}"
            </div>
          </div>
          {decision.overdueDays > 0 && (
            <div
              style={{
                margin: "0 0 16px 0",
                padding: "12px 14px",
                backgroundColor: "#ffffff",
                border: "1.5px solid #222222",
                borderRadius: "10px",
                color: "#222222",
                fontSize: "13px",
                lineHeight: "1.5",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: "4px",
                  color: "#222222",
                }}
              >
                Yêu cầu được gửi khi đã quá hạn {decision.overdueDays} ngày!
              </div>
              <div style={{ color: "#444444" }}>
                Phí phạt trễ hạn được tính:{" "}
                <strong style={{ color: "#dc2626" }}>
                  {decision.overdueDays} ngày × 25.000 ₫ ={" "}
                  {money(decision.penaltyAmount)}
                </strong>
                .
                {decision.type === "EXTEND"
                  ? ` Khi duyệt, chu kỳ mới sẽ bắt đầu từ ${date(decision.startDateForCycle)}.`
                  : ` Khi duyệt, ngày trả phòng sẽ được ấn định là ${date(decision.desiredDate)}.`}
              </div>
            </div>
          )}
          <Form
            fields={[
              {
                label: "Kết quả",
                name: "status",
                required: true,
                options: [
                  { value: "APPROVED", label: "Duyệt" },
                  { value: "REJECTED", label: "Từ chối" },
                ],
              },
              { label: "Lý do từ chối (nếu có)", name: "reason", rows: 3 },
            ]}
            onSave={decide}
            onCancel={() => setDecision(null)}
            submit="Xác nhận xử lý"
          />
        </Modal>
      )}
      <Toast message={message} onClose={() => clear(null)} />
    </>
  );
}

export { StayRequestModal };
export default RequestsPage;
