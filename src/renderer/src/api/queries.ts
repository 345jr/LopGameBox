/**
 * API 查询 hooks 的统一出口（桥接文件）
 *
 * 目的：
 * - 保持向后兼容性（现有导入路径仍然可用）
 * - 将各类 hook 按功能拆分到独立文件，便于维护与测试
 */
export * from './queryKeys';
export * from './queries/queries.user';
export * from './queries/queries.metadata';
export * from './queries/queries.update';
export * from './queries/queries.gamelinks';

