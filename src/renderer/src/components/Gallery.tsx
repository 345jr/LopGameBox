import { Snapshot } from '@renderer/types/Game';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { FaRegCircleXmark } from 'react-icons/fa6';
import Masonry from 'react-responsive-masonry';
const Gallery = () => {
  const { gameId } = useParams();
  const [snapshotList, setSnapshotList] = useState<Snapshot[]>();
  //获取图集列表
  const fetchSnapshotList = async () => {
    if (gameId) {
      const snapshotList = await window.api.getGameSnapshot(parseInt(gameId));
      setSnapshotList(snapshotList);
    }
  };

  useEffect(() => {
    fetchSnapshotList();
  }, []);
  //添加图
  const addSnapshot = async () => {
    const path = await window.api.openFile();
    const targetPath = 'snapshot/';

    if (!path) return;
    try {
      const result = await window.api.copyImages({
        origin: path,
        target: targetPath,
        gameName: `snapshot${Date.now()}`,
        oldFilePath: 'skip',
      });
      if (gameId) {
        await window.api.addGameSnapshot({
          gameId: parseInt(gameId),
          imagePath: path,
          relativePath: result.relativePath,
        });
      }
      fetchSnapshotList();
    } catch (error) {
      console.log(error);
    }
  };
  //删除图
  const delectSnapshot = async (id: number, relative_path: string) => {
    //删除数据库记录
    await window.api.delectSnapshot(id);
    //删除对应文件
    await window.api.delectImages(relative_path);
    fetchSnapshotList();
  };
  return (
    <div className="grid grid-cols-5 gap-4 p-4">
      {/* 第一行：数据展示和交互按钮区域 - 占据全部5列 */}
      <div className="col-span-5 rounded-lg bg-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            {/* 数据展示区域 */}
            <div className="flex flex-row text-lg gap-4">
              <span>图片总数: {snapshotList?.length || 0}</span>
              <span>星星总数:666</span>
            </div>
          </div>
          <div className="flex gap-2">
            {/* 交互按钮区域 */}
            <button
              onClick={addSnapshot}
              className="rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600"
            >
              添加图片
            </button>
            <Link to={'/'}>
              <button className="cursor-pointer rounded bg-gray-500 px-4 py-2 text-white transition hover:bg-gray-600">
                返回主页
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* 第二行左侧：瀑布流图墙 - 占据3列 */}
      <div className="col-span-3">
        <Masonry columnsCount={2} gutter="10px">
          {snapshotList?.map((i) => {
            return (
              <div key={i.game_id}>
                <div className="group relative flex justify-end">
                  <button
                    onClick={() => delectSnapshot(i.id, i.relative_path)}
                    className="Tr_ani absolute top-2 right-2 z-10 cursor-pointer"
                  >
                    <FaRegCircleXmark className="text-2xl text-red-600" />
                  </button>
                  <img
                    src={`lop://` + i.relative_path.replace(/\\/g, '/')}
                    alt="图集"
                    className=""
                    style={{ width: '100%', display: 'block' }}
                  />
                </div>
              </div>
            );
          })}
        </Masonry>
        {/* 无图时默认展示 */}
        {snapshotList?.length === 0 && (
          <div className="text-center text-gray-500 mt-8">暂无图片</div>
        )}
      </div>

      {/* 第二行右侧：成就区域 - 占据2列 */}
      <div className="col-span-2 rounded-lg bg-gray-100 p-4">
        <h2 className="mb-4 text-xl font-bold">游戏进度</h2>
        <div className="space-y-2">
          {/* 成就内容占位 */}
          <p className="text-gray-500">成就内容待添加...</p>
        </div>
      </div>
    </div>
  );
};

export default Gallery;
