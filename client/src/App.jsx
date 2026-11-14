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
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  Bell,
  BedDouble,
  Building2,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock,
  CreditCard,
  DoorOpen,
  Droplets,
  FileSpreadsheet,
  FileText,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Phone,
  Plus,
  RotateCw,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { api, money, date, dateTime, labels } from "./services/api";
import * as XLSX from "xlsx";
import RoomTypeEditor from "./components/RoomTypeEditor";
import RoomEditor from "./components/RoomEditor";
import RoomGallery, { coverOf } from "./components/RoomGallery";
import LandingPage from "./pages/LandingPage";
import LandingNav from "./components/landing/LandingNav";
import ContactPage from "./pages/ContactPage";
import logoLight from "../img/logo/Mainlogo-light.png";
import logoDark from "../img/logo/Mainlogo-Dark.png";

const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);
const badge = (value) => (
  <span
    className={`badge badge-${String(value || "").toLowerCase()}`}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      margin: 0,
    }}
  >
    {labels[value] || value || "—"}
  </span>
);
const Text = ({ children }) => <span className="muted">{children || "—"}</span>;
const durationOptions = [1, 3, 6, 12].map((months) => ({
  value: String(months),
  label: `${months} tháng`,
}));
function endAfterMonths(startDate, months) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate || "") ||
    ![1, 3, 6, 12].includes(Number(months))
  )
    return "";
  const start = new Date(`${startDate}T00:00:00Z`);
  if (
    Number.isNaN(start.getTime()) ||
    start.toISOString().slice(0, 10) !== startDate
  )
    return "";
  const target = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + Number(months), 1),
  );
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(start.getUTCDate(), lastDay));
  return target.toISOString().slice(0, 10);
}

