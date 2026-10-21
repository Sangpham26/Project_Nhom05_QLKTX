# Nhóm 05 — website quản lý ký túc xá sinh viên

Ứng dụng React/Vite và Express cho sinh viên, nhân viên KTX và quản trị viên. Backend hỗ trợ `DB_PROVIDER=mongodb` (MongoDB Atlas, mỗi bản ghi là một document trong collection riêng) và `DB_PROVIDER=json` để quay về dữ liệu cũ. Giữ file JSON và thư mục ảnh gốc khi chuyển đổi.

## Chạy nhanh

Yêu cầu Node.js **20.19 trở lên** (khuyến nghị 22) và npm. Với dữ liệu hiện có, **không chạy seed/reset**.

```bash
npm install
npm --prefix server install
npm --prefix client install
npm run dev
```

Mở **http://localhost:5173**. Backend chạy ở **http://localhost:4000/api**. Có thể chạy riêng `npm run dev:server` và `npm run dev:client`. Dùng `npm run build` để build frontend; `npm --prefix server start` để chạy backend không dùng watch.

`npm run seed` chỉ dùng cho môi trường mới, trống. `npm run reset` chỉ dành cho JSON thử nghiệm và **ghi đè dữ liệu**; MongoDB từ chối reset. File dữ liệu, `.env`, ảnh tải lên và `atlas-credentials.env` được bỏ qua bởi `.gitignore`.

Sao chép `.env.example` thành `.env`, đặt `JWT_SECRET` dài và ngẫu nhiên. URI Atlas phải nằm trong `.env`, không commit. Chỉ chuyển `DB_PROVIDER=mongodb` sau khi migration và kiểm tra thành công.

## Chuyển dữ liệu JSON sang MongoDB Atlas

1. Trong Atlas, tạo Database User có quyền đọc/ghi database đích; thêm IP máy chạy backend vào Network Access. Cluster phải đang hoạt động và máy phải kết nối được tới cổng TCP 27017. Dùng database mới, trống; ví dụ `qlktx_demo`. Mã nguồn không cần quyền quản trị Atlas.
2. Sao lưu nguyên trạng `server/data/database.json` và `server/uploads/room-types/` ra một thư mục khác. Không xóa hay reset nguồn.
3. Đặt `MONGODB_URI`, `MONGODB_DB_NAME` trong `.env`; tạm giữ `DB_PROVIDER=json`. URI có mật khẩu cần URL encode nếu chứa ký tự đặc biệt. Cài dependency bằng `npm --prefix server install`.
4. Từ thư mục gốc, chạy `npm --prefix server run migrate:check` để kiểm tra dữ liệu, ID, liên kết và file ảnh mà không kết nối Atlas. Chạy `npm --prefix server run migrate:dry-run` để kiểm tra kết nối và database đích còn trống.
5. Chạy `npm --prefix server run migrate:apply`. Script dùng một MongoDB transaction để ghi từng bản ghi vào 16 collection và ghi dấu SHA-256 nguồn. Nếu lỗi, giao dịch hủy; chạy lại an toàn với cùng file nguồn. Script từ chối database có dữ liệu ứng dụng hoặc dấu migration từ file khác.
6. Chạy `npm --prefix server run migrate:verify`. Đối chiếu số lượng, liên kết, ảnh, index và SHA-256 nguồn. Sau đó đổi `DB_PROVIDER=mongodb` trong `.env`, khởi động lại backend và thử đăng nhập, ảnh phòng, hồ sơ, hóa đơn, thanh toán.
7. Nếu cần quay về ngay, đặt `DB_PROVIDER=json` và khởi động lại backend. MongoDB không bị xóa; JSON gốc vẫn nguyên. Các thay đổi phát sinh trên MongoDB sau thời điểm chuyển đổi **không tự đồng bộ ngược** về JSON, nên cần xuất/đối soát chúng trước khi sử dụng JSON lâu dài.

Migration giữ ID chuỗi cũ làm cả `id` và `_id`, giữ mật khẩu bcrypt, ảnh metadata, hóa đơn snapshot và lịch sử. Mỗi nghiệp vụ ghi nhiều bản ghi dùng MongoDB transaction; một document phiên bản chung tuần tự hóa các lần ghi để giữ các quy tắc như sức chứa phòng và số dư hóa đơn. Cách này ưu tiên tính đúng đắn, cần tối ưu lại nếu triển khai với lượng ghi lớn.

