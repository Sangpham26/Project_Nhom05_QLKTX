import { useState, useEffect } from "react";
import { api } from "../services/api";

/**
 * Custom hook quản lý thông báo Toast (Success, Error)
 */
export function useNotice() {
  const [message, setMessage] = useState(null);
  const notice = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };
  return [message, notice, setMessage];
}

/**
 * Custom hook tự động tải dữ liệu từ API backend theo path
 */
export function useLoad(path, deps = []) {
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

export default useLoad;
