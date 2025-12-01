import axios from 'axios';
import { useAppStore } from '../store/useAppStore';
import { MOCK_FOODS, MOCK_USER, MOCK_RECORDS, MOCK_MEMOS } from './mockData';
import { FoodItem, LoginResponse, User, ReturnRecord, Memo } from './types';

// Helper to get current config
const getConfig = () => {
  const state = useAppStore.getState();
  return {
    isMock: state.isMockMode,
    baseUrl: state.serverUrl,
  };
};

// Real API Client
const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to inject dynamic base URL and token
apiClient.interceptors.request.use((config) => {
  const { baseUrl } = getConfig();
  config.baseURL = baseUrl;
  
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Service Layer ---

export const apiService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { isMock } = getConfig();
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (email === 'demo@example.com' && password === 'password') {
        return { user: MOCK_USER, token: MOCK_USER.token! };
      }
      throw new Error('账号或密码错误 (试用: demo@example.com / password)');
    } else {
      const response = await apiClient.post<LoginResponse>('/auth/login', { email, password });
      return response.data;
    }
  },

  // New: Send Verification Code
  sendVerificationCode: async (email: string, type: 'REGISTER' | 'RESET_PASSWORD'): Promise<void> => {
    const { isMock } = getConfig();
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      console.log(`[Mock] Verification Code sent to ${email}: 123456`);
      alert(`[Mock] 您的验证码是: 123456`);
      return;
    } else {
      await apiClient.post('/auth/send-code', { email, type });
    }
  },

  // Updated: Register with code
  register: async (email: string, password: string, username: string, code?: string): Promise<LoginResponse> => {
    const { isMock } = getConfig();
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (code && code !== '123456') throw new Error('验证码错误');
      return { user: { ...MOCK_USER, email, username }, token: 'new_mock_token' };
    } else {
      const response = await apiClient.post<LoginResponse>('/auth/register', { email, password, username, code });
      return response.data;
    }
  },

  // New: Reset Password
  resetPassword: async (email: string, password: string, code: string): Promise<void> => {
    const { isMock } = getConfig();
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (code !== '123456') throw new Error('验证码错误');
      return;
    } else {
      await apiClient.post('/auth/reset-password', { email, password, code });
    }
  },

  getFoods: async (): Promise<FoodItem[]> => {
    const { isMock } = getConfig();
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return [...MOCK_FOODS];
    } else {
      const response = await apiClient.get<FoodItem[]>('/foods');
      return response.data;
    }
  },

  addFood: async (food: Omit<FoodItem, 'id'>): Promise<FoodItem> => {
    const { isMock } = getConfig();
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newFood: FoodItem = { ...food, id: Math.random().toString(36).substr(2, 9) };
      MOCK_FOODS.push(newFood);
      return newFood;
    } else {
      const response = await apiClient.post<FoodItem>('/foods', food);
      return response.data;
    }
  },

  updateFood: async (id: string, food: Partial<FoodItem>): Promise<FoodItem> => {
    const { isMock } = getConfig();
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const index = MOCK_FOODS.findIndex((f) => f.id === id);
      if (index > -1) {
        MOCK_FOODS[index] = { ...MOCK_FOODS[index], ...food };
        return MOCK_FOODS[index];
      }
      throw new Error('Food not found');
    } else {
      const response = await apiClient.put<FoodItem>(`/foods/${id}`, food);
      return response.data;
    }
  },

  deleteFood: async (id: string): Promise<void> => {
    const { isMock } = getConfig();
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const index = MOCK_FOODS.findIndex((f) => f.id === id);
      if (index > -1) MOCK_FOODS.splice(index, 1);
    } else {
      await apiClient.delete(`/foods/${id}`);
    }
  },

  batchDeleteFoods: async (ids: string[]): Promise<void> => {
    const { isMock } = getConfig();
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      ids.forEach(id => {
        const index = MOCK_FOODS.findIndex((f) => f.id === id);
        if (index > -1) MOCK_FOODS.splice(index, 1);
      });
    } else {
      await apiClient.post('/foods/batch-delete', { ids });
    }
  },

  batchImportFoods: async (foods: Partial<FoodItem>[]): Promise<void> => {
    const { isMock } = getConfig();
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      console.log('[Mock] Imported', foods.length);
    } else {
      await apiClient.post('/foods/batch-import', foods);
    }
  },

  updateProfile: async (user: Partial<User>): Promise<User> => {
    const { isMock } = getConfig();
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      Object.assign(MOCK_USER, user);
      return { ...MOCK_USER };
    } else {
      const response = await apiClient.put<User>('/user/profile', user);
      return response.data;
    }
  },

  getRecords: async (): Promise<ReturnRecord[]> => {
    const { isMock } = getConfig();
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return [...MOCK_RECORDS];
    } else {
      const response = await apiClient.get<ReturnRecord[]>('/records');
      return response.data;
    }
  },

  deleteRecord: async (id: string): Promise<void> => {
    const { isMock } = getConfig();
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const index = MOCK_RECORDS.findIndex((r) => r.id === id);
      if (index > -1) MOCK_RECORDS.splice(index, 1);
    } else {
      await apiClient.delete(`/records/${id}`);
    }
  },

  batchDeleteRecords: async (ids: string[]): Promise<void> => {
    const { isMock } = getConfig();
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      ids.forEach(id => {
        const index = MOCK_RECORDS.findIndex((r) => r.id === id);
        if (index > -1) MOCK_RECORDS.splice(index, 1);
      });
    } else {
      await apiClient.post('/records/batch-delete', { ids });
    }
  },

  sendEmailTest: async (email: string): Promise<void> => {
    const { isMock } = getConfig();
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(`[Mock] Email sent to ${email}`);
      return;
    } else {
      await apiClient.post('/user/email-test', { email });
    }
  },

  // --- Memo APIs ---
  getMemos: async (): Promise<Memo[]> => {
    const { isMock } = getConfig();
    if (isMock) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return [...MOCK_MEMOS];
    } else {
      const response = await apiClient.get<Memo[]>('/memos');
      return response.data;
    }
  },

  createMemo: async (content: string): Promise<Memo> => {
    const { isMock } = getConfig();
    if (isMock) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newMemo: Memo = {
        id: Math.random().toString(36).substr(2, 9),
        content,
        completed: false,
        createdAt: new Date().toISOString()
      };
      MOCK_MEMOS.unshift(newMemo);
      return newMemo;
    } else {
      const response = await apiClient.post<Memo>('/memos', { content });
      return response.data;
    }
  },

  updateMemo: async (id: string, content: string): Promise<Memo> => {
    const { isMock } = getConfig();
    if (isMock) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const memo = MOCK_MEMOS.find(m => m.id === id);
      if (memo) {
         memo.content = content;
         return { ...memo };
      }
      throw new Error('Memo not found');
    } else {
      const response = await apiClient.put<Memo>(`/memos/${id}`, { content });
      return response.data;
    }
  },

  toggleMemo: async (id: string): Promise<Memo> => {
    const { isMock } = getConfig();
    if (isMock) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const memo = MOCK_MEMOS.find(m => m.id === id);
      if (memo) {
         memo.completed = !memo.completed;
         return { ...memo };
      }
      throw new Error('Memo not found');
    } else {
      const response = await apiClient.put<Memo>(`/memos/${id}/toggle`);
      return response.data;
    }
  },

  deleteMemo: async (id: string): Promise<void> => {
    const { isMock } = getConfig();
    if (isMock) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const index = MOCK_MEMOS.findIndex(m => m.id === id);
      if (index > -1) MOCK_MEMOS.splice(index, 1);
    } else {
      await apiClient.delete(`/memos/${id}`);
    }
  },

  batchDeleteMemos: async (ids: string[]): Promise<void> => {
    const { isMock } = getConfig();
    if (isMock) {
      await new Promise(resolve => setTimeout(resolve, 500));
      ids.forEach(id => {
        const index = MOCK_MEMOS.findIndex(m => m.id === id);
        if (index > -1) MOCK_MEMOS.splice(index, 1);
      });
    } else {
      await apiClient.post('/memos/batch-delete', { ids });
    }
  },

  // --- Admin APIs ---
  adminGetUsers: async (): Promise<User[]> => {
    const { isMock } = getConfig();
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Return a few mock users
      return [
        MOCK_USER,
        { ...MOCK_USER, id: '2', username: 'TestUser2', email: 'user2@test.com', role: 'user', qqEmail: 'test2@qq.com' },
        { ...MOCK_USER, id: '3', username: 'TestUser3', email: 'user3@test.com', role: 'user' }
      ];
    } else {
      const response = await apiClient.get<User[]>('/admin/users');
      return response.data;
    }
  },

  adminUpdateUser: async (id: string, data: Partial<User> & { password?: string }): Promise<User> => {
    const { isMock } = getConfig();
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (id === MOCK_USER.id) Object.assign(MOCK_USER, data);
      return { ...MOCK_USER, ...data };
    } else {
      const response = await apiClient.put<User>(`/admin/users/${id}`, data);
      return response.data;
    }
  },

  adminDeleteUser: async (id: string): Promise<void> => {
    const { isMock } = getConfig();
    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log(`[Mock] Deleted user ${id}`);
    } else {
      await apiClient.delete(`/admin/users/${id}`);
    }
  }
};
