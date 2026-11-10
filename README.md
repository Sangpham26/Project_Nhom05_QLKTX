# Website Quản Lý Ký Túc Xá

Hệ thống phần mềm quản lý và vận hành ký túc xá toàn diện, hiện đại, kết nối đồng bộ quy trình nghiệp vụ giữa **Ban Quản trị (Admin)**, **Cán bộ Vận hành (Staff)** và **Sinh viên nội trú (Student)**.

Dự án được xây dựng trên nền tảng công nghệ **React 19 / Vite**, **Express.js** và kiến trúc lưu trữ dữ liệu đa tầng (**MongoDB Atlas** tiêu chuẩn đám mây kết hợp cơ chế dự phòng **Local Repository**).

---

## 🌟 Mục tiêu & Đối tượng sử dụng

Hệ thống được thiết kế hướng tới số hóa toàn diện quy trình quản lý ký túc xá, loại bỏ thao tác thủ công, nâng cao tính chính xác và minh bạch trong chia sẻ chi phí sinh hoạt:

- **Quản trị viên (Admin):** Thiết lập cấu hình hệ thống, quản lý tài khoản & phân quyền tập trung, thiết lập danh mục cơ sở vật chất (tòa nhà, loại phòng, biểu giá dịch vụ, kỳ thu phí), quản lý kho tư liệu ảnh và giám sát báo cáo phân tích toàn diện.
- **Cán bộ Vận hành (Staff):** Tiếp nhận và xét duyệt hồ sơ đăng ký nội trú trực tuyến, quản lý danh sách sinh viên nội trú, giải quyết các biến động lưu trú (chuyển phòng, gia hạn, trả phòng), ghi nhận chỉ số điện nước định kỳ, phát hành hóa đơn hàng tháng và quản lý công nợ thu chi.
- **Sinh viên (Student):** Tra cứu trực quan thông tin phòng ở và cơ sở vật chất thực tế, nộp hồ sơ đăng ký nội trú, theo dõi tiến độ xét duyệt, tra cứu hóa đơn chi tiết (tiền phòng, tiền điện nước phân bổ minh bạch theo số người thực tế) và gửi các yêu cầu hành chính trực tuyến.

---

## 🚀 Tính năng & Phân hệ Chức năng Chính

### 1. Cổng thông tin & Trải nghiệm Giao diện Hiện đại
- **Thanh điều hướng thông minh (Liquid Glass Header):** Ứng dụng hiệu ứng kính mờ (backdrop-filter) với khả năng tự động nhận diện độ sáng của nội dung phía sau (Light/Dark content detection) để đảo màu logo và chữ linh hoạt, luôn đảm bảo độ tương phản hoàn hảo khi cuộn trang.
- **Thư viện ảnh phòng thực tế đa góc nhìn:** Cung cấp hình ảnh chi tiết của từng loại phòng (4 chỗ, 6 chỗ, 8 chỗ, nam/nữ) giúp sinh viên dễ dàng tìm hiểu và lựa chọn trước khi đăng ký.

### 2. Quản lý Cơ sở Vật chất & Danh mục
- Quản lý cấu trúc phân cấp: Tòa nhà $\rightarrow$ Phòng $\rightarrow$ Chỗ ở (giường).
- Định cấu hình loại phòng: Đơn giá thuê theo tháng, sức chứa tối đa, trang thiết bị đi kèm và ảnh đại diện.
- Quản lý biểu giá dịch vụ điện nước và các kỳ thu phí linh hoạt.

### 3. Tuyển sinh & Xét duyệt Hồ sơ Nội trú Trực tuyến
- Quy trình đăng ký nhanh gọn, tiếp nhận nguyện vọng phòng, thông tin cá nhân và đối tượng ưu tiên.
- Luồng duyệt hồ sơ chuẩn hóa 3 trạng thái:
  - **Duyệt hồ sơ & Chỉ định phòng:** Tự động tạo bản ghi lưu trú (`Stay`) và tính toán chỗ trống.
  - **Yêu cầu bổ sung:** Phản hồi ghi chú để sinh viên cập nhật thông tin còn thiếu.
  - **Từ chối hồ sơ:** Ghi nhận lý do minh bạch, thông báo đến sinh viên.

### 4. Quản lý Vận hành Lưu trú & Biến động Sinh viên
- Bảng danh sách sinh viên nội trú tích hợp **bộ lọc tìm kiếm cuộn thông minh (`FilterSelect`)** theo tòa nhà, mã phòng và trạng thái lưu trú.
- Nghiệp vụ chuyển phòng linh hoạt: Tự động cập nhật sức chứa và điều chỉnh phòng mới.
- Xử lý đơn yêu cầu gia hạn và trả phòng: Tự động giải phóng chỗ ở và chốt lịch sử lưu trú khi hoàn tất.

