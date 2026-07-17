/** DB 中的默认封面标记（不指向具体文件；实际展示用设置中心选中的封面） */
export const DEFAULT_BANNER_REL = 'banner/default.jpg'

/** 未配置任何默认封面时的占位图 */
export const PLACEHOLDER_BANNER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="560" viewBox="0 0 960 560">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#292524"/>
          <stop offset="100%" stop-color="#44403c"/>
        </linearGradient>
      </defs>
      <rect width="960" height="560" fill="url(#g)"/>
      <rect x="40" y="40" width="880" height="480" rx="24" fill="none" stroke="#78716c" stroke-width="2" stroke-dasharray="10 8" opacity="0.55"/>
      <text x="480" y="290" text-anchor="middle" fill="#a8a29e" font-size="28" font-family="system-ui,sans-serif">暂无默认封面</text>
    </svg>`
  )

export function isDefaultBannerPath(rel?: string | null): boolean {
  if (!rel) return true
  const normalized = rel.replace(/\\/g, '/').replace(/^\/+/, '').toLowerCase()
  return normalized === DEFAULT_BANNER_REL
}

/**
 * 解析封面展示地址：
 * - 默认封面标记 → 设置中心当前选中的 userData 图（lop://），否则占位图
 * - http(s) → 原样
 * - 其它相对路径 → lop://userData 下的用户图片
 */
export function resolveBannerSrc(
  relativePath?: string | null,
  selectedDefaultRel?: string | null
): string {
  if (!relativePath || isDefaultBannerPath(relativePath)) {
    if (selectedDefaultRel) {
      return 'lop://' + selectedDefaultRel.replace(/\\/g, '/')
    }
    return PLACEHOLDER_BANNER
  }
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath
  }
  return 'lop://' + relativePath.replace(/\\/g, '/')
}
