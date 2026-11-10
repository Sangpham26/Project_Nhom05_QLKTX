// ==============================================================================
// ĐỊNH NGHĨA TOÀN BỘ CÁC TUYẾN ĐƯỜNG RESTFUL API HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ
// ==============================================================================

const express = require("express");
const roomImages = require("../services/roomImages");
const {
  send,
  auth,
  allow,
  login,
  register,
  service: s,
} = require("../controllers/apiController");

const r = express.Router();

// Thiết lập các mức phân quyền độc lập, tách biệt rõ ràng trách nhiệm:
// - staffOnly: Dành riêng cho Nhân viên KTX thực hiện nghiệp vụ vận hành hàng ngày
// - adminOnly: Dành riêng cho Quản trị viên quản lý tài khoản, mật khẩu và cấu hình danh mục
// - staffOrAdmin: Dành cho cả Nhân viên và Quản trị viên (xem báo cáo, danh sách tra cứu)
const staffOnly = allow("STAFF");
const adminOnly = allow("ADMIN");
const staffOrAdmin = allow("STAFF", "ADMIN");

// ==============================================================================
// 1. CÁC TUYẾN ĐƯỜNG CÔNG KHAI (PUBLIC ROUTES)
// ==============================================================================

// Tuyến đường xử lý đăng nhập hệ thống
r.post("/auth/login", login);

// Tuyến đường sinh viên tự đăng ký tài khoản mới
r.post("/auth/register", register);

// Tuyến đường tra cứu danh mục tổng hợp (Tòa nhà, loại phòng, số chỗ trống)
r.get(
  "/catalog",
  send(() => s.catalog()),
);

// Tuyến đường xem thư viện ảnh của loại phòng (Công khai cho khách và sinh viên)
r.get(
  "/roomTypes/:id/images",
  send((req) => roomImages.list(req.params.id)),
);

// Bắt buộc xác thực danh tính qua JWT Token từ điểm này trở xuống
r.use(auth);

// ==============================================================================
// 2. TÀI KHOẢN VÀ HỒ SƠ CÁ NHÂN (PROFILE & AUTH)
// ==============================================================================

// Lấy thông tin tài khoản và hồ sơ của người dùng đang đăng nhập
r.get(
  "/auth/me",
  send((req) => s.me(req.user)),
);

// Cập nhật thông tin liên hệ trong hồ sơ cá nhân
r.patch(
  "/profile",
  send((req) => s.updateProfile(req.user, req.body)),
);

// ==============================================================================
// 3. BÁO CÁO VÀ HÀNG ĐỢI CÔNG VIỆC (REPORT & WORK QUEUE)
// ==============================================================================

// Báo cáo tổng hợp tình hình KTX (Tỷ lệ lấp đầy, doanh thu, công nợ)
r.get(
  "/report",
  staffOrAdmin,
  send((req) => s.report(req.user, req.query)),
);

// Đếm số lượng công việc đang chờ xử lý hiển thị huy hiệu đỏ trên menu
r.get(
  "/work-queue",
  staffOrAdmin,
  send(() => s.workQueue()),
);

// Tuyến đường xem nhật ký hoạt động hệ thống toàn diện của mọi role
r.get(
  "/activity-logs",
  staffOrAdmin,
  send((req) => s.activityLogs(req.user, req.query)),
);

// ==============================================================================
// 4. QUẢN TRỊ TÀI KHOẢN VÀ MẬT KHẨU TOÀN HỆ THỐNG (CHỈ DÀNH CHO ADMIN)
// ==============================================================================

// Lấy danh sách tất cả tài khoản trong hệ thống (Sinh viên, Nhân viên, Quản trị viên)
r.get(
  "/users",
  adminOnly,
  send((req) => s.usersList(req.query)),
);

// Quản trị viên tạo mới tài khoản
r.post(
  "/users",
  adminOnly,
  send((req) => s.userCreate(req.body)),
);

// Quản trị viên đặt lại mật khẩu cho bất kỳ người dùng nào
r.patch(
  "/users/:id/password",
  adminOnly,
  send((req) => s.userResetPassword(req.params.id, req.body.password)),
);

// Quản trị viên khóa hoặc kích hoạt tài khoản
r.patch(
  "/users/:id/status",
  adminOnly,
  send((req) => s.userSetStatus(req.params.id, req.body.active)),
);

// Quản lý danh sách nhân viên KTX
r.get(
  "/staff",
  adminOnly,
  send((req) => s.staffList(req.query)),
);

