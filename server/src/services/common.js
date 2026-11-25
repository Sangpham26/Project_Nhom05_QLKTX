// Tiện ích và hàm dùng chung cho các dịch vụ phía máy chủ
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const repo = require("../repositories");

// Cấu hình phạm vi truy cập dữ liệu cho từng nghiệp vụ
const scopes = {
  catalog: ["buildings", "roomTypes", "rooms", "stays"],
  account: ["users", "students", "staff", "activityLogs"],
  userDelete: [
    "users",
    "students",
    "staff",
    "stays",
    "invoices",
    "payments",
    "applications",
    "requests",
    "notifications",
    "activityLogs",
  ],
  buildingDelete: [
    "buildings",
    "rooms",
    "stays",
    "applications",
    "requests",
    "invoices",
    "readings",
    "activityLogs",
  ],
  roomDelete: [
    "rooms",
    "stays",
    "applications",
    "requests",
    "invoices",
    "readings",
    "activityLogs",
  ],
  roomTypeDelete: [
    "roomTypes",
    "rooms",
    "stays",
    "applications",
    "requests",
    "invoices",
    "pricing",
    "activityLogs",
  ],
  catalogWrite: [
    "buildings",
    "roomTypes",
    "rooms",
    "stays",
    "periods",
    "pricing",
  ],
  applicationView: [
    "applications",
    "students",
    "roomTypes",
    "rooms",
    "buildings",
    "stays",
  ],
  applicationWrite: [
    "applications",
    "students",
    "roomTypes",
    "rooms",
    "buildings",
    "stays",
    "notifications",
    "users",
    "staff",
    "activityLogs",
  ],
  stays: ["stays", "students", "rooms", "buildings", "roomTypes"],
  requests: [
    "requests",
    "students",
    "stays",
    "rooms",
    "notifications",
    "users",
    "staff",
    "activityLogs",
  ],
  transfer: [
    "transfers",
    "students",
    "stays",
    "rooms",
    "roomTypes",
    "buildings",
    "notifications",
    "staff",
    "activityLogs",
  ],
  readings: ["readings", "rooms", "periods", "staff", "activityLogs"],
  billing: [
    "periods",
    "pricing",
    "rooms",
    "stays",
    "readings",
    "roomTypes",
    "students",
    "invoices",
    "notifications",
    "staff",
    "activityLogs",
  ],
  invoices: ["invoices", "payments", "students", "rooms", "periods", "staff"],
  payment: [
    "invoices",
    "payments",
    "students",
    "notifications",
    "rooms",
    "staff",
    "activityLogs",
  ],
  activityLogs: ["activityLogs"],
  notifications: ["invoices", "payments", "students", "notifications"],
  staff: ["staff", "users"],
  students: [
    "students",
    "stays",
    "rooms",
    "roomTypes",
    "buildings",
    "applications",
    "requests",
    "transfers",
  ],
  report: [
    "rooms",
    "stays",
    "invoices",
    "payments",
    "applications",
    "requests",
    "buildings",
  ],
  workQueue: [
    "applications",
    "requests",
    "invoices",
    "payments",
    "rooms",
    "stays",
    "periods",
    "readings",
    "pricing",
    "roomTypes",
    "students",
  ],
};

