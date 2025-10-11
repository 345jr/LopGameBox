import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

const Layout = () => {
  return (
    <>
      <Toaster position="bottom-center" reverseOrder={true} />
      <Outlet />
    </>
  );
};

export default Layout;
