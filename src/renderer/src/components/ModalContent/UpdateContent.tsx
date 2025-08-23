import { useEffect, useState } from 'react';

interface UpdateInfo {
  update: boolean;
  message: string;
  latest: string;
}
interface VersionInfo {
  id: number;
  version: string;
  release_date: string;
  notes: string;
}
const UpdateContent = ({ onClose }: { onClose: () => void }) => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  // 当前版本
  const currentVersion = {
    version: '0.0.2',
  };
  const [currentVersionInfo, setCurrentVersionInfo] = useState<VersionInfo | null>(null);

  //获取检查更新信息
  const fetchUpdateInfo = async () => {
    try {
      const response = await fetch('http://199.115.229.247:8086/check-update', {
        method: 'POST',
        body: JSON.stringify({
          version: currentVersion.version,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('获取更新信息失败');
      }
      const data = await response.json();
      setUpdateInfo(data);
    } catch (error) {
      console.error('获取更新信息失败:', error);
    }
  };
  //获取当前版本信息
  const fetchCurrentVersion = async () => {
    try {
      const response = await fetch(
        `http://199.115.229.247:8086/version/${encodeURIComponent(currentVersion.version)}`,
        {
          method: 'GET',
        },
      );
      if (!response.ok) {
        throw new Error('获取当前版本信息失败');
      }
      const data = await response.json();
      setCurrentVersionInfo(data.version);
    } catch (error) {
      console.error('获取当前版本信息失败:', error);
    }
  };

  useEffect(() => {
    fetchUpdateInfo();
    fetchCurrentVersion();
  }, []);
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800/30">
        <div
          onClick={(e) => e.stopPropagation()}
          className="mx-4 w-full max-w-150 rounded-lg bg-white p-6 shadow-xl"
        >
          <h2 className="mb-4 text-lg font-bold">检查更新</h2>
          <p>当前版本: {currentVersion.version}</p>
          <p>发布日期: {currentVersionInfo?.release_date.slice(0,10)}</p>
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
                  <div className='flex flex-row'>
                    <span className="text-red-500 ">否</span>
                    <p className="text-gray-500 ml-5">{updateInfo.message}</p>
                  </div>
                )}
              </p>
            </>
          ) : (
            <>
              <p>加载中...</p>
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
