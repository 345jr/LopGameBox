import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <>
      <div>统计面板页面</div>
      <div className="mt-20 text-xl ">
          <Link to={'/'}>
            <button className='cursor-pointer'>返回主页</button>
          </Link>
        </div>
    </>
  );
};

export default Dashboard;
