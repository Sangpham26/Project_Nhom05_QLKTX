import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Field } from "../components/common";
import logoDark from "../../img/logo/Mainlogo-Dark.png";

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

export default AuthPage;
