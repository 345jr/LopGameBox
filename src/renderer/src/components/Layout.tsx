import { Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import NavHeader from './NavHeader'

/** 顶栏固定，滚动只发生在内容区（滚动条不盖住顶栏） */
const Layout = () => {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <NavHeader />
      <Toaster position="bottom-center" reverseOrder={true} />
      {/* flex-col + 子项 flex-1：短内容也能撑满可视区，避免背景下方露白 */}
      <main
        id="app-scroll-root"
        className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto"
      >
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
