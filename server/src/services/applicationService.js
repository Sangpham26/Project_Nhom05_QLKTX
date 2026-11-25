// Dịch vụ Quản lý Hồ sơ Đăng ký phòng & Yêu cầu lưu trú
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
  isStayActive,
  activeStay,
  occupants,
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
  hasNewDueNotice,
} = common;

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
  await syncExpiredStays();
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
    if (stay.actualEndDate)
      fail(
        `Lượt lưu trú này đã được duyệt trả phòng vào hết ngày ${stay.actualEndDate}.`,
      );
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
    notifyStaff(
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
      if (!isStayActive(stay)) fail("Lượt lưu trú không còn hiệu lực.");
      if (request.type === "EXTEND") {
        if (stay.actualEndDate)
          fail("Lượt lưu trú này đã được duyệt trả phòng.");
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
        const todayDate = today();
        const returnDate = request.desiredDate || stay.plannedEndDate || todayDate;
        stay.actualEndDate = returnDate;
        // Chỉ chuyển ENDED ngay khi đã tới hoặc qua ngày trả phòng; nếu còn hạn ở hết chu kỳ thì giữ ACTIVE
        if (returnDate <= todayDate) {
          stay.status = "ENDED";
        } else {
          stay.status = "ACTIVE";
        }
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
    const approvedMsg =
      request.type === "RETURN" && stay.actualEndDate > today()
        ? `Yêu cầu trả phòng đã được duyệt. Bạn tiếp tục lưu trú đến hết ngày ${stay.actualEndDate}.${request.overdueDays > 0 ? ` Phí phạt ${request.penaltyAmount.toLocaleString("vi-VN")} ₫ sẽ được tính vào hóa đơn.` : ""}`
        : `Yêu cầu của bạn đã được duyệt.${request.overdueDays > 0 ? ` Phí phạt ${request.penaltyAmount.toLocaleString("vi-VN")} ₫ sẽ được tính vào hóa đơn.` : ""}`;
    notify(
      db,
      stu.userId,
      "Yêu cầu lưu trú đã xử lý",
      body.status === "APPROVED"
        ? approvedMsg
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

module.exports = {
  applicationView,
  applicationDetail,
  applications,
  apply,
  applicationUpdate,
  applicationAction,
  stays,
  stayRequests,
  requestStay,
  decideRequest,
};
