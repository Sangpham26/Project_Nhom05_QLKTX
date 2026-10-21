const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const repo = require("../repositories");

// Each service loads only the collections it can read or change. The JSON provider
// accepts the same scopes; the MongoDB provider uses them for focused queries.
const scopes = {
  catalog: ['buildings', 'roomTypes', 'rooms', 'stays'],
  account: ['users', 'students', 'staff'],
  catalogWrite: ['buildings', 'roomTypes', 'rooms', 'stays', 'periods', 'pricing'],
  applicationView: ['applications', 'students', 'roomTypes', 'rooms', 'buildings', 'stays'],
  applicationWrite: ['applications', 'students', 'roomTypes', 'rooms', 'buildings', 'stays', 'notifications', 'users'],
  stays: ['stays', 'students', 'rooms', 'buildings', 'roomTypes'],
  requests: ['requests', 'students', 'stays', 'rooms', 'notifications', 'users'],
  transfer: ['transfers', 'students', 'stays', 'rooms', 'roomTypes', 'buildings', 'notifications'],
  readings: ['readings', 'rooms', 'periods'],
  billing: ['periods', 'pricing', 'rooms', 'stays', 'readings', 'roomTypes', 'students', 'invoices', 'notifications'],
  invoices: ['invoices', 'payments', 'students', 'rooms', 'periods', 'staff'],
  payment: ['invoices', 'payments', 'students', 'notifications'],
  notifications: ['invoices', 'payments', 'students', 'notifications'],
  staff: ['staff', 'users'],
  students: ['students', 'stays', 'rooms', 'applications', 'requests', 'transfers'],
  report: ['rooms', 'stays', 'invoices', 'payments', 'applications', 'requests', 'buildings'],
  workQueue: ['applications', 'requests', 'invoices', 'payments', 'rooms', 'stays', 'periods', 'readings', 'pricing', 'roomTypes', 'students'],
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
  const target = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(start.getUTCDate(), lastDay));
  return target.toISOString().slice(0, 10);
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
const unique = (db, collection, field, value, except) => {
  if (
    db[collection].some(
      (x) =>
        x[field]?.toLowerCase?.() === String(value).toLowerCase() &&
        x.id !== except,
    )
  )
    fail(`${field} đã tồn tại.`);
};
const student = (db, user) =>
  db.students.find((x) => x.userId === user.id) ||
  fail("Không tìm thấy hồ sơ sinh viên.", 404);
const activeStay = (db, studentId) =>
  db.stays.find((x) => x.studentId === studentId && x.status === "ACTIVE");
