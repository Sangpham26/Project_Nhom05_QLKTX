const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const repo = require("../repositories");

// Each service loads only the collections it can read or change. The JSON provider
// accepts the same scopes; the MongoDB provider uses them for focused queries.
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
  const year = start.getUTCFullYear();
  const month = start.getUTCMonth();
  const day = start.getUTCDate();
  if (day <= 10) {
    const endM = month + months - 1;
    const eYear = year + Math.floor(endM / 12);
    const eMonth = endM % 12;
    const lastDay = new Date(Date.UTC(eYear, eMonth + 1, 0)).getUTCDate();
    const pad = (n) => String(n).padStart(2, "0");
    return `${eYear}-${pad(eMonth + 1)}-${pad(lastDay)}`;
  }
  const target = new Date(Date.UTC(year, month + months, day));
  target.setUTCDate(target.getUTCDate() - 1);
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
  return `${prefix}${max + 1}`;
};
const student = (db, user) =>
  db.students.find((x) => x.userId === user.id) ||
  fail("Không tìm thấy hồ sơ sinh viên.", 404);
const activeStay = (db, studentId) =>
  db.stays.find((x) => x.studentId === studentId && x.status === "ACTIVE");
const occupants = (db, roomId) =>
  db.stays.filter((x) => x.roomId === roomId && x.status === "ACTIVE").length;

const getPeriodDateRange = (periodMonth) => {
  const [year, month] = periodMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const periodStart = `${periodMonth}-01`;
  const periodEnd = `${periodMonth}-${String(daysInMonth).padStart(2, "0")}`;
  return { periodStart, periodEnd, daysInMonth };
};

const stayDaysInPeriod = (stay, periodStart, periodEnd, daysInMonth) => {
  if (stay.status !== "ACTIVE" && stay.status !== "ENDED") return 0;
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
        : invoice.dueDate < today()
          ? "OVERDUE"
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

async function catalog() {
  const db = await repo.read(scopes.catalog);
  return {
    buildings: db.buildings,
    roomTypes: db.roomTypes,
    rooms: db.rooms.map((r) => roomView(db, r)),
  };
}
async function register(body) {
  return repo.transaction(scopes.account, (db) => {
    const email = String(required(body.email, "email")).trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) fail("Email không hợp lệ.");
    if (String(required(body.password, "mật khẩu")).length < 8)
      fail("Mật khẩu cần ít nhất 8 ký tự.");

    // ID người dùng và mã sinh viên luôn được hệ thống tự động sinh từ CSDL, không cho người dùng tự sửa
    const studentCode = generateStudentCode(db);
    unique(db, "users", "email", email);
    unique(db, "students", "studentCode", studentCode);

    const user = {
      id: nextSequentialId(db, "users", "u-student-"),
      email,
      passwordHash: bcrypt.hashSync(body.password, 10),
      role: "STUDENT",
      active: true,
    };
    const profile = {
      id: nextSequentialId(db, "students", "sv-"),
      userId: user.id,
      studentCode,
      fullName: String(required(body.fullName, "họ tên")).trim(),
      gender: required(body.gender, "giới tính"),
      faculty: body.faculty || "Chưa cập nhật",
      course: body.course || "K21",
      phone: body.phone || "",
      address: body.address || "",
      contact: body.phone || "",
    };
    if (!["MALE", "FEMALE", "OTHER"].includes(profile.gender))
      fail("Giới tính không hợp lệ.");
    db.users.push(user);
    db.students.push(profile);
    return { user: publicUser(user), profile };
  });
}
async function login(body) {
  const db = await repo.read(scopes.account);
  const user = db.users.find(
    (x) =>
      x.email ===
      String(body.email || "")
        .trim()
        .toLowerCase(),
  );
  if (
    !user ||
    !bcrypt.compareSync(String(body.password || ""), user.passwordHash)
  )
    fail("Email hoặc mật khẩu không đúng.", 401);
  if (!user.active) fail("Tài khoản đã bị khóa.", 403);
  return {
    user: publicUser(user),
    profile:
      user.role === "STUDENT"
        ? db.students.find((x) => x.userId === user.id)
        : db.staff.find((x) => x.userId === user.id),
  };
}
async function me(user) {
  const db = await repo.read(scopes.account);
  return {
    user: publicUser(one(db, "users", user.id)),
    profile:
      user.role === "STUDENT"
        ? student(db, user)
        : db.staff.find((x) => x.userId === user.id),
  };
}
async function updateProfile(user, body) {
  return repo.transaction(scopes.account, (db) => {
    const profile =
      user.role === "STUDENT"
        ? student(db, user)
        : db.staff.find((x) => x.userId === user.id);
    if (!profile) fail("Không tìm thấy hồ sơ.", 404);
    for (const field of [
      "fullName",
      "phone",
      "address",
      "faculty",
      "course",
      "contact",
    ])
      if (body[field] !== undefined) profile[field] = String(body[field]);
    return profile;
  });
}

const collections = {
  buildings: "buildings",
  roomTypes: "roomTypes",
  rooms: "rooms",
  periods: "periods",
  pricing: "pricing",
};
function validateCatalog(db, kind, body, existing) {
  if (kind === "buildings") {
    required(body.code, "mã tòa");
    required(body.name, "tên tòa");
    unique(db, kind, "code", body.code, existing?.id);
    if (
      existing &&
      body.status === "INACTIVE" &&
      db.rooms.some(
        (r) => r.buildingId === existing.id && occupants(db, r.id) > 0,
      )
    )
      fail("Không thể ngừng sử dụng tòa đang có sinh viên ở.");
  }
  if (kind === "roomTypes") {
    required(body.code, "mã loại phòng");
    required(body.name, "tên loại phòng");
    unique(db, kind, "code", body.code, existing?.id);
    body.defaultCapacity = positive(body.defaultCapacity, "Sức chứa");
    body.fee = positive(body.fee, "Phí phòng", true);
    if (!["MALE", "FEMALE", "ANY"].includes(body.gender))
      fail("Giới tính áp dụng không hợp lệ.");
  }
  if (kind === "rooms") {
    required(body.code, "mã phòng");
    unique(db, kind, "code", body.code, existing?.id);
    one(db, "buildings", body.buildingId);
    one(db, "roomTypes", body.roomTypeId);
    body.designCapacity = positive(body.designCapacity, "Sức chứa thiết kế");
    body.operationalCapacity = positive(
      body.operationalCapacity,
      "Sức chứa vận hành",
    );
    if (
      body.operationalCapacity > body.designCapacity ||
      body.operationalCapacity < (existing ? occupants(db, existing.id) : 0)
    )
      fail("Sức chứa vận hành không hợp lệ.");
    if (
      existing &&
      occupants(db, existing.id) &&
      (body.roomTypeId !== existing.roomTypeId ||
        body.buildingId !== existing.buildingId ||
        body.status === "INACTIVE")
    )
      fail(
        "Không thể đổi tòa, loại hoặc ngừng sử dụng khi phòng đang có người.",
      );
  }
  if (kind === "periods") {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(body.month || ""))
      fail("Kỳ thu phải có dạng YYYY-MM.");
    unique(db, kind, "month", body.month, existing?.id);
    validDate(body.issueDate, "ngày lập");
    validDate(body.dueDate, "hạn thanh toán");
    if (body.dueDate < body.issueDate)
      fail("Hạn thanh toán phải sau ngày lập.");
  }
  if (kind === "pricing") {
    body.electricity = positive(body.electricity, "Đơn giá điện", true);
    body.water = positive(body.water, "Đơn giá nước", true);
    validDate(body.effectiveFrom, "ngày áp dụng");
    for (const [typeId, fee] of Object.entries(body.roomFees || {})) {
      one(db, "roomTypes", typeId);
      body.roomFees[typeId] = positive(fee, "Phí phòng", true);
    }
  }
}
async function catalogWrite(kind, body, targetId) {
  if (!collections[kind]) fail("Danh mục không hợp lệ.", 404);
  return repo.transaction(scopes.catalogWrite, (db) => {
    const existing = targetId ? one(db, kind, targetId) : null;
    const cleanBody = { ...body };
    delete cleanBody.id;
    if (kind === "roomTypes") delete cleanBody.images;
    const value = { ...(existing || {}), ...cleanBody };
    if (kind === "roomTypes" && !existing) value.images = [];
    validateCatalog(db, kind, value, existing);
    if (!existing) {
      value.id = id();
      db[kind].push(value);
    } else Object.assign(existing, value);
    return value;
  });
}
async function catalogList(kind, query) {
  if (!collections[kind]) fail("Danh mục không hợp lệ.", 404);
  const db = await repo.read(scopes.catalogWrite);
  return list(
    kind === "rooms" ? db.rooms.map((r) => roomView(db, r)) : db[kind],
    query,
  );
}
async function catalogDetail(kind, targetId) {
  const db = await repo.read(scopes.catalogWrite);
  const item = one(db, kind, targetId);
  return kind === "rooms" ? roomView(db, item) : item;
}

