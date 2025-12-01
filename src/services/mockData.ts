import { FoodItem, User, ReturnRecord, Memo } from './types';
import { addDays, subDays } from 'date-fns';

export const MOCK_USER: User = {
  id: '1',
  username: '演示用户',
  email: 'demo@example.com',
  token: 'mock_token_12345',
  role: 'admin', // Mock admin role
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', // 随机头像API
  registerDate: '2023-11-01',
  qqEmail: '12345678@qq.com',
  enableEmailNotify: true,
};

const today = new Date();

export const MOCK_FOODS: FoodItem[] = [
  {
    id: '1',
    name: '鲜牛奶',
    category: '乳制品',
    purchaseDate: subDays(today, 2).toISOString(),
    expirationDate: addDays(today, 5).toISOString(), 
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=150&h=150&fit=crop'
  },
  {
    id: '2',
    name: '鸡胸肉',
    category: '肉类',
    purchaseDate: subDays(today, 1).toISOString(),
    expirationDate: addDays(today, 2).toISOString(), 
    quantity: 2,
  },
  {
    id: '3',
    name: '酸奶',
    category: '乳制品',
    purchaseDate: subDays(today, 5).toISOString(),
    expirationDate: addDays(today, 4).toISOString(), 
    quantity: 4,
  },
  {
    id: '4',
    name: '苹果',
    category: '蔬果',
    purchaseDate: subDays(today, 3).toISOString(),
    expirationDate: addDays(today, 10).toISOString(), 
    quantity: 6,
    image: 'https://images.unsplash.com/photo-1560806887-dd5812614d6b?w=150&h=150&fit=crop'
  },
  {
    id: '5',
    name: '全麦面包',
    category: '烘焙',
    purchaseDate: subDays(today, 4).toISOString(),
    expirationDate: subDays(today, 1).toISOString(), 
    quantity: 1,
  },
];

export const MOCK_RECORDS: ReturnRecord[] = [
  {
    id: '101',
    foodName: '过期酸奶',
    quantity: 2,
    returnDate: subDays(today, 5).toISOString(),
    reason: '过期处理',
    timestamp: subDays(today, 5).toISOString()
  },
  {
    id: '102',
    foodName: '损坏的鸡蛋',
    quantity: 6,
    returnDate: subDays(today, 10).toISOString(),
    reason: '退货',
    timestamp: subDays(today, 10).toISOString()
  }
];

export const MOCK_MEMOS: Memo[] = [
  { id: '1', content: '记得买鸡蛋', completed: false, createdAt: new Date().toISOString() },
  { id: '2', content: '处理过期的牛奶', completed: true, createdAt: subDays(new Date(), 1).toISOString() },
];
