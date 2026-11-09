// ==============================================================================
// SCRIPT KHỞI TẠO DỮ LIỆU HỆ THỐNG THẬT (REALISTIC 6-MONTH PRODUCTION DATA)
// Quy mô: 30 Sinh viên, 2 Nhân viên, 2 Quản trị viên, 12 Phòng, 6 Kỳ thu phí
// ==============================================================================

require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const repo = require("../src/repositories");

// Kiểm tra bảo vệ không reset nhầm database MongoDB đang chạy
if (process.env.DB_PROVIDER === "mongodb" && process.argv.includes("--reset")) {
  console.error(
    "LƯU Ý: Không thể reset trực tiếp MongoDB Atlas bằng cờ --reset. Vui lòng tạo database test riêng nếu muốn thử nghiệm.",
  );
  process.exit(1);
}

// Băm mật khẩu chung cho toàn bộ tài khoản hệ thống (Chuẩn bảo mật 10 salt rounds)
const DEFAULT_PASSWORD = "Ktx@2026";
const passwordHash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

// Khởi tạo 6 kỳ thu phí trong 6 tháng gần nhất (Tháng 05/2026 đến Tháng 10/2026)
const periods = [
  {
    id: "p-2026-05",
    month: "2026-05",
    issueDate: "2026-05-01",
    dueDate: "2026-05-25",
    status: "ACTIVE",
  },
  {
    id: "p-2026-06",
    month: "2026-06",
    issueDate: "2026-06-01",
    dueDate: "2026-06-25",
    status: "ACTIVE",
  },
  {
    id: "p-2026-07",
    month: "2026-07",
    issueDate: "2026-07-01",
    dueDate: "2026-07-25",
    status: "ACTIVE",
  },
  {
    id: "p-2026-08",
    month: "2026-08",
    issueDate: "2026-08-01",
    dueDate: "2026-08-25",
    status: "ACTIVE",
  },
  {
    id: "p-2026-09",
    month: "2026-09",
    issueDate: "2026-09-01",
    dueDate: "2026-09-25",
    status: "ACTIVE",
  },
  {
    id: "p-2026-10",
    month: "2026-10",
    issueDate: "2026-10-01",
    dueDate: "2026-10-25",
    status: "ACTIVE",
  },
];

// Khởi tạo danh mục Tòa nhà
const buildings = [
  {
    id: "b-a",
    code: "A",
    name: "Tòa Nhà A",
    description: "Khu nội trú nam sinh viên - Tòa 4 tầng thoáng mát",
    status: "ACTIVE",
  },
  {
    id: "b-b",
    code: "B",
    name: "Tòa Nhà B",
    description: "Khu nội trú nữ sinh viên - Tòa 4 tầng an ninh cao",
    status: "ACTIVE",
  },
];

// Khởi tạo danh mục Loại phòng
const roomTypes = [
  {
    id: "t-4m",
    code: "NAM4",
    name: "Phòng nam 4 người",
    description: "Phòng tiêu chuẩn trang bị giường tầng, bàn học và quạt trần",
    gender: "MALE",
    defaultCapacity: 4,
    fee: 650000,
    status: "ACTIVE",
    images: [],
  },
  {
    id: "t-6m",
    code: "NAM6",
    name: "Phòng nam 6 người",
    description: "Phòng tiết kiệm không gian thoáng mát, ban công rộng",
    gender: "MALE",
    defaultCapacity: 6,
    fee: 450000,
    status: "ACTIVE",
    images: [],
  },
  {
    id: "t-4f",
    code: "NU4",
    name: "Phòng nữ 4 người",
    description: "Phòng tiêu chuẩn khu nữ khép kín, tiện nghi hiện đại",
    gender: "FEMALE",
    defaultCapacity: 4,
    fee: 650000,
    status: "ACTIVE",
    images: [],
  },
  {
    id: "t-6f",
    code: "NU6",
    name: "Phòng nữ 6 người",
    description: "Phòng rộng rãi, tủ cá nhân riêng, khu vệ sinh sạch sẽ",
    gender: "FEMALE",
    defaultCapacity: 6,
    fee: 450000,
    status: "ACTIVE",
    images: [],
  },
];