### 5. Quản lý Chỉ số Điện - Nước Gộp Đồng Bộ
- **Ghi nhận đồng thời trong 1 lần thao tác:** Bảng sổ chỉ số tổng hợp cả hai thông số Điện (biểu tượng `<Zap>`) và Nước (biểu tượng `<Droplets>` xanh biển) theo từng phòng trong mỗi kỳ thu.
- **Modal nhập/sửa gộp thông minh (`ReadingsCombinedModal`):**
  - Tự động kế thừa chỉ số cuối kỳ trước làm chỉ số đầu kỳ hiện tại.
  - Tính toán mức tiêu thụ thực tế ngay khi nhập liệu.
  - Hỗ trợ nút **Chỉnh sửa** trực tiếp tại từng dòng, cho phép điều chỉnh chỉ số mọi lúc mà không bị khóa form.

### 6. Lập Khoản Thu & Tính Hóa Đơn Tự Động Minh Bạch
- **Cơ chế tính toán công bằng:**
  - Tiền phòng: Tính theo giá niêm yết của loại phòng.
  - Tiền điện, nước: Tính toán dựa trên mức tiêu thụ thực tế $\times$ đơn giá quy định, **chia đều chính xác cho số lượng sinh viên thực tế đang ở trong phòng** tại thời điểm phát hành.
- **Tự động tải kỳ thu mới nhất:** Khi truy cập trang *Lập khoản thu*, hệ thống tự động nhận diện và nạp dữ liệu kỳ mới nhất, hiển thị ngay bảng tính xem trước mà không cần thao tác chọn thủ công.
- **Cơ chế Hóa đơn Snapshot cố định:** Khi phát hành, toàn bộ chi tiết tính toán, đơn giá và danh sách thành viên chia tiền được cố định vĩnh viễn theo snapshot kế toán, không bị thay đổi sai lệch khi có sinh viên mới vào hoặc chuyển đi sau đó.

### 7. Quản lý Thu Tiền & Theo dõi Công Nợ
- Hỗ trợ gạch nợ linh hoạt: Thanh toán từng phần hoặc thanh toán toàn bộ hóa đơn.
- Ghi nhận phương thức thanh toán: Tiền mặt hoặc Chuyển khoản ngân hàng.
- Báo cáo công nợ thời gian thực, cảnh báo hóa đơn chưa thanh toán hoặc quá hạn.

### 8. Thống kê, Giám sát & Xuất Nhật Ký Hoạt Động (Audit Log)
- **Bảng điều khiển phân tích (Dashboard):** Tổng hợp trực quan tỷ lệ lấp đầy phòng, số lượng hồ sơ chờ duyệt, doanh thu dự kiến và công nợ tồn đọng.
- **Nhật ký hoạt động hệ thống (System Activity Log):** Ghi vết đầy đủ mọi thao tác nghiệp vụ quan trọng (đổi mật khẩu, duyệt hồ sơ, chốt số điện nước, phát hành hóa đơn, thu tiền).
- **Làm mới tức thì & Xuất Excel:**
  - Nút tải lại nhật ký dạng icon xoay gọn gàng.
  - Tích hợp tính năng **Xuất nhật ký ra file Excel (.xlsx)** chuẩn chỉnh theo: **Theo ngày**, **Theo tuần (7 ngày gần nhất)**, **Theo tháng**, hoặc **Tất cả**.

---

## 🛠 Kiến trúc Công nghệ (Tech Stack)

| Thành phần | Công nghệ sử dụng | Vai trò & Đặc điểm |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, React Router 7 | Giao diện Single Page Application (SPA) tốc độ cao, mượt mà |
| **Styling & Icons** | Vanilla Modern CSS, Lucide Icons | Giao diện tinh tế, hiệu ứng Liquid Glass, thiết kế bo góc đồng bộ |
| **Excel Engine** | SheetJS (`xlsx`) | Xử lý xuất báo cáo bảng tính trực tiếp từ trình duyệt |
| **Backend** | Node.js, Express.js | RESTful API server, kiến trúc phân tầng rõ ràng (Controller - Service - Repository) |
| **Xác thực & Bảo mật** | JWT (JSON Web Token), Bcrypt | Phân quyền truy cập theo vai trò (Role-Based Access Control - RBAC) |
| **Cơ sở Dữ liệu** | MongoDB Atlas / Local JSON | Hỗ trợ 2 chế độ cơ sở dữ liệu linh hoạt thông qua cấu hình môi trường |

---

## 💻 Hướng dẫn Cài đặt & Khởi chạy

### 1. Yêu cầu Hệ thống
- **Node.js:** Phiên bản `>= 20.19.0` (khuyến nghị Node.js LTS 22.x).
- **Trình quản lý gói:** `npm` (đi kèm Node.js).

### 2. Cài đặt Thư viện Phụ thuộc
Mở terminal tại thư mục gốc của dự án và chạy các lệnh:

```bash
# Cài đặt dependencies gốc, server và client
npm install
npm --prefix server install
npm --prefix client install
```