const applicationView = (db, x) => {
  const wish = db.rooms.find((r) => r.id === x.preferredRoomId);
  return {
    ...x,
    student: db.students.find((s) => s.id === x.studentId),
    roomType: db.roomTypes.find((t) => t.id === x.roomTypeId),
    room: db.rooms.find((r) => r.id === x.roomId),
    preferredRoom: wish ? roomView(db, wish) : null,
  };
};
async function applicationDetail(user, targetId) {
  const db = await repo.read(scopes.applicationView);
  const app = one(db, "applications", targetId, "Hồ sơ");
  if (user.role === "STUDENT" && app.studentId !== student(db, user).id)
    fail("Không có quyền xem hồ sơ này.", 403);
  return applicationView(db, app);
}
async function applications(user, q) {
  const db = await repo.read(scopes.applicationView);
  const own = user.role === "STUDENT" ? student(db, user).id : null;
  return list(
    db.applications
      .filter((x) => !own || x.studentId === own)
      .map((x) => applicationView(db, x))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    q,
  );
}
async function apply(user, body) {
  return repo.transaction(scopes.applicationWrite, (db) => {
    const profile = student(db, user);
    const type = one(db, "roomTypes", required(body.roomTypeId, "loại phòng"));
    if (
      type.status !== "ACTIVE" ||
      (type.gender !== "ANY" && type.gender !== profile.gender)
    )
      fail("Loại phòng không phù hợp với hồ sơ sinh viên.");
    validDate(body.startDate, "ngày bắt đầu");
    required(body.contact, "thông tin liên hệ");
    const wish = preferredRoom(db, type.id, body.preferredRoomId);
    const durationMonths =
      body.durationMonths === undefined || body.durationMonths === ""
        ? null
        : validDuration(body.durationMonths);
    if (
      activeStay(db, profile.id) ||
      db.applications.some(
        (x) =>
          x.studentId === profile.id &&
          ["PENDING", "REVIEWING", "NEEDS_INFO"].includes(x.status),
      )
    )
      fail("Bạn đang có hồ sơ chờ xử lý hoặc đang lưu trú.");
    const item = {
      id: id(),
      studentId: profile.id,
      roomTypeId: body.roomTypeId,
      ...(wish ? { preferredRoomId: wish.id } : {}),
      ...(durationMonths ? { durationMonths } : {}),
      startDate: body.startDate,
      contact: String(body.contact),
      note: body.note || "",
      status: "PENDING",
      createdAt: now(),
    };
    db.applications.push(item);
    notifyTeam(
      db,
      "Hồ sơ đăng ký mới",
      `${profile.fullName} đã gửi nguyện vọng${wish ? ` phòng ${wish.code}` : ` loại phòng ${type.name}`}.`,
      `/applications/${item.id}`,
    );
    logEvent(db, {
      actorId: user.id,
      actorName: profile.fullName || "Sinh viên",
      actorRole: "STUDENT",
      action: "NỘP HỒ SƠ NỘI TRÚ",
      title: `SV ${profile.fullName} (${profile.studentCode || "—"}) đã nộp hồ sơ ký túc xá`,
      body: `Đăng ký nguyện vọng ${type.name}${wish ? ` (Phòng ưu tiên: ${wish.code})` : ""}, thời hạn ${durationMonths || 6} tháng.`,
      target: `MSSV: ${profile.studentCode || "—"}`,
      tone: "blue",
    });
    return item;
  });
}
async function applicationUpdate(user, targetId, body) {
  return repo.transaction(scopes.applicationWrite, (db) => {
    const profile = student(db, user);
    const app = one(db, "applications", targetId, "Hồ sơ");
    if (app.studentId !== profile.id)
      fail("Không có quyền sửa hồ sơ này.", 403);
    if (app.status !== "NEEDS_INFO")
      fail("Chỉ có thể bổ sung hồ sơ khi nhân viên yêu cầu.");
    const previousTypeId = app.roomTypeId;
    if (body.roomTypeId && body.roomTypeId !== app.roomTypeId) {
      const type = one(db, "roomTypes", body.roomTypeId);
      if (
        type.status !== "ACTIVE" ||
        (type.gender !== "ANY" && type.gender !== profile.gender)
      )
        fail("Loại phòng không phù hợp.");
      app.roomTypeId = body.roomTypeId;
    }
    if (body.preferredRoomId !== undefined) {
      const wish = preferredRoom(db, app.roomTypeId, body.preferredRoomId);
      if (wish) app.preferredRoomId = wish.id;
      else delete app.preferredRoomId;
    } else if (app.roomTypeId !== previousTypeId) {
      delete app.preferredRoomId;
    }
    if (body.durationMonths !== undefined)
      app.durationMonths = validDuration(body.durationMonths);
    if (body.startDate)
      app.startDate = validDate(body.startDate, "ngày bắt đầu");
    if (body.contact !== undefined)
      app.contact = String(required(body.contact, "thông tin liên hệ"));
    if (body.note !== undefined) app.note = String(body.note);
    app.status = "PENDING";
    app.updatedAt = now();
    notifyTeam(
      db,
      "Hồ sơ đã bổ sung",
      `${profile.fullName} đã bổ sung hồ sơ và đang chờ xét duyệt.`,
      `/applications/${app.id}`,
    );
    return app;
  });
}
async function applicationAction(user, targetId, action, body) {
  return repo.transaction(scopes.applicationWrite, (db) => {
    const app = one(db, "applications", targetId, "Hồ sơ");
    if (!["PENDING", "REVIEWING", "NEEDS_INFO"].includes(app.status))
      fail("Hồ sơ đã được xử lý.");
    if (action === "review") {
      app.status = body.needsInfo ? "NEEDS_INFO" : "REVIEWING";
      app.reviewNote = body.note || "";
      if (body.needsInfo) {
        const owner = one(db, "students", app.studentId);
        notify(
          db,
          owner.userId,
          "Cần bổ sung hồ sơ",
          app.reviewNote || "Vui lòng mở hồ sơ để bổ sung thông tin.",
          `/applications/${app.id}`,
        );
        const staffMember = db.staff?.find((s) => s.userId === user.id);
        logEvent(db, {
          actorId: user.id,
          actorName: staffMember?.fullName || "Nhân viên KTX",
          actorRole: user.role || "STAFF",
          action: "YÊU CẦU BỔ SUNG HỒ SƠ",
          title: `${staffMember?.fullName || "Nhân viên"} yêu cầu bổ sung hồ sơ`,
          body: `Yêu cầu SV ${owner.fullName} (MSSV: ${owner.studentCode || "—"}) bổ sung thông tin: "${app.reviewNote || "Cập nhật hồ sơ"}".`,
          target: `MSSV: ${owner.studentCode || "—"}`,
          tone: "amber",
        });
      }
    } else if (action === "reject") {
      app.rejectionReason = String(required(body.reason, "lý do từ chối"));
      app.status = "REJECTED";
      app.handledBy = user.id;
      app.handledAt = now();
      const owner = db.students.find((x) => x.id === app.studentId);
      notify(
        db,
        owner.userId,
        "Hồ sơ bị từ chối",
        app.rejectionReason,
        `/applications/${app.id}`,
      );
      const staffMember = db.staff?.find((s) => s.userId === user.id);
      logEvent(db, {
        actorId: user.id,
        actorName: staffMember?.fullName || "Nhân viên KTX",
        actorRole: user.role || "STAFF",
        action: "TỪ CHỐI HỒ SƠ",
        title: `${staffMember?.fullName || "Nhân viên"} đã từ chối hồ sơ nội trú`,
        body: `Từ chối hồ sơ đăng ký của sinh viên ${owner?.fullName || "Sinh viên"} (MSSV: ${owner?.studentCode || "—"}). Lý do: "${app.rejectionReason}".`,
        target: owner ? `MSSV: ${owner.studentCode || "—"}` : "Hồ sơ",
        tone: "rose",
      });
    } else if (action === "approve") {
      const profile = one(db, "students", app.studentId);
      if (activeStay(db, profile.id))
        fail("Sinh viên đã có lượt lưu trú đang hoạt động.");
      const room = one(db, "rooms", required(body.roomId, "phòng"));
      if (!roomAvailable(db, room, profile, app.roomTypeId))
        fail("Phòng không còn phù hợp hoặc đã đầy.");
      const startDate = validDate(
          body.startDate || app.startDate,
          "ngày bắt đầu",
        ),
        endDate = app.durationMonths
          ? endAfterMonths(startDate, validDuration(app.durationMonths))
          : validDate(body.endDate, "ngày kết thúc");
      if (endDate <= startDate) fail("Ngày kết thúc phải sau ngày bắt đầu.");
      const stay = {
        id: id(),
        studentId: profile.id,
        roomId: room.id,
        startDate,
        plannedEndDate: endDate,
        ...(app.durationMonths ? { durationMonths: app.durationMonths } : {}),
        status: "ACTIVE",
        applicationId: app.id,
      };
      db.stays.push(stay);
      app.status = "APPROVED";
      app.roomId = room.id;
      app.stayId = stay.id;
      app.handledBy = user.id;
      app.handledAt = now();
      notify(
        db,
        profile.userId,
        "Hồ sơ đã được duyệt",
        `Bạn đã được bố trí phòng ${room.code}.`,
        `/applications/${app.id}`,
      );
      const staffMember = db.staff?.find((s) => s.userId === user.id);
      logEvent(db, {
        actorId: user.id,
        actorName: staffMember?.fullName || "Lê Thị Lan",
        actorRole: user.role || "STAFF",
        action: "DUYỆT HỒ SƠ NỘI TRÚ",
        title: `${staffMember?.fullName || "Nhân viên"} đã phê duyệt hồ sơ nội trú`,
        body: `Phê duyệt và bố trí phòng ${room.code} cho sinh viên ${profile.fullName} (MSSV: ${profile.studentCode || "—"}), thời hạn lưu trú ${app.durationMonths || 6} tháng.`,
        target: `Phòng ${room.code}`,
        tone: "green",
      });
    } else fail("Thao tác không hợp lệ.");
    return app;
  });
}
async function stays(user, q) {
  const db = await repo.read(scopes.stays);
  const own = user.role === "STUDENT" ? student(db, user).id : null;
  return list(
    db.stays
      .filter((x) => !own || x.studentId === own)
      .map((x) => ({
        ...x,
        student: db.students.find((s) => s.id === x.studentId),
        room: roomView(db, one(db, "rooms", x.roomId)),
      }))
      .sort((a, b) => b.startDate.localeCompare(a.startDate)),
    q,
  );
}
async function stayRequests(user, q) {
  const db = await repo.read(scopes.requests);
  const own = user.role === "STUDENT" ? student(db, user).id : null;
  return list(
    db.requests
      .filter((x) => !own || x.studentId === own)
      .map((x) => ({
        ...x,
        student: db.students.find((s) => s.id === x.studentId),
        room: db.rooms.find(
          (r) => r.id === db.stays.find((s) => s.id === x.stayId)?.roomId,
        ),
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    q,
  );
}
async function requestStay(user, body) {
  return repo.transaction(scopes.requests, (db) => {
    const profile = student(db, user),
      stay = activeStay(db, profile.id);
    if (!stay) fail("Bạn chưa có lượt lưu trú đang hoạt động.");
    if (!["EXTEND", "RETURN"].includes(body.type))
      fail("Loại yêu cầu không hợp lệ.");
    if (
      db.requests.some(
        (x) =>
          x.stayId === stay.id &&
          x.type === body.type &&
          x.status === "PENDING",
      )
    )
      fail("Đã có yêu cầu cùng loại đang chờ xử lý.");

    const todayDate = today();
    const dPlanned = new Date(`${stay.plannedEndDate}T00:00:00Z`);
    const dToday = new Date(`${todayDate}T00:00:00Z`);
    const diffDays = Math.round((dPlanned - dToday) / 86400000);
    const isOverdue = diffDays < 0;
    const overdueDays = isOverdue ? Math.abs(diffDays) : 0;
    const penaltyRate = 25000;
    const penaltyAmount = overdueDays * penaltyRate;

    let desiredDate;
    let startDateForCycle = null;
    let months = null;

    if (body.type === "EXTEND") {
      months = body.months ? Number(body.months) : 6;
      if (![1, 3, 6, 12].includes(months)) months = 6;

      if (!isOverdue) {
        // Gia hạn trước khi phạt: Ngày bắt đầu của chu kỳ mới là ngày hôm sau của chu kỳ trước
        startDateForCycle = addDays(stay.plannedEndDate, 1);
      } else {
        // Gia hạn khi quá hạn: Tính ngày hôm sau của ngày bị phạt (ngày nộp đơn) làm ngày bắt đầu
        startDateForCycle = addDays(todayDate, 1);
      }

      desiredDate = body.desiredDate
        ? validDate(body.desiredDate, "ngày mong muốn")
        : endAfterMonths(startDateForCycle, months);

      if (desiredDate <= stay.plannedEndDate)
        fail("Ngày kết thúc gia hạn phải sau ngày kết thúc hiện tại.");
    } else {
      // RETURN
      if (!isOverdue) {
        // Trả phòng đúng hạn: Tự động lấy ngày dự kiến kết thúc hiện tại
        desiredDate = body.desiredDate
          ? validDate(body.desiredDate, "ngày mong muốn")
          : stay.plannedEndDate;
      } else {
        // Quá hạn: Vẫn tính phạt và lấy ngày hôm sau của ngày phạt
        desiredDate = addDays(todayDate, 1);
      }
    }

    const item = {
      id: id(),
      studentId: profile.id,
      stayId: stay.id,
      type: body.type,
      months,
      startDateForCycle,
      desiredDate,
      overdueDays,
      penaltyRate,
      penaltyAmount,
      reason: String(required(body.reason, "lý do")),
      status: "PENDING",
      createdAt: now(),
    };
    db.requests.push(item);
    notifyTeam(
      db,
      "Yêu cầu lưu trú mới",
      `${profile.fullName} đã gửi yêu cầu ${body.type === "EXTEND" ? "gia hạn" : "trả phòng"}${overdueDays > 0 ? ` (Quá hạn ${overdueDays} ngày)` : ""}.`,
      "/requests",
    );
    logEvent(db, {
      actorId: user.id,
      actorName: profile.fullName || "Sinh viên",
      actorRole: "STUDENT",
      action: body.type === "EXTEND" ? "YÊU CẦU GIA HẠN" : "YÊU CẦU TRẢ PHÒNG",
      title: `SV ${profile.fullName} (${profile.studentCode || "—"}) gửi yêu cầu ${body.type === "EXTEND" ? "gia hạn lưu trú" : "trả phòng"}${overdueDays > 0 ? ` [Quá hạn ${overdueDays} ngày]` : ""}`,
      body: `Lý do: "${item.reason}". Ngày mong muốn: ${item.desiredDate}.${overdueDays > 0 ? ` Phí phạt trễ hạn tính: ${penaltyAmount.toLocaleString("vi-VN")} ₫.` : ""}`,
      target: `MSSV: ${profile.studentCode || "—"}`,
      tone: overdueDays > 0 ? "rose" : "amber",
    });
    return item;
  });
}
async function decideRequest(user, targetId, body) {
  return repo.transaction(scopes.requests, (db) => {
    const request = one(db, "requests", targetId, "Yêu cầu");
    if (request.status !== "PENDING") fail("Yêu cầu đã được xử lý.");
    const stay = one(db, "stays", request.stayId);
    if (!["APPROVED", "REJECTED"].includes(body.status))
      fail("Trạng thái không hợp lệ.");
    if (body.status === "REJECTED")
      request.rejectionReason = String(required(body.reason, "lý do từ chối"));
    else {
      if (stay.status !== "ACTIVE") fail("Lượt lưu trú không còn hiệu lực.");
      if (request.type === "EXTEND") {
        stay.plannedEndDate = request.desiredDate;
        if (request.overdueDays > 0 && request.penaltyAmount > 0) {
          stay.extensionStartDate = request.startDateForCycle;
          if (!stay.penalties) stay.penalties = [];
          stay.penalties.push({
            id: request.id,
            type: "EXTEND",
            days: request.overdueDays,
            rate: request.penaltyRate || 25000,
            amount: request.penaltyAmount,
            date: today(),
            periodMonth: today().slice(0, 7),
            reason: `Phạt gia hạn trễ ${request.overdueDays} ngày`,
            billed: false,
          });
        }
      } else {
        stay.status = "ENDED";
        stay.actualEndDate = request.desiredDate;
        if (request.overdueDays > 0 && request.penaltyAmount > 0) {
          if (!stay.penalties) stay.penalties = [];
          stay.penalties.push({
            id: request.id,
            type: "RETURN",
            days: request.overdueDays,
            rate: request.penaltyRate || 25000,
            amount: request.penaltyAmount,
            date: today(),
            periodMonth: today().slice(0, 7),
            reason: `Phạt trả phòng trễ ${request.overdueDays} ngày`,
            billed: false,
          });
        }
      }
    }
    request.status = body.status;
    request.handledBy = user.id;
    request.handledAt = now();
    const stu = one(db, "students", request.studentId);
    notify(
      db,
      stu.userId,
      "Yêu cầu lưu trú đã xử lý",
      body.status === "APPROVED"
        ? `Yêu cầu của bạn đã được duyệt.${request.overdueDays > 0 ? ` Phí phạt ${request.penaltyAmount.toLocaleString("vi-VN")} ₫ sẽ được tính vào hóa đơn.` : ""}`
        : `Yêu cầu bị từ chối: ${request.rejectionReason}`,
      "/requests",
    );
    const staffMember = db.staff?.find((s) => s.userId === user.id);
    logEvent(db, {
      actorId: user.id,
      actorName: staffMember?.fullName || "Lê Thị Lan",
      actorRole: user.role || "STAFF",
      action: body.status === "APPROVED" ? "DUYỆT YÊU CẦU LƯU TRÚ" : "TỪ CHỐI YÊU CẦU LƯU TRÚ",
      title: `${staffMember?.fullName || "Nhân viên"} đã ${body.status === "APPROVED" ? "phê duyệt" : "từ chối"} yêu cầu ${request.type === "EXTEND" ? "gia hạn" : "trả phòng"}`,
      body: body.status === "APPROVED"
        ? `Phê duyệt yêu cầu ${request.type === "EXTEND" ? "gia hạn lưu trú" : "trả phòng"} của SV ${stu?.fullName || "Sinh viên"} (MSSV: ${stu?.studentCode || "—"}).`
        : `Từ chối yêu cầu của SV ${stu?.fullName || "Sinh viên"} (MSSV: ${stu?.studentCode || "—"}). Lý do: "${request.rejectionReason}".`,
      target: `MSSV: ${stu?.studentCode || "—"}`,
      tone: body.status === "APPROVED" ? "green" : "rose",
    });
    return request;
  });
}
async function transfer(user, body) {
  return repo.transaction(scopes.transfer, (db) => {
    const profile = one(db, "students", required(body.studentId, "sinh viên"));
    const stay = activeStay(db, profile.id);
    if (!stay) fail("Sinh viên chưa có lượt lưu trú hoạt động.");
    const room = one(db, "rooms", required(body.roomId, "phòng mới"));
    if (room.id === stay.roomId) fail("Vui lòng chọn phòng khác.");
    if (!roomAvailable(db, room, profile, room.roomTypeId))
      fail("Phòng mới không phù hợp hoặc đã đầy.");
    const date = validDate(body.date, "ngày chuyển");
    if (date < stay.startDate) fail("Ngày chuyển không hợp lệ.");
    const originalRoomId = stay.roomId;
    stay.status = "TRANSFERRED";
    stay.actualEndDate = date;
    const next = {
      id: id(),
      studentId: profile.id,
      roomId: room.id,
      startDate: date,
      plannedEndDate: stay.plannedEndDate,
      status: "ACTIVE",
      previousStayId: stay.id,
    };
    db.stays.push(next);
    const item = {
      id: id(),
      studentId: profile.id,
      fromRoomId: originalRoomId,
      toRoomId: room.id,
      date,
      reason: String(required(body.reason, "lý do")),
      handledBy: user.id,
      createdAt: now(),
    };
    db.transfers.push(item);
    notify(
      db,
      profile.userId,
      "Đã chuyển phòng",
      `Phòng mới của bạn: ${room.code}.`,
      "/stays",
    );
    const staffMember = db.staff?.find((s) => s.userId === user.id);
    const fromRoom = db.rooms?.find((r) => r.id === originalRoomId);
    logEvent(db, {
      actorId: user.id,
      actorName: staffMember?.fullName || "Lê Thị Lan",
      actorRole: user.role || "STAFF",
      action: "CHUYỂN PHÒNG SINH VIÊN",
      title: `${staffMember?.fullName || "Nhân viên"} đã phê duyệt chuyển phòng`,
      body: `Chuyển sinh viên ${profile.fullName} (${profile.studentCode || "—"}) từ phòng ${fromRoom?.code || "—"} sang phòng ${room.code}. Lý do: "${item.reason}".`,
      target: `Phòng ${room.code}`,
      tone: "purple",
    });
    return item;
  });
}
async function transfers(user, q) {
  const db = await repo.read(scopes.transfer);
  const own = user.role === "STUDENT" ? student(db, user).id : null;
  return list(
    db.transfers
      .filter((x) => !own || x.studentId === own)
      .map((x) => ({
        ...x,
        student: db.students.find((s) => s.id === x.studentId),
        fromRoom: db.rooms.find((r) => r.id === x.fromRoomId),
        toRoom: db.rooms.find((r) => r.id === x.toRoomId),
      })),
    q,
  );
}

async function readings(q) {
  const db = await repo.read(scopes.readings);
  return list(
    db.readings.map((x) => ({
      ...x,
      room: db.rooms.find((r) => r.id === x.roomId),
      period: db.periods.find((p) => p.id === x.periodId),
    })),
    q,
  );
}
async function readingPrevious(q) {
  const db = await repo.read(scopes.readings);
  const period = one(db, "periods", required(q.periodId, "kỳ thu"));
  one(db, "rooms", required(q.roomId, "phòng"));
  if (!["ELECTRICITY", "WATER"].includes(q.type))
    fail("Loại chỉ số không hợp lệ.");
  const prior = db.readings
    .filter(
      (x) =>
        x.roomId === q.roomId &&
        x.type === q.type &&
        one(db, "periods", x.periodId).month < period.month,
    )
    .sort((a, b) =>
      one(db, "periods", b.periodId).month.localeCompare(
        one(db, "periods", a.periodId).month,
      ),
    )[0];
  return {
    start: prior?.end ?? null,
    previousPeriod: prior ? one(db, "periods", prior.periodId).month : null,
  };
}

async function readingGetByRoomAndPeriod(q) {
  const db = await repo.read(scopes.readings);
  const roomId = required(q.roomId, "phòng");
  const periodId = required(q.periodId, "kỳ thu");
  const period = one(db, "periods", periodId);
  const room = one(db, "rooms", roomId);

  const electricCurrent = db.readings.find(
    (x) => x.roomId === roomId && x.periodId === periodId && x.type === "ELECTRICITY"
  );
  const waterCurrent = db.readings.find(
    (x) => x.roomId === roomId && x.periodId === periodId && x.type === "WATER"
  );

  const priorElectric = db.readings
    .filter(
      (x) =>
        x.roomId === roomId &&
        x.type === "ELECTRICITY" &&
        one(db, "periods", x.periodId).month < period.month
    )
    .sort((a, b) =>
      one(db, "periods", b.periodId).month.localeCompare(one(db, "periods", a.periodId).month)
    )[0];

  const priorWater = db.readings
    .filter(
      (x) =>
        x.roomId === roomId &&
        x.type === "WATER" &&
        one(db, "periods", x.periodId).month < period.month
    )
    .sort((a, b) =>
      one(db, "periods", b.periodId).month.localeCompare(one(db, "periods", a.periodId).month)
    )[0];

  return {
    room: { id: room.id, code: room.code },
    period: { id: period.id, month: period.month },
    electricity: {
      id: electricCurrent?.id || null,
      start: electricCurrent ? electricCurrent.start : (priorElectric?.end ?? 0),
      end: electricCurrent ? electricCurrent.end : "",
      usage: electricCurrent ? electricCurrent.usage : null,
      previousEnd: priorElectric?.end ?? null,
      isExisting: !!electricCurrent,
    },
    water: {
      id: waterCurrent?.id || null,
      start: waterCurrent ? waterCurrent.start : (priorWater?.end ?? 0),
      end: waterCurrent ? waterCurrent.end : "",
      usage: waterCurrent ? waterCurrent.usage : null,
      previousEnd: priorWater?.end ?? null,
      isExisting: !!waterCurrent,
    },
  };
}

async function readingSaveCombined(user, body) {
  return repo.transaction(scopes.readings, (db) => {
    const room = one(db, "rooms", required(body.roomId, "phòng"));
    const period = one(db, "periods", required(body.periodId, "kỳ thu"));

    const results = [];
    const configs = [
      { key: "electricity", type: "ELECTRICITY", label: "Điện" },
      { key: "water", type: "WATER", label: "Nước" },
    ];

    let hasUpdate = false;

    for (const item of configs) {
      const data = body[item.key];
      if (!data || data.end === undefined || data.end === "" || data.end === null) continue;

      const end = positive(data.end, `Chỉ số cuối ${item.label}`, true);

      const prior = db.readings
        .filter(
          (x) =>
            x.roomId === room.id &&
            x.type === item.type &&
            one(db, "periods", x.periodId).month < period.month
        )
        .sort((a, b) =>
          one(db, "periods", b.periodId).month.localeCompare(one(db, "periods", a.periodId).month)
        )[0];

      const existing = db.readings.find(
        (x) => x.roomId === room.id && x.periodId === period.id && x.type === item.type
      );

      let start;
      if (data.start !== undefined && data.start !== "" && data.start !== null) {
        start = positive(data.start, `Chỉ số đầu ${item.label}`, true);
      } else if (existing) {
        start = existing.start;
      } else if (prior) {
        start = prior.end;
      } else {
        start = 0;
      }

      if (end < start) {
        fail(`Chỉ số cuối ${item.label} (${end}) không được nhỏ hơn chỉ số đầu (${start}).`);
      }

      if (existing) {
        hasUpdate = true;
        existing.start = start;
        existing.end = end;
        existing.usage = end - start;
        existing.updatedAt = now();
        existing.enteredBy = user.id;
        results.push(existing);
      } else {
        const newRecord = {
          id: id(),
          roomId: room.id,
          periodId: period.id,
          type: item.type,
          start,
          end,
          usage: end - start,
          enteredBy: user.id,
          createdAt: now(),
        };
        db.readings.push(newRecord);
        results.push(newRecord);
      }
    }

    if (!results.length) {
      fail("Vui lòng nhập chỉ số cuối cho ít nhất một loại điện hoặc nước.");
    }

    const staffMember = db.staff?.find((s) => s.userId === user.id);
    logEvent(db, {
      actorId: user.id,
      actorName: staffMember?.fullName || "Quản trị viên",
      actorRole: user.role || "STAFF",
      action: hasUpdate ? "CẬP NHẬT CHỈ SỐ ĐIỆN NƯỚC" : "GHI CHỈ SỐ ĐIỆN NƯỚC",
      title: `${staffMember?.fullName || "Nhân viên"} đã ${hasUpdate ? "cập nhật" : "ghi"} chỉ số phòng ${room.code}`,
      body: `Chốt chỉ số điện nước cho kỳ ${period.month} phòng ${room.code}.`,
      target: `Phòng ${room.code}`,
      tone: "slate",
    });

    return results;
  });
}

async function readingCreate(user, body) {
  return repo.transaction(scopes.readings, (db) => {
    const room = one(db, "rooms", required(body.roomId, "phòng"));
    const period = one(db, "periods", required(body.periodId, "kỳ thu"));
    if (!["ELECTRICITY", "WATER"].includes(body.type))
      fail("Loại chỉ số không hợp lệ.");
    const prior = db.readings
      .filter(
        (x) =>
          x.roomId === room.id &&
          x.type === body.type &&
          one(db, "periods", x.periodId).month < period.month,
      )
      .sort((a, b) =>
        one(db, "periods", b.periodId).month.localeCompare(
          one(db, "periods", a.periodId).month,
        ),
      )[0];
    const start = prior
        ? prior.end
        : positive(body.start ?? 0, "Chỉ số đầu", true),
      end = positive(body.end, "Chỉ số cuối", true);
    if (end < start) fail("Chỉ số cuối không được nhỏ hơn chỉ số đầu kỳ.");
    const existing = db.readings.find(
      (x) =>
        x.roomId === room.id &&
        x.periodId === period.id &&
        x.type === body.type,
    );
    if (existing) {
      existing.start = start;
      existing.end = end;
      existing.usage = end - start;
      existing.updatedAt = now();
      existing.enteredBy = user.id;
      return existing;
    }
    const item = {
      id: id(),
      roomId: room.id,
      periodId: period.id,
      type: body.type,
      start,
      end,
      usage: end - start,
      enteredBy: user.id,
      createdAt: now(),
    };
    db.readings.push(item);
    const staffMember = db.staff?.find((s) => s.userId === user.id);
    logEvent(db, {
      actorId: user.id,
      actorName: staffMember?.fullName || "Thầy Đỗ Thành Nam",
      actorRole: user.role || "STAFF",
      action: "GHI CHỈ SỐ ĐIỆN NƯỚC",
      title: `${staffMember?.fullName || "Nhân viên"} đã ghi chỉ số phòng ${room.code}`,
      body: `Chốt chỉ số ${item.type === "ELECTRICITY" ? "Điện" : "Nước"} từ ${start} đến ${end} (Sản lượng: ${item.usage}) cho kỳ ${period.month}.`,
      target: `Phòng ${room.code}`,
      tone: "slate",
    });
    return item;
  });
}
function billingPreview(db, periodId) {
  const period = one(db, "periods", periodId, "Kỳ thu");
  const pricing =
    db.pricing
      .filter((x) => x.effectiveFrom <= period.month + "-01")
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0] ||
    db.pricing.at(-1);
  if (!pricing) fail("Chưa có đơn giá.");
  const { periodStart, periodEnd, daysInMonth } = getPeriodDateRange(period.month);
  const missing = [],
    items = [];
  for (const room of db.rooms) {
    if (room.status !== "ACTIVE") continue;

    const eligibleStays = [];
    for (const stay of db.stays) {
      if (stay.roomId !== room.id) continue;
      const days = stayDaysInPeriod(stay, periodStart, periodEnd, daysInMonth);
      if (days <= 0) continue;
      const start = stay.startDate > periodStart ? stay.startDate : periodStart;
      const end =
        (stay.actualEndDate || stay.plannedEndDate || "9999-12-31") < periodEnd
          ? stay.actualEndDate || stay.plannedEndDate
          : periodEnd;
      eligibleStays.push({ stay, daysStayed: days, start, end });
    }

    if (!eligibleStays.length) continue;
    eligibleStays.sort((a, b) => a.stay.studentId.localeCompare(b.stay.studentId));

    const electric = db.readings.find(
      (x) =>
        x.roomId === room.id &&
        x.periodId === periodId &&
        x.type === "ELECTRICITY",
    );
    const water = db.readings.find(
      (x) =>
        x.roomId === room.id && x.periodId === periodId && x.type === "WATER",
    );
    if (!electric || !water) {
      missing.push({
        roomId: room.id,
        roomCode: room.code,
        types: [!electric && "Điện", !water && "Nước"].filter(Boolean),
      });
      continue;
    }
    const type = one(db, "roomTypes", room.roomTypeId);
    const baseElectric = money(electric.usage * pricing.electricity);
    const baseWater = money(water.usage * pricing.water);
    const monthlyRoomFee = money(pricing.roomFees?.[type.id] ?? type.fee);
    const totalPersonDays = eligibleStays.reduce((acc, curr) => acc + curr.daysStayed, 0);

    let allocatedElectric = 0;
    let allocatedWater = 0;

    eligibleStays.forEach((item, i) => {
      const { stay, daysStayed, start, end } = item;
      const roomFee =
        daysStayed >= daysInMonth
          ? monthlyRoomFee
          : money(Math.round((monthlyRoomFee * daysStayed) / daysInMonth));

      let elecFee;
      let watFee;
      if (i === eligibleStays.length - 1) {
        elecFee = Math.max(0, baseElectric - allocatedElectric);
        watFee = Math.max(0, baseWater - allocatedWater);
      } else {
        elecFee =
          totalPersonDays > 0
            ? money(Math.round((baseElectric * daysStayed) / totalPersonDays))
            : 0;
        watFee =
          totalPersonDays > 0
            ? money(Math.round((baseWater * daysStayed) / totalPersonDays))
            : 0;
        allocatedElectric += elecFee;
        allocatedWater += watFee;
      }

      if (
        db.invoices.some(
          (x) => x.studentId === stay.studentId && x.periodId === periodId,
        )
      ) {
        return;
      }

      // Kiểm tra các khoản phạt gia hạn / trả phòng trễ hạn áp dụng vào kỳ này
      const stayPenalties = (stay.penalties || []).filter(
        (p) =>
          !p.billed &&
          (p.periodMonth === period.month ||
            (p.date && p.date.slice(0, 7) === period.month)),
      );
      const penaltyFee = stayPenalties.reduce(
        (sum, p) => sum + (p.amount || 0),
        0,
      );
      const penaltyDays = stayPenalties.reduce(
        (sum, p) => sum + (p.days || 0),
        0,
      );

      const studentObj = db.students.find((s) => s.id === stay.studentId);
      items.push({
        studentId: stay.studentId,
        studentName: studentObj?.fullName || "Sinh viên",
        roomId: room.id,
        periodId,
        dueDate: period.dueDate,
        snapshot: {
          roomCode: room.code,
          roomTypeName: type.name,
          occupants: eligibleStays.length,
          daysStayed,
          daysInMonth,
          totalPersonDays,
          stayStartInPeriod: start,
          stayEndInPeriod: end,
          monthlyRoomFee,
          roomFee,
          penaltyFee,
          penaltyDays,
          penaltyDetails: stayPenalties.map((p) => ({
            days: p.days,
            amount: p.amount,
            reason: p.reason,
          })),
          electricityRate: pricing.electricity,
          waterRate: pricing.water,
          electricStart: electric.start,
          electricEnd: electric.end,
          electricUsage: electric.usage,
          waterStart: water.start,
          waterEnd: water.end,
          waterUsage: water.usage,
          electricityRoomTotal: baseElectric,
          waterRoomTotal: baseWater,
        },
        roomFee,
        electricityFee: elecFee,
        waterFee: watFee,
        penaltyFee: penaltyFee || 0,
        total: money(roomFee + elecFee + watFee + (penaltyFee || 0)),
      });
    });
  }
  return { items, missing, period };
}
async function preview(periodId) {
  return billingPreview(await repo.read(scopes.billing), periodId);
}
async function issue(user, periodId) {
  return repo.transaction(scopes.billing, (db) => {
    const result = billingPreview(db, periodId);
    if (result.missing.length)
      fail(
        `Thiếu chỉ số: ${result.missing.map((x) => `${x.roomCode} (${x.types.join(", ")})`).join("; ")}.`,
      );
    if (!result.items.length) fail("Không có hóa đơn mới để lập.");
    const created = result.items.map((x) => ({
      id: id(),
      ...x,
      issuedAt: now(),
      issuedBy: user.id,
    }));
    db.invoices.push(...created);
    for (const item of created) {
      const stay = db.stays.find(
        (s) => s.studentId === item.studentId && s.roomId === item.roomId,
      );
      if (stay && stay.penalties) {
        for (const p of stay.penalties) {
          if (
            !p.billed &&
            (p.periodMonth === result.period.month ||
              (p.date && p.date.slice(0, 7) === result.period.month))
          ) {
            p.billed = true;
          }
        }
      }
    }
    created.forEach((x) =>
      notify(
        db,
        one(db, "students", x.studentId).userId,
        "Hóa đơn mới",
        `Hóa đơn kỳ ${result.period.month}: ${x.total.toLocaleString("vi-VN")} ₫.`,
        `/invoices/${x.id}`,
      ),
    );
    const staffMember = db.staff?.find((s) => s.userId === user.id);
    logEvent(db, {
      actorId: user.id,
      actorName: staffMember?.fullName || "Lê Thị Lan",
      actorRole: user.role || "STAFF",
      action: "PHÁT HÀNH HÓA ĐƠN",
      title: `${staffMember?.fullName || "Nhân viên"} đã phát hành hóa đơn kỳ ${result.period.month}`,
      body: `Đã phát hành ${created.length} hóa đơn cho toàn bộ sinh viên lưu trú kỳ ${result.period.month}. Hạn nộp: ${result.period.dueDate}.`,
      target: `Kỳ ${result.period.month}`,
      tone: "amber",
    });
    return created;
  });
}
async function invoices(user, q) {
  const db = await repo.read(scopes.invoices);
  const own = user.role === "STUDENT" ? student(db, user).id : null;
  return list(
    db.invoices
      .filter((x) => !own || x.studentId === own)
      .map((x) => invoiceView(db, x))
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)),
    q,
  );
}
async function invoiceDetail(user, targetId) {
  const db = await repo.read(scopes.invoices),
    invoice = one(db, "invoices", targetId, "Hóa đơn");
  if (user.role === "STUDENT" && invoice.studentId !== student(db, user).id)
    fail("Không có quyền xem hóa đơn này.", 403);
  return invoiceView(db, invoice);
}
async function paymentCreate(user, body) {
  return repo.transaction(scopes.payment, (db) => {
    const invoice = one(db, "invoices", required(body.invoiceId, "hóa đơn"));
    const amount = positive(body.amount, "Số tiền");
    const balance = invoice.total - paid(db, invoice.id);
    if (amount > balance) fail("Số tiền thu vượt quá số dư hóa đơn.");
    if (!["CASH", "TRANSFER"].includes(body.method))
      fail("Phương thức thanh toán không hợp lệ.");
    const pDate = validDate(body.date, "ngày thu");
    const pId = id();
    const receiptNo =
      "PT-" +
      pDate.replace(/-/g, "") +
      "-" +
      pId.replace(/[^0-9]/g, "").slice(-4).padStart(4, "0");
    const item = {
      id: pId,
      invoiceId: invoice.id,
      amount,
      date: pDate,
      method: body.method,
      note: body.note || "",
      recordedBy: user.id,
      receiptNumber: receiptNo,
      createdAt: now(),
    };
    db.payments.push(item);
    notify(
      db,
      one(db, "students", invoice.studentId).userId,
      "Đã ghi nhận thanh toán",
      `Đã thu ${amount.toLocaleString("vi-VN")} ₫ cho hóa đơn.`,
      `/invoices/${invoice.id}`,
    );
    const staffMember = db.staff?.find((s) => s.userId === user.id);
    const stu = db.students?.find((s) => s.id === invoice.studentId);
    const room = db.rooms?.find((r) => r.id === invoice.roomId);
    logEvent(db, {
      actorId: user.id,
      actorName: staffMember?.fullName || "NV Thu ngân KTX",
      actorRole: user.role || "STAFF",
      action: "XÁC NHẬN THANH TOÁN",
      title: `${staffMember?.fullName || "Nhân viên"} đã thu tiền phòng & điện nước`,
      body: `Đã thu ${amount.toLocaleString("vi-VN")} đ (${body.method === "TRANSFER" ? "Chuyển khoản" : "Tiền mặt"}) từ SV ${stu?.fullName || "Sinh viên"} (MSSV: ${stu?.studentCode || "—"}), phòng ${room?.code || "—"}. Biên lai: ${receiptNo}.`,
      target: room ? `Phòng ${room.code}` : "Thanh toán",
      tone: "green",
    });
    return item;
  });
}
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
async function notifications(user, q) {
  let db = await repo.read(scopes.notifications);
  if (hasNewDueNotice(db)) {
    await repo.transaction(scopes.notifications, (db) => {
      for (const invoice of db.invoices) {
        const balance = invoice.total - paid(db, invoice.id);
        if (balance <= 0) continue;
        const days = Math.ceil(
          (new Date(`${invoice.dueDate}T00:00:00Z`) -
            new Date(`${today()}T00:00:00Z`)) /
            86400000,
        );
        const kind = days < 0 ? "OVERDUE" : days <= 3 ? "DUE" : null;
        const key = kind && `${kind}:${invoice.id}`;
        if (key && !db.notifications.some((x) => x.key === key)) {
          const owner = db.students.find((x) => x.id === invoice.studentId);
          if (owner) {
            notify(
              db,
              owner.userId,
              days < 0 ? "Hóa đơn quá hạn" : "Hóa đơn sắp đến hạn",
              `Hóa đơn phòng ${invoice.snapshot.roomCode} còn ${balance.toLocaleString("vi-VN")} ₫, hạn ${invoice.dueDate.slice(8, 10)}/${invoice.dueDate.slice(5, 7)}/${invoice.dueDate.slice(0, 4)}.`,
              `/invoices/${invoice.id}`,
            );
            db.notifications[0].key = key;
          }
        }
      }
    });
    db = await repo.read(scopes.notifications);
  }
  const own = db.notifications.filter((x) => x.userId === user.id);
  return {
    ...list(
      own.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      q,
    ),
    unreadCount: own.filter((x) => !x.read).length,
  };
}
async function readNotification(user, targetId) {
  return repo.transaction(scopes.notifications, (db) => {
    const item = one(db, "notifications", targetId, "Thông báo");
    if (item.userId !== user.id) fail("Không có quyền.", 403);
    item.read = true;
    return item;
  });
}

