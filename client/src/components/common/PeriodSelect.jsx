import React, { useState, useRef, useEffect, useMemo } from "react";
import { Calendar, ChevronDown, Search, Check } from "lucide-react";

export default function PeriodSelect({
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
    return [...list].sort((a, b) =>
      (b.month || "").localeCompare(a.month || ""),
    );
  }, [periods]);

  const selectedItem = useMemo(() => {
    return sortedPeriods.find(
      (p) =>
        String(p.id) === String(value) || String(p.month) === String(value),
    );
  }, [sortedPeriods, value]);

  const filteredPeriods = useMemo(() => {
    if (!search.trim()) return sortedPeriods;
    const q = search.trim().toLowerCase();
    return sortedPeriods.filter((p) =>
      (p.month || "").toLowerCase().includes(q),
    );
  }, [sortedPeriods, search]);

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  const displayText = selectedItem
    ? showPrefix
      ? `Kỳ ${selectedItem.month}`
      : selectedItem.month
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
        <span
          style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}
        >
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
            borderRadius: "3px",
            boxShadow: "0 12px 30px rgba(41, 45, 39, 0.16)",
            padding: "7px",
          }}
        >
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
                String(p.id) === String(value) ||
                String(p.month) === String(value);
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
                    if (!isSelected)
                      e.currentTarget.style.background = "#f8fafc";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span>{showPrefix ? `Kỳ ${p.month}` : p.month}</span>
                  {isSelected && (
                    <Check size={14} style={{ color: "#ac482d" }} />
                  )}
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
