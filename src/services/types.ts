export interface User {
  id: string;
  username: string;
  email: string;
  token?: string;
  avatar?: string;      // 新增：头像
  qqEmail?: string;     // 新增：QQ邮箱用于提醒
  registerDate?: string; // 新增：注册时间
  enableEmailNotify?: boolean; // 新增：是否开启提醒
  notifyDays?: number;  // 新增：提前提醒天数
  role?: 'user' | 'admin'; // 新增：角色
}

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  purchaseDate: string;
  expirationDate: string;
  quantity: number;
  notes?: string;
  tags?: string[];
  image?: string;
  userId?: string; // 关联用户ID
}

export interface ReturnRecord {
  id: string;
  foodName: string;
  quantity: number;
  returnDate: string;     // 实际退货/处理日期
  reason: string;         // 原因 (如：过期退货、吃完了)
  image?: string;         // 记录时的照片
  timestamp: string;      // 记录生成时间
}

export interface Memo {
  id: string;
  content: string;
  completed: boolean;
  createdAt: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface ApiError {
  message: string;
  code?: string;
}
