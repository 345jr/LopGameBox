import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useUserStore from '@renderer/store/UserStore';
import DefaultAvatar from '../../assets/lopgame.png';
import { createPortal } from 'react-dom';
import UpdateContent from '../ModalContent/UpdateContent';
import LoginContent from '../ModalContent/LoginContent';
import { getMe } from '@renderer/api';

import type { UserData } from '@renderer/types/SettingCenter';

const SettingPage = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showUpdate, setShowUpdate] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const JwtToken = useUserStore((state) => state.JwtToken);
  const setJwtToken = useUserStore((state) => state.setJwtToken);

  useEffect(() => {
    //有JwtToken就不用再次登录
    if (JwtToken) {
      // 获取用户信息
      fetchUserData();
      console.log(`当前以登录.JWT : ${JwtToken}`);
    }
  }, [JwtToken]);

  // 退出登录
  const handleLogout = () => {
    setJwtToken('');
    setUserData(null);
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
    }
  };

  // 备份数据库处理函数
  const handleBackup = async () => {
    try {
      // 固定使用本地开发环境的上传地址，且必须已登录（有 JwtToken）
      if (!JwtToken) {
        alert('请先登录后再进行云备份');
        return;
      }
      const uploadUrl = 'http://localhost:3000/upload';
      const result = await window.api.backupAndUpload(uploadUrl, JwtToken);
      if (result.success) {
        alert(`备份并上传成功，路径: ${result.path}`);
      } else {
        alert(`备份或上传失败: ${result.error}`);
      }
    } catch (err) {
      alert(`备份发生异常: ${String(err)}`);
    }
  };

  return (
    <>
      {/* 用户配置 */}
      <div className="flex flex-row">
        {/* 用户信息区 */}
        {userData ? (
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
        <div className="flex flex-col justify-center gap-4 p-5 grow">
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
