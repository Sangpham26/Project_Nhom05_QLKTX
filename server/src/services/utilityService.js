// Dịch vụ Quản lý Chỉ số Điện nước (Công tơ/Đồng hồ)
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

module.exports = {
  readings,
  readingPrevious,
  readingGetByRoomAndPeriod,
  readingSaveCombined,
  readingCreate,
};