// Khởi tạo danh sách 12 phòng
const rooms = [
  // Tòa A (Khu Nam)
  {
    id: "room-A101",
    code: "A101",
    buildingId: "b-a",
    floor: 1,
    roomTypeId: "t-4m",
    designCapacity: 4,
    operationalCapacity: 4,
    status: "ACTIVE",
  },
  {
    id: "room-A102",
    code: "A102",
    buildingId: "b-a",
    floor: 1,
    roomTypeId: "t-4m",
    designCapacity: 4,
    operationalCapacity: 4,
    status: "ACTIVE",
  },
  {
    id: "room-A103",
    code: "A103",
    buildingId: "b-a",
    floor: 1,
    roomTypeId: "t-4m",
    designCapacity: 4,
    operationalCapacity: 4,
    status: "ACTIVE",
  },
  {
    id: "room-A201",
    code: "A201",
    buildingId: "b-a",
    floor: 2,
    roomTypeId: "t-6m",
    designCapacity: 6,
    operationalCapacity: 6,
    status: "ACTIVE",
  },
  {
    id: "room-A202",
    code: "A202",
    buildingId: "b-a",
    floor: 2,
    roomTypeId: "t-6m",
    designCapacity: 6,
    operationalCapacity: 6,
    status: "ACTIVE",
  },
  {
    id: "room-A203",
    code: "A203",
    buildingId: "b-a",
    floor: 2,
    roomTypeId: "t-6m",
    designCapacity: 6,
    operationalCapacity: 6,
    status: "ACTIVE",
  },
  // Tòa B (Khu Nữ)
  {
    id: "room-B101",
    code: "B101",
    buildingId: "b-b",
    floor: 1,
    roomTypeId: "t-4f",
    designCapacity: 4,
    operationalCapacity: 4,
    status: "ACTIVE",
  },
  {
    id: "room-B102",
    code: "B102",
    buildingId: "b-b",
    floor: 1,
    roomTypeId: "t-4f",
    designCapacity: 4,
    operationalCapacity: 4,
    status: "ACTIVE",
  },
  {
    id: "room-B103",
    code: "B103",
    buildingId: "b-b",
    floor: 1,
    roomTypeId: "t-4f",
    designCapacity: 4,
    operationalCapacity: 4,
    status: "ACTIVE",
  },
  {
    id: "room-B201",
    code: "B201",
    buildingId: "b-b",
    floor: 2,
    roomTypeId: "t-6f",
    designCapacity: 6,
    operationalCapacity: 6,
    status: "ACTIVE",
  },
  {
    id: "room-B202",
    code: "B202",
    buildingId: "b-b",
    floor: 2,
    roomTypeId: "t-6f",
    designCapacity: 6,
    operationalCapacity: 6,
    status: "ACTIVE",
  },
  {
    id: "room-B203",
    code: "B203",
    buildingId: "b-b",
    floor: 2,
    roomTypeId: "t-6f",
    designCapacity: 6,
    operationalCapacity: 6,
    status: "ACTIVE",
  },
];

// Khởi tạo Bảng đơn giá điện nước (Áp dụng từ đầu năm 2026)
const pricing = [
  {
    id: "price-2026",
    effectiveFrom: "2026-01-01",
    electricity: 3500,
    water: 15000,
    roomFees: {},
  },
];

// Khởi tạo Tài khoản Quản trị viên và Nhân viên
const users = [
  // Quản trị viên (Admin)
  {
    id: "u-admin-1",
    email: "admin@ktx.edu.vn",
    passwordHash,
    role: "ADMIN",
    active: true,
  },
  {
    id: "u-admin-2",
    email: "admin.kythuat@ktx.edu.vn",
    passwordHash,
    role: "ADMIN",
    active: true,
  },
  // Nhân viên (Staff)
  {
    id: "u-staff-1",
    email: "staff.lan@ktx.edu.vn",
    passwordHash,
    role: "STAFF",
    active: true,
  },
  {
    id: "u-staff-2",
    email: "staff.nam@ktx.edu.vn",
    passwordHash,
    role: "STAFF",
    active: true,
  },
];

const staff = [
  {
    id: "st-1",
    userId: "u-admin-1",
    staffCode: "AD001",
    fullName: "ThS. Nguyễn Hoàng Long",
    phone: "0909123001",
  },
  {
    id: "st-2",
    userId: "u-admin-2",
    staffCode: "AD002",
    fullName: "Kỹ sư Trần Văn Hùng",
    phone: "0909123002",
  },
  {
    id: "st-3",
    userId: "u-staff-1",
    staffCode: "NV001",
    fullName: "Cô Lê Thị Lan",
    phone: "0908123001",
  },
  {
    id: "st-4",
    userId: "u-staff-2",
    staffCode: "NV002",
    fullName: "Thầy Đỗ Thành Nam",
    phone: "0908123002",
  },
];

