// Khởi tạo nạp biến môi trường từ file .env
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});
const express = require("express");
const cors = require("cors");
const roomImages = require("./services/roomImages");
const individualRoomImages = require("./services/individualRoomImages");
const repo = require("./repositories");

// Khởi tạo ứng dụng Express Server
const app = express();

// Cấu hình Middleware chia sẻ tài nguyên nguồn gốc chéo (CORS)
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));

// Cấu hình phục vụ các file ảnh tĩnh được tải lên cho loại phòng
app.use(
  "/api/uploads/room-types",
  express.static(roomImages.uploadDir, {
    fallthrough: false,
    immutable: true,
    maxAge: "1y",
    setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
  }),
);

// Cấu hình phục vụ các file ảnh tĩnh được tải lên cho từng phòng
app.use(
  "/api/uploads/rooms",
  express.static(individualRoomImages.uploadDir, {
    fallthrough: false,
    immutable: true,
    maxAge: "1y",
    setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
  }),
);

// Middleware phân tích dữ liệu yêu cầu dạng JSON
app.use(express.json());

// Tuyến đường kiểm tra trạng thái hoạt động của hệ thống (Health Check)
app.get("/api/health", (req, res) =>
  res.json({ success: true, data: { status: "ok" } }),
);

// Đăng ký toàn bộ các tuyến đường RESTful API của hệ thống
app.use("/api", require("./routes/apiRoutes"));

// Middleware bắt lỗi khi gọi đường dẫn API không tồn tại (404 Not Found)
app.use("/api", (req, res) =>
  res
    .status(404)
    .json({ success: false, error: "Đường dẫn API không tồn tại." }),
);

// Middleware tập trung xử lý toàn bộ lỗi phát sinh trong hệ thống (Error Handler)
app.use((error, req, res, next) => {
  console.error(error.message);
  const status = error.status || 500;
  const message =
    status === 413
      ? "Ảnh vượt quá dung lượng tối đa 5 MB."
      : status === 404
        ? "Ảnh hoặc đường dẫn không tồn tại."
        : error.status
          ? error.message
          : "Lỗi máy chủ. Vui lòng thử lại.";
  res
    .status(status)
    .json({ success: false, error: message, ...(error.code ? { code: error.code } : {}) });
});

// Thiết lập cổng hoạt động và khởi động máy chủ API
const port = process.env.PORT || 4000;
Promise.resolve(repo.ready?.())
  .then(() => {
    app.listen(port, () =>
      console.log("KTX API running at http://localhost:" + port),
    );
  })
  .catch(async (error) => {
    console.error("Cannot start API: database unavailable:", error.message);
    try {
      await repo.close?.();
    } catch (closeError) {
      console.error("Database close failed:", closeError.message);
    }
    process.exitCode = 1;
  });
