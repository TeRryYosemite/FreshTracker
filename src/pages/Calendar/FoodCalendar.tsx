import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Tag } from 'lucide-react';
import { apiService } from '@/services/api';
import { FoodItem } from '@/services/types';
import { cn } from '@/lib/utils';

export const FoodCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [foods, setFoods] = useState<FoodItem[]>([]);
  // const [isLoading, setIsLoading] = useState(true); // Removed unused state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedFoods, setSelectedFoods] = useState<FoodItem[]>([]);

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const data = await apiService.getFoods();
        setFoods(data);
      } catch (error) {
        console.error('Failed to fetch foods', error);
      } finally {
        // setIsLoading(false); // Removed unused setter
      }
    };
    fetchFoods();
  }, []);

  // Calendar Logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const jumpToToday = () => setCurrentDate(new Date());

  const getFoodsForDate = (date: Date) => {
    return foods.filter(food => isSameDay(parseISO(food.expirationDate), date));
  };

  const handleDayClick = (day: Date, dayFoods: FoodItem[]) => {
    if (dayFoods.length > 0) {
      setSelectedDate(day);
      setSelectedFoods(dayFoods);
    }
  };

  const closeModal = () => {
    setSelectedDate(null);
    setSelectedFoods([]);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200 shrink-0 gap-3 sm:gap-0">
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 shrink-0">
            <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-mint-600" />
            食品日历
          </h1>
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button onClick={prevMonth} className="p-1 hover:bg-white rounded-md transition-colors text-gray-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-3 sm:px-4 font-bold text-gray-700 min-w-[90px] sm:min-w-[100px] text-center text-sm sm:text-base">
              {format(currentDate, 'yyyy年 MM月', { locale: zhCN })}
            </span>
            <button onClick={nextMonth} className="p-1 hover:bg-white rounded-md transition-colors text-gray-600">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <button 
          onClick={jumpToToday}
          className="w-full sm:w-auto text-sm font-medium text-mint-600 hover:bg-mint-50 px-3 py-2 sm:py-1.5 rounded-md transition-colors border sm:border-0 border-mint-100"
        >
          回到今天
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 shrink-0">
          {weekDays.map(day => (
            <div key={day} className="py-3 text-center text-sm font-semibold text-gray-500">
              周{day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto">
          {calendarDays.map((day, dayIdx) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());
            
            // FIXED: Only show foods if it's the current month
            const allDayFoods = getFoodsForDate(day);
            const dayFoods = isCurrentMonth ? allDayFoods : [];

            return (
              <div 
                key={day.toString()} 
                onClick={() => isCurrentMonth && handleDayClick(day, dayFoods)}
                className={cn(
                  "border-b border-r border-gray-100 flex flex-col transition-all relative group cursor-pointer",
                  // Unified height and layout for both mobile and desktop
                  "min-h-[64px] sm:min-h-[120px] items-center justify-center sm:justify-start sm:pt-4", 
                  !isCurrentMonth && "bg-gray-50/50",
                  dayIdx % 7 === 0 && "border-l",
                  isToday && "bg-mint-50/30",
                  (dayFoods.length > 0 && isCurrentMonth) ? "hover:bg-orange-50/30" : "hover:bg-gray-50/50"
                )}
              >
                {/* Unified Date Header */}
                <div className="flex flex-col items-center gap-1 sm:gap-2">
                  <span className={cn(
                    "text-sm sm:text-lg font-bold flex items-center justify-center rounded-full transition-transform",
                    "w-8 h-8 sm:w-10 sm:h-10",
                    isToday 
                      ? "bg-mint-600 text-white shadow-md scale-110" 
                      : isCurrentMonth ? "text-gray-700" : "text-gray-300 opacity-50",
                    (dayFoods.length > 0 && !isToday && isCurrentMonth) && "bg-orange-100 text-orange-600"
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  {/* Unified Status Indicator (Dot + Count) */}
                  {dayFoods.length > 0 && isCurrentMonth && (
                    <div className="flex items-center gap-1 animate-in zoom-in duration-200">
                         <div className={cn(
                           "rounded-full shadow-sm",
                           // Mobile dot size
                           "w-1.5 h-1.5",
                           // Desktop dot size
                           "sm:w-2 sm:h-2",
                           dayFoods.length > 3 ? "bg-red-500" : "bg-orange-400"
                         )} />
                         {/* Count Label - shown on both if space permits, or simplified */}
                         <span className={cn(
                           "font-medium text-gray-400 origin-left",
                           "text-[10px] sm:text-xs"
                         )}>
                             {dayFoods.length}项
                         </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Details Modal (Unchanged) */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[80vh] flex flex-col relative animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  {format(selectedDate, 'MM月dd日', { locale: zhCN })}
                  <span className="text-sm font-normal text-gray-500">过期清单</span>
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  共 {selectedFoods.length} 个物品在这一天过期
                </p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3">
              {selectedFoods.map(food => (
                <div key={food.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-mint-200 transition-colors">
                  <div className="w-12 h-12 bg-white rounded-md border border-gray-200 shrink-0 overflow-hidden flex items-center justify-center">
                    {food.image ? <img src={food.image} alt={food.name} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-300">无图</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{food.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span className="bg-white px-1.5 py-0.5 rounded border border-gray-200">{food.category}</span>
                      <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> 数量: {food.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">到期</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl text-center shrink-0">
              <button onClick={closeModal} className="text-sm font-medium text-gray-600 hover:text-gray-900">关闭列表</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
