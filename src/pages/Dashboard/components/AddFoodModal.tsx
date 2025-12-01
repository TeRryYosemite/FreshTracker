import { useState, useEffect } from 'react';
import { X, Camera, Calendar as CalendarIcon, ChevronDown, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiService } from '@/services/api';
import { addDays, addMonths, addYears, format, subDays, differenceInDays } from 'date-fns';
import { cn, compressImage } from '@/lib/utils';
import { FoodItem } from '@/services/types';

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: FoodItem | null;
}

type Unit = 'day' | 'week' | 'month' | 'year';

const REDUCTION_OPTIONS = [
  { label: '无', value: '0' },
  { label: '1/10', value: '1/10' },
  { label: '1/6', value: '1/6' },
  { label: '1/5', value: '1/5' },
  { label: '1/4', value: '1/4' },
  { label: '1/3', value: '1/3' },
  { label: '1/2', value: '1/2' },
  { label: '1天', value: '1d' },
  { label: '2天', value: '2d' },
  { label: '3天', value: '3d' },
  { label: '5天', value: '5d' },
  { label: '7天', value: '7d' },
  { label: '15天', value: '15d' },
  { label: '30天', value: '30d' },
];

// 常用预设标签
const PRESET_TAGS = ['冷冻', '冷藏', '常温', '开封即食', '避光', '生鲜', '临期特价'];