async function readAllNotifications(user) {
  return repo.transaction(scopes.notifications, (db) => {
    const list = (db.notifications || []).filter(
      (x) => x.userId === user.id && !x.read,
    );
    for (const item of list) {
      item.read = true;
    }
    return { updated: list.length };
  });
}

async function deleteNotification(user, targetId) {
  return repo.transaction(scopes.notifications, (db) => {
    const index = (db.notifications || []).findIndex((x) => x.id === targetId);
    if (index === -1) fail("Thông báo không tồn tại.", 404);
    if (db.notifications[index].userId !== user.id)
      fail("Không có quyền.", 403);
    db.notifications.splice(index, 1);
    return { success: true };
  });
}
// ==============================================================================
// PHÂN HỆ QUẢN TRỊ TÀI KHOẢN VÀ NGƯỜI DÙNG DÀNH CHO ADMIN
// ==============================================================================

// Lấy danh sách toàn bộ tài khoản người dùng cho Quản trị viên (Admin User List)
async function usersList(q) {
  const db = await repo.read(scopes.account);
  const items = db.users.map((u) => {
    let profile = null;
    let code = "—";
    let fullName = "—";
    let phone = "—";
    if (u.role === "STUDENT") {
      profile = db.students.find((s) => s.userId === u.id);
      if (profile) {
        code = profile.studentCode || "—";
        fullName = profile.fullName || "—";
        phone = profile.phone || "—";
      }
    } else {
      profile = db.staff.find((s) => s.userId === u.id);
      if (profile) {
        code = profile.staffCode || "—";
        fullName = profile.fullName || "—";
        phone = profile.phone || "—";
      }
    }
    return {
      id: u.id,
      email: u.email,
      role: u.role,
      active: u.active,
      code,
      fullName,
      phone,
      profile,
    };
  });
  return list(items, q);
}