const id = () => crypto.randomUUID();
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const now = () => new Date().toISOString();
const fail = (message, status = 400) => {
  const e = new Error(message);
  e.status = status;
  throw e;
};
const required = (value, label) => {
  if (value === undefined || value === null || String(value).trim() === "")
    fail(`Vui lòng nhập ${label}.`);
  return value;
};
const validDate = (value, label) => {
  required(value, label);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ||
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value
  )
    fail(`${label} không hợp lệ.`);
  return value;
};
const validDuration = (value) => {
  const months = Number(value);
  if (![1, 3, 6, 12].includes(months))
    fail("Thời hạn ở phải là 1, 3, 6 hoặc 12 tháng.");
  return months;
};
const endAfterMonths = (startDate, months) => {
  const start = new Date(`${validDate(startDate, "ngày bắt đầu")}T00:00:00Z`);
  const target = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + Number(months), 1),
  );
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(start.getUTCDate(), lastDay));
  return target.toISOString().slice(0, 10);
};
const addDays = (dateStr, days) => {
  const d = new Date(`${validDate(dateStr, "ngày")}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const positive = (value, label, zero = false) => {
  const n = Number(value);
  if (!Number.isFinite(n) || (zero ? n < 0 : n <= 0))
    fail(`${label} phải là số ${zero ? "không âm" : "dương"}.`);
  return n;
};
const one = (db, collection, key, label = "Bản ghi") =>
  db[collection].find((x) => x.id === key) ||
  fail(`${label} không tồn tại.`, 404);

const fieldLabels = {
  studentCode: "Mã số sinh viên",
  email: "Địa chỉ email",
  staffCode: "Mã nhân viên",
  phone: "Số điện thoại",
  month: "Kỳ thu",
};

const collectionCodeLabels = {
  buildings: "Mã tòa",
  roomTypes: "Mã loại phòng",
  rooms: "Mã phòng",
};

const unique = (db, collection, field, value, except, customLabel) => {
  if (
    db[collection].some(
      (x) =>
        x[field]?.toLowerCase?.() === String(value).toLowerCase() &&
        x.id !== except,
    )
  ) {
    const label =
      customLabel ||
      (field === "code" && collectionCodeLabels[collection]) ||
      fieldLabels[field] ||
      field;
    fail(`${label} đã tồn tại trong hệ thống.`);
  }
};

const generateStudentCode = (db) => {
  let maxNum = 2110000;
  for (const s of db.students || []) {
    const code = String(s.studentCode || "");
    const match = code.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (num > maxNum && num < 9999999) {
        maxNum = num;
      }
    }
  }
  let nextNum = maxNum + 1;
  while (db.students.some((s) => s.studentCode === String(nextNum))) {
    nextNum++;
  }
  return String(nextNum);
};

const generatePrefixCode = (items, field, prefix, minDigits = 3) => {
  let maxNum = 0;
  const regex = new RegExp(`^${prefix}(\\d+)$`, "i");
  for (const item of items || []) {
    const val = String(item[field] || "").trim();
    const match = val.match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  let nextNum = maxNum + 1;
  const padLen = Math.max(minDigits, String(nextNum).length);
  let code = `${prefix.toUpperCase()}${String(nextNum).padStart(padLen, "0")}`;
  while (
    (items || []).some(
      (item) =>
        String(item[field] || "").trim().toUpperCase() === code.toUpperCase(),
    )
  ) {
    nextNum++;
    code = `${prefix.toUpperCase()}${String(nextNum).padStart(padLen, "0")}`;
  }
  return code;
};

const nextSequentialId = (db, collection, prefix) => {
  let max = 0;
  for (const item of db[collection] || []) {
    if (item.id && typeof item.id === "string" && item.id.startsWith(prefix)) {
      const num = parseInt(item.id.slice(prefix.length), 10);
      if (!isNaN(num) && num > max) max = num;
    }
  }
  if (db.activityLogs && prefix.startsWith("u-")) {
    const regex = new RegExp(`${prefix}(\\d+)`, "g");
    for (const log of db.activityLogs) {
      const str = JSON.stringify(log);
      let match;
      while ((match = regex.exec(str)) !== null) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > max) max = num;
      }
    }
  }
  return `${prefix}${max + 1}`;
};
const student = (db, user) =>
  db.students.find((x) => x.userId === user.id) ||
  fail("Không tìm thấy hồ sơ sinh viên.", 404);
const isStayActive = (stay, refDate = today()) =>
  Boolean(
    stay &&
      stay.status === "ACTIVE" &&
      (!stay.actualEndDate || stay.actualEndDate >= refDate),
  );
const activeStay = (db, studentId) =>
  db.stays.find((x) => x.studentId === studentId && isStayActive(x));
const occupants = (db, roomId) =>
  db.stays.filter((x) => x.roomId === roomId && isStayActive(x)).length;
const finalizeExpiredStays = (db, refDate = today()) => {
  let changed = false;
  for (const s of db.stays || []) {
    if (s.status === "ACTIVE" && s.actualEndDate && s.actualEndDate < refDate) {
      s.status = "ENDED";
      changed = true;
    }
  }
  return changed;
};
const syncExpiredStays = async () => {
  const todayStr = today();
  const db = await repo.read(["stays"]);
  const hasExpired = (db.stays || []).some(
    (s) => s.status === "ACTIVE" && s.actualEndDate && s.actualEndDate < todayStr,
  );
  if (!hasExpired) return false;
  return repo.transaction(["stays"], (txDb) =>
    finalizeExpiredStays(txDb, todayStr),
  );
};

const getPeriodDateRange = (periodMonth) => {
  const [year, month] = periodMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const periodStart = `${periodMonth}-01`;
  const periodEnd = `${periodMonth}-${String(daysInMonth).padStart(2, "0")}`;
  return { periodStart, periodEnd, daysInMonth };
};

const stayDaysInPeriod = (stay, periodStart, periodEnd, daysInMonth) => {
  if (
    stay.status !== "ACTIVE" &&
    stay.status !== "ENDED" &&
    stay.status !== "TRANSFERRED"
  )
    return 0;
  const stayEnd = stay.actualEndDate || stay.plannedEndDate || "9999-12-31";
  let effStart = stay.startDate;
  if (
    stay.extensionStartDate &&
    stay.extensionStartDate >= periodStart &&
    stay.extensionStartDate <= periodEnd
  ) {
    effStart = stay.extensionStartDate;
  }
  if (effStart > periodEnd || stayEnd < periodStart) return 0;
  const start = effStart > periodStart ? effStart : periodStart;
  const end = stayEnd < periodEnd ? stayEnd : periodEnd;
  const dStart = new Date(start + "T00:00:00Z");
  const dEnd = new Date(end + "T00:00:00Z");
  const diffDays = Math.round((dEnd - dStart) / 86400000) + 1;
  return Math.max(0, Math.min(daysInMonth, diffDays));
};
const roomView = (db, room) => ({
  ...room,
  occupied: occupants(db, room.id),
  vacant:
    room.status === "ACTIVE"
      ? Math.max(0, room.operationalCapacity - occupants(db, room.id))
      : 0,
  building: db.buildings.find((x) => x.id === room.buildingId),
  roomType: db.roomTypes.find((x) => x.id === room.roomTypeId),
});
const roomAvailable = (db, room, profile, typeId) => {
  const type = one(db, "roomTypes", room.roomTypeId);
  const building = one(db, "buildings", room.buildingId);
  return (
    room.roomTypeId === typeId &&
    room.status === "ACTIVE" &&
    building.status === "ACTIVE" &&
    type.status === "ACTIVE" &&
    (!type.gender || type.gender === "ANY" || type.gender === profile.gender) &&
    occupants(db, room.id) < room.operationalCapacity
  );
};
const preferredRoom = (db, roomTypeId, roomId) => {
  if (roomId === undefined || roomId === null || roomId === "") return null;
  const room = one(db, "rooms", roomId, "Phòng nguyện vọng");
  const building = one(db, "buildings", room.buildingId);
  if (
    room.roomTypeId !== roomTypeId ||
    room.status !== "ACTIVE" ||
    building.status !== "ACTIVE"
  )
    fail(
      "Phòng nguyện vọng không thuộc loại phòng đã chọn hoặc không còn hoạt động.",
    );
  return room;
};
const notify = (db, userId, title, body, targetPath) =>
  db.notifications.unshift({
    id: id(),
    userId,
    title,
    body,
    ...(targetPath ? { targetPath } : {}),
    createdAt: now(),
    read: false,
  });
const notifyTeam = (db, title, body, targetPath) => {
  for (const user of db.users.filter(
    (item) => item.active && ["STAFF", "ADMIN"].includes(item.role),
  ))
    notify(db, user.id, title, body, targetPath);
};
const notifyStaff = (db, title, body, targetPath) => {
  for (const user of db.users.filter(
    (item) => item.active && item.role === "STAFF",
  ))
    notify(db, user.id, title, body, targetPath);
};
// Ghi nhận sự kiện nhật ký hệ thống thời gian thực trực tiếp vào CSDL
const logEvent = (db, { actorId, actorName, actorRole, action, title, body, target, tone }) => {
  if (!db.activityLogs) db.activityLogs = [];
  const timestamp = now();
  const entry = {
    id: id(),
    actorId: actorId || null,
    actorName: actorName || "Hệ thống",
    actorRole: actorRole || "SYSTEM",
    action: String(action || "THAO TÁC"),
    title: String(title || "Hoạt động hệ thống"),
    body: String(body || ""),
    target: String(target || "Hệ thống"),
    tone: tone || "blue",
    time: timestamp,
    createdAt: timestamp,
  };
  db.activityLogs.unshift(entry);
  return entry;
};
const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  role: u.role,
  active: u.active,
});
const money = (n) => Math.round(Number(n));
const paid = (db, invoiceId) =>
  db.payments
    .filter((x) => x.invoiceId === invoiceId)
    .reduce((a, x) => a + x.amount, 0);
const invoiceView = (db, invoice) => {
  const paidAmount = paid(db, invoice.id);
  const balance = invoice.total - paidAmount;
  let running = 0;
  const payments = db.payments
    .filter((x) => x.invoiceId === invoice.id)
    .map((x) => {
      running += x.amount;
      return {
        ...x,
        balanceAfter: invoice.total - running,
        recordedByName:
          db.staff.find((s) => s.userId === x.recordedBy)?.fullName || "—",
      };
    });
  return {
    ...invoice,
    student: db.students.find((x) => x.id === invoice.studentId),
    room: db.rooms.find((x) => x.id === invoice.roomId),
    period: db.periods.find((x) => x.id === invoice.periodId),
    paid: paidAmount,
    balance,
    status:
      balance <= 0
        ? "PAID"
        : paidAmount > 0
          ? "PARTIAL"
          : "UNPAID",
    payments,
  };
};
const list = (items, q = {}) => {
  const query = String(q.search || "").toLocaleLowerCase("vi");
  const filtered = items.filter(
    (x) =>
      (!query || JSON.stringify(x).toLocaleLowerCase("vi").includes(query)) &&
      (!q.status || x.status === q.status) &&
      (!q.role || (q.role.includes(",") ? q.role.split(",").map(r => r.trim()).includes(x.role) : x.role === q.role)) &&
      (!q.periodId || x.periodId === q.periodId) &&
      (!q.roomId || x.roomId === q.roomId || x.room?.id === q.roomId) &&
      (!q.buildingId ||
        x.buildingId === q.buildingId ||
        x.room?.buildingId === q.buildingId),
  );
  const page = Math.max(1, Number(q.page) || 1),
    limit = Math.min(500, Math.max(1, Number(q.limit) || 10));
  return {
    items: filtered.slice((page - 1) * limit, page * limit),
    total: filtered.length,
    page,
    pages: Math.max(1, Math.ceil(filtered.length / limit)),
  };
};



function hasNewDueNotice(db) {
  return db.invoices.some((invoice) => {
    if (invoice.total <= paid(db, invoice.id)) return false;
    const days = Math.ceil(
      (new Date(`${invoice.dueDate}T00:00:00Z`) -
        new Date(`${today()}T00:00:00Z`)) /
        86400000,
    );
    const kind = days < 0 ? "OVERDUE" : days <= 3 ? "DUE" : null;
    return (
      kind &&
      db.students.some((item) => item.id === invoice.studentId) &&
      !db.notifications.some((item) => item.key === `${kind}:${invoice.id}`)
    );
  });
}

module.exports = {
  hasNewDueNotice,
  repo,
  scopes,
  id,
  today,
  now,
  fail,
  required,
  validDate,
  validDuration,
  endAfterMonths,
  addDays,
  positive,
  one,
  fieldLabels,
  collectionCodeLabels,
  unique,
  generateStudentCode,
  generatePrefixCode,
  nextSequentialId,
  student,
  isStayActive,
  activeStay,
  occupants,
  finalizeExpiredStays,
  syncExpiredStays,
  getPeriodDateRange,
  stayDaysInPeriod,
  roomView,
  roomAvailable,
  preferredRoom,
  notify,
  notifyTeam,
  notifyStaff,
  logEvent,
  publicUser,
  money,
  paid,
  invoiceView,
  list,
};
