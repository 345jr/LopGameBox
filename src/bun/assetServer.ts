import { existsSync, statSync } from 'fs'
import { join, normalize, extname } from 'path'
import { getUserDataPath } from './paths'

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
}

export type AssetServer = {
  port: number
  baseUrl: string
  stop: () => void
}

/** Serves gallery files from Electron-compatible userData (replaces lop://). */
export function startAssetServer(preferredPort = 39211): AssetServer {
  const root = getUserDataPath()
  console.log('[Assets] serving from:', root)

  const server = Bun.serve({
    port: preferredPort,
    hostname: '127.0.0.1',
    fetch(req) {
      const url = new URL(req.url)
      if (url.pathname === '/health') return new Response('ok')

      let rel = decodeURIComponent(url.pathname.replace(/^\/assets\/?/, ''))
      rel = normalize(rel).replace(/^(\.\.(\/|\\|$))+/, '')
      if (!rel || rel === '.' || rel === '..') {
        return new Response('Not found', { status: 404 })
      }

      const filePath = join(root, rel)
      if (!existsSync(filePath) || !statSync(filePath).isFile()) {
        return new Response('Not found', { status: 404 })
      }

      const file = Bun.file(filePath)
      const type = MIME[extname(filePath).toLowerCase()] || 'application/octet-stream'
      return new Response(file, {
        headers: {
          'Content-Type': type,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache'
        }
      })
    }
  })

  const baseUrl = `http://127.0.0.1:${server.port}/assets`
  console.log('[Assets] baseUrl:', baseUrl)
  return {
    port: server.port,
    baseUrl,
    stop: () => server.stop(true)
  }
}
