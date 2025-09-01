import { useState } from 'react';
import useUserStore from '@renderer/store/UserStore';

const LoginContent = ({ onClose }: { onClose: () => void }) => {
  const [isLogin, setIsLogin] = useState(true); // 切换登录/注册
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '', // 仅注册时使用
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setJwtToken = useUserStore((state) => state.setJwtToken);

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(''); // 清除错误信息
  };

  // 登录处理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://199.115.229.247:8086/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        throw new Error('登录失败，请检查用户名和密码');
      }

      const data = await response.json();
      setJwtToken(data.token);
      onClose(); // 登录成功后关闭模态框
    } catch (error) {
      setError(error instanceof Error ? error.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  // 注册处理
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 验证密码确认
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://199.115.229.247:8086/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        throw new Error('注册失败，用户名可能已存在');
      }

      const data = await response.json();
      // 注册成功后自动登录
      if (data.token) {
        setJwtToken(data.token);
        onClose();
      } else {
        // 如果没有返回token，提示用户去登录
        setError('注册成功，请登录');
        setIsLogin(true);
        setFormData({ username: '', password: '', confirmPassword: '' });
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800/30">
      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-2xl"
      >
        {/* 标题和切换按钮 */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">{isLogin ? '登录' : '注册'}</h2>
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setFormData({ username: '', password: '', confirmPassword: '' });
            }}
            className="text-sm text-blue-600 transition-colors hover:text-blue-800"
          >
            {isLogin ? '没有账号？注册' : '已有账号？登录'}
          </button>
        </div>

        {/* 错误信息 */}
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

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
