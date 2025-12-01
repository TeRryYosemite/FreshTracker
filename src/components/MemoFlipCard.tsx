import { useState } from 'react';
import { Memo } from '@/services/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Trash2, CheckSquare, Square, Calendar, Edit2, Save, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface MemoFlipCardProps {
  memo: Memo;
  onUpdate: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggle: (id: string) => Promise<void>;
  selectionMode: boolean;
  isSelected: boolean;
  onSelectToggle: (id: string) => void;
}

export const MemoFlipCard = ({
  memo,
  onUpdate,
  onDelete,
  onToggle,
  selectionMode,
  isSelected,
  onSelectToggle
}: MemoFlipCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [editContent, setEditContent] = useState(memo.content);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!editContent.trim()) return;
    setIsSaving(true);
    try {
      await onUpdate(memo.id, editContent);
      setIsFlipped(false);
    } catch (error) {
      console.error('Failed to update memo', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditContent(memo.content);
    setIsFlipped(false);
  };

  const handleCardClick = () => {
    if (selectionMode) {
      onSelectToggle(memo.id);
    }
  };

  return (
    <div 
      className={cn(
        "group relative h-[200px] w-full [perspective:1000px]",
        selectionMode && "cursor-pointer"
      )}
      onClick={handleCardClick}
    >
      <div 
        className={cn(
          "relative h-full w-full transition-all duration-500 [transform-style:preserve-3d]",
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        )}
      >
        {/* Front Face */}
        <Card className={cn(
          "absolute inset-0 h-full w-full [backface-visibility:hidden]",
          "border-gray-200 transition-all",
          memo.completed ? "bg-gray-50" : "bg-white border-l-4 border-l-mint-500",
          selectionMode && isSelected && "ring-2 ring-mint-500 ring-offset-2 bg-mint-50/50"
        )}>
          <CardContent className="p-4 flex flex-col h-full">
            <div className="flex items-start justify-between gap-2 flex-1">
              <p className={cn(
                "text-sm font-medium leading-relaxed break-words whitespace-pre-wrap line-clamp-4", 
                memo.completed && "line-through text-gray-500"
              )}>
                {memo.content}
              </p>
              
              {!selectionMode && (
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                    onClick={(e) => { e.stopPropagation(); setIsFlipped(true); }}
                    className="text-gray-400 hover:text-mint-600 p-1"
                    title="编辑"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(memo.id); }} 
                    className="text-gray-400 hover:text-red-500 p-1"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {selectionMode && (
                <div className={cn(
                  "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                  isSelected ? "bg-mint-500 border-mint-500" : "border-gray-300 bg-white"
                )}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-50">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(memo.createdAt), 'MM-dd')}
              </span>
              
              {!selectionMode && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggle(memo.id); }}
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-all", 
                    memo.completed 
                      ? "bg-gray-100 text-gray-500 hover:bg-gray-200" 
                      : "bg-mint-50 text-mint-600 hover:bg-mint-100"
                  )}
                >
                  {memo.completed ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                  {memo.completed ? "已完成" : "待办"}
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Back Face (Edit Mode) */}
        <Card className="absolute inset-0 h-full w-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-white border-mint-200 border-2">
          <CardContent className="p-4 flex flex-col h-full gap-2">
            <div className="text-xs font-semibold text-mint-600 mb-1">编辑备忘录</div>
            <textarea 
              className="flex-1 w-full resize-none text-sm border rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-mint-500"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                className="h-8 px-3"
              >
                <X className="w-3 h-3 mr-1" /> 取消
              </Button>
              <Button 
                size="sm" 
                onClick={(e) => { e.stopPropagation(); handleSave(); }}
                disabled={!editContent.trim() || isSaving}
                className="h-8 px-3 bg-mint-500 hover:bg-mint-600"
              >
                <Save className="w-3 h-3 mr-1" /> 保存
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