export const AddFoodModal = ({ isOpen, onClose, onSuccess, initialData }: AddFoodModalProps) => {
  const isEditMode = !!initialData;

  // Basic Info
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [image, setImage] = useState<string>('');
  
  // Tags State
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Calculator State
  const [productionDate, setProductionDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [shelfLife, setShelfLife] = useState<number>(1);
  const [unit, setUnit] = useState<Unit>('day');
  const [reduction, setReduction] = useState<string>('0');

  // Calculated Results
  const [expireDate, setExpireDate] = useState('');
  const [remainingDays, setRemainingDays] = useState(0);
  const [returnDate, setReturnDate] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  // Initialize Form when opening
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setCategory(initialData.category);
        setQuantity(initialData.quantity);
        setImage(initialData.image || '');
        setTags(initialData.tags || []); // Load tags
        setProductionDate(format(new Date(initialData.purchaseDate), 'yyyy-MM-dd'));
        
        // Calculate shelf life from dates to avoid resetting to 1 day
        const start = new Date(initialData.purchaseDate);
        const end = new Date(initialData.expirationDate);
        const diff = differenceInDays(end, start);
        setShelfLife(diff >= 0 ? diff + 1 : 1);
        setUnit('day');
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialData]);

  // Calculate Dates Logic (Same as before)
  useEffect(() => {
    if (!productionDate) return;

    const start = new Date(productionDate);
    let end = new Date(start);

    if (shelfLife > 0) {
      switch (unit) {
        case 'day': end = addDays(start, shelfLife - 1); break;
        case 'week': end = addDays(start, (shelfLife * 7) - 1); break;
        case 'month': end = addMonths(start, shelfLife); end = subDays(end, 1); break;
        case 'year': end = addYears(start, shelfLife); end = subDays(end, 1); break;
      }
    }

    const expireDateStr = format(end, 'yyyy-MM-dd');
    setExpireDate(expireDateStr);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endZero = new Date(end);
    endZero.setHours(0, 0, 0, 0);
    const diff = differenceInDays(endZero, today);
    setRemainingDays(diff);

    let returnDateObj = new Date(end);
    if (reduction !== '0') {
      let reduceDays = 0;
      if (reduction.includes('/')) {
        const [num, den] = reduction.split('/').map(Number);
        const totalSpan = differenceInDays(end, start) + 1; 
        reduceDays = Math.floor(totalSpan * (num / den));
      } else if (reduction.endsWith('d')) {
        reduceDays = parseInt(reduction);
      }
      returnDateObj = subDays(returnDateObj, reduceDays);
    }
    returnDateObj = subDays(returnDateObj, 1);
    setReturnDate(format(returnDateObj, 'yyyy-MM-dd'));

  }, [productionDate, shelfLife, unit, reduction]);

  if (!isOpen) return null;

  // ... handleImageUpload ... 
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Compress image before setting state
        const compressedBase64 = await compressImage(file);
        setImage(compressedBase64);
      } catch (error) {
        console.error('Image compression failed:', error);
        alert('图片处理失败，请重试');
      }
    }
  };

  // Tag Logic
  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const foodData = {
        name: name || '未命名商品',
        category: category || '默认',
        quantity,
        purchaseDate: new Date(productionDate).toISOString(),
        expirationDate: new Date(expireDate).toISOString(),
        image,
        tags, // Submit tags
        notes: `退货日期: ${returnDate}`
      };

      if (isEditMode && initialData) {
        await apiService.updateFood(initialData.id, foodData);
      } else {
        await apiService.addFood(foodData);
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('操作失败', error);
      alert('保存失败');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setCategory('');
    setQuantity(1);
    setImage('');
    setTags([]);
    setNewTag('');
    setShelfLife(1);
    setReduction('0');
    setProductionDate(format(new Date(), 'yyyy-MM-dd'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-0 relative animate-in zoom-in-95 duration-200 my-4 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <h2 className="text-lg font-bold text-gray-900">{isEditMode ? '编辑食品' : '添加新食品'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-6">
          
          {/* Result & Photo & Date Inputs (Keep existing layout) */}
          {/* ... (Keep previous sections 1-6) ... */}
          <div className="bg-orange-50 rounded-xl p-4 space-y-4 border border-orange-100 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">到期日期</span>
              <span className="text-xl font-bold text-danger-500">{expireDate}</span>
            </div>
            <div className="flex justify-between items-center border-t border-orange-100 pt-3">
              <span className="text-gray-600 font-medium">剩余(天)</span>
              <span className={cn("text-xl font-bold", remainingDays < 0 ? "text-red-600" : "text-mint-600")}>
                {remainingDays}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-orange-100 pt-3">
              <span className="text-gray-600 font-medium">退货日期</span>
              <span className="text-xl font-bold text-blue-600">{returnDate}</span>
            </div>
          </div>

          <div className="relative group">
            {image ? (
              <div className="w-full h-40 rounded-xl overflow-hidden relative border border-gray-200 shadow-sm">
                <img src={image} className="w-full h-full object-cover" />
                <button 
                  onClick={() => setImage('')} 
                  className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => document.getElementById('file-upload')?.click()}
                className="w-full h-20 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors flex flex-col items-center justify-center cursor-pointer gap-1"
              >
                <Camera className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">点击拍照或上传图片</span>
              </div>
            )}
            <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

          {/* Production Date */}
          <div className="bg-yellow-50 rounded-xl p-4 flex items-center justify-between border border-yellow-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-3 z-10 pointer-events-none">
              <div className="p-2 bg-yellow-100 rounded-lg text-yellow-700">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <span className="font-bold text-gray-700">生产日期</span>
            </div>
            <Input 
              type="date" 
              value={productionDate} 
              onChange={(e) => setProductionDate(e.target.value)} 
              className="w-40 bg-transparent border-none text-right font-bold text-xl text-gray-900 focus:ring-0 p-0 z-20 cursor-pointer"
            />
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-yellow-100 rounded-full opacity-50 z-0" />
          </div>

          {/* Shelf Life */}
          <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between border border-blue-100 shadow-sm">
            <span className="font-bold text-blue-700 shrink-0">保质期</span>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setShelfLife(Math.max(0, shelfLife - 1))} className="w-10 h-10 flex items-center justify-center bg-white rounded-lg text-blue-600 shadow-sm hover:bg-blue-100 active:scale-95 transition-all font-bold text-xl border border-blue-100">-</button>
              <Input type="number" value={shelfLife} onChange={(e) => setShelfLife(Number(e.target.value))} className="w-16 text-center font-bold text-xl bg-transparent border-none focus:ring-0 p-0 text-blue-900" />
              <button type="button" onClick={() => setShelfLife(shelfLife + 1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-lg text-blue-600 shadow-sm hover:bg-blue-100 active:scale-95 transition-all font-bold text-xl border border-blue-100">+</button>
            </div>
          </div>

          {/* Unit */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-gray-700">单位类型</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              {(['day', 'week', 'month', 'year'] as Unit[]).map((u) => (
                <button key={u} type="button" onClick={() => setUnit(u)} className={cn("flex-1 h-10 rounded-lg text-sm font-bold transition-all border", unit === u ? "bg-blue-600 text-white border-blue-600 shadow-md transform -translate-y-0.5" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100")}>
                  {u === 'day' ? '天' : u === 'week' ? '周' : u === 'month' ? '月' : '年'}
                </button>
              ))}
            </div>
          </div>

          {/* Reduction */}
          <div className="bg-pink-50 rounded-xl p-4 flex items-center justify-between border border-pink-100 shadow-sm relative overflow-hidden group">
            <div className="flex flex-col gap-1 z-10 pointer-events-none">
              <span className="font-bold text-gray-800">到期回减</span>
              <span className="text-xs text-pink-600 font-medium bg-pink-100 px-2 py-0.5 rounded-full w-fit">退货提前量</span>
            </div>
            <div className="relative z-20 w-1/2">
               <select value={reduction} onChange={(e) => setReduction(e.target.value)} className="w-full appearance-none bg-white border border-pink-200 text-center font-bold text-gray-800 py-2 pl-4 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 shadow-sm cursor-pointer">
                  {REDUCTION_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
               </select>
               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"><ChevronDown className="w-4 h-4" /></div>
            </div>
            <div className="absolute -left-4 -top-4 w-16 h-16 bg-pink-100 rounded-full opacity-30 z-0" />
          </div>

          {/* New Section: Tags Input */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-700 flex items-center gap-2">
                <Tag className="w-4 h-4" /> 标签 (可选)
              </span>
            </div>
            
            {/* Selected Tags */}
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span key={tag} className="bg-mint-100 text-mint-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-mint-200">
                  {tag}
                  <button onClick={() => toggleTag(tag)} className="hover:text-mint-900"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>

            {/* Preset Tags */}
            <div className="flex flex-wrap gap-2">
              {PRESET_TAGS.map(tag => (
                <button 
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-2 py-1 rounded-full text-xs border transition-colors",
                    tags.includes(tag) 
                      ? "bg-mint-500 text-white border-mint-500" 
                      : "bg-white text-gray-600 border-gray-300 hover:border-mint-400"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="flex gap-2 items-center">
              <Input 
                value={newTag} 
                onChange={(e) => setNewTag(e.target.value)} 
                placeholder="自定义标签..." 
                className="h-8 text-xs bg-white"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTag())}
              />
              <Button 
                type="button" 
                size="sm" 
                variant="secondary" 
                onClick={handleAddCustomTag} 
                className="h-8 whitespace-nowrap shrink-0 px-3"
              >
                添加
              </Button>
            </div>
          </div>

          {/* 7. Optional Fields */}
          <div className="pt-2">
             <div className="grid grid-cols-2 gap-3">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="商品名称 (选填)" className="text-sm bg-gray-50 border-gray-200 focus:bg-white"/>
                <Input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} placeholder="数量" className="text-sm bg-gray-50 border-gray-200 focus:bg-white"/>
             </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-white flex gap-3 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <Button type="button" variant="secondary" className="flex-1 h-11" onClick={onClose}>取消</Button>
          <Button type="submit" className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-base font-bold shadow-lg shadow-blue-200" disabled={isLoading} onClick={handleSubmit}>
            {isLoading ? '保存中...' : (isEditMode ? '保存修改' : '确认添加')}
          </Button>
        </div>

      </div>
    </div>
  );
};
