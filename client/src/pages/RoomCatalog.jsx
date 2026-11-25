import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Plus, Trash2, X, ArrowRight, BedDouble } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotice, useLoad } from "../hooks/useLoad";
import { api, money } from "../services/api";
import RoomEditor from "../components/RoomEditor";
import RoomGallery, { coverOf } from "../components/RoomGallery";
import LandingNav from "../components/landing/LandingNav";
import {
  Toast,
  Loading,
  Empty,
  Modal,
  Pager,
  PageTitle,
  SearchBar,
  Form,
} from "../components/common";

function RoomCatalog() {
  const { session } = useAuth();
  const routeLocation = useLocation();
  const cat = useLoad("/catalog");
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [building, setBuilding] = useState(""),
    [type, setType] = useState(
      () => new URLSearchParams(routeLocation.search).get("type") || "",
    ),
    [vacant, setVacant] = useState(false),
    [maxFee, setMaxFee] = useState(""),
    [selected, setSelected] = useState(null),
    [selectedType, setSelectedType] = useState(null),
    [edit, setEdit] = useState(null),
    [deleteRoomModal, setDeleteRoomModal] = useState(null),
    [deleteRoomBusy, setDeleteRoomBusy] = useState(false),
    [deleteRoomError, setDeleteRoomError] = useState(""),
    [message, notice, clear] = useNotice();
  const handleDeleteRoom = async () => {
    if (!deleteRoomModal) return;
    setDeleteRoomBusy(true);
    setDeleteRoomError("");
    try {
      await api(`/rooms/${deleteRoomModal.id}`, { method: "DELETE" });
      notice(`Đã xóa phòng "${deleteRoomModal.code}" thành công.`);
      setDeleteRoomModal(null);
      setEdit(null);
      setSelected(null);
      cat.load();
    } catch (err) {
      setDeleteRoomError(err.message || "Không thể xóa phòng.");
    } finally {
      setDeleteRoomBusy(false);
    }
  };
  useEffect(() => {
    setType(new URLSearchParams(routeLocation.search).get("type") || "");
  }, [routeLocation.search]);
  const roomList =
    cat.data?.rooms?.filter(
      (x) =>
        (!building || x.buildingId === building) &&
        (!type || x.roomTypeId === type) &&
        (!vacant || x.vacant > 0) &&
        (!maxFee || x.roomType?.fee <= Number(maxFee)) &&
        (!search ||
          `${x.code} ${x.roomType?.name} ${x.building?.name}`
            .toLowerCase()
            .includes(search.toLowerCase())),
    ) || [];
  useEffect(() => setPage(1), [search, building, type, vacant, maxFee]);
  const roomPages = Math.max(1, Math.ceil(roomList.length / 6));
  const visibleRooms = roomList.slice((page - 1) * 6, page * 6);
  const isAdmin = session?.user.role === "ADMIN",
    isStaff = session?.user.role === "STAFF" || isAdmin;
  const save = async (v, targetId = edit?.id) => {
    const saved = await api(targetId ? `/rooms/${targetId}` : "/rooms", {
      method: targetId ? "PATCH" : "POST",
      body: isAdmin
        ? {
            ...v,
            designCapacity: Number(v.designCapacity),
            operationalCapacity: Number(v.operationalCapacity),
            floor: Number(v.floor),
          }
        : {
            operationalCapacity: Number(v.operationalCapacity),
            status: v.status,
          },
    });
    cat.load();
    notice("Đã lưu thông tin phòng.");
    return saved;
  };
  const roomFields = [
    { label: "Mã phòng", name: "code", required: true },
    {
      label: "Tòa nhà",
      name: "buildingId",
      required: true,
      options:
        cat.data?.buildings?.map((x) => ({ value: x.id, label: x.name })) || [],
    },
    { label: "Tầng", name: "floor", type: "number", required: true, min: 1 },
    {
      label: "Loại phòng",
      name: "roomTypeId",
      required: true,
      options:
        cat.data?.roomTypes?.map((x) => ({ value: x.id, label: x.name })) || [],
    },
    {
      label: "Sức chứa thiết kế",
      name: "designCapacity",
      type: "number",
      required: true,
      min: 1,
    },
    {
      label: "Sức chứa vận hành",
      name: "operationalCapacity",
      type: "number",
      required: true,
      min: 1,
    },
    {
      label: "Trạng thái",
      name: "status",
      required: true,
      options: [
        { value: "ACTIVE", label: "Đang sử dụng" },
        { value: "INACTIVE", label: "Ngừng sử dụng" },
      ],
    },
  ];
  return (
    <div
      className={`room-catalog${session ? "" : " ktx-landing dorm-landing public-catalog catalog-public"}`}
    >
      {!session && <LandingNav session={session} home={false} />}
      <div className={`catalog-content${session ? "" : " dl-container"}`}>
        <PageTitle
          kicker="PHÒNG Ở KÝ TÚC XÁ"
          title={isStaff ? "Danh sách phòng" : "Tìm phòng phù hợp"}
          description={
            isStaff
              ? "Theo dõi sức chứa và trạng thái phòng theo thời gian thực."
              : "Tìm hiểu phòng trước khi gửi nguyện vọng đăng ký."
          }
          action={
            isAdmin && (
              <button
                className="button button-primary"
                onClick={() => setEdit({ status: "ACTIVE", floor: 1 })}
              >
                <Plus size={17} />
                Thêm phòng
              </button>
            )
          }
        />
        <section className="room-type-section">
          <div className="room-type-heading">
            <div>
              <span className="eyebrow">XEM ẢNH VÀ THÔNG TIN</span>
              <h2>Loại phòng</h2>
            </div>
            <span>
              {cat.data?.roomTypes?.filter((x) => x.status === "ACTIVE")
                .length || 0}{" "}
              loại phòng
            </span>
          </div>
          <div className="room-type-grid">
            {cat.data?.roomTypes
              ?.filter((x) => x.status === "ACTIVE")
              .map((roomType) => {
                const cover = coverOf(roomType);
                const sameRooms =
                  cat.data?.rooms?.filter(
                    (room) =>
                      room.roomTypeId === roomType.id &&
                      room.status === "ACTIVE",
                  ) || [];
                const spaces = sameRooms.reduce(
                  (sum, room) => sum + room.vacant,
                  0,
                );
                return (
                  <button
                    type="button"
                    className="room-type-card"
                    key={roomType.id}
                    onClick={() => setSelectedType(roomType)}
                  >
                    <div className="room-type-card-media">
                      <div className="room-type-card-placeholder">
                        <BedDouble size={33} />
                      </div>
                      {cover && (
                        <img
                          src={cover.url}
                          alt={cover.description || roomType.name}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      )}
                    </div>
                    <div className="room-type-card-copy">
                      <div>
                        <strong>{roomType.name}</strong>
                        <span>
                          {roomType.defaultCapacity} người / phòng · {spaces}{" "}
                          chỗ trống
                        </span>
                      </div>
                      <small>{money(roomType.fee)} / tháng</small>
                      <span className="catalog-view-detail">
                        Xem chi tiết <ArrowRight size={17} />
                      </span>
                    </div>
                  </button>
                );
              })}
          </div>
        </section>
        <div className="filter-panel">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Tìm mã phòng, loại phòng..."
          >
            <select
              aria-label="Lọc theo tòa nhà"
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
            >
              <option value="">Tất cả tòa</option>
              {cat.data?.buildings?.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Lọc theo loại phòng"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">Tất cả loại phòng</option>
              {cat.data?.roomTypes?.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              placeholder="Phí tối đa"
              value={maxFee}
              onChange={(e) => setMaxFee(e.target.value)}
            />
            <label className="check-filter">
              <input
                type="checkbox"
                checked={vacant}
                onChange={(e) => setVacant(e.target.checked)}
              />{" "}
              Còn chỗ
            </label>
          </SearchBar>
        </div>
        <div className="list-count">
          Hiển thị <strong>{roomList.length}</strong> phòng
        </div>
        {cat.loading ? (
          <Loading />
        ) : cat.error ? (
          <div className="inline-error">{cat.error}</div>
        ) : roomList.length ? (
          <>
            <div className="room-grid">
              {visibleRooms.map((x) => (
                <button
                  key={x.id}
                  className="room-card"
                  onClick={() => setSelected(x)}
                >
                  <div className="room-card-art">
                    <div
                      className="catalog-room-placeholder"
                      aria-hidden="true"
                    >
                      <BedDouble size={44} strokeWidth={1.2} />
                      <span>Ảnh phòng đang cập nhật</span>
                    </div>
                    {(coverOf(x) || coverOf(x.roomType)) && (
                      <img
                        className="room-card-image"
                        src={(coverOf(x) || coverOf(x.roomType)).url}
                        alt={`Phòng ${x.code}`}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </div>
                  <div className="room-card-body">
                    <div className="room-meta">
                      <span>
                        {x.building?.name} · Tầng {x.floor}
                      </span>
                    </div>
                    <h3>Phòng {x.code}</h3>
                    <p>{x.roomType?.name}</p>
                    <div className="room-card-foot">
                      <div>
                        <strong>
                          {money(x.roomType?.fee)}
                          <small>/ tháng</small>
                        </strong>
                        <div
                          style={{
                            fontSize: "12.5px",
                            fontWeight: 600,
                            color: x.vacant ? "#16a34a" : "#dc2626",
                            marginTop: "2px",
                          }}
                        >
                          • {x.vacant ? `${x.vacant} chỗ trống` : "Đã đầy"}
                        </div>
                      </div>
                      <span>
                        <ArrowRight size={18} />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <Pager
              data={{ page, pages: roomPages, total: roomList.length }}
              page={page}
              setPage={setPage}
            />
          </>
        ) : (
          <Empty
            icon={BedDouble}
            title="Không có phòng phù hợp"
            detail="Thử thay đổi bộ lọc để xem thêm phòng."
          />
        )}
        {selected && (
          <Modal
            title={`Phòng ${selected.code}`}
            onClose={() => setSelected(null)}
            wide
          >
            <RoomGallery
              type={selected.roomType}
              room={selected}
              rooms={cat.data?.rooms || []}
            >
              {isStaff ? (
                <button
                  className="button button-primary"
                  onClick={() => {
                    setEdit(selected);
                    setSelected(null);
                  }}
                >
                  Cập nhật phòng
                </button>
              ) : (
                <Link
                  className="button button-primary"
                  style={{ color: "#ffffff" }}
                  to={session ? "/applications" : "/register"}
                  state={
                    session
                      ? {
                          openApplication: true,
                          roomTypeId: selected.roomTypeId,
                          preferredRoomId: selected.id,
                        }
                      : undefined
                  }
                >
                  Gửi nguyện vọng <ArrowRight size={16} />
                </Link>
              )}
            </RoomGallery>
          </Modal>
        )}
        {selectedType && (
          <Modal
            title={selectedType.name}
            onClose={() => setSelectedType(null)}
            wide
          >
            <RoomGallery type={selectedType} rooms={cat.data?.rooms || []}>
              {isStaff ? (
                <button
                  className="button button-primary"
                  onClick={() => {
                    setType(selectedType.id);
                    setSelectedType(null);
                  }}
                >
                  Xem phòng thuộc loại này <ArrowRight size={16} />
                </button>
              ) : (
                <Link
                  className="button button-primary"
                  style={{ color: "#ffffff" }}
                  to={session ? "/applications" : "/register"}
                  state={
                    session
                      ? { openApplication: true, roomTypeId: selectedType.id }
                      : undefined
                  }
                >
                  Gửi nguyện vọng <ArrowRight size={16} />
                </Link>
              )}
            </RoomGallery>
          </Modal>
        )}
        {edit && (
          <Modal
            title={
              edit.id ? `Cập nhật phòng ${edit.code || ""}` : "Thêm phòng mới"
            }
            onClose={() => setEdit(null)}
            wide={isAdmin}
          >
            {isAdmin ? (
              <RoomEditor
                key={edit.id || "new"}
                initial={edit}
                fields={roomFields}
                onSaveRoom={save}
                onChanged={cat.load}
                onClose={() => setEdit(null)}
                onDelete={
                  isAdmin && edit?.id
                    ? () => {
                        setDeleteRoomError("");
                        setDeleteRoomModal(edit);
                      }
                    : undefined
                }
                deleteLabel="Xóa phòng"
              />
            ) : (
              <Form
                fields={roomFields.filter((f) =>
                  ["operationalCapacity", "status"].includes(f.name),
                )}
                initial={edit}
                onSave={async (v) => {
                  await save(v);
                  setEdit(null);
                }}
                onCancel={() => setEdit(null)}
              />
            )}
          </Modal>
        )}
        {deleteRoomModal && (
          <Modal
            title={`Xác nhận xóa phòng: ${deleteRoomModal.code}`}
            onClose={() => {
              if (!deleteRoomBusy) {
                setDeleteRoomModal(null);
                setDeleteRoomError("");
              }
            }}
          >
            <div style={{ padding: "4px 0" }}>
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: "14px",
                  color: "#374151",
                }}
              >
                Bạn có chắc chắn muốn xóa phòng{" "}
                <strong>{deleteRoomModal.code}</strong> không?
              </p>
              <div
                style={{
                  background: "#fff1f2",
                  border: "1px solid #fecdd3",
                  borderRadius: "3px",
                  padding: "12px 14px",
                  color: "#9f1239",
                  fontSize: "13px",
                  lineHeight: "1.55",
                }}
              >
                <strong>Quy định an toàn & điều kiện xóa phòng:</strong>
                <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
                  <li>
                    Phòng{" "}
                    <strong>
                      chỉ được phép xóa khi không còn sinh viên nào đang lưu trú
                    </strong>{" "}
                    (phòng đang trống).
                  </li>
                  <li>
                    Không có hồ sơ sinh viên hay yêu cầu chuyển phòng chờ xử lý
                    liên quan đến phòng.
                  </li>
                  <li>
                    Không có hóa đơn chưa tất toán của phòng này.
                  </li>
                  <li>
                    Hành động này không thể hoàn tác sau khi thực hiện.
                  </li>
                </ul>
              </div>
              {deleteRoomError && (
                <div className="inline-error" style={{ marginTop: "12px" }}>
                  {deleteRoomError}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="button button-ghost"
                onClick={() => {
                  setDeleteRoomModal(null);
                  setDeleteRoomError("");
                }}
                disabled={deleteRoomBusy}
              >
                Hủy
              </button>
              <button
                type="button"
                className="button button-danger"
                style={{
                  background: "#dc2626",
                  color: "#ffffff",
                  borderColor: "#dc2626",
                }}
                disabled={deleteRoomBusy}
                onClick={handleDeleteRoom}
              >
                <Trash2 size={15} />
                {deleteRoomBusy ? "Đang kiểm tra và xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </Modal>
        )}
        <Toast message={message} onClose={() => clear(null)} />
      </div>
    </div>
  );
}

export default RoomCatalog;
