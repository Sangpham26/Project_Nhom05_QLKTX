# Nhóm 05 — Website Quản Lý Ký Túc Xá Sinh Viên (QLKTX)

Ứng dụng React 19 / Vite và Express.js cho Sinh viên, Nhân viên KTX và Quản trị viên. Backend hỗ trợ `DB_PROVIDER=mongodb` (MongoDB Atlas, mỗi bản ghi là một document trong collection riêng) và `DB_PROVIDER=json` để chạy dự phòng dữ liệu cục bộ.

## Chạy nhanh

Yêu cầu Node.js **20.19 trở lên** (khuyến nghị 22) và npm.

```bash
npm install
npm --prefix server install
npm --prefix client install
npm run dev
```

- Mở ứng dụng tại: **http://localhost:5173**
- Backend API chạy tại: **http://localhost:4000/api**
- Build giao diện: `npm run build`
- Chạy backend độc lập: `npm --prefix server start`
- Nạp lại dữ liệu hệ thống: `npm run seed`

Sao chép `.env.example` thành `.env`, cấu hình `JWT_SECRET` và `MONGODB_URI` tương ứng.

---

## Danh sách Tài khoản Hệ thống

Toàn bộ dữ liệu hệ thống mô phỏng thực tế **hoạt động trong 6 tháng** (với 34 tài khoản: 2 Quản trị viên, 2 Nhân viên, 30 Sinh viên, 6 kỳ thu phí, 158 hóa đơn, 145 phiếu thu thanh toán).

> Mật khẩu đăng nhập chung cho tất cả tài khoản: **`Ktx@2026`**  
> 📄 Xem danh sách tài khoản chi tiết đầy đủ 30 sinh viên tại file: **`material/DANH_SACH_TAI_KHOAN.md`**

| Vai trò                   | Email đăng nhập             | Họ và tên              | Chức vụ / Trạng thái                                |
| ------------------------- | --------------------------- | ---------------------- | --------------------------------------------------- |
| **Quản trị viên (Admin)** | `admin@ktx.edu.vn`          | ThS. Nguyễn Hoàng Long | Quản trị viên trưởng, quản lý tài khoản & danh mục  |
| **Quản trị viên (Admin)** | `admin.kythuat@ktx.edu.vn`  | Kỹ sư Trần Văn Hùng    | Quản trị kỹ thuật hệ thống                          |
| **Nhân viên (Staff)**     | `staff.lan@ktx.edu.vn`      | Cô Lê Thị Lan          | Cán bộ duyệt hồ sơ, bố trí phòng & lưu trú          |
| **Nhân viên (Staff)**     | `staff.nam@ktx.edu.vn`      | Thầy Đỗ Thành Nam      | Cán bộ ghi chỉ số điện nước, lập hóa đơn & thu tiền |
| **Sinh viên A (Student)** | `an.nguyen@student.edu.vn`  | Nguyễn Minh An         | Đang ở phòng A101 (Phòng 4 Nam)                     |
| **Sinh viên B (Student)** | `anh.nguyen@student.edu.vn` | Nguyễn Mai Anh         | Đang ở phòng B101 (Phòng 4 Nữ)                      |
| **Sinh viên C (Student)** | `triet.vo@student.edu.vn`   | Võ Minh Triết          | Hồ sơ mới đang chờ duyệt (`PENDING`)                |
| **Sinh viên D (Student)** | `thao.dinh@student.edu.vn`  | Đinh Thu Thảo          | Đang ở phòng B202, có yêu cầu xin gia hạn           |

---

## Phân định Chức năng & Vai trò (RBAC)

Hệ thống phân tách quyền hạn độc lập, chặt chẽ giữa các vai trò:

| Vai trò                   | Phạm vi chức năng                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sinh viên (Student)**   | Tự đăng ký/đăng nhập, cập nhật hồ sơ cá nhân, tra cứu phòng, gửi hồ sơ đăng ký nguyện vọng, theo dõi trạng thái duyệt, xem thông tin lưu trú, gửi yêu cầu gia hạn hoặc trả phòng, xem chi tiết hóa đơn theo tháng (tiền phòng, số điện/nước chia đều), xem lịch sử thanh toán và nhận thông báo.                                                                                             |
| **Nhân viên KTX (Staff)** | Tiếp nhận và xét duyệt hồ sơ đăng ký (duyệt kèm chỉ định phòng, yêu cầu bổ sung, hoặc từ chối kèm lý do); phê duyệt yêu cầu gia hạn/trả phòng; thực hiện chuyển phòng; ghi chỉ số điện nước hàng tháng; xem trước bảng tính và phát hành hóa đơn cho toàn KTX; ghi nhận các đợt thanh toán (tiền mặt / chuyển khoản), quản lý công nợ sinh viên nội trú.                                     |
| **Quản trị viên (Admin)** | **Quản trị tài khoản & người dùng toàn hệ thống**: xem danh sách tất cả người dùng (Sinh viên, Nhân viên, Admin), đặt lại mật khẩu cho bất kỳ user nào, kích hoạt hoặc khóa tài khoản, tạo mới tài khoản; **Quản trị cơ sở vật chất**: thêm/sửa tòa nhà, loại phòng, danh sách phòng, biểu giá điện nước, kỳ thu phí; tải lên và quản lý thư viện ảnh phòng; xem báo cáo tổng hợp toàn diện. |

---

## Cấu trúc Dự án

```text
client/
  src/App.jsx             Trang, bố cục, form, phân quyền và luồng React Router
  src/api.js               Client gọi API, định dạng tiền VNĐ và ngày tháng
  src/styles.css           Giao diện quản lý nội trú
  src/landing.css          Giao diện trang chủ và màn hình xác thực
  src/theme.css            Bảng màu sidebar và header
  src/RoomGallery.jsx      Thư viện ảnh xem phòng thực tế
  src/RoomTypeEditor.jsx   Quản lý ảnh loại phòng cho quản trị viên
server/
  src/routes/apiRoutes.js  Định nghĩa các RESTful routes và middleware phân quyền
  src/controllers/         Nhận request, xác thực JWT token và chuẩn hóa phản hồi
  src/services/core.js     Toàn bộ logic nghiệp vụ, tính tiền, chia dư nợ và snapshot
  src/services/roomImages.js Lưu và phục vụ file ảnh loại phòng
  src/repositories/        MongoDB Atlas repository, JSON fallback, schema validation
  scripts/seed.js          Khởi tạo 34 tài khoản thật và dữ liệu 6 tháng hoạt động
material/                  Thư mục tài liệu, bản thiết kế, test cases và danh sách tài khoản
```