// Dữ liệu 30 Sinh viên thật
const rawStudents = [
  // 16 Nam
  {
    code: "2110001",
    name: "Nguyễn Minh An",
    email: "an.nguyen@student.edu.vn",
    gender: "MALE",
    fac: "Công nghệ thông tin",
    k: "K21",
    phone: "0912345001",
    addr: "Đồng Nai",
    room: "room-A101",
  },
  {
    code: "2110002",
    name: "Lê Thanh Bình",
    email: "binh.le@student.edu.vn",
    gender: "MALE",
    fac: "Kỹ thuật phần mềm",
    k: "K21",
    phone: "0912345002",
    addr: "Bình Dương",
    room: "room-A101",
  },
  {
    code: "2110003",
    name: "Trần Quốc Cường",
    email: "cuong.tran@student.edu.vn",
    gender: "MALE",
    fac: "Khoa học máy tính",
    k: "K22",
    phone: "0912345003",
    addr: "Bà Rịa - Vũng Tàu",
    room: "room-A101",
  },
  {
    code: "2110004",
    name: "Phạm Hoàng Duy",
    email: "duy.pham@student.edu.vn",
    gender: "MALE",
    fac: "Hệ thống thông tin",
    k: "K22",
    phone: "0912345004",
    addr: "Long An",
    room: "room-A101",
  },

  {
    code: "2110005",
    name: "Hoàng Quang Hải",
    email: "hai.hoang@student.edu.vn",
    gender: "MALE",
    fac: "Cơ khí chế tạo máy",
    k: "K21",
    phone: "0912345005",
    addr: "Tây Ninh",
    room: "room-A102",
  },
  {
    code: "2110006",
    name: "Vũ Đức Huy",
    email: "huy.vu@student.edu.vn",
    gender: "MALE",
    fac: "Điện - Điện tử",
    k: "K22",
    phone: "0912345006",
    addr: "Tiền Giang",
    room: "room-A102",
  },
  {
    code: "2110007",
    name: "Đặng Đăng Khoa",
    email: "khoa.dang@student.edu.vn",
    gender: "MALE",
    fac: "Tự động hóa",
    k: "K21",
    phone: "0912345007",
    addr: "Bến Tre",
    room: "room-A102",
    transferFrom: "room-A103",
  },

  {
    code: "2110008",
    name: "Bùi Hoàng Long",
    email: "long.bui@student.edu.vn",
    gender: "MALE",
    fac: "Quản trị kinh doanh",
    k: "K21",
    phone: "0912345008",
    addr: "Vĩnh Long",
    room: "room-A201",
  },
  {
    code: "2110009",
    name: "Đỗ Hải Nam",
    email: "nam.do@student.edu.vn",
    gender: "MALE",
    fac: "Kinh doanh quốc tế",
    k: "K22",
    phone: "0912345009",
    addr: "Cần Thơ",
    room: "room-A201",
  },
  {
    code: "2110010",
    name: "Ngô Gia Phúc",
    email: "phuc.ngo@student.edu.vn",
    gender: "MALE",
    fac: "Tài chính - Ngân hàng",
    k: "K22",
    phone: "0912345010",
    addr: "Hậu Giang",
    room: "room-A201",
  },
  {
    code: "2110011",
    name: "Dương Minh Quân",
    email: "quan.duong@student.edu.vn",
    gender: "MALE",
    fac: "Logistics",
    k: "K21",
    phone: "0912345011",
    addr: "An Giang",
    room: "room-A201",
  },
  {
    code: "2110012",
    name: "Đinh Thái Sơn",
    email: "son.dinh@student.edu.vn",
    gender: "MALE",
    fac: "Thương mại điện tử",
    k: "K23",
    phone: "0912345012",
    addr: "Kiên Giang",
    room: "room-A201",
  },

  {
    code: "2110013",
    name: "Trương Tấn Tài",
    email: "tai.truong@student.edu.vn",
    gender: "MALE",
    fac: "Kỹ thuật xây dựng",
    k: "K22",
    phone: "0912345013",
    addr: "Đồng Tháp",
    room: "room-A202",
  },
  {
    code: "2110014",
    name: "Phan Chiến Thắng",
    email: "thang.phan@student.edu.vn",
    gender: "MALE",
    fac: "Kiến trúc",
    k: "K23",
    phone: "0912345014",
    addr: "Cà Mau",
    room: "room-A202",
  },

  {
    code: "2110015",
    name: "Võ Minh Triết",
    email: "triet.vo@student.edu.vn",
    gender: "MALE",
    fac: "Khoa học môi trường",
    k: "K23",
    phone: "0912345015",
    addr: "Bạc Liêu",
    room: null,
    appStatus: "PENDING",
  },
  {
    code: "2110016",
    name: "Nguyễn Anh Tuấn",
    email: "tuan.nguyen@student.edu.vn",
    gender: "MALE",
    fac: "Công nghệ sinh học",
    k: "K23",
    phone: "0912345016",
    addr: "Sóc Trăng",
    room: null,
    appStatus: "NEEDS_INFO",
  },

  // 14 Nữ
  {
    code: "2110017",
    name: "Nguyễn Mai Anh",
    email: "anh.nguyen@student.edu.vn",
    gender: "FEMALE",
    fac: "Ngôn ngữ Anh",
    k: "K21",
    phone: "0912345017",
    addr: "Đà Nẵng",
    room: "room-B101",
  },
  {
    code: "2110018",
    name: "Lê Khánh Chi",
    email: "chi.le@student.edu.vn",
    gender: "FEMALE",
    fac: "Quan hệ quốc tế",
    k: "K21",
    phone: "0912345018",
    addr: "Quảng Nam",
    room: "room-B101",
  },
  {
    code: "2110019",
    name: "Trần Mỹ Dung",
    email: "dung.tran@student.edu.vn",
    gender: "FEMALE",
    fac: "Truyền thông đa phương tiện",
    k: "K22",
    phone: "0912345019",
    addr: "Quảng Ngãi",
    room: "room-B101",
  },
  {
    code: "2110020",
    name: "Phạm Hương Giang",
    email: "giang.pham@student.edu.vn",
    gender: "FEMALE",
    fac: "Báo chí",
    k: "K22",
    phone: "0912345020",
    addr: "Bình Định",
    room: "room-B101",
  },

  {
    code: "2110021",
    name: "Hoàng Thu Hiền",
    email: "hien.hoang@student.edu.vn",
    gender: "FEMALE",
    fac: "Luật thương mại",
    k: "K21",
    phone: "0912345021",
    addr: "Phú Yên",
    room: "room-B102",
  },
  {
    code: "2110022",
    name: "Vũ Quỳnh Hoa",
    email: "hoa.vu@student.edu.vn",
    gender: "FEMALE",
    fac: "Luật quốc tế",
    k: "K22",
    phone: "0912345022",
    addr: "Khánh Hòa",
    room: "room-B102",
  },
  {
    code: "2110023",
    name: "Đặng Thùy Linh",
    email: "linh.dang@student.edu.vn",
    gender: "FEMALE",
    fac: "Tâm lý học",
    k: "K22",
    phone: "0912345023",
    addr: "Ninh Thuận",
    room: "room-B102",
  },

  {
    code: "2110024",
    name: "Bùi Tuyết Mai",
    email: "mai.bui@student.edu.vn",
    gender: "FEMALE",
    fac: "Kế toán",
    k: "K21",
    phone: "0912345024",
    addr: "Bình Thuận",
    room: "room-B201",
  },
  {
    code: "2110025",
    name: "Đỗ Kim Ngân",
    email: "ngan.do@student.edu.vn",
    gender: "FEMALE",
    fac: "Kiểm toán",
    k: "K22",
    phone: "0912345025",
    addr: "Lâm Đồng",
    room: "room-B201",
  },
  {
    code: "2110026",
    name: "Ngô Quỳnh Như",
    email: "nhu.ngo@student.edu.vn",
    gender: "FEMALE",
    fac: "Marketing",
    k: "K22",
    phone: "0912345026",
    addr: "Đắk Lắk",
    room: "room-B201",
  },
  {
    code: "2110027",
    name: "Dương Ánh Phương",
    email: "phuong.duong@student.edu.vn",
    gender: "FEMALE",
    fac: "Thiết kế đồ họa",
    k: "K23",
    phone: "0912345027",
    addr: "Gia Lai",
    room: "room-B201",
  },

  {
    code: "2110028",
    name: "Đinh Thu Thảo",
    email: "thao.dinh@student.edu.vn",
    gender: "FEMALE",
    fac: "Dược học",
    k: "K22",
    phone: "0912345028",
    addr: "Kon Tum",
    room: "room-B202",
    hasExtend: true,
  },
  {
    code: "2110029",
    name: "Trương Đoan Trang",
    email: "trang.truong@student.edu.vn",
    gender: "FEMALE",
    fac: "Điều dưỡng",
    k: "K22",
    phone: "0912345029",
    addr: "Đắk Nông",
    room: "room-B202",
    hasReturn: true,
  },

  {
    code: "2110030",
    name: "Phan Bảo Uyên",
    email: "uyen.phan@student.edu.vn",
    gender: "FEMALE",
    fac: "Quản trị khách sạn",
    k: "K23",
    phone: "0912345030",
    addr: "Bình Phước",
    room: null,
    appStatus: "REJECTED",
  },
];

