// 定义拖拽文件的类型
export type DropPayload = {
  files: Array<{
    name: string;
    type?: string;
    size?: number;
    path?: string;
    buffer?: Uint8Array | ArrayBuffer | null;
  }>;
};
// 拖拽结果类型
export type DropResult = {
  success: boolean;
  tempPath?: string;
  error?: string;
};