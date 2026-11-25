// Dịch vụ Quản lý Phòng, Loại phòng & Tòa nhà KTX
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

async function catalog() {
  await syncExpiredStays();
  const db = await repo.read(scopes.catalog);
  return {
    buildings: db.buildings,
    roomTypes: db.roomTypes,
    rooms: db.rooms.map((r) => roomView(db, r)),
  };
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
    if (kind === "roomTypes" || kind === "rooms") delete cleanBody.images;
    const value = { ...(existing || {}), ...cleanBody };
    if ((kind === "roomTypes" || kind === "rooms") && !existing) value.images = [];
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


async function buildingDelete(buildingId, actor) {
  return repo.transaction(scopes.buildingDelete, (db) => {
    const building = db.buildings?.find((b) => b.id === buildingId);
    if (!building) fail("Không tìm thấy tòa nhà cần xóa.", 404);

    // 1. Tìm tất cả các phòng thuộc tòa nhà này
    const buildingRooms = (db.rooms || []).filter((r) => r.buildingId === building.id);
    const roomIds = buildingRooms.map((r) => r.id);

    // 2. Kiểm tra sinh viên đang lưu trú (ACTIVE stays)
    const activeStays = (db.stays || []).filter(
      (s) => roomIds.includes(s.roomId) && isStayActive(s),
    );
    if (activeStays.length > 0) {
      const occupiedRoomsCount = new Set(activeStays.map((s) => s.roomId)).size;
      fail(
        `Không thể xóa tòa nhà "${building.name}": Hiện đang có ${activeStays.length} sinh viên đang lưu trú trong ${occupiedRoomsCount} phòng của tòa này. Vui lòng chuyển phòng hoặc kết thúc lưu trú cho toàn bộ sinh viên trước khi xóa tòa nhà.`,
        400,
      );
    }

    // 3. Kiểm tra hồ sơ đăng ký phòng chờ xử lý hoặc đã duyệt xếp vào các phòng thuộc tòa
    const pendingApps = (db.applications || []).filter(
      (a) =>
        ["PENDING", "NEEDS_INFO", "APPROVED"].includes(a.status) &&
        (roomIds.includes(a.preferredRoomId) || roomIds.includes(a.assignedRoomId)),
    );
    if (pendingApps.length > 0) {
      fail(
        `Không thể xóa tòa nhà "${building.name}": Hiện có ${pendingApps.length} hồ sơ đăng ký phòng đang chờ xử lý hoặc đã duyệt xếp vào tòa này. Vui lòng xử lý hoặc hủy các hồ sơ này trước khi xóa tòa nhà.`,
        400,
      );
    }

    // 4. Kiểm tra yêu cầu lưu trú (chuyển phòng / gia hạn) đang chờ duyệt liên quan đến các phòng trong tòa
    const pendingRequests = (db.requests || []).filter(
      (req) => req.status === "PENDING" && roomIds.includes(req.targetRoomId),
    );
    if (pendingRequests.length > 0) {
      fail(
        `Không thể xóa tòa nhà "${building.name}": Hiện có ${pendingRequests.length} yêu cầu chuyển phòng vào tòa này đang chờ duyệt. Vui lòng xử lý yêu cầu trước khi xóa tòa nhà.`,
        400,
      );
    }

    // 5. Kiểm tra hóa đơn chưa thanh toán liên quan đến các phòng trong tòa
    const unpaidInvoices = (db.invoices || []).filter(
      (inv) =>
        roomIds.includes(inv.roomId) &&
        inv.status !== "PAID" &&
        inv.status !== "CANCELLED",
    );
    if (unpaidInvoices.length > 0) {
      fail(
        `Không thể xóa tòa nhà "${building.name}": Đang có ${unpaidInvoices.length} hóa đơn chưa tất toán của các phòng trong tòa. Vui lòng thanh toán hoặc xử lý hóa đơn trước khi xóa tòa nhà.`,
        400,
      );
    }

    // 6. Xóa các phòng trực thuộc tòa nhà (tất cả các phòng này đều đang trống và không có ràng buộc)
    if (buildingRooms.length > 0) {
      db.rooms = (db.rooms || []).filter((r) => r.buildingId !== building.id);
      if (db.readings) {
        db.readings = db.readings.filter((rd) => !roomIds.includes(rd.roomId));
      }
    }

    // 7. Xóa tòa nhà khỏi danh sách buildings
    const buildingIndex = db.buildings.findIndex((b) => b.id === building.id);
    if (buildingIndex !== -1) {
      db.buildings.splice(buildingIndex, 1);
    }

    // 8. Ghi nhật ký hoạt động hệ thống
    logEvent(db, {
      actorId: actor?.id || "u-admin-1",
      actorName: actor?.name || actor?.fullName || "Quản trị viên",
      actorRole: actor?.role || "ADMIN",
      action: "XÓA TÒA NHÀ",
      title: `Quản trị viên đã xóa tòa nhà ${building.name} (${building.code})`,
      body: `Đã xóa tòa nhà ${building.name} và ${buildingRooms.length} phòng trực thuộc (đều đang trống và không có sinh viên lưu trú).`,
      target: building.name,
      tone: "rose",
    });

    return {
      success: true,
      id: building.id,
      name: building.name,
      message: `Đã xóa tòa nhà "${building.name}" thành công.`,
    };
  });
}

// Xóa vĩnh viễn phòng và kiểm tra toàn diện điều kiện nghiệp vụ KTX (Admin Delete Room)
async function roomDelete(roomId, actor) {
  return repo.transaction(scopes.roomDelete, (db) => {
    const room = db.rooms?.find((r) => r.id === roomId);
    if (!room) fail("Không tìm thấy phòng cần xóa.", 404);

    // 1. Kiểm tra sinh viên đang lưu trú (ACTIVE stays)
    const activeStays = (db.stays || []).filter(
      (s) => s.roomId === room.id && isStayActive(s),
    );
    if (activeStays.length > 0) {
      fail(
        `Không thể xóa phòng "${room.code}": Hiện đang có ${activeStays.length} sinh viên đang lưu trú. Vui lòng chuyển phòng hoặc kết thúc lưu trú cho toàn bộ sinh viên trước khi xóa phòng.`,
        400,
      );
    }

    // 2. Kiểm tra hồ sơ đăng ký phòng chờ xử lý hoặc đã duyệt xếp vào phòng này
    const pendingApps = (db.applications || []).filter(
      (a) =>
        ["PENDING", "NEEDS_INFO", "APPROVED"].includes(a.status) &&
        (a.preferredRoomId === room.id || a.assignedRoomId === room.id),
    );
    if (pendingApps.length > 0) {
      fail(
        `Không thể xóa phòng "${room.code}": Hiện có ${pendingApps.length} hồ sơ đăng ký phòng đang chờ xử lý hoặc đã duyệt xếp vào phòng này. Vui lòng xử lý hoặc hủy hồ sơ trước khi xóa phòng.`,
        400,
      );
    }

    // 3. Kiểm tra yêu cầu chuyển phòng chờ duyệt vào phòng này
    const pendingRequests = (db.requests || []).filter(
      (req) => req.status === "PENDING" && req.targetRoomId === room.id,
    );
    if (pendingRequests.length > 0) {
      fail(
        `Không thể xóa phòng "${room.code}": Hiện có ${pendingRequests.length} yêu cầu chuyển phòng vào phòng này đang chờ duyệt. Vui lòng xử lý yêu cầu trước khi xóa phòng.`,
        400,
      );
    }

    // 4. Kiểm tra hóa đơn chưa thanh toán liên quan đến phòng
    const unpaidInvoices = (db.invoices || []).filter(
      (inv) =>
        inv.roomId === room.id &&
        inv.status !== "PAID" &&
        inv.status !== "CANCELLED",
    );
    if (unpaidInvoices.length > 0) {
      fail(
        `Không thể xóa phòng "${room.code}": Đang có ${unpaidInvoices.length} hóa đơn chưa tất toán của phòng này. Vui lòng thanh toán hoặc xử lý hóa đơn trước khi xóa phòng.`,
        400,
      );
    }

    // 5. Dọn dẹp chỉ số điện nước nếu có
    if (db.readings) {
      db.readings = db.readings.filter((rd) => rd.roomId !== room.id);
    }

    // 6. Xóa phòng khỏi danh sách rooms
    const roomIndex = db.rooms.findIndex((r) => r.id === room.id);
    if (roomIndex !== -1) {
      db.rooms.splice(roomIndex, 1);
    }

    // 7. Ghi nhật ký hoạt động hệ thống
    logEvent(db, {
      actorId: actor?.id || "u-admin-1",
      actorName: actor?.name || actor?.fullName || "Quản trị viên",
      actorRole: actor?.role || "ADMIN",
      action: "XÓA PHÒNG",
      title: `Quản trị viên đã xóa phòng ${room.code}`,
      body: `Đã xóa phòng ${room.code} sau khi xác nhận phòng đang trống và không còn sinh viên lưu trú hay ràng buộc nghiệp vụ.`,
      target: room.code,
      tone: "rose",
    });

    return {
      success: true,
      id: room.id,
      code: room.code,
      message: `Đã xóa phòng "${room.code}" thành công.`,
    };
  });
}

// Xóa vĩnh viễn loại phòng và kiểm tra toàn diện điều kiện nghiệp vụ KTX (Admin Delete Room Type)
async function roomTypeDelete(roomTypeId, actor) {
  return repo.transaction(scopes.roomTypeDelete, (db) => {
    const roomType = db.roomTypes?.find((rt) => rt.id === roomTypeId);
    if (!roomType) fail("Không tìm thấy loại phòng cần xóa.", 404);

    // 1. Tìm các phòng thuộc loại phòng này
    const roomsOfType = (db.rooms || []).filter((r) => r.roomTypeId === roomType.id);
    const roomIds = roomsOfType.map((r) => r.id);

    // 2. Kiểm tra sinh viên đang lưu trú trong các phòng thuộc loại này
    const activeStays = (db.stays || []).filter(
      (s) => roomIds.includes(s.roomId) && isStayActive(s),
    );
    if (activeStays.length > 0) {
      fail(
        `Không thể xóa loại phòng "${roomType.name}": Hiện đang có ${activeStays.length} sinh viên đang lưu trú trong các phòng thuộc loại này. Vui lòng chuyển phòng hoặc kết thúc lưu trú cho toàn bộ sinh viên trước khi xóa loại phòng.`,
        400,
      );
    }

    // 3. Kiểm tra hồ sơ đăng ký phòng chờ xử lý chọn loại phòng này
    const pendingApps = (db.applications || []).filter(
      (a) =>
        ["PENDING", "NEEDS_INFO", "APPROVED"].includes(a.status) &&
        a.roomTypeId === roomType.id,
    );
    if (pendingApps.length > 0) {
      fail(
        `Không thể xóa loại phòng "${roomType.name}": Hiện có ${pendingApps.length} hồ sơ sinh viên đăng ký nguyện vọng loại phòng này đang chờ xử lý. Vui lòng xử lý hoặc hủy hồ sơ trước khi xóa loại phòng.`,
        400,
      );
    }

    // 4. Kiểm tra xem còn phòng nào đang gán loại phòng này không
    if (roomsOfType.length > 0) {
      fail(
        `Không thể xóa loại phòng "${roomType.name}": Hiện vẫn còn ${roomsOfType.length} phòng đang gán loại phòng này (${roomsOfType.map((r) => r.code).join(", ")}). Vui lòng đổi loại phòng hoặc xóa các phòng này trước khi xóa loại phòng.`,
        400,
      );
    }

    // 5. Dọn dẹp cấu hình đơn giá pricing liên quan
    if (db.pricing) {
      for (const p of db.pricing) {
        if (p.roomFees && p.roomFees[roomType.id]) {
          delete p.roomFees[roomType.id];
        }
      }
    }

    // 6. Xóa loại phòng khỏi danh sách roomTypes
    const rtIndex = db.roomTypes.findIndex((rt) => rt.id === roomType.id);
    if (rtIndex !== -1) {
      db.roomTypes.splice(rtIndex, 1);
    }

    // 7. Ghi nhật ký hoạt động hệ thống
    logEvent(db, {
      actorId: actor?.id || "u-admin-1",
      actorName: actor?.name || actor?.fullName || "Quản trị viên",
      actorRole: actor?.role || "ADMIN",
      action: "XÓA LOẠI PHÒNG",
      title: `Quản trị viên đã xóa loại phòng ${roomType.name} (${roomType.code})`,
      body: `Đã xóa loại phòng ${roomType.name} sau khi xác nhận không còn phòng hay hồ sơ liên kết.`,
      target: roomType.name,
      tone: "rose",
    });

    return {
      success: true,
      id: roomType.id,
      name: roomType.name,
      message: `Đã xóa loại phòng "${roomType.name}" thành công.`,
    };
  });
}


module.exports = {
  catalog,
  catalogWrite,
  catalogList,
  catalogDetail,
  buildingDelete,
  roomDelete,
  roomTypeDelete,
};