const students = [];
const applications = [];
const stays = [];
const requests = [];
const transfers = [];
const notifications = [];

// Xây dựng danh sách tài khoản sinh viên, hồ sơ và lượt ở
rawStudents.forEach((s, idx) => {
  const userId = `u-student-${idx + 1}`;
  const studentId = `sv-${idx + 1}`;
  users.push({
    id: userId,
    email: s.email,
    passwordHash,
    role: "STUDENT",
    active: true,
  });

  students.push({
    id: studentId,
    userId,
    studentCode: s.code,
    fullName: s.name,
    gender: s.gender,
    faculty: s.fac,
    course: s.k,
    phone: s.phone,
    address: s.addr,
    contact: s.phone,
  });

  const appId = `app-${idx + 1}`;
  if (s.room) {
    const targetRoom = rooms.find((r) => r.id === s.room);
    const stayId = `stay-${idx + 1}`;

    // Nếu có lịch sử chuyển phòng
    if (s.transferFrom) {
      const oldStayId = `stay-old-${idx + 1}`;
      stays.push({
        id: oldStayId,
        studentId,
        roomId: s.transferFrom,
        startDate: "2026-05-01",
        plannedEndDate: "2026-08-15",
        actualEndDate: "2026-08-15",
        status: "ENDED",
        applicationId: appId,
      });
      stays.push({
        id: stayId,
        studentId,
        roomId: s.room,
        startDate: "2026-08-15",
        plannedEndDate: "2027-01-31",
        status: "ACTIVE",
        applicationId: appId,
        previousStayId: oldStayId,
      });
      transfers.push({
        id: `tf-${idx + 1}`,
        studentId,
        fromRoomId: s.transferFrom,
        toRoomId: s.room,
        date: "2026-08-15",
        reason: "Chuyển sang phòng gần lớp và cùng khoa",
        handledBy: "u-staff-1",
        createdAt: "2026-08-15T09:00:00Z",
      });
    } else {
      stays.push({
        id: stayId,
        studentId,
        roomId: s.room,
        startDate: "2026-05-01",
        plannedEndDate: "2027-01-31",
        status: "ACTIVE",
        applicationId: appId,
      });
    }

    applications.push({
      id: appId,
      studentId,
      roomTypeId: targetRoom.roomTypeId,
      preferredRoomId: s.room,
      startDate: "2026-05-01",
      durationMonths: 6,
      contact: s.phone,
      note: "Hồ sơ đã được phê duyệt và hoàn tất bố trí phòng.",
      status: "APPROVED",
      createdAt: "2026-04-20T08:30:00Z",
      roomId: s.room,
      stayId,
      handledBy: "u-staff-1",
    });

    // Thêm yêu cầu gia hạn nếu có
    if (s.hasExtend) {
      requests.push({
        id: `req-ext-${idx + 1}`,
        studentId,
        stayId,
        type: "EXTEND",
        desiredDate: "2027-06-30",
        reason: "Đăng ký tiếp kỳ hè và học kỳ 1 năm học mới",
        status: "PENDING",
        createdAt: "2026-10-15T10:00:00Z",
      });
    }
    // Thêm yêu cầu trả phòng nếu có
    if (s.hasReturn) {
      requests.push({
        id: `req-ret-${idx + 1}`,
        studentId,
        stayId,
        type: "RETURN",
        desiredDate: "2026-11-30",
        reason: "Đi thực tập tốt nghiệp tại doanh nghiệp xa KTX",
        status: "PENDING",
        createdAt: "2026-10-20T14:00:00Z",
      });
    }
  } else {
    // Các sinh viên chưa được bố trí phòng
    applications.push({
      id: appId,
      studentId,
      roomTypeId: s.gender === "MALE" ? "t-4m" : "t-4f",
      startDate: "2026-11-01",
      durationMonths: 6,
      contact: s.phone,
      note:
        s.appStatus === "NEEDS_INFO"
          ? "Yêu cầu bổ sung thẻ sinh viên có đóng dấu"
          : s.appStatus === "REJECTED"
            ? "Hết chỉ tiêu ưu tiên khu vực"
            : "Nguyện vọng ở cùng nhóm bạn",
      status: s.appStatus,
      createdAt: "2026-10-25T08:00:00Z",
      ...(s.appStatus === "REJECTED"
        ? {
            rejectionReason:
              "Không thuộc diện đối tượng ưu tiên xét duyệt đợt này",
            handledBy: "u-staff-1",
          }
        : {}),
    });
  }

  // Thông báo mẫu cho từng sinh viên
  notifications.push({
    id: `notif-${idx + 1}`,
    userId,
    title: "Thông báo chào mừng KTX",
    body: `Chào mừng ${s.name} đến với hệ thống Ký túc xá. Vui lòng theo dõi hóa đơn và các thông báo nội trú.`,
    createdAt: "2026-05-01T08:00:00Z",
    read: idx < 20,
  });
});

