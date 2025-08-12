import { Snapshot } from '@renderer/types/Game';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { FaRegCircleXmark } from 'react-icons/fa6';
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
    <>
      <h1>游戏图集页面</h1>
      <button onClick={addSnapshot}>添加图</button>
      <p>游戏id :{gameId}</p>
      <div className="grid grid-cols-4 gap-4 p-5">
        {snapshotList ? (
          snapshotList.map((i, index) => {
            return (
              <div key={i.game_id}>
                <div className="text-center">
                  <p>图片{index + 1}</p>
                </div>
                <div className="group relative flex justify-end">
                  <button
                    onClick={() => delectSnapshot(i.id, i.relative_path)}
                    className="Tr_ani absolute top-2 right-2"
                  >
                    <FaRegCircleXmark className="text-2xl text-red-600" />
                  </button>
                  <img
                    src={`lop://` + i.relative_path.replace(/\\/g, '/')}
                    alt="图集"
                    className="w-40"
                  />
                </div>
              </div>
            );
          })
        ) : (
          <>
            <p>该游戏暂时没有图集</p>
          </>
        )}
      </div>

      <div className="mt-20 text-xl">
        <Link to={'/'}>
          <button className="cursor-pointer">返回主页</button>
        </Link>
      </div>
    </>
  );
};

export default Gallery;
