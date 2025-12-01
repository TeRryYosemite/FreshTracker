import { useState, useEffect } from 'react';
import { Plus, X, Trash2, CheckSquare, Square } from 'lucide-react';
import { apiService } from '@/services/api';
import { Memo } from '@/services/types';
import { cn } from '@/lib/utils';

export const QuickMemo = () => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [newMemoContent, setNewMemoContent] = useState('');
  const [isOpen, setIsOpen] = useState(true); // Default open

  useEffect(() => {
    fetchMemos();
  }, []);

  const fetchMemos = async () => {
    try {
      const data = await apiService.getMemos();
      setMemos(data);
    } catch (error) {
      console.error('Failed to fetch memos', error);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoContent.trim()) return;
    
    try {
      const newMemo = await apiService.createMemo(newMemoContent);
      setMemos([newMemo, ...memos]);
      setNewMemoContent('');
    } catch (error) {
      console.error('Failed to add memo', error);
    }
  };

  const handleToggle = async (id: string) => {
    // Optimistic update
    setMemos(memos.map(m => m.id === id ? { ...m, completed: !m.completed } : m));
    try {
      await apiService.toggleMemo(id);
    } catch (error) {
      console.error('Failed to toggle memo', error);
      fetchMemos(); // Revert on error
    }
  };

  const handleDelete = async (id: string) => {
    // Optimistic update
    setMemos(memos.filter(m => m.id !== id));
    try {
      await apiService.deleteMemo(id);
    } catch (error) {
      console.error('Failed to delete memo', error);
      fetchMemos(); // Revert on error
    }
  };

  return (
    <div className="border-t border-gray-100 bg-gray-50/50">
      <div 
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          📝 备忘录
          <span className="bg-mint-100 text-mint-700 px-1.5 py-0.5 rounded-full text-[10px]">
            {memos.filter(m => !m.completed).length}
          </span>
        </span>
        <Plus className={cn("w-4 h-4 text-gray-400 transition-transform duration-200", isOpen ? "rotate-45" : "")} />
      </div>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-2">
          {/* List */}
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin pr-1">
            {memos.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">暂无事项</p>
            )}
            {memos.map(memo => (
              <div key={memo.id} className="group flex items-start gap-2 text-sm group">
                <button 
                  onClick={() => handleToggle(memo.id)}
                  className={cn("mt-0.5 shrink-0 transition-colors", memo.completed ? "text-mint-500" : "text-gray-400 hover:text-mint-500")}
                >
                  {memo.completed ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                </button>
                <span className={cn(
                  "flex-1 break-all transition-all",
                  memo.completed ? "text-gray-400 line-through decoration-gray-300" : "text-gray-700"
                )}>
                  {memo.content}
                </span>
                <button 
                  onClick={() => handleDelete(memo.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Input */}
          <form onSubmit={handleAdd} className="relative">
            <input 
              type="text" 
              placeholder="添加新事项..." 
              className="w-full text-xs bg-white border border-gray-200 rounded-md pl-2 pr-8 py-2 focus:outline-none focus:border-mint-500 focus:ring-1 focus:ring-mint-500 transition-all placeholder:text-gray-400"
              value={newMemoContent}
              onChange={(e) => setNewMemoContent(e.target.value)}
            />
            <button 
              type="submit"
              disabled={!newMemoContent.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-mint-600 hover:text-mint-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

