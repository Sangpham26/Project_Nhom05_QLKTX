# Phân tích và thiết kế hệ thống quản lý ký túc xá

## Thành viên nhóm
- Phạm Ngọc Sang | MSSV: 1822040884
- Nguyễn Trương Tấn Quyền | MSSV: 1822040819
- Nguyễn Tấn Phú | MSSV: 1822040870
- Nguyễn Thế Dương | MSSV: 1822040842

## Mục tiêu & Đối tượng sử dụng
Hệ thống được thiết kế để hướng tới việc số hóa toàn diện quy trình quản lý ký túc xá, hạn chế thao tác thủ công, cải thiện tính chính xác và minh bạch trong việc công khai chi phí sinh hoạt:

- **admin:** Thiết lập cấu hình hệ thống, quản lý tài khoản, thiết lập danh mục cơ sở vật chất (tòa nhà, loại phòng, biểu giá dịch vụ, kỳ thu phí), tải lên và quản lý ảnh phòng, giám sát báo cáo phân tích.
- **staff:** Tiếp nhận và xét duyệt hồ sơ đăng ký nội trú trực tuyến, quản lý danh sách sinh viên nội trú, giải quyết các biến động lưu trú (chuyển phòng, gia hạn, trả phòng), ghi nhận chỉ số điện nước định kỳ, phát hành hóa đơn hàng tháng và quản lý công nợ thu chi.
- **student:** Tra cứu thông tin phòng ở và cơ sở vật chất, nộp hồ sơ đăng ký nội trú, theo dõi tiến độ xét duyệt, tra cứu hóa đơn chi tiết (tiền phòng, tiền điện nước phân bổ minh bạch theo số người thực tế) và gửi các yêu cầu hành chính trực tuyến.

---

## Các chức năng chính

### 1. Quản lý cơ sở vật chất & danh mục
- Phân cấp quản lý: Tòa nhà, phòng và giường/chỗ ở.
- Cấu hình loại phòng: Đơn giá thuê theo tháng, sức chứa tối đa, trang thiết bị đi kèm và thư viện ảnh thực tế.
- Cấu hình biểu giá điện, nước và các kỳ thu phí hàng tháng.

### 2. Quản lý tuyển sinh & xét duyệt hồ sơ
- Đăng ký nội trú trực tuyến: Tiếp nhận thông tin cá nhân, đối tượng ưu tiên và phòng đăng ký nguyện vọng.
- Xét duyệt hồ sơ với 3 trạng thái:
  - Duyệt hồ sơ: Tự động tạo bản ghi lưu trú (stay) và trừ số chỗ trống của phòng.
  - Yêu cầu bổ sung: Gửi phản hồi để student cập nhật thêm thông tin.
  - Từ chối hồ sơ: Lưu lý do từ chối cụ thể.

### 3. Quản lý sinh viên nội trú
- Danh sách sinh viên đang ở kèm bộ lọc cuộn tìm kiếm theo tòa nhà, mã phòng và trạng thái lưu trú.
- Chuyển phòng: Tự động cập nhật phòng mới và tính toán lại sức chứa giữa hai phòng.
- Xử lý gia hạn và trả phòng: Khi trả phòng, hệ thống tự động giải phóng chỗ ở và chốt lịch sử lưu trú.

### 4. Quản lý chỉ số điện nước
- Sổ ghi nhận kết hợp: Hiển thị đồng thời cả điện và nước cho từng phòng trong mỗi kỳ thu.
- Form nhập và sửa gộp:
  - Nhập đồng thời chỉ số điện và nước trong cùng một lần thao tác.
  - Tự động lấy chỉ số cuối của kỳ trước làm chỉ số đầu của kỳ hiện tại.
  - Tính toán mức tiêu thụ thực tế ngay khi nhập.
  - Cho phép chỉnh sửa lại chỉ số bất cứ lúc nào.

### 5. Lập khoản thu & tính hóa đơn
- Công thức tính tiền:
  - Tiền phòng: Tính theo đơn giá của loại phòng.
  - Tiền điện nước: Lấy lượng tiêu thụ nhân đơn giá, sau đó chia đều chính xác cho số lượng student thực tế đang ở trong phòng tại thời điểm chốt.
- Tự động nạp kỳ mới nhất: Khi mở trang lập khoản thu, hệ thống tự chọn kỳ thu mới nhất và hiển thị bảng tính xem trước.
- Hóa đơn dạng snapshot: Khi phát hành, toàn bộ thông tin tính toán, đơn giá và danh sách người chia tiền được cố định vĩnh viễn, không bị thay đổi hồi tố khi có biến động sau này.

### 6. Quản lý thu tiền & công nợ
- Hỗ trợ thanh toán từng phần hoặc thanh toán toàn bộ hóa đơn.
- Ghi nhận phương thức thanh toán qua tiền mặt hoặc chuyển khoản.
- Theo dõi danh sách công nợ, phân loại hóa đơn chưa thanh toán, thanh toán một phần hoặc quá hạn.

