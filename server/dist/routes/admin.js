"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const prisma_1 = __importDefault(require("../lib/prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = express_1.default.Router();
// Get all users (Admin only)
router.get('/users', auth_1.authenticateToken, auth_1.isAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma_1.default.user.findMany({
            orderBy: { registerDate: 'desc' }, // 按注册时间倒序
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                registerDate: true,
                avatar: true,
                enableEmailNotify: true,
                qqEmail: true
            }
        });
        // 修复：将 BigInt/Int ID 转换为字符串返回，防止前端精度丢失或类型问题
        const safeUsers = users.map(u => (Object.assign(Object.assign({}, u), { id: u.id.toString() })));
        res.json(safeUsers);
    }
    catch (error) {
        console.error('Admin Get Users Error:', error); // 打印错误
        res.status(500).json({ message: 'Error fetching users: ' + error.message });
    }
}));
// Update user (Admin only - e.g., change password or role)
router.put('/users/:id', auth_1.authenticateToken, auth_1.isAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { password, role, enableEmailNotify, qqEmail } = req.body;
    try {
        const dataToUpdate = {};
        if (password) {
            const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
            dataToUpdate.password = hashedPassword;
        }
        if (role)
            dataToUpdate.role = role;
        if (enableEmailNotify !== undefined)
            dataToUpdate.enableEmailNotify = enableEmailNotify;
        if (qqEmail)
            dataToUpdate.qqEmail = qqEmail;
        const updatedUser = yield prisma_1.default.user.update({
            where: { id: parseInt(id) },
            data: dataToUpdate,
            select: {
                id: true,
                username: true,
                role: true
            }
        });
        res.json(updatedUser);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating user' });
    }
}));
// Delete user (Admin only)
router.delete('/users/:id', auth_1.authenticateToken, auth_1.isAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const userId = parseInt(id);
    if (userId === req.user.id) {
        return res.status(400).json({ message: 'Cannot delete yourself' });
    }
    try {
        // Delete related records first (Cascade normally handles this, but good to be safe)
        yield prisma_1.default.food.deleteMany({ where: { userId } });
        yield prisma_1.default.record.deleteMany({ where: { userId } });
        yield prisma_1.default.user.delete({
            where: { id: userId }
        });
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting user' });
    }
}));
exports.default = router;