function formatStayPeriod(snap) {
  if (!snap?.stayStartInPeriod || !snap?.stayEndInPeriod) return "";
  const sParts = String(snap.stayStartInPeriod).split("-");
  const eParts = String(snap.stayEndInPeriod).split("-");
  if (sParts.length === 3 && eParts.length === 3) {
    return `${sParts[2]}/${sParts[1]} - ${eParts[2]}/${eParts[1]}`;
  }
  return "";
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
// Đây là ghi chú mẫu: Component SearchableSelect cho phép gõ tìm kiếm và tự động lọc danh sách lựa chọn trong thời gian thực
function SearchableSelect({
  name,
  value,
  onChange,
  options = [],
  placeholder = "Nhập để tìm kiếm...",
  required = false,
  disabled = false,
  emptyText = "Không tìm thấy kết quả phù hợp",
  clearable = true,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  // Tìm option đang được chọn theo value
  const selectedOption = useMemo(
    () => options.find((o) => String(o.value) === String(value)),
    [options, value],
  );

  // Đóng dropdown khi nhấp chuột ra ngoài phạm vi container
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Tự động lọc danh sách theo từ khóa tìm kiếm (so khớp nhãn, mã, phụ chú...)
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter((o) => {
      const matchLabel = o.label?.toLowerCase().includes(q);
      const matchSub = o.sublabel?.toLowerCase().includes(q);
      const matchVal = String(o.value)?.toLowerCase().includes(q);
      const matchBadge = o.badge?.toLowerCase().includes(q);
      const matchCode = o.code?.toLowerCase().includes(q);
      const matchStudentCode = o.studentCode?.toLowerCase().includes(q);
      return (
        matchLabel ||
        matchSub ||
        matchVal ||
        matchBadge ||
        matchCode ||
        matchStudentCode
      );
    });
  }, [options, search]);

  const handleSelect = (opt) => {
    onChange(opt.value, opt);
    setSearch("");
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("", null);
    setSearch("");
  };

  return (
    <div
      ref={containerRef}
      className={`searchable-select-wrap ${disabled ? "is-disabled" : ""}`}
      style={{ position: "relative", width: "100%", zIndex: open ? 100 : 1 }}
    >
      <input
        type="text"
        name={name}
        value={value || ""}
        required={required}
        readOnly
        tabIndex={-1}
        style={{
          opacity: 0,
          width: 1,
          height: 1,
          position: "absolute",
          bottom: 0,
          left: 10,
          pointerEvents: "none",
        }}
      />
      <div
        className={`searchable-select-box ${open ? "is-open" : ""}`}
        onClick={() => {
          if (!disabled) setOpen(true);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          minHeight: "40px",
          padding: "6px 11px",
          background: disabled ? "#f5f8f8" : "#ffffff",
          border: open ? "1px solid #222222" : "1px solid #dfe8ea",
          boxShadow: open ? "0 0 0 3px rgba(34, 34, 34, 0.12)" : "none",
          borderRadius: "8px",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        }}
      >
        <Search size={16} style={{ color: "#839ba7", flexShrink: 0 }} />

        {open ? (
          <input
            type="text"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onBlur={() => {
              if (search.trim()) {
                const q = search.toLowerCase().trim();
                const match = options.find(
                  (o) =>
                    o.code?.toLowerCase() === q ||
                    o.label?.toLowerCase() === q ||
                    `phòng ${o.code}`.toLowerCase() === q,
                );
                if (match) {
                  handleSelect(match);
                }
              }
            }}
            placeholder={placeholder}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              padding: 0,
              fontSize: "14px",
              color: "#375461",
              minWidth: "60px",
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "Enter" && filteredOptions.length > 0) {
                e.preventDefault();
                handleSelect(filteredOptions[0]);
              }
            }}
          />
        ) : selectedOption ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
                marginRight: "4px",
              }}
            >
              <span
                style={{
                  fontSize: "13.5px",
                  fontWeight: 600,
                  color: "#2d434e",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && (
                <span
                  style={{
                    fontSize: "12px",
                    color: "#748a94",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {selectedOption.sublabel}
                </span>
              )}
            </div>
            {selectedOption.badge && (
              <span
                className="badge"
                style={{
                  fontSize: "11px",
                  padding: "2px 6px",
                  flexShrink: 0,
                }}
              >
                {selectedOption.badge}
              </span>
            )}
          </div>
        ) : (
          <span
            style={{
              flex: 1,
              fontSize: "14px",
              color: "#9aaab1",
              userSelect: "none",
            }}
          >
            {placeholder}
          </span>
        )}

        {clearable && value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            title="Xóa lựa chọn"
            style={{
              border: "none",
              background: "transparent",
              color: "#9aaab1",
              cursor: "pointer",
              padding: "2px",
              display: "flex",
              alignItems: "center",
              borderRadius: "50%",
            }}
          >
            <X size={15} />
          </button>
        )}

        <ChevronDown
          size={16}
          style={{
            color: "#839ba7",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s ease",
            flexShrink: 0,
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) setOpen(!open);
          }}
        />
      </div>

      {open && (
        <div
          className="searchable-select-menu"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 9999,
            background: "#ffffff",
            border: "1px solid #dfe8ea",
            borderRadius: "8px",
            boxShadow: "0 10px 25px rgba(27, 46, 56, 0.15)",
            maxHeight: "250px",
            overflowY: "auto",
            padding: "4px 0",
          }}
        >
          {filteredOptions.length === 0 ? (
            <div
              style={{
                padding: "12px",
                textAlign: "center",
                color: "#8d9fa8",
                fontSize: "13px",
              }}
            >
              {emptyText} {search ? `cho "${search}"` : ""}
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <div
                  key={opt.value}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(opt);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(opt);
                  }}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: isSelected ? "#f4f4f5" : "transparent",
                    borderLeft: isSelected
                      ? "3px solid #6a9bab"
                      : "3px solid transparent",
                    transition: "background 0.1s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected)
                      e.currentTarget.style.background = "#f7fafb";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13.5px",
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? "#244450" : "#375461",
                        }}
                      >
                        {opt.label}
                      </span>
                      {opt.badge && (
                        <span
                          className="badge"
                          style={{
                            fontSize: "11px",
                            padding: "1px 5px",
                          }}
                        >
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    {opt.sublabel && (
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#7b919c",
                          marginTop: "2px",
                        }}
                      >
                        {opt.sublabel}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check
                      size={16}
                      style={{
                        color: "#222222",
                        flexShrink: 0,
                        marginLeft: "8px",
                      }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options = [],
  placeholder = "Tất cả",
  searchable = true,
  searchPlaceholder = "Tìm kiếm...",
  className = "",
  style = {},
  minWidth = "140px",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open && searchable && options.length > 5) {
      setTimeout(() => searchInputRef.current?.focus(), 40);
    } else {
      setSearch("");
    }
  }, [open, searchable, options.length]);

  const selected = useMemo(() => {
    return options.find((o) => String(o.value) === String(value));
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.trim().toLowerCase();
    return options.filter((o) =>
      (o.label || "").toLowerCase().includes(q) ||
      (o.code || "").toLowerCase().includes(q),
    );
  }, [options, search]);

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  const showSearch = searchable && options.length > 5;

  return (
    <div
      ref={wrapRef}
      className={`filter-select-wrap ${className}`}
      style={{
        position: "relative",
        display: "inline-block",
        minWidth,
        ...style,
      }}
    >
      <button
        type="button"
        className={`filter-select-trigger ${open ? "is-open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          width: "100%",
          minHeight: "40px",
          padding: "8px 12px",
          background: "#ffffff",
          border: open ? "1.5px solid #292d27" : "1px solid #d5d2c6",
          borderRadius: "10px",
          color: selected?.value !== "" && value !== "" ? "#1e293b" : "#64748b",
          fontSize: "13.5px",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: open
            ? "0 0 0 3px rgba(41, 45, 39, 0.08)"
            : "0 1px 2px rgba(0,0,0,0.03)",
          transition: "all 0.15s ease",
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {selected?.label || placeholder}
        </span>
        <ChevronDown
          size={15}
          style={{
            color: "#8c877a",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.18s ease",
            flexShrink: 0,
          }}
        />
      </button>

      {open && (
        <div
          className="filter-select-dropdown"
          style={{
            position: "absolute",
            top: "calc(100% + 5px)",
            left: 0,
            zIndex: 9999,
            width: "max(100%, 200px)",
            background: "#ffffff",
            border: "1px solid #d5d2c6",
            borderRadius: "12px",
            boxShadow: "0 12px 30px rgba(41, 45, 39, 0.16)",
            padding: "6px",
          }}
        >
          {showSearch && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "6px 9px",
                background: "#f1f5f9",
                borderRadius: "8px",
                marginBottom: "6px",
                border: "1px solid #e2e8f0",
              }}
            >
              <Search size={13} style={{ color: "#64748b", flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                style={{
                  width: "100%",
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: "12.5px",
                  color: "#1e293b",
                  fontWeight: 500,
                  padding: 0,
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "#94a3b8",
                    padding: 0,
                    display: "flex",
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}

          <div
            style={{
              maxHeight: "210px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            {filteredOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "7px 10px",
                    borderRadius: "7px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: isSelected ? 700 : 500,
                    background: isSelected ? "#f1f5f9" : "transparent",
                    color: isSelected ? "#ac482d" : "#334155",
                    transition: "background 0.12s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "#f8fafc";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <Check size={14} style={{ color: "#ac482d" }} />
                  )}
                </div>
              );
            })}

            {filteredOptions.length === 0 && (
              <div
                style={{
                  padding: "12px 8px",
                  textAlign: "center",
                  color: "#94a3b8",
                  fontSize: "12.5px",
                }}
              >
                Không có lựa chọn phù hợp
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PeriodSelect({
  value,
  onChange,
  periods = [],
  placeholder = "Tất cả kỳ thu",
  allowClear = true,
  className = "",
  style = {},
  minWidth = "170px",
  showPrefix = true,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 40);
    } else {
      setSearch("");
    }
  }, [open]);

  const sortedPeriods = useMemo(() => {
    const list = Array.isArray(periods) ? periods : [];
    return [...list].sort((a, b) => (b.month || "").localeCompare(a.month || ""));
  }, [periods]);

  const selectedItem = useMemo(() => {
    return sortedPeriods.find(
      (p) => String(p.id) === String(value) || String(p.month) === String(value),
    );
  }, [sortedPeriods, value]);

  const filteredPeriods = useMemo(() => {
    if (!search.trim()) return sortedPeriods;
    const q = search.trim().toLowerCase();
    return sortedPeriods.filter((p) => (p.month || "").toLowerCase().includes(q));
  }, [sortedPeriods, search]);

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  const displayText = selectedItem
    ? (showPrefix ? `Kỳ ${selectedItem.month}` : selectedItem.month)
    : placeholder;

  return (
    <div
      ref={wrapRef}
      className={`period-select-wrap ${className}`}
      style={{
        position: "relative",
        display: "inline-block",
        minWidth,
        ...style,
      }}
    >
      <button
        type="button"
        className={`period-select-trigger ${open ? "is-open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          width: "100%",
          minHeight: "40px",
          padding: "8px 12px",
          background: "#ffffff",
          border: open ? "1.5px solid #292d27" : "1px solid #d5d2c6",
          borderRadius: "10px",
          color: selectedItem ? "#1e293b" : "#64748b",
          fontSize: "13.5px",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: open
            ? "0 0 0 3px rgba(41, 45, 39, 0.08)"
            : "0 1px 2px rgba(0,0,0,0.03)",
          transition: "all 0.15s ease",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}>
          <Calendar size={15} style={{ color: "#8c877a" }} />
          <span>{displayText}</span>
        </span>
        <ChevronDown
          size={15}
          style={{
            color: "#8c877a",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.18s ease",
            flexShrink: 0,
          }}
        />
      </button>

      {open && (
        <div
          className="period-select-dropdown"
          style={{
            position: "absolute",
            top: "calc(100% + 5px)",
            left: 0,
            zIndex: 9999,
            width: "max(100%, 220px)",
            background: "#ffffff",
            border: "1px solid #d5d2c6",
            borderRadius: "12px",
            boxShadow: "0 12px 30px rgba(41, 45, 39, 0.16)",
            padding: "7px",
          }}
        >
          {/* Ô nhập tìm kỳ thu: màu xám nhạt, placeholder 'Tìm kỳ thu...' */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "7px 10px",
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              marginBottom: "6px",
            }}
          >
            <Search size={14} style={{ color: "#94a3b8", flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kỳ thu..."
              style={{
                width: "100%",
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: "13px",
                color: "#1e293b",
                padding: 0,
              }}
            />
          </div>

          <div
            style={{
              maxHeight: "210px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            {allowClear && (
              <div
                onClick={() => handleSelect("")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: "7px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: !value ? 700 : 500,
                  background: !value ? "#f8fafc" : "transparent",
                  color: !value ? "#ac482d" : "#334155",
                  transition: "background 0.12s ease",
                }}
                onMouseEnter={(e) => {
                  if (value) e.currentTarget.style.background = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  if (value) e.currentTarget.style.background = "transparent";
                }}
              >
                <span>{placeholder}</span>
                {!value && <Check size={14} style={{ color: "#ac482d" }} />}
              </div>
            )}

            {filteredPeriods.map((p) => {
              const isSelected =
                String(p.id) === String(value) || String(p.month) === String(value);
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelect(p.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    borderRadius: "7px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: isSelected ? 700 : 500,
                    background: isSelected ? "#f8fafc" : "transparent",
                    color: isSelected ? "#ac482d" : "#334155",
                    transition: "background 0.12s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "#f8fafc";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span>{showPrefix ? `Kỳ ${p.month}` : p.month}</span>
                  {isSelected && <Check size={14} style={{ color: "#ac482d" }} />}
                </div>
              );
            })}

            {filteredPeriods.length === 0 && (
              <div
                style={{
                  padding: "12px 8px",
                  textAlign: "center",
                  color: "#94a3b8",
                  fontSize: "12.5px",
                }}
              >
                Không tìm thấy kỳ thu nào
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Đây là ghi chú mẫu: Render component trường nhập liệu (hỗ trợ chế độ searchable select để lọc thời gian thực)
function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  options,
  searchable = false,
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
  const isCustom = searchable && options;
  const Wrapper = isCustom ? "div" : "label";
  return (
    <Wrapper className="field">
      <span>
        {label}
        {required && <em>*</em>}
      </span>
      {isCustom ? (
        <SearchableSelect
          name={name}
          value={value}
          onChange={(val) => change({ target: { name, value: val } })}
          options={options}
          placeholder={placeholder || `Nhập để lọc ${label.toLowerCase()}...`}
          required={required}
        />
      ) : options ? (
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
    </Wrapper>
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
function Pagination({ page, total, onChange }) {
  return <Pager data={{ page, pages: total, total }} page={page} setPage={onChange} />;
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
    if (hasDraggedRef.current || Math.abs(currentXRef.current - startXRef.current) > 4) {
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
        transition: isExiting ? "max-height 0.22s ease, opacity 0.22s ease" : "none",
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
            justifyContent: isSwipingRight || isExiting === "right" ? "flex-start" : "flex-end",
            padding: "0 18px",
            background: isWillDelete || isExiting
              ? "rgba(239, 68, 68, 0.22)"
              : "rgba(239, 68, 68, 0.12)",
            color: isWillDelete || isExiting ? "#dc2626" : "#e11d48",
            fontWeight: 700,
            fontSize: "12px",
            gap: "6px",
            transition: "background 0.15s ease, color 0.15s ease",
          }}
        >
          
        </div>
      )}

      {/* Thẻ thông báo di chuyển theo thao tác kéo - giữ độ trong suốt */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onClickCapture={(e) => {
          if (hasDraggedRef.current || Math.abs(currentXRef.current - startXRef.current) > 4) {
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
          background: isHovered && !isDragging
            ? "rgba(255, 255, 255, 0.16)"
            : (isDragging ? "rgba(255, 255, 255, 0.14)" : "transparent"),
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
          <small style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
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
                  <img
                    src={logoLight}
                    alt="Logo"
                    className="brand-logo"
                  />
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
                    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                      <strong style={{ fontSize: "14px" }}>Thông báo</strong>
                      <span
                        style={{
                          fontSize: "12px",
                          color: unreadCount > 0 ? "#0284c7" : "var(--muted)",
                          fontWeight: unreadCount > 0 ? 600 : 400,
                        }}
                      >
                        {unreadCount > 0 ? `(${unreadCount} chưa đọc)` : "(Đã đọc hết)"}
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
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.16)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
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
          <span className="brand-icon brand-icon-img">
            <img src={logoDark} alt="Logo Nhóm 05" className="brand-logo" />
          </span>
          <div>
            <strong>Nhóm 05</strong>
            <small>QUẢN LÝ KÝ TÚC XÁ</small>
          </div>    
        </Link>
        <div className="auth-content">
          
          <h1>{register ? "Tạo tài khoản" : "Đăng nhập"}</h1>
          
          <form onSubmit={submit}>
            <div className="form-grid">
              {register && (
                <>
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
        </div>
        <div className="auth-footer">
          © {new Date().getFullYear()} Nhóm 05 · Quản lý ký túc xá
        </div>
      </div>
      <div className="auth-visual">
        <div className="visual-top">NHÓM 05 · QUẢN LÝ KÝ TÚC XÁ</div>
        <div className="visual-copy">
          <span>PHÒNG Ở VÀ LƯU TRÚ</span>
          <h2>
            Tìm phòng, <br />
            đăng ký và <br />
            theo dõi lưu trú.
          </h2>
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
function ExportLogsModal({ onClose }) {
  const [mode, setMode] = useState("day"); // 'day' | 'week' | 'month' | 'all'
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const thisMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const [selectedDay, setSelectedDay] = useState(todayStr);
  const [selectedMonth, setSelectedMonth] = useState(thisMonthStr);
  const [exporting, setExporting] = useState(false);
  const [previewCount, setPreviewCount] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState("");

  const getRange = () => {
    let from = null;
    let to = null;
    let label = "";

    if (mode === "day") {
      from = new Date(`${selectedDay}T00:00:00`).toISOString();
      to = new Date(`${selectedDay}T23:59:59.999`).toISOString();
      label = `Ngày ${selectedDay}`;
    } else if (mode === "week") {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      from = sevenDaysAgo.toISOString();
      to = now.toISOString();
      label = `7 ngày gần nhất`;
    } else if (mode === "month") {
      const [year, month] = selectedMonth.split("-").map(Number);
      from = new Date(year, month - 1, 1).toISOString();
      to = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
      label = `Tháng ${selectedMonth}`;
    } else {
      label = `Toàn bộ thời gian`;
    }

    return { from, to, label };
  };

  useEffect(() => {
    let alive = true;
    setPreviewLoading(true);
    const { from, to } = getRange();
    const query = new URLSearchParams({ all: "true" });
    if (from) query.set("from", from);
    if (to) query.set("to", to);

    api(`/activity-logs?${query.toString()}`)
      .then((res) => {
        if (!alive) return;
        setPreviewCount(res.items?.length || 0);
        setPreviewLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setPreviewLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [mode, selectedDay, selectedMonth]);

  const handleExport = async () => {
    setExporting(true);
    setError("");
    try {
      const { from, to } = getRange();
      const query = new URLSearchParams({ all: "true" });
      if (from) query.set("from", from);
      if (to) query.set("to", to);

      const res = await api(`/activity-logs?${query.toString()}`);
      const logs = res.items || [];

      if (!logs.length) {
        setError("Không có nhật ký nào trong khoảng thời gian đã chọn để xuất.");
        setExporting(false);
        return;
      }

      const rows = logs.map((log, idx) => ({
        "STT": idx + 1,
        "Thời gian": log.time || log.createdAt ? new Date(log.time || log.createdAt).toLocaleString("vi-VN") : "",
        "Hành động": log.action || "",
        "Tiêu đề": log.title || "",
        "Nội dung chi tiết": log.body || "",
        "Đối tượng": log.target || "",
        "Người thực hiện": log.actorName || "",
        "Vai trò":
          log.actorRole === "ADMIN"
            ? "Ban Giám đốc / QL Hệ thống"
            : log.actorRole === "STAFF"
            ? "Cán bộ Vận hành"
            : "Sinh viên",
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 20 },
        { wch: 28 },
        { wch: 40 },
        { wch: 55 },
        { wch: 20 },
        { wch: 25 },
        { wch: 24 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "NhatKyHoatDong");

      const fileSuffix =
        mode === "day"
          ? `Ngay_${selectedDay}`
          : mode === "week"
          ? `Tuan_7NgayGanNhat`
          : mode === "month"
          ? `Thang_${selectedMonth}`
          : "ToanBo";

      XLSX.writeFile(workbook, `NhatKyHeThong_${fileSuffix}.xlsx`);
      onClose();
    } catch (err) {
      setError(err.message || "Lỗi khi xuất file Excel.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal title="Xuất nhật ký hoạt động hệ thống" onClose={onClose}>
      <div style={{ display: "grid", gap: "18px" }}>
        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: "8px",
              color: "#b91c1c",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        <div>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "13.5px", fontWeight: 700, color: "#1e293b" }}>
            Chọn khoảng thời gian xuất nhật ký:
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "8px" }}>
            {[
              { id: "day", label: "Theo ngày" },
              { id: "week", label: "Theo tuần" },
              { id: "month", label: "Theo tháng" },
              { id: "all", label: "Toàn bộ" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setMode(t.id)}
                style={{
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: mode === t.id ? "1.5px solid #ac482d" : "1px solid #d5d2c6",
                  background: mode === t.id ? "#fbf6f3" : "#ffffff",
                  color: mode === t.id ? "#ac482d" : "#475569",
                  fontWeight: mode === t.id ? 700 : 500,
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {mode === "day" && (
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600, color: "#334155" }}>
              Chọn ngày cần xuất:
            </label>
            <input
              type="date"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              style={{
                width: "100%",
                minHeight: "40px",
                padding: "8px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                fontSize: "14px",
                color: "#1e293b",
                background: "#ffffff",
              }}
            />
          </div>
        )}

        {mode === "month" && (
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600, color: "#334155" }}>
              Chọn tháng cần xuất:
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                width: "100%",
                minHeight: "40px",
                padding: "8px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                fontSize: "14px",
                color: "#1e293b",
                background: "#ffffff",
              }}
            />
          </div>
        )}

        {mode === "week" && (
          <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", color: "#475569" }}>
            Phạm vi: <strong>7 ngày gần nhất</strong> tính đến thời điểm hiện tại.
          </div>
        )}

        {mode === "all" && (
          <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px", color: "#475569" }}>
            Phạm vi: <strong>Toàn bộ dữ liệu nhật ký</strong> lưu trong hệ thống.
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            fontSize: "13.5px",
          }}
        >
          <span style={{ color: "#166534", fontWeight: 500 }}>
            Số lượng bản ghi thỏa mãn:
          </span>
          <strong style={{ fontSize: "15px", color: "#15803d" }}>
            {previewLoading ? "Đang đếm..." : `${previewCount ?? 0} nhật ký`}
          </strong>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
          <button type="button" className="button button-outline" onClick={onClose} disabled={exporting}>
            Đóng
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={handleExport}
            disabled={exporting || previewLoading || previewCount === 0}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#0284c7",
              borderColor: "#0284c7",
            }}
          >
            <FileSpreadsheet size={16} />
            {exporting ? "Đang xuất Excel..." : "Xuất file Excel (.xlsx)"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function StayRequestModal({
  currentStay,
  initialType = "EXTEND",
  onClose,
  onSuccess,
}) {
  const [type, setType] = useState(initialType);
  const [months, setMonths] = useState(3);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const plannedEnd = currentStay?.plannedEndDate || todayStr;

  // Tính số ngày chênh lệch & phạt trễ hạn
  const { diffDays, isOverdue, overdueDays, penaltyAmount } = useMemo(() => {
    const dPlanned = new Date(`${plannedEnd}T00:00:00Z`);
    const dToday = new Date(`${todayStr}T00:00:00Z`);
    const diff = Math.round((dPlanned - dToday) / 86400000);
    const overdue = diff < 0;
    const days = overdue ? Math.abs(diff) : 0;
    const rate = 25000;
    return {
      diffDays: diff,
      isOverdue: overdue,
      overdueDays: days,
      penaltyRate: rate,
      penaltyAmount: days * rate,
    };
  }, [plannedEnd, todayStr]);

  const addDays = (dateStr, days) => {
    const d = new Date(`${dateStr}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const calcEndAfterMonths = (startDateStr, m) => {
    return endAfterMonths(startDateStr, m);
  };

  // Tính ngày bắt đầu chu kỳ mới & ngày dự kiến kết thúc theo đúng nghiệp vụ
  const { startDateForCycle, desiredEndDate } = useMemo(() => {
    if (type === "EXTEND") {
      let start;
      if (!isOverdue) {
        // Gia hạn trước khi phạt: lấy ngày hôm sau của chu kỳ trước
        start = addDays(plannedEnd, 1);
      } else {
        // Gia hạn khi quá hạn: tính ngày hôm sau của ngày bị phạt (ngày mai)
        start = addDays(todayStr, 1);
      }
      const end = calcEndAfterMonths(start, months);
      return { startDateForCycle: start, desiredEndDate: end };
    } else {
      // RETURN
      if (!isOverdue) {
        // Trả phòng đúng hạn: tự động lấy ngày dự kiến kết thúc
        return { startDateForCycle: plannedEnd, desiredEndDate: plannedEnd };
      } else {
        // Quá hạn: lấy ngày hôm sau của ngày phạt
        const retDate = addDays(todayStr, 1);
        return { startDateForCycle: retDate, desiredEndDate: retDate };
      }
    }
  }, [type, isOverdue, plannedEnd, todayStr, months]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Vui lòng nhập lý do.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api("/requests", {
        method: "POST",
        body: {
          type,
          months: type === "EXTEND" ? months : undefined,
          desiredDate: desiredEndDate,
          reason: reason.trim(),
        },
      });
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || "Không thể gửi yêu cầu.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={type === "EXTEND" ? "Gia hạn lưu trú KTX" : "Đăng ký trả phòng KTX"}
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        {/* Banner tình trạng hạn */}
        {isOverdue ? (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#ffffff",
              border: "1.5px solid #222222",
              color: "#222222",
              fontSize: "13.5px",
              lineHeight: "1.5",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: 700,
                marginBottom: "4px",
                color: "#222222",
              }}
            >
              <AlertCircle size={18} color="#dc2626" />
              Đang bị quá hạn lưu trú {overdueDays} ngày!
            </div>
            <div style={{ color: "#444444" }}>
              Chu kỳ cũ đã kết thúc vào ngày <strong>{date(plannedEnd)}</strong>.
              Hệ thống đang tính phí phạt trễ hạn:{" "}
              <strong style={{ color: "#dc2626" }}>
                {overdueDays} ngày × 25.000 ₫ = {money(penaltyAmount)}
              </strong>
              .
              {type === "EXTEND"
                ? ` Chu kỳ gia hạn mới sẽ bắt đầu tính từ ngày mai (${date(startDateForCycle)}).`
                : ` Ngày trả phòng được xác định là ngày mai (${date(desiredEndDate)}).`}
            </div>
          </div>
        ) : diffDays <= 3 ? (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#fef2f2",
              border: "1.5px solid #f87171",
              color: "#991b1b",
              fontSize: "13.5px",
              lineHeight: "1.5",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: 700,
                marginBottom: "4px",
              }}
            >
              <AlertTriangle size={18} color="#dc2626" />
              Cảnh báo: Chỉ còn{" "}
              {diffDays === 0 ? "hôm nay là ngày cuối" : `${diffDays} ngày cuối`}!
            </div>
            <div>
              Chu kỳ lưu trú sẽ kết thúc vào ngày <strong>{date(plannedEnd)}</strong>
              . Vui lòng gửi yêu cầu sớm để không phát sinh phí phạt trễ hạn
              (25.000 ₫/ngày).
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              background: "#f0fdf4",
              border: "1px solid #86efac",
              color: "#166534",
              fontSize: "13px",
            }}
          >
            Chu kỳ hiện tại đến ngày <strong>{date(plannedEnd)}</strong> (còn{" "}
            {diffDays} ngày).
          </div>
        )}

        {/* Chọn loại yêu cầu */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "6px",
              color: "var(--text-body, #334155)",
            }}
          >
            Loại yêu cầu <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <div className="stay-type-selector">
            <button
              type="button"
              className={`stay-type-btn ${type === "EXTEND" ? "active" : ""}`}
              onClick={() => setType("EXTEND")}
            >
              <RotateCw size={17} /> Gia hạn lưu trú
            </button>
            <button
              type="button"
              className={`stay-type-btn ${type === "RETURN" ? "active-return" : ""}`}
              onClick={() => setType("RETURN")}
            >
              <DoorOpen size={17} /> Trả phòng KTX
            </button>
          </div>
        </div>

        {/* Nếu chọn Gia hạn: Chọn chu kỳ tháng */}
        {type === "EXTEND" && (
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "6px",
                color: "var(--text-body, #334155)",
              }}
            >
              Chọn chu kỳ gia hạn <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div className="duration-pills">
              {[
                { m: 1, text: "1 tháng" },
                { m: 3, text: "3 tháng" },
                { m: 6, text: "6 tháng" },
                { m: 12, text: "12 tháng" },
              ].map((opt) => (
                <button
                  key={opt.m}
                  type="button"
                  className={`duration-pill ${months === opt.m ? "active" : ""}`}
                  onClick={() => setMonths(opt.m)}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bảng chi tiết tính toán chu kỳ */}
        <div className="stay-calc-card">
          <div className="stay-calc-row">
            <span>Phòng lưu trú:</span>
            <strong>
              {currentStay?.room?.code || "—"} (
              {currentStay?.room?.roomType?.name || "KTX"})
            </strong>
          </div>
          {type === "EXTEND" ? (
            <>
              <div className="stay-calc-row">
                <span>Ngày bắt đầu chu kỳ mới:</span>
                <div style={{ textAlign: "right" }}>
                  <strong>{date(startDateForCycle)}</strong>
                  <small
                    style={{
                      display: "block",
                      fontWeight: 400,
                      color: "#64748b",
                      fontSize: "12px",
                    }}
                  >
                    {isOverdue
                      ? "(Ngày hôm sau của ngày phạt)"
                      : "(Ngày hôm sau của chu kỳ trước)"}
                  </small>
                </div>
              </div>
              <div className="stay-calc-row">
                <span>Ngày dự kiến kết thúc:</span>
                <strong style={{ color: "#2563eb", fontSize: "14.5px" }}>
                  {date(desiredEndDate)}
                </strong>
              </div>
            </>
          ) : (
            <div className="stay-calc-row">
              <span>Ngày trả phòng dự kiến:</span>
              <div style={{ textAlign: "right" }}>
                <strong style={{ color: "#ea580c", fontSize: "14.5px" }}>
                  {date(desiredEndDate)}
                </strong>
                <small
                  style={{
                    display: "block",
                    fontWeight: 400,
                    color: "#64748b",
                    fontSize: "12px",
                  }}
                >
                  {isOverdue
                    ? "(Ngày hôm sau của ngày phạt)"
                    : "(Tự động theo hạn kết thúc chu kỳ)"}
                </small>
              </div>
            </div>
          )}
          {isOverdue && (
            <div
              className="stay-calc-row"
              style={{
                background: "#fef2f2",
                margin: "8px -16px -14px -16px",
                padding: "10px 16px",
                borderRadius: "0 0 11px 11px",
                borderTop: "1px dashed #fca5a5",
              }}
            >
              <span style={{ color: "#991b1b", fontWeight: 600 }}>
                Phí phạt trễ hạn tính đến nay:
              </span>
              <strong className="stay-penalty-highlight">
                {overdueDays} ngày × 25.000 ₫ = {money(penaltyAmount)}
              </strong>
            </div>
          )}
        </div>

        {/* Lý do */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "6px",
              color: "var(--text-body, #334155)",
            }}
          >
            Lý do yêu cầu <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <textarea
            required
            rows={3}
            className="input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              type === "EXTEND"
                ? "Ví dụ: Tiếp tục theo học kỳ tiếp theo tại trường..."
                : "Ví dụ: Đã hoàn tất khóa học / chuyển về gia đình..."
            }
            style={{
              width: "100%",
              borderRadius: "8px",
              padding: "10px 12px",
              border: "1.5px solid #cbd5e1",
              resize: "vertical",
            }}
          />
        </div>

        {error && (
          <div className="inline-error" style={{ margin: 0 }}>
            {error}
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: "6px" }}>
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
            disabled={busy}
            style={
              isOverdue
                ? { background: "#222222", borderColor: "#222222" }
                : diffDays <= 3
                ? { background: "#dc2626", borderColor: "#dc2626" }
                : {}
            }
          >
            {busy ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Dashboard() {
  const { session } = useAuth();
  const role = session.user.role;
  const navigate = useNavigate();
  const [message, notice, clear] = useNotice();
  const [exportOpen, setExportOpen] = useState(false);
  const [stayModal, setStayModal] = useState(null);
  const apps = useLoad("/applications?limit=20"),
    stays = useLoad("/stays?limit=10"),
    invoices = useLoad("/invoices?limit=100"),
    report = useLoad(role === "STUDENT" ? "/catalog" : "/report", []),
    requests = useLoad("/requests?limit=20"),
    logs = useLoad("/activity-logs?limit=30");
  const n = useLoad("/notifications?limit=15");
  useEffect(() => {
    const refresh = () => {
      apps.load();
      stays.load();
      invoices.load();
      report.load();
      requests.load();
      logs.load();
      n.load();
    };
    window.addEventListener("work-queue-changed", refresh);
    window.addEventListener("inbox-changed", refresh);
    return () => {
      window.removeEventListener("work-queue-changed", refresh);
      window.removeEventListener("inbox-changed", refresh);
    };
  }, [role]);
  // Đây là ghi chú mẫu: Đã bỏ phần banner chào mừng trên mọi giao diện theo yêu cầu thiết kế tinh gọn
  // Đây là ghi chú mẫu: Trích xuất 10 giao dịch gần nhất, chuẩn hóa ngày thanh toán (date) và MSSV (studentCode)
  const recentPayments = (invoices.data?.items || [])
    .flatMap((inv) =>
      (inv.payments || []).map((p) => {
        const sCode = inv.student?.studentCode || inv.student?.code || "—";
        const sName = inv.student?.fullName || "Sinh viên";
        const rCode = inv.room?.code || "—";
        const pMonth = inv.period?.month || "—";
        const pDate = p.createdAt || (p.date ? (p.date.length === 10 ? p.date + "T10:30:00Z" : p.date) : "");
        const receiptNo =
          p.receiptNumber ||
          "PT-" +
            (pDate ? pDate.slice(0, 10).replace(/-/g, "") : "202610") +
            "-" +
            (p.id
              ? p.id
                  .replace(/[^0-9a-zA-Z]/g, "")
                  .slice(-4)
                  .toUpperCase()
              : "0001");
        return {
          ...p,
          paymentDate: pDate,
          createdAt: pDate,
          studentName: sName,
          studentCode: sCode,
          roomCode: rCode,
          periodMonth: pMonth,
          receiptNumber: receiptNo,
          invoiceId: inv.id,
        };
      }),
    )
    .sort((a, b) => new Date(b.paymentDate || 0) - new Date(a.paymentDate || 0))
    .slice(0, 10);

  const pendingApps = (apps.data?.items || [])
    .filter((x) => ["PENDING", "REVIEWING", "NEEDS_INFO"].includes(x.status))
    .slice(0, 10);
  const pendingRequests = (requests.data?.items || [])
    .filter((x) => x.status === "PENDING")
    .slice(0, 10);
  // Đây là ghi chú mẫu: Nhật ký hệ thống sắp xếp theo mốc thời gian mới nhất (giờ:phút:giây)
  const activityLogs = (logs.data?.items || [])
    .slice()
    .sort((a, b) => new Date(b.time || b.createdAt || 0) - new Date(a.time || a.createdAt || 0))
    .slice(0, 20);

  const active = stays.data?.items?.find((x) => x.status === "ACTIVE"),
    due =
      invoices.data?.items
        ?.filter((x) => x.balance > 0)
        .reduce((a, x) => a + x.balance, 0) || 0;

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const plannedEnd = active?.plannedEndDate;
  const stayDiffDays = useMemo(() => {
    if (!plannedEnd) return null;
    const dPlanned = new Date(`${plannedEnd}T00:00:00Z`);
    const dToday = new Date(`${todayStr}T00:00:00Z`);
    return Math.round((dPlanned - dToday) / 86400000);
  }, [plannedEnd, todayStr]);
  const isStayOverdue = stayDiffDays !== null && stayDiffDays < 0;
  const stayOverdueDays = isStayOverdue ? Math.abs(stayDiffDays) : 0;

  return (
    <>
      {role === "STUDENT" ? (
        <>
          {/* Cảnh báo hạn chu kỳ lưu trú (10 ngày báo trước, 3 ngày chữ đỏ, quá hạn màu #222222 và icon đỏ) */}
          {active && stayDiffDays !== null && stayDiffDays <= 10 && (
            isStayOverdue ? (
              <div className="stay-deadline-alert stay-alert-dark">
                <div className="stay-alert-content">
                  <div className="stay-alert-icon">
                    <AlertCircle size={24} color="#dc2626" />
                  </div>
                  <div>
                    <div className="stay-alert-title">
                      ĐANG BỊ QUÁ HẠN LƯU TRÚ {stayOverdueDays} NGÀY!
                    </div>
                    <p className="stay-alert-desc">
                      Chu kỳ lưu trú phòng <strong>{active.room?.code}</strong> đã hết hạn từ ngày{" "}
                      <strong>{date(plannedEnd)}</strong>. Hệ thống đang tính phí phạt trễ hạn{" "}
                      <strong>25.000 ₫/ngày</strong> (Hiện tại:{" "}
                      <strong style={{ color: "#dc2626" }}>{money(stayOverdueDays * 25000)}</strong>). Vui lòng thực hiện{" "}
                      <strong>Gia hạn ngay</strong> hoặc <strong>Trả phòng</strong> để tránh phát sinh thêm phí phạt.
                    </p>
                  </div>
                </div>
                <div className="stay-alert-actions">
                  <button
                    className="stay-btn-dark"
                    onClick={() => setStayModal({ type: "EXTEND" })}
                  >
                    Gia hạn ngay
                  </button>
                  <button
                    className="stay-btn-dark-outline"
                    onClick={() => setStayModal({ type: "RETURN" })}
                  >
                    Trả phòng
                  </button>
                </div>
              </div>
            ) : stayDiffDays <= 3 ? (
              <div className="stay-deadline-alert stay-alert-red">
                <div className="stay-alert-content">
                  <div className="stay-alert-icon">
                    <AlertTriangle size={24} color="#dc2626" />
                  </div>
                  <div>
                    <div className="stay-alert-title">
                      🚨 CẢNH BÁO: CHỈ CÒN {stayDiffDays === 0 ? "HÔM NAY LÀ NGÀY CUỐI" : `${stayDiffDays} NGÀY CUỐI`} ĐỂ GIA HẠN LƯU TRÚ!
                    </div>
                    <p className="stay-alert-desc">
                      Chu kỳ lưu trú phòng <strong>{active.room?.code}</strong> sẽ kết thúc vào ngày{" "}
                      <strong>{date(plannedEnd)}</strong>. Vui lòng gửi yêu cầu gia hạn hoặc trả phòng trước ngày này để không bị phạt trễ hạn (25.000 ₫/ngày).
                    </p>
                  </div>
                </div>
                <div className="stay-alert-actions">
                  <button
                    className="stay-btn-red"
                    onClick={() => setStayModal({ type: "EXTEND" })}
                  >
                    Gia hạn ngay
                  </button>
                  <button
                    className="stay-btn-red-outline"
                    onClick={() => setStayModal({ type: "RETURN" })}
                  >
                    Trả phòng
                  </button>
                </div>
              </div>
            ) : (
              <div className="stay-deadline-alert stay-alert-amber">
                <div className="stay-alert-content">
                  <div className="stay-alert-icon">
                    <Clock size={24} color="#b45309" />
                  </div>
                  <div>
                    <div className="stay-alert-title">
                      SẮP HẾT HẠN LƯU TRÚ CHU KỲ (CÒN {stayDiffDays} NGÀY)
                    </div>
                    <p className="stay-alert-desc">
                      Chu kỳ lưu trú phòng <strong>{active.room?.code}</strong> sẽ kết thúc vào ngày{" "}
                      <strong>{date(plannedEnd)}</strong>. Bạn có thể gia hạn chu kỳ tiếp theo hoặc đăng ký trả phòng ngay từ bây giờ.
                    </p>
                  </div>
                </div>
                <div className="stay-alert-actions">
                  <button
                    className="stay-btn-amber"
                    onClick={() => setStayModal({ type: "EXTEND" })}
                  >
                    Gia hạn lưu trú
                  </button>
                  <button
                    className="stay-btn-amber-outline"
                    onClick={() => setStayModal({ type: "RETURN" })}
                  >
                    Trả phòng
                  </button>
                </div>
              </div>
            )
          )}

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
                    <BedDouble size={26} />
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
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "3px" }}>
                        <strong>{date(active.plannedEndDate)}</strong>
                        {stayDiffDays !== null && (
                          isStayOverdue ? (
                            <span className="stay-badge-overdue-red">
                              Quá hạn {stayOverdueDays} ngày (Phạt {money(stayOverdueDays * 25000)})
                            </span>
                          ) : stayDiffDays <= 3 ? (
                            <span
                              style={{
                                backgroundColor: "#fef2f2",
                                color: "#dc2626",
                                border: "1.5px solid #fca5a5",
                                borderRadius: "9999px",
                                padding: "2px 8px",
                                fontSize: "12px",
                                fontWeight: 700,
                              }}
                            >
                              Còn {stayDiffDays} ngày cuối
                            </span>
                          ) : stayDiffDays <= 10 ? (
                            <span
                              style={{
                                backgroundColor: "#fef3c7",
                                color: "#b45309",
                                border: "1px solid #fcd34d",
                                borderRadius: "9999px",
                                padding: "2px 8px",
                                fontSize: "12px",
                                fontWeight: 600,
                              }}
                            >
                              Còn {stayDiffDays} ngày
                            </span>
                          ) : null
                        )}
                      </div>
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
                <div className="feed-scroll-container">
                  {n.data.items.map((x) => (
                    <div className="feed-item" key={x.id}>
                      <span className="feed-dot" />
                      <div>
                        <strong>{x.title}</strong>
                        <p>{x.body}</p>
                        <small>{date(x.createdAt)}</small>
                      </div>
                    </div>
                  ))}
                </div>
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
                    key: "room",
                    label: "Phòng",
                    render: (x) => x.snapshot?.roomCode || x.room?.code || "—",
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
          {stayModal && active && (
            <StayRequestModal
              currentStay={active}
              initialType={stayModal.type}
              onClose={() => setStayModal(null)}
              onSuccess={() => {
                const reqTypeLabel = stayModal.type === "EXTEND" ? "gia hạn lưu trú" : "trả phòng KTX";
                setStayModal(null);
                stays.load();
                requests.load();
                notice(`Đã gửi yêu cầu ${reqTypeLabel} thành công! Ban quản lý sẽ sớm xử lý yêu cầu của bạn.`);
              }}
            />
          )}
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
            title="Lịch sử giao dịch thanh toán gần đây"
            subtitle="Các khoản thu tiền phòng, điện nước mới nhất vừa ghi nhận vào hệ thống"
            action={
              <Link to="/invoices" className="text-link">
                Xem tất cả hóa đơn <ArrowRight size={16} />
              </Link>
            }
          >
            {/* Đây là ghi chú mẫu: Bảng thanh toán hiển thị 10 giao dịch gần nhất, có vùng cuộn tiện tra cứu */}
            {recentPayments.length ? (
              <div
                style={{
                  maxHeight: "300px",
                  overflowY: "auto",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                }}
              >
                <Table
                  items={recentPayments}
                  columns={[
                    {
                      key: "paymentDate",
                      label: "Thời gian",
                      render: (p) => (
                        <span className="muted" style={{ fontSize: "13px" }}>
                          {dateTime(p.paymentDate || p.createdAt)}
                        </span>
                      ),
                    },
                    {
                      key: "student",
                      label: "Sinh viên",
                      render: (p) => (
                        <div>
                          <strong>{p.studentName}</strong>
                          <div
                            style={{ fontSize: "12px", color: "var(--muted)" }}
                          >
                            MSSV: {p.studentCode}
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "room",
                      label: "Phòng & Kỳ thu",
                      render: (p) => (
                        <span>
                          Phòng <strong>{p.roomCode}</strong> · Kỳ{" "}
                          {p.periodMonth}
                        </span>
                      ),
                    },
                    {
                      key: "method",
                      label: "Hình thức",
                      render: (p) => (
                        <span style={{ fontSize: "13px" }}>
                          {p.method === "TRANSFER"
                            ? "Chuyển khoản"
                            : "Tiền mặt"}
                        </span>
                      ),
                    },
                    {
                      key: "amount",
                      label: "Số tiền",
                      render: (p) => (
                        <strong
                          style={{ color: "#16a34a", fontSize: "14.5px" }}
                        >
                          +{money(p.amount)}
                        </strong>
                      ),
                    },
                    {
                      key: "receipt",
                      label: "Mã biên lai",
                      render: (p) => (
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "12.5px",
                            color: "var(--muted)",
                          }}
                        >
                          {p.receiptNumber}
                        </span>
                      ),
                    },
                  ]}
                  onRow={(p) => (location.href = `/invoices/${p.invoiceId}`)}
                />
              </div>
            ) : (
              <Empty icon={Wallet} title="Chưa có giao dịch thanh toán nào" />
            )}
          </Section>

          <div className="dashboard-grid">
            <Section
              title="Hồ sơ & Yêu cầu chờ xử lý"
              subtitle="Các đề xuất lưu trú, chuyển phòng và đăng ký mới nhất"
              action={
                <Link to="/applications" className="text-link">
                  Hồ sơ đăng ký <ArrowRight size={16} />
                </Link>
              }
            >
              {/* Đây là ghi chú mẫu: Danh sách hồ sơ và yêu cầu có vùng cuộn tự động khi nhiều mục */}
              {pendingApps.length || pendingRequests.length ? (
                <div
                  style={{
                    maxHeight: "330px",
                    overflowY: "auto",
                    paddingRight: "6px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {pendingApps.map((x) => (
                    <div
                      key={x.id}
                      className="pending-queue-item"
                      onClick={() => navigate(`/applications/${x.id}`)}
                      title="Nhấp để chuyển thẳng đến duyệt hồ sơ này"
                    >
                      <div>
                        <strong>{x.student?.fullName || "Sinh viên"}</strong>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--muted)",
                            marginTop: "2px",
                          }}
                        >
                          Đăng ký: {x.roomType?.name} · {dateTime(x.createdAt)}
                        </div>
                      </div>
                      {badge(x.status)}
                    </div>
                  ))}
                  {pendingRequests.map((r) => (
                    <div
                      key={r.id}
                      className="pending-queue-item"
                      onClick={() => navigate("/requests", { state: { openRequest: r } })}
                      title="Nhấp để mở cửa sổ xử lý yêu cầu này ngay lập tức"
                    >
                      <div>
                        <strong>
                          Yêu cầu {labels[r.type] || r.type} · {r.student?.fullName || "Sinh viên"}
                        </strong>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--muted)",
                            marginTop: "2px",
                          }}
                        >
                          {r.reason || "Đề xuất lưu trú"} · {dateTime(r.createdAt)}
                        </div>
                      </div>
                      {badge(r.status)}
                    </div>
                  ))}
                </div>
              ) : (
                <Empty
                  icon={ClipboardList}
                  title="Không có hồ sơ nào đang chờ"
                />
              )}
            </Section>

            <Section
              title="Nhật ký hoạt động hệ thống"
              subtitle="Ghi nhận toàn bộ thao tác nghiệp vụ của mọi vai trò theo thời gian thực"
              action={
                <button
                  type="button"
                  onClick={() => logs.load()}
                  title="Tải lại nhật ký"
                  aria-label="Tải lại nhật ký"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--muted)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--text)";
                    e.currentTarget.style.borderColor = "var(--text)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--muted)";
                    e.currentTarget.style.borderColor = "var(--border)";
                  }}
                >
                  <RotateCw
                    size={15}
                    style={{
                      animation: logs.loading ? "spin 1s linear infinite" : "none",
                    }}
                  />
                </button>
              }
            >
              {/* Đây là ghi chú mẫu: Danh sách nhật ký thao tác hệ thống thời gian thực có cuộn xem nhiều mục */}
              {logs.loading && !logs.data ? (
                <Loading />
              ) : activityLogs.length ? (
                <>
                  <div
                    style={{
                      maxHeight: "330px",
                      overflowY: "auto",
                      paddingRight: "6px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {activityLogs.map((log) => (
                      <div
                        key={log.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                          padding: "11px 14px",
                          borderRadius: "10px",
                          border: "1px solid var(--border)",
                          background: "var(--surface)",
                        }}
                      >
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background:
                              log.actorRole === "ADMIN"
                                ? "#dc2626"
                                : log.actorRole === "STAFF"
                                  ? "#2563eb"
                                  : "#16a34a",
                            marginTop: "6px",
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: "8px",
                            }}
                          >
                            <strong style={{ fontSize: "13.5px" }}>
                              {log.title}
                            </strong>
                            <small
                              className="muted"
                              style={{ whiteSpace: "nowrap" }}
                            >
                              {dateTime(log.time || log.createdAt)}
                            </small>
                          </div>
                          <p
                            style={{
                              margin: "3px 0 0",
                              fontSize: "12.5px",
                              color: "var(--muted)",
                              lineHeight: 1.4,
                            }}
                          >
                            {log.body}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      marginTop: "12px",
                      paddingTop: "12px",
                      borderTop: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <span style={{ fontSize: "12.5px", color: "var(--muted)" }}>
                      Đang hiển thị {activityLogs.length} nhật ký gần nhất
                    </span>
                    <button
                      type="button"
                      className="button button-outline button-sm"
                      onClick={() => setExportOpen(true)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "7px",
                        fontSize: "13px",
                        fontWeight: 600,
                        padding: "6px 14px",
                        borderRadius: "8px",
                        borderColor: "#0284c7",
                        color: "#0284c7",
                        background: "#f0f9ff",
                      }}
                    >
                      <FileSpreadsheet size={15} />
                      Xuất nhật ký Excel
                    </button>
                  </div>
                </>
              ) : (
                <Empty icon={Bell} title="Chưa có nhật ký hoạt động" />
              )}
            </Section>
          </div>
        </>
      )}

      {exportOpen && <ExportLogsModal onClose={() => setExportOpen(false)} />}
      <Toast message={message} onClose={() => clear(null)} />
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
    [type, setType] = useState(
      () => new URLSearchParams(routeLocation.search).get("type") || "",
    ),
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
            title={edit.id ? `Cập nhật phòng ${edit.code || ""}` : "Thêm phòng mới"}
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
function RequestsPage() {
  const { session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const own = session.user.role === "STUDENT",
    stays = useLoad("/stays?limit=100");
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [form, setForm] = useState(false),
    [decision, setDecision] = useState(null),
    [message, notice, clear] = useNotice();

  useEffect(() => {
    if (location.state?.openRequest) {
      setDecision(location.state.openRequest);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

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
                  label: "Hạn mong muốn",
                  render: (x) => (
                    <div>
                      <div>{date(x.desiredDate)}</div>
                      {x.months && (
                        <small className="muted" style={{ display: "block" }}>
                          Chu kỳ {x.months} tháng
                        </small>
                      )}
                    </div>
                  ),
                },
                {
                  key: "overdueDays",
                  label: "Tình trạng",
                  render: (x) =>
                    x.overdueDays > 0 ? (
                      <span
                        style={{
                          display: "inline-block",
                          backgroundColor: "#fef2f2",
                          color: "#dc2626",
                          border: "1.5px solid #f87171",
                          borderRadius: "9999px",
                          padding: "2px 10px",
                          fontSize: "12px",
                          fontWeight: 700,
                        }}
                      >
                        Quá hạn {x.overdueDays} ngày ({money(x.penaltyAmount)})
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-block",
                          backgroundColor: "#f0fdf4",
                          color: "#166534",
                          border: "1px solid #86efac",
                          borderRadius: "9999px",
                          padding: "2px 8px",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        Đúng hạn
                      </span>
                    ),
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
      {form && current && (
        <StayRequestModal
          currentStay={current}
          onClose={() => setForm(false)}
          onSuccess={() => {
            setForm(false);
            setPage(1);
            data.load();
            notice("Đã gửi yêu cầu lưu trú thành công.");
          }}
        />
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
          <div
            style={{
              margin: "10px 0 16px 0",
              padding: "12px 14px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              fontSize: "13.5px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#64748b",
                marginBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              Lý do gửi yêu cầu của sinh viên:
            </div>
            <div style={{ color: "#1e293b", lineHeight: 1.5, fontWeight: 500 }}>
              "{decision.reason || "Không ghi rõ lý do."}"
            </div>
          </div>
          {decision.overdueDays > 0 && (
            <div
              style={{
                margin: "0 0 16px 0",
                padding: "12px 14px",
                backgroundColor: "#ffffff",
                border: "1.5px solid #222222",
                borderRadius: "10px",
                color: "#222222",
                fontSize: "13px",
                lineHeight: "1.5",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: "4px", color: "#222222" }}>
                Yêu cầu được gửi khi đã quá hạn {decision.overdueDays} ngày!
              </div>
              <div style={{ color: "#444444" }}>
                Phí phạt trễ hạn được tính:{" "}
                <strong style={{ color: "#dc2626" }}>
                  {decision.overdueDays} ngày × 25.000 ₫ = {money(decision.penaltyAmount)}
                </strong>
                .
                {decision.type === "EXTEND"
                  ? ` Khi duyệt, chu kỳ mới sẽ bắt đầu từ ${date(decision.startDateForCycle)}.`
                  : ` Khi duyệt, ngày trả phòng sẽ được ấn định là ${date(decision.desiredDate)}.`}
              </div>
            </div>
          )}
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
              <strong>{selectedStudentRoom?.roomType?.name || "cùng loại"}</strong>
              ) phù hợp giới tính (
              {selectedStudent.gender === "FEMALE" ? "Nữ" : "Nam"}) còn chỗ trống.
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
            <strong>{date(selectedStudent.stay?.plannedEndDate)}</strong>.
            Hiện không còn chu kỳ mới trong thời hạn này để chuyển phòng.
            Sinh viên vui lòng thực hiện Gia hạn hoặc Đăng ký phòng mới.
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

function ReadingsCombinedModal({
  initialRoomId = "",
  initialPeriodId = "",
  rooms = [],
  periods = [],
  onClose,
  onSaved,
}) {
  const [roomId, setRoomId] = useState(initialRoomId);
  const [periodId, setPeriodId] = useState(() => {
    if (initialPeriodId) return initialPeriodId;
    const sorted = [...periods].sort((a, b) =>
      (b.month || "").localeCompare(a.month || ""),
    );
    return sorted[0]?.id || "";
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [electricStart, setElectricStart] = useState("");
  const [electricEnd, setElectricEnd] = useState("");
  const [waterStart, setWaterStart] = useState("");
  const [waterEnd, setWaterEnd] = useState("");

  const [prevElectric, setPrevElectric] = useState(null);
  const [prevWater, setPrevWater] = useState(null);

  useEffect(() => {
    if (!roomId || !periodId) return;
    let alive = true;
    setLoading(true);
    setError("");

    api(`/readings/room-period?roomId=${roomId}&periodId=${periodId}`)
      .then((data) => {
        if (!alive) return;
        setElectricStart(
          data.electricity.start !== null && data.electricity.start !== undefined
            ? String(data.electricity.start)
            : "",
        );
        setElectricEnd(
          data.electricity.end !== null && data.electricity.end !== undefined
            ? String(data.electricity.end)
            : "",
        );
        setWaterStart(
          data.water.start !== null && data.water.start !== undefined
            ? String(data.water.start)
            : "",
        );
        setWaterEnd(
          data.water.end !== null && data.water.end !== undefined
            ? String(data.water.end)
            : "",
        );
        setPrevElectric(data.electricity.previousEnd);
        setPrevWater(data.water.previousEnd);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message || "Không thể tải dữ liệu chỉ số của phòng");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [roomId, periodId]);

  const calcUsage = (startVal, endVal) => {
    if (endVal === "" || endVal === undefined || endVal === null) return null;
    const s = Number(startVal || 0);
    const e = Number(endVal);
    if (isNaN(e) || isNaN(s)) return null;
    return e - s;
  };

  const electricUsage = calcUsage(electricStart, electricEnd);
  const waterUsage = calcUsage(waterStart, waterEnd);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roomId) {
      setError("Vui lòng chọn phòng.");
      return;
    }
    if (!periodId) {
      setError("Vui lòng chọn kỳ thu.");
      return;
    }
    if (electricEnd === "" && waterEnd === "") {
      setError("Vui lòng nhập ít nhất một chỉ số điện hoặc chỉ số nước.");
      return;
    }

    if (electricEnd !== "") {
      const eS = Number(electricStart || 0);
      const eE = Number(electricEnd);
      if (eE < eS) {
        setError(`Chỉ số điện cuối (${eE}) không được nhỏ hơn chỉ số đầu (${eS}).`);
        return;
      }
    }

    if (waterEnd !== "") {
      const wS = Number(waterStart || 0);
      const wE = Number(waterEnd);
      if (wE < wS) {
        setError(`Chỉ số nước cuối (${wE}) không được nhỏ hơn chỉ số đầu (${wS}).`);
        return;
      }
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        roomId,
        periodId,
        electricity:
          electricEnd !== ""
            ? {
                start: electricStart !== "" ? Number(electricStart) : undefined,
                end: Number(electricEnd),
              }
            : undefined,
        water:
          waterEnd !== ""
            ? {
                start: waterStart !== "" ? Number(waterStart) : undefined,
                end: Number(waterEnd),
              }
            : undefined,
      };

      await api("/readings/combined", {
        method: "POST",
        body: payload,
      });

      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Không thể lưu chỉ số điện nước.");
    } finally {
      setSaving(false);
    }
  };

  const roomOptions = useMemo(() => {
    return (rooms || [])
      .filter((r) => r.status === "ACTIVE" || !r.status)
      .sort((a, b) => (a.code || "").localeCompare(b.code || ""))
      .map((r) => ({
        value: r.id,
        label: `Phòng ${r.code}`,
        sublabel: `${r.building?.name || ""} · ${r.roomType?.name || ""}`,
        badge: r.building?.name || "",
        code: r.code,
      }));
  }, [rooms]);

  return (
    <Modal title="Nhập & Cập nhật chỉ số điện nước" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: "8px",
              color: "#b91c1c",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div className="field">
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px" }}>
              Phòng <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <SearchableSelect
              value={roomId}
              onChange={(val) => setRoomId(val)}
              options={roomOptions}
              placeholder="Chọn phòng..."
              searchPlaceholder="Tìm mã phòng..."
            />
          </div>

          <div className="field">
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, fontSize: "13px" }}>
              Kỳ thu <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <PeriodSelect
              value={periodId}
              onChange={(val) => setPeriodId(val)}
              periods={periods}
              placeholder="Chọn kỳ thu"
              allowClear={false}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
            <Loading />
            <div style={{ marginTop: "8px", fontSize: "13px" }}>Đang tải chỉ số phòng...</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Card Điện: Vàng / Cam */}
            <div
              style={{
                border: "1.5px solid #fef08a",
                background: "#fefce8",
                borderRadius: "12px",
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "#fef9c3",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid #fde047",
                    }}
                  >
                    <Zap size={18} style={{ color: "#ca8a04", fill: "#fde047" }} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "14px", color: "#854d0e" }}>Chỉ số Điện (kWh)</strong>
                    {prevElectric !== null && (
                      <div style={{ fontSize: "11.5px", color: "#a16207" }}>
                        Chỉ số chốt kỳ trước: <strong>{prevElectric}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {electricUsage !== null && (
                  <div
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background: electricUsage >= 0 ? "#fef08a" : "#fee2e2",
                      color: electricUsage >= 0 ? "#713f12" : "#991b1b",
                      fontSize: "12.5px",
                      fontWeight: 700,
                    }}
                  >
                    {electricUsage >= 0 ? `Tiêu thụ: ${electricUsage} kWh` : "Không hợp lệ"}
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#713f12", marginBottom: "4px" }}>
                    Chỉ số đầu kỳ
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={electricStart}
                    onChange={(e) => setElectricStart(e.target.value)}
                    placeholder="0"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #fde047",
                      background: "#ffffff",
                      fontSize: "13.5px",
                      outline: "none",
                    }}
                  />
                  <div style={{ fontSize: "11px", color: "#854d0e", marginTop: "3px" }}>
                    Tự động lấy số cuối kỳ trước nếu có
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#713f12", marginBottom: "4px" }}>
                    Chỉ số cuối kỳ <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={electricEnd}
                    onChange={(e) => setElectricEnd(e.target.value)}
                    placeholder="Nhập số điện mới nhất"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #fde047",
                      background: "#ffffff",
                      fontSize: "13.5px",
                      fontWeight: 600,
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Card Nước: Xanh biển */}
            <div
              style={{
                border: "1.5px solid #bae6fd",
                background: "#f0f9ff",
                borderRadius: "12px",
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "#e0f2fe",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid #7dd3fc",
                    }}
                  >
                    <Droplets size={18} style={{ color: "#0284c7", fill: "#bae6fd" }} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "14px", color: "#0369a1" }}>Chỉ số Nước (m³)</strong>
                    {prevWater !== null && (
                      <div style={{ fontSize: "11.5px", color: "#0284c7" }}>
                        Chỉ số chốt kỳ trước: <strong>{prevWater}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {waterUsage !== null && (
                  <div
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background: waterUsage >= 0 ? "#bae6fd" : "#fee2e2",
                      color: waterUsage >= 0 ? "#0c4a6e" : "#991b1b",
                      fontSize: "12.5px",
                      fontWeight: 700,
                    }}
                  >
                    {waterUsage >= 0 ? `Tiêu thụ: ${waterUsage} m³` : "Không hợp lệ"}
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#0369a1", marginBottom: "4px" }}>
                    Chỉ số đầu kỳ
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={waterStart}
                    onChange={(e) => setWaterStart(e.target.value)}
                    placeholder="0"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #7dd3fc",
                      background: "#ffffff",
                      fontSize: "13.5px",
                      outline: "none",
                    }}
                  />
                  <div style={{ fontSize: "11px", color: "#0284c7", marginTop: "3px" }}>
                    Tự động lấy số cuối kỳ trước nếu có
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#0369a1", marginBottom: "4px" }}>
                    Chỉ số cuối kỳ <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={waterEnd}
                    onChange={(e) => setWaterEnd(e.target.value)}
                    placeholder="Nhập số nước mới nhất"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #7dd3fc",
                      background: "#ffffff",
                      fontSize: "13.5px",
                      fontWeight: 600,
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
          <button
            type="button"
            className="button button-outline"
            onClick={onClose}
            disabled={saving}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="button button-primary"
            disabled={saving || loading}
            style={{ minWidth: "120px" }}
          >
            {saving ? "Đang lưu..." : "Lưu chỉ số"}
          </button>
        </div>
      </form>
    </Modal>
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

  const [modalState, setModalState] = useState({
    open: false,
    roomId: "",
    periodId: "",
  });
  const [message, notice, clear] = useNotice();

  // Gom các chỉ số điện và nước theo từng phòng và kỳ thu để hiển thị và chỉnh sửa trực quan
  const groupedReadings = useMemo(() => {
    const map = new Map();
    (data.data?.items || []).forEach((item) => {
      const key = `${item.roomId}_${item.periodId}`;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          roomId: item.roomId,
          periodId: item.periodId,
          room: item.room,
          period: item.period,
          electricity: null,
          water: null,
        });
      }
      const group = map.get(key);
      if (item.type === "ELECTRICITY") {
        group.electricity = item;
      } else if (item.type === "WATER") {
        group.water = item;
      }
    });
    return Array.from(map.values());
  }, [data.data?.items]);

  const handleOpenNew = () => {
    if (!cat.data && !cat.loading) cat.load();
    setModalState({
      open: true,
      roomId: "",
      periodId: period || periods.data?.items?.[0]?.id || "",
    });
  };

  const handleOpenEdit = (roomId, periodId) => {
    if (!cat.data && !cat.loading) cat.load();
    setModalState({
      open: true,
      roomId,
      periodId,
    });
  };

  return (
    <>
      <PageTitle
        kicker="VẬN HÀNH & TIỆN ÍCH"
        title="Chỉ số điện nước"
        description="Nhập và cập nhật chỉ số điện nước theo phòng, theo dõi sản lượng tiêu thụ."
        action={
          <button className="button button-primary" onClick={handleOpenNew}>
            <Plus size={17} />
            Nhập chỉ số
          </button>
        }
      />
      <Section
        title="Sổ chỉ số điện nước"
        subtitle="Danh sách ghi nhận điện nước theo phòng và kỳ thu (bấm 'Chỉnh sửa' để cập nhật nhanh)"
      >
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        >
          <PeriodSelect
            periods={periods.data?.items}
            value={period}
            onChange={(val) => {
              setPeriod(val);
              setPage(1);
            }}
            placeholder="Tất cả kỳ thu"
            minWidth="175px"
          />
        </SearchBar>

        {groupedReadings.length ? (
          <>
            <Table
              items={groupedReadings}
              columns={[
                {
                  key: "room",
                  label: "Phòng",
                  render: (x) => (
                    <div>
                      <strong>Phòng {x.room?.code}</strong>
                      {x.room?.building?.name && (
                        <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                          {x.room.building.name}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: "period",
                  label: "Kỳ thu",
                  render: (x) => <span>Kỳ {x.period?.month}</span>,
                },
                {
                  key: "electricity",
                  label: "Chỉ số Điện (kWh)",
                  render: (x) =>
                    x.electricity ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Zap size={16} style={{ color: "#ca8a04", fill: "#fde047", flexShrink: 0 }} />
                        <div>
                          <div>
                            <span style={{ color: "#64748b", fontSize: "12px" }}>Đầu:</span> {x.electricity.start} →{" "}
                            <span style={{ color: "#64748b", fontSize: "12px" }}>Cuối:</span> <strong>{x.electricity.end}</strong>
                          </div>
                          <div style={{ fontSize: "12px", color: "#b45309", fontWeight: 700 }}>
                            Tiêu thụ: {x.electricity.usage} kWh
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#94a3b8" }}>
                        <Zap size={15} style={{ color: "#cbd5e1" }} />
                        <span style={{ fontSize: "12px", fontStyle: "italic" }}>Chưa nhập</span>
                      </div>
                    ),
                },
                {
                  key: "water",
                  label: "Chỉ số Nước (m³)",
                  render: (x) =>
                    x.water ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Droplets size={16} style={{ color: "#0284c7", fill: "#bae6fd", flexShrink: 0 }} />
                        <div>
                          <div>
                            <span style={{ color: "#64748b", fontSize: "12px" }}>Đầu:</span> {x.water.start} →{" "}
                            <span style={{ color: "#64748b", fontSize: "12px" }}>Cuối:</span> <strong>{x.water.end}</strong>
                          </div>
                          <div style={{ fontSize: "12px", color: "#0284c7", fontWeight: 700 }}>
                            Tiêu thụ: {x.water.usage} m³
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#94a3b8" }}>
                        <Droplets size={15} style={{ color: "#cbd5e1" }} />
                        <span style={{ fontSize: "12px", fontStyle: "italic" }}>Chưa nhập</span>
                      </div>
                    ),
                },
                {
                  key: "actions",
                  label: "Thao tác",
                  render: (x) => (
                    <button
                      type="button"
                      className="button button-outline button-sm"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "12.5px",
                        fontWeight: 600,
                      }}
                      onClick={() => handleOpenEdit(x.roomId, x.periodId)}
                    >
                      <Pencil size={13} />
                      Chỉnh sửa
                    </button>
                  ),
                },
              ]}
            />
            <Pager data={data.data} page={page} setPage={setPage} />
          </>
        ) : (
          <Empty icon={Zap} title="Chưa có chỉ số điện nước nào" />
        )}
      </Section>

      {modalState.open && (
        <ReadingsCombinedModal
          initialRoomId={modalState.roomId}
          initialPeriodId={modalState.periodId}
          rooms={cat.data?.rooms || []}
          periods={periods.data?.items || []}
          onClose={() => setModalState({ open: false, roomId: "", periodId: "" })}
          onSaved={() => {
            data.load();
            notice("Đã lưu chỉ số điện nước thành công.");
          }}
        />
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

  // Tự động chọn luôn kỳ thu mới nhất và hiển thị dữ liệu ngay khi vào trang
  useEffect(() => {
    if (!selected && periods.data?.items?.length) {
      const sorted = [...periods.data.items].sort((a, b) =>
        (b.month || "").localeCompare(a.month || ""),
      );
      if (sorted[0]?.id) {
        choose(sorted[0].id);
      }
    }
  }, [periods.data?.items, selected]);

  useEffect(() => {
    if (!selected) return;
    const refresh = () =>
      api(`/billing/preview/${selected}`)
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
        <div className="billing-select" style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <PeriodSelect
            periods={periods.data?.items}
            value={selected}
            onChange={(val) => choose(val)}
            placeholder="Chọn kỳ thu"
            allowClear={false}
            minWidth="200px"
          />
          <Link className="button button-outline" to="/readings" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
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
                    render: (x) => x.snapshot?.roomCode || x.room?.code || "—",
                  },
                  {
                    key: "stayDays",
                    label: "Lưu trú",
                    render: (x) => {
                      const snap = x.snapshot || {};
                      const isPartial =
                        snap.daysStayed &&
                        snap.daysInMonth &&
                        snap.daysStayed < snap.daysInMonth;
                      const dateRange = formatStayPeriod(snap);
                      return (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <span>
                            {snap.daysStayed
                              ? `${snap.daysStayed}/${snap.daysInMonth} ngày`
                              : "Cả kỳ"}
                          </span>
                          {isPartial && (
                            <>
                              <span style={{ color: "#94a3b8", fontWeight: 400 }}>|</span>
                              <span
                                style={{
                                  fontSize: "12.5px",
                                  fontWeight: 600,
                                  color: "var(--text)",
                                }}
                              >
                                {dateRange || "Vào giữa tháng"}
                              </span>
                            </>
                          )}
                        </div>
                      );
                    },
                  },
                  {
                    key: "roomFee",
                    label: "Tiền phòng",
                    render: (x) => money(x.roomFee),
                  },
                  {
                    key: "penaltyFee",
                    label: "Phí phạt",
                    render: (x) =>
                      x.penaltyFee > 0 ? (
                        <span style={{ color: "#dc2626", fontWeight: 700 }}>
                          {money(x.penaltyFee)}
                        </span>
                      ) : (
                        "—"
                      ),
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
          <PeriodSelect
            periods={periods.data?.items}
            value={period}
            onChange={(val) => {
              setPeriod(val);
              setPage(1);
            }}
            placeholder="Tất cả kỳ"
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
              { value: "UNPAID", label: labels.UNPAID },
              { value: "PARTIAL", label: labels.PARTIAL },
              { value: "PAID", label: labels.PAID },
              { value: "OVERDUE", label: labels.OVERDUE },
            ]}
            placeholder="Tất cả trạng thái"
            searchable={false}
            minWidth="160px"
          />
          {!own && (
            <FilterSelect
              value={building}
              onChange={(val) => {
                setBuilding(val);
                setPage(1);
              }}
              options={[
                { value: "", label: "Tất cả tòa" },
                ...(catalog.data?.buildings || []).map((b) => ({
                  value: b.id,
                  label: b.name,
                })),
              ]}
              placeholder="Tất cả tòa"
              minWidth="140px"
            />
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
                  render: (x) => x.snapshot?.roomCode || x.room?.code || "—",
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
        title={`Khoản thu phòng ${s?.roomCode || x.room?.code || "—"}`}
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
              <span>
                Phí phòng · {s.roomTypeName}
                {s.daysStayed && s.daysInMonth && s.daysStayed < s.daysInMonth
                  ? ` (${s.daysStayed}/${s.daysInMonth} ngày${formatStayPeriod(s) ? ` | ${formatStayPeriod(s)}` : ""})`
                  : ""}
              </span>
              <strong>{money(x.roomFee)}</strong>
            </div>
            <div>
              <span>
                Điện · {s.electricUsage} kWh × {money(s.electricityRate)}
                {s.daysStayed && s.daysInMonth && s.daysStayed < s.daysInMonth
                  ? ` (${s.daysStayed}/${s.totalPersonDays} ngày-người)`
                  : ` ÷ ${s.occupants} người`}
              </span>
              <strong>{money(x.electricityFee)}</strong>
            </div>
            <div>
              <span>
                Nước · {s.waterUsage} m³ × {money(s.waterRate)}
                {s.daysStayed && s.daysInMonth && s.daysStayed < s.daysInMonth
                  ? ` (${s.daysStayed}/${s.totalPersonDays} ngày-người)`
                  : ` ÷ ${s.occupants} người`}
              </span>
              <strong>{money(x.waterFee)}</strong>
            </div>
            {(x.penaltyFee > 0 || s?.penaltyFee > 0) && (
              <div style={{ color: "#dc2626" }}>
                <span style={{ fontWeight: 600 }}>
                  Phí phạt trễ hạn lưu trú (
                  {s?.penaltyDays ||
                    Math.round(
                      (x.penaltyFee || s?.penaltyFee) / 25000,
                    )}{" "}
                  ngày × 25.000 ₫)
                </span>
                <strong style={{ color: "#dc2626" }}>
                  {money(x.penaltyFee || s?.penaltyFee)}
                </strong>
              </div>
            )}
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
              <span>Thời gian tính phí</span>
              <strong>
                {s.daysStayed
                  ? `${s.daysStayed}/${s.daysInMonth} ngày${
                      s.daysStayed < s.daysInMonth
                        ? ` | ${formatStayPeriod(s) || "vào giữa tháng"}`
                        : ""
                    }`
                  : "Trọn kỳ"}
              </strong>
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
      {
        key: "images",
        label: "Ảnh",
        render: (x) =>
          coverOf(x) ? (
            <img className="resource-photo" src={coverOf(x).url} alt={x.name} />
          ) : (
            <span className="resource-photo-empty">
              <ImagePlus size={17} />
            </span>
          ),
      },
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
    if (kind !== "room-types") setEdit(null);
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
          wide={kind === "room-types"}
        >
          {kind === "room-types" ? (
            <RoomTypeEditor
              key={edit.id || "new"}
              initial={edit}
              fields={config.fields}
              onSaveType={save}
              onChanged={data.load}
              onClose={() => setEdit(null)}
            />
          ) : (
            <Form
              fields={config.fields}
              initial={edit}
              onSave={save}
              onCancel={() => setEdit(null)}
            />
          )}
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
// ==============================================================================
// PHÃ‚N Há»† QUáº¢N TRá»Š TÃ€I KHOáº¢N & NGÆ¯á»œI DÃ™NG TOÃ€N Há»† THá»NG (CHá»ˆ DÃ€NH CHO ADMIN)
// ==============================================================================

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
                Mã định danh (MSSV hoặc Mã NV){" "}
                <span className="field-req">*</span>
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
            >
              {role === "STUDENT"
                ? "Tự động sinh mã tăng dần (dãy số MSSV giống đăng ký)"
                : role === "STAFF"
                  ? "Tự động sinh mã bắt đầu bằng NV (ví dụ NV001, NV002...)"
                  : "Tự động sinh mã bắt đầu bằng AD (ví dụ AD001, AD002...)"}
            </span>
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
            {roles.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setRoles([]);
                  setPage(1);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#dc2626",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "0 4px",
                  marginLeft: "4px",
                }}
              >
                ✕ Đặt lại
              </button>
            )}
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
                  render: (x) => (
                    <span className="staff-email">{x.email}</span>
                  ),
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
                    const item = rMap[x.role] || { text: x.role, color: "var(--muted)" };
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
          title={statusModal.active ? "Khóa tài khoản" : "Kích hoạt lại tài khoản"}
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
              <strong>{deleteModal.fullName}</strong> ({deleteModal.email}) - Mã:{" "}
              <strong>{deleteModal.code}</strong> không?
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
                  Hệ thống tự động kiểm tra toàn bộ hoạt động (hợp đồng lưu trú phòng, hóa đơn chưa thanh toán, hồ sơ đăng ký phòng chờ duyệt, yêu cầu hỗ trợ).
                </li>
                <li>
                  Nếu còn ràng buộc nghiệp vụ, hệ thống sẽ từ chối xóa để tránh phát sinh lỗi dữ liệu mồ côi.
                </li>
                <li>
                  Nếu xóa thành công, tài khoản sẽ bị đăng xuất ngay lập tức nếu đang đăng nhập.
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
        <div className="search-bar" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
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
                  if (
                    x.targetPath?.startsWith("/") &&
                    !x.targetPath.startsWith("//")
                  )
                    navigate(x.targetPath);
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
  const [revokedNotice, setRevokedNotice] = useState(null);

  useEffect(() => {
    const handleRevoked = (e) => {
      localStorage.removeItem("ktx_token");
      setSession(null);
      setRevokedNotice(
        e.detail ||
          "Tài khoản của bạn đã bị khóa hoặc bị xóa, vui lòng liên hệ admin.",
      );
    };
    window.addEventListener("account-revoked", handleRevoked);
    return () => window.removeEventListener("account-revoked", handleRevoked);
  }, []);

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
        <Route
          path="/contact"
          element={
            <Guard roles={["STUDENT"]}>
              <ContactPage />
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

      {/* Thông báo tức thời khi tài khoản bị khóa hoặc bị xóa */}
      {revokedNotice && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.72)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "32px 28px",
              maxWidth: "460px",
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "58px",
                height: "58px",
                borderRadius: "50%",
                background: "#fee2e2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <ShieldCheck size={30} />
            </div>
            <h3
              style={{
                fontSize: "18.5px",
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: "10px",
              }}
            >
              Thông báo tài khoản
            </h3>
            <p
              style={{
                fontSize: "14.5px",
                color: "#475569",
                lineHeight: "1.6",
                marginBottom: "24px",
              }}
            >
              {revokedNotice}
            </p>
            <button
              type="button"
              className="button button-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "12px",
                fontSize: "14px",
                fontWeight: 600,
              }}
              onClick={() => {
                setRevokedNotice(null);
                window.location.href = "/";
              }}
            >
              Đã hiểu và quay về trang chủ
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}
