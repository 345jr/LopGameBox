import './assets/main.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Gallery from './components/Gallery/Gallery';
import Update from './components/SettingCenter/Update';
import Dashboard from './components/Dashboard/Dashboard';
import SettingPage from './components/SettingCenter/SettingPage';
import Practice from './components/SettingCenter/Practice';
import Layout from './components/Layout';
import App from './App';
import ErrorPage from './components/ErrorPage';
import NotFound from './components/NotFound';

const router = createHashRouter([
  {
    //全局组件
    element: <Layout />,
    // 全局错误处理组件
    errorElement: <ErrorPage />,
    children: [
      { path: '/', element: <App /> },
      //图集
      { path: '/gallery/:gameId', element: <Gallery /> },
      //仪表盘
      { path: '/dashboard', element: <Dashboard /> },
      //设置中心
      { path: '/setting', element: <SettingPage /> },
      //更新
      { path: '/setting/update', element: <Update /> },
      //测试代码专用
      { path: '/setting/practice', element: <Practice /> },
      // 捕获未匹配路由（404）
      { path: '*', element: <NotFound /> },
    ]
  }
]);

// 创建 QueryClient 实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟缓存时间
      gcTime: 10 * 60 * 1000, // 10分钟垃圾回收时间
      retry: 1, // 失败重试1次
      refetchOnWindowFocus: false, // 窗口聚焦时不自动重新获取
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
