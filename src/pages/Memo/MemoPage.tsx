import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { Memo } from '@/services/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Plus, Trash2, CheckSquare, Square, StickyNote, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export const MemoPage = () => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    setIsSubmitting(true);
    try {
      const newMemo = await apiService.createMemo(newContent);
      setMemos([newMemo, ...memos]);
      setNewContent('');
    } catch (error) {
      console.error('Failed to add memo', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    setMemos(memos.map(m => m.id === id ? { ...m, completed: !m.completed } : m));
    try {
      await apiService.toggleMemo(id);
    } catch (error) {
      console.error('Failed to toggle memo', error);
      fetchMemos();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定删除这条备忘吗？')) return;
    setMemos(memos.filter(m => m.id !== id));
    try {
      await apiService.deleteMemo(id);
    } catch (error) {
      console.error('Failed to delete memo', error);
      fetchMemos();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <StickyNote className="w-8 h-8 text-mint-500" />
          备忘录
        </h1>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {memos.filter(m => !m.completed).length} 个待办 / 共 {memos.length} 个
        </span>
      </div>

      {/* Input Area */}
      <Card className="border-mint-100 shadow-sm overflow-hidden">
        <CardContent className="p-4 flex gap-3 sm:flex-row flex-col">
           <Input 
             placeholder="记录新的备忘 (例如：明天要把牛奶喝了)..." 
             value={newContent}
             onChange={e => setNewContent(e.target.value)}
             onKeyDown={e => e.key === 'Enter' && handleAdd()}
             className="flex-1 border-gray-200 focus:border-mint-500 h-11"
           />
           <Button onClick={handleAdd} disabled={!newContent.trim() || isSubmitting} className="h-11 px-6">
             <Plus className="w-4 h-4 mr-2" /> 添加备忘
           </Button>
        </CardContent>
      </Card>

      {/* List */}
      {memos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
           <StickyNote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
           <p className="text-gray-500 font-medium">暂无备忘录</p>
           <p className="text-sm text-gray-400 mt-1">记录生活中的点滴琐事，防止遗忘</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {memos.map(memo => (
            <Card key={memo.id} className={cn("group transition-all hover:shadow-md border-gray-200", memo.completed ? "opacity-60 bg-gray-50" : "bg-white border-l-4 border-l-mint-500")}>
               <CardContent className="p-4 flex flex-col h-full min-h-[140px]">
                  <div className="flex items-start justify-between gap-2 flex-1">
                     <p className={cn("text-sm font-medium leading-relaxed break-words whitespace-pre-wrap", memo.completed && "line-through text-gray-500")}>
                       {memo.content}
                     </p>
                     <button 
                       onClick={() => handleDelete(memo.id)} 
                       className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                       title="删除"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-50">
                     <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(memo.createdAt), 'MM-dd')}
                     </span>
                     <button 
                       onClick={() => handleToggle(memo.id)}
                       className={cn("flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-all", 
                         memo.completed 
                           ? "bg-gray-100 text-gray-500 hover:bg-gray-200" 
                           : "bg-mint-50 text-mint-600 hover:bg-mint-100")}
                     >
                       {memo.completed ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                       {memo.completed ? "已完成" : "待办"}
                     </button>
                  </div>
               </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

