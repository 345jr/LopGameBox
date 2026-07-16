/**
 * API 查询 hooks 的统一出口（桥接文件）
 *
 * 仅保留本地 Electron IPC / 本地数据相关 hooks。
 */
export * from './queryKeys'
export * from './queries/queries.gamelinks'
