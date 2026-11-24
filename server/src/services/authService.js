// Dịch vụ Xác thực & Quản lý phiên đăng nhập
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


module.exports = {
  register,
  login,
  me,
  updateProfile,
};
