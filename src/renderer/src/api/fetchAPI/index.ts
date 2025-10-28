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

  const data = await response.json();

  if (!response.ok) {
    // 优先使用后端返回的 message 或 error 字段，否则使用状态码
    const errorMessage = data?.message || data?.error || data?.msg || `HTTP ${response.status}`;
    throw new Error(errorMessage);
  }

  return data;
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

// 用户登录 (POST /login)
export const login = async (username: string, password: string) => {
  return apiRequest('/login', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password,
    }),
  });
};

// 用户注册 (POST /register)
export const register = async (username: string, password: string) => {
  return apiRequest('/register', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password,
    }),
  });
};

// 获取网页元数据 (POST /metadata)
export const fetchMetadata = async (url: string) => {
  return apiRequest('/metadata', {
    method: 'POST',
    body: JSON.stringify({
      url,
    }),
  });
};

// 检查更新 (POST /check-update)
export const checkUpdate = async (version: string) => {
  return apiRequest('/check-update', {
    method: 'POST',
    body: JSON.stringify({
      version,
    }),
  });
};

// 获取版本信息 (GET /version/:version)
export const getVersionInfo = async (version: string) => {
  return apiRequest(`/version/${encodeURIComponent(version)}`, {
    method: 'GET',
  });
};

// 导出基础 URL 供其他地方使用
export { BASE_URL };
