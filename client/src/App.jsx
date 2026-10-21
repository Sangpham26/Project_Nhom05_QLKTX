import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  Bell,
  BedDouble,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  DoorOpen,
  FileText,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { api, money, date, labels } from "./api";
import RoomTypeEditor from './RoomTypeEditor';
import RoomGallery, { coverOf } from './RoomGallery';
import WireframePage from './WireframePage';
import LandingPage from './LandingPage';
import LandingNav from './landing/LandingNav';
import ContactPage from './ContactPage';

const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);
const badge = (value) => (
  <span className={`badge badge-${String(value || "").toLowerCase()}`}>
    {labels[value] || value || "—"}
  </span>
);
const Text = ({ children }) => <span className="muted">{children || "—"}</span>;
const durationOptions = [1, 3, 6, 12].map((months) => ({
  value: String(months), label: `${months} tháng`,
}));
function endAfterMonths(startDate, months) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate || "") || ![1, 3, 6, 12].includes(Number(months))) return "";
  const start = new Date(`${startDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== startDate) return "";
  const target = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + Number(months), 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(start.getUTCDate(), lastDay));
  return target.toISOString().slice(0, 10);
}

function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className={`toast ${message.type}`}>
      <span>
        {message.type === "error" ? (
          <X size={18} />
        ) : (
          <CheckCircle2 size={18} />
        )}
      </span>
      {message.text}
      <button onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
}
function useNotice() {
  const [message, setMessage] = useState(null);
  const notice = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };
  return [message, notice, setMessage];
}
function useLoad(path, deps = []) {
  const [data, setData] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const load = () => {
    setLoading(true);
    setError("");
    api(path)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, [path, ...deps]);
  return { data, loading, error, load };
}
function Loading() {
  return (
    <div className="loading">
      <div className="spinner" />
      Đang tải dữ liệu...
    </div>
  );
}
function Empty({
  icon: Icon = ClipboardList,
  title = "Chưa có dữ liệu",
  detail,
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon size={25} />
      </div>
      <strong>{title}</strong>
      <p>{detail || "Dữ liệu sẽ xuất hiện tại đây khi được tạo."}</p>
    </div>
  );
}
function Modal({ title, children, onClose, wide = false }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className={`modal ${wide ? "modal-wide" : ""}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">NHÓM 05</span>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Confirm({ title, detail, onConfirm, onClose, busy }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="confirm-detail">{detail}</p>
      <div className="modal-actions">
        <button className="button button-ghost" onClick={onClose}>
          Hủy
        </button>
        <button
          className="button button-primary"
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? "Đang xử lý..." : "Xác nhận"}
        </button>
      </div>
    </Modal>
  );
}
function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  options,
  required = false,
  placeholder,
  min,
  step,
  rows,
  hint,
  minLength,
  maxLength,
  autoComplete,
}) {
  const [fieldError, setFieldError] = useState("");
  const change = (event) => {
    setFieldError("");
    onChange(event);
  };
  const invalid = (event) => {
    event.preventDefault();
    setFieldError(
      event.target.validity.typeMismatch
        ? `${label} không hợp lệ.`
        : `Vui lòng kiểm tra ${label.toLowerCase()}.`,
    );
  };
  return (
    <label className="field">
      <span>
        {label}
        {required && <em>*</em>}
      </span>
      {options ? (
        <select
          name={name}
          value={value ?? ""}
          onChange={change}
          onInvalid={invalid}
          required={required}
        >
          <option value="">Chọn {label.toLowerCase()}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : rows ? (
        <textarea
          name={name}
          value={value ?? ""}
          onChange={change}
          onInvalid={invalid}
          required={required}
          placeholder={placeholder}
          rows={rows}
        />
      ) : (
        <input
          name={name}
          value={value ?? ""}
          onChange={change}
          onInvalid={invalid}
          type={type}
          required={required}
          placeholder={placeholder}
          min={min}
          step={step}
          minLength={minLength}
          maxLength={maxLength}
          autoComplete={autoComplete}
        />
      )}{" "}
      {hint && <small>{hint}</small>}
      {fieldError && <small className="field-error">{fieldError}</small>}
    </label>
  );
}
function Form({
  fields,
  initial = {},
  onSave,
  onCancel,
  submit = "Lưu thông tin",
  children,
  resetOnChange = {},
  className = "",
}) {
  const [values, setValues] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const change = (e) => {
    const { name, value } = e.target;
    setValues((previous) => {
      const next = { ...previous, [name]: value };
      for (const field of resetOnChange[name] || []) next[field] = "";
      return next;
    });
  };
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave(values);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={save} className={className}>
      <div className="form-grid">
        {(typeof fields === "function" ? fields(values) : fields).map((f) => (
          <Field key={f.name} {...f} value={values[f.name]} onChange={change} />
        ))}
      </div>
      {typeof children === "function" ? children(values) : children}
      {error && <div className="inline-error">{error}</div>}
      <div className="modal-actions">
        <button
          type="button"
          className="button button-ghost"
          onClick={onCancel}
        >
          Hủy
        </button>
        <button className="button button-primary" disabled={busy}>
          {busy ? "Đang lưu..." : submit}
          <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}
function Table({ columns, items, onRow }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
            {onRow && <th />}
          </tr>
        </thead>
        <tbody>
          {items.map((row, i) => (
            <tr
              key={row.id || i}
              onClick={onRow ? () => onRow(row) : undefined}
              className={onRow ? "clickable" : ""}
            >
              {columns.map((c) => (
                <td key={c.key}>
                  {c.render ? c.render(row) : (row[c.key] ?? "—")}
                </td>
              ))}
              {onRow && (
                <td className="row-arrow">
                  <ArrowRight size={16} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Pager({ data, page, setPage }) {
  if (!data || data.pages <= 1) return null;
  return (
    <div className="pager">
      <span>
        Trang {data.page} / {data.pages} · {data.total} mục
      </span>
      <div>
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
          <ChevronLeft size={18} />
        </button>
        <button disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
function PageTitle({ kicker, title, description, action }) {
  return (
    <div className="page-title">
      <div>
        <span className="eyebrow">{kicker || "QUẢN LÝ KÝ TÚC XÁ"}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="title-action">{action}</div>}
    </div>
  );
}
function SearchBar({ value, onChange, placeholder = "Tìm kiếm...", children }) {
  return (
    <div className="search-bar">
      <div className="search-input">
        <Search size={18} />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
      {children}
    </div>
  );
}
function StatusSelect({ value, onChange }) {
  return (
    <select
      className="small-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Tất cả trạng thái</option>
      {[
        "PENDING",
        "REVIEWING",
        "NEEDS_INFO",
        "APPROVED",
        "REJECTED",
        "ACTIVE",
        "ENDED",
        "UNPAID",
        "PARTIAL",
        "PAID",
        "OVERDUE",
      ].map((x) => (
        <option key={x} value={x}>
          {labels[x]}
        </option>
      ))}
    </select>
  );
}
function Metric({ icon: Icon, label, value, foot, tone = "blue" }) {
  return (
    <div className="metric">
      <div className={`metric-icon ${tone}`}>
        <Icon size={21} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{foot}</small>
    </div>
  );
}
function Section({ title, subtitle, action, children }) {
  return (
    <section className="section-card">
      <div className="section-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

const navStudent = [
  { to: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { to: "/rooms", label: "Tra cứu phòng", icon: BedDouble },
  { to: "/applications", label: "Hồ sơ đăng ký", icon: ClipboardList },
  { to: "/stays", label: "Lưu trú của tôi", icon: DoorOpen },
  { to: "/requests", label: "Yêu cầu lưu trú", icon: FileText },
  { to: "/invoices", label: "Hóa đơn & thanh toán", icon: Wallet },
  { to: "/contact", label: "Liên hệ", icon: Phone },
];
const navStaff = [
  { to: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { to: "/applications", label: "Duyệt hồ sơ", icon: ClipboardList },
  { to: "/students", label: "Sinh viên nội trú", icon: Users },
  { to: "/requests", label: "Yêu cầu lưu trú", icon: FileText },
  { to: "/transfers", label: "Chuyển phòng", icon: DoorOpen },
  { to: "/rooms", label: "Vận hành phòng", icon: BedDouble },
  { to: "/readings", label: "Chỉ số điện nước", icon: Zap },
  { to: "/billing", label: "Lập khoản thu", icon: CircleDollarSign },
  { to: "/invoices", label: "Công nợ & thanh toán", icon: Wallet },
];
const navAdmin = [
  ...navStaff.slice(0, 1),
  { to: "/report", label: "Báo cáo", icon: LayoutDashboard },
  { to: "/buildings", label: "Tòa nhà", icon: Building2 },
  { to: "/room-types", label: "Loại phòng", icon: BedDouble },
  { to: "/rooms", label: "Phòng", icon: DoorOpen },
  { to: "/periods", label: "Kỳ thu", icon: ClipboardList },
  { to: "/pricing", label: "Đơn giá", icon: CircleDollarSign },
  { to: "/staff", label: "Nhân viên", icon: ShieldCheck },
  ...navStaff.slice(1).filter((item) => item.to !== "/rooms"),
];
function Shell({ children }) {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("ktx_sidebar_collapsed") === "1",
  );
  const [popover, setPopover] = useState(null);
  const [headerScrolled, setHeaderScrolled] = useState(() => window.scrollY > 18);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [workQueue, setWorkQueue] = useState({});
  const notificationSignature = useRef(null);
  const workSignature = useRef(null);
  const headerMenus = useRef(null);
  const location = useLocation();
  const staffRole = session.user.role === "STAFF" || session.user.role === "ADMIN";
  useEffect(() => {
    const update = () => setHeaderScrolled(window.scrollY > 18);
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  useEffect(() => {
    localStorage.setItem("ktx_sidebar_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);
  const refreshNotifications = () => {
    api("/notifications?limit=500")
      .then((data) => {
        const items = data.items || [];
        const totalUnread = data.unreadCount ?? items.filter((item) => !item.read).length;
        const signature = `${totalUnread}|${items.map((item) => `${item.id}:${item.read}`).join("|")}`;
        if (notificationSignature.current !== null && notificationSignature.current !== signature)
          window.dispatchEvent(new Event("inbox-changed"));
        notificationSignature.current = signature;
        setNotifications(items);
        setUnreadCount(totalUnread);
        setNotificationsError("");
      })
      .catch((error) => setNotificationsError(error.message))
      .finally(() => setNotificationsLoaded(true));
  };
  const refreshWorkQueue = () => {
    if (!staffRole) return;
    api("/work-queue").then((data) => {
      const signature = JSON.stringify(data);
      if (workSignature.current !== null && workSignature.current !== signature)
        window.dispatchEvent(new Event("work-queue-changed"));
      workSignature.current = signature;
      setWorkQueue(data);
    }).catch(() => {});
  };
  useEffect(() => {
    const refresh = () => { refreshNotifications(); refreshWorkQueue(); };
    refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 5000);
    window.addEventListener("focus", refresh);
    window.addEventListener("notifications-updated", refreshNotifications);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("notifications-updated", refreshNotifications);
    };
  }, [location.pathname, staffRole]);
  useEffect(() => {
    if (!popover) return;
    const closeOutside = (event) => {
      if (!headerMenus.current?.contains(event.target)) setPopover(null);
    };
    const closeEscape = (event) => {
      if (event.key === "Escape") setPopover(null);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [popover]);
  const markNotificationRead = async (item) => {
    if (item.read) return;
    try {
      await api(`/notifications/${item.id}/read`, { method: "PATCH" });
      setNotifications((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, read: true } : entry,
        ),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (error) {
      setNotificationsError(error.message);
    }
  };
  const openNotification = async (item) => {
    await markNotificationRead(item);
    setPopover(null);
    if (item.targetPath?.startsWith("/") && !item.targetPath.startsWith("//"))
      navigate(item.targetPath);
  };
  const nav =
    session.user.role === "STUDENT"
      ? navStudent
      : session.user.role === "ADMIN"
        ? navAdmin
        : navStaff;
  const pendingByPath = staffRole ? {
    "/applications": workQueue.applications || 0,
    "/requests": workQueue.requests || 0,
    "/readings": workQueue.readings || 0,
    "/billing": workQueue.billing || 0,
    "/invoices": workQueue.invoices || 0,
  } : {};
  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "open" : ""} ${collapsed && !open ? "collapsed" : ""}`}>
        <div className="sidebar-heading">
          <Link to="/" className="brand" aria-label="Nhóm 05, về trang chủ">
            <span className="brand-icon">
              <Building2 size={23} strokeWidth={2.4} />
            </span>
            <div>
              <strong>Nhóm 05</strong>
              <small>HỆ THỐNG KÝ TÚC XÁ</small>
            </div>
          </Link>
          <button
            type="button"
            className="icon-button sidebar-collapse"
            title={collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
            aria-label={collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        <div className="sidebar-caption">KHÔNG GIAN CỦA BẠN</div>
        <nav>
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? `${label}${pendingByPath[to] ? ` · ${pendingByPath[to]} chưa hoàn thành` : ""}` : undefined}
              aria-label={`${label}${pendingByPath[to] ? `, ${pendingByPath[to]} chưa hoàn thành` : ""}`}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon"><Icon size={18} />{pendingByPath[to] > 0 && <span className="nav-pending-dot" />}</span>
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="main-area">
        <header className={`topbar${headerScrolled ? " is-scrolled" : ""}`}>
          <button
            className="icon-button mobile-menu"
            onClick={() => setOpen(!open)}
          >
            <Menu size={21} />
          </button>
          <div className="breadcrumb">
            <Link to="/">Trang chủ</Link>
            <ChevronRight size={15} />
            <strong>Trang quản lý</strong>
          </div>
          <div className="top-actions" ref={headerMenus}>
            <span className="today">
              {new Date().toLocaleDateString("vi-VN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <div className="top-menu-wrap">
              <button
                type="button"
                className="top-icon top-icon-button"
                aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ""}`}
                aria-expanded={popover === "notifications"}
                aria-haspopup="dialog"
                onClick={() => {
                  setPopover((current) => current === "notifications" ? null : "notifications");
                  refreshNotifications();
                }}
              >
                <Bell size={19} />
                {unreadCount > 0 && <span className="notification-count">{unreadCount > 99 ? "99+" : unreadCount}</span>}
              </button>
              {popover === "notifications" && (
                <div className="top-popover notifications-popover" role="dialog" aria-label="Thông báo của bạn">
                  <div className="top-popover-head"><strong>Thông báo</strong><span>{unreadCount} chưa đọc</span></div>
                  <div className="top-popover-list">
                    {notificationsError && <p className="top-popover-message error">{notificationsError}</p>}
                    {!notificationsLoaded && <p className="top-popover-message">Đang tải thông báo...</p>}
                    {notificationsLoaded && !notifications.length && !notificationsError && <p className="top-popover-message">Chưa có thông báo.</p>}
                    {notifications.slice(0, 6).map((item) => (
                      <button type="button" key={item.id} className={`popover-notification ${item.read ? "read" : ""}`} onClick={() => openNotification(item)}>
                        <span className="popover-notification-icon"><Bell size={15} /></span>
                        <span className="popover-notification-copy"><strong>{item.title}</strong><span>{item.body}</span><small>{date(item.createdAt)}</small></span>
                        {!item.read && <span className="popover-unread-dot" />}
                      </button>
                    ))}
                  </div>
                  <Link to="/notifications" className="top-popover-footer" onClick={() => setPopover(null)}>Xem tất cả thông báo <ArrowRight size={15} /></Link>
                </div>
              )}
            </div>
            <div className="top-menu-wrap">
              <button type="button" className="top-avatar" aria-label="Mở menu tài khoản" aria-expanded={popover === "account"} aria-haspopup="menu" onClick={() => setPopover((current) => current === "account" ? null : "account")}>{session.profile?.fullName?.charAt(0) || "N"}</button>
              {popover === "account" && (
                <div className="top-popover account-popover" role="menu" aria-label="Tài khoản">
                  <div className="account-popover-user"><strong>{session.profile?.fullName || session.user.email}</strong><span>{labels[session.user.role]}</span></div>
                  <Link to="/profile" role="menuitem" onClick={() => setPopover(null)}><Users size={17} />Hồ sơ cá nhân</Link>
                  {session.user.role === "ADMIN" && <Link to="/wireframe" role="menuitem" onClick={() => setPopover(null)}><LayoutDashboard size={17} />Wireframe</Link>}
                  <button type="button" className="account-logout" role="menuitem" onClick={logout}><LogOut size={17} />Đăng xuất</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main>{children}</main>
      </div>
      {open && <div className="mobile-shade" onClick={() => setOpen(false)} />}
    </div>
  );
}

function HomePage() {
  const { session, logout } = useAuth();
  return <LandingPage session={session} onLogout={logout} />;
}

function AuthPage({ register = false }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ gender: "MALE" }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const change = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(register ? "/auth/register" : "/auth/login", form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="auth-page">
      <div className="auth-panel">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <Building2 size={23} />
          </span>
          <div>
            <strong>
              Nhóm 05
            </strong>
            <small>KÝ TÚC XÁ SINH VIÊN</small>
          </div>
        </Link>
        <div className="auth-content">
          <span className="eyebrow">
            {register ? "TÀI KHOẢN SINH VIÊN" : "QUẢN LÝ KÝ TÚC XÁ"}
          </span>
          <h1>
            {register ? "Tạo tài khoản sinh viên" : "Đăng nhập"}
          </h1>
          <p>
            {register
              ? "Điền thông tin để bắt đầu đăng ký chỗ ở KTX."
              : "Xem hồ sơ, thông tin lưu trú và hóa đơn của bạn."}
          </p>
          <form onSubmit={submit}>
            <div className="form-grid">
              {register && (
                <>
                  <Field
                    label="Mã số sinh viên"
                    name="studentCode"
                    value={form.studentCode}
                    onChange={change}
                    required
                  />
                  <Field
                    label="Họ và tên"
                    name="fullName"
                    value={form.fullName}
                    onChange={change}
                    required
                  />
                  <Field
                    label="Giới tính"
                    name="gender"
                    value={form.gender}
                    onChange={change}
                    required
                    options={[
                      { value: "MALE", label: "Nam" },
                      { value: "FEMALE", label: "Nữ" },
                      { value: "OTHER", label: "Khác" },
                    ]}
                  />
                  <Field
                    label="Số điện thoại"
                    name="phone"
                    value={form.phone}
                    onChange={change}
                  />
                </>
              )}
              <Field
                label="Email"
                name="email"
                value={form.email}
                onChange={change}
                type="email"
                required
              />
              <Field
                label="Mật khẩu"
                name="password"
                value={form.password}
                onChange={change}
                type="password"
                required
                hint={register ? "Tối thiểu 8 ký tự" : null}
              />
            </div>
            {error && <div className="inline-error">{error}</div>}
            <button
              className="button button-primary auth-submit"
              disabled={busy}
            >
              {busy
                ? "Đang xử lý..."
                : register
                  ? "Tạo tài khoản"
                  : "Đăng nhập"}
              <ArrowRight size={18} />
            </button>
          </form>
          <div className="auth-switch">
            {register ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
            <Link to={register ? "/login" : "/register"}>
              {register ? "Đăng nhập" : "Đăng ký ngay"}
            </Link>
          </div>
          {!register && (
            <div className="demo-note">
              <strong>Tài khoản demo</strong>
              <span>admin@ktx.demo · staff@ktx.demo · an@ktx.demo</span>
              <span>
                Mật khẩu chung: <b>Demo@123</b>
              </span>
            </div>
          )}
        </div>
        <div className="auth-footer">
          © {new Date().getFullYear()} Nhóm 05 · Quản lý ký túc xá sinh viên
        </div>
      </div>
      <div className="auth-visual">
        <div className="visual-top">
          NHÓM 05 · KÝ TÚC XÁ SINH VIÊN
        </div>
        <div className="visual-copy">
          <span>PHÒNG Ở VÀ LƯU TRÚ</span>
          <h2>Tìm phòng, <br />đăng ký và <br />theo dõi lưu trú.</h2>
          <p>Xem chỗ còn trống và quản lý hồ sơ trên cùng một hệ thống.</p>
        </div>
      </div>
    </div>
  );
}

function Guard({ roles, children, plain = false }) {
  const { session, ready } = useAuth();
  if (!ready) return <Loading />;
  if (!session) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(session.user.role))
    return <Navigate to="/dashboard" replace />;
  return plain ? children : <Shell>{children}</Shell>;
}
function Dashboard() {
  const { session } = useAuth();
  const role = session.user.role;
  const apps = useLoad("/applications?limit=5"),
    stays = useLoad("/stays?limit=10"),
    invoices = useLoad("/invoices?limit=100"),
    report = useLoad(role === "STUDENT" ? "/catalog" : "/report", []);
  const n = useLoad("/notifications?limit=5");
  useEffect(() => {
    const refresh = () => { apps.load(); stays.load(); invoices.load(); report.load(); n.load(); };
    window.addEventListener("work-queue-changed", refresh);
    window.addEventListener("inbox-changed", refresh);
    return () => {
      window.removeEventListener("work-queue-changed", refresh);
      window.removeEventListener("inbox-changed", refresh);
    };
  }, [role]);
  const first =
    role === "ADMIN"
      ? "quản trị viên"
      : session.profile?.fullName?.split(" ").at(-1) || "bạn";
  const active = stays.data?.items?.find((x) => x.status === "ACTIVE"),
    due =
      invoices.data?.items
        ?.filter((x) => x.balance > 0)
        .reduce((a, x) => a + x.balance, 0) || 0;
  return (
    <>
      <div className="welcome">
        <div>
          <span className="eyebrow">
            THỨ {new Date().getDay() + 1} · HÔM NAY
          </span>
          <h1>
            Xin chào, {first} <span>✳</span>
          </h1>
          <p>
            {role === "STUDENT"
              ? "Mọi thông tin về cuộc sống ký túc xá của bạn nằm ở đây."
              : "Cùng theo dõi hoạt động ký túc xá hôm nay."}
          </p>
        </div>
        <div className="welcome-shape">
          <div />
          <Building2 size={70} />
        </div>
      </div>
      {role === "STUDENT" ? (
        <>
          <div className="metrics-grid">
            <Metric
              icon={BedDouble}
              label="Phòng hiện tại"
              value={active?.room?.code || "Chưa có"}
              foot={active?.room?.building?.name || "Đăng ký để được bố trí"}
              tone="blue"
            />
            <Metric
              icon={ClipboardList}
              label="Hồ sơ gần nhất"
              value={
                apps.data?.items?.[0]
                  ? labels[apps.data.items[0].status]
                  : "Chưa gửi"
              }
              foot={
                apps.data?.items?.[0]
                  ? `Gửi ngày ${date(apps.data.items[0].createdAt)}`
                  : "Hãy gửi hồ sơ đăng ký"
              }
              tone="peach"
            />
            <Metric
              icon={Wallet}
              label="Còn phải đóng"
              value={money(due)}
              foot={`${invoices.data?.items?.filter((x) => x.balance > 0).length || 0} hóa đơn chưa tất toán`}
              tone="green"
            />
          </div>
          <div className="dashboard-grid">
            <Section
              title="Lưu trú của bạn"
              subtitle="Thông tin phòng và thời hạn hiện tại"
              action={
                <Link to="/stays" className="text-link">
                  Xem chi tiết <ArrowRight size={16} />
                </Link>
              }
            >
              {active ? (
                <div className="stay-preview">
                  <div className="stay-room">
                    <BedDouble size={28} />
                    <strong>{active.room?.code}</strong>
                    <span>{active.room?.building?.name}</span>
                  </div>
                  <div className="stay-info">
                    <div>
                      <span>Loại phòng</span>
                      <strong>{active.room?.roomType?.name}</strong>
                    </div>
                    <div>
                      <span>Ngày bắt đầu</span>
                      <strong>{date(active.startDate)}</strong>
                    </div>
                    <div>
                      <span>Dự kiến kết thúc</span>
                      <strong>{date(active.plannedEndDate)}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <Empty
                  icon={BedDouble}
                  title="Chưa có phòng lưu trú"
                  detail="Gửi hồ sơ để bắt đầu hành trình ở KTX."
                />
              )}
            </Section>
            <Section
              title="Thông báo mới"
              subtitle="Cập nhật dành cho bạn"
              action={
                <Link to="/notifications" className="text-link">
                  Xem tất cả <ArrowRight size={16} />
                </Link>
              }
            >
              {n.data?.items?.length ? (
                n.data.items.map((x) => (
                  <div className="feed-item" key={x.id}>
                    <span className="feed-dot" />
                    <div>
                      <strong>{x.title}</strong>
                      <p>{x.body}</p>
                      <small>{date(x.createdAt)}</small>
                    </div>
                  </div>
                ))
              ) : (
                <Empty icon={Bell} />
              )}
            </Section>
          </div>
          <Section
            title="Hóa đơn gần đây"
            subtitle="Theo dõi các khoản phải đóng"
            action={
              <Link to="/invoices" className="text-link">
                Tất cả hóa đơn <ArrowRight size={16} />
              </Link>
            }
          >
            {invoices.data?.items?.length ? (
              <Table
                items={invoices.data.items.slice(0, 4)}
                columns={[
                  {
                    key: "period",
                    label: "Kỳ thu",
                    render: (x) => x.period?.month,
                  },
                  {
                    key: "total",
                    label: "Tổng tiền",
                    render: (x) => money(x.total),
                  },
                  {
                    key: "balance",
                    label: "Còn lại",
                    render: (x) => money(x.balance),
                  },
                  {
                    key: "status",
                    label: "Trạng thái",
                    render: (x) => badge(x.status),
                  },
                ]}
                onRow={(x) => (location.href = `/invoices/${x.id}`)}
              />
            ) : (
              <Empty icon={Wallet} />
            )}
          </Section>
        </>
      ) : (
        <>
          <div className="metrics-grid four">
            <Metric
              icon={Building2}
              label="Phòng đang quản lý"
              value={report.data?.rooms ?? "—"}
              foot={`${report.data?.vacant ?? 0} chỗ còn trống`}
              tone="blue"
            />
            <Metric
              icon={Users}
              label="Sinh viên nội trú"
              value={report.data?.activeStudents ?? "—"}
              foot="Đang lưu trú"
              tone="green"
            />
            <Metric
              icon={ClipboardList}
              label="Hồ sơ chờ duyệt"
              value={report.data?.pendingApplications ?? "—"}
              foot="Cần xử lý"
              tone="peach"
            />
            <Metric
              icon={Wallet}
              label="Còn phải thu"
              value={money(report.data?.outstanding)}
              foot="Từ các hóa đơn đã lập"
              tone="purple"
            />
          </div>
          <div className="dashboard-grid">
            <Section
              title="Tỷ lệ lấp đầy"
              subtitle="Sức chứa vận hành toàn KTX"
            >
              <div className="occupancy">
                <div
                  className="occupancy-ring"
                  style={{ "--percent": `${report.data?.occupancyRate || 0}%` }}
                >
                  <div>
                    <strong>{report.data?.occupancyRate || 0}%</strong>
                    <span>đã sử dụng</span>
                  </div>
                </div>
                <div className="occupancy-key">
                  <div>
                    <span className="key-dot blue" />
                    Đã ở <strong>{report.data?.occupied || 0}</strong>
                  </div>
                  <div>
                    <span className="key-dot pale" />
                    Còn trống <strong>{report.data?.vacant || 0}</strong>
                  </div>
                </div>
              </div>
            </Section>
            <Section
              title="Tình hình khoản thu"
              subtitle="Số liệu từ hóa đơn đã phát hành"
            >
              <div className="finance-bars">
                {[
                  ["Đã lập", report.data?.billed, "var(--accent)"],
                  ["Đã thu", report.data?.collected, "var(--success)"],
                  ["Còn nợ", report.data?.outstanding, "var(--warning)"],
                ].map(([label, value, color]) => (
                  <div key={label}>
                    <div>
                      <span>{label}</span>
                      <strong>{money(value)}</strong>
                    </div>
                    <div className="bar-track">
                      <span
                        style={{
                          width: `${report.data?.billed ? (value / report.data.billed) * 100 : 0}%`,
                          background: color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
          <Section
            title="Hồ sơ cần xử lý"
            subtitle="Các đăng ký mới nhất"
            action={
              <Link to="/applications" className="text-link">
                Xem tất cả <ArrowRight size={16} />
              </Link>
            }
          >
            {apps.data?.items?.length ? (
              <Table
                items={apps.data.items
                  .filter((x) =>
                    ["PENDING", "REVIEWING", "NEEDS_INFO"].includes(x.status),
                  )
                  .slice(0, 5)}
                columns={[
                  {
                    key: "student",
                    label: "Sinh viên",
                    render: (x) => <strong>{x.student?.fullName}</strong>,
                  },
                  {
                    key: "roomType",
                    label: "Nguyện vọng",
                    render: (x) => x.roomType?.name,
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
                onRow={(x) => (location.href = `/applications/${x.id}`)}
              />
            ) : (
              <Empty />
            )}
          </Section>
        </>
      )}
    </>
  );
}

function RoomCatalog() {
  const { session } = useAuth();
  const routeLocation = useLocation();
  const cat = useLoad("/catalog");
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [building, setBuilding] = useState(""),
    [type, setType] = useState(() => new URLSearchParams(routeLocation.search).get("type") || ""),
    [vacant, setVacant] = useState(false),
    [maxFee, setMaxFee] = useState(""),
    [selected, setSelected] = useState(null),
    [selectedType, setSelectedType] = useState(null),
    [edit, setEdit] = useState(null),
    [message, notice, clear] = useNotice();
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
  const save = async (v) => {
    await api(edit?.id ? `/rooms/${edit.id}` : "/rooms", {
      method: edit?.id ? "PATCH" : "POST",
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
    setEdit(null);
    cat.load();
    notice("Đã lưu thông tin phòng.");
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
    <div className={`room-catalog${session ? "" : " ktx-landing dorm-landing public-catalog catalog-public"}`}>
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
        <div className="room-type-heading"><div><span className="eyebrow">XEM ẢNH VÀ THÔNG TIN</span><h2>Loại phòng</h2></div><span>{cat.data?.roomTypes?.filter(x => x.status === 'ACTIVE').length || 0} loại phòng</span></div>
        <div className="room-type-grid">{cat.data?.roomTypes?.filter(x=>x.status==='ACTIVE').map(roomType=>{
          const cover=coverOf(roomType);
          const sameRooms=cat.data?.rooms?.filter(room=>room.roomTypeId===roomType.id && room.status==='ACTIVE')||[];
          const spaces=sameRooms.reduce((sum,room)=>sum+room.vacant,0);
          return <button type="button" className="room-type-card" key={roomType.id} onClick={()=>setSelectedType(roomType)}>
            <div className="room-type-card-media"><div className="room-type-card-placeholder"><BedDouble size={33}/></div>{cover && <img src={cover.url} alt={cover.description||roomType.name} loading="lazy" onError={event=>{event.currentTarget.style.display='none'}}/>}</div>
            <div className="room-type-card-copy"><div><strong>{roomType.name}</strong><span>{roomType.defaultCapacity} người / phòng · {spaces} chỗ trống</span></div><small>{money(roomType.fee)} / tháng</small><span className="catalog-view-detail">Xem chi tiết <ArrowRight size={17} /></span></div>
          </button>;
        })}</div>
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
          <select aria-label="Lọc theo loại phòng" value={type} onChange={(e) => setType(e.target.value)}>
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
                  <div className="catalog-room-placeholder" aria-hidden="true"><BedDouble size={44} strokeWidth={1.2} /><span>Ảnh phòng đang cập nhật</span></div>
                  {coverOf(x.roomType) && <img className="room-card-image" src={coverOf(x.roomType).url} alt={x.roomType?.name} loading="lazy" onError={event=>{event.currentTarget.style.display='none'}}/>}
                  <span
                    className={`availability ${x.vacant ? "available" : "full"}`}
                  >
                    {x.vacant ? `${x.vacant} chỗ trống` : "Đã đầy"}
                  </span>
                </div>
                <div className="room-card-body">
                  <div className="room-meta">
                    <span>
                      {x.building?.name} · Tầng {x.floor}
                    </span>
                    {badge(x.status)}
                  </div>
                  <h3>Phòng {x.code}</h3>
                  <p>{x.roomType?.name}</p>
                  <div className="room-card-foot">
                    <strong>
                      {money(x.roomType?.fee)}
                      <small>/ tháng</small>
                    </strong>
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
          <RoomGallery type={selected.roomType} room={selected} rooms={cat.data?.rooms || []}>
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
                to={session ? "/applications" : "/register"}
                state={session ? { openApplication: true, roomTypeId: selected.roomTypeId, preferredRoomId: selected.id } : undefined}
              >
                Gửi nguyện vọng <ArrowRight size={16} />
              </Link>
            )}
          </RoomGallery>
        </Modal>
      )}
      {selectedType && <Modal title={selectedType.name} onClose={()=>setSelectedType(null)} wide>
        <RoomGallery type={selectedType} rooms={cat.data?.rooms || []}>
          {isStaff ? <button className="button button-primary" onClick={()=>{setType(selectedType.id);setSelectedType(null);}}>Xem phòng thuộc loại này <ArrowRight size={16}/></button> : <Link className="button button-primary" to={session?'/applications':'/register'} state={session ? { openApplication: true, roomTypeId: selectedType.id } : undefined}>Gửi nguyện vọng <ArrowRight size={16}/></Link>}
        </RoomGallery>
      </Modal>}
      {edit && (
        <Modal
          title={edit.id ? "Cập nhật phòng" : "Thêm phòng mới"}
          onClose={() => setEdit(null)}
        >
          <Form
            fields={
              isAdmin
                ? roomFields
                : roomFields.filter((f) =>
                    ["operationalCapacity", "status"].includes(f.name),
                  )
            }
            initial={edit}
            onSave={save}
            onCancel={() => setEdit(null)}
          />
        </Modal>
      )}
      <Toast message={message} onClose={() => clear(null)} />
      </div>
    </div>
  );
}

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
  const eligibleTypes = cat.data?.roomTypes?.filter(
    (type) => type.status === "ACTIVE" &&
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
              onClick={() => { setRequestedTypeId(""); setRequestedRoomId(""); setShow(true); }}
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
                ...(!isStudent ? [{
                  key: "preferredRoom",
                  label: "Phòng nguyện vọng",
                  render: (x) => x.preferredRoom
                    ? <span className="preferred-room-pill">★ {x.preferredRoom.code}</span>
                    : <span className="muted">Chưa chọn phòng</span>,
                }] : []),
                {
                  key: "durationMonths",
                  label: "Thời hạn",
                  render: (x) => x.durationMonths ? `${x.durationMonths} tháng` : "—",
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
            Chọn loại phòng, phòng nguyện vọng và thời hạn ở. Nhân viên sẽ xác nhận phòng thực tế khi duyệt hồ sơ.
          </p>
          {cat.loading ? <Loading /> : cat.error ? <div className="inline-error">{cat.error}</div> : <Form
            fields={(values) => {
              const rooms = (cat.data?.rooms || []).filter((room) =>
                room.roomTypeId === values.roomTypeId && room.status === "ACTIVE" && room.building?.status === "ACTIVE");
              return [
              {
                label: "Loại phòng mong muốn",
                name: "roomTypeId",
                required: true,
                options:
                  eligibleTypes.map((x) => ({
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
                hint: rooms.length ? "Đây là nguyện vọng; nhân viên sẽ xác nhận theo chỗ còn thực tế." : "Loại phòng này chưa có phòng cụ thể; bạn vẫn có thể gửi nguyện vọng loại phòng.",
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
              roomTypeId: eligibleTypes.some((type) => type.id === requestedTypeId) ? requestedTypeId : "",
              preferredRoomId: requestedRoomId,
              durationMonths: "",
              contact: session.profile?.phone || "",
            }}
            resetOnChange={{ roomTypeId: ["preferredRoomId"] }}
            onSave={save}
            onCancel={() => setShow(false)}
            submit="Gửi hồ sơ"
          >
            {(values) => endAfterMonths(values.startDate, values.durationMonths) && (
              <div className="stay-date-preview">
                Ngày kết thúc dự kiến: <strong>{date(endAfterMonths(values.startDate, values.durationMonths))}</strong>
              </div>
            )}
          </Form>}
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
  const preferredSuitable = suitable.find((room) => room.id === item?.preferredRoomId);
  const sortedSuitable = preferredSuitable
    ? [preferredSuitable, ...suitable.filter((room) => room.id !== preferredSuitable.id)]
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
              <strong>{item.durationMonths ? `${item.durationMonths} tháng` : "Hồ sơ cũ: chưa chọn"}</strong>
            </div>
            {item.durationMonths && <div>
              <span>Ngày kết thúc dự kiến</span>
              <strong>{date(endAfterMonths(item.startDate, item.durationMonths))}</strong>
            </div>}
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
              <strong>Phòng {item.preferredRoom.code} · {item.preferredRoom.building?.name}</strong>
              <small>{item.preferredRoom.vacant > 0 ? `${item.preferredRoom.vacant} chỗ còn trống hiện tại` : "Hiện đã hết chỗ; nhân viên có thể chọn phòng khác cùng loại."}</small>
            </div>
          ) : <p className="detail-note">Hồ sơ này chỉ chọn loại phòng, chưa chọn phòng cụ thể.</p>}
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
                      options: sortedSuitable.map((x) => ({
                        value: x.id,
                        label: `${x.id === item.preferredRoomId ? "★ NGUYỆN VỌNG · " : ""}${x.code} · ${x.building?.name} · ${x.vacant} chỗ trống`,
                      })),
                    },
                    {
                      label: "Ngày bắt đầu",
                      name: "startDate",
                      type: "date",
                      required: true,
                    },
                    ...(!item.durationMonths ? [{
                      label: "Ngày kết thúc dự kiến (hồ sơ cũ)",
                      name: "endDate",
                      type: "date",
                      required: true,
                    }] : []),
                  ]
                : action === "supplement"
                  ? (values) => {
                    const rooms = (cat.data?.rooms || []).filter((room) =>
                      room.roomTypeId === values.roomTypeId && room.status === "ACTIVE" && room.building?.status === "ACTIVE");
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
                            .map((x) => ({ value: x.id, label: x.name })) || [],
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
                    durationMonths: item.durationMonths ? String(item.durationMonths) : "",
                    contact: item.contact,
                    note: item.note,
                  }
                : { startDate: item.startDate, roomId: preferredSuitable?.id || "" }
            }
            resetOnChange={action === "supplement" ? { roomTypeId: ["preferredRoomId"] } : {}}
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
              const months = action === "approve" ? item.durationMonths : values.durationMonths;
              const endDate = endAfterMonths(values.startDate, months);
              return ["approve", "supplement"].includes(action) && endDate && (
                <div className="stay-date-preview">
                  Thời hạn: <strong>{months} tháng</strong> · Ngày kết thúc dự kiến: <strong>{date(endDate)}</strong>
                </div>
              );
            }}
          </Form>
          {action === "approve" && item.preferredRoom && !preferredSuitable && (
            <div className="inline-warning">Phòng nguyện vọng hiện không còn phù hợp hoặc đã đầy. Hãy chọn phòng khác cùng loại.</div>
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

function StaysPage() {
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
          <div>{badge(active[0].status)}</div>
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
function RequestsPage() {
  const { session } = useAuth();
  const own = session.user.role === "STUDENT",
    stays = useLoad("/stays?limit=100");
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [form, setForm] = useState(false),
    [decision, setDecision] = useState(null),
    [message, notice, clear] = useNotice();
  const data = useLoad(
    `/requests?page=${page}&search=${encodeURIComponent(search)}&status=${status}`,
  );
  useEffect(() => {
    if (own) return;
    const refresh = () => data.load();
    window.addEventListener("work-queue-changed", refresh);
    return () => window.removeEventListener("work-queue-changed", refresh);
  }, [own, page, search, status]);
  const current = stays.data?.items?.find((x) => x.status === "ACTIVE");
  const save = async (v) => {
    await api("/requests", { method: "POST", body: v });
    setForm(false);
    setPage(1);
    setSearch("");
    setStatus("");
    if (page === 1 && !search && !status) data.load();
    notice("Đã gửi yêu cầu lưu trú.");
  };
  const decide = async (v) => {
    if (
      !window.confirm(
        v.status === "APPROVED"
          ? "Xác nhận duyệt yêu cầu và cập nhật lưu trú?"
          : "Xác nhận từ chối yêu cầu?",
      )
    )
      return;
    await api(`/requests/${decision.id}/decision`, { method: "POST", body: v });
    setDecision(null);
    data.load();
    notice("Đã xử lý yêu cầu.");
  };
  return (
    <>
      <PageTitle
        kicker="YÊU CẦU LƯU TRÚ"
        title={own ? "Gia hạn & trả phòng" : "Xử lý yêu cầu lưu trú"}
        description={
          own
            ? "Gửi yêu cầu và theo dõi kết quả xử lý."
            : "Duyệt gia hạn hoặc trả phòng cho sinh viên."
        }
        action={
          own &&
          current && (
            <button
              className="button button-primary"
              onClick={() => setForm(true)}
            >
              <Plus size={17} />
              Tạo yêu cầu
            </button>
          )
        }
      />
      <Section
        title="Danh sách yêu cầu"
        subtitle={`${data.data?.total || 0} yêu cầu`}
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
            {["PENDING", "APPROVED", "REJECTED"].map((x) => (
              <option key={x} value={x}>
                {labels[x]}
              </option>
            ))}
          </select>
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
                        render: (x) => <strong>{x.student?.fullName}</strong>,
                      },
                    ]
                  : []),
                { key: "type", label: "Loại", render: (x) => badge(x.type) },
                { key: "room", label: "Phòng", render: (x) => x.room?.code },
                {
                  key: "desiredDate",
                  label: "Ngày mong muốn",
                  render: (x) => date(x.desiredDate),
                },
                { key: "reason", label: "Lý do" },
                {
                  key: "status",
                  label: "Trạng thái",
                  render: (x) => badge(x.status),
                },
                {
                  key: "handledAt",
                  label: "Ngày xử lý",
                  render: (x) => date(x.handledAt),
                },
                {
                  key: "rejectionReason",
                  label: "Ghi chú",
                  render: (x) => x.rejectionReason || "—",
                },
                ...(!own
                  ? [
                      {
                        key: "action",
                        label: "Thao tác",
                        render: (x) =>
                          x.status === "PENDING" ? (
                            <button
                              className="table-action"
                              onClick={() => setDecision(x)}
                            >
                              Xử lý
                            </button>
                          ) : (
                            "—"
                          ),
                      },
                    ]
                  : []),
              ]}
            />
            <Pager data={data.data} page={page} setPage={setPage} />
          </>
        ) : (
          <Empty icon={FileText} title="Chưa có yêu cầu" />
        )}
      </Section>
      {form && (
        <Modal title="Tạo yêu cầu lưu trú" onClose={() => setForm(false)}>
          <Form
            fields={[
              {
                label: "Loại yêu cầu",
                name: "type",
                required: true,
                options: [
                  { value: "EXTEND", label: "Gia hạn" },
                  { value: "RETURN", label: "Trả phòng" },
                ],
              },
              {
                label: "Ngày mong muốn",
                name: "desiredDate",
                type: "date",
                required: true,
              },
              { label: "Lý do", name: "reason", rows: 3, required: true },
            ]}
            onSave={save}
            onCancel={() => setForm(false)}
            submit="Gửi yêu cầu"
          />
        </Modal>
      )}
      {decision && (
        <Modal
          title={`Xử lý yêu cầu ${labels[decision.type]?.toLowerCase()}`}
          onClose={() => setDecision(null)}
        >
          <p className="modal-intro">
            {decision.student?.fullName} · {decision.room?.code} · Ngày mong
            muốn {date(decision.desiredDate)}
          </p>
          <Form
            fields={[
              {
                label: "Kết quả",
                name: "status",
                required: true,
                options: [
                  { value: "APPROVED", label: "Duyệt" },
                  { value: "REJECTED", label: "Từ chối" },
                ],
              },
              { label: "Lý do từ chối (nếu có)", name: "reason", rows: 3 },
            ]}
            onSave={decide}
            onCancel={() => setDecision(null)}
            submit="Xác nhận xử lý"
          />
        </Modal>
      )}
      <Toast message={message} onClose={() => clear(null)} />
    </>
  );
}
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
          <select
            value={building}
            onChange={(e) => {
              setBuilding(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả tòa</option>
            {cat.data?.buildings?.map((x) => (
              <option value={x.id} key={x.id}>
                {x.name}
              </option>
            ))}
          </select>
          <select
            value={room}
            onChange={(e) => {
              setRoom(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả phòng</option>
            {cat.data?.rooms?.map((x) => (
              <option value={x.id} key={x.id}>
                {x.code}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang ở</option>
            <option value="INACTIVE">Chưa ở</option>
          </select>
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
  const save = async (v) => {
    if (!window.confirm("Xác nhận chuyển phòng cho sinh viên?")) return;
    await api("/transfers", { method: "POST", body: v });
    setShow(false);
    data.load();
    students.load();
    cat.load();
    notice("Đã chuyển phòng và cập nhật số chỗ trống.");
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
                { key: "reason", label: "Lý do" },
              ]}
            />
            <Pager data={data.data} page={page} setPage={setPage} />
          </>
        ) : (
          <Empty icon={DoorOpen} />
        )}
      </Section>
      {show && (
        <Modal title="Chuyển phòng sinh viên" onClose={() => setShow(false)}>
          <Form
            fields={[
              {
                label: "Sinh viên đang ở",
                name: "studentId",
                required: true,
                options:
                  students.data?.items
                    ?.filter((x) => x.stay)
                    .map((x) => ({
                      value: x.id,
                      label: `${x.fullName} · ${x.studentCode}`,
                    })) || [],
              },
              {
                label: "Phòng mới",
                name: "roomId",
                required: true,
                options:
                  cat.data?.rooms
                    ?.filter((x) => x.vacant > 0)
                    .map((x) => ({
                      value: x.id,
                      label: `${x.code} · ${x.roomType?.name} · ${x.vacant} chỗ`,
                    })) || [],
              },
              {
                label: "Ngày chuyển",
                name: "date",
                type: "date",
                required: true,
              },
              { label: "Lý do", name: "reason", rows: 3, required: true },
            ]}
            initial={{ date: new Date().toISOString().slice(0, 10) }}
            onSave={save}
            onCancel={() => setShow(false)}
            submit="Xác nhận chuyển"
          />
        </Modal>
      )}
      <Toast message={message} onClose={() => clear(null)} />
    </>
  );
}

function ReadingHint({ values }) {
  const [previous, setPrevious] = useState(null);
  useEffect(() => {
    if (!values.roomId || !values.periodId || !values.type) {
      setPrevious(null);
      return;
    }
    setPrevious(null);
    let alive = true;
    api(
      `/readings/previous?roomId=${values.roomId}&periodId=${values.periodId}&type=${values.type}`,
    )
      .then((result) => {
        if (alive) setPrevious(result);
      })
      .catch(() => {
        if (alive) setPrevious(null);
      });
    return () => {
      alive = false;
    };
  }, [values.roomId, values.periodId, values.type]);
  if (!values.roomId || !values.periodId || !values.type) return null;
  const start = previous?.start ?? Number(values.start || 0);
  const usage =
    values.end === undefined || values.end === ""
      ? null
      : Number(values.end) - start;
  return (
    <div className="reading-preview">
      <div>
        <span>Chỉ số kỳ trước</span>
        <strong>{previous?.start ?? "Kỳ đầu / chưa có"}</strong>
      </div>
      <div>
        <span>Chỉ số đầu kỳ</span>
        <strong>{start}</strong>
      </div>
      <div>
        <span>Tiêu thụ dự kiến</span>
        <strong>
          {usage === null ? "—" : usage >= 0 ? usage : "Không hợp lệ"}
        </strong>
      </div>
    </div>
  );
}
function ReadingsPage() {
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [period, setPeriod] = useState("");
  const data = useLoad(
      `/readings?page=${page}&search=${encodeURIComponent(search)}&periodId=${period}`,
    ),
    cat = useLoad("/catalog"),
    periods = useLoad("/periods?limit=100");
  useEffect(() => {
    const refresh = () => data.load();
    window.addEventListener("work-queue-changed", refresh);
    return () => window.removeEventListener("work-queue-changed", refresh);
  }, [page, search, period]);
  const [show, setShow] = useState(false),
    [message, notice, clear] = useNotice();
  const save = async (v) => {
    await api("/readings", {
      method: "POST",
      body: {
        ...v,
        end: Number(v.end),
        start:
          v.start !== "" && v.start !== undefined ? Number(v.start) : undefined,
      },
    });
    setShow(false);
    data.load();
    notice("Đã lưu chỉ số điện nước.");
  };
  return (
    <>
      <PageTitle
        kicker="VẬN HÀNH & TIỆN ÍCH"
        title="Chỉ số điện nước"
        description="Nhập chỉ số theo phòng và kỳ thu, theo dõi lượng tiêu thụ."
        action={
          <button
            className="button button-primary"
            onClick={() => setShow(true)}
          >
            <Plus size={17} />
            Nhập chỉ số
          </button>
        }
      />
      <Section
        title="Sổ chỉ số"
        subtitle="Mỗi phòng có một chỉ số điện và một chỉ số nước trong mỗi kỳ"
      >
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        >
          <select
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả kỳ thu</option>
            {periods.data?.items?.map((x) => (
              <option key={x.id} value={x.id}>
                {x.month}
              </option>
            ))}
          </select>
        </SearchBar>
        {data.data?.items?.length ? (
          <>
            <Table
              items={data.data.items}
              columns={[
                {
                  key: "room",
                  label: "Phòng",
                  render: (x) => <strong>{x.room?.code}</strong>,
                },
                { key: "period", label: "Kỳ", render: (x) => x.period?.month },
                { key: "type", label: "Loại", render: (x) => badge(x.type) },
                { key: "start", label: "Đầu kỳ" },
                { key: "end", label: "Cuối kỳ" },
                {
                  key: "usage",
                  label: "Tiêu thụ",
                  render: (x) => <strong>{x.usage}</strong>,
                },
              ]}
            />
            <Pager data={data.data} page={page} setPage={setPage} />
          </>
        ) : (
          <Empty icon={Zap} />
        )}
      </Section>
      {show && (
        <Modal title="Nhập chỉ số điện nước" onClose={() => setShow(false)}>
          <Form
            fields={[
              {
                label: "Phòng",
                name: "roomId",
                required: true,
                options:
                  cat.data?.rooms?.map((x) => ({
                    value: x.id,
                    label: x.code,
                  })) || [],
              },
              {
                label: "Kỳ thu",
                name: "periodId",
                required: true,
                options:
                  periods.data?.items?.map((x) => ({
                    value: x.id,
                    label: x.month,
                  })) || [],
              },
              {
                label: "Loại chỉ số",
                name: "type",
                required: true,
                options: [
                  { value: "ELECTRICITY", label: "Điện (kWh)" },
                  { value: "WATER", label: "Nước (m³)" },
                ],
              },
              {
                label: "Chỉ số đầu kỳ",
                name: "start",
                type: "number",
                min: 0,
                hint: "Chỉ nhập cho kỳ đầu tiên. Kỳ sau tự lấy chỉ số cuối trước đó.",
              },
              {
                label: "Chỉ số cuối kỳ",
                name: "end",
                type: "number",
                min: 0,
                required: true,
              },
            ]}
            onSave={save}
            onCancel={() => setShow(false)}
            submit="Lưu chỉ số"
          >
            {(values) => <ReadingHint values={values} />}
          </Form>
        </Modal>
      )}
      <Toast message={message} onClose={() => clear(null)} />
    </>
  );
}
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
  useEffect(() => {
    if (!selected) return;
    const refresh = () => api(`/billing/preview/${selected}`)
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
        <div className="billing-select">
          <select value={selected} onChange={(e) => choose(e.target.value)}>
            <option value="">Chọn kỳ thu</option>
            {periods.data?.items?.map((x) => (
              <option key={x.id} value={x.id}>
                {x.month}
              </option>
            ))}
          </select>
          <Link className="button button-outline" to="/readings">
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
                    render: (x) => x.snapshot.roomCode,
                  },
                  {
                    key: "roomFee",
                    label: "Tiền phòng",
                    render: (x) => money(x.roomFee),
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
          <select
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả kỳ</option>
            {periods.data?.items?.map((x) => (
              <option key={x.id} value={x.id}>
                {x.month}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            {["UNPAID", "PARTIAL", "PAID", "OVERDUE"].map((x) => (
              <option key={x} value={x}>
                {labels[x]}
              </option>
            ))}
          </select>
          {!own && (
            <select
              value={building}
              onChange={(e) => {
                setBuilding(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả tòa</option>
              {catalog.data?.buildings?.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
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
                  render: (x) => x.snapshot.roomCode,
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
        title={`Khoản thu phòng ${s.roomCode}`}
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
              <span>Phí phòng · {s.roomTypeName}</span>
              <strong>{money(x.roomFee)}</strong>
            </div>
            <div>
              <span>
                Điện · {s.electricUsage} kWh × {money(s.electricityRate)} ÷{" "}
                {s.occupants} người
              </span>
              <strong>{money(x.electricityFee)}</strong>
            </div>
            <div>
              <span>
                Nước · {s.waterUsage} m³ × {money(s.waterRate)} ÷ {s.occupants}{" "}
                người
              </span>
              <strong>{money(x.waterFee)}</strong>
            </div>
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

const resourceConfig = {
  buildings: {
    title: "Tòa nhà",
    singular: "tòa nhà",
    api: "buildings",
    icon: Building2,
    fields: [
      { label: "Mã tòa", name: "code", required: true },
      { label: "Tên tòa", name: "name", required: true },
      { label: "Mô tả", name: "description", rows: 2 },
      {
        label: "Trạng thái",
        name: "status",
        required: true,
        options: [
          { value: "ACTIVE", label: "Đang sử dụng" },
          { value: "INACTIVE", label: "Ngừng sử dụng" },
        ],
      },
    ],
    columns: [
      { key: "code", label: "Mã tòa" },
      { key: "name", label: "Tên tòa" },
      { key: "description", label: "Mô tả" },
      { key: "status", label: "Trạng thái", render: (x) => badge(x.status) },
    ],
  },
  "room-types": {
    title: "Loại phòng",
    singular: "loại phòng",
    api: "roomTypes",
    icon: BedDouble,
    fields: [
      { label: "Mã loại", name: "code", required: true },
      { label: "Tên loại phòng", name: "name", required: true },
      { label: "Mô tả", name: "description", rows: 2 },
      {
        label: "Giới tính áp dụng",
        name: "gender",
        required: true,
        options: [
          { value: "MALE", label: "Nam" },
          { value: "FEMALE", label: "Nữ" },
          { value: "ANY", label: "Tất cả" },
        ],
      },
      {
        label: "Sức chứa mặc định",
        name: "defaultCapacity",
        type: "number",
        min: 1,
        required: true,
      },
      {
        label: "Phí tham khảo / tháng",
        name: "fee",
        type: "number",
        min: 0,
        required: true,
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
    ],
    columns: [
      { key: "code", label: "Mã" },
      { key: "name", label: "Tên loại phòng" },
      { key: "images", label: "Ảnh", render: (x) => coverOf(x) ? <img className="resource-photo" src={coverOf(x).url} alt={x.name}/> : <span className="resource-photo-empty"><ImagePlus size={17}/></span> },
      { key: "gender", label: "Giới tính", render: (x) => labels[x.gender] },
      { key: "defaultCapacity", label: "Sức chứa" },
      { key: "fee", label: "Phí / tháng", render: (x) => money(x.fee) },
      { key: "status", label: "Trạng thái", render: (x) => badge(x.status) },
    ],
  },
  periods: {
    title: "Kỳ thu",
    singular: "kỳ thu",
    api: "periods",
    icon: ClipboardList,
    fields: [
      { label: "Kỳ (YYYY-MM)", name: "month", type: "month", required: true },
      { label: "Ngày lập", name: "issueDate", type: "date", required: true },
      {
        label: "Hạn thanh toán",
        name: "dueDate",
        type: "date",
        required: true,
      },
      {
        label: "Trạng thái",
        name: "status",
        required: true,
        options: [
          { value: "ACTIVE", label: "Đang sử dụng" },
          { value: "INACTIVE", label: "Đã đóng" },
        ],
      },
    ],
    columns: [
      { key: "month", label: "Kỳ thu" },
      { key: "issueDate", label: "Ngày lập", render: (x) => date(x.issueDate) },
      {
        key: "dueDate",
        label: "Hạn thanh toán",
        render: (x) => date(x.dueDate),
      },
      { key: "status", label: "Trạng thái", render: (x) => badge(x.status) },
    ],
  },
};
function ResourcePage({ kind }) {
  const config = resourceConfig[kind],
    [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [edit, setEdit] = useState(null),
    [message, notice, clear] = useNotice();
  const data = useLoad(
    `/${config.api}?page=${page}&search=${encodeURIComponent(search)}`,
  );
  const save = async (v, targetId = edit?.id) => {
    const saved = await api(`/${config.api}${targetId ? `/${targetId}` : ""}`, {
      method: targetId ? "PATCH" : "POST",
      body: v,
    });
    if (kind !== 'room-types') setEdit(null);
    data.load();
    notice(`Đã lưu ${config.singular}.`);
    return saved;
  };
  return (
    <>
      <PageTitle
        kicker="DANH MỤC HỆ THỐNG"
        title={config.title}
        description={`Quản lý và cập nhật thông tin ${config.singular} của ký túc xá.`}
        action={
          <button
            className="button button-primary"
            onClick={() => setEdit({ status: "ACTIVE" })}
          >
            <Plus size={17} />
            Thêm {config.singular}
          </button>
        }
      />
      <Section
        title={`Danh sách ${config.title.toLowerCase()}`}
        subtitle={`${data.data?.total || 0} mục`}
      >
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
        {data.loading ? (
          <Loading />
        ) : data.data?.items?.length ? (
          <>
            <Table
              items={data.data.items}
              columns={[
                ...config.columns,
                {
                  key: "edit",
                  label: "",
                  render: (x) => (
                    <button className="table-action" onClick={() => setEdit(x)}>
                      Chỉnh sửa
                    </button>
                  ),
                },
              ]}
            />
            <Pager data={data.data} page={page} setPage={setPage} />
          </>
        ) : (
          <Empty icon={config.icon} />
        )}
      </Section>
      {edit && (
        <Modal
          title={`${edit.id ? "Cập nhật" : "Thêm"} ${config.singular}`}
          onClose={() => setEdit(null)}
          wide={kind === 'room-types'}
        >
          {kind === 'room-types' ? <RoomTypeEditor key={edit.id || 'new'} initial={edit} fields={config.fields} onSaveType={save} onChanged={data.load} onClose={()=>setEdit(null)}/> : <Form fields={config.fields} initial={edit} onSave={save} onCancel={() => setEdit(null)}/>}
        </Modal>
      )}
      <Toast message={message} onClose={() => clear(null)} />
    </>
  );
}
function PricingPage() {
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
        subtitle="Phí hàng tháng trên mỗi sinh viên"
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
function StaffPage() {
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [edit, setEdit] = useState(null),
    [message, notice, clear] = useNotice();
  const data = useLoad(
    `/staff?page=${page}&search=${encodeURIComponent(search)}`,
  );
  const save = async (v) => {
    if (v.password && v.password !== v.confirmPassword)
      throw new Error("Mật khẩu xác nhận không khớp.");
    await api(`/staff${edit?.id ? `/${edit.id}` : ""}`, {
      method: edit?.id ? "PATCH" : "POST",
      body: { staffCode: v.staffCode, fullName: v.fullName, phone: v.phone, email: v.email, password: v.password || undefined, role: v.role, active: v.active },
    });
    setEdit(null);
    data.load();
    notice("Đã cập nhật tài khoản nhân viên.");
  };
  return (
    <>
      <PageTitle
        kicker="QUẢN TRỊ TÀI KHOẢN"
        title="Nhân viên & phân quyền"
        description="Tạo nhân viên, cập nhật vai trò và trạng thái tài khoản."
        action={
          <button
            className="button button-primary"
            onClick={() => setEdit({ role: "STAFF", active: true })}
          >
            <Plus size={17} />
            Thêm nhân viên
          </button>
        }
      />
      <Section title="Danh sách tài khoản">
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
                { key: "staffCode", label: "Mã nhân viên" },
                { key: "fullName", label: "Họ tên" },
                { key: "user", label: "Email", render: (x) => <span className="staff-email">{x.user?.email}</span> },
                {
                  key: "role",
                  label: "Vai trò",
                  render: (x) => badge(x.user?.role),
                },
                {
                  key: "active",
                  label: "Trạng thái",
                  render: (x) =>
                    x.user?.active ? badge("ACTIVE") : badge("INACTIVE"),
                },
                {
                  key: "edit",
                  label: "",
                  render: (x) => (
                    <button
                      className="table-action"
                      onClick={() =>
                        setEdit({
                          ...x,
                          email: x.user?.email || "",
                          password: "",
                          confirmPassword: "",
                          role: x.user?.role,
                          active: String(x.user?.active),
                        })
                      }
                    >
                      Chỉnh sửa
                    </button>
                  ),
                },
              ]}
            />
            <Pager data={data.data} page={page} setPage={setPage} />
          </>
        ) : (
          <Empty icon={Users} />
        )}
      </Section>
      {edit && (
        <Modal
          title={edit.id ? "Cập nhật nhân viên" : "Thêm nhân viên"}
          onClose={() => setEdit(null)}
        >
          <Form
            className="staff-edit-form"
            fields={(values) => [
              ...(!edit.id
                ? [
                    {
                      label: "Mã nhân viên",
                      name: "staffCode",
                      required: true,
                    },
                  ]
                : []),
              { label: "Email", name: "email", type: "email", required: true, autoComplete: "off" },
              { label: edit.id ? "Mật khẩu mới" : "Mật khẩu", name: "password", type: "password", required: !edit.id, minLength: 8, maxLength: 72, autoComplete: "new-password", hint: edit.id ? "Tối thiểu 8 ký tự. Để trống nếu giữ mật khẩu hiện tại." : "Tối thiểu 8 ký tự." },
              ...((!edit.id || values.password) ? [{ label: "Xác nhận mật khẩu", name: "confirmPassword", type: "password", required: true, minLength: 8, maxLength: 72, autoComplete: "new-password" }] : []),
              { label: "Họ tên", name: "fullName", required: true },
              { label: "Số điện thoại", name: "phone" },
              {
                label: "Vai trò",
                name: "role",
                required: true,
                options: [
                  { value: "STAFF", label: "Nhân viên" },
                  { value: "ADMIN", label: "Quản trị viên" },
                ],
              },
              ...(edit.id
                ? [
                    {
                      label: "Trạng thái",
                      name: "active",
                      options: [
                        { value: "true", label: "Hoạt động" },
                        { value: "false", label: "Khóa" },
                      ],
                    },
                  ]
                : []),
            ]}
            initial={edit}
            onSave={(v) =>
              save({ ...v, active: v.active === "true" || v.active === true })
            }
            onCancel={() => setEdit(null)}
          />
        </Modal>
      )}
      <Toast message={message} onClose={() => clear(null)} />
    </>
  );
}
function ReportPage() {
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
        <div className="search-bar">
          <select
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
          >
            <option value="">Tất cả tòa</option>
            {cat.data?.buildings?.map((x) => (
              <option value={x.id} key={x.id}>
                {x.name}
              </option>
            ))}
          </select>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="">Tất cả kỳ thu</option>
            {periods.data?.items?.map((x) => (
              <option value={x.id} key={x.id}>
                {x.month}
              </option>
            ))}
          </select>
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
function NotificationsPage() {
  const navigate = useNavigate();
  const data = useLoad("/notifications?limit=100"),
    [message, notice, clear] = useNotice();
  useEffect(() => {
    const sync = () => data.load();
    window.addEventListener("notifications-updated", sync);
    window.addEventListener("inbox-changed", sync);
    return () => {
      window.removeEventListener("notifications-updated", sync);
      window.removeEventListener("inbox-changed", sync);
    };
  }, []);
  const read = async (x) => {
    if (x.read) return;
    try {
      await api(`/notifications/${x.id}/read`, { method: "PATCH" });
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (e) {
      notice(e.message, "error");
    }
  };
  return (
    <>
      <PageTitle
        kicker="CẬP NHẬT DÀNH CHO BẠN"
        title="Thông báo"
        description="Các thay đổi về hồ sơ, lưu trú và hóa đơn."
      />
      <Section
        title="Hộp thông báo"
        subtitle={`${data.data?.items?.filter((x) => !x.read).length || 0} thông báo chưa đọc`}
      >
        {data.data?.items?.length ? (
          <div className="notification-list">
            {data.data.items.map((x) => (
              <button
                className={`notification ${x.read ? "read" : ""}`}
                key={x.id}
                onClick={async () => {
                  await read(x);
                  if (x.targetPath?.startsWith("/") && !x.targetPath.startsWith("//")) navigate(x.targetPath);
                }}
              >
                <span className="notification-icon">
                  <Bell size={20} />
                </span>
                <div>
                  <strong>{x.title}</strong>
                  <p>{x.body}</p>
                  <small>{date(x.createdAt)}</small>
                </div>
                {!x.read && <span className="unread-dot" />}
              </button>
            ))}
          </div>
        ) : (
          <Empty icon={Bell} title="Không có thông báo" />
        )}
      </Section>
      <Toast message={message} onClose={() => clear(null)} />
    </>
  );
}
function ProfilePage() {
  const { session, setSession } = useAuth(),
    [message, notice, clear] = useNotice();
  const [form, setForm] = useState(session.profile || {}),
    [busy, setBusy] = useState(false);
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const profile = await api("/profile", { method: "PATCH", body: form });
      setSession((s) => ({ ...s, profile }));
      notice("Đã cập nhật hồ sơ cá nhân.");
    } catch (e) {
      notice(e.message, "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageTitle
        kicker="THÔNG TIN TÀI KHOẢN"
        title="Hồ sơ cá nhân"
        description="Cập nhật thông tin liên hệ của bạn."
      />
      <div className="profile-header">
        <div className="profile-avatar">
          {session.profile?.fullName?.charAt(0) || "N"}
        </div>
        <div>
          <h2>{session.profile?.fullName}</h2>
          <p>
            {session.user.email} · {labels[session.user.role]}
          </p>
        </div>
      </div>
      <Section title="Thông tin cá nhân">
        <form onSubmit={save}>
          <div className="form-grid">
            {session.user.role === "STUDENT" && (
              <>
                <div className="field">
                  <span>Mã sinh viên</span>
                  <input value={session.profile?.studentCode || ""} disabled />
                </div>
                <div className="field">
                  <span>Giới tính</span>
                  <input
                    value={labels[session.profile?.gender] || ""}
                    disabled
                  />
                </div>
              </>
            )}
            {[
              { label: "Họ tên", name: "fullName" },
              { label: "Số điện thoại", name: "phone" },
              { label: "Địa chỉ", name: "address" },
              { label: "Khoa / ngành", name: "faculty" },
              { label: "Khóa học", name: "course" },
              { label: "Liên hệ khác", name: "contact" },
            ]
              .filter(
                (f) =>
                  session.user.role === "STUDENT" ||
                  ["fullName", "phone"].includes(f.name),
              )
              .map((f) => (
                <Field
                  key={f.name}
                  {...f}
                  value={form[f.name]}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, [e.target.name]: e.target.value }))
                  }
                />
              ))}
          </div>
          <div className="section-actions">
            <button className="button button-primary" disabled={busy}>
              {busy ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </Section>
      <Toast message={message} onClose={() => clear(null)} />
    </>
  );
}

export default function App() {
  const [session, setSession] = useState(null),
    [ready, setReady] = useState(false);
  useEffect(() => {
    if (localStorage.getItem("ktx_token"))
      api("/auth/me")
        .then(setSession)
        .catch(() => localStorage.removeItem("ktx_token"))
        .finally(() => setReady(true));
    else setReady(true);
  }, []);
  const login = async (path, body) => {
    const data = await api(path, { method: "POST", body });
    localStorage.setItem("ktx_token", data.token);
    setSession({ user: data.user, profile: data.profile });
  };
  const logout = () => {
    localStorage.removeItem("ktx_token");
    setSession(null);
    location.href = "/";
  };
  const context = useMemo(
    () => ({ session, setSession, ready, login, logout }),
    [session, ready],
  );
  return (
    <AuthContext.Provider value={context}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={session ? <Navigate to="/dashboard" /> : <AuthPage />}
        />
        <Route
          path="/register"
          element={
            session ? <Navigate to="/dashboard" /> : <AuthPage register />
          }
        />
        <Route
          path="/rooms"
          element={
            session ? (
              <Shell>
                <RoomCatalog />
              </Shell>
            ) : (
              <RoomCatalog />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            <Guard>
              <Dashboard />
            </Guard>
          }
        />
        <Route
          path="/applications"
          element={
            <Guard>
              <Applications />
            </Guard>
          }
        />
        <Route
          path="/applications/:id"
          element={
            <Guard>
              <ApplicationDetail />
            </Guard>
          }
        />
        <Route
          path="/stays"
          element={
            <Guard>
              <StaysPage />
            </Guard>
          }
        />
        <Route
          path="/requests"
          element={
            <Guard>
              <RequestsPage />
            </Guard>
          }
        />
        <Route
          path="/students"
          element={
            <Guard roles={["STAFF", "ADMIN"]}>
              <StudentsPage />
            </Guard>
          }
        />
        <Route
          path="/students/:id"
          element={
            <Guard roles={["STAFF", "ADMIN"]}>
              <StudentDetail />
            </Guard>
          }
        />
        <Route
          path="/transfers"
          element={
            <Guard roles={["STAFF", "ADMIN"]}>
              <TransfersPage />
            </Guard>
          }
        />
        <Route
          path="/readings"
          element={
            <Guard roles={["STAFF", "ADMIN"]}>
              <ReadingsPage />
            </Guard>
          }
        />
        <Route
          path="/billing"
          element={
            <Guard roles={["STAFF", "ADMIN"]}>
              <BillingPage />
            </Guard>
          }
        />
        <Route
          path="/invoices"
          element={
            <Guard>
              <InvoicesPage />
            </Guard>
          }
        />
        <Route
          path="/invoices/:id"
          element={
            <Guard>
              <InvoiceDetail />
            </Guard>
          }
        />
        <Route
          path="/notifications"
          element={
            <Guard>
              <NotificationsPage />
            </Guard>
          }
        />
        <Route
          path="/profile"
          element={
            <Guard>
              <ProfilePage />
            </Guard>
          }
        />
        <Route path="/contact" element={<Guard roles={["STUDENT"]}><ContactPage /></Guard>} />
        <Route
          path="/wireframe"
          element={
            <Guard roles={["ADMIN"]} plain>
              <WireframePage />
            </Guard>
          }
        />
        <Route
          path="/report"
          element={
            <Guard roles={["STAFF", "ADMIN"]}>
              <ReportPage />
            </Guard>
          }
        />
        <Route
          path="/buildings"
          element={
            <Guard roles={["ADMIN"]}>
              <ResourcePage kind="buildings" />
            </Guard>
          }
        />
        <Route
          path="/room-types"
          element={
            <Guard roles={["ADMIN"]}>
              <ResourcePage kind="room-types" />
            </Guard>
          }
        />
        <Route
          path="/periods"
          element={
            <Guard roles={["ADMIN"]}>
              <ResourcePage kind="periods" />
            </Guard>
          }
        />
        <Route
          path="/pricing"
          element={
            <Guard roles={["ADMIN"]}>
              <PricingPage />
            </Guard>
          }
        />
        <Route
          path="/staff"
          element={
            <Guard roles={["ADMIN"]}>
              <StaffPage />
            </Guard>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthContext.Provider>
  );
}
