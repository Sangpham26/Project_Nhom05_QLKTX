import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Users,
  Plus,
  RotateCw,
  CheckCircle2,
  ShieldCheck,
  X,
  Search,
  Filter,
  Check,
  AlertTriangle,
  Lock,
  Unlock,
  KeyRound,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { api, date, dateTime, labels } from "../services/api";
import { badge } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";
import { useLoad, useNotice } from "../hooks/useLoad";
import {
  PageTitle,
  SearchBar,
  StatusSelect,
  Loading,
  Table,
  Pager,
  Empty,
  Section,
  Modal,
  Confirm,
  Toast,
  Form,
} from "../components/common";

function CreateUserModal({ onClose, onCreated }) {
  const [role, setRole] = useState("STUDENT");
  const [code, setCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("MALE");
  const [faculty, setFaculty] = useState("Công nghệ thông tin");
  const [course, setCourse] = useState("K21");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const fetchCode = async (selectedRole) => {
    setCodeLoading(true);
    try {
      const res = await api(`/users/next-code?role=${selectedRole}`);
      if (res?.code) {
        setCode(res.code);
      }
    } catch {
      // nếu lỗi mạng, cho phép người dùng tự điền
    } finally {
      setCodeLoading(false);
    }
  };

  useEffect(() => {
    fetchCode(role);
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) return setError("Vui lòng nhập email đăng nhập.");
    if (!fullName.trim()) return setError("Vui lòng nhập họ và tên.");
    if (!password || password.length < 8)
      return setError("Mật khẩu cần ít nhất 8 ký tự.");
    if (password !== confirmPassword)
      return setError("Mật khẩu xác nhận không khớp.");

    setBusy(true);
    try {
      await api("/users", {
        method: "POST",
        body: {
          role,
          code: code.trim(),
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          confirmPassword,
          phone: phone.trim(),
          ...(role === "STUDENT" ? { gender, faculty, course } : {}),
        },
      });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Thêm tài khoản người dùng mới" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field">
            <label className="field-label">
              Vai trò người dùng <span className="field-req">*</span>
            </label>
            <select
              className="field-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="STUDENT">Sinh viên</option>
              <option value="STAFF">Nhân viên KTX</option>
              <option value="ADMIN">Quản trị viên</option>
            </select>
          </div>

          <div className="field">
            <label
              className="field-label"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>
                Mã định danh <span className="field-req">*</span>
              </span>
              <button
                type="button"
                onClick={() => fetchCode(role)}
                title="Tải lại mã tiếp theo từ hệ thống"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#2563eb",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                <RotateCw
                  size={12}
                  style={
                    codeLoading
                      ? {
                          animation: "spin 1s linear infinite",
                        }
                      : {}
                  }
                />
                Làm mới mã
              </button>
            </label>
            <input
              className="field-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={codeLoading ? "Đang sinh mã..." : "Mã định danh"}
              required
            />
            <span
              className="field-hint"
              style={{
                fontSize: "12px",
                color: "var(--muted)",
                marginTop: "4px",
                display: "block",
              }}
            ></span>
          </div>

          <div className="field">
            <label className="field-label">
              Họ và tên <span className="field-req">*</span>
            </label>
            <input
              className="field-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ và tên đầy đủ"
              required
            />
          </div>

          <div className="field">
            <label className="field-label">
              Email đăng nhập <span className="field-req">*</span>
            </label>
            <input
              className="field-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ví dụ: user@ktx.edu.vn"
              required
            />
          </div>

          <div className="field">
            <label className="field-label">
              Mật khẩu <span className="field-req">*</span>
            </label>
            <input
              className="field-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 8 ký tự"
              required
              minLength={8}
            />
            <span
              className="field-hint"
              style={{ fontSize: "12px", color: "var(--muted)" }}
            >
              Tối thiểu 8 ký tự.
            </span>
          </div>

          <div className="field">
            <label className="field-label">
              Xác nhận mật khẩu <span className="field-req">*</span>
            </label>
            <input
              className="field-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              required
              minLength={8}
            />
          </div>

          <div className="field">
            <label className="field-label">Số điện thoại</label>
            <input
              className="field-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Số điện thoại liên hệ"
            />
          </div>

          {role === "STUDENT" && (
            <>
              <div className="field">
                <label className="field-label">Giới tính</label>
                <select
                  className="field-input"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                </select>
              </div>

              <div className="field">
                <label className="field-label">Khoa</label>
                <input
                  className="field-input"
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field-label">Khóa học</label>
                <input
                  className="field-input"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="inline-error" style={{ marginTop: "12px" }}>
            {error}
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: "20px" }}>
          <button
            type="button"
            className="button button-ghost"
            onClick={onClose}
            disabled={busy}
          >
            Hủy
          </button>
          <button className="button button-primary" disabled={busy}>
            {busy ? "Đang lưu..." : "Lưu thông tin"}
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}

function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roles, setRoles] = useState([]);
  const toggleRole = (r) => {
    setRoles((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    );
    setPage(1);
  };
  const [newModal, setNewModal] = useState(false);
  const [pwdModal, setPwdModal] = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [message, notice, clear] = useNotice();

  const roleQuery = roles.length ? `&role=${roles.join(",")}` : "";
  const data = useLoad(
    `/users?page=${page}&search=${encodeURIComponent(search)}${roleQuery}`,
    [page, search, roles],
  );

  const handleResetPassword = async (v) => {
    if (!v.password || v.password.length < 8)
      throw new Error("Mật khẩu mới cần ít nhất 8 ký tự.");
    if (v.password !== v.confirmPassword)
      throw new Error("Mật khẩu xác nhận không khớp.");
    await api(`/users/${pwdModal.id}/password`, {
      method: "PATCH",
      body: { password: v.password },
    });
    setPwdModal(null);
    notice(`Đã đổi mật khẩu cho tài khoản ${pwdModal.email} thành công.`);
  };

  const handleToggleStatus = async () => {
    const nextActive = !statusModal.active;
    await api(`/users/${statusModal.id}/status`, {
      method: "PATCH",
      body: { active: nextActive },
    });
    setStatusModal(null);
    data.load();
    notice(
      nextActive
        ? `Đã kích hoạt tài khoản ${statusModal.email}.`
        : `Đã khóa tài khoản ${statusModal.email}.`,
    );
  };

  const handleDeleteUser = async () => {
    if (!deleteModal) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await api(`/users/${deleteModal.id}`, { method: "DELETE" });
      const targetEmail = deleteModal.email;
      setDeleteModal(null);
      data.load();
      notice(`Đã xóa vĩnh viễn tài khoản ${targetEmail} thành công.`);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <>
      <PageTitle
        kicker="QUẢN TRỊ HỆ THỐNG"
        title="Quản lý tài khoản & mật khẩu"
        description="Xem danh sách, đặt lại mật khẩu và phân quyền toàn bộ tài khoản Sinh viên, Nhân viên, Quản trị viên."
        action={
          <button
            className="button button-primary"
            onClick={() => setNewModal(true)}
          >
            <Plus size={17} />
            Thêm tài khoản
          </button>
        }
      />

      <Section title="Danh sách tài khoản hệ thống">
        {/* Đây là ghi chú mẫu: Khung tìm kiếm và bộ lọc vai trò to, thiết kế ngang hàng, rõ ràng cho Quản trị viên */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "16px",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div className="search-bar" style={{ marginBottom: 0 }}>
              <div className="search-input">
                <Search size={18} />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Tìm theo email, họ tên, MSSV, mã NV..."
                  style={{
                    height: "46px",
                    fontSize: "14px",
                    borderRadius: "10px",
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              background: "var(--surface)",
              height: "46px",
              padding: "0 18px",
              borderRadius: "10px",
              border: "1.5px solid var(--border)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <span
              style={{
                fontSize: "13.5px",
                fontWeight: 700,
                color: "var(--text)",
                whiteSpace: "nowrap",
              }}
            >
              Lọc vai trò:
            </span>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13.5px",
                fontWeight: 600,
                cursor: "pointer",
                userSelect: "none",
                color: "var(--text)",
              }}
            >
              <input
                type="checkbox"
                checked={roles.includes("STUDENT")}
                onChange={() => toggleRole("STUDENT")}
                style={{
                  width: "16px",
                  height: "16px",
                  cursor: "pointer",
                  accentColor: "#222222",
                }}
              />
              Sinh viên
            </label>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13.5px",
                fontWeight: 600,
                cursor: "pointer",
                userSelect: "none",
                color: "var(--text)",
              }}
            >
              <input
                type="checkbox"
                checked={roles.includes("STAFF")}
                onChange={() => toggleRole("STAFF")}
                style={{
                  width: "16px",
                  height: "16px",
                  cursor: "pointer",
                  accentColor: "#222222",
                }}
              />
              Nhân viên
            </label>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13.5px",
                fontWeight: 600,
                cursor: "pointer",
                userSelect: "none",
                color: "var(--text)",
              }}
            >
              <input
                type="checkbox"
                checked={roles.includes("ADMIN")}
                onChange={() => toggleRole("ADMIN")}
                style={{
                  width: "16px",
                  height: "16px",
                  cursor: "pointer",
                  accentColor: "#222222",
                }}
              />
              Admin
            </label>
          </div>
        </div>

        {data.data?.items?.length ? (
          <>
            <Table
              items={data.data.items}
              columns={[
                {
                  key: "code",
                  label: "Mã định danh",
                  render: (x) => <strong>{x.code}</strong>,
                },
                { key: "fullName", label: "Họ và tên" },
                {
                  key: "email",
                  label: "Email đăng nhập",
                  render: (x) => <span className="staff-email">{x.email}</span>,
                },
                {
                  key: "role",
                  label: "Vai trò",
                  render: (x) => {
                    const rMap = {
                      ADMIN: { text: "Quản trị viên", color: "#6366f1" },
                      STAFF: { text: "Nhân viên", color: "#2563eb" },
                      STUDENT: { text: "Sinh viên", color: "#8b5cf6" },
                    };
                    const item = rMap[x.role] || {
                      text: x.role,
                      color: "var(--muted)",
                    };
                    return (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "var(--text)",
                        }}
                      >
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: item.color,
                          }}
                        />
                        {item.text}
                      </span>
                    );
                  },
                },
                {
                  key: "active",
                  label: "Trạng thái",
                  render: (x) => (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: x.active ? "#16a34a" : "#dc2626",
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: x.active ? "#16a34a" : "#dc2626",
                        }}
                      />
                      {x.active ? "Đang hoạt động" : "Đã khóa"}
                    </span>
                  ),
                },
                {
                  key: "actions",
                  label: "Thao tác",
                  render: (x) => (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        className="button button-secondary button-small"
                        onClick={() => setPwdModal(x)}
                        style={{ fontSize: "12px", padding: "4px 10px" }}
                      >
                        Đổi mật khẩu
                      </button>
                      <button
                        type="button"
                        className="button button-secondary button-small"
                        onClick={() => setStatusModal(x)}
                        style={{
                          fontSize: "12px",
                          padding: "4px 10px",
                          color: x.active ? "#dc2626" : "#16a34a",
                        }}
                      >
                        {x.active ? "Khóa" : "Kích hoạt"}
                      </button>
                      <button
                        type="button"
                        className="button button-secondary button-small"
                        onClick={() => {
                          setDeleteModal(x);
                          setDeleteError("");
                        }}
                        style={{
                          fontSize: "12px",
                          padding: "4px 10px",
                          color: "#dc2626",
                          borderColor: "rgba(220, 38, 38, 0.25)",
                        }}
                        title="Xóa tài khoản vĩnh viễn"
                      >
                        Xóa
                      </button>
                    </div>
                  ),
                },
              ]}
            />
            <Pager data={data.data} page={page} setPage={setPage} />
          </>
        ) : (
          <Empty title="Không tìm thấy tài khoản nào phù hợp" />
        )}
      </Section>

      {/* Modal Đổi mật khẩu */}
      {pwdModal && (
        <Modal
          title={`Đặt lại mật khẩu cho ${pwdModal.fullName}`}
          onClose={() => setPwdModal(null)}
        >
          <Form
            fields={() => [
              {
                label: "Mật khẩu mới",
                name: "password",
                type: "password",
                required: true,
                minLength: 8,
                hint: "Tối thiểu 8 ký tự.",
              },
              {
                label: "Xác nhận mật khẩu",
                name: "confirmPassword",
                type: "password",
                required: true,
                minLength: 8,
              },
            ]}
            onSave={handleResetPassword}
            onCancel={() => setPwdModal(null)}
          />
        </Modal>
      )}

      {/* Modal Khóa / Mở khóa tài khoản */}
      {statusModal && (
        <Confirm
          title={
            statusModal.active ? "Khóa tài khoản" : "Kích hoạt lại tài khoản"
          }
          detail={`Bạn có chắc chắn muốn ${statusModal.active ? "khóa" : "kích hoạt lại"} tài khoản ${statusModal.fullName} (${statusModal.email}) không? Khi bị khóa, người dùng sẽ bị đăng xuất ngay lập tức.`}
          onConfirm={handleToggleStatus}
          onClose={() => setStatusModal(null)}
        />
      )}

      {/* Modal Xóa tài khoản vĩnh viễn (có kiểm tra ràng buộc an toàn) */}
      {deleteModal && (
        <Modal
          title="Xác nhận xóa tài khoản"
          onClose={() => {
            if (!deleteBusy) {
              setDeleteModal(null);
              setDeleteError("");
            }
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <p
              style={{
                fontSize: "14.5px",
                color: "var(--text)",
                lineHeight: "1.6",
                margin: "0 0 12px",
              }}
            >
              Bạn có chắc chắn muốn xóa tài khoản{" "}
              <strong>{deleteModal.fullName}</strong> ({deleteModal.email}) -
              Mã: <strong>{deleteModal.code}</strong> không?
            </p>
            <div
              style={{
                background: "#fff1f2",
                border: "1px solid #fecdd3",
                borderRadius: "8px",
                padding: "12px 14px",
                color: "#9f1239",
                fontSize: "13px",
                lineHeight: "1.55",
              }}
            >
              <strong>Kiểm tra an toàn dữ liệu:</strong>
              <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
                <li>
                  Hệ thống tự động kiểm tra toàn bộ hoạt động (hợp đồng lưu trú
                  phòng, hóa đơn chưa thanh toán, hồ sơ đăng ký phòng chờ duyệt,
                  yêu cầu hỗ trợ).
                </li>
                <li>
                  Nếu còn ràng buộc nghiệp vụ, hệ thống sẽ từ chối xóa để tránh
                  phát sinh lỗi dữ liệu mồ côi.
                </li>
                <li>
                  Nếu xóa thành công, tài khoản sẽ bị đăng xuất ngay lập tức nếu
                  đang đăng nhập.
                </li>
              </ul>
            </div>
            {deleteError && (
              <div className="inline-error" style={{ marginTop: "12px" }}>
                {deleteError}
              </div>
            )}
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="button button-ghost"
              onClick={() => {
                setDeleteModal(null);
                setDeleteError("");
              }}
              disabled={deleteBusy}
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
              disabled={deleteBusy}
              onClick={handleDeleteUser}
            >
              <Trash2 size={15} />
              {deleteBusy ? "Đang kiểm tra và xóa..." : "Xác nhận xóa"}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal Thêm tài khoản mới */}
      {newModal && (
        <CreateUserModal
          onClose={() => setNewModal(false)}
          onCreated={() => {
            setNewModal(false);
            data.load();
            notice("Đã tạo tài khoản mới thành công.");
          }}
        />
      )}

      <Toast message={message} onClose={() => clear(null)} />
    </>
  );
}

// Giữ lại alias StaffPage để tương thích các tham chiếu cũ
function StaffPage() {
  return <UsersPage />;
}

export { CreateUserModal, StaffPage };
export default UsersPage;