// Đặt lại mật khẩu tài khoản người dùng bất kỳ (Admin Reset Password)
async function userResetPassword(targetUserId, newPassword) {
  if (
    typeof newPassword !== "string" ||
    !newPassword.trim() ||
    newPassword.length < 8
  )
    fail("Mật khẩu mới cần ít nhất 8 ký tự.");
  if (Buffer.byteLength(newPassword, "utf8") > 72)
    fail("Mật khẩu quá dài. Vui lòng dùng tối đa 72 byte.");
  const passwordHash = bcrypt.hashSync(newPassword, 10);
  return repo.transaction(scopes.account, (db) => {
    const user = one(db, "users", targetUserId, "Tài khoản");
    user.passwordHash = passwordHash;
    logEvent(db, {
      actorId: "u-admin-1",
      actorName: "ThS. Nguyễn Hoàng Long",
      actorRole: "ADMIN",
      action: "ĐẶT LẠI MẬT KHẨU",
      title: `Quản trị viên đã đặt lại mật khẩu cho tài khoản ${user.email}`,
      body: `Đã cập nhật mật khẩu mới an toàn cho tài khoản (${user.role === "STUDENT" ? "Sinh viên" : user.role === "STAFF" ? "Nhân viên" : "Quản trị viên"}).`,
      target: user.email,
      tone: "purple",
    });
    return publicUser(user);
  });
}

