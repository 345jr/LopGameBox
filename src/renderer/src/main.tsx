import './assets/main.css'
import 'react-photo-view/dist/react-photo-view.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Gallery from './components/Gallery/Gallery'
import Update from './components/SettingCenter/Update'
import Dashboard from './components/Dashboard/Dashboard'
import SettingPage from './components/SettingCenter/SettingPage'
import Layout from './components/Layout'
import App from './App'
import ErrorPage from './components/ErrorPage'
import NotFound from './components/NotFound'
import { createWindowApi, installElectrobunBridge } from './bridge/electrobunApi'

const router = createHashRouter([
  {
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/', element: <App /> },
      { path: '/gallery/:gameId', element: <Gallery /> },
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/setting', element: <SettingPage /> },
      { path: '/setting/update', element: <Update /> },
      { path: '*', element: <NotFound /> }
    ]
  }
])

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
})

function showBootBanner(msg: string, isError = false): void {
  let el = document.getElementById('boot-banner')
  if (!el) {
    el = document.createElement('div')
    el.id = 'boot-banner'
    el.style.cssText =
      'position:fixed;left:12px;bottom:12px;z-index:99999;max-width:70vw;' +
      'padding:8px 12px;border-radius:8px;font:12px/1.4 monospace;' +
      'pointer-events:none;box-shadow:0 4px 20px rgba(0,0,0,.35)'
    document.body.appendChild(el)
  }
  el.style.background = isError ? '#7f1d1d' : '#14532d'
  el.style.color = '#fff'
  el.textContent = msg
  if (!isError) {
    setTimeout(() => el?.remove(), 4000)
  }
}

function mountApp(): void {
  const root = document.getElementById('root')
  if (!root) {
    document.body.innerHTML =
      '<pre style="color:#f88;padding:24px;background:#111">#root missing</pre>'
    return
  }

  // Ensure window.api exists before any component effect runs
  if (!window.api) {
    window.api = createWindowApi()
  }

  createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>
  )
}

// 1) Paint UI immediately (never wait on RPC for first paint)
try {
  mountApp()
  showBootBanner('UI mounted · connecting RPC…')
} catch (err) {
  console.error('[bootstrap] mount failed:', err)
  document.body.innerHTML = `<pre style="color:#f88;padding:24px;background:#111;font:14px/1.4 monospace">Mount failed:\n${String(err)}\n\n${err instanceof Error ? err.stack : ''}</pre>`
}

// 2) Connect bridge in background; React Query will refetch when ready
void installElectrobunBridge()
  .then(() => {
    showBootBanner('RPC ready')
    // Kick a refresh so lists that raced during init load again
    void queryClient.invalidateQueries()
  })
  .catch((err) => {
    console.error('[bootstrap] bridge failed:', err)
    showBootBanner(`RPC failed: ${String(err)}`, true)
  })
