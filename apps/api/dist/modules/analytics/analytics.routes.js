"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("./analytics.controller");
const rbac_1 = require("../../middleware/rbac");
const router = (0, express_1.Router)();
// Technically we could use 'read' on a new 'analytics' module, or just require auth
router.get('/', (0, rbac_1.requirePermission)('crm', 'read'), analytics_controller_1.getDashboardStats);
router.get('/agents', (0, rbac_1.requirePermission)('crm', 'read'), analytics_controller_1.getAgentPerformance);
exports.default = router;
