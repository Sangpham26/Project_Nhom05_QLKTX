const express = require("express");
const roomImages = require('../services/roomImages');
const {
  send,
  auth,
  allow,
  login,
  register,
  service: s,
} = require("../controllers/apiController");
const r = express.Router();
const staff = allow("STAFF", "ADMIN"),
  admin = allow("ADMIN");
r.post("/auth/login", login);
r.post("/auth/register", register);
r.get(
  "/catalog",
  send(() => s.catalog()),
);
r.get('/roomTypes/:id/images', send(req => roomImages.list(req.params.id)));
r.use(auth);
r.get(
  "/auth/me",
  send((req) => s.me(req.user)),
);
r.patch(
  "/profile",
  send((req) => s.updateProfile(req.user, req.body)),
);
r.get(
  "/report",
  staff,
  send((req) => s.report(req.user, req.query)),
);
r.get("/work-queue", staff, send(() => s.workQueue()));
r.get(
  "/students",
  staff,
  send((req) => s.students(req.user, req.query)),
);
r.get(
  "/students/:id",
  staff,
  send((req) => s.studentDetail(req.user, req.params.id)),
);
r.get(
  "/staff",
  admin,
  send((req) => s.staffList(req.query)),
);
r.post(
  "/staff",
  admin,
  send((req) => s.staffWrite(req.body)),
);
r.patch(
  "/staff/:id",
  admin,
  send((req) => s.staffWrite(req.body, req.params.id)),
);
r.get(
  "/applications",
  send((req) => s.applications(req.user, req.query)),
);
r.post(
  "/applications",
  allow("STUDENT"),
  send((req) => s.apply(req.user, req.body)),
);
r.patch(
  "/applications/:id",
  allow("STUDENT"),
  send((req) => s.applicationUpdate(req.user, req.params.id, req.body)),
);
r.get(
  "/applications/:id",
  send((req) => s.applicationDetail(req.user, req.params.id)),
);
r.post(
  "/applications/:id/:action",
  staff,
  send((req) =>
    s.applicationAction(req.user, req.params.id, req.params.action, req.body),
  ),
);
r.get(
  "/stays",
  send((req) => s.stays(req.user, req.query)),
);
r.get(
  "/requests",
  send((req) => s.stayRequests(req.user, req.query)),
);
r.post(
  "/requests",
  allow("STUDENT"),
  send((req) => s.requestStay(req.user, req.body)),
);
r.post(
  "/requests/:id/decision",
  staff,
  send((req) => s.decideRequest(req.user, req.params.id, req.body)),
);
r.get(
  "/transfers",
  send((req) => s.transfers(req.user, req.query)),
);
r.post(
  "/transfers",
  staff,
  send((req) => s.transfer(req.user, req.body)),
);
r.get(
  "/readings",
  staff,
  send((req) => s.readings(req.query)),
);
r.get(
  "/readings/previous",
  staff,
  send((req) => s.readingPrevious(req.query)),
);
r.post(
  "/readings",
  staff,
  send((req) => s.readingCreate(req.user, req.body)),
);
r.get(
  "/invoices",
  send((req) => s.invoices(req.user, req.query)),
);
r.get(
  "/invoices/:id",
  send((req) => s.invoiceDetail(req.user, req.params.id)),
);
r.get(
  "/billing/preview/:periodId",
  staff,
  send((req) => s.preview(req.params.periodId)),
);
r.post(
  "/billing/issue/:periodId",
  staff,
  send((req) => s.issue(req.user, req.params.periodId)),
);
r.post(
  "/payments",
  staff,
  send((req) => s.paymentCreate(req.user, req.body)),
);
r.get(
  "/notifications",
  send((req) => s.notifications(req.user, req.query)),
);
r.patch(
  "/notifications/:id/read",
  send((req) => s.readNotification(req.user, req.params.id)),
);
r.post('/roomTypes/:id/images', admin, express.raw({ type: () => true, limit: roomImages.maxBytes }), send(req => roomImages.upload(req.params.id, req.body, req.headers['content-type'], req.query.description)));
r.patch('/roomTypes/:id/images/:imageId', admin, send(req => roomImages.update(req.params.id, req.params.imageId, req.body)));
r.put('/roomTypes/:id/images/order', admin, send(req => roomImages.reorder(req.params.id, req.body.imageIds)));
r.delete('/roomTypes/:id/images/:imageId', admin, send(req => roomImages.remove(req.params.id, req.params.imageId)));
for (const kind of ["buildings", "roomTypes", "rooms", "periods", "pricing"]) {
  r.get(
    `/${kind}`,
    send((req) => s.catalogList(kind, req.query)),
  );
  r.get(
    `/${kind}/:id`,
    send((req) => s.catalogDetail(kind, req.params.id)),
  );
  r.post(
    `/${kind}`,
    admin,
    send((req) => s.catalogWrite(kind, req.body)),
  );
  r.patch(
    `/${kind}/:id`,
    kind === "rooms" ? staff : admin,
    send((req) => {
      if (kind === "rooms" && req.user.role === "STAFF") {
        const allowed = ["operationalCapacity", "status"];
        if (Object.keys(req.body).some((key) => !allowed.includes(key)))
          s.fail(
            "Nhân viên chỉ được cập nhật sức chứa vận hành và trạng thái phòng.",
            403,
          );
      }
      return s.catalogWrite(kind, req.body, req.params.id);
    }),
  );
}
module.exports = r;
