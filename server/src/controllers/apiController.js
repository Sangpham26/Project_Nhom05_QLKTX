// Tầng điều phối Controller trung gian nhận yêu cầu và xử lý phản hồi API
const service = require("../services/core");
const jwt = require("jsonwebtoken");

// Lấy khóa bí mật JWT từ môi trường
const secret = process.env.JWT_SECRET || "local-demo-secret-change-me";

// Bao bọc xử lý hàm bất đồng bộ và định dạng phản hồi chuẩn { success: true, data }
const send = (fn) => (req, res, next) => {
  Promise.resolve()
    .then(() => fn(req))
    .then((data) => res.json({ success: true, data }))
    .catch(next);
};

// Middleware xác thực danh tính người dùng qua JWT Token (Bearer Authentication)
const auth = async (req, res, next) => {
  try {
    const token = (req.headers.authorization || "").replace(/^Bearer /i, "");
    const payload = jwt.verify(token, secret);
    const current = (await service.me(payload)).user;
    if (!current.active)
      return res
        .status(403)
        .json({ success: false, error: "Tài khoản đã bị khóa." });
    req.user = current;
    next();
  } catch {
    res.status(401).json({ success: false, error: "Vui lòng đăng nhập." });
  }
};

// Middleware kiểm tra và phân quyền người dùng theo vai trò (Role-Based Authorization)
const allow =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user.role)
      ? next()
      : res.status(403).json({
          success: false,
          error: "Bạn không có quyền thực hiện thao tác này.",
        });

// Xử lý đăng nhập tài khoản và tạo mã xác thực JWT Token
const login = send(async (req) => {
  const data = await service.login(req.body);
  return {
    ...data,
    token: jwt.sign({ id: data.user.id }, secret, { expiresIn: "7d" }),
  };
});

// Xử lý tự đăng ký tài khoản sinh viên mới
const register = send(async (req) => {
  const data = await service.register(req.body);
  return {
    ...data,
    token: jwt.sign({ id: data.user.id }, secret, { expiresIn: "7d" }),
  };
});

module.exports = { send, auth, allow, login, register, service };
