import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Settings, LogOut, Menu, X, UserCircle, CalendarDays, Shield, StickyNote } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

export const Layout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { href: '/', label: '主页', icon: LayoutDashboard },
    { href: '/calendar', label: '食品日历', icon: CalendarDays },
    { href: '/memo', label: '备忘录', icon: StickyNote },
    { href: '/profile', label: '个人中心', icon: UserCircle },
    { href: '/settings', label: '设置', icon: Settings },
  ];

  // Add Admin Link if user is admin
  if (user?.role === 'admin') {
    // Insert before Profile
    const profileIndex = navItems.findIndex(item => item.href === '/profile');
    if (profileIndex > -1) {
      navItems.splice(profileIndex, 0, { href: '/admin', label: '系统管理', icon: Shield });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-24 flex flex-col justify-center px-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 relative shrink-0 rounded-full bg-white shadow-md border border-gray-100 p-1 flex items-center justify-center overflow-hidden">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-full h-full object-contain animate-spin-slow" 
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold text-mint-600 tracking-tight">FreshTracker</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Food Manager</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          {/* User Profile Card */}
          <Link to="/profile" className="block mb-6 group">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-mint-50 to-white border border-mint-100 shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:border-mint-200">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0 bg-mint-100 flex items-center justify-center text-mint-600 font-bold text-lg">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  (user?.username?.[0] || 'U').toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-mint-600 font-medium mb-0.5">欢迎回来 👋</p>
                <p className="text-sm font-bold text-gray-800 truncate group-hover:text-mint-700 transition-colors">
                  {user?.username || '用户'}
                </p>
              </div>
            </div>
          </Link>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors",
                    isActive 
                      ? "bg-mint-50 text-mint-600" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="shrink-0">
          <div className="p-4">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              退出登录
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm relative z-20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white shadow-sm border border-gray-100 p-0.5 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain animate-spin-slow" />
            </div>
            <span className="text-lg font-bold text-mint-600">FreshTracker</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