// Thay đổi trạng thái kích hoạt hoặc khóa tài khoản (Admin Toggle Status)
async function userSetStatus(targetUserId, active) {
  const isActive = Boolean(active);
  return repo.transaction(scopes.account, (db) => {
    const user = one(db, "users", targetUserId, "Tài khoản");
    if (
      !isActive &&
      user.role === "ADMIN" &&
      db.users.filter((x) => x.role === "ADMIN" && x.active).length <= 1
    ) {
      fail("Không thể khóa quản trị viên đang hoạt động duy nhất.");
    }
    user.active = isActive;
    logEvent(db, {
      actorId: "u-admin-1",
      actorName: "ThS. Nguyễn Hoàng Long",
      actorRole: "ADMIN",
      action: isActive ? "KÍCH HOẠT TÀI KHOẢN" : "KHÓA TÀI KHOẢN",
      title: `Quản trị viên đã ${isActive ? "kích hoạt" : "khóa"} tài khoản ${user.email}`,
      body: `Chuyển trạng thái tài khoản sang: ${isActive ? "Đang hoạt động" : "Đã khóa"}.`,
      target: user.email,
      tone: isActive ? "green" : "rose",
    });
    return publicUser(user);
  });
}

// Lấy mã định danh khả dụng tiếp theo theo vai trò (Sinh viên, Nhân viên, Quản trị viên)
async function getNextCode(role) {
  const db = await repo.read(scopes.account);
  if (role === "STUDENT") {
    return { code: generateStudentCode(db) };
  }
  if (role === "STAFF") {
    return { code: generatePrefixCode(db.staff, "staffCode", "NV", 3) };
  }
  if (role === "ADMIN") {
    return { code: generatePrefixCode(db.staff, "staffCode", "AD", 3) };
  }
  fail("Vai trò không hợp lệ.");
}

