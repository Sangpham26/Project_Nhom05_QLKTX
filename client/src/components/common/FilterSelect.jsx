import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, ChevronDown, Check } from "lucide-react";

export default function FilterSelect({
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
    return options.filter(
      (o) =>
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
            borderRadius: "3px",
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
                    if (!isSelected)
                      e.currentTarget.style.background = "#f8fafc";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      e.currentTarget.style.background = "transparent";
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
