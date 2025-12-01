import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  isMockMode: boolean;
  serverUrl: string;
  toggleMockMode: () => void;
  setServerUrl: (url: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // 1. 关闭 Mock 模式，强制使用真实接口
      isMockMode: false, 

      // 2. 本地开发配置：直接指向本地后端地址
      serverUrl: 'http://localhost:3000/api', 

      toggleMockMode: () => set((state) => ({ isMockMode: !state.isMockMode })),
      setServerUrl: (url) => set({ serverUrl: url }),
    }),
    {
      // 3. 更新版本号以清除旧缓存
      name: 'app-storage-v11', 
    }
  )
);
