"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.post('/login', (_req, res) => {
    res.json({ message: 'Auth endpoint - not implemented yet' });
});
router.post('/register', (_req, res) => {
    res.json({ message: 'Auth endpoint - not implemented yet' });
});
exports.default = router;
//# sourceMappingURL=auth.js.map