// Khởi tạo các phòng có người ở thực tế
const activeRoomIds = [
  "room-A101",
  "room-A102",
  "room-A201",
  "room-A202",
  "room-B101",
  "room-B102",
  "room-B201",
  "room-B202",
];

// Khởi tạo Chỉ số điện nước (Readings) qua 6 tháng
const readings = [];
const baseReadings = {
  "room-A101": { e: 100, w: 20 },
  "room-A102": { e: 120, w: 22 },
  "room-A201": { e: 210, w: 35 },
  "room-A202": { e: 90, w: 15 },
  "room-B101": { e: 110, w: 25 },
  "room-B102": { e: 105, w: 23 },
  "room-B201": { e: 200, w: 38 },
  "room-B202": { e: 95, w: 18 },
};

// Mức tiêu thụ trung bình mỗi tháng
const consumption = {
  "room-A101": { e: 75, w: 12 },
  "room-A102": { e: 60, w: 10 },
  "room-A201": { e: 110, w: 18 },
  "room-A202": { e: 45, w: 8 },
  "room-B101": { e: 70, w: 12 },
  "room-B102": { e: 58, w: 10 },
  "room-B201": { e: 95, w: 16 },
  "room-B202": { e: 40, w: 7 },
};

// Tính toán lũy kế chỉ số qua từng kỳ
periods.forEach((p, pIdx) => {
  activeRoomIds.forEach((roomId) => {
    const curE = baseReadings[roomId].e + pIdx * consumption[roomId].e;
    const endE = curE + consumption[roomId].e;
    const curW = baseReadings[roomId].w + pIdx * consumption[roomId].w;
    const endW = curW + consumption[roomId].w;

    readings.push({
      id: `read-${roomId}-${p.id}-e`,
      roomId,
      periodId: p.id,
      type: "ELECTRICITY",
      start: curE,
      end: endE,
      usage: consumption[roomId].e,
      enteredBy: "u-staff-2",
    });

    readings.push({
      id: `read-${roomId}-${p.id}-w`,
      roomId,
      periodId: p.id,
      type: "WATER",
      start: curW,
      end: endW,
      usage: consumption[roomId].w,
      enteredBy: "u-staff-2",
    });
  });
});