// Thêm mới nhân viên KTX
r.post(
  "/staff",
  adminOnly,
  send((req) => s.staffWrite(req.body)),
);

// Sửa thông tin hoặc phân quyền nhân viên KTX
r.patch(
  "/staff/:id",
  adminOnly,
  send((req) => s.staffWrite(req.body, req.params.id)),
);

// ==============================================================================
// 5. QUẢN LÝ SINH VIÊN VÀ HỒ SƠ ĐĂNG KÝ (STUDENTS & APPLICATIONS)
// ==============================================================================

// Tra cứu danh sách sinh viên nội trú
r.get(
  "/students",
  staffOrAdmin,
  send((req) => s.students(req.user, req.query)),
);

// Xem hồ sơ chi tiết và toàn bộ lịch sử lưu trú của sinh viên
r.get(
  "/students/:id",
  staffOrAdmin,
  send((req) => s.studentDetail(req.user, req.params.id)),
);

// Lấy danh sách hồ sơ đăng ký phòng (Sinh viên xem của mình, Nhân viên xem tất cả)
r.get(
  "/applications",
  send((req) => s.applications(req.user, req.query)),
);

// Sinh viên nộp đơn đăng ký nguyện vọng phòng
r.post(
  "/applications",
  allow("STUDENT"),
  send((req) => s.apply(req.user, req.body)),
);

// Sinh viên bổ sung thông tin khi hồ sơ ở trạng thái NEEDS_INFO
r.patch(
  "/applications/:id",
  allow("STUDENT"),
  send((req) => s.applicationUpdate(req.user, req.params.id, req.body)),
);

// Xem chi tiết một hồ sơ đăng ký
r.get(
  "/applications/:id",
  send((req) => s.applicationDetail(req.user, req.params.id)),
);

// Nhân viên KTX thực hiện nghiệp vụ xét duyệt hồ sơ (Duyệt bố trí phòng / Yêu cầu bổ sung / Từ chối)
r.post(
  "/applications/:id/:action",
  staffOnly,
  send((req) =>
    s.applicationAction(req.user, req.params.id, req.params.action, req.body),
  ),
);

// ==============================================================================
// 6. QUẢN LÝ LƯU TRÚ VÀ YÊU CẦU LƯU TRÚ (STAYS, REQUESTS & TRANSFERS)
// ==============================================================================

// Xem danh sách các lượt lưu trú
r.get(
  "/stays",
  send((req) => s.stays(req.user, req.query)),
);

// Xem danh sách yêu cầu lưu trú (Gia hạn / Trả phòng)
r.get(
  "/requests",
  send((req) => s.stayRequests(req.user, req.query)),
);

// Sinh viên gửi yêu cầu xin gia hạn hoặc trả phòng
r.post(
  "/requests",
  allow("STUDENT"),
  send((req) => s.requestStay(req.user, req.body)),
);

// Nhân viên KTX phê duyệt hoặc từ chối yêu cầu gia hạn/trả phòng
r.post(
  "/requests/:id/decision",
  staffOnly,
  send((req) => s.decideRequest(req.user, req.params.id, req.body)),
);

// Xem lịch sử các đợt chuyển phòng
r.get(
  "/transfers",
  send((req) => s.transfers(req.user, req.query)),
);

// Nhân viên KTX thực hiện chuyển phòng cho sinh viên
r.post(
  "/transfers",
  staffOnly,
  send((req) => s.transfer(req.user, req.body)),
);

// ==============================================================================
// 7. ĐIỆN NƯỚC, HÓA ĐƠN VÀ THANH TOÁN (READINGS, BILLING & PAYMENTS)
// ==============================================================================

// Xem danh sách chỉ số điện nước đã ghi nhận
r.get(
  "/readings",
  staffOrAdmin,
  send((req) => s.readings(req.query)),
);

// Lấy thông tin chỉ số điện nước theo phòng và kỳ thu (kèm chỉ số kỳ trước)
r.get(
  "/readings/room-period",
  staffOrAdmin,
  send((req) => s.readingGetByRoomAndPeriod(req.query)),
);

// Lưu hoặc cập nhật đồng thời cả chỉ số điện và nước cho một phòng
r.post(
  "/readings/combined",
  staffOrAdmin,
  send((req) => s.readingSaveCombined(req.user, req.body)),
);

// Lấy chỉ số kỳ trước làm căn cứ gợi ý chỉ số đầu kỳ mới
r.get(
  "/readings/previous",
  staffOrAdmin,
  send((req) => s.readingPrevious(req.query)),
);

