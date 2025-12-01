import { useState, useEffect } from 'react';
import { User } from '@/services/types';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Trash2, Edit, Shield, User as UserIcon, X, Check } from 'lucide-react';
import { format } from 'date-fns';

export const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    role: 'user',
    qqEmail: '',
    password: '',
    enableEmailNotify: false
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.adminGetUsers();
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        throw new Error('返回数据格式错误');
      }
    } catch (err: any) {
      console.error('Failed to fetch users', err);
      // 处理具体的 API 错误
      if (err.response) {
        if (err.response.status === 403) {
          setError('权限不足：您当前的账号不是管理员，或者登录已过期。请尝试退出并重新登录。');
        } else if (err.response.status === 404) {
          setError('接口未找到 (404)：请检查后端服务是否启动，以及 API 地址配置。');
        } else {
          setError(`获取失败 (${err.response.status}): ${err.response.data?.message || '未知错误'}`);
        }
      } else {
        setError('网络错误：无法连接到服务器，请检查后端是否运行。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除该用户吗？此操作不可恢复，并将删除该用户的所有数据。')) {
      try {
        await apiService.adminDeleteUser(id);
        setUsers(users.filter(u => u.id !== id));
      } catch (error) {
        alert('删除失败');
      }
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      role: user.role || 'user',
      qqEmail: user.qqEmail || '',
      password: '', // Don't show password
      enableEmailNotify: user.enableEmailNotify || false
    });
  };

  const handleSave = async () => {
    if (!editingUser) return;
    try {
      const updates: any = {
        role: formData.role as 'user' | 'admin',
        qqEmail: formData.qqEmail,
        enableEmailNotify: formData.enableEmailNotify
      };
      if (formData.password) {
        updates.password = formData.password;
      }

      await apiService.adminUpdateUser(editingUser.id, updates);
      
      // Refresh list
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...updates } : u));
      setEditingUser(null);
    } catch (error) {
      alert('更新失败');
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">正在加载用户列表...</div>;

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg inline-block text-left max-w-lg">
          <h3 className="font-bold text-lg mb-2">无法加载数据</h3>
          <p>{error}</p>
          <Button className="mt-4 w-full" onClick={() => window.location.reload()}>
            刷新页面
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          系统用户管理
        </h1>
        <span className="text-sm text-gray-500">共 {users.length} 位用户</span>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-700">用户</th>
                <th className="px-6 py-4 font-semibold text-gray-700">角色</th>
                <th className="px-6 py-4 font-semibold text-gray-700">注册时间</th>
                <th className="px-6 py-4 font-semibold text-gray-700">QQ邮箱提醒</th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-full h-full p-2 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.username}</div>
                        <div className="text-gray-500 text-xs">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role === 'admin' ? '管理员' : '普通用户'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {user.registerDate ? format(new Date(user.registerDate), 'yyyy-MM-dd') : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {user.enableEmailNotify ? (
                      <div className="flex flex-col">
                        <span className="text-green-600 flex items-center gap-1 text-xs font-bold"><Check className="w-3 h-3"/> 已开启</span>
                        <span className="text-xs text-gray-400">{user.qqEmail}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">未开启</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => startEdit(user)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" className="bg-red-50 text-red-600 hover:bg-red-100 border-red-100" onClick={() => handleDelete(user.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {users.map(user => (
          <div key={user.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
              {user.avatar ? (
                <img src={user.avatar} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-full h-full p-2 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900 truncate">{user.username}</h3>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium shrink-0 ${
                  user.role === 'admin' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                  {user.role === 'admin' ? '管理员' : '用户'}
                </span>
              </div>
              
              <div className="mt-3 flex items-center justify-between gap-2">
                 <div className="space-y-1">
                   <div className="text-xs text-gray-500 flex items-center gap-1">
                     {user.enableEmailNotify ? (
                        <>
                          <Check className="w-3 h-3 text-green-500" /> 
                          <span className="text-green-600 font-medium">邮件提醒开启</span>
                        </>
                     ) : (
                        <span className="text-gray-400">邮件提醒关闭</span>
                     )}
                   </div>
                   <div className="text-[10px] text-gray-400">
                     注册于 {user.registerDate ? format(new Date(user.registerDate), 'MM-dd') : '-'}
                   </div>
                 </div>

                 <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={() => startEdit(user)}
                      className="p-2 bg-gray-50 text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-100 active:scale-95 transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg border border-red-100 hover:bg-red-100 active:scale-95 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">编辑用户: {editingUser.username}</h2>
              <button onClick={() => setEditingUser(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色权限</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="user">普通用户</option>
                  <option value="admin">管理员</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">重置密码 (留空不修改)</label>
                <Input 
                  type="password" 
                  placeholder="输入新密码..."
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">QQ邮箱</label>
                <Input 
                  value={formData.qqEmail}
                  onChange={e => setFormData({...formData, qqEmail: e.target.value})}
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="notify"
                  checked={formData.enableEmailNotify}
                  onChange={e => setFormData({...formData, enableEmailNotify: e.target.checked})}
                />
                <label htmlFor="notify" className="text-sm text-gray-700">开启邮件通知</label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setEditingUser(null)}>取消</Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSave}>保存修改</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

