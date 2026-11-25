import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Zap,
  Droplets,
  Check,
  AlertTriangle,
  AlertCircle,
  RotateCw,
  X,
  ChevronDown,
  Search,
  ArrowRight,
  Filter,
  Calendar,
  Plus,
  Pencil,
} from "lucide-react";
import { api, date, dateTime, money, labels } from "../services/api";
import { useLoad, useNotice } from "../hooks/useLoad";
import {
  PageTitle,
  SearchBar,
  FilterSelect,
  PeriodSelect,
  Loading,
  Table,
  Pager,
  Empty,
  Section,
  Modal,
  Form,
  Toast,
  Confirm,
  SearchableSelect,
} from "../components/common";

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
          data.electricity.start !== null &&
            data.electricity.start !== undefined
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
        setError(
          `Chỉ số điện cuối (${eE}) không được nhỏ hơn chỉ số đầu (${eS}).`,
        );
        return;
      }
    }

    if (waterEnd !== "") {
      const wS = Number(waterStart || 0);
      const wE = Number(waterEnd);
      if (wE < wS) {
        setError(
          `Chỉ số nước cuối (${wE}) không được nhỏ hơn chỉ số đầu (${wS}).`,
        );
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
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: "3px",
              color: "#b91c1c",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "14px",
          }}
        >
          <div className="field">
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
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
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
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
          <div
            style={{ padding: "30px", textAlign: "center", color: "#64748b" }}
          >
            <Loading />
            <div style={{ marginTop: "8px", fontSize: "13px" }}>
              Đang tải chỉ số phòng...
            </div>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            {/* Card Điện: Vàng / Cam */}
            <div
              style={{
                border: "1.5px solid #fef08a",
                background: "#fefce8",
                borderRadius: "3px",
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
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "3px",
                      background: "#fef9c3",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid #fde047",
                    }}
                  >
                    <Zap
                      size={18}
                      style={{ color: "#ca8a04", fill: "#fde047" }}
                    />
                  </div>
                  <div>
                    <strong style={{ fontSize: "14px", color: "#854d0e" }}>
                      Chỉ số Điện (kWh)
                    </strong>
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
                      borderRadius: "3px",
                      background: electricUsage >= 0 ? "#fef08a" : "#fee2e2",
                      color: electricUsage >= 0 ? "#713f12" : "#991b1b",
                      fontSize: "12.5px",
                      fontWeight: 700,
                    }}
                  >
                    {electricUsage >= 0
                      ? `Tiêu thụ: ${electricUsage} kWh`
                      : "Không hợp lệ"}
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      color: "#713f12",
                      marginBottom: "4px",
                    }}
                  >
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
                      borderRadius: "3px",
                      border: "1px solid #fde047",
                      background: "#ffffff",
                      fontSize: "13.5px",
                      outline: "none",
                    }}
                  />
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#854d0e",
                      marginTop: "3px",
                    }}
                  >
                    Tự động lấy số cuối kỳ trước nếu có
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      color: "#713f12",
                      marginBottom: "4px",
                    }}
                  >
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
                      borderRadius: "3px",
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
                borderRadius: "3px",
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
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "3px",
                      background: "#e0f2fe",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid #7dd3fc",
                    }}
                  >
                    <Droplets
                      size={18}
                      style={{ color: "#0284c7", fill: "#bae6fd" }}
                    />
                  </div>
                  <div>
                    <strong style={{ fontSize: "14px", color: "#0369a1" }}>
                      Chỉ số Nước (m³)
                    </strong>
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
                      borderRadius: "3px",
                      background: waterUsage >= 0 ? "#bae6fd" : "#fee2e2",
                      color: waterUsage >= 0 ? "#0c4a6e" : "#991b1b",
                      fontSize: "12.5px",
                      fontWeight: 700,
                    }}
                  >
                    {waterUsage >= 0
                      ? `Tiêu thụ: ${waterUsage} m³`
                      : "Không hợp lệ"}
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      color: "#0369a1",
                      marginBottom: "4px",
                    }}
                  >
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
                      borderRadius: "3px",
                      border: "1px solid #7dd3fc",
                      background: "#ffffff",
                      fontSize: "13.5px",
                      outline: "none",
                    }}
                  />
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#0284c7",
                      marginTop: "3px",
                    }}
                  >
                    Tự động lấy số cuối kỳ trước nếu có
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      color: "#0369a1",
                      marginBottom: "4px",
                    }}
                  >
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
                      borderRadius: "3px",
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

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "10px",
          }}
        >
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
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Zap
                          size={16}
                          style={{
                            color: "#ca8a04",
                            fill: "#fde047",
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <div>
                            <span
                              style={{ color: "#64748b", fontSize: "12px" }}
                            >
                              Đầu:
                            </span>{" "}
                            {x.electricity.start} →{" "}
                            <span
                              style={{ color: "#64748b", fontSize: "12px" }}
                            >
                              Cuối:
                            </span>{" "}
                            <strong>{x.electricity.end}</strong>
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#b45309",
                              fontWeight: 700,
                            }}
                          >
                            Tiêu thụ: {x.electricity.usage} kWh
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          color: "#94a3b8",
                        }}
                      >
                        <Zap size={15} style={{ color: "#cbd5e1" }} />
                        <span style={{ fontSize: "12px", fontStyle: "italic" }}>
                          Chưa nhập
                        </span>
                      </div>
                    ),
                },
                {
                  key: "water",
                  label: "Chỉ số Nước (m³)",
                  render: (x) =>
                    x.water ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Droplets
                          size={16}
                          style={{
                            color: "#0284c7",
                            fill: "#bae6fd",
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <div>
                            <span
                              style={{ color: "#64748b", fontSize: "12px" }}
                            >
                              Đầu:
                            </span>{" "}
                            {x.water.start} →{" "}
                            <span
                              style={{ color: "#64748b", fontSize: "12px" }}
                            >
                              Cuối:
                            </span>{" "}
                            <strong>{x.water.end}</strong>
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#0284c7",
                              fontWeight: 700,
                            }}
                          >
                            Tiêu thụ: {x.water.usage} m³
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          color: "#94a3b8",
                        }}
                      >
                        <Droplets size={15} style={{ color: "#cbd5e1" }} />
                        <span style={{ fontSize: "12px", fontStyle: "italic" }}>
                          Chưa nhập
                        </span>
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
                        borderRadius: "3px",
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
          onClose={() =>
            setModalState({ open: false, roomId: "", periodId: "" })
          }
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

export { ReadingsCombinedModal };
export default ReadingsPage;
