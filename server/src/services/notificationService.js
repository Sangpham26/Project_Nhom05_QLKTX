// Dịch vụ Quản lý Thông báo người dùng
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

module.exports = {
  notifications,
  readNotification,
  readAllNotifications,
  deleteNotification,
};
