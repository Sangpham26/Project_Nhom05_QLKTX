import React, { useState } from "react";
import { Plus, Zap, Wallet } from "lucide-react";
import { api, date, money } from "../services/api";
import { calcOverduePenaltyRate } from "../utils/formatters";
import { useNotice, useLoad } from "../hooks/useLoad";
import {
  PageTitle,
  Metric,
  Section,
  Table,
  Empty,
  Modal,
  Field,
  Toast,
} from "../components/common";

export default function PricingPage() {
  const pricing = useLoad("/pricing?limit=100"),
    cat = useLoad("/catalog");
  const [show, setShow] = useState(false),
    [values, setValues] = useState({}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, notice, clear] = useNotice();

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const roomFees = {};
      cat.data?.roomTypes?.forEach(
        (x) => (roomFees[x.id] = Number(values[`fee-${x.id}`])),
      );
      await api("/pricing", {
        method: "POST",
        body: {
          effectiveFrom: values.effectiveFrom,
          electricity: Number(values.electricity),
          water: Number(values.water),
          roomFees,
        },
      });
      setShow(false);
      pricing.load();
      notice("Đã tạo bảng đơn giá mới. Hóa đơn cũ được giữ nguyên.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const latest = pricing.data?.items
    ?.slice()
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];

  return (
    <>
      <PageTitle
        kicker="CẤU HÌNH TÀI CHÍNH"
        title="Đơn giá dịch vụ"
        description="Thiết lập đơn giá mới theo thời điểm áp dụng; hóa đơn cũ giữ nguyên."
        action={
          <button
            className="button button-primary"
            onClick={() => {
              setValues({
                effectiveFrom: new Date().toISOString().slice(0, 10),
                electricity: latest?.electricity || 3500,
                water: latest?.water || 15000,
                ...Object.fromEntries(
                  cat.data?.roomTypes?.map((x) => [
                    `fee-${x.id}`,
                    latest?.roomFees?.[x.id] ?? x.fee,
                  ]) || [],
                ),
              });
              setShow(true);
            }}
          >
            <Plus size={17} />
            Bảng giá mới
          </button>
        }
      />
      <div className="metrics-grid two">
        <Metric
          icon={Zap}
          label="Điện hiện hành"
          value={`${money(latest?.electricity)} / kWh`}
          foot={`Áp dụng từ ${date(latest?.effectiveFrom)}`}
          tone="blue"
        />
        <Metric
          icon={Wallet}
          label="Nước hiện hành"
          value={`${money(latest?.water)} / m³`}
          foot="Tính theo tiêu thụ của phòng"
          tone="green"
        />
      </div>
      <Section
        title="Phí theo loại phòng"
        subtitle="Phí hàng tháng trên mỗi sinh viên (Phí phạt quá hạn = 1,5 lần giá ngày, tối thiểu 25.000 ₫/ngày)"
      >
        {cat.data?.roomTypes?.length ? (
          <Table
            items={cat.data.roomTypes}
            columns={[
              { key: "name", label: "Loại phòng" },
              { key: "defaultCapacity", label: "Sức chứa" },
              {
                key: "fee",
                label: "Phí hiện hành",
                render: (x) => money(latest?.roomFees?.[x.id] ?? x.fee),
              },
              {
                key: "penaltyRate",
                label: "Phạt quá hạn / ngày",
                render: (x) =>
                  money(calcOverduePenaltyRate(latest?.roomFees?.[x.id] ?? x.fee)),
              },
            ]}
          />
        ) : (
          <Empty />
        )}
      </Section>
      <Section title="Lịch sử bảng giá">
        {pricing.data?.items?.length ? (
          <Table
            items={pricing.data.items}
            columns={[
              {
                key: "effectiveFrom",
                label: "Áp dụng từ",
                render: (x) => date(x.effectiveFrom),
              },
              {
                key: "electricity",
                label: "Điện / kWh",
                render: (x) => money(x.electricity),
              },
              {
                key: "water",
                label: "Nước / m³",
                render: (x) => money(x.water),
              },
            ]}
          />
        ) : (
          <Empty />
        )}
      </Section>
      {show && (
        <Modal title="Tạo bảng đơn giá mới" onClose={() => setShow(false)}>
          <form onSubmit={save}>
            <div className="form-grid">
              <Field
                label="Áp dụng từ"
                name="effectiveFrom"
                type="date"
                value={values.effectiveFrom}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [e.target.name]: e.target.value }))
                }
                required
              />
              <Field
                label="Điện / kWh"
                name="electricity"
                type="number"
                min={0}
                value={values.electricity}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [e.target.name]: e.target.value }))
                }
                required
              />
              <Field
                label="Nước / m³"
                name="water"
                type="number"
                min={0}
                value={values.water}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [e.target.name]: e.target.value }))
                }
                required
              />
              {cat.data?.roomTypes?.map((x) => (
                <Field
                  key={x.id}
                  label={`Phí ${x.name}`}
                  name={`fee-${x.id}`}
                  type="number"
                  min={0}
                  value={values[`fee-${x.id}`]}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      [e.target.name]: e.target.value,
                    }))
                  }
                  required
                />
              ))}
            </div>
            {error && <div className="inline-error">{error}</div>}
            <div className="modal-actions">
              <button
                type="button"
                className="button button-ghost"
                onClick={() => setShow(false)}
              >
                Hủy
              </button>
              <button className="button button-primary" disabled={busy}>
                {busy ? "Đang lưu..." : "Lưu bảng giá"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      <Toast message={message} onClose={() => clear(null)} />
    </>
  );
}