// Tạo tài khoản mới từ phía Quản trị viên (Admin Create User)
async function userCreate(body) {
  const email = String(required(body.email, "email")).trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) fail("Email không hợp lệ.");
  const role = required(body.role, "vai trò");
  if (!["STUDENT", "STAFF", "ADMIN"].includes(role))
    fail("Vai trò không hợp lệ.");
  if (
    typeof body.password !== "string" ||
    !body.password.trim() ||
    body.password.length < 8
  )
    fail("Mật khẩu cần ít nhất 8 ký tự.");
  const passwordHash = bcrypt.hashSync(body.password, 10);

  return repo.transaction(scopes.account, (db) => {
    unique(db, "users", "email", email);
    const userId =
      role === "STUDENT"
        ? nextSequentialId(db, "users", "u-student-")
        : role === "STAFF"
          ? nextSequentialId(db, "users", "u-staff-")
          : nextSequentialId(db, "users", "u-admin-");
    const user = {
      id: userId,
      email,
      passwordHash,
      role,
      active: true,
    };
    db.users.push(user);
    logEvent(db, {
      actorId: "u-admin-1",
      actorName: "ThS. Nguyễn Hoàng Long",
      actorRole: "ADMIN",
      action: "TẠO TÀI KHOẢN",
      title: `Quản trị viên tạo tài khoản mới ${email}`,
      body: `Khởi tạo thành công tài khoản người dùng với vai trò ${role === "STUDENT" ? "Sinh viên" : role === "STAFF" ? "Nhân viên" : "Quản trị viên"}.`,
      target: email,
      tone: "blue",
    });

    if (role === "STUDENT") {
      const studentCode = String(
        body.code || body.studentCode || generateStudentCode(db),
      ).trim();
      unique(db, "students", "studentCode", studentCode);
      const studentItem = {
        id: nextSequentialId(db, "students", "sv-"),
        userId,
        studentCode,
        fullName: String(required(body.fullName, "họ tên")),
        gender: body.gender || "MALE",
        faculty: body.faculty || "Chưa cập nhật",
        course: body.course || "K21",
        phone: body.phone || "",
        address: body.address || "",
        contact: body.phone || "",
      };
      db.students.push(studentItem);
      return { ...studentItem, user: publicUser(user) };
    } else {
      const defaultPrefix = role === "ADMIN" ? "AD" : "NV";
      const staffCode = String(
        body.code ||
          body.staffCode ||
          generatePrefixCode(db.staff, "staffCode", defaultPrefix, 3),
      ).trim();
      unique(db, "staff", "staffCode", staffCode);
      const staffItem = {
        id: id(),
        userId,
        staffCode,
        fullName: String(required(body.fullName, "họ tên")),
        phone: body.phone || "",
      };
      db.staff.push(staffItem);
      return { ...staffItem, user: publicUser(user) };
    }
  });
}

