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
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get all foods for user
router.get('/', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const foods = yield prisma_1.default.food.findMany({
            where: { userId: req.user.id }
        });
        res.json(foods.map(f => ({
            id: f.id.toString(),
            name: f.name,
            category: f.category,
            quantity: f.quantity,
            purchaseDate: f.purchaseDate,
            expirationDate: f.expirationDate,
            image: f.image,
            tags: f.tags ? f.tags.split(',') : [],
            notes: f.notes
        })));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching foods' });
    }
}));
// Add food
router.post('/', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, category, quantity, purchaseDate, expirationDate, image, notes, tags } = req.body;
        const food = yield prisma_1.default.food.create({
            data: {
                userId: req.user.id,
                name,
                category,
                quantity: Number(quantity),
                purchaseDate: new Date(purchaseDate),
                expirationDate: new Date(expirationDate),
                image,
                tags: Array.isArray(tags) ? tags.join(',') : '',
                notes
            }
        });
        res.json({
            id: food.id.toString(),
            name: food.name,
            category: food.category,
            quantity: food.quantity,
            purchaseDate: food.purchaseDate,
            expirationDate: food.expirationDate,
            image: food.image,
            tags: food.tags ? food.tags.split(',') : [],
            notes: food.notes
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding food' });
    }
}));
// Update food
router.put('/:id', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return res.status(400).json({ message: 'Invalid ID' });
        const { name, category, quantity, purchaseDate, expirationDate, image, notes, tags } = req.body;
        // Ensure user owns the food
        const existingFood = yield prisma_1.default.food.findFirst({
            where: { id, userId: req.user.id }
        });
        if (!existingFood)
            return res.status(404).json({ message: 'Food not found' });
        const updatedFood = yield prisma_1.default.food.update({
            where: { id },
            data: {
                name,
                category,
                quantity: Number(quantity),
                purchaseDate: new Date(purchaseDate),
                expirationDate: new Date(expirationDate),
                image,
                tags: Array.isArray(tags) ? tags.join(',') : '',
                notes
            }
        });
        res.json({
            id: updatedFood.id.toString(),
            name: updatedFood.name,
            category: updatedFood.category,
            quantity: updatedFood.quantity,
            purchaseDate: updatedFood.purchaseDate,
            expirationDate: updatedFood.expirationDate,
            image: updatedFood.image,
            tags: updatedFood.tags ? updatedFood.tags.split(',') : [],
            notes: updatedFood.notes
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating food' });
    }
}));
// Batch Delete
router.post('/batch-delete', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { ids } = req.body; // Expecting { ids: [1, 2, 3] }
        if (!Array.isArray(ids))
            return res.status(400).json({ message: 'Invalid IDs' });
        // Convert string IDs to numbers if necessary
        const numericIds = ids.map((id) => Number(id)).filter(id => !isNaN(id));
        yield prisma_1.default.food.deleteMany({
            where: {
                id: { in: numericIds },
                userId: req.user.id // Security check
            }
        });
        res.json({ message: 'Batch deleted successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error batch deleting foods' });
    }
}));
// Delete food
router.delete('/:id', auth_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id))
            return res.status(400).json({ message: 'Invalid ID' });
        // Ensure user owns the food
        const food = yield prisma_1.default.food.findFirst({
            where: { id, userId: req.user.id }
        });
        if (!food)
            return res.status(404).json({ message: 'Food not found' });
        yield prisma_1.default.food.delete({ where: { id } });
        res.json({ message: 'Deleted' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting food' });
    }
}));
exports.default = router;
