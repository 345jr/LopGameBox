import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import NavHeader from './NavHeader';

const Layout = () => {
  return (
    <>
      <NavHeader />
      <Toaster position="bottom-center" reverseOrder={true} />
      <Outlet />
    </>
  );
};

export default Layout;