### 7. Dashboard & nhật ký hoạt động
- dashboard: Tổng hợp trực quan tỷ lệ lấp đầy phòng, số lượng hồ sơ chờ duyệt, doanh thu dự kiến và công nợ tồn đọng.
- audit log: Ghi vết đầy đủ các thao tác quan trọng trên hệ thống (đổi mật khẩu, duyệt hồ sơ, chốt điện nước, phát hành hóa đơn, thu tiền).
- Nút tải lại nhật ký và chức năng xuất toàn bộ hoặc theo ngày, theo tuần (7 ngày gần nhất), theo tháng ra file Excel (.xlsx).

---

## Công nghệ sử dụng

| Thành phần | Công nghệ | Mục đích sử dụng |
| :--- | :--- | :--- |
| Frontend | React 19, Vite, React Router 7 | Xây dựng giao diện ứng dụng web SPA |
| Styling & Icons | Vanilla CSS, Lucide Icons | Thiết kế giao diện, header cố định, bảng biểu và form |
| Xuất báo cáo | SheetJS (xlsx) | Tạo và tải file Excel trực tiếp tại trình duyệt |
| Backend | Node.js, Express.js | Xây dựng hệ thống REST API theo kiến trúc phân tầng |
| Xác thực | JWT, Bcrypt | Quản lý phiên đăng nhập và mã hóa mật khẩu một chiều |
| Cơ sở dữ liệu | MongoDB Atlas / Local JSON | Lưu trữ dữ liệu đám mây kèm chế độ dự phòng local |

---

## Hướng dẫn cài đặt & khởi chạy

### Yêu cầu môi trường
- Node.js phiên bản 20.19 trở lên (khuyên dùng Node 22).
- Trình quản lý gói npm.

### Cài đặt thư viện
Tại thư mục gốc dự án:
```bash
npm install
npm --prefix server install
npm --prefix client install
```

### Cấu hình biến môi trường
Tạo file `.env` tại thư mục gốc dự án với nội dung mẫu:
```ini
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=thay_bang_khoa_bi_mat_ngau_nhien
DATA_FILE=./data/database.json

# Chế độ cơ sở dữ liệu: 'mongodb' hoặc 'json'
DB_PROVIDER=mongodb
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=qlktx_demo
```

### Khởi chạy dự án
Chạy lệnh sau để khởi động đồng thời cả backend và frontend:
```bash
npm run dev
```

- Giao diện web: `http://localhost:5173`
- Backend API: `http://localhost:4000/api`
- Kiểm tra server: `http://localhost:4000/api/health`

---

## Cấu trúc thư mục

```text
QLKTX_DEMO/
├── client/
│   ├── src/
│   │   ├── components/      # Các component tái sử dụng (RoomGallery, RoomTypeEditor,...)
│   │   ├── pages/           # Trang tĩnh (LandingPage,...)
│   │   ├── services/        # Hàm gọi API, định dạng tiền tệ và ngày tháng
│   │   ├── styles/          # File định kiểu giao diện CSS
│   │   ├── App.jsx          # Điều hướng router, bố cục và các màn hình chức năng
│   │   └── main.jsx         # Điểm khởi chạy của ứng dụng React
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── controllers/     # Tiếp nhận request và chuẩn hóa response
│   │   ├── repositories/    # Tầng kết nối MongoDB Atlas và JSON fallback
│   │   ├── routes/          # Khai báo các route API và middleware phân quyền
│   │   ├── services/        # Xử lý logic nghiệp vụ, tính toán hóa đơn
│   │   └── app.js           # Khởi tạo máy chủ Express
│   ├── scripts/             # Kịch bản nạp và kiểm tra dữ liệu
│   ├── data/                # File lưu trữ dữ liệu JSON cục bộ
│   └── package.json
│
├── .env.example             # Mẫu cấu hình biến môi trường
├── package.json             # Điều phối lệnh chạy chung
└── README.md                # Tài liệu dự án
```

---

## Phân quyền & Bảo mật

- Xác thực tài khoản bằng JWT kèm kiểm tra trạng thái hoạt động (active/locked).
- Phân quyền theo vai trò (RBAC):
  - admin: Có quyền quản trị tài khoản, đặt lại mật khẩu và cấu hình danh mục.
  - staff: Quản lý hồ sơ, lưu trú, chỉ số điện nước, lập hóa đơn và thu tiền.
  - student: Chỉ có quyền xem và thao tác trên dữ liệu của chính mình.
- Mật khẩu lưu trong hệ thống luôn được băm qua Bcrypt.

---

## Đóng góp & Bản quyền

- Dự án được xây dựng và hoàn thiện bởi các thành viên trong nhóm:
  - Phạm Ngọc Sang
  - Nguyễn Trương Tấn Quyền
  - Nguyễn Tấn Phú
  - Nguyễn Thế Dương
- Tác nhân AI hỗ trợ phát triển: **Antigravity** (Google DeepMind).
- Dự án được định hướng và hoàn thiện dựa trên các ý kiến đóng góp, nhận xét từ Giảng viên hướng dẫn (GVHD).
