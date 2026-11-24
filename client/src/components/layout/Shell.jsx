import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BedDouble,
  ClipboardList,
  DoorOpen,
  FileText,
  Wallet,
  Phone,
  Users,
  Zap,
  CircleDollarSign,
  Building2,
  Bell,
  PanelLeftOpen,
  PanelLeftClose,
  Menu,
  ChevronRight,
  CheckCheck,
  ArrowRight,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api, date, labels } from "../../services/api";
import logoLight from "../../../img/logo/Mainlogo-light.png";

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
  { to: "/readings", label: "Chỉ số điện nước", icon: Zap },
  { to: "/billing", label: "Khoản thu", icon: CircleDollarSign },
  { to: "/invoices", label: "Công nợ", icon: Wallet },
];
// Đây là ghi chú mẫu: Sidebar của vai trò ADMIN chỉ gồm các mục quản trị hệ thống cốt lõi, không chứa menu của Staff
const navAdmin = [
  { to: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { to: "/staff", label: "Quản lý tài khoản", icon: Users },
  { to: "/buildings", label: "Tòa nhà", icon: Building2 },
  { to: "/room-types", label: "Loại phòng", icon: BedDouble },
  { to: "/rooms", label: "Phòng", icon: DoorOpen },
  { to: "/periods", label: "Kỳ thu", icon: ClipboardList },
  { to: "/pricing", label: "Đơn giá", icon: CircleDollarSign },
];

function SwipeableNotificationItem({ item, onOpen, onDelete }) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const isMouseDownRef = useRef(false);
  const hasDraggedRef = useRef(false);

  // Xử lý vuốt trên màn hình cảm ứng
  const handleTouchStart = (e) => {
    hasDraggedRef.current = false;
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startXRef.current;
    currentXRef.current = e.touches[0].clientX;
    if (Math.abs(diff) > 4) {
      hasDraggedRef.current = true;
    }
    let clamped = diff;
    if (Math.abs(diff) > 130) {
      const sign = diff > 0 ? 1 : -1;
      clamped = sign * (130 + (Math.abs(diff) - 130) * 0.25);
    }
    setDragX(clamped);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const diff = currentXRef.current - startXRef.current;
    if (Math.abs(diff) > 75) {
      setIsExiting(diff > 0 ? "right" : "left");
      setTimeout(() => {
        onDelete(item.id);
      }, 200);
    } else {
      setDragX(0);
    }
    if (hasDraggedRef.current) {
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 350);
    }
  };

  // Xử lý kéo bằng chuột trên máy tính bàn
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    isMouseDownRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.clientX;
    currentXRef.current = e.clientX;
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isMouseDownRef.current) return;
      const diff = e.clientX - startXRef.current;
      currentXRef.current = e.clientX;
      if (Math.abs(diff) > 4) {
        hasDraggedRef.current = true;
      }
      let clamped = diff;
      if (Math.abs(diff) > 130) {
        const sign = diff > 0 ? 1 : -1;
        clamped = sign * (130 + (Math.abs(diff) - 130) * 0.25);
      }
      setDragX(clamped);
    };

    const handleMouseUp = () => {
      if (!isMouseDownRef.current) return;
      isMouseDownRef.current = false;
      setIsDragging(false);
      const diff = currentXRef.current - startXRef.current;
      if (Math.abs(diff) > 75) {
        setIsExiting(diff > 0 ? "right" : "left");
        setTimeout(() => {
          onDelete(item.id);
        }, 200);
      } else {
        setDragX(0);
      }
      if (hasDraggedRef.current) {
        setTimeout(() => {
          hasDraggedRef.current = false;
        }, 350);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [item.id, onDelete]);

  const handleClick = (e) => {
    if (
      hasDraggedRef.current ||
      Math.abs(currentXRef.current - startXRef.current) > 4
    ) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onOpen(item);
  };

  const isDraggingActive = Math.abs(dragX) > 6 || !!isExiting;
  const isSwipingLeft = dragX < -15;
  const isSwipingRight = dragX > 15;
  const isWillDelete = Math.abs(dragX) > 75;

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderBottom: "1px solid rgba(219, 228, 239, 0.4)",
        background: "transparent",
        transition: isExiting
          ? "max-height 0.22s ease, opacity 0.22s ease"
          : "none",
        maxHeight: isExiting ? "0px" : "110px",
        opacity: isExiting ? 0 : 1,
      }}
    >
      {/* Nền hiển thị hành động xóa khi người dùng thực hiện thao tác kéo - cũng trong suốt */}
      {isDraggingActive && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent:
              isSwipingRight || isExiting === "right"
                ? "flex-start"
                : "flex-end",
            padding: "0 18px",
            background:
              isWillDelete || isExiting
                ? "rgba(239, 68, 68, 0.22)"
                : "rgba(239, 68, 68, 0.12)",
            color: isWillDelete || isExiting ? "#dc2626" : "#e11d48",
            fontWeight: 700,
            fontSize: "12px",
            gap: "6px",
            transition: "background 0.15s ease, color 0.15s ease",
          }}
        ></div>
      )}

      {/* Thẻ thông báo di chuyển theo thao tác kéo - giữ độ trong suốt */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onClickCapture={(e) => {
          if (
            hasDraggedRef.current ||
            Math.abs(currentXRef.current - startXRef.current) > 4
          ) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "flex-start",
          width: "100%",
          gap: "10px",
          padding: "11px 14px",
          background:
            isHovered && !isDragging
              ? "rgba(255, 255, 255, 0.16)"
              : isDragging
                ? "rgba(255, 255, 255, 0.14)"
                : "transparent",
          color: "var(--text, #172b4d)",
          cursor: isDragging ? "grabbing" : "pointer",
          userSelect: "none",
          transform: isExiting
            ? `translateX(${isExiting === "right" ? "100%" : "-100%"})`
            : `translateX(${dragX}px)`,
          opacity: isExiting ? 0 : 1,
          transition: isDragging
            ? "none"
            : "transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.22s ease, background 0.15s ease",
        }}
      >
        <span
          style={{
            display: "grid",
            placeItems: "center",
            flex: "0 0 28px",
            height: "28px",
            borderRadius: "8px",
            background: item.read ? "#f1f5f9" : "#e0f2fe",
            color: item.read ? "#64748b" : "#0284c7",
            marginTop: "1px",
            flexShrink: 0,
          }}
        >
          <Bell size={15} />
        </span>

        <div style={{ display: "grid", gap: "2px", minWidth: 0, flex: 1 }}>
          <strong
            style={{
              fontSize: "13px",
              color: item.read ? "#334155" : "#0f172a",
              fontWeight: item.read ? 600 : 700,
            }}
          >
            {item.title}
          </strong>
          <span
            style={{
              fontSize: "12px",
              color: "#64748b",
              lineHeight: "1.35",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {item.body}
          </span>
          <small
            style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}
          >
            {date(item.createdAt)}
          </small>
        </div>

        {!item.read && (
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#0284c7",
              flexShrink: 0,
              marginTop: "5px",
            }}
          />
        )}
      </div>
    </div>
  );
}

