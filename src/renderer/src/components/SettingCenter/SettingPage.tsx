import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useUserStore from '@renderer/store/UserStore';
import DefaultAvatar from '../../assets/lopgame.png';
import { createPortal } from 'react-dom';
import UpdateContent from '../ModalContent/UpdateContent';
import LoginContent from '../ModalContent/LoginContent';
import { useGetMe, useLogout } from '@renderer/api/queries';

import toast from 'react-hot-toast';

const SettingPage = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [screenshotEnabled, setScreenshotEnabled] = useState(false);

  const JwtToken = useUserStore((state) => state.JwtToken);
  const setJwtToken = useUserStore((state) => state.setJwtToken);

  // 使用 TanStack Query 获取用户数据
  const {
    data: userData,
    isLoading,
    error,
  } = useGetMe(JwtToken, !!JwtToken);

  // 获取 logout 函数
  const clearUserCache = useLogout();

  // 处理获取用户信息失败的情况
  useEffect(() => {
    if (error && JwtToken) {
      console.error('获取用户信息失败:', error);
      // 如果获取用户信息失败，可能token已过期，清除token
      setJwtToken('');
      toast.error('登录已过期，请重新登录');
    }
  }, [error, JwtToken, setJwtToken]);

  useEffect(() => {
    const initScreenshotStatus = async () => {
      try {
        const status = await window.api.getScreenshotShortcutStatus();
        setScreenshotEnabled(status.enabled);
      } catch (error) {
        console.error('获取截图快捷键状态失败:', error);
      }
    };
    initScreenshotStatus();

    // 监听截图事件
    window.api.onScreenshotSuccess((data) => {
      toast.success(`截图已保存: ${data.filename}`);
    });

    window.api.onScreenshotError((data) => {
      toast.error(`截图失败: ${data.error}`);
    });

    // 清理监听器
    return () => {
      window.api.offScreenshotSuccess();
      window.api.offScreenshotError();
    };
  }, [JwtToken]);

  // 退出登录
  const handleLogout = () => {
    setJwtToken('');
    clearUserCache(); // 清除用户缓存
  };

  // 截图快捷键开关处理
  const handleScreenshotToggle = async () => {
    if (screenshotEnabled) {
      toast.promise(
        window.api.disableScreenshotShortcut().then(() => {
          setScreenshotEnabled(false);
        }),
        {
          loading: '正在禁用截图快捷键...',
          success: '截图快捷键已禁用',
          error: (err) => `禁用失败: ${err.message || String(err)}`,
        }
      );
    } else {
      toast.promise(
        window.api.enableScreenshotShortcut().then(() => {
          setScreenshotEnabled(true);
        }),
        {
          loading: '正在启用截图快捷键...',
          success: '截图快捷键已启用（按 F12 截图）',
          error: (err) => `启用失败: ${err.message || String(err)}`,
        }
      );
    }
  };

  // 备份数据库处理函数
  const handleBackup = async () => {
    if (!JwtToken) {
      toast.error('请先登录后再进行云备份');
      return;
    }

    const uploadUrl = 'https://lopbox.lopop.top/upload';
    
    toast.promise(
      window.api.backupAndUpload(uploadUrl, JwtToken).then((result) => {
        if (result.success) {
          return result;
        } else {
          throw new Error(result.error || '备份失败');
        }
      }),
      {
        loading: '正在备份并上传...',
        success: '备份并上传成功！',
        error: (err) => `备份失败: ${err.message || String(err)}`,
      }
    );
  };

  return (
    <>
      {/* 用户配置 */}
      <div className="flex flex-row">
        {/* 用户信息区 */}
        {isLoading ? (
          <div className="m-4 grid items-center gap-2">
            <p className="whitespace-nowrap text-gray-600">加载中...</p>
            <p className="text-xs text-blue-600">● 正在获取用户信息</p>
          </div>
        ) : userData ? (
          <div className="ml-4 grid w-45 grid-cols-3 grid-rows-2 items-center justify-center">
            {/* 用户画像 */}
            <div className="flex justify-center">
              <img src={DefaultAvatar} alt="用户头像" className="w-25" />
            </div>
            <p className="col-span-2 text-center text-lg font-semibold">
              {userData.user.username || '未知用户'}
            </p>
            <p className="col-span-2 text-center text-sm text-gray-600">
              用户ID: {userData.user.id || '未知'}
            </p>
            {/* <p className='text-sm text-gray-600'>用户权限:{userData.user.role == "user" ? '普通用户' : '管理员'}</p> */}
            <p className="mt-1 text-xs text-green-600">● 已登录</p>
          </div>
        ) : (
          <div className="m-4 grid items-center gap-2">
            <p className="whitespace-nowrap text-gray-600">当前为离线状态</p>
            <p className="text-xs text-red-600">● 未登录</p>
          </div>
        )}
        {/* 3个按钮 */}
        <div className="p-5">
          <div className="grid grid-cols-3 grid-rows-2 gap-4">
            <div className="col-span-3 gap-4">
              {JwtToken ? (
                <button
                  onClick={handleLogout}
                  className="w-full rounded bg-gray-300 px-4 py-2 text-black transition-colors hover:bg-gray-500 hover:text-white"
                >
                  退出登录
                </button>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="w-full rounded bg-gray-300 px-4 py-2 text-black transition-colors hover:bg-gray-500 hover:text-white"
                >
                  登录
                </button>
              )}
            </div>

            <div className="col-span-2 gap-4">
              <button
                onClick={handleBackup}
                className="w-full rounded bg-gray-300 px-4 py-2 text-black transition-colors hover:bg-gray-500 hover:text-white"
              >
                云备份
              </button>
            </div>
            <div className="">
              <button
                onClick={() => {
                  setShowUpdate(true);
                }}
                className="rounded bg-gray-300 px-4 py-2 text-black transition-colors hover:bg-gray-500 hover:text-white"
              >
                检查更新
              </button>
            </div>
          </div>
        </div>
        {/* 2个按钮 */}
        <div className="flex grow flex-col justify-center gap-4 p-5">
          <button className="w-full rounded bg-gray-300 px-4 py-2 text-black transition-colors hover:bg-gray-500 hover:text-white">
            绑定Steam
          </button>
          <button
            onClick={handleScreenshotToggle}
            className={`w-full rounded px-4 py-2 transition-colors ${
              screenshotEnabled
                ? 'bg-red-400 text-white hover:bg-red-600'
                : 'bg-gray-300 text-black hover:bg-gray-500 hover:text-white'
            }`}
          >
            {screenshotEnabled ? '禁用截图快捷键' : '启用截图快捷键'}
          </button>
        </div>
      </div>

      {/* 登录模态框 */}
      {showLogin &&
        createPortal(<LoginContent onClose={() => setShowLogin(false)} />, document.body)}
      {/* 检查更新模态框 */}
      {showUpdate &&
        createPortal(<UpdateContent onClose={() => setShowUpdate(false)} />, document.body)}
      <div className="text-red-500">
        <Link to={'/404'}>
          404跳转测试
        </Link>
      </div>
      {/* <div className="mt-10 text-center">
        <Link to="/">返回主页</Link>
      </div> */}
    </>
  );
};

export default SettingPage;
