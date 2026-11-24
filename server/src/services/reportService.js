// Dịch vụ Thống kê, Báo cáo & Hàng đợi công việc Dashboard
const common = require("./common");
const {
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
  activeStay,
  occupants,
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
  hasNewDueNotice,
} = common;
const { billingPreview } = require("./billingService");

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
  report,
  workQueue,
  activityLogs,
};
