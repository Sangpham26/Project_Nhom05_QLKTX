import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Plus, ArrowLeft, ClipboardList } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotice, useLoad } from "../hooks/useLoad";
import { api, date, money, labels } from "../services/api";
import { badge, durationOptions, endAfterMonths } from "../utils/formatters";
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
  StatusSelect,
  Form,
} from "../components/common";

function Applications() {
  const { session } = useAuth();
  const isStudent = session.user.role === "STUDENT";
  const navigate = useNavigate();
  const location = useLocation();
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [show, setShow] = useState(false),
    [requestedTypeId, setRequestedTypeId] = useState(""),
    [requestedRoomId, setRequestedRoomId] = useState(""),
    [message, notice, clear] = useNotice();
  const data = useLoad(
      `/applications?page=${page}&search=${encodeURIComponent(search)}&status=${status}`,
    ),
    cat = useLoad("/catalog");
  useEffect(() => {
    if (!isStudent || !location.state?.openApplication) return;
    setRequestedTypeId(location.state.roomTypeId || "");
    setRequestedRoomId(location.state.preferredRoomId || "");
    setShow(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [isStudent, location.pathname, location.state, navigate]);
  const eligibleTypes =
    cat.data?.roomTypes?.filter(
      (type) =>
        type.status === "ACTIVE" &&
        (type.gender === "ANY" || type.gender === session.profile?.gender),
    ) || [];
  useEffect(() => {
    if (isStudent) return;
    const refresh = () => data.load();
    window.addEventListener("work-queue-changed", refresh);
    return () => window.removeEventListener("work-queue-changed", refresh);
  }, [isStudent, page, search, status]);
  const save = async (v) => {
    await api("/applications", { method: "POST", body: v });
    setShow(false);
    setPage(1);
    setSearch("");
    setStatus("");
    if (page === 1 && !search && !status) data.load();
    notice("Đã gửi hồ sơ đăng ký.");
  };
  return (
    <>
      <PageTitle
        kicker={isStudent ? "ĐĂNG KÝ LƯU TRÚ" : "TIẾP NHẬN HỒ SƠ"}
        title={isStudent ? "Hồ sơ đăng ký" : "Duyệt hồ sơ đăng ký"}
        description={
          isStudent
            ? "Theo dõi nguyện vọng và kết quả xét duyệt của bạn."
            : "Xem xét nguyện vọng và bố trí phòng phù hợp cho sinh viên."
        }
        action={
          isStudent && (
            <button
              className="button button-primary"
              onClick={() => {
                setRequestedTypeId("");
                setRequestedRoomId("");
                setShow(true);
              }}
            >
              <Plus size={17} />
              Gửi hồ sơ mới
            </button>
          )
        }
      />
      <Section
        title="Danh sách hồ sơ"
        subtitle={`${data.data?.total || 0} hồ sơ được tìm thấy`}
      >
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        >
          <StatusSelect
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          />
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
                ...(!isStudent
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
                  key: "roomType",
                  label: "Loại phòng mong muốn",
                  render: (x) => x.roomType?.name,
                },
                ...(!isStudent
                  ? [
                      {
                        key: "preferredRoom",
                        label: "Phòng nguyện vọng",
                        render: (x) =>
                          x.preferredRoom ? (
                            <span className="preferred-room-pill">
                              ★ {x.preferredRoom.code}
                            </span>
                          ) : (
                            <span className="muted">Chưa chọn phòng</span>
                          ),
                      },
                    ]
                  : []),
                {
                  key: "durationMonths",
                  label: "Thời hạn",
                  render: (x) =>
                    x.durationMonths ? `${x.durationMonths} tháng` : "—",
                },
                {
                  key: "startDate",
                  label: "Bắt đầu dự kiến",
                  render: (x) => date(x.startDate),
                },
                {
                  key: "createdAt",
                  label: "Ngày gửi",
                  render: (x) => date(x.createdAt),
                },
                {
                  key: "status",
                  label: "Trạng thái",
                  render: (x) => badge(x.status),
                },
              ]}
              onRow={(x) => navigate(`/applications/${x.id}`)}
            />
            <Pager data={data.data} page={page} setPage={setPage} />
          </>
        ) : (
          <Empty
            icon={ClipboardList}
            title="Chưa có hồ sơ"
            detail={
              isStudent
                ? "Bạn có thể gửi nguyện vọng đăng ký chỗ ở."
                : "Chưa có hồ sơ trong bộ lọc này."
            }
          />
        )}
      </Section>
      {show && (
        <Modal title="Gửi hồ sơ đăng ký" onClose={() => setShow(false)}>
          <p className="modal-intro">
            Chọn loại phòng, phòng nguyện vọng và thời hạn ở. Nhân viên sẽ xác
            nhận phòng thực tế khi duyệt hồ sơ.
          </p>
          {cat.loading ? (
            <Loading />
          ) : cat.error ? (
            <div className="inline-error">{cat.error}</div>
          ) : (
            <Form
              fields={(values) => {
                const rooms = (cat.data?.rooms || []).filter(
                  (room) =>
                    room.roomTypeId === values.roomTypeId &&
                    room.status === "ACTIVE" &&
                    room.building?.status === "ACTIVE",
                );
                return [
                  {
                    label: "Loại phòng mong muốn",
                    name: "roomTypeId",
                    required: true,
                    options: eligibleTypes.map((x) => ({
                      value: x.id,
                      label: `${x.name} · ${money(x.fee)}/tháng`,
                    })),
                  },
                  {
                    label: "Phòng nguyện vọng",
                    name: "preferredRoomId",
                    required: rooms.length > 0,
                    options: rooms.map((room) => ({
                      value: room.id,
                      label: `${room.code} · ${room.building?.name || ""} · ${room.vacant > 0 ? `${room.vacant} chỗ trống` : "đã đầy"}`,
                    })),
                    hint: rooms.length
                      ? "Đây là nguyện vọng; nhân viên sẽ xác nhận theo chỗ còn thực tế."
                      : "Loại phòng này chưa có phòng cụ thể; bạn vẫn có thể gửi nguyện vọng loại phòng.",
                  },
                  {
                    label: "Ngày muốn bắt đầu ở",
                    name: "startDate",
                    type: "date",
                    required: true,
                  },
                  {
                    label: "Thời hạn đăng ký",
                    name: "durationMonths",
                    required: true,
                    options: durationOptions,
                  },
                  {
                    label: "Thông tin liên hệ",
                    name: "contact",
                    required: true,
                    placeholder: "Số điện thoại hoặc email",
                  },
                  { label: "Ghi chú", name: "note", rows: 3 },
                ];
              }}
              initial={{
                roomTypeId: eligibleTypes.some(
                  (type) => type.id === requestedTypeId,
                )
                  ? requestedTypeId
                  : "",
                preferredRoomId: requestedRoomId,
                durationMonths: "",
                contact: session.profile?.phone || "",
              }}
              resetOnChange={{ roomTypeId: ["preferredRoomId"] }}
              onSave={save}
              onCancel={() => setShow(false)}
              submit="Gửi hồ sơ"
            >
              {(values) =>
                endAfterMonths(values.startDate, values.durationMonths) && (
                  <div className="stay-date-preview">
                    Ngày kết thúc dự kiến:{" "}
                    <strong>
                      {date(
                        endAfterMonths(values.startDate, values.durationMonths),
                      )}
                    </strong>
                  </div>
                )
              }
            </Form>
          )}
        </Modal>
      )}
      <Toast message={message} onClose={() => clear(null)} />
    </>
  );
}

