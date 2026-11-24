import React, { useState } from "react";
import { DoorOpen } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLoad } from "../hooks/useLoad";
import { date, labels } from "../services/api";
import { badge } from "../utils/formatters";
import {
  PageTitle,
  SearchBar,
  Loading,
  Table,
  Pager,
  Empty,
  Section,
} from "../components/common";

export default function StaysPage() {
  const { session } = useAuth();
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("");
  const data = useLoad(
      `/stays?page=${page}&search=${encodeURIComponent(search)}&status=${status}`,
    ),
    currentStay = useLoad("/stays?status=ACTIVE&limit=1"),
    transfers = useLoad("/transfers?limit=100");
  const own = session.user.role === "STUDENT";
  const active = currentStay.data?.items || [];
  return (
    <>
      <PageTitle
        kicker="THÔNG TIN LƯU TRÚ"
        title={own ? "Lưu trú của tôi" : "Sinh viên đang ở"}
        description={
          own
            ? "Phòng hiện tại và lịch sử những lần lưu trú."
            : "Theo dõi lượt lưu trú và tình trạng phòng theo thời gian thực."
        }
      />
      {own && active.length > 0 && (
        <div className="current-stay">
          <div className="current-stay-main">
            <span className="eyebrow">PHÒNG CỦA BẠN</span>
            <h2>{active[0].room?.code}</h2>
            <p>
              {active[0].room?.building?.name} ·{" "}
              {active[0].room?.roomType?.name}
            </p>
          </div>
          <div>
            <span>Bắt đầu</span>
            <strong>{date(active[0].startDate)}</strong>
          </div>
          <div>
            <span>Kết thúc dự kiến</span>
            <strong>{date(active[0].plannedEndDate)}</strong>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            {badge(active[0].status)}
          </div>
        </div>
      )}
      <Section
        title="Lịch sử lưu trú"
        subtitle={`${data.data?.total || 0} lượt lưu trú`}
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
            {["ACTIVE", "ENDED", "TRANSFERRED"].map((x) => (
              <option key={x} value={x}>
                {labels[x]}
              </option>
            ))}
          </select>
        </SearchBar>
        {data.loading ? (
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
                  key: "room",
                  label: "Phòng / tòa",
                  render: (x) => (
                    <div>
                      <strong>{x.room?.code}</strong>
                      <small className="block muted">
                        {x.room?.building?.name}
                      </small>
                    </div>
                  ),
                },
                {
                  key: "startDate",
                  label: "Ngày vào",
                  render: (x) => date(x.startDate),
                },
                {
                  key: "plannedEndDate",
                  label: "Dự kiến kết thúc",
                  render: (x) => date(x.plannedEndDate),
                },
                {
                  key: "actualEndDate",
                  label: "Ngày rời",
                  render: (x) => date(x.actualEndDate),
                },
                {
                  key: "status",
                  label: "Trạng thái",
                  render: (x) => badge(x.status),
                },
              ]}
            />
            <Pager data={data.data} page={page} setPage={setPage} />
          </>
        ) : (
          <Empty icon={DoorOpen} />
        )}
      </Section>
      <Section
        title="Lịch sử chuyển phòng"
        subtitle="Các lần điều chuyển đã ghi nhận"
      >
        {transfers.data?.items?.length ? (
          <Table
            items={transfers.data.items}
            columns={[
              ...(!own
                ? [
                    {
                      key: "student",
                      label: "Sinh viên",
                      render: (x) => x.student?.fullName,
                    },
                  ]
                : []),
              {
                key: "fromRoom",
                label: "Phòng cũ",
                render: (x) => x.fromRoom?.code,
              },
              {
                key: "toRoom",
                label: "Phòng mới",
                render: (x) => x.toRoom?.code,
              },
              {
                key: "date",
                label: "Ngày chuyển",
                render: (x) => date(x.date),
              },
              { key: "reason", label: "Lý do" },
            ]}
          />
        ) : (
          <Empty icon={DoorOpen} title="Chưa có lần chuyển phòng" />
        )}
      </Section>
    </>
  );
}
