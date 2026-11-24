import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CircleDollarSign,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileText,
  Wallet,
} from "lucide-react";
import { api, date, money, labels } from "../services/api";
import { formatStayPeriod } from "../utils/formatters";
import { useLoad, useNotice } from "../hooks/useLoad";
import {
  PageTitle,
  FilterSelect,
  PeriodSelect,
  Loading,
  Table,
  Empty,
  Section,
  Modal,
  Form,
  Toast,
  Metric,
} from "../components/common";

function BillingPage() {
  const periods = useLoad("/periods?limit=100"),
    [selected, setSelected] = useState(""),
    [preview, setPreview] = useState(null),
    [busy, setBusy] = useState(false),
    [message, notice, clear] = useNotice();
  const choose = async (value) => {
    setSelected(value);
    setPreview(null);
    if (value)
      try {
        setPreview(await api(`/billing/preview/${value}`));
      } catch (e) {
        notice(e.message, "error");
      }
  };

  // Tự động chọn luôn kỳ thu mới nhất và hiển thị dữ liệu ngay khi vào trang
  useEffect(() => {
    if (!selected && periods.data?.items?.length) {
      const sorted = [...periods.data.items].sort((a, b) =>
        (b.month || "").localeCompare(a.month || ""),
      );
      if (sorted[0]?.id) {
        choose(sorted[0].id);
      }
    }
  }, [periods.data?.items, selected]);

  useEffect(() => {
    if (!selected) return;
    const refresh = () =>
      api(`/billing/preview/${selected}`)
        .then(setPreview)
        .catch((error) => notice(error.message, "error"));
    window.addEventListener("work-queue-changed", refresh);
    return () => window.removeEventListener("work-queue-changed", refresh);
  }, [selected]);
  const issue = async () => {
    if (
      !window.confirm(
        `Phát hành ${preview?.items?.length || 0} hóa đơn cho kỳ này?`,
      )
    )
      return;
    setBusy(true);
    try {
      const items = await api(`/billing/issue/${selected}`, { method: "POST" });
      notice(`Đã phát hành ${items.length} hóa đơn.`);
      await choose(selected);
    } catch (e) {
      notice(e.message, "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageTitle
        kicker="THU PHÍ HÀNG THÁNG"
        title="Lập khoản thu"
        description="Xem trước tiền phòng, điện nước và phát hành hóa đơn cho sinh viên đang ở."
      />
      <Section
        title="Chọn kỳ thu"
        subtitle="Hóa đơn giữ nguyên đơn giá và số người chia tại thời điểm phát hành"
      >
        <div
          className="billing-select"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <PeriodSelect
            periods={periods.data?.items}
            value={selected}
            onChange={(val) => choose(val)}
            placeholder="Chọn kỳ thu"
            allowClear={false}
            minWidth="200px"
          />
          <Link
            className="button button-outline"
            to="/readings"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            Xem chỉ số <ArrowRight size={16} />
          </Link>
        </div>
      </Section>
      {preview && (
        <>
          <div className="metrics-grid two">
            <Metric
              icon={FileText}
              label="Hóa đơn có thể lập"
              value={preview.items.length}
              foot={`Kỳ ${preview.period?.month}`}
              tone="blue"
            />
            <Metric
              icon={Wallet}
              label="Tổng dự kiến"
              value={money(preview.items.reduce((a, x) => a + x.total, 0))}
              foot="Theo chỉ số đã nhập"
              tone="green"
            />
          </div>
          {preview.missing.length > 0 && (
            <div className="callout warning">
              <strong>Thiếu chỉ số điện nước</strong>
              <p>
                {preview.missing
                  .map((x) => `${x.roomCode}: ${x.types.join(", ")}`)
                  .join(" · ")}
              </p>
              <span>Nhập đủ chỉ số trước khi phát hành hóa đơn.</span>
            </div>
          )}
          <Section
            title="Chi tiết xem trước"
            subtitle="Các hóa đơn chưa phát hành trong kỳ"
          >
            {preview.items.length ? (
              <Table
                items={preview.items}
                columns={[
                  {
                    key: "studentId",
                    label: "Sinh viên",
                    render: (x) => x.studentName,
                  },
                  {
                    key: "roomId",
                    label: "Phòng",
                    render: (x) => x.snapshot?.roomCode || x.room?.code || "—",
                  },
                  {
                    key: "stayDays",
                    label: "Lưu trú",
                    render: (x) => {
                      const snap = x.snapshot || {};
                      const isPartial =
                        snap.daysStayed &&
                        snap.daysInMonth &&
                        snap.daysStayed < snap.daysInMonth;
                      const dateRange = formatStayPeriod(snap);
                      return (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span>
                            {snap.daysStayed
                              ? `${snap.daysStayed}/${snap.daysInMonth} ngày`
                              : "Cả kỳ"}
                          </span>
                          {isPartial && (
                            <>
                              <span
                                style={{ color: "#94a3b8", fontWeight: 400 }}
                              >
                                |
                              </span>
                              <span
                                style={{
                                  fontSize: "12.5px",
                                  fontWeight: 600,
                                  color: "var(--text)",
                                }}
                              >
                                {dateRange || "Vào giữa tháng"}
                              </span>
                            </>
                          )}
                        </div>
                      );
                    },
                  },
                  {
                    key: "roomFee",
                    label: "Tiền phòng",
                    render: (x) => money(x.roomFee),
                  },
                  {
                    key: "penaltyFee",
                    label: "Phí phạt",
                    render: (x) =>
                      x.penaltyFee > 0 ? (
                        <span style={{ color: "#dc2626", fontWeight: 700 }}>
                          {money(x.penaltyFee)}
                        </span>
                      ) : (
                        "—"
                      ),
                  },
                  {
                    key: "electricityFee",
                    label: "Điện",
                    render: (x) => money(x.electricityFee),
                  },
                  {
                    key: "waterFee",
                    label: "Nước",
                    render: (x) => money(x.waterFee),
                  },
                  {
                    key: "total",
                    label: "Tổng",
                    render: (x) => <strong>{money(x.total)}</strong>,
                  },
                ]}
              />
            ) : (
              <Empty icon={FileText} title="Không có hóa đơn mới" />
            )}
            {preview.items.length > 0 && (
              <div className="section-actions">
                <button
                  className="button button-primary"
                  disabled={busy || preview.missing.length > 0}
                  onClick={issue}
                >
                  {busy
                    ? "Đang phát hành..."
                    : `Phát hành ${preview.items.length} hóa đơn`}
                </button>
              </div>
            )}
          </Section>
        </>
      )}
      <Toast message={message} onClose={() => clear(null)} />
    </>
  );
}

export default BillingPage;
