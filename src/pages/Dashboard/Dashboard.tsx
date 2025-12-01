import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { FoodItem } from '@/services/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FoodItemCard } from './components/FoodItemCard';
import { AddFoodModal } from './components/AddFoodModal';
import { differenceInDays, parseISO } from 'date-fns';
// import { cn } from '@/lib/utils'; // Removed unused import

export const Dashboard = () => {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);

  // Selection State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const fetchFoods = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getFoods();
      const sortedData = data.sort((a, b) => {
        return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
      });
      setFoods(sortedData);
      filterFoods(sortedData, searchQuery);
    } catch (error) {
      console.error('获取食品列表失败', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterFoods = (data: FoodItem[], query: string) => {
    if (!query) {
      setFilteredFoods(data);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const filtered = data.filter(f => 
      f.name.toLowerCase().includes(lowerQuery) || 
      f.category.toLowerCase().includes(lowerQuery) ||
      (f.tags && f.tags.some(t => t.toLowerCase().includes(lowerQuery)))
    );
    setFilteredFoods(filtered);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    filterFoods(foods, query);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个物品吗？')) {
      try {
        await apiService.deleteFood(id);
        setFoods(prev => {
          const newData = prev.filter(f => f.id !== id);
          filterFoods(newData, searchQuery);
          return newData;
        });
      } catch (error) {
        console.error('删除失败', error);
      }
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`确定要删除选中的 ${selectedIds.size} 个物品吗？`)) {
      try {
        await apiService.batchDeleteFoods(Array.from(selectedIds));
        setFoods(prev => {
          const newData = prev.filter(f => !selectedIds.has(f.id));
          filterFoods(newData, searchQuery);
          return newData;
        });
        setSelectedIds(new Set());
        setIsSelectionMode(false);
      } catch (error) {
        console.error('批量删除失败', error);
      }
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredFoods.length) {
      // Already all selected -> Deselect all
      setSelectedIds(new Set());
    } else {
      // Select all visible foods
      const allIds = filteredFoods.map(f => f.id);
      setSelectedIds(new Set(allIds));
    }
  };

  const handleEdit = (item: FoodItem) => {
    setEditingFood(item);
    setIsAddModalOpen(true);
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const expiringSoonCount = foods.filter(f => {
    const days = differenceInDays(parseISO(f.expirationDate), new Date());
    return days <= 3 && days >= 0;
  }).length;

  const expiredCount = foods.filter(f => {
    return differenceInDays(parseISO(f.expirationDate), new Date()) < 0;
  }).length;

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      {/* 头部区域 - 固定 */}
      <div className="flex-shrink-0 space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">我的食品库</h1>
            <p className="text-gray-500 text-sm mt-1">管理您的食品库存和保质期</p>
          </div>
          <div className="flex gap-2">
            {isSelectionMode ? (
              <Button variant="ghost" onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }}>
                取消选择
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setIsSelectionMode(true)}>
                多选
              </Button>
            )}
            <Button onClick={() => { setEditingFood(null); setIsAddModalOpen(true); }} className="shadow-md bg-mint-600 hover:bg-mint-700">
              <Plus className="w-4 h-4 mr-2" />
              添加
            </Button>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            value={searchQuery}
            onChange={handleSearch}
            placeholder="搜索食品名称或分类..." 
            className="pl-9 bg-white shadow-sm"
          />
        </div>

        {/* 统计卡片 (仅在非选择模式下显示) */}
        {!isSelectionMode && (
          <div className="flex overflow-x-auto pb-2 -mx-4 px-4 gap-4 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0 no-scrollbar touch-pan-x">
            <div className="min-w-[240px] bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between shrink-0">
              <div>
                 <p className="text-xs sm:text-sm text-gray-500 font-medium">物品总数</p>
                 <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{foods.length}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-sm sm:text-base">
                 📦
              </div>
            </div>
            <div className="min-w-[240px] bg-gradient-to-br from-orange-50 to-white p-3 sm:p-4 rounded-xl border border-orange-100 shadow-sm flex items-center justify-between shrink-0">
              <div>
                 <p className="text-xs sm:text-sm text-orange-600 font-medium">即将过期</p>
                 <p className="text-xl sm:text-2xl font-bold text-orange-700 mt-1">{expiringSoonCount}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 animate-pulse text-sm sm:text-base">
                 ⚠️
              </div>
            </div>
            <div className="min-w-[240px] bg-gradient-to-br from-red-50 to-white p-3 sm:p-4 rounded-xl border border-red-100 shadow-sm flex items-center justify-between shrink-0">
              <div>
                 <p className="text-xs sm:text-sm text-red-600 font-medium">已过期</p>
                 <p className="text-xl sm:text-2xl font-bold text-red-700 mt-1">{expiredCount}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center text-red-500 text-sm sm:text-base">
                 🚫
              </div>
            </div>
          </div>
        )}

        {/* 列表标题栏 */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            {isSelectionMode ? (
              <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 cursor-pointer" onClick={handleSelectAll}>
                  <input 
                    type="checkbox"
                    checked={filteredFoods.length > 0 && selectedIds.size === filteredFoods.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-mint-600 focus:ring-mint-500 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">全选</span>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <span className="text-sm text-mint-600 font-medium">已选 {selectedIds.size} 项</span>
              </div>
            ) : (
              <h2 className="text-lg font-semibold text-gray-900">库存列表</h2>
            )}
          </div>
          {!isSelectionMode && (
            <Button variant="ghost" size="sm" onClick={fetchFoods} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </div>

      {/* 列表区域 - 可滚动 */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-20 no-scrollbar">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">正在加载库存...</div>
        ) : filteredFoods.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 mb-2">没有找到相关物品</p>
            {searchQuery ? (
              <Button variant="secondary" size="sm" onClick={() => setSearchQuery('')}>清除搜索</Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setIsAddModalOpen(true)}>添加第一个物品</Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredFoods.map((item) => (
              <div key={item.id} className="relative flex items-center gap-3">
                {isSelectionMode && (
                  <div className="shrink-0">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelection(item.id)}
                      className="w-5 h-5 rounded border-gray-300 text-mint-600 focus:ring-mint-500"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => isSelectionMode ? toggleSelection(item.id) : handleEdit(item)}>
                  <FoodItemCard item={item} onDelete={handleDelete} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部批量操作栏 */}
      {isSelectionMode && selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-4 right-4 md:left-72 max-w-5xl mx-auto bg-white p-4 rounded-xl shadow-lg border border-gray-200 flex items-center justify-between animate-in slide-in-from-bottom-10 z-50">
          <span className="text-sm font-medium text-gray-600">已选中 {selectedIds.size} 个物品</span>
          <Button variant="danger" onClick={handleBatchDelete} className="shadow-md">
            <Trash2 className="w-4 h-4 mr-2" />
            批量删除
          </Button>
        </div>
      )}

      <AddFoodModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchFoods}
        initialData={editingFood}
      />
    </div>
  );
};
