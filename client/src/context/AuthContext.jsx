import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { ShieldCheck } from "lucide-react";
import { api } from "../services/api";

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }) {
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
      {children}
      {revokedNotice && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              maxWidth: "420px",
              width: "100%",
              padding: "28px 24px",
              boxShadow: "0 20px 40px -10px rgba(0,0,0,0.3)",
              textAlign: "center",
              animation: "modalFadeIn 0.25s ease-out",
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

export default AuthContext;
