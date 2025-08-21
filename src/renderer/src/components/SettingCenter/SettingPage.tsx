import { Link, Outlet } from 'react-router-dom';

const SettingPage = () => {
  return (
    <>
      <div>设置中心</div>
      <div className='grid grid-cols-4 gap-4 text-center bg-amber-100'>
        <Link to="update">更新记录</Link>
        <Link to="practice">练习</Link>
        <Link to="/">返回主页</Link>
      </div>
      <Outlet />
    </>
  );
};

export default SettingPage;
