// 统一的 API 配置
const BASE_URL = 'https://lopbox.lopop.top';

// 通用的 API 请求函数
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`网络错误: ${response.status}`);
  }

  return response.json();
};

// 获取用户信息 (GET /me)
export const getMe = async (token: string) => {
  return apiRequest('/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// 导出基础 URL 供其他地方使用
export { BASE_URL };
