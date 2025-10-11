import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useUserStore from '@renderer/store/UserStore';
import DefaultAvatar from '../../assets/lopgame.png';
import { createPortal } from 'react-dom';
import UpdateContent from '../ModalContent/UpdateContent';
import LoginContent from '../ModalContent/LoginContent';
import { getMe } from '@renderer/api';

import type { UserData } from '@renderer/types/SettingCenter';
import toast from 'react-hot-toast';

const SettingPage = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showUpdate, setShowUpdate] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const JwtToken = useUserStore((state) => state.JwtToken);
  const setJwtToken = useUserStore((state) => state.setJwtToken);

  useEffect(() => {
    //有JwtToken就不用再次登录
    if (JwtToken) {
      // 获取用户信息
      fetchUserData();
    } else {
      setIsLoading(false);
    }
  }, [JwtToken]);

  // 退出登录
  const handleLogout = () => {
    setJwtToken('');
    setUserData(null);
  };

  // 备份数据库处理函数
  const handleBackup = async () => {
    try {
      if (!JwtToken) {
        toast.error('请先登录后再进行云备份');
        return;
      }
      const uploadUrl = 'https://lopbox.lopop.top/upload';
      const result = await window.api.backupAndUpload(uploadUrl, JwtToken);
      console.log(result)
      console.log(`有结果了`)
      if (result.success) {
        toast.success(`备份并上传成功`);
      } else {
        toast.error(`备份或上传失败: ${result.error}`);
      }
    } catch (err) {
      toast.error(`备份发生异常: ${String(err)}`);
    }
  };

  //从服务器获取用户信息
  const fetchUserData = async () => {
    try {
      const data = await getMe(JwtToken);
      setUserData(data);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      // 如果获取用户信息失败，可能token已过期，清除token
      setJwtToken('');
    } finally {
      setIsLoading(false);
    }
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
          <button className="w-full rounded bg-gray-300 px-4 py-2 text-black transition-colors hover:bg-gray-500 hover:text-white">
            应用设置
          </button>
        </div>
      </div>

      {/* 登录模态框 */}
      {showLogin &&
        createPortal(<LoginContent onClose={() => setShowLogin(false)} />, document.body)}
      {/* 检查更新模态框 */}
      {showUpdate &&
        createPortal(<UpdateContent onClose={() => setShowUpdate(false)} />, document.body)}

      {/* <div className="grid grid-rows-3 gap-4">
        <Link to="/setting/update">更新记录</Link>
        <Link to="/setting/practice">代码练习</Link>
        <Link to="/setting/info">关于这款软件</Link>
      </div> */}
      <div className="mt-10 text-center">
        <Link to="/">返回主页</Link>
      </div>
    </>
  );
};

export default SettingPage;