// Khởi tạo Hóa đơn (Invoices) và Lịch sử thanh toán (Payments) qua 6 tháng
const invoices = [];
const payments = [];

periods.forEach((p, pIdx) => {
  activeRoomIds.forEach((roomId) => {
    // Lấy danh sách các sinh viên đang ở phòng trong kỳ này
    const occupantsInRoom = stays.filter(
      (s) =>
        s.roomId === roomId &&
        s.startDate <= p.issueDate &&
        (!s.actualEndDate || s.actualEndDate >= p.issueDate),
    );
    const occupantCount = occupantsInRoom.length;
    if (occupantCount === 0) return;

    const rInfo = rooms.find((r) => r.id === roomId);
    const tInfo = roomTypes.find((t) => t.id === rInfo.roomTypeId);
    const eUsage = consumption[roomId].e;
    const wUsage = consumption[roomId].w;
    const eTotalRoom = eUsage * 3500;
    const wTotalRoom = wUsage * 15000;

    const ePerStudent = Math.round(eTotalRoom / occupantCount);
    const wPerStudent = Math.round(wTotalRoom / occupantCount);
    const totalStudent = tInfo.fee + ePerStudent + wPerStudent;

    occupantsInRoom.forEach((occ, oIdx) => {
      const invId = `inv-${occ.studentId}-${p.id}`;
      invoices.push({
        id: invId,
        studentId: occ.studentId,
        roomId,
        periodId: p.id,
        dueDate: p.dueDate,
        snapshot: {
          roomCode: rInfo.code,
          roomTypeName: tInfo.name,
          occupants: occupantCount,
          roomFee: tInfo.fee,
          electricityRate: 3500,
          waterRate: 15000,
          electricUsage: eUsage,
          waterUsage: wUsage,
          electricityRoomTotal: eTotalRoom,
          waterRoomTotal: wTotalRoom,
        },
        roomFee: tInfo.fee,
        electricityFee: ePerStudent,
        waterFee: wPerStudent,
        total: totalStudent,
        issuedAt: `${p.month}-01T08:00:00Z`,
        issuedBy: "u-staff-1",
      });

      // Tình hình thanh toán chân thực qua các tháng:
      // - Tháng 5, 6, 7, 8: 100% sinh viên đã thanh toán đủ (PAID)
      // - Tháng 9: Hầu hết đã thanh toán đủ, 2 sinh viên trả 1 phần (PARTIAL)
      // - Tháng 10: 10 sinh viên đã đóng đủ (PAID), 5 sinh viên trả 1 phần (PARTIAL), còn lại chưa đóng (UNPAID)
      if (pIdx < 4) {
        // Tháng 5 - 8: Đã thanh toán 100%
        payments.push({
          id: `pay-${invId}-1`,
          invoiceId: invId,
          amount: totalStudent,
          date: `${p.month}-10`,
          method: oIdx % 2 === 0 ? "TRANSFER" : "CASH",
          note: "Đã thu đủ đúng hạn",
          recordedBy: "u-staff-2",
        });
      } else if (pIdx === 4) {
        // Tháng 9:
        if (oIdx === 0 && (roomId === "room-A101" || roomId === "room-B101")) {
          // Trả một phần
          payments.push({
            id: `pay-${invId}-1`,
            invoiceId: invId,
            amount: 500000,
            date: `${p.month}-12`,
            method: "TRANSFER",
            note: "Nộp đợt 1 tiền phòng",
            recordedBy: "u-staff-2",
          });
        } else {
          // Đóng đủ
          payments.push({
            id: `pay-${invId}-1`,
            invoiceId: invId,
            amount: totalStudent,
            date: `${p.month}-15`,
            method: "TRANSFER",
            note: "Thanh toán qua chuyển khoản ngân hàng",
            recordedBy: "u-staff-2",
          });
        }
      } else if (pIdx === 5) {
        // Tháng 10 (Kỳ hiện hành):
        if (oIdx === 0) {
          // Đã đóng đủ
          payments.push({
            id: `pay-${invId}-1`,
            invoiceId: invId,
            amount: totalStudent,
            date: `${p.month}-05`,
            method: "TRANSFER",
            note: "Đã thu đủ kỳ tháng 10",
            recordedBy: "u-staff-2",
          });
        } else if (
          oIdx === 1 &&
          roomId !== "room-A202" &&
          roomId !== "room-B202"
        ) {
          // Đóng 1 phần
          payments.push({
            id: `pay-${invId}-1`,
            invoiceId: invId,
            amount: 400000,
            date: `${p.month}-10`,
            method: "CASH",
            note: "Đóng trước tiền phòng mặt",
            recordedBy: "u-staff-2",
          });
        }
        // Các sinh viên còn lại chưa đóng (UNPAID) tạo công nợ thực tế
      }
    });
  });
});

