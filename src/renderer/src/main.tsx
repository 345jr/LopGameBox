import './assets/main.css'
import 'react-photo-view/dist/react-photo-view.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Gallery from './components/Gallery/Gallery'
import Update from './components/SettingCenter/Update'
import Dashboard from './components/Dashboard/Dashboard'
import SettingPage from './components/SettingCenter/SettingPage'
import Layout from './components/Layout'
import App from './App'
import ErrorPage from './components/ErrorPage'
import NotFound from './components/NotFound'

const router = createHashRouter([
  {
    // 全局布局
    element: <Layout />,
    // 全局错误处理
    errorElement: <ErrorPage />,
    children: [
      { path: '/', element: <App /> },
      { path: '/gallery/:gameId', element: <Gallery /> },
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/setting', element: <SettingPage /> },
      { path: '/setting/update', element: <Update /> },
      { path: '*', element: <NotFound /> }
    ]
  }
])

// 创建 QueryClient 实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟缓存时间
      gcTime: 10 * 60 * 1000, // 10分钟垃圾回收时间
      retry: 1, // 失败重试1次
      refetchOnWindowFocus: false // 窗口聚焦时不自动重新获取
    }
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
)
