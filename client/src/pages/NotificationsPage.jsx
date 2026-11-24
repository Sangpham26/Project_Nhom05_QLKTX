import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { api, date } from "../services/api";
import { useLoad, useNotice } from "../hooks/useLoad";
import { PageTitle, Section, Empty, Toast } from "../components/common";

export default function NotificationsPage() {
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
