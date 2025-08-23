import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useUserStore from '@renderer/store/UserStore';
import DefaultAvatar from '../../assets/lopgame.png';
import { createPortal } from 'react-dom';
import UpdateContent from '../ModalContent/UpdateContent';
import LoginContent from '../ModalContent/LoginContent';

interface UserData {
  message: string;
  token: string;
  user: {
    id: number;
    username: string;
    role: string;
  };
}

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
      const response = await fetch('http://199.115.229.247:8086/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${JwtToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('网络错误');
      }

      const data = await response.json();
      setUserData(data);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      // 如果获取用户信息失败，可能token已过期，清除token
      setJwtToken('');
    }
  };

  return (
    <>
      <div className="text-center">设置中心</div>

      {/* 用户配置 */}
      <div className="flex flex-row">
        {/* 用户画像 */}
        <div className="">
          <img src={DefaultAvatar} alt="用户头像" className="w-25" />
        </div>
        {/* 用户信息区 */}
        {userData ? (
          <div className="ml-4 flex w-40 flex-col justify-center">
            <p className="text-lg font-semibold">用户名: {userData.user.username || '未知用户'}</p>
            <p className="text-sm text-gray-600">用户ID: {userData.user.id || '未知'}</p>
            {/* <p className='text-sm text-gray-600'>用户权限:{userData.user.role == "user" ? '普通用户' : '管理员'}</p> */}
            <p className="mt-1 text-xs text-green-600">● 已登录</p>
          </div>
        ) : (
          <div className="ml-4 flex items-center">
            <div>
              <p className="text-gray-600">当前为离线状态</p>
              <p className="text-xs text-red-600">● 未登录</p>
            </div>
          </div>
        )}
        {/* 用户操作区*/}
        <div className="w-full p-5">
          <div className="grid grid-cols-3 gap-4">
            {JwtToken ? (
              <button
                onClick={handleLogout}
                className="rounded bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600"
              >
                退出登录
              </button>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
              >
                登录
              </button>
            )}
            <button className="rounded bg-purple-500 px-4 py-2 text-white transition-colors hover:bg-purple-600">
              云备份
            </button>
            <button
              onClick={() => {
                setShowUpdate(true);
              }}
              className="rounded bg-orange-500 px-4 py-2 text-white transition-colors hover:bg-orange-600"
            >
              检查更新
            </button>
          </div>
        </div>
      </div>
      {/* 登录模态框 */}
      {showLogin &&
        createPortal(<LoginContent onClose={() => setShowLogin(false)} />, document.body)}
      {/* 检查更新模态框 */}
      {showUpdate &&
        createPortal(<UpdateContent onClose={() => setShowUpdate(false)} />, document.body)}
      <div className="grid grid-rows-3 gap-4">
        <Link to="/setting/update">更新记录</Link>
        <Link to="/setting/practice">代码练习</Link>
        <Link to="/setting/info">关于这款软件</Link>
      </div>
      <div className="text-center">
        <Link to="/">返回主页</Link>
      </div>
    </>
  );
};

export default SettingPage;
