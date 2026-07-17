import { app } from 'electron'
import path from 'path'
import * as fs from 'fs/promises'
import { randomUUID } from 'crypto'
import { errorMessage } from '../util/errorMessage'

const DIR_NAME = 'appBackgrounds'
const CONFIG_NAME = 'config.json'
const MAX_COUNT = 6

export interface AppBackgroundItem {
  id: string
  /** 相对 userData，如 appBackgrounds/xxx.jpg */
  relativePath: string
  createdAt: number
}

export interface AppBackgroundConfig {
  items: AppBackgroundItem[]
  /** null = 使用应用内置背景 */
  selectedId: string | null
}

export interface AppBackgroundState extends AppBackgroundConfig {
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

async function readConfig(): Promise<AppBackgroundConfig> {
  await ensureDir()
  try {
    const raw = await fs.readFile(configPath(), 'utf-8')
    const parsed = JSON.parse(raw) as AppBackgroundConfig
    const items = Array.isArray(parsed.items) ? parsed.items.slice(0, MAX_COUNT) : []
    // selectedId 为 null 表示内置默认；仅当 id 仍存在于列表中时保留
    const selectedId =
      parsed.selectedId && items.some((i) => i.id === parsed.selectedId)
        ? parsed.selectedId
        : null
    return { items, selectedId }
  } catch {
    return { items: [], selectedId: null }
  }
}

async function writeConfig(config: AppBackgroundConfig): Promise<void> {
  await ensureDir()
  await fs.writeFile(configPath(), JSON.stringify(config, null, 2), 'utf-8')
}

function toState(config: AppBackgroundConfig): AppBackgroundState {
  const selected = config.items.find((i) => i.id === config.selectedId) ?? null
  return {
    ...config,
    selectedRelativePath: selected?.relativePath ?? null,
    maxCount: MAX_COUNT
  }
}

export async function getAppBackgroundState(): Promise<AppBackgroundState> {
  return toState(await readConfig())
}

export async function addAppBackground(originPath: string): Promise<AppBackgroundState> {
  const config = await readConfig()
  if (config.items.length >= MAX_COUNT) {
    throw new Error(`最多只能保存 ${MAX_COUNT} 张背景图`)
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

  const item: AppBackgroundItem = {
    id,
    relativePath: path.posix.join(DIR_NAME, fileName),
    createdAt: Date.now()
  }
  config.items.push(item)
  // 库为空时的第一张自动选用；已有选中或刻意用内置时不抢占
  if (config.items.length === 1 && !config.selectedId) {
    config.selectedId = id
  }
  await writeConfig(config)
  return toState(config)
}

/** id 为 null 时切回应用内置背景 */
export async function selectAppBackground(id: string | null): Promise<AppBackgroundState> {
  const config = await readConfig()
  if (id !== null && !config.items.some((i) => i.id === id)) {
    throw new Error('背景图不存在')
  }
  config.selectedId = id
  await writeConfig(config)
  return toState(config)
}

export async function deleteAppBackground(id: string): Promise<AppBackgroundState> {
  const config = await readConfig()
  const target = config.items.find((i) => i.id === id)
  if (!target) {
    throw new Error('背景图不存在')
  }

  config.items = config.items.filter((i) => i.id !== id)
  if (config.selectedId === id) {
    // 删掉当前选中 → 回退内置默认
    config.selectedId = null
  }

  await writeConfig(config)

  try {
    const abs = path.join(app.getPath('userData'), target.relativePath.replace(/\//g, path.sep))
    await fs.unlink(abs)
  } catch (err: unknown) {
    console.warn('[AppBackground] delete file failed:', errorMessage(err))
  }

  return toState(config)
}
