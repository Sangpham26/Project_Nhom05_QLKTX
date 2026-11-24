// Dịch vụ Quản lý Khoản thu, Hóa đơn & Thanh toán
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
          (x) =>
            x.studentId === stay.studentId &&
            x.roomId === stay.roomId &&
            x.periodId === periodId,
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
    const item = {
      id: pId,
      invoiceId: invoice.id,
      amount,
      date: pDate,
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
    const staffMember = db.staff?.find((s) => s.userId === user.id);
    const stu = db.students?.find((s) => s.id === invoice.studentId);
    const room = db.rooms?.find((r) => r.id === invoice.roomId);
    logEvent(db, {
      actorId: user.id,
      actorName: staffMember?.fullName || "NV Thu ngân KTX",
      actorRole: user.role || "STAFF",
      action: "XÁC NHẬN THANH TOÁN",
      title: `${staffMember?.fullName || "Nhân viên"} đã thu tiền phòng & điện nước`,
      body: `Đã thu ${amount.toLocaleString("vi-VN")} đ (${body.method === "TRANSFER" ? "Chuyển khoản" : "Tiền mặt"}) từ SV ${stu?.fullName || "Sinh viên"} (MSSV: ${stu?.studentCode || "—"}), phòng ${room?.code || "—"}.`,
      target: room ? `Phòng ${room.code}` : "Thanh toán",
      tone: "green",
    });
    return item;
  });
}

module.exports = {
  billingPreview,
  preview,
  issue,
  invoices,
  invoiceDetail,
  paymentCreate,
  hasNewDueNotice,
};
