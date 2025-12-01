import { FoodItem } from '@/services/types';
import { differenceInDays, parseISO, format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/Card';
import { Clock, Trash2, Image as ImageIcon, AlertTriangle, AlertOctagon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface FoodItemCardProps {
  item: FoodItem;
  onDelete: (id: string) => void;
}

export const FoodItemCard = ({ item, onDelete }: FoodItemCardProps) => {
  const expirationDate = parseISO(item.expirationDate);
  const daysRemaining = differenceInDays(expirationDate, new Date());

  const getStatusConfig = (days: number) => {
    if (days < 0) return { 
      label: '已过期', 
      badgeClass: 'bg-red-100 text-red-700 border-red-200',
      cardClass: 'border-l-4 border-l-red-500 bg-red-50/30',
      icon: <AlertOctagon className="w-3 h-3 mr-1" />
    };
    if (days === 0) return { 
      label: '今天过期', 
      badgeClass: 'bg-red-100 text-red-700 border-red-200 animate-pulse',
      cardClass: 'border-l-4 border-l-red-500 bg-red-50/50 shadow-red-100',
      icon: <AlertTriangle className="w-3 h-3 mr-1" />
    };
    if (days <= 3) return { 
      label: `剩 ${days} 天`, 
      badgeClass: 'bg-orange-100 text-orange-700 border-orange-200',
      cardClass: 'border-l-4 border-l-orange-400 bg-orange-50/30',
      icon: <AlertTriangle className="w-3 h-3 mr-1" />
    };
    if (days <= 7) return { 
      label: `剩 ${days} 天`, 
      badgeClass: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      cardClass: 'border-l-4 border-l-yellow-400',
      icon: null
    };
    return { 
      label: `剩 ${days} 天`, 
      badgeClass: 'bg-mint-100 text-mint-700 border-mint-200',
      cardClass: 'border-l-4 border-l-mint-500',
      icon: null
    };
  };

  const status = getStatusConfig(daysRemaining);

  return (
    <Card className={cn("hover:shadow-md transition-all overflow-hidden", status.cardClass)}>
      <CardContent className="p-0 flex h-full">
        {/* Image Section */}
        <div className="w-20 sm:w-32 bg-gray-100 shrink-0 relative flex items-center justify-center">
          {item.image ? (
            <img 
              src={item.image} 
              alt={item.name} 
              className="w-full h-full object-cover absolute inset-0" 
            />
          ) : (
            <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 p-2 sm:p-4 flex flex-col justify-between min-w-0">
          <div className="flex items-start justify-between gap-2">
             <div className="min-w-0 flex-1">
                <h3 className="font-bold text-gray-900 truncate text-sm sm:text-lg mb-1">{item.name}</h3>
                <div className="flex flex-wrap gap-1 sm:gap-2 mb-1">
                  <span className={cn("text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-md border inline-flex items-center", status.badgeClass)}>
                    {status.icon}
                    {status.label}
                  </span>
                  <span className="text-[10px] sm:text-xs text-gray-500 bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded-md border border-gray-200 inline-block">
                    {item.category}
                  </span>
                </div>
                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag, idx) => (
                      <span key={idx} className="text-[10px] text-mint-700 bg-mint-50 px-1.5 py-0.5 rounded border border-mint-100">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
             </div>
             
             {/* Delete Button (Top Right on Mobile) */}
             <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="text-gray-400 hover:text-red-600 hover:bg-red-50 -mt-1 -mr-2 h-8 w-8 p-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
          </div>

          <div className="flex items-end justify-between mt-3">
            <div className="text-sm text-gray-500 flex flex-col">
              <span className="text-xs text-gray-400">到期时间</span>
              <span className="font-medium text-gray-700 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(expirationDate, 'yyyy-MM-dd')}
              </span>
            </div>
            
            <div className="text-right">
               <span className="text-xs text-gray-400 block">数量</span>
               <span className="font-bold text-gray-900 text-lg leading-none">{item.quantity}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
