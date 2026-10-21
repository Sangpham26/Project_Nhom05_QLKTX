require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});
const fs = require("fs");
const bcrypt = require("bcryptjs");
const repo = require("../src/repositories");
if (process.env.DB_PROVIDER === 'mongodb' && process.argv.includes('--reset')) {
  console.error('MongoDB reset is disabled. Use a separate test database for seed.');
  process.exit(1);
}
if (repo.file && fs.existsSync(repo.file) && !process.argv.includes("--reset")) {
  console.error("Đã có dữ liệu. Dùng npm run reset để ghi đè dữ liệu mẫu.");
  process.exit(1);
}
const hash = bcrypt.hashSync("Demo@123", 10);
const month = (offset) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const period = (id, offset) => ({
  id,
  month: month(offset),
  issueDate: `${month(offset)}-01`,
  dueDate: `${month(offset)}-25`,
  status: "ACTIVE",
});
const p0 = period("period-old", -1),
  p1 = period("period-current", 0);
const users = [
  {
    id: "admin",
    email: "admin@ktx.demo",
    passwordHash: hash,
    role: "ADMIN",
    active: true,
  },
  {
    id: "staff",
    email: "staff@ktx.demo",
    passwordHash: hash,
    role: "STAFF",
    active: true,
  },
  {
    id: "student-a",
    email: "an@ktx.demo",
    passwordHash: hash,
    role: "STUDENT",
    active: true,
  },
  {
    id: "student-b",
    email: "binh@ktx.demo",
    passwordHash: hash,
    role: "STUDENT",
    active: true,
  },
  {
    id: "student-c",
    email: "chi@ktx.demo",
    passwordHash: hash,
    role: "STUDENT",
    active: true,
  },
];
const students = [
  {
    id: "sv-a",
    userId: "student-a",
    studentCode: "SV2026001",
    fullName: "Nguyễn Minh An",
    gender: "MALE",
    faculty: "Công nghệ thông tin",
    course: "K21",
    phone: "0901000001",
    address: "Đồng Nai",
    contact: "0901000001",
  },
  {
    id: "sv-b",
    userId: "student-b",
    studentCode: "SV2026002",
    fullName: "Trần Đức Bình",
    gender: "MALE",
    faculty: "Kinh tế",
    course: "K22",
    phone: "0901000002",
    address: "Bình Dương",
    contact: "0901000002",
  },
  {
    id: "sv-c",
    userId: "student-c",
    studentCode: "SV2026003",
    fullName: "Lê Ngọc Chi",
    gender: "FEMALE",
    faculty: "Ngoại ngữ",
    course: "K21",
    phone: "0901000003",
    address: "Long An",
    contact: "0901000003",
  },
];
const buildings = [
  {
    id: "b-a",
    code: "A",
    name: "Tòa A",
    description: "Khu nam sinh",
    status: "ACTIVE",
  },
  {
    id: "b-b",
    code: "B",
    name: "Tòa B",
    description: "Khu nữ sinh",
    status: "ACTIVE",
  },
];
const roomTypes = [
  {
    id: "t-4m",
    code: "NAM4",
    name: "Phòng nam 4 người",
    description: "Phòng tiêu chuẩn, đầy đủ tiện nghi",
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
    description: "Tiết kiệm, không gian thoáng",
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
    description: "Phòng tiêu chuẩn khu nữ",
    gender: "FEMALE",
    defaultCapacity: 4,
    fee: 650000,
    status: "ACTIVE",
    images: [],
  },
];
const rooms = [
  ["A101", "b-a", "t-4m", 4],
  ["A102", "b-a", "t-4m", 4],
  ["A103", "b-a", "t-4m", 4],
  ["A201", "b-a", "t-6m", 6],
  ["A202", "b-a", "t-6m", 6],
  ["B101", "b-b", "t-4f", 4],
  ["B102", "b-b", "t-4f", 4],
  ["B103", "b-b", "t-4f", 4],
  ["B201", "b-b", "t-4f", 4],
  ["B202", "b-b", "t-4f", 4],
].map(([code, buildingId, roomTypeId, cap]) => ({
  id: `room-${code}`,
  code,
  buildingId,
  floor: Number(code[1]),
  roomTypeId,
  designCapacity: cap,
  operationalCapacity: cap,
  status: "ACTIVE",
}));
const stays = [
  {
    id: "stay-a",
    studentId: "sv-a",
    roomId: "room-A101",
    startDate: `${month(-2)}-01`,
    plannedEndDate: `${month(5)}-28`,
    status: "ACTIVE",
    applicationId: "app-a",
  },
  {
    id: "stay-c",
    studentId: "sv-c",
    roomId: "room-B101",
    startDate: `${month(-2)}-01`,
    plannedEndDate: `${month(2)}-28`,
    status: "ACTIVE",
    applicationId: "app-c",
  },
];
const applications = [
  {
    id: "app-a",
    studentId: "sv-a",
    roomTypeId: "t-4m",
    startDate: stays[0].startDate,
    contact: "0901000001",
    note: "",
    status: "APPROVED",
    createdAt: `${month(-2)}-01T08:00:00Z`,
    roomId: "room-A101",
    stayId: "stay-a",
  },
  {
    id: "app-b",
    studentId: "sv-b",
    roomTypeId: "t-6m",
    startDate: `${month(1)}-01`,
    contact: "0901000002",
    note: "Mong được bố trí sớm",
    status: "PENDING",
    createdAt: new Date().toISOString(),
  },
  {
    id: "app-c",
    studentId: "sv-c",
    roomTypeId: "t-4f",
    startDate: stays[1].startDate,
    contact: "0901000003",
    note: "",
    status: "APPROVED",
    createdAt: `${month(-2)}-01T08:00:00Z`,
    roomId: "room-B101",
    stayId: "stay-c",
  },
];
const requests = [
  {
    id: "req-c",
    studentId: "sv-c",
    stayId: "stay-c",
    type: "EXTEND",
    desiredDate: `${month(4)}-28`,
    reason: "Tiếp tục học kỳ mới",
    status: "PENDING",
    createdAt: new Date().toISOString(),
  },
];
const readings = [];
for (const roomId of ["room-A101", "room-B101"])
  for (const [periodId, inc, offset] of [
    [p0.id, 0, 0],
    [p1.id, 1, 1],
  ]) {
    readings.push({
      id: `${roomId}-${periodId}-e`,
      roomId,
      periodId,
      type: "ELECTRICITY",
      start: 100 + inc * 35 + offset,
      end: 135 + inc * 35 + offset,
      usage: 35,
      enteredBy: "staff",
    });
    readings.push({
      id: `${roomId}-${periodId}-w`,
      roomId,
      periodId,
      type: "WATER",
      start: 20 + inc * 6,
      end: 26 + inc * 6,
      usage: 6,
      enteredBy: "staff",
    });
  }
