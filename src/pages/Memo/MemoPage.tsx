import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { Memo } from '@/services/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Plus, StickyNote, Trash2, X, CheckSquare } from 'lucide-react';
import { MemoFlipCard } from '@/components/MemoFlipCard';

export const MemoPage = () => {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Batch Management State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const handleUpdate = async (id: string, content: string) => {
    setMemos(memos.map(m => m.id === id ? { ...m, content } : m));
    try {
      await apiService.updateMemo(id, content);
    } catch (error) {
      console.error('Failed to update memo', error);
      fetchMemos(); // Revert on error
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

  // Batch Operations
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set()); // Clear selection when toggling
  };

  const handleSelectToggle = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`确定要删除选中的 ${selectedIds.size} 条备忘吗？`)) return;

    const idsToDelete = Array.from(selectedIds);
    // Optimistic update
    setMemos(memos.filter(m => !selectedIds.has(m.id)));
    setIsSelectionMode(false);
    setSelectedIds(new Set());

    try {
      await apiService.batchDeleteMemos(idsToDelete);
    } catch (error) {
      console.error('Failed to batch delete memos', error);
      fetchMemos(); // Revert
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === memos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(memos.map(m => m.id)));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <StickyNote className="w-8 h-8 text-mint-500" />
          备忘录
          <span className="text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full ml-2">
            {memos.filter(m => !m.completed).length} 个待办
          </span>
        </h1>
        
        <div className="flex items-center gap-2">
          {isSelectionMode ? (
            <>
              <Button variant="ghost" onClick={handleSelectAll} size="sm">
                {selectedIds.size === memos.length ? '取消全选' : '全选'}
              </Button>
              <Button 
                variant="danger" 
                size="sm" 
                onClick={handleBatchDelete}
                disabled={selectedIds.size === 0}
              >
                <Trash2 className="w-4 h-4 mr-1" /> 删除选中 ({selectedIds.size})
              </Button>
              <Button variant="secondary" size="sm" onClick={toggleSelectionMode}>
                <X className="w-4 h-4 mr-1" /> 完成
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={toggleSelectionMode}>
              <CheckSquare className="w-4 h-4 mr-1" /> 批量管理
            </Button>
          )}
        </div>
      </div>

      {/* Input Area - Hide in selection mode to reduce clutter */}
      {!isSelectionMode && (
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
      )}

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
            <MemoFlipCard
              key={memo.id}
              memo={memo}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onToggle={handleToggle}
              selectionMode={isSelectionMode}
              isSelected={selectedIds.has(memo.id)}
              onSelectToggle={handleSelectToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};
