import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter , RouterProvider } from 'react-router-dom'
import Gallery from './components/Gallery'
import Updata from './components/Updata'
import Playground from './components/Playground'
import App from './App'

const router = createBrowserRouter([
  {path:"/",element:<App />},
  {path:"/gallery/:gameId",element:<Gallery />},
  {path:'/update',element:<Updata />},
  {path:'/playground',element:<Playground/>}
])
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