// Xóa vĩnh viễn tài khoản người dùng và kiểm tra chặt chẽ toàn bộ ràng buộc nghiệp vụ (Admin Delete User)
async function userDelete(targetUserId, actor) {
  return repo.transaction(scopes.userDelete, (db) => {
    const user = one(db, "users", targetUserId, "Tài khoản");

    // 1. Không cho phép tự xóa tài khoản của chính mình đang đăng nhập
    if (actor && user.id === actor.id) {
      fail("Không thể xóa tài khoản của chính bạn đang đăng nhập.");
    }

    // 2. Không cho phép xóa Quản trị viên duy nhất trong hệ thống
    if (user.role === "ADMIN") {
      const remainingAdmins = db.users.filter(
        (x) => x.role === "ADMIN" && x.id !== user.id,
      ).length;
      if (remainingAdmins < 1) {
        fail("Không thể xóa quản trị viên duy nhất trong hệ thống.");
      }
    }

    // 3. Kiểm tra ràng buộc đối với Sinh viên (STUDENT)
    if (user.role === "STUDENT") {
      const studentProfile = db.students.find((s) => s.userId === user.id);
      if (studentProfile) {
        // Kiểm tra hợp đồng lưu trú phòng (stays)
        const hasActiveStay = (db.stays || []).some(
          (s) => s.studentId === studentProfile.id && s.status === "ACTIVE",
        );
        if (hasActiveStay) {
          fail(
            "Không thể xóa: Sinh viên hiện đang lưu trú tại phòng KTX. Vui lòng làm thủ tục trả phòng trước khi xóa tài khoản.",
          );
        }

        // Kiểm tra hóa đơn chưa thanh toán hoặc công nợ (invoices)
        const studentInvoices = (db.invoices || []).filter(
          (inv) => inv.studentId === studentProfile.id,
        );
        const hasUnpaidInvoice = studentInvoices.some((inv) => {
          const paidAmount = (db.payments || [])
            .filter((p) => p.invoiceId === inv.id)
            .reduce((sum, p) => sum + (p.amount || 0), 0);
          return (inv.total || 0) - paidAmount > 0;
        });
        if (hasUnpaidInvoice) {
          fail(
            "Không thể xóa: Sinh viên còn hóa đơn chưa thanh toán hoặc công nợ tồn đọng.",
          );
        }

        // Kiểm tra hồ sơ đăng ký phòng chờ duyệt (applications)
        const hasPendingApp = (db.applications || []).some(
          (app) =>
            app.studentId === studentProfile.id &&
            ["PENDING", "REVIEWING", "NEEDS_INFO"].includes(app.status),
        );
        if (hasPendingApp) {
          fail(
            "Không thể xóa: Sinh viên đang có hồ sơ đăng ký phòng đang trong quá trình xét duyệt.",
          );
        }

        // Kiểm tra yêu cầu hỗ trợ chưa giải quyết (requests)
        const hasPendingReq = (db.requests || []).some(
          (req) =>
            req.studentId === studentProfile.id &&
            !["APPROVED", "RESOLVED", "CLOSED", "REJECTED"].includes(req.status),
        );
        if (hasPendingReq) {
          fail(
            "Không thể xóa: Sinh viên đang có yêu cầu hỗ trợ hoặc báo hỏng chưa hoàn thành.",
          );
        }

        // Xóa hồ sơ sinh viên và dọn dẹp dữ liệu liên quan để tránh dữ liệu mồ côi
        const studentIndex = db.students.findIndex(
          (s) => s.id === studentProfile.id,
        );
        if (studentIndex !== -1) {
          db.students.splice(studentIndex, 1);
        }
        const studentInvoiceIds = new Set(studentInvoices.map((i) => i.id));
        db.payments = (db.payments || []).filter(
          (p) => !studentInvoiceIds.has(p.invoiceId),
        );
        db.stays = (db.stays || []).filter((s) => s.studentId !== studentProfile.id);
        db.requests = (db.requests || []).filter((r) => r.studentId !== studentProfile.id);
        db.applications = (db.applications || []).filter((a) => a.studentId !== studentProfile.id);
        db.invoices = (db.invoices || []).filter((i) => i.studentId !== studentProfile.id);
      }
    }

    // 4. Kiểm tra ràng buộc đối với Nhân viên (STAFF)
    if (user.role === "STAFF") {
      const staffProfile = db.staff.find((st) => st.userId === user.id);
      if (staffProfile) {
        // Kiểm tra phân công xử lý yêu cầu chưa hoàn thành (requests)
        const hasAssignedReq = (db.requests || []).some(
          (req) =>
            req.assignedTo === staffProfile.id &&
            !["APPROVED", "RESOLVED", "CLOSED", "REJECTED"].includes(req.status),
        );
        if (hasAssignedReq) {
          fail(
            "Không thể xóa: Nhân viên đang được phân công xử lý các yêu cầu hỗ trợ chưa hoàn thành.",
          );
        }

        // Xóa hồ sơ nhân viên
        const staffIndex = db.staff.findIndex((st) => st.id === staffProfile.id);
        if (staffIndex !== -1) {
          db.staff.splice(staffIndex, 1);
        }
      }
    }

    // 5. Nếu là Quản trị viên (ADMIN), xóa profile trong db.staff nếu có
    if (user.role === "ADMIN") {
      const adminStaffProfiles = (db.staff || []).filter(
        (st) => st.userId === user.id,
      );
      for (const st of adminStaffProfiles) {
        const idx = db.staff.findIndex((x) => x.id === st.id);
        if (idx !== -1) db.staff.splice(idx, 1);
      }
    }

    // 6. Xóa tài khoản khỏi danh sách users
    const userIndex = db.users.findIndex((u) => u.id === user.id);
    if (userIndex !== -1) {
      db.users.splice(userIndex, 1);
    }

    // 7. Ghi nhật ký hoạt động hệ thống
    logEvent(db, {
      actorId: actor?.id || "u-admin-1",
      actorName: actor?.name || actor?.fullName || "Quản trị viên",
      actorRole: "ADMIN",
      action: "XÓA TÀI KHOẢN",
      title: `Quản trị viên đã xóa vĩnh viễn tài khoản ${user.email}`,
      body: `Đã xóa tài khoản (${user.role === "STUDENT" ? "Sinh viên" : user.role === "STAFF" ? "Nhân viên" : "Quản trị viên"}) và các hồ sơ liên quan sau khi xác minh không còn ràng buộc nghiệp vụ.`,
      target: user.email,
      tone: "rose",
    });

    return {
      success: true,
      id: user.id,
      email: user.email,
      message: `Đã xóa tài khoản ${user.email} thành công.`,
    };
  });
}

