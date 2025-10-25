import { useCheckUpdate, useGetVersionInfo } from "@renderer/api/queries";

const UpdateContent = ({ onClose }: { onClose: () => void }) => {
  // 当前版本
  const currentVersion = '0.0.5';

  // 使用 TanStack Query 获取更新信息
  const { data: updateInfo } = useCheckUpdate(currentVersion);

  // 使用 TanStack Query 获取当前版本信息
  const { data: versionData } = useGetVersionInfo(currentVersion);

  const currentVersionInfo = versionData?.version;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800/30">
        <div
          onClick={(e) => e.stopPropagation()}
          className="mx-4 w-full max-w-150 rounded-lg bg-white p-6 shadow-xl"
        >
          <h2 className="mb-4 text-lg font-bold">检查更新</h2>
          <p>当前版本: {currentVersion}</p>
          <p>发布日期: {currentVersionInfo?.release_date.slice(0, 10)}</p>
          <p>版本概述: {currentVersionInfo?.notes}</p>
          {updateInfo ? (
            <>
              <p>
                检查更新:
                {updateInfo.update ? (
                  <div>
                    <span className="text-green-500">是</span>
                    <p className="text-gray-500">{updateInfo.latest}</p>
                    <p className="text-gray-500">{updateInfo.message}</p>
                    <p className="text-gray-500">请前往官网下载最新版本</p>
                    <a href="https://github.com/345jr/LopGameBox">Github</a>
                  </div>
                ) : (
                  <div className="flex flex-row">
                    <p className="ml-5 text-gray-500">{updateInfo.message}</p>
                  </div>
                )}
              </p>
            </>
          ) : (
            <>
              <div>加载中...</div>
            </>
          )}

          <div className="mt-4">
            <button className="ml-2 rounded bg-gray-300 px-4 py-2 text-black" onClick={onClose}>
              关闭
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UpdateContent;