### 3. Cấu hình Môi trường (.env)
Sao chép file `.env.example` thành `.env` tại thư mục `server/` (hoặc thư mục gốc dự án tùy cấu hình):

```bash
cp server/.env.example server/.env
```

Các thông số cấu hình quan trọng trong `.env`:
```ini
PORT=4000
JWT_SECRET=your_jwt_secret_key_here

# Chọn nhà cung cấp cơ sở dữ liệu: 'mongodb' hoặc 'json'
DB_PROVIDER=mongodb

# Chuỗi kết nối MongoDB Atlas (khi dùng provider mongodb)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=qlktx_demo
```

> **Ghi chú về chế độ cơ sở dữ liệu:**
> - `DB_PROVIDER=mongodb`: Kết nối trực tiếp đến cụm cơ sở dữ liệu đám mây MongoDB Atlas.
> - `DB_PROVIDER=json`: Chạy chế độ phát triển offline hoặc thử nghiệm độc lập mà không cần kết nối mạng.

### 4. Khởi tạo Dữ liệu Mẫu (Seed Data)
Để khởi tạo dữ liệu mẫu mô phỏng hoạt động thực tế (tòa nhà, phòng, sinh viên, các kỳ thu, chỉ số điện nước và hóa đơn):

```bash
npm run seed
```

### 5. Khởi chạy Ứng dụng
Khởi chạy đồng thời cả Backend API và Frontend Client:

```bash
npm run dev
```

- **Giao diện người dùng (Client):** `http://localhost:5173`
- **Giao diện lập trình (Backend API):** `http://localhost:4000/api`
- **Kiểm tra trạng thái máy chủ:** `http://localhost:4000/api/health`

---

## 📁 Cấu trúc Thư mục Dự án

```text
QLKTX_DEMO/
├── client/                     # Mã nguồn giao diện Frontend (React 19 + Vite)
│   ├── src/
│   │   ├── components/         # Các component dùng chung (RoomGallery, RoomTypeEditor,...)
│   │   ├── pages/              # Trang tĩnh & trang chủ (LandingPage,...)
│   │   ├── services/           # Kết nối API, hàm định dạng tiền tệ, ngày tháng
│   │   ├── styles/             # Toàn bộ CSS (styles.css, landing-header.css, theme.css,...)
│   │   ├── App.jsx             # Điều hướng router, bố cục và các màn hình chức năng chính
│   │   └── main.jsx            # Entry point của ứng dụng React
│   └── package.json
│
├── server/                     # Mã nguồn máy chủ Backend (Node.js + Express)
│   ├── src/
│   │   ├── controllers/        # Tầng Controller tiếp nhận và chuẩn hóa request/response
│   │   ├── repositories/       # Tầng trừu tượng dữ liệu (MongoDB Driver & JSON Fallback)
│   │   ├── routes/             # Định tuyến API RESTful và middleware phân quyền
│   │   ├── services/           # Tầng Service chứa toàn bộ logic nghiệp vụ hệ thống
│   │   └── app.js              # Khởi tạo máy chủ Express và middleware
│   ├── scripts/                # Kịch bản nạp dữ liệu mẫu và di chuyển dữ liệu (seed, migration)
│   ├── data/                   # Tệp lưu trữ dữ liệu JSON cục bộ dự phòng
│   └── package.json
│
├── material/                   # Tài liệu thiết kế, tài liệu hướng dẫn và biểu mẫu nghiệp vụ
├── package.json                # Kịch bản điều phối khởi chạy toàn bộ dự án
└── README.md                   # Tài liệu hướng dẫn sử dụng và giới thiệu dự án
```

---

## 🔒 Kiểm soát Truy cập & Bảo mật (RBAC)

Hệ thống áp dụng cơ chế xác thực danh tính qua **JSON Web Token (JWT)** và kiểm soát truy cập dựa trên vai trò (**Role-Based Access Control**):

- Mọi API nhạy cảm đều được bảo vệ bởi middleware xác thực chữ ký số và kiểm tra trạng thái hoạt động của tài khoản.
- Mật khẩu người dùng được băm một chiều an toàn bằng thuật toán **Bcrypt** trước khi lưu vào cơ sở dữ liệu.
- Phân định rõ ràng phạm vi truy cập:
  - Sinh viên chỉ được phép xem và thao tác trên dữ liệu cá nhân của chính mình.
  - Cán bộ và Quản trị viên được phân quyền tương ứng với trách nhiệm quản trị và vận hành.
- Toàn bộ danh sách tài khoản phân quyền và thông tin định danh được bảo mật nội bộ và lưu trữ riêng trong tài liệu bàn giao nghiệp vụ, tuyệt đối không công khai trên các kênh phân phối mã nguồn.

---

## 📄 Bản quyền & Đóng góp
Dự án được xây dựng và hoàn thiện bởi nhóm phát triển hệ thống Quản lý Ký túc xá. Mọi đóng góp và yêu cầu tính năng vui lòng liên hệ đội ngũ quản trị để được hỗ trợ.
