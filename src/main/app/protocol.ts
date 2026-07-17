import { protocol, net, app } from 'electron'
import path from 'path'
import url from 'node:url'

/** 必须在 app ready 之前调用 */
export function registerPrivilegedSchemes(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'lop',
      privileges: {
        bypassCSP: true,
        standard: true,
        secure: true,
        supportFetchAPI: true
      }
    }
  ])
}

/** 从 userData 提供用户资源（封面/运行时文件） */
export function registerLopProtocol(): void {
  protocol.handle('lop', (request) => {
    let filePath = request.url.slice('lop://'.length)
    filePath = decodeURIComponent(filePath)
    const userDataPath = path.join(app.getPath('userData'), filePath)
    const clean = userDataPath.replace(/[\\/]+$/, '')
    return net.fetch(url.pathToFileURL(path.join(clean)).toString())
  })
}
