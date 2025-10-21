import { useState } from 'react';
import useUserStore from '@renderer/store/UserStore';
import { useLogin, useRegister } from '@renderer/api';
import toast from 'react-hot-toast';

const LoginContent = ({ onClose }: { onClose: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '', 
  });

  const setJwtToken = useUserStore((state) => state.setJwtToken);

  // 使用 TanStack Query mutations
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const loading = loginMutation.isPending || registerMutation.isPending;

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 登录处理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    toast.promise(
      loginMutation.mutateAsync({
        username: formData.username,
        password: formData.password,
      }),
      {
        loading: '正在登录...',
        success: (data) => {
          setJwtToken(data.token);
          onClose();
          return '登录成功！';
        },
        error: (err) => {
          const message = err instanceof Error ? err.message : '登录失败';
          return `登录失败: ${message}`;
        },
      }
    );
  };

  // 注册处理
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证密码确认
    if (formData.password !== formData.confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    toast.promise(
      registerMutation.mutateAsync({
        username: formData.username,
        password: formData.password,
      }),
      {
        loading: '正在注册...',
        success: (data) => {
          if (data.token) {
            setJwtToken(data.token);
            setTimeout(() => onClose(), 500);
            return '注册成功！已自动登录';
          }
          return '注册成功，请登录';
        },
        error: (err) => {
          const message = err instanceof Error ? err.message : '注册失败';
          return `注册失败: ${message}`;
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800/30">
      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">{isLogin ? '登录' : '注册'}</h2>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setFormData({ username: '', password: '', confirmPassword: '' });
            }}
            className="text-sm text-blue-600 transition-colors hover:text-blue-800"
          >
            {isLogin ? '没有账号？注册' : '已有账号？登录'}
          </button>
        </div>
        {/* 表单 */}
        <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
          <div>
            <label htmlFor="username" className="mb-1 block text-sm font-medium text-gray-700">
              用户名
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="请输入用户名"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              密码
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="请输入密码"
            />
          </div>

          {/* 注册时显示确认密码 */}
          {!isLogin && (
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                确认密码
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="请再次输入密码"
              />
            </div>
          )}

          {/* 按钮组 */}
          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:bg-blue-400"
            >
              {loading ? '处理中...' : isLogin ? '登录' : '注册'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
            >
              关闭
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginContent;