**Ảnh thật vẫn nằm trên ổ đĩa backend**, còn MongoDB chỉ giữ metadata và URL. Khi triển khai production cần gắn volume bền vững cho `server/uploads/room-types/` và sao lưu volume này cùng MongoDB; nếu dùng nhiều máy chủ, chuyển file ảnh sang object storage và cập nhật URL/cách upload trước khi mở rộng. Không lưu ảnh dạng base64 trong MongoDB.

Để thử nghiệm API có ghi, tạo **database Atlas riêng** bằng `MONGODB_DB_NAME=qlktx_test_...`, chạy migration vào database đó, bật MongoDB provider và chạy `node server/scripts/smoke.js`; không chạy smoke trên database production. `API_BASE` cho phép đổi địa chỉ API. Kiểm tra dữ liệu sau khi khởi động lại backend bằng `migrate:verify` và API.

### Khi triển khai thật

- Build frontend bằng `npm run build`, phục vụ `client/dist/` qua máy chủ web. Chuyển tiếp `/api` và `/api/uploads/room-types` tới Express; Vite proxy trong `client/vite.config.js` chỉ dùng khi phát triển.
- Chạy backend bằng `npm --prefix server start` với `DB_PROVIDER=mongodb`, `MONGODB_URI`, `MONGODB_DB_NAME`, `CLIENT_ORIGIN` và `JWT_SECRET` ở biến môi trường của máy chủ. Không công khai `.env` hoặc file thông tin Atlas. Thay mật khẩu demo trước khi dùng tài khoản thật.
- Gắn thư mục `server/uploads/room-types/` vào volume bền vững và sao lưu cùng dữ liệu MongoDB. Atlas Free không có bản sao lưu tự động của Atlas; dùng `mongodump`/`mongorestore` hoặc chọn cấp cluster có Cloud Backup và kiểm tra khôi phục định kỳ. Xem [hướng dẫn backup Atlas](https://www.mongodb.com/docs/atlas/backup-restore-cluster/).
- Sau khi biết IP máy chủ chạy backend, giới hạn Atlas IP Access List tới IP đó và các IP quản trị cần thiết; xóa `0.0.0.0/0` nếu đã thêm khi thử nghiệm. Xem [hướng dẫn IP Access List](https://www.mongodb.com/docs/atlas/security/ip-access-list/).

## Tài khoản demo

Mật khẩu chung: **`Demo@123`**.

| Vai trò | Email | Dữ liệu ban đầu |
| --- | --- | --- |
| Quản trị viên | `admin@ktx.demo` | Quản lý danh mục, đơn giá, nhân viên, báo cáo |
| Nhân viên | `staff@ktx.demo` | Duyệt hồ sơ, vận hành phòng, thu phí |
| Sinh viên A | `an@ktx.demo` | Đang ở A101, có hóa đơn đã trả và trả một phần |
| Sinh viên B | `binh@ktx.demo` | Hồ sơ đang chờ duyệt |
| Sinh viên C | `chi@ktx.demo` | Đang ở B101, có yêu cầu gia hạn đang chờ |

Bộ mẫu gồm 2 tòa, 10 phòng, 3 sinh viên, 2 kỳ thu và các chỉ số/hóa đơn/thanh toán liên kết với nhau. Có thể đăng ký thêm sinh viên và tạo phòng mới ngay trên giao diện.

## Cấu trúc

```text
client/
  src/App.jsx             Trang, layout, form và luồng React Router
  src/api.js               Client API, định dạng tiền/ngày
  src/styles.css           Giao diện quản lý
  src/landing.css          Trang chủ và xác thực
  src/theme.css            Biến màu: điều hướng xanh đen, nội dung sáng
  src/RoomGallery.jsx      Thư viện ảnh khi xem loại phòng/phòng
  src/RoomTypeEditor.jsx   Quản lý ảnh trong form loại phòng
server/
  src/routes/apiRoutes.js  REST route và phân quyền
  src/controllers/         Nhận request, chuẩn hóa response/lỗi
  src/services/core.js     Quy tắc nghiệp vụ
  src/services/roomImages.js Lưu và quản lý ảnh loại phòng
  src/repositories/        JSON fallback, MongoDB repository, schema/index, kiểm tra dữ liệu
  scripts/seed.js          Seed dữ liệu mới; reset chỉ cho JSON thử nghiệm
  scripts/migrate-json-to-mongo.js  Migration JSON → MongoDB có giao dịch
  scripts/verify-mongo.js Kiểm tra MongoDB và nguồn migration
  scripts/smoke.js         Kiểm tra API trên database thử nghiệm riêng
  data/database.json       File phát sinh sau seed, không commit
  uploads/room-types/      File ảnh tải lên, không commit
scripts/ui-smoke.cjs       Kiểm tra giao diện bằng Edge/Playwright
```

Repository cung cấp `read(collections)` và `transaction(collections, fn)`. Service chỉ tải những collection cần dùng. MongoDB lưu từng entity thành document riêng, có schema validator và index; các thay đổi nhiều collection được commit cùng transaction. JSON provider chỉ dùng khi quay về bản cũ hoặc chạy thử một tiến trình.

## Chức năng hoạt động

Quản trị viên có thể mở **Wireframe** từ menu avatar trên header. Trang `/wireframe` là một canvas riêng gồm 13 khung màn hình hiện tại (trang công khai, đăng nhập, quản trị, phòng, hồ sơ, hóa đơn và thông báo) để chụp từng khung hoặc toàn trang bằng Figma Capture. Các khung là bản phác cấu trúc tĩnh; chúng không thay đổi dữ liệu hay quy trình nghiệp vụ.

| Vai trò | Chức năng |
| --- | --- |
| Sinh viên | Tự đăng ký/đăng nhập, sửa hồ sơ, tra cứu phòng, gửi nguyện vọng loại phòng, xem trạng thái xét duyệt và lý do từ chối, xem lưu trú/lịch sử chuyển phòng, xin gia hạn/trả phòng, xem hóa đơn, chi tiết chia tiền, lịch sử thanh toán và thông báo. |
| Nhân viên | Lọc và xem hồ sơ; đánh dấu kiểm tra/cần bổ sung, duyệt kèm bố trí phòng hoặc từ chối; xem sinh viên nội trú; duyệt gia hạn/trả phòng; chuyển phòng; cập nhật sức chứa vận hành/trạng thái; nhập điện nước; xem trước và phát hành hóa đơn; ghi nhận nhiều lần thanh toán, xem công nợ. |
| Quản trị viên | Các nghiệp vụ nhân viên, thêm/sửa tòa, loại phòng, phòng, kỳ thu, bảng đơn giá; tạo/sửa/khóa nhân viên và cấp vai trò; xem báo cáo theo kỳ/tòa. |

Mọi API riêng tư xác thực bằng JWT, kiểm tra vai trò ở backend. Sinh viên chỉ đọc được hồ sơ, lượt ở, yêu cầu, hóa đơn và thông báo thuộc tài khoản của mình. Password được hash bằng bcrypt. Danh sách trọng tâm có tìm kiếm, lọc và phân trang; dashboard/báo cáo đọc dữ liệu hiện có.

### Ảnh loại phòng

Đăng nhập bằng tài khoản quản trị viên, mở **Loại phòng** → **Chỉnh sửa** một loại phòng (hoặc **Thêm loại phòng**) → **Chọn ảnh**. Có thể chọn nhiều file PNG, JPG hoặc WebP cùng lúc, xem trước, nhập mô tả ngắn, đổi thứ tự và chọn ảnh đại diện trước khi bấm **Lưu loại phòng và ảnh**. Ảnh đã lưu có thể được đổi thứ tự, chọn lại ảnh đại diện hoặc xóa từng ảnh ngay trong form. Giới hạn 20 ảnh mỗi loại phòng, 5 MB mỗi ảnh.

Khách và mọi vai trò đăng nhập đều xem cùng thư viện khi mở loại phòng hoặc phòng ở trang **Tra cứu phòng**. Ảnh gắn với loại phòng nên các phòng cùng loại dùng chung ảnh; số chỗ còn và sức chứa riêng của phòng vẫn tính từ dữ liệu phòng/lưu trú. Ảnh gốc được lưu trong `server/uploads/room-types/`; metadata nằm trong document `roomTypes` của MongoDB hoặc file JSON khi dùng chế độ cũ. Sao lưu cả dữ liệu và thư mục ảnh.

API ảnh: `GET /api/roomTypes/:id/images` công khai; `POST /api/roomTypes/:id/images` nhận một file nhị phân với `Content-Type: image/png`, `image/jpeg` hoặc `image/webp` và `?description=` tùy chọn; `PATCH /api/roomTypes/:id/images/:imageId` sửa mô tả/chọn đại diện; `PUT /api/roomTypes/:id/images/order` nhận `{ "imageIds": ["..."] }`; `DELETE /api/roomTypes/:id/images/:imageId` xóa ảnh. Các thao tác ghi yêu cầu quyền admin. File được phục vụ qua `/api/uploads/room-types/:filename`.

Các API chính: `/api/auth/*`, `/api/catalog`, `/api/buildings`, `/api/roomTypes`, `/api/rooms`, `/api/applications`, `/api/stays`, `/api/requests`, `/api/transfers`, `/api/periods`, `/api/pricing`, `/api/readings`, `/api/billing/preview/:periodId`, `/api/billing/issue/:periodId`, `/api/invoices`, `/api/payments`, `/api/notifications`, `/api/report`. Response theo dạng `{ "success": true, "data": ... }`; lỗi theo dạng `{ "success": false, "error": "..." }`.

### Thông báo và việc cần xử lý

Khi sinh viên gửi nguyện vọng, bổ sung hồ sơ hoặc gửi yêu cầu lưu trú, mọi tài khoản nhân viên và quản trị viên đang hoạt động nhận thông báo có liên kết tới trang xử lý. Khi nhân viên xét duyệt, sinh viên nhận thông báo về kết quả. Thông báo hóa đơn, thanh toán và chuyển phòng cũng dẫn đến trang liên quan.

Chuông thông báo và chấm đỏ trên menu cập nhật tự động khi trang đang mở (khoảng 5 giây một lần). Các mục có chấm đỏ gồm hồ sơ chưa xử lý, yêu cầu chờ duyệt, phòng thiếu chỉ số điện/nước của kỳ hiện hành, hóa đơn sẵn sàng phát hành và hóa đơn còn dư nợ. API `GET /api/work-queue` chỉ cho nhân viên và quản trị viên dùng; các số đếm được tính từ dữ liệu hiện tại, không lưu riêng.

## Quy tắc nghiệp vụ đã chọn

- Sinh viên chọn **loại phòng**, **phòng nguyện vọng** và thời hạn 1, 3, 6 hoặc 12 tháng khi gửi hồ sơ. Nếu bấm gửi nguyện vọng từ một phòng cụ thể, form chọn sẵn phòng đó. Staff thấy phòng nguyện vọng nổi bật và được chọn sẵn khi còn phù hợp, nhưng vẫn có thể bố trí phòng khác cùng loại. Ngày kết thúc dự kiến được tính bằng cách cộng số tháng đã chọn vào ngày bắt đầu (ví dụ 01/10/2026 + 3 tháng = 01/01/2027); ngày cuối tháng được giới hạn theo tháng đích (31/01 + 1 tháng = 28/02 trong năm không nhuận). Hồ sơ cũ chưa có thời hạn vẫn cho staff nhập ngày kết thúc như trước. Duyệt hồ sơ và tạo lượt ở nằm trong cùng một giao dịch lưu trữ. Chỗ trống được tính từ lượt ở đang hoạt động, không lưu một con số dễ lệch riêng.
- Chỉ có một lượt ở đang hoạt động cho mỗi sinh viên. Duyệt trả phòng kết thúc lượt ở và giải phóng chỗ. Chuyển phòng kết thúc lượt cũ, tạo lượt mới và lưu lịch sử.
- Kỳ thu theo tháng `YYYY-MM`. Lúc lập hóa đơn, hệ thống chốt các sinh viên **đang ở phòng tại thời điểm phát hành**. Không chia tiền phòng theo ngày ở hoặc hồi tố khi chuyển phòng giữa kỳ. Mỗi sinh viên nhận một hóa đơn cho một kỳ.
- Tiền phòng tính theo loại phòng/đơn giá có hiệu lực từ ngày đầu kỳ. Tiền điện/nước của phòng = lượng tiêu thụ × đơn giá; chia đều theo số sinh viên trong phòng khi chốt. Phần dư 1 đồng phân cho các sinh viên đầu theo mã ID, nên tổng hóa đơn khớp đúng chi phí phòng.
- Chỉ số đầu của kỳ mới lấy từ chỉ số cuối của kỳ trước cùng phòng/loại. Kỳ đầu tiên cho phép nhập chỉ số đầu; nếu bỏ trống thì dùng 0. Phải có cả điện và nước cho mọi phòng đang có người trước khi phát hành; màn hình xem trước liệt kê phòng thiếu.
- Hóa đơn lưu snapshot phòng, đơn giá, chỉ số, số người chia và từng khoản. Đổi đơn giá hoặc số người sau đó không sửa hóa đơn cũ. Trạng thái quá hạn được tính từ hạn thanh toán và số dư; thanh toán được ghi bởi nhân viên và không vượt số dư.
- Thông báo được tạo khi hồ sơ/yêu cầu được xử lý, phát hành hóa đơn, thu tiền; thông báo sắp đến hạn/quá hạn được tạo khi mở danh sách thông báo và chỉ một lần cho mỗi hóa đơn/trạng thái.
- Ngừng sử dụng tòa/phòng đang có người bị chặn. Không xóa cứng các danh mục để giữ lịch sử. Không khóa/hạ quyền quản trị viên đang hoạt động duy nhất.

## Kiểm tra nhanh

Chỉ với backend đang chạy trên **database thử nghiệm riêng** đã seed hoặc đã migration:

```bash
node server/scripts/smoke.js
node scripts/ui-smoke.cjs
```

Smoke API tạo dữ liệu mới để kiểm tra ba vai trò, duyệt/từ chối, gia hạn/trả/chuyển phòng, chỉ số, hóa đơn, thanh toán, phân quyền, snapshot đơn giá và dữ liệu đọc lại qua API. UI smoke dùng Microsoft Edge nếu có.

## Giao diện, tài khoản nhân viên và liên hệ

- Trong trang quản lý, breadcrumb **Trang chủ → Trang quản lý** và logo sidebar cho phép về homepage mà vẫn giữ phiên đăng nhập. Homepage khi đã đăng nhập hiện avatar với menu **Trang quản lý**, **Chỉnh hồ sơ** và **Đăng xuất**, dùng cùng phiên đăng nhập và thao tác đăng xuất của giao diện quản lý.
- Màu dùng chung của homepage, đăng nhập/đăng ký và trang tra cứu phòng nằm ở `client/src/design-tokens.css`. Cỡ chữ nhỏ, nhãn, nút và nội dung cũng dùng các biến `--font-*` trong file này; trang quản lý giữ bộ màu hiện có. `client/src/public-pages.css` chứa bố cục và theme của các trang công khai/form đăng nhập và trang liên hệ.
- Khách mở `/rooms?type=t-4m` để xem phòng đã lọc theo loại, sử dụng cùng header và bảng màu ivory với homepage. Người đã đăng nhập dùng màu xanh của giao diện quản lý, có sidebar và menu tài khoản theo vai trò. Thư viện ảnh và thao tác gửi nguyện vọng/cập nhật phòng dùng API hiện có.
- Admin → **Nhân viên** → **Chỉnh sửa**: xem/sửa email, nhập mật khẩu mới và xác nhận. Mật khẩu tối thiểu 8 ký tự; bỏ trống giữ mật khẩu đang dùng. Backend kiểm tra quyền admin, email trùng và lưu hash bằng bcrypt trong giao dịch cập nhật tài khoản/nhân viên. Không trả hash ra API.
- Sinh viên → **Liên hệ** (`/contact`): xem người liên hệ, số điện thoại, văn phòng và giờ làm việc. Sửa thông tin tại `client/src/contactDetails.js` rồi build lại frontend. Email và địa chỉ đường chưa được cung cấp nên để trống; giao diện ghi rõ email chưa cập nhật. Không tự thêm lịch làm việc theo ngày khi chưa được xác nhận.

## Giới hạn hiện tại

Thanh toán được ghi nhận thủ công, chưa tích hợp cổng thanh toán/email. Ảnh chưa nằm trong object storage; cần volume bền vững cho production. Phí phòng chưa tính theo ngày ở; trường hợp chuyển phòng giữa kỳ dùng phòng tại thời điểm phát hành hóa đơn. Cơ chế đọc hiện vẫn tải toàn bộ các collection cần cho mỗi nghiệp vụ, phù hợp quy mô demo nhưng cần phân trang/truy vấn trực tiếp khi dữ liệu lớn.