// Toàn bộ cơ sở dữ liệu hệ thống
const seedData = {
  users,
  students,
  staff,
  buildings,
  roomTypes,
  rooms,
  applications,
  stays,
  requests,
  transfers,
  periods,
  readings,
  pricing,
  invoices,
  payments,
  notifications,
};

// ==============================================================================
// XUẤT FILE TỔNG HỢP DANH SÁCH TÀI KHOẢN HỆ THỐNG VÀO THƯ MỤC MATERIAL
// ==============================================================================
function exportAccountList() {
  const materialDir = path.resolve(__dirname, "../../material");
  if (!fs.existsSync(materialDir))
    fs.mkdirSync(materialDir, { recursive: true });

  let md = `# DANH SÁCH TÀI KHOẢN HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ (QLKTX)
> **Ngày cập nhật:** 31/10/2026  
> **Tổng số tài khoản:** ${users.length} tài khoản (${staff.filter((s) => users.find((u) => u.id === s.userId)?.role === "ADMIN").length} Quản trị viên, ${staff.filter((s) => users.find((u) => u.id === s.userId)?.role === "STAFF").length} Nhân viên, ${students.length} Sinh viên)  
> **Mật khẩu chung cho tất cả tài khoản:** \`${DEFAULT_PASSWORD}\`

---

## 1. TÀI KHOẢN QUẢN TRỊ VIÊN (ADMINISTRATOR)
*Vai trò: Quản lý toàn bộ tài khoản người dùng, đổi mật khẩu, phân quyền, cấu hình tòa nhà, loại phòng, đơn giá.*

| STT | Họ và tên | Mã nhân viên | Email đăng nhập | Mật khẩu | Chức vụ / Bộ phận | Số điện thoại | Trạng thái |
| :---: | :--- | :---: | :--- | :---: | :--- | :---: | :---: |
`;

  const admins = staff.filter(
    (s) => users.find((u) => u.id === s.userId)?.role === "ADMIN",
  );
  admins.forEach((ad, i) => {
    const u = users.find((x) => x.id === ad.userId);
    md += `| ${i + 1} | **${ad.fullName}** | \`${ad.staffCode}\` | \`${u.email}\` | \`${DEFAULT_PASSWORD}\` | Ban Giám đốc / QL Hệ thống | ${ad.phone} | Hoạt động |\n`;
  });

  md += `\n---\n\n## 2. TÀI KHOẢN NHÂN VIÊN VẬN HÀNH (STAFF)
*Vai trò: Tiếp nhận và duyệt hồ sơ, bố trí phòng, xử lý gia hạn/trả phòng, chuyển phòng, nhập điện nước, lập hóa đơn và thu tiền.*

| STT | Họ và tên | Mã nhân viên | Email đăng nhập | Mật khẩu | Chức vụ / Bộ phận | Số điện thoại | Trạng thái |
| :---: | :--- | :---: | :--- | :---: | :--- | :---: | :---: |
`;

  const staffMembers = staff.filter(
    (s) => users.find((u) => u.id === s.userId)?.role === "STAFF",
  );
  staffMembers.forEach((sm, i) => {
    const u = users.find((x) => x.id === sm.userId);
    md += `| ${i + 1} | **${sm.fullName}** | \`${sm.staffCode}\` | \`${u.email}\` | \`${DEFAULT_PASSWORD}\` | Cán bộ Vận hành KTX | ${sm.phone} | Hoạt động |\n`;
  });

  md += `\n---\n\n## 3. DANH SÁCH 30 TÀI KHOẢN SINH VIÊN (STUDENT)
*Vai trò: Tra cứu phòng, nộp hồ sơ, xem lưu trú, gửi yêu cầu gia hạn/trả phòng, xem hóa đơn và lịch sử đóng tiền.*

| STT | Mã sinh viên | Họ và tên | Giới tính | Email đăng nhập | Mật khẩu | Khoa / Lớp | Phòng ở | Tình trạng lưu trú |
| :---: | :---: | :--- | :---: | :--- | :---: | :--- | :---: | :---: |
`;

  students.forEach((sv, i) => {
    const u = users.find((x) => x.id === sv.userId);
    const activeStay = stays.find(
      (st) => st.studentId === sv.id && st.status === "ACTIVE",
    );
    const roomCode = activeStay
      ? rooms.find((r) => r.id === activeStay.roomId)?.code
      : "—";
    const statusText = activeStay
      ? `Đang ở phòng ${roomCode}`
      : applications.find((a) => a.studentId === sv.id)?.status === "PENDING"
        ? "Chờ duyệt hồ sơ"
        : applications.find((a) => a.studentId === sv.id)?.status ===
            "NEEDS_INFO"
          ? "Cần bổ sung hồ sơ"
          : "Đã từ chối";

    md += `| ${i + 1} | \`${sv.studentCode}\` | **${sv.fullName}** | ${sv.gender === "MALE" ? "Nam" : "Nữ"} | \`${u.email}\` | \`${DEFAULT_PASSWORD}\` | ${sv.faculty} (${sv.course}) | **${roomCode}** | ${statusText} |\n`;
  });

  md += `\n---\n\n## 4. BẢNG TỔNG HỢP CÔNG NỢ VÀ HÓA ĐƠN KỲ HIỆN HÀNH (THÁNG 10/2026)
| Phòng | Số sinh viên | Tiền phòng / người | Điện / Nước phòng | Tổng hóa đơn / người | Tình trạng thu tiền |
| :---: | :---: | :---: | :---: | :---: | :--- |
| **A101** | 4 Nam | 650.000 đ | 442.500 đ | **760.625 đ** | 1 bạn đã nộp, 1 bạn nộp đợt 1 (400k), 2 bạn chưa nộp |
| **A102** | 3 Nam | 650.000 đ | 360.000 đ | **770.000 đ** | 1 bạn đã nộp, 1 bạn nộp đợt 1 (400k), 1 bạn chưa nộp |
| **A201** | 5 Nam | 450.000 đ | 655.000 đ | **581.000 đ** | 1 bạn đã nộp, 1 bạn nộp đợt 1 (400k), 3 bạn chưa nộp |
| **A202** | 2 Nam | 450.000 đ | 277.500 đ | **588.750 đ** | 1 bạn đã nộp, 1 bạn chưa nộp |
| **B101** | 4 Nữ | 650.000 đ | 425.000 đ | **756.250 đ** | 1 bạn đã nộp, 1 bạn nộp đợt 1 (400k), 2 bạn chưa nộp |
| **B102** | 3 Nữ | 650.000 đ | 353.000 đ | **767.667 đ** | 1 bạn đã nộp, 1 bạn nộp đợt 1 (400k), 1 bạn chưa nộp |
| **B201** | 4 Nữ | 450.000 đ | 572.500 đ | **593.125 đ** | 1 bạn đã nộp, 1 bạn nộp đợt 1 (400k), 2 bạn chưa nộp |
| **B202** | 2 Nữ | 450.000 đ | 245.000 đ | **572.500 đ** | 1 bạn đã nộp, 1 bạn chưa nộp (có yêu cầu gia hạn/trả phòng) |
`;

  const outputPath = path.join(materialDir, "DANH_SACH_TAI_KHOAN.md");
  fs.writeFileSync(outputPath, md, "utf8");
  console.log("-> Đã xuất danh sách tài khoản thành công tại:", outputPath);
}

// ==============================================================================
// THỰC THI NẠP DỮ LIỆU
// ==============================================================================
exportAccountList();

if (process.env.DB_PROVIDER === "mongodb") {
  const seedOp = repo.replaceAll
    ? repo.replaceAll(seedData)
    : repo.seedIfEmpty(seedData);
  seedOp
    .then((counts) => {
      console.log(
        "-> Nạp thành công vào MongoDB Atlas:",
        JSON.stringify(counts),
      );
      const jsonFile = path.resolve(__dirname, "../data/database.json");
      fs.writeFileSync(jsonFile, JSON.stringify(seedData, null, 2), "utf8");
      console.log("-> Đã sao lưu đồng bộ vào server/data/database.json");
    })
    .catch((error) => {
      console.error("-> Lỗi nạp MongoDB:", error.message);
      process.exitCode = 1;
    })
    .finally(() => repo.close());
} else {
  repo.replace(seedData);
  console.log("-> Nạp thành công dữ liệu thật vào file JSON tại:", repo.file);
}
