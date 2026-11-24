import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotice } from "../hooks/useLoad";
import { api, labels } from "../services/api";
import { PageTitle, Section, Field, Toast } from "../components/common";

export default function ProfilePage() {
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