const DISMISSED_DROPDOWN_KEY = "ktx_dismissed_dropdown_notifications";
const getDismissedDropdownIds = () => {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_DROPDOWN_KEY) || "[]");
  } catch {
    return [];
  }
};
const addDismissedDropdownId = (id) => {
  try {
    const list = getDismissedDropdownIds();
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(DISMISSED_DROPDOWN_KEY, JSON.stringify(list));
    }
  } catch {}
};

function Shell({ children }) {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("ktx_sidebar_collapsed") === "1",
  );
  const [popover, setPopover] = useState(null);
  const [headerScrolled, setHeaderScrolled] = useState(
    () => window.scrollY > 18,
  );
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [workQueue, setWorkQueue] = useState({});
  const notificationSignature = useRef(null);
  const workSignature = useRef(null);
  const headerMenus = useRef(null);
  const location = useLocation();
  const staffRole =
    session.user.role === "STAFF" || session.user.role === "ADMIN";
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
        const dismissed = new Set(getDismissedDropdownIds());
        const dropdownItems = items.filter((item) => !dismissed.has(item.id));
        const totalUnread =
          data.unreadCount ?? items.filter((item) => !item.read).length;
        const signature = `${totalUnread}|${dropdownItems.map((item) => `${item.id}:${item.read}`).join("|")}`;
        if (
          notificationSignature.current !== null &&
          notificationSignature.current !== signature
        )
          window.dispatchEvent(new Event("inbox-changed"));
        notificationSignature.current = signature;
        setNotifications(dropdownItems);
        setUnreadCount(totalUnread);
        setNotificationsError("");
      })
      .catch((error) => setNotificationsError(error.message))
      .finally(() => setNotificationsLoaded(true));
  };
  const refreshWorkQueue = () => {
    if (!staffRole) return;
    api("/work-queue")
      .then((data) => {
        const signature = JSON.stringify(data);
        if (
          workSignature.current !== null &&
          workSignature.current !== signature
        )
          window.dispatchEvent(new Event("work-queue-changed"));
        workSignature.current = signature;
        setWorkQueue(data);
      })
      .catch(() => {});
  };
  useEffect(() => {
    const refresh = () => {
      refreshNotifications();
      refreshWorkQueue();
    };
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
  const markAllNotificationsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await api("/notifications/read-all", { method: "PATCH" });
      setNotifications((current) =>
        current.map((entry) => ({ ...entry, read: true })),
      );
      setUnreadCount(0);
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (error) {
      setNotificationsError(error.message);
    }
  };
  const deleteNotificationItem = (id) => {
    // Chỉ xóa khỏi dropdown (không gọi API DELETE, giữ nguyên trên trang Cập nhật dành cho bạn)
    addDismissedDropdownId(id);
    setNotifications((current) => current.filter((entry) => entry.id !== id));
  };
  const nav =
    session.user.role === "STUDENT"
      ? navStudent
      : session.user.role === "ADMIN"
        ? navAdmin
        : navStaff;
  const pendingByPath = staffRole
    ? {
        "/applications": workQueue.applications || 0,
        "/requests": workQueue.requests || 0,
        "/readings": workQueue.readings || 0,
        "/billing": workQueue.billing || 0,
        "/invoices": workQueue.invoices || 0,
      }
    : {};
  return (
    <div className="app-shell">
      <aside
        className={`sidebar ${open ? "open" : ""} ${collapsed && !open ? "collapsed" : ""}`}
      >
        <div className="sidebar-heading">
          {collapsed ? (
            <button
              type="button"
              className="brand brand-toggle-btn"
              onClick={() => setCollapsed(false)}
              title="Mở rộng thanh điều hướng"
              aria-label="Mở rộng thanh điều hướng"
            >
              <span className="brand-icon brand-icon-img">
                <img
                  src={logoLight}
                  alt="Logo"
                  className="brand-logo logo-normal"
                />
                <span className="logo-hover-icon">
                  <PanelLeftOpen size={20} strokeWidth={2.2} />
                </span>
              </span>
            </button>
          ) : (
            <>
              <Link to="/" className="brand" aria-label="Về trang chủ">
                <span className="brand-icon brand-icon-img">
                  <img src={logoLight} alt="Logo" className="brand-logo" />
                </span>
              </Link>
              <button
                type="button"
                className="icon-button sidebar-collapse"
                title="Thu gọn thanh điều hướng"
                aria-label="Thu gọn thanh điều hướng"
                aria-expanded="true"
                onClick={() => setCollapsed(true)}
              >
                <PanelLeftClose size={18} />
              </button>
            </>
          )}
        </div>
        <nav>
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={
                collapsed
                  ? `${label}${pendingByPath[to] ? ` · ${pendingByPath[to]} chưa hoàn thành` : ""}`
                  : undefined
              }
              aria-label={`${label}${pendingByPath[to] ? `, ${pendingByPath[to]} chưa hoàn thành` : ""}`}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon">
                <Icon size={18} />
                {pendingByPath[to] > 0 && <span className="nav-pending-dot" />}
              </span>
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
                  setPopover((current) =>
                    current === "notifications" ? null : "notifications",
                  );
                  refreshNotifications();
                }}
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span className="notification-count">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              {popover === "notifications" && (
                <div
                  className="top-popover notifications-popover"
                  role="dialog"
                  aria-label="Thông báo của bạn"
                >
                  <div
                    className="top-popover-head"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "13px 15px 11px",
                      borderBottom: "1px solid rgba(219, 228, 239, 0.45)",
                      background: "transparent",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                      }}
                    >
                      <strong style={{ fontSize: "14px" }}>Thông báo</strong>
                      <span
                        style={{
                          fontSize: "12px",
                          color: unreadCount > 0 ? "#0284c7" : "var(--muted)",
                          fontWeight: unreadCount > 0 ? 600 : 400,
                        }}
                      >
                        {unreadCount > 0
                          ? `(${unreadCount} chưa đọc)`
                          : "(Đã đọc hết)"}
                      </span>
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#0284c7",
                          fontSize: "12.5px",
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: "2px 7px",
                          borderRadius: "6px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(255, 255, 255, 0.16)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "none")
                        }
                        title="Đánh dấu tất cả thông báo là đã đọc"
                      >
                        <CheckCheck size={14} />
                        Đọc tất cả
                      </button>
                    )}
                  </div>

                  <div
                    className="top-popover-list"
                    style={{
                      maxHeight: "295px",
                      overflowY: "auto",
                      overflowX: "hidden",
                    }}
                  >
                    {notificationsError && (
                      <p className="top-popover-message error">
                        {notificationsError}
                      </p>
                    )}
                    {!notificationsLoaded && (
                      <p className="top-popover-message">
                        Đang tải thông báo...
                      </p>
                    )}
                    {notificationsLoaded &&
                      !notifications.length &&
                      !notificationsError && (
                        <p className="top-popover-message">
                          Chưa có thông báo nào.
                        </p>
                      )}
                    {notifications.map((item) => (
                      <SwipeableNotificationItem
                        key={item.id}
                        item={item}
                        onOpen={openNotification}
                        onDelete={deleteNotificationItem}
                      />
                    ))}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "10px 14px",
                      borderTop: "1px solid rgba(219, 228, 239, 0.45)",
                      background: "transparent",
                    }}
                  >
                    <Link
                      to="/notifications"
                      className="top-popover-footer"
                      style={{
                        padding: "2px 10px",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        color: "#0f172a",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      onClick={() => setPopover(null)}
                    >
                      Xem tất cả thông báo <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <div className="top-menu-wrap">
              <button
                type="button"
                className="top-avatar"
                aria-label="Mở menu tài khoản"
                aria-expanded={popover === "account"}
                aria-haspopup="menu"
                onClick={() =>
                  setPopover((current) =>
                    current === "account" ? null : "account",
                  )
                }
              >
                {session.profile?.fullName?.charAt(0) || "N"}
              </button>
              {popover === "account" && (
                <div
                  className="top-popover account-popover"
                  role="menu"
                  aria-label="Tài khoản"
                >
                  <div className="account-popover-user">
                    <strong>
                      {session.profile?.fullName || session.user.email}
                    </strong>
                    <span>{labels[session.user.role]}</span>
                  </div>
                  <Link
                    to="/profile"
                    role="menuitem"
                    onClick={() => setPopover(null)}
                  >
                    <Users size={17} />
                    Hồ sơ
                  </Link>
                  <button
                    type="button"
                    className="account-logout"
                    role="menuitem"
                    onClick={logout}
                  >
                    <LogOut size={17} />
                    Đăng xuất
                  </button>
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

export default Shell;
