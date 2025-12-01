import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Save, Server, ToggleLeft, ToggleRight, Eye, EyeOff } from 'lucide-react';

export const Settings = () => {
  const { serverUrl, isMockMode, setServerUrl, toggleMockMode } = useAppStore();
  
  const [urlInput, setUrlInput] = useState(serverUrl);
  const [isDirty, setIsDirty] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  useEffect(() => {
    setUrlInput(serverUrl);
  }, [serverUrl]);

  const handleSave = () => {
    setServerUrl(urlInput);
    setIsDirty(false);
    // Optional: Test connection logic here
    alert('设置已保存！');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlInput(e.target.value);
    setIsDirty(true);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">设置</h1>
        <p className="text-gray-500 text-sm mt-1">配置应用程序连接首选项</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Server className="w-5 h-5 text-mint-600" />
            后端连接
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Mock Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div>
              <h3 className="font-medium text-gray-900">模拟数据模式 (Mock Mode)</h3>
              <p className="text-sm text-gray-500">使用虚假数据进行测试，无需后端服务器</p>
            </div>
            <button 
              onClick={toggleMockMode}
              className="text-mint-600 hover:text-mint-700 transition-colors"
            >
              {isMockMode ? (
                <ToggleRight className="w-10 h-10" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-gray-400" />
              )}
            </button>
          </div>

          {/* Server URL Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">服务器 API 地址</label>
            <div className="relative">
              <Input 
                type={showUrl ? "text" : "password"}
                value={urlInput} 
                onChange={handleChange}
                placeholder="http://localhost:3000/api" 
                disabled={isMockMode}
                className={`pr-10 ${isMockMode ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowUrl(!showUrl)}
                disabled={isMockMode}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                {showUrl ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {isMockMode && (
              <p className="text-xs text-orange-500">请先关闭模拟模式以编辑服务器地址</p>
            )}
          </div>

          <div className="pt-2">
            <Button 
              onClick={handleSave} 
              disabled={!isDirty || isMockMode}
              className="w-full sm:w-auto"
            >
              <Save className="w-4 h-4 mr-2" />
              保存配置
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};
