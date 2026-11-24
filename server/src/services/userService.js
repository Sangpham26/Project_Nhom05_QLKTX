// Dịch vụ Quản lý Tài khoản Người dùng, Nhân sự & Sinh viên
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
const bcrypt = require("bcryptjs");

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

    // 6. Xóa tài khoản khỏi danh sách users và xóa sạch toàn bộ thông báo của tài khoản này
    const userIndex = db.users.findIndex((u) => u.id === user.id);
    if (userIndex !== -1) {
      db.users.splice(userIndex, 1);
    }
    db.notifications = (db.notifications || []).filter((n) => n.userId !== user.id);

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

// Xóa vĩnh viễn tòa nhà và kiểm tra toàn diện điều kiện nghiệp vụ KTX (Admin Delete Building)

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

module.exports = {
  usersList,
  userResetPassword,
  userSetStatus,
  getNextCode,
  userCreate,
  userDelete,
  staffList,
  staffWrite,
  studentView,
  studentDetail,
  students,
};
