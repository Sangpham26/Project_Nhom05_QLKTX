import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Wallet,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
} from "lucide-react";
import { api, date, money, labels } from "../services/api";
import { badge, formatStayPeriod, calcOverduePenaltyRate } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";
import { useLoad, useNotice } from "../hooks/useLoad";
import {
  PageTitle,
  SearchBar,
  StatusSelect,
  FilterSelect,
  PeriodSelect,
  Loading,
  Table,
  Pager,
  Empty,
  Section,
  Modal,
  Form,
  Toast,
  Metric,
} from "../components/common";

function InvoicesPage() {
  const { session } = useAuth(),
    navigate = useNavigate();
  const own = session.user.role === "STUDENT";
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [period, setPeriod] = useState(""),
    [building, setBuilding] = useState("");
  const periods = useLoad("/periods?limit=100");
  const catalog = useLoad("/catalog");
  const data = useLoad(
    `/invoices?page=${page}&search=${encodeURIComponent(search)}&status=${status}&periodId=${period}&buildingId=${building}`,
  );
  useEffect(() => {
    if (own) return;
    const refresh = () => data.load();
    window.addEventListener("work-queue-changed", refresh);
    return () => window.removeEventListener("work-queue-changed", refresh);
  }, [own, page, search, status, period, building]);
  const outstanding = data.data?.items?.reduce((a, x) => a + x.balance, 0) || 0;
  return (
    <>
      <PageTitle
        kicker="TÀI CHÍNH LƯU TRÚ"
        title={own ? "Hóa đơn của tôi" : "Công nợ & thanh toán"}
        description={
          own
            ? "Xem khoản phải đóng, cách tính và lịch sử thanh toán."
            : "Theo dõi công nợ và ghi nhận các khoản đã thu."
        }
      />
      <div className="metrics-grid two">
        <Metric
          icon={FileText}
          label="Hóa đơn trong danh sách"
          value={data.data?.total || 0}
          foot="Theo bộ lọc hiện tại"
          tone="blue"
        />
        <Metric
          icon={Wallet}
          label="Còn phải thu trên trang"
          value={money(outstanding)}
          foot="Cập nhật sau mỗi lần thanh toán"
          tone="peach"
        />
      </div>
      <Section
        title="Danh sách hóa đơn"
        subtitle="Nhấn vào hóa đơn để xem chi tiết"
      >
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        >
          <PeriodSelect
            periods={periods.data?.items}
            value={period}
            onChange={(val) => {
              setPeriod(val);
              setPage(1);
            }}
            placeholder="Tất cả kỳ"
            minWidth="160px"
          />
          <FilterSelect
            value={status}
            onChange={(val) => {
              setStatus(val);
              setPage(1);
            }}
            options={[
              { value: "", label: "Tất cả trạng thái" },
              { value: "UNPAID", label: labels.UNPAID },
              { value: "PARTIAL", label: labels.PARTIAL },
              { value: "PAID", label: labels.PAID },
            ]}
            placeholder="Tất cả trạng thái"
            searchable={false}
            minWidth="160px"
          />
          {!own && (
            <FilterSelect
              value={building}
              onChange={(val) => {
                setBuilding(val);
                setPage(1);
              }}
              options={[
                { value: "", label: "Tất cả tòa" },
                ...(catalog.data?.buildings || []).map((b) => ({
                  value: b.id,
                  label: b.name,
                })),
              ]}
              placeholder="Tất cả tòa"
              minWidth="140px"
            />
          )}
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
                        render: (x) => (
                          <div>
                            <strong>{x.student?.fullName}</strong>
                            <small className="block muted">
                              {x.student?.studentCode}
                            </small>
                          </div>
                        ),
                      },
                    ]
                  : []),
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
                { key: "paid", label: "Đã thu", render: (x) => money(x.paid) },
                {
                  key: "balance",
                  label: "Còn nợ",
                  render: (x) => <strong>{money(x.balance)}</strong>,
                },
                {
                  key: "status",
                  label: "Trạng thái",
                  render: (x) => badge(x.status),
                },
              ]}
              onRow={(x) => navigate(`/invoices/${x.id}`)}
            />
            <Pager data={data.data} page={page} setPage={setPage} />
          </>
        ) : (
          <Empty icon={Wallet} title="Chưa có hóa đơn" />
        )}
      </Section>
    </>
  );
}
function InvoiceDetail() {
  const { id } = useParams(),
    navigate = useNavigate(),
    { session } = useAuth();
  const data = useLoad(`/invoices/${id}`),
    [show, setShow] = useState(false),
    [message, notice, clear] = useNotice();
  const own = session.user.role === "STUDENT";
  const save = async (v) => {
    if (!window.confirm(`Xác nhận đã thu ${money(v.amount)}?`)) return;
    await api("/payments", {
      method: "POST",
      body: { ...v, invoiceId: id, amount: Number(v.amount) },
    });
    setShow(false);
    data.load();
    notice("Đã ghi nhận khoản thanh toán.");
  };
  const x = data.data,
    s = x?.snapshot;
  if (data.loading) return <Loading />;
  if (!x) return <div className="inline-error">{data.error}</div>;
  return (
    <>
      <button className="back-link" onClick={() => navigate("/invoices")}>
        <ArrowLeft size={17} /> Danh sách hóa đơn
      </button>
      <PageTitle
        kicker={`HÓA ĐƠN · ${x.period?.month}`}
        title={`Khoản thu phòng ${s?.roomCode || x.room?.code || "—"}`}
        description={`Hạn thanh toán: ${date(x.dueDate)}`}
        action={badge(x.status)}
      />
      <div className="invoice-summary">
        <div>
          <span>Tổng phải đóng</span>
          <strong>{money(x.total)}</strong>
        </div>
        <div>
          <span>Đã thanh toán</span>
          <strong>{money(x.paid)}</strong>
        </div>
        <div>
          <span>Còn lại</span>
          <strong>{money(x.balance)}</strong>
        </div>
        {!own && x.balance > 0 && (
          <button
            className="button button-primary"
            onClick={() => setShow(true)}
          >
            <Plus size={16} />
            Ghi nhận thu
          </button>
        )}
      </div>
      <div className="detail-layout">
        <Section
          title="Chi tiết khoản thu"
          subtitle="Đơn giá được lưu tại thời điểm phát hành"
        >
          <div className="invoice-lines">
            <div>
              <span>
                Phí phòng · {s.roomTypeName}
                {s.daysStayed && s.daysInMonth && s.daysStayed < s.daysInMonth
                  ? ` (${s.daysStayed}/${s.daysInMonth} ngày${formatStayPeriod(s) ? ` | ${formatStayPeriod(s)}` : ""})`
                  : ""}
              </span>
              <strong>{money(x.roomFee)}</strong>
            </div>
            <div>
              <span>
                Điện · {s.electricUsage} kWh × {money(s.electricityRate)}
                {s.daysStayed && s.daysInMonth && s.daysStayed < s.daysInMonth
                  ? ` (${s.daysStayed}/${s.totalPersonDays} ngày-người)`
                  : ` ÷ ${s.occupants} người`}
              </span>
              <strong>{money(x.electricityFee)}</strong>
            </div>
            <div>
              <span>
                Nước · {s.waterUsage} m³ × {money(s.waterRate)}
                {s.daysStayed && s.daysInMonth && s.daysStayed < s.daysInMonth
                  ? ` (${s.daysStayed}/${s.totalPersonDays} ngày-người)`
                  : ` ÷ ${s.occupants} người`}
              </span>
              <strong>{money(x.waterFee)}</strong>
            </div>
            {(x.penaltyFee > 0 || s?.penaltyFee > 0) && (() => {
              const penaltyTotal = x.penaltyFee || s?.penaltyFee;
              const fallbackRate = calcOverduePenaltyRate(s?.monthlyRoomFee);
              const penaltyDays =
                s?.penaltyDays || Math.max(1, Math.round(penaltyTotal / fallbackRate));
              const unitRate = Math.round(penaltyTotal / penaltyDays);
              return (
                <div style={{ color: "#dc2626" }}>
                  <span style={{ fontWeight: 600 }}>
                    Phí phạt trễ hạn lưu trú ({penaltyDays} ngày × {money(unitRate)})
                  </span>
                  <strong style={{ color: "#dc2626" }}>
                    {money(penaltyTotal)}
                  </strong>
                </div>
              );
            })()}
            <div className="total">
              <span>Tổng cộng</span>
              <strong>{money(x.total)}</strong>
            </div>
          </div>
        </Section>
        <Section title="Thông tin hóa đơn">
          <div className="detail-grid">
            <div>
              <span>Sinh viên</span>
              <strong>{x.student?.fullName}</strong>
            </div>
            <div>
              <span>Mã sinh viên</span>
              <strong>{x.student?.studentCode}</strong>
            </div>
            <div>
              <span>Phòng</span>
              <strong>{s.roomCode}</strong>
            </div>
            <div>
              <span>Thời gian tính phí</span>
              <strong>
                {s.daysStayed
                  ? `${s.daysStayed}/${s.daysInMonth} ngày${
                      s.daysStayed < s.daysInMonth
                        ? ` | ${formatStayPeriod(s) || "vào giữa tháng"}`
                        : ""
                    }`
                  : "Trọn kỳ"}
              </strong>
            </div>
            <div>
              <span>Số người chia</span>
              <strong>{s.occupants}</strong>
            </div>
            <div>
              <span>Ngày lập</span>
              <strong>{date(x.issuedAt)}</strong>
            </div>
            <div>
              <span>Hạn đóng</span>
              <strong>{date(x.dueDate)}</strong>
            </div>
          </div>
        </Section>
      </div>
      <Section
        title="Chỉ số điện nước"
        subtitle="Chỉ số đầu và cuối kỳ của phòng"
      >
        <Table
          items={[
            {
              name: "Điện",
              start: s.electricStart,
              end: s.electricEnd,
              usage: s.electricUsage,
              total: s.electricityRoomTotal,
            },
            {
              name: "Nước",
              start: s.waterStart,
              end: s.waterEnd,
              usage: s.waterUsage,
              total: s.waterRoomTotal,
            },
          ]}
          columns={[
            { key: "name", label: "Loại" },
            { key: "start", label: "Đầu kỳ" },
            { key: "end", label: "Cuối kỳ" },
            { key: "usage", label: "Tiêu thụ" },
            {
              key: "total",
              label: "Tổng của phòng",
              render: (r) => money(r.total),
            },
          ]}
        />
      </Section>
      <Section
        title="Lịch sử thanh toán"
        subtitle={`${x.payments?.length || 0} lần thanh toán đã ghi nhận`}
      >
        {x.payments?.length ? (
          <Table
            items={x.payments}
            columns={[
              { key: "date", label: "Ngày thu", render: (p) => date(p.date) },
              {
                key: "amount",
                label: "Số tiền",
                render: (p) => <strong>{money(p.amount)}</strong>,
              },
              {
                key: "method",
                label: "Phương thức",
                render: (p) => labels[p.method] || p.method,
              },
              { key: "note", label: "Ghi chú" },
              { key: "recordedByName", label: "Người ghi nhận" },
              {
                key: "balanceAfter",
                label: "Còn lại sau thu",
                render: (p) => money(p.balanceAfter),
              },
            ]}
          />
        ) : (
          <Empty icon={CreditCard} title="Chưa có khoản thanh toán" />
        )}
      </Section>
      {show && (
        <Modal title="Ghi nhận thanh toán" onClose={() => setShow(false)}>
          <p className="modal-intro">
            Số dư còn phải thu: <strong>{money(x.balance)}</strong>
          </p>
          <Form
            fields={[
              {
                label: "Số tiền thu",
                name: "amount",
                type: "number",
                min: 1,
                required: true,
              },
              { label: "Ngày thu", name: "date", type: "date", required: true },
              {
                label: "Phương thức",
                name: "method",
                required: true,
                options: [
                  { value: "CASH", label: "Tiền mặt" },
                  { value: "TRANSFER", label: "Chuyển khoản" },
                ],
              },
              { label: "Ghi chú", name: "note", rows: 2 },
            ]}
            initial={{
              date: new Date().toISOString().slice(0, 10),
              amount: x.balance,
            }}
            onSave={save}
            onCancel={() => setShow(false)}
            submit="Ghi nhận tiền"
          />
        </Modal>
      )}
      <Toast message={message} onClose={() => clear(null)} />
    </>
  );
}


export { InvoiceDetail };
export default InvoicesPage;