const snapshot = (roomCode, current = false) => ({
  roomCode,
  roomTypeName: roomCode.startsWith("A")
    ? "Phòng nam 4 người"
    : "Phòng nữ 4 người",
  occupants: 1,
  roomFee: 650000,
  electricityRate: 3500,
  waterRate: 15000,
  electricStart: current ? 136 : 100,
  electricEnd: current ? 171 : 135,
  electricUsage: 35,
  waterStart: current ? 26 : 20,
  waterEnd: current ? 32 : 26,
  waterUsage: 6,
  electricityRoomTotal: 122500,
  waterRoomTotal: 90000,
});
const invoices = [
  {
    id: "inv-a-old",
    studentId: "sv-a",
    roomId: "room-A101",
    periodId: p0.id,
    dueDate: p0.dueDate,
    snapshot: snapshot("A101"),
    roomFee: 650000,
    electricityFee: 122500,
    waterFee: 90000,
    total: 862500,
    issuedAt: `${p0.month}-01T08:00:00Z`,
    issuedBy: "staff",
  },
  {
    id: "inv-a-new",
    studentId: "sv-a",
    roomId: "room-A101",
    periodId: p1.id,
    dueDate: p1.dueDate,
    snapshot: snapshot("A101", true),
    roomFee: 650000,
    electricityFee: 122500,
    waterFee: 90000,
    total: 862500,
    issuedAt: `${p1.month}-01T08:00:00Z`,
    issuedBy: "staff",
  },
  {
    id: "inv-c-new",
    studentId: "sv-c",
    roomId: "room-B101",
    periodId: p1.id,
    dueDate: p1.dueDate,
    snapshot: snapshot("B101", true),
    roomFee: 650000,
    electricityFee: 122500,
    waterFee: 90000,
    total: 862500,
    issuedAt: `${p1.month}-01T08:00:00Z`,
    issuedBy: "staff",
  },
];
const payments = [
  {
    id: "pay-a-old",
    invoiceId: "inv-a-old",
    amount: 862500,
    date: p0.dueDate,
    method: "CASH",
    note: "Đã thu đủ",
    recordedBy: "staff",
  },
  {
    id: "pay-a-new",
    invoiceId: "inv-a-new",
    amount: 300000,
    date: p1.issueDate,
    method: "TRANSFER",
    note: "Đợt 1",
    recordedBy: "staff",
  },
];
const notifications = [
  {
    id: "n-a",
    userId: "student-a",
    title: "Hóa đơn kỳ mới",
    body: `Hóa đơn kỳ ${p1.month} đã phát hành.`,
    createdAt: new Date().toISOString(),
    read: false,
  },
  {
    id: "n-b",
    userId: "student-b",
    title: "Đã tiếp nhận hồ sơ",
    body: "Hồ sơ của bạn đang chờ nhân viên duyệt.",
    createdAt: new Date().toISOString(),
    read: false,
  },
  {
    id: "n-c",
    userId: "student-c",
    title: "Yêu cầu gia hạn",
    body: "Yêu cầu của bạn đang được xử lý.",
    createdAt: new Date().toISOString(),
    read: false,
  },
];
const seedData = {
  users,
  students,
  staff: [
    {
      id: "staff-admin",
      userId: "admin",
      staffCode: "AD001",
      fullName: "Quản trị hệ thống",
      phone: "0909000001",
    },
    {
      id: "staff-staff",
      userId: "staff",
      staffCode: "NV001",
      fullName: "Phạm Thu Hà",
      phone: "0909000002",
    },
  ],
  buildings,
  roomTypes,
  rooms,
  applications,
  stays,
  requests,
  transfers: [],
  periods: [p0, p1],
  readings,
  pricing: [
    {
      id: "price-default",
      effectiveFrom: `${month(-3)}-01`,
      electricity: 3500,
      water: 15000,
      roomFees: {},
    },
  ],
  invoices,
  payments,
  notifications,
};
if (process.env.DB_PROVIDER === 'mongodb') {
  repo.seedIfEmpty(seedData).then(counts => {
    console.log('Seeded separate MongoDB database:', JSON.stringify(counts));
  }).catch(error => {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  }).finally(() => repo.close());
} else {
  repo.replace(seedData);
  console.log('Seeded JSON data at', repo.file);
}
