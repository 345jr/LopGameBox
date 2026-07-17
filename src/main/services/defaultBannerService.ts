import { app } from 'electron'
import path from 'path'
import * as fs from 'fs/promises'
import { randomUUID } from 'crypto'
import { errorMessage } from '../util/errorMessage'

const DIR_NAME = 'defaultBanners'
const CONFIG_NAME = 'config.json'
const MAX_COUNT = 3

export interface DefaultBannerItem {
  id: string
  /** 相对 userData 的路径，如 defaultBanners/xxx.jpg */
  relativePath: string
  createdAt: number
}

export interface DefaultBannerConfig {
  items: DefaultBannerItem[]
  selectedId: string | null
}

export interface DefaultBannerState extends DefaultBannerConfig {
  /** 当前选中封面的相对路径；无选中时为 null */
  selectedRelativePath: string | null
  maxCount: number
}

function dirPath(): string {
  return path.join(app.getPath('userData'), DIR_NAME)
}

function configPath(): string {
  return path.join(dirPath(), CONFIG_NAME)
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(dirPath(), { recursive: true })
}

async function readConfig(): Promise<DefaultBannerConfig> {
  await ensureDir()
  try {
    const raw = await fs.readFile(configPath(), 'utf-8')
    const parsed = JSON.parse(raw) as DefaultBannerConfig
    const items = Array.isArray(parsed.items) ? parsed.items.slice(0, MAX_COUNT) : []
    const selectedId =
      parsed.selectedId && items.some((i) => i.id === parsed.selectedId)
        ? parsed.selectedId
        : (items[0]?.id ?? null)
    return { items, selectedId }
  } catch {
    return { items: [], selectedId: null }
  }
}

async function writeConfig(config: DefaultBannerConfig): Promise<void> {
  await ensureDir()
  await fs.writeFile(configPath(), JSON.stringify(config, null, 2), 'utf-8')
}

function toState(config: DefaultBannerConfig): DefaultBannerState {
  const selected = config.items.find((i) => i.id === config.selectedId) ?? null
  return {
    ...config,
    selectedRelativePath: selected?.relativePath ?? null,
    maxCount: MAX_COUNT
  }
}

export async function getDefaultBannerState(): Promise<DefaultBannerState> {
  return toState(await readConfig())
}

/** 从本地文件添加一张默认封面（最多 3 张） */
export async function addDefaultBanner(originPath: string): Promise<DefaultBannerState> {
  const config = await readConfig()
  if (config.items.length >= MAX_COUNT) {
    throw new Error(`最多只能保存 ${MAX_COUNT} 张默认封面`)
  }

  const ext = path.extname(originPath).toLowerCase() || '.jpg'
  const allowed = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'])
  if (!allowed.has(ext)) {
    throw new Error('仅支持 jpg / png / webp / gif / bmp 图片')
  }

  await ensureDir()
  const id = randomUUID()
  const fileName = `${id}${ext}`
  const destAbs = path.join(dirPath(), fileName)
  await fs.copyFile(originPath, destAbs)

  const item: DefaultBannerItem = {
    id,
    relativePath: path.posix.join(DIR_NAME, fileName),
    createdAt: Date.now()
  }
  config.items.push(item)
  // 第一张自动选中；已有选中则保持
  if (!config.selectedId) {
    config.selectedId = id
  }
  await writeConfig(config)
  return toState(config)
}

export async function selectDefaultBanner(id: string): Promise<DefaultBannerState> {
  const config = await readConfig()
  if (!config.items.some((i) => i.id === id)) {
    throw new Error('封面不存在')
  }
  config.selectedId = id
  await writeConfig(config)
  return toState(config)
}

export async function deleteDefaultBanner(id: string): Promise<DefaultBannerState> {
  const config = await readConfig()
  const target = config.items.find((i) => i.id === id)
  if (!target) {
    throw new Error('封面不存在')
  }

  config.items = config.items.filter((i) => i.id !== id)
  if (config.selectedId === id) {
    config.selectedId = config.items[0]?.id ?? null
  }

  await writeConfig(config)

  try {
    const abs = path.join(app.getPath('userData'), target.relativePath.replace(/\//g, path.sep))
    await fs.unlink(abs)
  } catch (err: unknown) {
    console.warn('[DefaultBanner] delete file failed:', errorMessage(err))
  }

  return toState(config)
}
