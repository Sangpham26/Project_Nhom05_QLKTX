import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, ChevronDown, Check } from "lucide-react";

/**
 * Component SearchableSelect cho phép gõ tìm kiếm và tự động lọc danh sách lựa chọn trong thời gian thực
 */
export default function SearchableSelect({
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
            borderRadius: "3px",
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
