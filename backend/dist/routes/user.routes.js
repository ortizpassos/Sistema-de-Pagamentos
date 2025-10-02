"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const user_controller_1 = require("../controllers/user.controller");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get('/', user_controller_1.userController.list);
router.get('/lookup', user_controller_1.userController.lookupByEmail);
exports.default = router;
//# sourceMappingURL=user.routes.js.map