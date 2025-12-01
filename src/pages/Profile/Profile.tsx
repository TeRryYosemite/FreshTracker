import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { apiService } from '@/services/api';
import { ReturnRecord } from '@/services/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { User, Mail, Calendar, Camera, Save, History, BellRing, Search, Filter, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, PackageMinus, Trash2, Image as ImageIcon, CheckSquare, X, FileSpreadsheet, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { cn, compressImage } from '@/lib/utils';

export const Profile = () => {
  const { user, login } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'records'>('profile');
  
  // Profile State
  const [username, setUsername] = useState(user?.username || '');
  const [qqEmail, setQqEmail] = useState(user?.qqEmail || '');
  const [enableEmail, setEnableEmail] = useState(user?.enableEmailNotify || false);
  const [notifyDays, setNotifyDays] = useState(user?.notifyDays || 3);
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);

  // Records State
  const [records, setRecords] = useState<ReturnRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterReason, setFilterReason] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);

  useEffect(() => {
    if (activeTab === 'records') {
      fetchRecords();
    }
  }, [activeTab]);

  // Reset selection when mode changes or tab changes
  useEffect(() => {
    if (!isSelectionMode) setSelectedRecordIds([]);
  }, [isSelectionMode, activeTab]);

  // 计算过滤和分页后的记录
  const { filteredRecords, totalPages, paginatedRecords } = useMemo(() => {
    let result = records;

    // 1. Filter by Search Term
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.foodName.toLowerCase().includes(lowerTerm) || 
        r.reason.toLowerCase().includes(lowerTerm)
      );
    }

    // 2. Filter by Reason Type
    if (filterReason !== 'all') {
      if (filterReason === 'expired') {
        result = result.filter(r => r.reason.includes('临期') || r.reason.includes('过期'));
      } else if (filterReason === 'consumed') {
        result = result.filter(r => r.reason.includes('吃') || r.reason.includes('食用'));
      } else if (filterReason === 'other') {
        result = result.filter(r => !r.reason.includes('临期') && !r.reason.includes('过期') && !r.reason.includes('吃') && !r.reason.includes('食用'));
      }
    }

    const totalPages = Math.ceil(result.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedRecords = result.slice(startIndex, startIndex + itemsPerPage);

    return { filteredRecords: result, totalPages, paginatedRecords };
  }, [records, searchTerm, filterReason, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterReason]);

  const fetchRecords = async () => {
    setIsLoadingRecords(true);
    try {
      const data = await apiService.getRecords();
      setRecords(data);
    } catch (error) {
      console.error('Failed to load records', error);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  const getRecordStyle = (reason: string) => {
    if (reason.includes('临期') || reason.includes('过期')) {
      return { 
        color: 'text-amber-600 bg-amber-50 border-amber-100', 
        icon: AlertTriangle, 
        label: '临期/过期' 
      };
    }
    if (reason.includes('吃') || reason.includes('食用')) {
      return { 
        color: 'text-green-600 bg-green-50 border-green-100', 
        icon: CheckCircle2, 
        label: '已食用' 
      };
    }
    if (reason.includes('删') || reason.includes('丢')) {
        return { 
          color: 'text-red-600 bg-red-50 border-red-100', 
          icon: Trash2, 
          label: '已丢弃' 
        };
      }
    return { 
      color: 'text-blue-600 bg-blue-50 border-blue-100', 
      icon: PackageMinus, 
      label: reason 
    };
  };

  // Group records by month for better visualization
  const groupedRecords = useMemo(() => {
    const groups: Record<string, ReturnRecord[]> = {};
    paginatedRecords.forEach(record => {
      const month = format(new Date(record.returnDate), 'yyyy年MM月');
      if (!groups[month]) groups[month] = [];
      groups[month].push(record);
    });
    return groups;
  }, [paginatedRecords]);

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('确定要删除这条记录吗？')) return;
    
    try {
      await apiService.deleteRecord(id);
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Failed to delete record', error);
      alert('删除失败');
    }
  };

  const toggleSelection = (id: string) => {
    if (selectedRecordIds.includes(id)) {
      setSelectedRecordIds(prev => prev.filter(i => i !== id));
    } else {
      setSelectedRecordIds(prev => [...prev, id]);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRecordIds.length === 0) return;
    if (!window.confirm(`确认删除选中的 ${selectedRecordIds.length} 条记录吗？`)) return;
    
    try {
      await apiService.batchDeleteRecords(selectedRecordIds);
      setRecords(prev => prev.filter(r => !selectedRecordIds.includes(r.id)));
      setSelectedRecordIds([]);
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Batch delete failed', error);
      alert('批量删除失败');
    }
  };

  const handleExport = async () => {
    try {
      const foods = await apiService.getFoods();
      const exportData = foods.map(f => ({
        名称: f.name,
        分类: f.category,
        数量: f.quantity,
        生产日期: format(new Date(f.purchaseDate), 'yyyy-MM-dd'),
        过期日期: format(new Date(f.expirationDate), 'yyyy-MM-dd'),
        备注: f.notes || '',
        标签: f.tags?.join(',') || ''
      }));
      
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "库存清单");
      XLSX.writeFile(wb, `库存清单_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    } catch (error) {
      console.error('Export failed', error);
      alert('导出失败');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Map Chinese headers back to English keys
        const foods = data.map((row: any) => ({
          name: row['名称'],
          category: row['分类'],
          quantity: row['数量'],
          purchaseDate: row['生产日期'],
          expirationDate: row['过期日期'],
          notes: row['备注'],
          tags: row['标签']
        }));

        await apiService.batchImportFoods(foods);
        alert(`成功导入 ${foods.length} 条数据`);
        e.target.value = ''; // Reset input
      } catch (error) {
        console.error('Import failed', error);
        alert('导入失败，请检查文件格式');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    
    // 保存当前的 token，因为后端不会返回 token
    const currentToken = localStorage.getItem('auth_token') || user.token || '';
    
    try {
      const updatedUser = await apiService.updateProfile({
        ...user,
        username,
        qqEmail,
        enableEmailNotify: enableEmail,
        notifyDays,
        avatar
      });
      // Update local store - 使用保存的 token，而不是后端返回的
      login({ ...updatedUser, token: currentToken }, currentToken);
      alert('个人资料已保存！');
      
      // 注意：测试邮件功能已暂时禁用（网络原因可能导致发送失败）
      // 如果需要测试邮件，请确保关闭代理/VPN 后手动测试
      // if (enableEmail && qqEmail) {
      //   apiService.sendEmailTest(qqEmail);
      // }
    } catch (error) {
      console.error('Save failed', error);
      alert('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 500); // Avatar can be smaller
        setAvatar(compressedBase64);
      } catch (error) {
        console.error('Avatar compression failed', error);
        alert('图片处理失败');
      }
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      {/* Header / Tabs - Fixed */}
      <div className="flex-shrink-0 space-y-6 pb-4 bg-gray-50 z-10">
        <h1 className="text-2xl font-bold text-gray-900">个人中心</h1>

        {/* Tabs */}
        <div className="flex space-x-1 rounded-xl bg-gray-100 p-1 max-w-3xl mx-auto w-full">
          <button
            onClick={() => setActiveTab('profile')}
            className={cn(
              "w-full rounded-lg py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-mint-400 focus:outline-none focus:ring-2 transition-all",
              activeTab === 'profile'
                ? "bg-white text-mint-700 shadow"
                : "text-gray-600 hover:bg-white/[0.12] hover:text-gray-800"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <User className="w-4 h-4" />
              个人资料
            </div>
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={cn(
              "w-full rounded-lg py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-mint-400 focus:outline-none focus:ring-2 transition-all",
              activeTab === 'records'
                ? "bg-white text-mint-700 shadow"
                : "text-gray-600 hover:bg-white/[0.12] hover:text-gray-800"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <History className="w-4 h-4" />
              退货记录
            </div>
          </button>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-20">
        <div className="max-w-3xl mx-auto w-full">
          {activeTab === 'profile' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              {/* Avatar Section */}
              <Card>
                <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-mint-100">
                      <img 
                        src={avatar || `https://ui-avatars.com/api/?name=${username}&background=random`} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                      <Camera className="w-6 h-6" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </label>
                  </div>
                  <div className="text-center sm:text-left space-y-1">
                    <h2 className="text-xl font-bold text-gray-900">{username || '用户'}</h2>
                    <p className="text-sm text-gray-500 flex items-center justify-center sm:justify-start gap-1">
                      <Calendar className="w-3 h-3" />
                      注册时间: {user?.registerDate ? format(new Date(user.registerDate), 'yyyy-MM-dd') : '2023-11-01'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Basic Info Form */}
              <Card>
                <CardHeader>
                  <CardTitle>基本信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">用户名</label>
                    <Input value={username} onChange={(e) => setUsername(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">登录邮箱</label>
                    <Input value={user?.email} disabled className="bg-gray-50 text-gray-500" />
                  </div>
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BellRing className="w-5 h-5 text-orange-500" />
                    提醒设置
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium text-gray-700">邮件提醒</label>
                      <p className="text-xs text-gray-500">当食品临近过期时发送邮件</p>
                    </div>
                    <button 
                      onClick={() => setEnableEmail(!enableEmail)}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-mint-500 focus:ring-offset-2",
                        enableEmail ? "bg-mint-600" : "bg-gray-200"
                      )}
                    >
                      <span className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        enableEmail ? "translate-x-6" : "translate-x-1"
                      )} />
                    </button>
                  </div>

                  {enableEmail && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">QQ邮箱地址</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input 
                            value={qqEmail} 
                            onChange={(e) => setQqEmail(e.target.value)} 
                            placeholder="例如：123456@qq.com"
                            className="pl-9"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">提前几天提醒？</label>
                        <select 
                          value={notifyDays}
                          onChange={(e) => setNotifyDays(Number(e.target.value))}
                          className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-transparent"
                        >
                          <option value={1}>提前 1 天 (紧急)</option>
                          <option value={2}>提前 2 天</option>
                          <option value={3}>提前 3 天 (推荐)</option>
                          <option value={5}>提前 5 天</option>
                          <option value={7}>提前 1 周</option>
                        </select>
                        <p className="text-xs text-gray-400">
                          * 当食品过期时间小于这个天数时，系统会自动发送邮件。
                        </p>
                      </div>

                      <p className="text-xs text-gray-400 pt-2">
                        * 请确保已将系统邮箱加入白名单，保存后会发送一封测试邮件。
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Data Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                    数据管理
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button variant="outline" onClick={handleExport} className="w-full h-auto py-4 flex flex-col gap-2 border-dashed hover:border-mint-300 hover:bg-mint-50/50">
                      <Download className="w-6 h-6 text-mint-600" />
                      <div className="text-center">
                        <div className="font-medium text-gray-900">导出库存</div>
                        <div className="text-xs text-gray-500">下载 Excel 备份文件</div>
                      </div>
                    </Button>
                    
                    <div className="relative group">
                      <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        onChange={handleImport}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 border-dashed group-hover:border-blue-300 group-hover:bg-blue-50/50">
                        <Upload className="w-6 h-6 text-blue-600" />
                        <div className="text-center">
                          <div className="font-medium text-gray-900">导入库存</div>
                          <div className="text-xs text-gray-500">上传 Excel 恢复数据</div>
                        </div>
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 bg-gray-50 p-3 rounded border border-gray-100">
                    * 导入说明：建议先导出查看标准格式。必需字段：名称、过期日期。支持字段：分类、数量、生产日期、备注、标签。
                  </p>
                </CardContent>
              </Card>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full sm:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? '保存中...' : '保存修改'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              {/* Tools Bar */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input 
                    placeholder="搜索商品名称..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-gray-50 border-transparent focus:bg-white focus:border-mint-500 transition-all"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSelectionMode(!isSelectionMode)}
                    className={cn("h-10 px-3", isSelectionMode ? "bg-mint-50 text-mint-600 border-mint-200" : "")}
                  >
                    {isSelectionMode ? <X className="w-4 h-4 mr-1" /> : <CheckSquare className="w-4 h-4 mr-1" />}
                    {isSelectionMode ? '取消' : '管理'}
                  </Button>
                  <div className="w-px h-6 bg-gray-200 mx-1" />
                  <Filter className="text-gray-400 w-4 h-4" />
                  <select 
                    value={filterReason}
                    onChange={(e) => setFilterReason(e.target.value)}
                    className="h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-transparent min-w-[110px]"
                  >
                    <option value="all">全部记录</option>
                    <option value="expired">临期/过期</option>
                    <option value="consumed">已食用</option>
                    <option value="other">其他原因</option>
                  </select>
                </div>
              </div>

              {/* Records List */}
              {isLoadingRecords ? (
                 <div className="text-center py-20">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint-500 mx-auto mb-4"></div>
                   <p className="text-gray-500">加载记录中...</p>
                 </div>
              ) : records.length === 0 ? (
                 <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                   <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                   <p className="text-gray-500 font-medium">暂无退货记录</p>
                   <p className="text-sm text-gray-400 mt-1">处理完的商品会显示在这里</p>
                 </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                   <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                   <p className="text-gray-500">没有找到匹配的记录</p>
                   <Button variant="link" onClick={() => {setSearchTerm(''); setFilterReason('all');}} className="mt-2 text-mint-600">
                     清除筛选
                   </Button>
                 </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedRecords).map(([month, monthRecords]) => (
                    <div key={month} className="space-y-3">
                      <h3 className="text-sm font-medium text-gray-500 pl-1">{month}</h3>
                      <div className="space-y-3">
                        {monthRecords.map((record) => {
                          const style = getRecordStyle(record.reason);
                          const Icon = style.icon;
                          
                          return (
                            <Card 
                              key={record.id} 
                              onClick={() => isSelectionMode && toggleSelection(record.id)}
                              className={cn(
                                "transition-all border-gray-100 group overflow-hidden",
                                isSelectionMode ? "cursor-pointer" : "hover:shadow-md",
                                isSelectionMode && selectedRecordIds.includes(record.id) ? "ring-2 ring-mint-500 bg-mint-50/10" : ""
                              )}
                            >
                              <div className="flex h-24">
                                {/* Checkbox Selection Area */}
                                {isSelectionMode && (
                                  <div className="flex items-center justify-center w-12 flex-shrink-0 border-r border-gray-100 bg-gray-50 animate-in slide-in-from-left-2 duration-200">
                                    <div className={cn(
                                      "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                      selectedRecordIds.includes(record.id) ? "bg-mint-500 border-mint-500" : "border-gray-300 bg-white"
                                    )}>
                                      {selectedRecordIds.includes(record.id) && <User className="w-0 h-0" /> /* Dummy icon for layout, actually just need white check */ }
                                      {selectedRecordIds.includes(record.id) && (
                                         <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                         </svg>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Image Section */}
                                <div className="w-24 h-24 bg-gray-100 flex-shrink-0 relative">
                                  {record.image ? (
                                    <img src={record.image} alt={record.foodName} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                                       <ImageIcon className="w-8 h-8" />
                                    </div>
                                  )}
                                  {/* Status Strip Overlay */}
                                  <div className={cn("absolute left-0 top-0 bottom-0 w-1", style.color.replace('text-', 'bg-').split(' ')[0])} />
                                </div>

                                {/* Content Section */}
                                <div className="flex-1 p-3 flex flex-col justify-between min-w-0 relative group/content">
                                   {!isSelectionMode && (
                                     <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => { e.stopPropagation(); handleDeleteRecord(record.id); }}
                                        className="absolute top-2 right-2 h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"
                                        title="删除记录"
                                     >
                                        <Trash2 className="w-4 h-4" />
                                     </Button>
                                   )}

                                   <div className="flex items-start justify-between gap-2 pr-8">
                                      <div className="min-w-0">
                                         <h3 className="font-bold text-gray-900 truncate text-base">{record.foodName}</h3>
                                         <div className="flex items-center gap-2 mt-1">
                                            <span className={cn("text-xs px-1.5 py-0.5 rounded border flex items-center gap-1", style.color)}>
                                               <Icon className="w-3 h-3" />
                                               {record.reason}
                                            </span>
                                         </div>
                                      </div>
                                      <div className="text-right flex-shrink-0 mt-6">
                                         <span className="text-lg font-bold text-gray-900">x{record.quantity}</span>
                                      </div>
                                   </div>

                                   <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                                      <span className="flex items-center gap-1">
                                         <Calendar className="w-3 h-3" />
                                         {format(new Date(record.returnDate), 'yyyy-MM-dd')}
                                      </span>
                                      <span className="font-mono bg-gray-50 px-1 rounded">
                                         {format(new Date(record.timestamp), 'HH:mm')}
                                      </span>
                                   </div>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {filteredRecords.length > 0 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500">
                    显示 {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredRecords.length)} 共 {filteredRecords.length} 条
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-center">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Batch Action Floating Bar */}
      {isSelectionMode && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 animate-in slide-in-from-bottom-4 duration-300 z-50">
          <div className="bg-gray-900/90 backdrop-blur text-white rounded-full px-6 py-3 shadow-xl flex items-center justify-between">
             <div className="text-sm font-medium">
               已选择 <span className="text-mint-400 font-bold text-lg mx-1">{selectedRecordIds.length}</span> 项
             </div>
             <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsSelectionMode(false)}
                  className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
                >
                  取消
                </button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={handleBatchDelete}
                  disabled={selectedRecordIds.length === 0}
                  className="h-8 rounded-full px-4 bg-red-600 hover:bg-red-700 text-white border-none"
                >
                  批量删除
                </Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