const occupants = (db, roomId) =>
  db.stays.filter((x) => x.roomId === roomId && x.status === "ACTIVE").length;
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
  if (room.roomTypeId !== roomTypeId || room.status !== "ACTIVE" || building.status !== "ACTIVE")
    fail("Phòng nguyện vọng không thuộc loại phòng đã chọn hoặc không còn hoạt động.");
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
  for (const user of db.users.filter((item) => item.active && ["STAFF", "ADMIN"].includes(item.role)))
    notify(db, user.id, title, body, targetPath);
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
    const studentCode = String(
      required(body.studentCode, "mã sinh viên"),
    ).trim();
    unique(db, "users", "email", email);
    unique(db, "students", "studentCode", studentCode);
    const user = {
      id: id(),
      email,
      passwordHash: bcrypt.hashSync(body.password, 10),
      role: "STUDENT",
      active: true,
    };
    const profile = {
      id: id(),
      userId: user.id,
      studentCode,
      fullName: String(required(body.fullName, "họ tên")).trim(),
      gender: required(body.gender, "giới tính"),
      faculty: body.faculty || "",
      course: body.course || "",
      phone: body.phone || "",
      address: body.address || "",
      contact: body.contact || "",
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
    if (kind === 'roomTypes') delete cleanBody.images;
    const value = { ...(existing || {}), ...cleanBody };
    if (kind === 'roomTypes' && !existing) value.images = [];
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
    const durationMonths = body.durationMonths === undefined || body.durationMonths === ""
      ? null : validDuration(body.durationMonths);
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
    notifyTeam(db, "Hồ sơ đăng ký mới", `${profile.fullName} đã gửi nguyện vọng${wish ? ` phòng ${wish.code}` : ` loại phòng ${type.name}`}.`, `/applications/${item.id}`);
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
    notifyTeam(db, "Hồ sơ đã bổ sung", `${profile.fullName} đã bổ sung hồ sơ và đang chờ xét duyệt.`, `/applications/${app.id}`);
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
        notify(db, owner.userId, "Cần bổ sung hồ sơ", app.reviewNote || "Vui lòng mở hồ sơ để bổ sung thông tin.", `/applications/${app.id}`);
      }
    } else if (action === "reject") {
      app.rejectionReason = String(required(body.reason, "lý do từ chối"));
      app.status = "REJECTED";
      app.handledBy = user.id;
      app.handledAt = now();
      notify(
        db,
        db.students.find((x) => x.id === app.studentId).userId,
        "Hồ sơ bị từ chối",
        app.rejectionReason,
        `/applications/${app.id}`,
      );
    } else if (action === "approve") {
      const profile = one(db, "students", app.studentId);
      if (activeStay(db, profile.id))
        fail("Sinh viên đã có lượt lưu trú đang hoạt động.");
      const room = one(db, "rooms", required(body.roomId, "phòng"));
      if (!roomAvailable(db, room, profile, app.roomTypeId))
        fail("Phòng không còn phù hợp hoặc đã đầy.");
      const startDate = validDate(body.startDate || app.startDate, "ngày bắt đầu"),
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
    const desiredDate = validDate(body.desiredDate, "ngày mong muốn");
    if (body.type === "EXTEND" && desiredDate <= stay.plannedEndDate)
      fail("Ngày gia hạn phải sau ngày kết thúc hiện tại.");
    if (body.type === "RETURN" && desiredDate < stay.startDate)
      fail("Ngày trả phòng không hợp lệ.");
    if (
      db.requests.some(
        (x) =>
          x.stayId === stay.id &&
          x.type === body.type &&
          x.status === "PENDING",
      )
    )
      fail("Đã có yêu cầu cùng loại đang chờ xử lý.");
    const item = {
      id: id(),
      studentId: profile.id,
      stayId: stay.id,
      type: body.type,
      desiredDate,
      reason: String(required(body.reason, "lý do")),
      status: "PENDING",
      createdAt: now(),
    };
    db.requests.push(item);
    notifyTeam(db, "Yêu cầu lưu trú mới", `${profile.fullName} đã gửi yêu cầu ${body.type === "EXTEND" ? "gia hạn" : "trả phòng"}.`, "/requests");
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
      if (request.type === "EXTEND") stay.plannedEndDate = request.desiredDate;
      else {
        stay.status = "ENDED";
        stay.actualEndDate = request.desiredDate;
      }
    }
    request.status = body.status;
    request.handledBy = user.id;
    request.handledAt = now();
    notify(
      db,
      one(db, "students", request.studentId).userId,
      "Yêu cầu lưu trú đã xử lý",
      body.status === "APPROVED"
        ? "Yêu cầu của bạn đã được duyệt."
        : `Yêu cầu bị từ chối: ${request.rejectionReason}`,
      "/requests",
    );
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
    };
    db.transfers.push(item);
    notify(
      db,
      profile.userId,
      "Đã chuyển phòng",
      `Phòng mới của bạn: ${room.code}.`,
      "/stays",
    );
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
async function readingCreate(user, body) {
  return repo.transaction(scopes.readings, (db) => {
    const room = one(db, "rooms", required(body.roomId, "phòng"));
    const period = one(db, "periods", required(body.periodId, "kỳ thu"));
    if (!["ELECTRICITY", "WATER"].includes(body.type))
      fail("Loại chỉ số không hợp lệ.");
    if (
      db.readings.some(
        (x) =>
          x.roomId === room.id &&
          x.periodId === period.id &&
          x.type === body.type,
      )
    )
      fail("Chỉ số của phòng, loại và kỳ này đã tồn tại.");
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
  const missing = [],
    items = [];
  for (const room of db.rooms) {
    const residents = db.stays
      .filter((x) => x.roomId === room.id && x.status === "ACTIVE")
      .sort((a, b) => a.studentId.localeCompare(b.studentId));
    if (!residents.length) continue;
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
    const base = money(electric.usage * pricing.electricity),
      waterBase = money(water.usage * pricing.water),
      count = residents.length;
    const electricityParts = Array.from(
      { length: count },
      (_, i) => Math.floor(base / count) + (i < base % count ? 1 : 0),
    );
    const waterParts = Array.from(
      { length: count },
      (_, i) => Math.floor(waterBase / count) + (i < waterBase % count ? 1 : 0),
    );
    residents.forEach((stay, i) => {
      if (
        db.invoices.some(
          (x) => x.studentId === stay.studentId && x.periodId === periodId,
        )
      )
        return;
      const roomFee = money(pricing.roomFees?.[type.id] ?? type.fee);
      items.push({
        studentId: stay.studentId,
        studentName: db.students.find((s) => s.id === stay.studentId)?.fullName,
        roomId: room.id,
        periodId,
        dueDate: period.dueDate,
        snapshot: {
          roomCode: room.code,
          roomTypeName: type.name,
          occupants: count,
          roomFee,
          electricityRate: pricing.electricity,
          waterRate: pricing.water,
          electricStart: electric.start,
          electricEnd: electric.end,
          electricUsage: electric.usage,
          waterStart: water.start,
          waterEnd: water.end,
          waterUsage: water.usage,
          electricityRoomTotal: base,
          waterRoomTotal: waterBase,
        },
        roomFee,
        electricityFee: electricityParts[i],
        waterFee: waterParts[i],
        total: money(roomFee + electricityParts[i] + waterParts[i]),
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
    created.forEach((x) =>
      notify(
        db,
        one(db, "students", x.studentId).userId,
        "Hóa đơn mới",
        `Hóa đơn kỳ ${result.period.month}: ${x.total.toLocaleString("vi-VN")} ₫.`,
        `/invoices/${x.id}`,
      ),
    );
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
    const item = {
      id: id(),
      invoiceId: invoice.id,
      amount,
      date: validDate(body.date, "ngày thu"),
      method: body.method,
      note: body.note || "",
      recordedBy: user.id,
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
    return item;
  });
}
function hasNewDueNotice(db) {
  return db.invoices.some((invoice) => {
    if (invoice.total <= paid(db, invoice.id)) return false;
    const days = Math.ceil((new Date(`${invoice.dueDate}T00:00:00Z`) - new Date(`${today()}T00:00:00Z`)) / 86400000);
    const kind = days < 0 ? "OVERDUE" : days <= 3 ? "DUE" : null;
    return kind && db.students.some((item) => item.id === invoice.studentId) &&
      !db.notifications.some((item) => item.key === `${kind}:${invoice.id}`);
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
    ...list(own.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), q),
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
  const changePassword = !targetId || (body.password !== undefined && body.password !== "");
  let passwordHash;
  if (changePassword) {
    if (typeof body.password !== "string" || !body.password.trim() || body.password.length < 8)
      fail("Mật khẩu cần ít nhất 8 ký tự.");
    if (Buffer.byteLength(body.password, "utf8") > 72)
      fail("Mật khẩu quá dài. Vui lòng dùng tối đa 72 byte (ký tự có dấu có thể chiếm nhiều byte).");
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
      if (body[field] !== undefined) item[field] = String(field === "fullName" ? required(body[field], "họ tên") : body[field]);
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
const studentView = (db, x) => ({
  ...x,
  stay: activeStay(db, x.id),
  room: db.rooms.find((r) => r.id === activeStay(db, x.id)?.roomId),
  status: activeStay(db, x.id) ? "ACTIVE" : "INACTIVE",
  applications: db.applications.filter((a) => a.studentId === x.id),
  stays: db.stays.filter((s) => s.studentId === x.id),
  requests: db.requests.filter((r) => r.studentId === x.id),
  transfers: db.transfers.filter((t) => t.studentId === x.id),
});
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
  const occupiedRooms = db.rooms.filter((room) => room.status === "ACTIVE" && occupants(db, room.id) > 0);
  const missingReadings = currentPeriod ? occupiedRooms.filter((room) =>
    ["ELECTRICITY", "WATER"].some((type) =>
      !db.readings.some((item) => item.roomId === room.id && item.periodId === currentPeriod.id && item.type === type),
    ),
  ).length : 0;
  const readyInvoices = currentPeriod && !missingReadings && db.pricing.length
    ? billingPreview(db, currentPeriod.id).items.length : 0;
  const version = crypto.createHash("sha256").update(JSON.stringify([
    db.applications.map((item) => [item.id, item.status, item.updatedAt, item.handledAt]).sort((a, b) => a[0].localeCompare(b[0])),
    db.requests.map((item) => [item.id, item.status, item.handledAt]).sort((a, b) => a[0].localeCompare(b[0])),
    db.invoices.map((item) => [item.id, item.total, paid(db, item.id)]).sort((a, b) => a[0].localeCompare(b[0])),
    db.readings.map((item) => [item.id, item.roomId, item.periodId, item.type]).sort((a, b) => a[0].localeCompare(b[0])),
    db.stays.map((item) => [item.id, item.roomId, item.status]).sort((a, b) => a[0].localeCompare(b[0])),
    currentPeriod?.id,
  ])).digest("hex");
  return {
    applications: db.applications.filter((item) => ["PENDING", "REVIEWING", "NEEDS_INFO"].includes(item.status)).length,
    requests: db.requests.filter((item) => item.status === "PENDING").length,
    invoices: db.invoices.filter((item) => item.total > paid(db, item.id)).length,
    readings: missingReadings,
    billing: readyInvoices,
    version,
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
  readingCreate,
  preview,
  issue,
  invoices,
  invoiceDetail,
  paymentCreate,
  notifications,
  readNotification,
  staffList,
  staffWrite,
  students,
  studentDetail,
  report,
  workQueue,
};
