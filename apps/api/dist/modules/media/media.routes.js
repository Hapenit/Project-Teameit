"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const media_controller_1 = require("./media.controller");
const rbac_1 = require("../../middleware/rbac");
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const router = (0, express_1.Router)();
// For MVP, we'll map these to 'publishing' permissions, as media is primarily used there.
// Alternatively, a dedicated 'media' permission could be created.
router.get('/', (0, rbac_1.requirePermission)('publishing', 'read'), media_controller_1.getMedia);
router.post('/upload', (0, rbac_1.requirePermission)('publishing', 'write'), upload.single('file'), media_controller_1.uploadMedia);
router.delete('/:id', (0, rbac_1.requirePermission)('publishing', 'write'), media_controller_1.deleteMedia);
exports.default = router;