// Ghi chỉ số điện nước mới cho phòng
r.post(
  "/readings",
  staffOrAdmin,
  send((req) => s.readingCreate(req.user, req.body)),
);

// Xem trước bảng tính hóa đơn dự kiến của kỳ thu
r.get(
  "/billing/preview/:periodId",
  staffOrAdmin,
  send((req) => s.preview(req.params.periodId)),
);

// Chốt và phát hành hóa đơn chính thức cho cả kỳ
r.post(
  "/billing/issue/:periodId",
  staffOrAdmin,
  send((req) => s.issue(req.user, req.params.periodId)),
);

// Xem danh sách hóa đơn (Sinh viên chỉ xem của mình, Nhân viên/Admin xem tất cả)
r.get(
  "/invoices",
  send((req) => s.invoices(req.user, req.query)),
);

// Xem chi tiết bảng phân bổ tiền điện nước và snapshot hóa đơn
r.get(
  "/invoices/:id",
  send((req) => s.invoiceDetail(req.user, req.params.id)),
);

// Ghi nhận khoản thanh toán từ sinh viên
r.post(
  "/payments",
  staffOrAdmin,
  send((req) => s.paymentCreate(req.user, req.body)),
);

// ==============================================================================
// 8. HỘP THƯ THÔNG BÁO (NOTIFICATIONS)
// ==============================================================================

// Lấy danh sách thông báo của người dùng hiện tại
r.get(
  "/notifications",
  send((req) => s.notifications(req.user, req.query)),
);

// Đánh dấu thông báo đã đọc
r.patch(
  "/notifications/:id/read",
  send((req) => s.readNotification(req.user, req.params.id)),
);

// ==============================================================================
// 9. QUẢN LÝ THƯ VIỆN ẢNH LOẠI PHÒNG (DÀNH CHO ADMIN)
// ==============================================================================

// Quản trị viên tải lên ảnh loại phòng mới
r.post(
  "/roomTypes/:id/images",
  adminOnly,
  express.raw({ type: () => true, limit: roomImages.maxBytes }),
  send((req) =>
    roomImages.upload(
      req.params.id,
      req.body,
      req.headers["content-type"],
      req.query.description,
    ),
  ),
);

// Quản trị viên chỉnh sửa mô tả hoặc chọn ảnh làm ảnh đại diện
r.patch(
  "/roomTypes/:id/images/:imageId",
  adminOnly,
  send((req) => roomImages.update(req.params.id, req.params.imageId, req.body)),
);

// Quản trị viên cập nhật thứ tự hiển thị của các ảnh
r.put(
  "/roomTypes/:id/images/order",
  adminOnly,
  send((req) => roomImages.reorder(req.params.id, req.body.imageIds)),
);

// Quản trị viên xóa ảnh loại phòng
r.delete(
  "/roomTypes/:id/images/:imageId",
  adminOnly,
  send((req) => roomImages.remove(req.params.id, req.params.imageId)),
);

// ==============================================================================
// 10. QUẢN LÝ DANH MỤC CƠ SỞ VẬT CHẤT & ĐƠN GIÁ (ADMIN CATALOG RESOURCES)
// ==============================================================================

for (const kind of ["buildings", "roomTypes", "rooms", "periods", "pricing"]) {
  // Lấy danh sách danh mục
  r.get(
    `/${kind}`,
    send((req) => s.catalogList(kind, req.query)),
  );

  // Xem chi tiết một bản ghi danh mục
  r.get(
    `/${kind}/:id`,
    send((req) => s.catalogDetail(kind, req.params.id)),
  );

  // Quản trị viên tạo mới bản ghi danh mục
  r.post(
    `/${kind}`,
    adminOnly,
    send((req) => s.catalogWrite(kind, req.body)),
  );

  // Cập nhật danh mục: Nhân viên chỉ được sửa sức chứa vận hành phòng, Admin sửa toàn diện
  r.patch(
    `/${kind}/:id`,
    kind === "rooms" ? staffOrAdmin : adminOnly,
    send((req) => {
      if (kind === "rooms" && req.user.role === "STAFF") {
        const allowed = ["operationalCapacity", "status"];
        if (Object.keys(req.body).some((key) => !allowed.includes(key)))
          s.fail(
            "Nhân viên chỉ được cập nhật sức chứa vận hành và trạng thái phòng.",
            403,
          );
      }
      return s.catalogWrite(kind, req.body, req.params.id);
    }),
  );
}

module.exports = r;
