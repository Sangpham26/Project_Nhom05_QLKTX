import React, { useState } from "react";
import { Building2, Users, BedDouble, Wallet } from "lucide-react";
import { money } from "../services/api";
import { useLoad } from "../hooks/useLoad";
import {
  PageTitle,
  FilterSelect,
  PeriodSelect,
  Metric,
  Section,
} from "../components/common";

export default function ReportPage() {
  const cat = useLoad("/catalog"),
    periods = useLoad("/periods?limit=100"),
    [building, setBuilding] = useState(""),
    [period, setPeriod] = useState("");
  const data = useLoad(`/report?buildingId=${building}&periodId=${period}`),
    r = data.data;
  return (
    <>
      <PageTitle
        kicker="PHÂN TÍCH HOẠT ĐỘNG"
        title="Báo cáo tổng quan"
        description="Số liệu cập nhật trực tiếp từ phòng, lưu trú và hóa đơn."
      />
      <div className="filter-panel">
        <div
          className="search-bar"
          style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
        >
          <FilterSelect
            value={building}
            onChange={(val) => setBuilding(val)}
            options={[
              { value: "", label: "Tất cả tòa" },
              ...(cat.data?.buildings || []).map((b) => ({
                value: b.id,
                label: b.name,
              })),
            ]}
            placeholder="Tất cả tòa"
            minWidth="150px"
          />
          <PeriodSelect
            periods={periods.data?.items}
            value={period}
            onChange={(val) => setPeriod(val)}
            placeholder="Tất cả kỳ thu"
            minWidth="175px"
          />
        </div>
      </div>
      <div className="metrics-grid four">
        <Metric
          icon={Building2}
          label="Tổng phòng"
          value={r?.rooms ?? "—"}
          foot={`${r?.capacity || 0} chỗ vận hành`}
          tone="blue"
        />
        <Metric
          icon={Users}
          label="Sinh viên đang ở"
          value={r?.activeStudents ?? "—"}
          foot="Lưu trú hiệu lực"
          tone="green"
        />
        <Metric
          icon={BedDouble}
          label="Chỗ còn trống"
          value={r?.vacant ?? "—"}
          foot={`${r?.occupancyRate || 0}% đã sử dụng`}
          tone="peach"
        />
        <Metric
          icon={Wallet}
          label="Còn phải thu"
          value={money(r?.outstanding)}
          foot="Từ hóa đơn đã lập"
          tone="purple"
        />
      </div>
      <div className="dashboard-grid">
        <Section
          title="Sức chứa theo tòa"
          subtitle="Đã sử dụng so với sức chứa vận hành"
        >
          <div className="building-bars">
            {r?.byBuilding?.map((x) => (
              <div key={x.name}>
                <div>
                  <strong>{x.name}</strong>
                  <span>
                    {x.occupied}/{x.capacity} chỗ
                  </span>
                </div>
                <div className="bar-track">
                  <span
                    style={{
                      width: `${x.capacity ? (x.occupied / x.capacity) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
        <Section title="Dòng tiền" subtitle="Tổng đã lập, đã thu và còn nợ">
          <div className="report-money">
            <div>
              <span>Đã lập</span>
              <strong>{money(r?.billed)}</strong>
            </div>
            <div>
              <span>Đã thu</span>
              <strong>{money(r?.collected)}</strong>
            </div>
            <div>
              <span>Còn nợ</span>
              <strong>{money(r?.outstanding)}</strong>
            </div>
          </div>
        </Section>
      </div>
    </>
  );
}
