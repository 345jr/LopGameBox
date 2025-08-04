import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter , RouterProvider } from 'react-router-dom'
import Gallery from './components/Gallery'
import Updata from './components/Updata'
import App from './App'
const router = createBrowserRouter([
  {path:"/",element:<App />},
  {path:"/gallery",element:<Gallery />},
  {path:'/updata',element:<Updata />}
])
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
