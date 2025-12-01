import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AlertCircle, Loader2, Send, ArrowLeft, KeyRound } from 'lucide-react';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Timer state
  const [countdown, setCountdown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!email) {
      setError('请先填写邮箱地址 📧');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('邮箱格式看起来不对哦 🤔');
      return;
    }
    
    setError('');
    setIsSendingCode(true);
    try {
      await apiService.sendVerificationCode(email, 'RESET_PASSWORD');
      setCountdown(60);
      alert('验证码已发送，请查收您的邮箱 📬');
    } catch (err: any) {
      console.error(err);
      let msg = err.response?.data?.message || err.message || '发送验证码失败';
      if (msg.includes('404')) {
        msg = '该邮箱未注册，请检查输入是否正确 🤔';
      }
      setError(msg);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!code) {
      setError('请输入验证码 🔑');
      return;
    }

    setIsLoading(true);

    try {
      await apiService.resetPassword(email, password, code);
      alert('🎉 密码重置成功！请使用新密码登录。');
      navigate('/login');
    } catch (err: any) {
      console.error(err);
      let msg = err.response?.data?.message || err.message || '重置失败';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white p-4 sm:p-8">
      <Card className="w-full max-w-md shadow-xl border-purple-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="space-y-2 text-center pb-2 pt-8">
          <CardTitle className="text-2xl text-purple-700 font-bold tracking-tight flex items-center justify-center gap-2">
            <KeyRound className="w-6 h-6" />
            重置密码
          </CardTitle>
          <p className="text-sm text-gray-500">通过邮箱验证来设置新密码 🔐</p>
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
              <label className="text-sm font-medium text-gray-700 ml-1">注册邮箱</label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入您的注册邮箱..."
                  className="bg-gray-50/50 focus:bg-white transition-colors h-11 flex-1"
                />
                <Button 
                  type="button"
                  variant="secondary"
                  onClick={handleSendCode}
                  disabled={countdown > 0 || isSendingCode || !email}
                  className="whitespace-nowrap min-w-[100px] h-11"
                >
                  {isSendingCode ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : countdown > 0 ? (
                    `${countdown}s 后重发`
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-1" />
                      发送验证码
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 ml-1">验证码</label>
              <Input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="请输入6位验证码"
                maxLength={6}
                className="bg-gray-50/50 focus:bg-white transition-colors h-11 tracking-widest text-center font-mono text-lg"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 ml-1">新密码</label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="设置一个新的安全密码..."
                className="bg-gray-50/50 focus:bg-white transition-colors h-11"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-base bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200 hover:shadow-purple-300 transition-all active:scale-[0.98]" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  正在重置...
                </>
              ) : (
                '确认修改密码'
              )}
            </Button>

            <div className="text-center text-sm text-gray-500 pt-2">
              <Link to="/login" className="text-gray-600 hover:text-purple-700 font-medium hover:underline transition-all flex items-center justify-center gap-1">
                <ArrowLeft className="w-4 h-4" />
                返回登录
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

