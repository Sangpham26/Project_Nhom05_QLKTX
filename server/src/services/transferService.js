// Dịch vụ Quản lý Chuyển phòng KTX
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

async function transfer(user, body) {
  return repo.transaction(scopes.transfer, (db) => {
    const profile = one(db, "students", required(body.studentId, "sinh viên"));
    const stay = activeStay(db, profile.id);
    if (!stay) fail("Sinh viên chưa có lượt lưu trú hoạt động.");
    const room = one(db, "rooms", required(body.roomId, "phòng mới"));
    if (room.id === stay.roomId) fail("Vui lòng chọn phòng khác.");

    const currentRoom = one(db, "rooms", stay.roomId);
    if (room.roomTypeId !== currentRoom.roomTypeId) {
      fail("Chỉ được phép chuyển sang phòng cùng loại (cùng cấp phòng).");
    }

    if (!roomAvailable(db, room, profile, room.roomTypeId))
      fail("Phòng mới không phù hợp hoặc đã đầy.");

    const date = validDate(body.date, "ngày chuyển");
    if (!date.endsWith("-01")) {
      fail("Ngày chuyển phòng phải là ngày đầu kỳ thu (ngày 01 của tháng).");
    }
    if (date <= stay.startDate) {
      fail("Ngày chuyển phải sau ngày bắt đầu lưu trú hiện tại.");
    }
    if (stay.plannedEndDate && date > stay.plannedEndDate) {
      fail(
        `Ngày chuyển (${date}) vượt quá thời hạn lưu trú hiện tại (${stay.plannedEndDate}).`,
      );
    }

    const originalRoomId = stay.roomId;
    stay.status = "TRANSFERRED";
    stay.actualEndDate = addDays(date, -1);
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
      `Phòng mới của bạn: ${room.code}. Hiệu lực từ: ${date}.`,
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
      body: `Chuyển sinh viên ${profile.fullName} (${profile.studentCode || "—"}) từ phòng ${fromRoom?.code || "—"} sang phòng ${room.code}. Hiệu lực từ kỳ ${date}. Lý do: "${item.reason}".`,
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


module.exports = {
  transfer,
  transfers,
};
