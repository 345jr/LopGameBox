import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter , RouterProvider } from 'react-router-dom'
import Gallery from './components/Gallery'
import Update from './components/Update'
import Dashboard from './components/Dashboard'
import App from './App'

const router = createBrowserRouter([
  {path:"/",element:<App />},
  {path:"/gallery/:gameId",element:<Gallery />},
  {path:'/update',element:<Update />},
  {path:'/dashboard',element:<Dashboard />}
])
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
