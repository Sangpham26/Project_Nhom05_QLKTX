import React, { useState, useEffect, useMemo } from "react";
import { Plus, ArrowRight, DoorOpen } from "lucide-react";
import { useNotice, useLoad } from "../hooks/useLoad";
import { api, date, money } from "../services/api";
import { badge } from "../utils/formatters";
import {
  Toast,
  Empty,
  Table,
  Pager,
  PageTitle,
  SearchBar,
  Section,
  Modal,
  SearchableSelect,
} from "../components/common";

// Helper tính ngày đầu của chu kỳ kế tiếp (ngày 01 tháng sau)
const getNextCycleStartDate = (refDateStr) => {
  const base = new Date(
    `${refDateStr || new Date().toISOString().slice(0, 10)}T00:00:00Z`,
  );
  const year = base.getUTCFullYear();
  const month = base.getUTCMonth();
  return new Date(Date.UTC(year, month + 1, 1)).toISOString().slice(0, 10);
};

// Đây là ghi chú mẫu: Modal tạo lượt chuyển phòng cho sinh viên kèm tính năng tìm kiếm thông minh và kiểm tra giới tính/chỗ trống/cùng cấp
function TransferModal({ onClose, onSuccess, students, catalog }) {
  const [studentId, setStudentId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [transferDate, setTransferDate] = useState(() =>
    getNextCycleStartDate(new Date().toISOString().slice(0, 10)),
  );
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Hàm tra cứu thông tin phòng hiện tại của sinh viên từ catalog
  const getStudentRoom = (s) => {
    if (!s) return null;
    const currentRoomId = s.stay?.roomId || s.roomId || s.room?.id;
    return (
      (catalog.data?.rooms || []).find((r) => r.id === currentRoomId) ||
      s.room ||
      null
    );
  };

  // Lấy danh sách tất cả sinh viên đang có lượt lưu trú hoạt động
  const residentStudents = useMemo(() => {
    return (students.data?.items || []).filter(
      (s) => s.stay && s.stay.status === "ACTIVE",
    );
  }, [students.data]);

  // Sinh viên được chọn
  const selectedStudent = useMemo(() => {
    return residentStudents.find((s) => s.id === studentId);
  }, [residentStudents, studentId]);

  // Phòng hiện tại của sinh viên được chọn
  const selectedStudentRoom = useMemo(() => {
    return getStudentRoom(selectedStudent);
  }, [selectedStudent, catalog.data?.rooms]);

  // Danh sách options sinh viên để tìm kiếm theo MSSV hoặc họ tên trong thời gian thực
  const studentOptions = useMemo(() => {
    return residentStudents.map((s) => {
      const room = getStudentRoom(s);
      const roomCode = room?.code || "—";
      const bldgName = room?.building?.name || "";
      return {
        value: s.id,
        label: `${s.fullName} · MSSV: ${s.studentCode}`,
        sublabel: `Phòng hiện tại: ${roomCode}${bldgName ? ` (${bldgName})` : ""} · Loại phòng: ${room?.roomType?.name || "—"} · Giới tính: ${s.gender === "FEMALE" ? "Nữ" : "Nam"}`,
        badge: roomCode !== "—" ? `Phòng ${roomCode}` : "",
        studentCode: s.studentCode,
        fullName: s.fullName,
      };
    });
  }, [residentStudents, catalog.data?.rooms]);

  // Tự động tính toán các chu kỳ hợp lệ cho sinh viên:
  // Luôn bắt đầu vào ngày 01 của các tháng tiếp theo trong thời hạn lưu trú
  const cycleOptions = useMemo(() => {
    if (!selectedStudent?.stay) return [];
    const stay = selectedStudent.stay;
    const start = new Date(`${stay.startDate}T00:00:00Z`);
    // Chu kỳ sớm nhất sau ngày vào ở (ngày 01 tháng sau ngày startDate)
    const firstCycle = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1),
    );
    const plannedEnd = stay.plannedEndDate || "9999-12-31";
    const todayStr = new Date().toISOString().slice(0, 10);
    const nextCycleFromToday = getNextCycleStartDate(todayStr);

    const options = [];
    let cur = new Date(firstCycle);
    let count = 0;
    while (cur.toISOString().slice(0, 10) <= plannedEnd && count < 24) {
      count++;
      const val = cur.toISOString().slice(0, 10);
      const [y, m] = val.split("-");
      const isNextCycle = val === nextCycleFromToday;
      options.push({
        value: val,
        label: `Kỳ ${m}/${y} (Hiệu lực từ 01/${m}/${y})${isNextCycle ? " ★ Chu kỳ kế tiếp hiện tại" : ""}`,
        isNextCycle,
      });
      cur.setUTCMonth(cur.getUTCMonth() + 1);
    }
    return options;
  }, [selectedStudent]);

  // Helper chọn chu kỳ mặc định phù hợp nhất
  const getDefaultCycle = (opts) => {
    if (!opts || !opts.length) return "";
    const matched = opts.find((o) => o.isNextCycle);
    if (matched) return matched.value;
    const todayStr = new Date().toISOString().slice(0, 10);
    const upcoming = opts.find((o) => o.value >= todayStr);
    if (upcoming) return upcoming.value;
    return opts[0].value;
  };

  // Tự động cập nhật ngày chuyển phòng theo chu kỳ mới khi đổi sinh viên
  useEffect(() => {
    if (cycleOptions.length > 0) {
      if (!cycleOptions.some((o) => o.value === transferDate)) {
        setTransferDate(getDefaultCycle(cycleOptions));
      }
    }
  }, [cycleOptions]);

  // Tự động lọc phòng phù hợp cho sinh viên:
  // - Khác phòng hiện tại của sinh viên
  // - Chỉ cho phép phòng CÙNG CẤP (cùng loại phòng / roomTypeId)
  // - Đúng giới tính (hoặc loại phòng ANY)
  // - Còn chỗ trống (vacant > 0)
  // - Phòng và tòa nhà đang ACTIVE
  const availableRooms = useMemo(() => {
    if (!catalog.data?.rooms || !selectedStudent) return [];
    const currentRoomId =
      selectedStudent.stay?.roomId ||
      selectedStudent.roomId ||
      selectedStudent.room?.id;
    const currentRoom = (catalog.data?.rooms || []).find(
      (r) => r.id === currentRoomId,
    );
    const currentRoomTypeId =
      currentRoom?.roomTypeId ||
      currentRoom?.roomType?.id ||
      selectedStudentRoom?.roomTypeId ||
      selectedStudentRoom?.roomType?.id;

    return catalog.data.rooms.filter((r) => {
      if (r.status !== "ACTIVE" || r.building?.status !== "ACTIVE")
        return false;
      if (r.id === currentRoomId) return false;
      if (r.vacant <= 0) return false;
      const roomGender = r.roomType?.gender;
      if (
        roomGender &&
        roomGender !== "ANY" &&
        roomGender !== selectedStudent.gender
      )
        return false;
      // Chỉ cho phép chuyển sang phòng cùng cấp
      if (
        currentRoomTypeId &&
        r.roomTypeId !== currentRoomTypeId &&
        r.roomType?.id !== currentRoomTypeId
      )
        return false;
      return true;
    });
  }, [catalog.data?.rooms, selectedStudent, selectedStudentRoom]);

  const roomOptions = useMemo(() => {
    return availableRooms.map((r) => ({
      value: r.id,
      label: `Phòng ${r.code} · ${r.building?.name || ""}`,
      sublabel: `${r.roomType?.name || ""} · Còn ${r.vacant} chỗ trống · ${money(r.roomType?.fee || 0)}/tháng`,
      badge: `Còn ${r.vacant} chỗ`,
      code: r.code,
    }));
  }, [availableRooms]);

  const selectedRoom = useMemo(() => {
    return availableRooms.find((r) => r.id === roomId);
  }, [availableRooms, roomId]);

  const handleSelectStudent = (newId) => {
    setStudentId(newId);
    setRoomId(""); // Reset phòng mới khi đổi sinh viên
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!studentId) {
      setError("Vui lòng chọn sinh viên cần chuyển phòng.");
      return;
    }
    if (!roomId) {
      setError("Vui lòng chọn phòng mới chuyển đến.");
      return;
    }
    if (!transferDate) {
      setError("Vui lòng nhập ngày chuyển phòng.");
      return;
    }
    if (!reason.trim()) {
      setError("Vui lòng nhập lý do chuyển phòng.");
      return;
    }

    if (
      !window.confirm(
        `Xác nhận chuyển sinh viên ${selectedStudent?.fullName} (${selectedStudent?.studentCode}) từ phòng ${selectedStudentRoom?.code || "cũ"} sang phòng ${selectedRoom?.code} kể từ ngày ${transferDate}?`,
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");
    try {
      await api("/transfers", {
        method: "POST",
        body: {
          studentId,
          roomId,
          date: transferDate,
          reason: reason.trim(),
        },
      });
      onSuccess();
    } catch (err) {
      setError(err.message || "Không thể thực hiện chuyển phòng.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Chuyển phòng sinh viên" onClose={onClose}>
      <form
        onSubmit={handleSave}
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        {/* Bước 1: Nhập mã sinh viên hoặc tên để hệ thống tự lọc dropdown */}
        <div className="field">
          <span>
            Sinh viên đang ở KTX <em>*</em>
          </span>
          <SearchableSelect
            name="studentId"
            value={studentId}
            onChange={handleSelectStudent}
            options={studentOptions}
            placeholder="Nhập mã sinh viên (MSSV), họ tên hoặc số phòng..."
            emptyText="Không tìm thấy sinh viên đang ở phù hợp"
          />
        </div>

        {/* Thẻ hiển thị tóm tắt thông tin sinh viên đã chọn */}
        {selectedStudent && (
          <div
            style={{
              padding: "12px 14px",
              background: "#f0f7f9",
              border: "1px solid #d4e7ec",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "6px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <strong style={{ color: "#1f3a46", fontSize: "14.5px" }}>
                  {selectedStudent.fullName}
                </strong>
                <span className="badge">{selectedStudent.studentCode}</span>
                <span className="badge badge-subtle">
                  {selectedStudent.gender === "FEMALE" ? "Nữ" : "Nam"}
                </span>
              </div>
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "#486574",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "4px",
                marginTop: "4px",
              }}
            >
              <div>
                <strong>Phòng hiện tại:</strong>{" "}
                {selectedStudentRoom?.code || "—"}
                {selectedStudentRoom?.building?.name
                  ? ` (${selectedStudentRoom.building.name})`
                  : ""}
              </div>
              <div>
                <strong>Loại phòng:</strong>{" "}
                {selectedStudentRoom?.roomType?.name || "—"}
              </div>
              <div>
                <strong>Thời hạn lưu trú:</strong>{" "}
                {date(selectedStudent.stay?.startDate)} →{" "}
                {date(selectedStudent.stay?.plannedEndDate)}
              </div>
              {selectedStudent.phone && (
                <div>
                  <strong>SĐT:</strong> {selectedStudent.phone}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bước 2: Chọn phòng mới phù hợp giới tính và cùng cấp */}
        <div className="field">
          <span>
            Phòng mới chuyển đến <em>*</em>
          </span>
          {!selectedStudent ? (
            <div
              style={{
                padding: "10px 12px",
                background: "#fafbfb",
                border: "1px dashed #cfdcde",
                borderRadius: "8px",
                color: "#8fa3ae",
                fontSize: "13.5px",
              }}
            >
              Vui lòng chọn sinh viên ở trên trước để hệ thống tự lọc danh sách
              phòng cùng cấp và phù hợp theo giới tính.
            </div>
          ) : availableRooms.length === 0 ? (
            <div className="inline-error" style={{ margin: 0 }}>
              Hiện không có phòng nào cùng cấp (
              <strong>
                {selectedStudentRoom?.roomType?.name || "cùng loại"}
              </strong>
              ) phù hợp giới tính (
              {selectedStudent.gender === "FEMALE" ? "Nữ" : "Nam"}) còn chỗ
              trống.
            </div>
          ) : (
            <SearchableSelect
              name="roomId"
              value={roomId}
              onChange={(newId) => setRoomId(newId)}
              options={roomOptions}
              placeholder="Nhập mã phòng hoặc tên tòa nhà"
              emptyText="Không tìm thấy phòng phù hợp cùng cấp"
            />
          )}
        </div>

        {/* Thẻ hiển thị thông tin phòng mới đã chọn */}
        {selectedRoom && (
          <div
            style={{
              padding: "10px 14px",
              background: "#f4fbf7",
              border: "1px solid #ccebda",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#28533e",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div>
              <strong>Phòng {selectedRoom.code}</strong> ·{" "}
              {selectedRoom.building?.name} · {selectedRoom.roomType?.name}
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span className="badge badge-success">
                Còn {selectedRoom.vacant} chỗ
              </span>
              <strong>{money(selectedRoom.roomType?.fee)}/tháng</strong>
            </div>
          </div>
        )}

        {/* Thông báo nếu sinh viên đang ở tháng cuối và không còn chu kỳ kế tiếp */}
        {selectedStudent && cycleOptions.length === 0 && (
          <div className="inline-error" style={{ margin: 0 }}>
            ⚠️ Lượt lưu trú của sinh viên sẽ kết thúc vào ngày{" "}
            <strong>{date(selectedStudent.stay?.plannedEndDate)}</strong>. Hiện
            không còn chu kỳ mới trong thời hạn này để chuyển phòng. Sinh viên
            vui lòng thực hiện Gia hạn hoặc Đăng ký phòng mới.
          </div>
        )}

        {/* Bước 3: Ngày chuyển (Tự động theo chu kỳ mới của sinh viên) */}
        <div className="field">
          <span>
            Kỳ chuyển phòng có hiệu lực <em>*</em>
          </span>
          {selectedStudent && cycleOptions.length > 0 ? (
            <select
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: "1px solid #cfdcde",
                fontSize: "14px",
                fontWeight: 600,
                color: "#1f3a46",
                background: "#fff",
              }}
            >
              {cycleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="date"
              required
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              disabled={selectedStudent && cycleOptions.length === 0}
            />
          )}
          <small
            style={{
              color: "#6b7280",
              fontSize: "12.5px",
              marginTop: "4px",
              display: "block",
            }}
          >
            ℹ️ Chuyển phòng có hiệu lực từ ngày 01 của chu kỳ kế tiếp để thuận
            tiện cho việc chốt số điện nước và lập hóa đơn riêng biệt từng phòng
            cũ và phòng mới.
          </small>
        </div>

        {/* Bước 4: Lý do chuyển */}
        <div className="field">
          <span>
            Lý do chuyển phòng <em>*</em>
          </span>
          <textarea
            required
            rows={3}
            placeholder="Nhập lý do điều chuyển (VD: Chuyển theo nguyện vọng ở cùng bạn cùng lớp, điều chỉnh sức chứa...)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {error && (
          <div className="inline-error" style={{ margin: 0 }}>
            {error}
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: "10px" }}>
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
            disabled={
              busy ||
              !studentId ||
              !roomId ||
              !reason.trim() ||
              (selectedStudent && cycleOptions.length === 0)
            }
          >
            {busy ? "Đang xử lý..." : "Xác nhận chuyển phòng"}
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Đây là ghi chú mẫu: Trang quản lý chuyển phòng của nhân viên KTX
function TransfersPage() {
  const [page, setPage] = useState(1),
    [search, setSearch] = useState("");
  const data = useLoad(
      `/transfers?page=${page}&search=${encodeURIComponent(search)}`,
    ),
    students = useLoad("/students?limit=500"),
    cat = useLoad("/catalog");
  const [show, setShow] = useState(false),
    [message, notice, clear] = useNotice();

  const handleTransferSuccess = () => {
    setShow(false);
    data.load();
    students.load();
    cat.load();
    notice("Đã chuyển phòng và cập nhật số chỗ trống thành công.");
  };

  return (
    <>
      <PageTitle
        kicker="ĐIỀU PHỐI LƯU TRÚ"
        title="Chuyển phòng"
        description="Bố trí phòng mới và lưu lại lịch sử chuyển phòng."
        action={
          <button
            className="button button-primary"
            onClick={() => setShow(true)}
          >
            <Plus size={17} />
            Tạo lượt chuyển
          </button>
        }
      />
      <Section title="Lịch sử chuyển phòng">
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
        {data.data?.items?.length ? (
          <>
            <Table
              items={data.data.items}
              columns={[
                {
                  key: "student",
                  label: "Sinh viên",
                  render: (x) => x.student?.fullName,
                },
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
              ]}
            />
            <Pager data={data.data} page={page} setPage={setPage} />
          </>
        ) : (
          <Empty icon={DoorOpen} />
        )}
      </Section>
      {show && (
        <TransferModal
          onClose={() => setShow(false)}
          onSuccess={handleTransferSuccess}
          students={students}
          catalog={cat}
        />
      )}
      <Toast message={message} onClose={() => clear(null)} />
    </>
  );
}

export default TransfersPage;