function ApplicationDetail() {
  const { id } = useParams(),
    navigate = useNavigate();
  const { session } = useAuth();
  const isStaff = session.user.role !== "STUDENT";
  const data = useLoad(`/applications/${id}`),
    cat = useLoad("/catalog");
  const [action, setAction] = useState(""),
    [message, notice, clear] = useNotice();
  const item = data.data;
  const suitable =
    cat.data?.rooms?.filter(
      (x) =>
        x.roomTypeId === item?.roomTypeId &&
        x.status === "ACTIVE" &&
        x.building?.status === "ACTIVE" &&
        x.vacant > 0 &&
        (!x.roomType?.gender ||
          x.roomType.gender === "ANY" ||
          x.roomType.gender === item?.student?.gender),
    ) || [];
  const preferredSuitable = suitable.find(
    (room) => room.id === item?.preferredRoomId,
  );
  const sortedSuitable = preferredSuitable
    ? [
        preferredSuitable,
        ...suitable.filter((room) => room.id !== preferredSuitable.id),
      ]
    : suitable;
  const submit = async (v) => {
    if (action === "supplement") {
      await api(`/applications/${id}`, { method: "PATCH", body: v });
      setAction("");
      data.load();
      notice("Đã bổ sung và gửi lại hồ sơ.");
      return;
    }
    if (
      !window.confirm(
        action === "approve"
          ? "Xác nhận duyệt hồ sơ và bố trí phòng?"
          : action === "reject"
            ? "Xác nhận từ chối hồ sơ?"
            : "Xác nhận cập nhật trạng thái?",
      )
    )
      return;
    await api(`/applications/${id}/${action}`, { method: "POST", body: v });
    setAction("");
    data.load();
    notice("Đã xử lý hồ sơ.");
  };
  if (data.loading) return <Loading />;
  if (!item) return <div className="inline-error">{data.error}</div>;
  return (
    <>
      <button className="back-link" onClick={() => navigate("/applications")}>
        <ArrowLeft size={17} /> Danh sách hồ sơ
      </button>
      <PageTitle
        kicker={`HỒ SƠ · ${item.student?.studentCode}`}
        title={`Nguyện vọng của ${item.student?.fullName}`}
        description={`Gửi ngày ${date(item.createdAt)}`}
        action={badge(item.status)}
      />
      <div className="detail-layout">
        <Section title="Thông tin đăng ký">
          <div className="detail-grid">
            <div>
              <span>Sinh viên</span>
              <strong>{item.student?.fullName}</strong>
            </div>
            <div>
              <span>Mã sinh viên</span>
              <strong>{item.student?.studentCode}</strong>
            </div>
            <div>
              <span>Loại phòng</span>
              <strong>{item.roomType?.name}</strong>
            </div>
            <div>
              <span>Ngày muốn bắt đầu</span>
              <strong>{date(item.startDate)}</strong>
            </div>
            <div>
              <span>Thời hạn đăng ký</span>
              <strong>
                {item.durationMonths
                  ? `${item.durationMonths} tháng`
                  : "Hồ sơ cũ: chưa chọn"}
              </strong>
            </div>
            {item.durationMonths && (
              <div>
                <span>Ngày kết thúc dự kiến</span>
                <strong>
                  {date(endAfterMonths(item.startDate, item.durationMonths))}
                </strong>
              </div>
            )}
            <div>
              <span>Liên hệ</span>
              <strong>{item.contact}</strong>
            </div>
            <div>
              <span>Phòng bố trí</span>
              <strong>{item.room?.code || "Chưa có"}</strong>
            </div>
          </div>
          {item.preferredRoom ? (
            <div className="preferred-room-callout">
              <span>★ PHÒNG SINH VIÊN NGUYỆN VỌNG</span>
              <strong>
                Phòng {item.preferredRoom.code} ·{" "}
                {item.preferredRoom.building?.name}
              </strong>
              <small>
                {item.preferredRoom.vacant > 0
                  ? `${item.preferredRoom.vacant} chỗ còn trống hiện tại`
                  : "Hiện đã hết chỗ; nhân viên có thể chọn phòng khác cùng loại."}
              </small>
            </div>
          ) : (
            <p className="detail-note">
              Hồ sơ này chỉ chọn loại phòng, chưa chọn phòng cụ thể.
            </p>
          )}
          {item.note && <p className="detail-note">Ghi chú: {item.note}</p>}
          {item.reviewNote && (
            <p className="detail-note">Ghi chú kiểm tra: {item.reviewNote}</p>
          )}
          {item.rejectionReason && (
            <div className="callout warning">
              Lý do từ chối: {item.rejectionReason}
            </div>
          )}
        </Section>
        <Section title="Trạng thái xử lý" subtitle="Các bước xét duyệt hồ sơ">
          <div className="timeline">
            <div className="done">
              <span>1</span>
              <div>
                <strong>Đã tiếp nhận</strong>
                <small>{date(item.createdAt)}</small>
              </div>
            </div>
            <div className={item.status !== "PENDING" ? "done" : ""}>
              <span>2</span>
              <div>
                <strong>Kiểm tra hồ sơ</strong>
                <small>
                  {item.status === "NEEDS_INFO"
                    ? "Cần bổ sung"
                    : item.status === "PENDING"
                      ? "Chưa bắt đầu"
                      : "Đã kiểm tra"}
                </small>
              </div>
            </div>
            <div
              className={
                ["APPROVED", "REJECTED"].includes(item.status) ? "done" : ""
              }
            >
              <span>3</span>
              <div>
                <strong>Kết quả xét duyệt</strong>
                <small>{labels[item.status]}</small>
              </div>
            </div>
          </div>
          {isStaff &&
            ["PENDING", "REVIEWING", "NEEDS_INFO"].includes(item.status) && (
              <div className="action-stack">
                <button
                  className="button button-outline"
                  onClick={() => setAction("review")}
                >
                  Đánh dấu kiểm tra
                </button>
                <button
                  className="button button-primary"
                  onClick={() => setAction("approve")}
                >
                  Duyệt & bố trí phòng
                </button>
                <button
                  className="button button-danger"
                  onClick={() => setAction("reject")}
                >
                  Từ chối hồ sơ
                </button>
              </div>
            )}
          {!isStaff && item.status === "NEEDS_INFO" && (
            <div className="action-stack">
              <button
                className="button button-primary"
                onClick={() => setAction("supplement")}
              >
                Bổ sung thông tin
              </button>
            </div>
          )}
        </Section>
      </div>
      {action && (
        <Modal
          title={
            action === "approve"
              ? "Duyệt & bố trí phòng"
              : action === "reject"
                ? "Từ chối hồ sơ"
                : action === "supplement"
                  ? "Bổ sung hồ sơ"
                  : "Kiểm tra hồ sơ"
          }
          onClose={() => setAction("")}
        >
          <Form
            fields={
              action === "approve"
                ? [
                    {
                      label: "Phòng phù hợp",
                      name: "roomId",
                      required: true,
                      searchable: sortedSuitable.length > 3,
                      placeholder: "Nhập mã phòng để lọc nhanh...",
                      options: sortedSuitable.map((x) => ({
                        value: x.id,
                        label: `${x.id === item.preferredRoomId ? "★ NGUYỆN VỌNG · " : ""}Phòng ${x.code}`,
                        sublabel: `${x.building?.name || ""} · Còn ${x.vacant} chỗ trống`,
                        badge: `Còn ${x.vacant} chỗ`,
                        code: x.code,
                      })),
                    },
                    {
                      label: "Ngày bắt đầu",
                      name: "startDate",
                      type: "date",
                      required: true,
                    },
                    ...(!item.durationMonths
                      ? [
                          {
                            label: "Ngày kết thúc dự kiến (hồ sơ cũ)",
                            name: "endDate",
                            type: "date",
                            required: true,
                          },
                        ]
                      : []),
                  ]
                : action === "supplement"
                  ? (values) => {
                      const rooms = (cat.data?.rooms || []).filter(
                        (room) =>
                          room.roomTypeId === values.roomTypeId &&
                          room.status === "ACTIVE" &&
                          room.building?.status === "ACTIVE",
                      );
                      return [
                        {
                          label: "Loại phòng mong muốn",
                          name: "roomTypeId",
                          required: true,
                          options:
                            cat.data?.roomTypes
                              ?.filter(
                                (x) =>
                                  x.status === "ACTIVE" &&
                                  (x.gender === "ANY" ||
                                    x.gender === item.student?.gender),
                              )
                              .map((x) => ({ value: x.id, label: x.name })) ||
                            [],
                        },
                        {
                          label: "Phòng nguyện vọng",
                          name: "preferredRoomId",
                          required: rooms.length > 0,
                          options: rooms.map((room) => ({
                            value: room.id,
                            label: `${room.code} · ${room.building?.name || ""} · ${room.vacant > 0 ? `${room.vacant} chỗ trống` : "đã đầy"}`,
                          })),
                        },
                        {
                          label: "Ngày muốn bắt đầu ở",
                          name: "startDate",
                          type: "date",
                          required: true,
                        },
                        {
                          label: "Thời hạn đăng ký",
                          name: "durationMonths",
                          required: true,
                          options: durationOptions,
                        },
                        {
                          label: "Thông tin liên hệ",
                          name: "contact",
                          required: true,
                        },
                        {
                          label: "Thông tin bổ sung",
                          name: "note",
                          rows: 3,
                          required: true,
                        },
                      ];
                    }
                  : action === "reject"
                    ? [
                        {
                          label: "Lý do từ chối",
                          name: "reason",
                          rows: 3,
                          required: true,
                        },
                      ]
                    : [
                        { label: "Ghi chú", name: "note", rows: 3 },
                        {
                          label: "Kết quả",
                          name: "needsInfo",
                          options: [
                            { value: "", label: "Đang kiểm tra" },
                            { value: "true", label: "Cần bổ sung" },
                          ],
                        },
                      ]
            }
            initial={
              action === "supplement"
                ? {
                    roomTypeId: item.roomTypeId,
                    preferredRoomId: item.preferredRoomId || "",
                    startDate: item.startDate,
                    durationMonths: item.durationMonths
                      ? String(item.durationMonths)
                      : "",
                    contact: item.contact,
                    note: item.note,
                  }
                : {
                    startDate: item.startDate,
                    roomId: preferredSuitable?.id || "",
                  }
            }
            resetOnChange={
              action === "supplement" ? { roomTypeId: ["preferredRoomId"] } : {}
            }
            onSave={(v) =>
              submit(
                action === "review"
                  ? { ...v, needsInfo: v.needsInfo === "true" }
                  : v,
              )
            }
            onCancel={() => setAction("")}
          >
            {(values) => {
              const months =
                action === "approve"
                  ? item.durationMonths
                  : values.durationMonths;
              const endDate = endAfterMonths(values.startDate, months);
              return (
                ["approve", "supplement"].includes(action) &&
                endDate && (
                  <div className="stay-date-preview">
                    Thời hạn: <strong>{months} tháng</strong> · Ngày kết thúc dự
                    kiến: <strong>{date(endDate)}</strong>
                  </div>
                )
              );
            }}
          </Form>
          {action === "approve" && item.preferredRoom && !preferredSuitable && (
            <div className="inline-warning">
              Phòng nguyện vọng hiện không còn phù hợp hoặc đã đầy. Hãy chọn
              phòng khác cùng loại.
            </div>
          )}
          {action === "approve" && !suitable.length && (
            <div className="inline-error">
              Hiện chưa có phòng phù hợp còn chỗ.
            </div>
          )}
        </Modal>
      )}
      <Toast message={message} onClose={() => clear(null)} />
    </>
  );
}

export default Applications;
export { ApplicationDetail };
