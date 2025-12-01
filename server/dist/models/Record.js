"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Record = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const recordSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    foodName: { type: String, required: true },
    quantity: { type: Number, required: true },
    reason: { type: String, required: true },
    returnDate: { type: Date, required: true },
    timestamp: { type: Date, default: Date.now }
});
exports.Record = mongoose_1.default.model('Record', recordSchema);
