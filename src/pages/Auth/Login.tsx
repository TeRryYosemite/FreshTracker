import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AlertCircle, Loader2, Coffee, Sun, Zap } from 'lucide-react';

const GREETINGS = [
  { text: "欢迎回来！今天也要吃得健康哦 🥗", icon: <Sun className="w-4 h-4 text-orange-500" /> },
  { text: "别来无恙！看看冰箱里还有什么好吃的 🍎", icon: <Coffee className="w-4 h-4 text-brown-500" /> },
  { text: "美好的一天从管理库存开始 ✨", icon: <Zap className="w-4 h-4 text-yellow-500" /> },
  { text: "记得查看即将过期的食品哦 📅", icon: <AlertCircle className="w-4 h-4 text-blue-500" /> },
];

export const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [greeting, setGreeting] = useState(GREETINGS[0]);

  useEffect(() => {
    const randomIdx = Math.floor(Math.random() * GREETINGS.length);
    setGreeting(GREETINGS[randomIdx]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await apiService.login(email, password);
      login(response.user, response.token);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      let msg = err.message || '登录失败，请检查账号密码';
      if (msg === 'Network Error') {
        msg = '糟糕，连不上服务器了 📡 请检查网络或服务器设置。';
      } else if (msg.includes('401')) {
        msg = '账号或密码错误，再试一次吧 🔐';
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-mint-50 to-white p-4 sm:p-8">
      <Card className="w-full max-w-md shadow-xl border-mint-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="space-y-2 text-center pb-2 pt-8">
          {/* Logo Text - Restored to original style */}
          <CardTitle className="text-3xl text-mint-600 font-bold tracking-tight">FreshTracker</CardTitle>
          
          {/* Greeting Badge */}
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-500 bg-gray-50 py-1.5 px-3 rounded-full inline-flex mx-auto mt-2 border border-gray-100">
            {greeting.icon}
            {greeting.text}
          </div>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 border border-red-100 animate-in shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 ml-1">电子邮箱</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入您的邮箱..."
                className="bg-gray-50/50 focus:bg-white transition-colors h-11"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700 ml-1">密码</label>
                <Link 
                  to="/forgot-password" 
                  className="text-xs text-mint-600 hover:text-mint-700 font-semibold hover:underline"
                >
                  忘记密码？
                </Link>
              </div>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入您的密码..."
                className="bg-gray-50/50 focus:bg-white transition-colors h-11"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-base shadow-lg shadow-mint-200 hover:shadow-mint-300 transition-all active:scale-[0.98] bg-mint-600 hover:bg-mint-700" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  登录中...
                </>
              ) : (
                '立即登录'
              )}
            </Button>

            <div className="text-center text-sm text-gray-500 pt-2">
              还没有账号？{' '}
              <Link to="/register" className="text-mint-600 hover:text-mint-700 font-bold hover:underline transition-all">
                注册一个新账号
              </Link>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100 text-xs text-center text-gray-400">
              <p>演示账号: <b>demo@example.com</b> / <b>password</b></p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