async function staffList(q) {
  const db = await repo.read(scopes.staff);
  return list(
    db.staff.map((x) => ({
      ...x,
      user: publicUser(one(db, "users", x.userId)),
    })),
    q,
  );
}
async function staffWrite(body, targetId) {
  // An empty password during editing preserves the existing hash.
  const changePassword =
    !targetId || (body.password !== undefined && body.password !== "");
  let passwordHash;
  if (changePassword) {
    if (
      typeof body.password !== "string" ||
      !body.password.trim() ||
      body.password.length < 8
    )
      fail("Mật khẩu cần ít nhất 8 ký tự.");
    if (Buffer.byteLength(body.password, "utf8") > 72)
      fail(
        "Mật khẩu quá dài. Vui lòng dùng tối đa 72 byte (ký tự có dấu có thể chiếm nhiều byte).",
      );
    passwordHash = bcrypt.hashSync(body.password, 10);
  }
  return repo.transaction(scopes.staff, (db) => {
    if (!targetId) {
      const email = String(required(body.email, "email")).trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) fail("Email không hợp lệ.");
      unique(db, "users", "email", email);
      unique(
        db,
        "staff",
        "staffCode",
        required(body.staffCode, "mã nhân viên"),
      );
      const user = {
        id: id(),
        email,
        passwordHash,
        role: body.role === "ADMIN" ? "ADMIN" : "STAFF",
        active: true,
      };
      const item = {
        id: id(),
        userId: user.id,
        staffCode: body.staffCode,
        fullName: String(required(body.fullName, "họ tên")),
        phone: body.phone || "",
      };
      db.users.push(user);
      db.staff.push(item);
      return { ...item, user: publicUser(user) };
    }
    const item = one(db, "staff", targetId),
      account = one(db, "users", item.userId);
    if (body.email !== undefined) {
      const email = String(required(body.email, "email")).trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) fail("Email không hợp lệ.");
      unique(db, "users", "email", email, account.id);
      account.email = email;
    }
    if (changePassword) account.passwordHash = passwordHash;
    for (const field of ["fullName", "phone"])
      if (body[field] !== undefined)
        item[field] = String(
          field === "fullName" ? required(body[field], "họ tên") : body[field],
        );
    if (body.role) {
      if (!["STAFF", "ADMIN"].includes(body.role))
        fail("Vai trò không hợp lệ.");
      if (
        account.role === "ADMIN" &&
        body.role !== "ADMIN" &&
        db.users.filter((x) => x.role === "ADMIN" && x.active).length <= 1
      )
        fail("Không thể hạ quyền quản trị viên duy nhất.");
      account.role = body.role;
    }
    if (body.active !== undefined) {
      if (
        !body.active &&
        account.role === "ADMIN" &&
        db.users.filter((x) => x.role === "ADMIN" && x.active).length <= 1
      )
        fail("Không thể khóa quản trị viên duy nhất.");
      account.active = Boolean(body.active);
    }
    return { ...item, user: publicUser(account) };
  });
}
// Đây là ghi chú mẫu: Định dạng dữ liệu sinh viên kèm thông tin lượt lưu trú và phòng ở đầy đủ chi tiết
const studentView = (db, x) => {
  const stay = activeStay(db, x.id);
  const rawRoom = stay ? db.rooms.find((r) => r.id === stay.roomId) : null;
  const room = rawRoom ? roomView(db, rawRoom) : null;
  return {
    ...x,
    stay: stay ? { ...stay, room } : null,
    room,
    status: stay ? "ACTIVE" : "INACTIVE",
    applications: db.applications.filter((a) => a.studentId === x.id),
    stays: db.stays.filter((s) => s.studentId === x.id),
    requests: db.requests.filter((r) => r.studentId === x.id),
    transfers: db.transfers.filter((t) => t.studentId === x.id),
  };
};
async function studentDetail(user, targetId) {
  const db = await repo.read(scopes.students);
  const profile = one(db, "students", targetId, "Sinh viên");
  if (user.role === "STUDENT" && profile.id !== student(db, user).id)
    fail("Không có quyền xem sinh viên này.", 403);
  return studentView(db, profile);
}
async function students(user, q) {
  const db = await repo.read(scopes.students);
  const own = user.role === "STUDENT" ? student(db, user).id : null;
  return list(
    db.students
      .filter((x) => !own || x.id === own)
      .map((x) => studentView(db, x)),
    q,
  );
}
async function report(user, q) {
  const db = await repo.read(scopes.report);
  const roomSet = db.rooms.filter(
    (x) => !q.buildingId || x.buildingId === q.buildingId,
  );
  const available = roomSet.filter((x) => x.status === "ACTIVE");
  const capacity = available.reduce((a, x) => a + x.operationalCapacity, 0),
    occupied = available.reduce((a, x) => a + occupants(db, x.id), 0);
  const bills = db.invoices.filter(
    (x) =>
      (!q.periodId || x.periodId === q.periodId) &&
      (!q.buildingId || roomSet.some((r) => r.id === x.roomId)),
  );
  const total = bills.reduce((a, x) => a + x.total, 0),
    collected = bills.reduce((a, x) => a + paid(db, x.id), 0);
  return {
    rooms: roomSet.length,
    capacity,
    occupied,
    vacant: Math.max(0, capacity - occupied),
    occupancyRate: capacity ? Math.round((occupied / capacity) * 100) : 0,
    activeStudents: db.stays.filter(
      (x) => x.status === "ACTIVE" && roomSet.some((r) => r.id === x.roomId),
    ).length,
    billed: total,
    collected,
    outstanding: total - collected,
    pendingApplications: db.applications.filter((x) =>
      ["PENDING", "REVIEWING", "NEEDS_INFO"].includes(x.status),
    ).length,
    pendingRequests: db.requests.filter((x) => x.status === "PENDING").length,
    byBuilding: db.buildings
      .filter((b) => !q.buildingId || b.id === q.buildingId)
      .map((b) => {
        const rooms = db.rooms.filter(
          (r) => r.buildingId === b.id && r.status === "ACTIVE",
        );
        const cap = rooms.reduce((a, r) => a + r.operationalCapacity, 0);
        const occ = rooms.reduce((a, r) => a + occupants(db, r.id), 0);
        return { name: b.name, capacity: cap, occupied: occ };
      }),
  };
}

async function workQueue() {
  const db = await repo.read(scopes.workQueue);
  const currentPeriod = db.periods
    .filter((item) => item.status === "ACTIVE" && item.issueDate <= today())
    .sort((a, b) => b.month.localeCompare(a.month))[0];
  const occupiedRooms = currentPeriod
    ? (() => {
        const { periodStart, periodEnd, daysInMonth } = getPeriodDateRange(
          currentPeriod.month,
        );
        return db.rooms.filter(
          (room) =>
            room.status === "ACTIVE" &&
            db.stays.some(
              (stay) =>
                stay.roomId === room.id &&
                stayDaysInPeriod(stay, periodStart, periodEnd, daysInMonth) > 0,
            ),
        );
      })()
    : db.rooms.filter(
        (room) => room.status === "ACTIVE" && occupants(db, room.id) > 0,
      );
  const missingReadings = currentPeriod
    ? occupiedRooms.filter((room) =>
        ["ELECTRICITY", "WATER"].some(
          (type) =>
            !db.readings.some(
              (item) =>
                item.roomId === room.id &&
                item.periodId === currentPeriod.id &&
                item.type === type,
            ),
        ),
      ).length
    : 0;
  const readyInvoices =
    currentPeriod && !missingReadings && db.pricing.length
      ? billingPreview(db, currentPeriod.id).items.length
      : 0;
  const version = crypto
    .createHash("sha256")
    .update(
      JSON.stringify([
        db.applications
          .map((item) => [item.id, item.status, item.updatedAt, item.handledAt])
          .sort((a, b) => a[0].localeCompare(b[0])),
        db.requests
          .map((item) => [item.id, item.status, item.handledAt])
          .sort((a, b) => a[0].localeCompare(b[0])),
        db.invoices
          .map((item) => [item.id, item.total, paid(db, item.id)])
          .sort((a, b) => a[0].localeCompare(b[0])),
        db.readings
          .map((item) => [item.id, item.roomId, item.periodId, item.type])
          .sort((a, b) => a[0].localeCompare(b[0])),
        db.stays
          .map((item) => [item.id, item.roomId, item.status])
          .sort((a, b) => a[0].localeCompare(b[0])),
        currentPeriod?.id,
      ]),
    )
    .digest("hex");
  return {
    applications: db.applications.filter((item) =>
      ["PENDING", "REVIEWING", "NEEDS_INFO"].includes(item.status),
    ).length,
    requests: db.requests.filter((item) => item.status === "PENDING").length,
    invoices: db.invoices.filter((item) => item.total > paid(db, item.id))
      .length,
    readings: missingReadings,
    billing: readyInvoices,
    version,
  };
}


// ==============================================================================
// NHẬT KÝ HOẠT ĐỘNG HỆ THỐNG TOÀN DIỆN CỦA MỌI VAI TRÒ (ADMIN, STAFF, STUDENT)
// Đọc trực tiếp từ tập hợp activityLogs lưu trữ bền vững trong CSDL
// ==============================================================================
async function activityLogs(user, q = {}) {
  const db = await repo.read(scopes.activityLogs);
  let items = (db.activityLogs || []).slice();

  // Sắp xếp thời gian giảm dần theo giờ:phút:giây (mới nhất lên đầu tiên)
  items.sort(
    (a, b) =>
      new Date(b.time || b.createdAt || 0) -
      new Date(a.time || a.createdAt || 0),
  );

  if (q.from) {
    const fromTime = new Date(q.from).getTime();
    if (!isNaN(fromTime)) {
      items = items.filter(
        (x) => new Date(x.time || x.createdAt).getTime() >= fromTime,
      );
    }
  }
  if (q.to) {
    const toTime = new Date(q.to).getTime();
    if (!isNaN(toTime)) {
      items = items.filter(
        (x) => new Date(x.time || x.createdAt).getTime() <= toTime,
      );
    }
  }

  const limit =
    q.all === "true" || q.all === true
      ? items.length
      : Math.min(5000, Math.max(1, Number(q.limit) || 20));

  return {
    items: items.slice(0, limit),
    total: items.length,
  };
}

module.exports = {
  fail,
  catalog,
  register,
  login,
  me,
  updateProfile,
  catalogWrite,
  catalogList,
  catalogDetail,
  applications,
  applicationDetail,
  apply,
  applicationUpdate,
  applicationAction,
  stays,
  stayRequests,
  requestStay,
  decideRequest,
  transfer,
  transfers,
  readings,
  readingPrevious,
  readingGetByRoomAndPeriod,
  readingSaveCombined,
  readingCreate,
  preview,
  issue,
  invoices,
  invoiceDetail,
  paymentCreate,
  notifications,
  readNotification,
  readAllNotifications,
  deleteNotification,
  usersList,
  userResetPassword,
  userSetStatus,
  userCreate,
  userDelete,
  getNextCode,
  staffList,
  staffWrite,
  students,
  studentDetail,
  report,
  workQueue,
  activityLogs,
};
