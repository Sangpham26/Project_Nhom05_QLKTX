import React, { useState, useMemo } from "react";
import { ClipboardList, CheckCircle2, Check, X, ArrowRight, UserCheck, RefreshCw, DoorClosed } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function PendingQueueSection({
  pendingApps = [],
  pendingRequests = [],
  dateTimeFormatter,
  onApproveApp,
  onRejectApp,
  onApproveRequest,
  onRejectRequest,
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("ALL"); // ALL | NEW_APP | TRANSFER | EXTEND | RETURN
  const [confirmModal, setConfirmModal] = useState(null); // { action: 'APPROVE'|'REJECT', item: obj, isApp: bool }

  // Break requests down by type
  const transferRequests = useMemo(
    () => pendingRequests.filter((r) => r.type === "TRANSFER"),
    [pendingRequests]
  );
  const extendRequests = useMemo(
    () => pendingRequests.filter((r) => r.type === "EXTEND"),
    [pendingRequests]
  );
  const returnRequests = useMemo(
    () => pendingRequests.filter((r) => r.type === "RETURN"),
    [pendingRequests]
  );

  const totalCount = pendingApps.length + pendingRequests.length;

  // Filter items based on activeTab
  const visibleItems = useMemo(() => {
    if (activeTab === "NEW_APP") return pendingApps.map((a) => ({ ...a, _isApp: true }));
    if (activeTab === "TRANSFER") return transferRequests.map((r) => ({ ...r, _isApp: false }));
    if (activeTab === "EXTEND") return extendRequests.map((r) => ({ ...r, _isApp: false }));
    if (activeTab === "RETURN") return returnRequests.map((r) => ({ ...r, _isApp: false }));

    // ALL tab: combine all
    return [
      ...pendingApps.map((a) => ({ ...a, _isApp: true })),
      ...pendingRequests.map((r) => ({ ...r, _isApp: false })),
    ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [activeTab, pendingApps, transferRequests, extendRequests, returnRequests]);

  const handleConfirmAction = () => {
    if (!confirmModal) return;
    const { action, item, isApp } = confirmModal;

    if (isApp) {
      if (action === "APPROVE" && onApproveApp) onApproveApp(item);
      else if (action === "REJECT" && onRejectApp) onRejectApp(item);
      else navigate(`/applications/${item.id}`);
    } else {
      if (action === "APPROVE" && onApproveRequest) onApproveRequest(item);
      else if (action === "REJECT" && onRejectRequest) onRejectRequest(item);
      else navigate("/requests", { state: { openRequest: item } });
    }
    setConfirmModal(null);
  };

  return (
    <div className="section-card" role="region" aria-label="Hồ sơ và yêu cầu chờ xử lý">
      <div className="section-head">
        <div>
          <h2>Hồ sơ & Yêu cầu chờ xử lý</h2>
          <p>Các đề xuất lưu trú, chuyển phòng và đăng ký mới nhất từ sinh viên</p>
        </div>
        <Link to="/applications" className="text-link" style={{ fontSize: "13px", fontWeight: 600 }}>
          Xem tất cả hồ sơ <ArrowRight size={15} />
        </Link>
      </div>

      {/* Tabs */}
      <div className="pending-tabs" role="tablist">
        <button
          type="button"
          className={`pending-tab-btn ${activeTab === "ALL" ? "active" : ""}`}
          onClick={() => setActiveTab("ALL")}
          role="tab"
          aria-selected={activeTab === "ALL"}
        >
          Tất cả <span className="pending-tab-count">{totalCount}</span>
        </button>
        <button
          type="button"
          className={`pending-tab-btn ${activeTab === "NEW_APP" ? "active" : ""}`}
          onClick={() => setActiveTab("NEW_APP")}
          role="tab"
          aria-selected={activeTab === "NEW_APP"}
        >
          Đăng ký mới <span className="pending-tab-count">{pendingApps.length}</span>
        </button>
        <button
          type="button"
          className={`pending-tab-btn ${activeTab === "TRANSFER" ? "active" : ""}`}
          onClick={() => setActiveTab("TRANSFER")}
          role="tab"
          aria-selected={activeTab === "TRANSFER"}
        >
          Chuyển phòng <span className="pending-tab-count">{transferRequests.length}</span>
        </button>
        <button
          type="button"
          className={`pending-tab-btn ${activeTab === "EXTEND" ? "active" : ""}`}
          onClick={() => setActiveTab("EXTEND")}
          role="tab"
          aria-selected={activeTab === "EXTEND"}
        >
          Gia hạn <span className="pending-tab-count">{extendRequests.length}</span>
        </button>
        <button
          type="button"
          className={`pending-tab-btn ${activeTab === "RETURN" ? "active" : ""}`}
          onClick={() => setActiveTab("RETURN")}
          role="tab"
          aria-selected={activeTab === "RETURN"}
        >
          Trả phòng <span className="pending-tab-count">{returnRequests.length}</span>
        </button>
      </div>

      {/* Item List or Empty State */}
      {visibleItems.length === 0 ? (
        <div className="dash-empty-state">
          <div className="dash-empty-icon">
            <CheckCircle2 size={28} />
          </div>
          <strong className="dash-empty-title">Không có hồ sơ nào cần xử lý</strong>
          <p className="dash-empty-desc">
            Tuyệt vời! Tất cả đơn đăng ký và đề xuất lưu trú của sinh viên đã được xử lý xong.
          </p>
        </div>
      ) : (
        <div style={{ maxHeight: "330px", overflowY: "auto", paddingRight: "4px" }}>
          {visibleItems.map((item) => {
            const isApp = item._isApp;
            const title = isApp
              ? item.student?.fullName || "Sinh viên"
              : `Yêu cầu ${
                  item.type === "TRANSFER"
                    ? "chuyển phòng"
                    : item.type === "EXTEND"
                    ? "gia hạn lưu trú"
                    : "trả phòng"
                } · ${item.student?.fullName || "Sinh viên"}`;

            const detail = isApp
              ? `Đăng ký: ${item.roomType?.name || "Loại phòng"} · ${dateTimeFormatter(item.createdAt)}`
              : `${item.reason || "Lý do cá nhân"} · ${dateTimeFormatter(item.createdAt)}`;

            return (
              <div
                key={item.id}
                className="pending-item-card"
                onClick={() => {
                  if (isApp) navigate(`/applications/${item.id}`);
                  else navigate("/requests", { state: { openRequest: item } });
                }}
                style={{ cursor: "pointer" }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "13.5px", color: "#0f172a" }}>{title}</div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{detail}</div>
                </div>

                <div className="pending-quick-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="pending-action-btn approve"
                    onClick={() => setConfirmModal({ action: "APPROVE", item, isApp })}
                    title="Duyệt yêu cầu này ngay"
                  >
                    <Check size={13} />
                    Duyệt
                  </button>
                  <button
                    type="button"
                    className="pending-action-btn reject"
                    onClick={() => setConfirmModal({ action: "REJECT", item, isApp })}
                    title="Từ chối yêu cầu này"
                  >
                    <X size={13} />
                    Từ chối
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="modal-backdrop" onMouseDown={() => setConfirmModal(null)}>
          <div
            className="modal"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: "420px" }}
            role="alertdialog"
          >
            <div className="modal-head">
              <div>
                <span className="eyebrow">XÁC NHẬN THAO TÁC</span>
                <h2>{confirmModal.action === "APPROVE" ? "Xác nhận duyệt" : "Xác nhận từ chối"}</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setConfirmModal(null)}
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>
            <p className="confirm-detail">
              Bạn có chắc chắn muốn{" "}
              <strong>{confirmModal.action === "APPROVE" ? "DUYỆT" : "TỪ CHỐI"}</strong>{" "}
              {confirmModal.isApp ? "hồ sơ đăng ký của" : "yêu cầu của"}{" "}
              <strong>{confirmModal.item.student?.fullName || "Sinh viên"}</strong>?
            </p>
            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="button button-ghost"
                onClick={() => setConfirmModal(null)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className={`button ${confirmModal.action === "APPROVE" ? "button-primary" : "button-danger"}`}
                onClick={handleConfirmAction}
              >
                {confirmModal.action === "APPROVE" ? "Đồng ý duyệt" : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
