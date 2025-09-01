import './assets/main.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Gallery from './components/Gallery';
import Update from './components/SettingCenter/Update';
import Dashboard from './components/Dashboard/Dashboard';
import SettingPage from './components/SettingCenter/SettingPage';
import Practice from './components/SettingCenter/Practice';
import App from './App';

const router = createBrowserRouter([
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
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
