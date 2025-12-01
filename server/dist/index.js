"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const food_1 = __importDefault(require("./routes/food"));
const user_1 = __importDefault(require("./routes/user"));
const record_1 = __importDefault(require("./routes/record"));
const admin_1 = __importDefault(require("./routes/admin"));
const emailService_1 = require("./services/emailService");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)({
    origin: '*', // 允许所有来源，解决跨域问题
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '10mb' }));
// Health Check Route
app.get('/', (req, res) => {
    res.send('Food Tracker API is running!');
});
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/foods', food_1.default);
app.use('/api/user', user_1.default);
app.use('/api/records', record_1.default);
app.use('/api/admin', admin_1.default);
// Start Scheduler
(0, emailService_1.startEmailScheduler)();
// Start Server
app.listen(Number(PORT), () => {
    console.log(`Server running on port ${PORT}`);
}); // 比如 http://192.168.1.100:3000
