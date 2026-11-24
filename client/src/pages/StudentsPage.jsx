import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";
import { useLoad } from "../hooks/useLoad";
import { date, labels } from "../services/api";
import { badge, Text } from "../utils/formatters";
import {
  Loading,
  Empty,
  Table,
  Pager,
  PageTitle,
  SearchBar,
  Section,
  FilterSelect,
  Modal,
} from "../components/common";

function StudentsPage() {
  const navigate = useNavigate(),
    [page, setPage] = useState(1),
    [search, setSearch] = useState("");
  const [building, setBuilding] = useState(""),
    [room, setRoom] = useState(""),
    [status, setStatus] = useState("");
  const data = useLoad(
      `/students?page=${page}&search=${encodeURIComponent(search)}&buildingId=${building}&roomId=${room}&status=${status}`,
    ),
    cat = useLoad("/catalog");
  const items = data.data?.items || [];
  return (
    <>
      <PageTitle
        kicker="QUẢN LÝ SINH VIÊN"
        title="Sinh viên nội trú"
        description="Hồ sơ, phòng ở và lịch sử lưu trú của sinh viên."
      />
      <Section
        title="Danh sách sinh viên"
        subtitle={`${data.data?.total || 0} sinh viên trong hệ thống`}
      >
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        >
          <FilterSelect
            value={building}
            onChange={(val) => {
              setBuilding(val);
              setRoom("");
              setPage(1);
            }}
            options={[
              { value: "", label: "Tất cả tòa" },
              ...(cat.data?.buildings || []).map((b) => ({
                value: b.id,
                label: b.name,
              })),
            ]}
            placeholder="Tất cả tòa"
            minWidth="135px"
          />

          <FilterSelect
            value={room}
            onChange={(val) => {
              setRoom(val);
              setPage(1);
            }}
            options={[
              { value: "", label: "Tất cả phòng" },
              ...(cat.data?.rooms || [])
                .filter((r) => !building || r.buildingId === building)
                .map((r) => ({
                  value: r.id,
                  label: `${r.code} ${r.building?.name ? `(${r.building.name})` : ""}`,
                  code: r.code,
                })),
            ]}
            placeholder="Tất cả phòng"
            searchPlaceholder="Tìm mã phòng..."
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
              { value: "ACTIVE", label: "Đang ở" },
              { value: "INACTIVE", label: "Chưa ở" },
            ]}
            placeholder="Tất cả trạng thái"
            searchable={false}
            minWidth="145px"
          />
        </SearchBar>
        {data.error ? (
          <div className="inline-error">{data.error}</div>
        ) : data.loading ? (
          <Loading />
        ) : items.length ? (
          <>
            <Table
              items={items}
              columns={[
                {
                  key: "studentCode",
                  label: "Mã sinh viên",
                  render: (x) => <strong>{x.studentCode}</strong>,
                },
                { key: "fullName", label: "Họ tên" },
                { key: "faculty", label: "Khoa / ngành" },
                {
                  key: "stay",
                  label: "Phòng hiện tại",
                  render: (x) =>
                    cat.data?.rooms?.find((r) => r.id === x.stay?.roomId)
                      ?.code || "—",
                },
                {
                  key: "startDate",
                  label: "Ngày vào",
                  render: (x) => date(x.stay?.startDate),
                },
                {
                  key: "status",
                  label: "Trạng thái",
                  render: (x) =>
                    x.stay ? badge("ACTIVE") : <Text>Chưa ở</Text>,
                },
              ]}
              onRow={(x) => navigate(`/students/${x.id}`)}
            />
            <Pager data={data.data} page={page} setPage={setPage} />
          </>
        ) : (
          <Empty icon={Users} />
        )}
      </Section>
    </>
  );
}
function StudentDetail() {
  const { id } = useParams(),
    navigate = useNavigate();
  const data = useLoad(`/students/${id}`),
    cat = useLoad("/catalog");
  const x = data.data;
  if (data.loading) return <Loading />;
  if (!x) return <div className="inline-error">{data.error}</div>;
  const room = cat.data?.rooms?.find((r) => r.id === x.stay?.roomId);
  return (
    <>
      <button className="back-link" onClick={() => navigate("/students")}>
        <ArrowLeft size={17} /> Danh sách sinh viên
      </button>
      <PageTitle
        kicker={x.studentCode}
        title={x.fullName}
        description={`${x.faculty || "Chưa cập nhật khoa"} · Khóa ${x.course || "—"}`}
        action={x.stay ? badge("ACTIVE") : <Text>Chưa lưu trú</Text>}
      />
      <div className="detail-layout">
        <Section title="Thông tin cá nhân">
          <div className="detail-grid">
            <div>
              <span>Mã sinh viên</span>
              <strong>{x.studentCode}</strong>
            </div>
            <div>
              <span>Giới tính</span>
              <strong>{labels[x.gender]}</strong>
            </div>
            <div>
              <span>Điện thoại</span>
              <strong>{x.phone || "—"}</strong>
            </div>
            <div>
              <span>Địa chỉ</span>
              <strong>{x.address || "—"}</strong>
            </div>
            <div>
              <span>Khoa</span>
              <strong>{x.faculty || "—"}</strong>
            </div>
            <div>
              <span>Khóa</span>
              <strong>{x.course || "—"}</strong>
            </div>
          </div>
        </Section>
        <Section title="Phòng hiện tại">
          <div className="large-room-number">{room?.code || "—"}</div>
          <p>{room?.building?.name || "Chưa được bố trí phòng"}</p>
          {x.stay && (
            <div className="detail-grid">
              <div>
                <span>Ngày vào</span>
                <strong>{date(x.stay.startDate)}</strong>
              </div>
              <div>
                <span>Dự kiến kết thúc</span>
                <strong>{date(x.stay.plannedEndDate)}</strong>
              </div>
            </div>
          )}
        </Section>
      </div>
      <Section title="Lịch sử lưu trú">
        {x.stays?.length ? (
          <Table
            items={x.stays}
            columns={[
              {
                key: "roomId",
                label: "Phòng",
                render: (s) =>
                  cat.data?.rooms?.find((r) => r.id === s.roomId)?.code || "—",
              },
              {
                key: "startDate",
                label: "Bắt đầu",
                render: (s) => date(s.startDate),
              },
              {
                key: "plannedEndDate",
                label: "Dự kiến",
                render: (s) => date(s.plannedEndDate),
              },
              {
                key: "actualEndDate",
                label: "Kết thúc",
                render: (s) => date(s.actualEndDate),
              },
              {
                key: "status",
                label: "Trạng thái",
                render: (s) => badge(s.status),
              },
            ]}
          />
        ) : (
          <Empty />
        )}
      </Section>
      <Section title="Yêu cầu & hồ sơ">
        {[...(x.applications || []), ...(x.requests || [])].length ? (
          <Table
            items={[
              ...(x.applications || []).map((a) => ({
                ...a,
                label: "Đăng ký ở",
                when: a.createdAt,
              })),
              ...(x.requests || []).map((r) => ({
                ...r,
                label: labels[r.type],
                when: r.createdAt,
              })),
            ]}
            columns={[
              { key: "label", label: "Nghiệp vụ" },
              { key: "when", label: "Ngày gửi", render: (i) => date(i.when) },
              {
                key: "status",
                label: "Trạng thái",
                render: (i) => badge(i.status),
              },
            ]}
          />
        ) : (
          <Empty />
        )}
      </Section>
    </>
  );
}

export { StudentDetail };
export default StudentsPage;
