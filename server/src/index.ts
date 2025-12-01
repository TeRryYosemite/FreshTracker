import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import foodRoutes from './routes/food';
import userRoutes from './routes/user';
import recordRoutes from './routes/record';
import adminRoutes from './routes/admin';
import memoRoutes from './routes/memo';
import { startEmailScheduler } from './services/emailService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*', // 允许所有来源，解决跨域问题
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// Health Check Route
app.get('/', (req, res) => {
  res.send('Food Tracker API is running!');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/user', userRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/memos', memoRoutes);
app.use('/api/admin', adminRoutes);

// Start Scheduler
startEmailScheduler();

// Start Server
app.listen(Number(PORT), () => {
  console.log(`Server running on port ${PORT}`);
});// 比如 http://192.168.1.100:3000
