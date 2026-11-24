// Tầng tổng hợp dịch vụ (Service Facade) kết nối các module nghiệp vụ chuyên biệt
const common = require("./common");
const authService = require("./authService");
const roomService = require("./roomService");
const applicationService = require("./applicationService");
const transferService = require("./transferService");
const utilityService = require("./utilityService");
const billingService = require("./billingService");
const notificationService = require("./notificationService");
const userService = require("./userService");
const reportService = require("./reportService");

module.exports = {
  ...common,
  ...authService,
  ...roomService,
  ...applicationService,
  ...transferService,
  ...utilityService,
  ...billingService,
  ...notificationService,
  ...userService,
  ...reportService,
};
