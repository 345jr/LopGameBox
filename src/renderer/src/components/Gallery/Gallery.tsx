import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaPlus, FaImage, FaTrash, FaSort } from 'react-icons/fa6';
import Masonry from 'react-responsive-masonry';
import Achievements from './Achievements';
import toast from 'react-hot-toast';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import { useGalleryList, useGalleryStats } from '@renderer/api/queries/queries.gallery';

const Gallery = () => {
  const { gameId } = useParams();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAchievement, setNewAchievement] = useState({
    name: '',
    type: '自定义成就',
    description: '',
  });
  const [showAltModal, setShowAltModal] = useState(false);
  const [currentSnapshotId, setCurrentSnapshotId] = useState<number | null>(null);
  const [altText, setAltText] = useState('');
  const [isEditingAlt, setIsEditingAlt] = useState(false);
  const [selectedSnapshots, setSelectedSnapshots] = useState<Set<number>>(new Set());
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [sortNewestFirst, setSortNewestFirst] = useState(true);

  const gameIdNum = parseInt(gameId as string);
  const { data: statsData } = useGalleryStats(gameIdNum);
  const { data: snapshotList, refetch: refetchSnapshots } = useGalleryList(gameIdNum , sortNewestFirst);

  

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
      refetchSnapshots();
      toast.success('图片添加成功');
    } catch (error) {
      console.error('添加图片失败', error);
      toast.error('图片添加失败');
    }
  };
  // 切换选择状态
  const toggleSelected = (id: number) => {
    setSelectedSnapshots((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  // 批量删除已选图片
  const batchDeleteSelected = async () => {
    if (selectedSnapshots.size === 0) return;

    if (!confirm(`确定要删除 ${selectedSnapshots.size} 张图片吗？此操作不可恢复`)) return;

    setIsBatchDeleting(true);
    try {
      // 把选中的 id 转为数组
      const ids = Array.from(selectedSnapshots);

      // 从 snapshotList 找到对应的 relative_path
      const tasks = ids.map(async (id) => {
        const snap = snapshotList?.find((s) => s.id === id);
        if (!snap) return;
        // 删除数据库记录
        await window.api.delectSnapshot(id);
        // 删除对应文件
        await window.api.delectImages(snap.relative_path);
      });

      await Promise.all(tasks);

      toast.success(`已删除 ${ids.length} 张图片`);
      refetchSnapshots();
      setSelectedSnapshots(new Set());
    } catch (error) {
      console.error('批量删除失败', error);
      toast.error('批量删除失败');
    } finally {
      setIsBatchDeleting(false);
    }
  };
  //添加自定义成就
  const handleAddAchievement = async () => {
    if (!gameId || !newAchievement.name.trim()) {
      alert('请输入成就名称');
      return;
    }

    try {
      await window.api.createAchievement(
        parseInt(gameId),
        newAchievement.name,
        newAchievement.type,
        newAchievement.description,
      );

      setNewAchievement({ name: '', type: '自定义成就', description: '' });
      setShowAddModal(false);
      // fetchAchievements();
    } catch (error) {
      console.error('添加成就失败:', error);
    }
  };

  // ==================== ALT描述相关功能 ====================

  //打开ALT模态框
  const openAltModal = async (snapshotId: number) => {
    setCurrentSnapshotId(snapshotId);
    try {
      const alt = await window.api.getSnapshotAlt(snapshotId);
      if (alt) {
        setAltText(alt);
        setIsEditingAlt(true);
      } else {
        setAltText('');
        setIsEditingAlt(false);
      }
      setShowAltModal(true);
    } catch (error) {
      console.error('获取ALT描述失败:', error);

    }
  };

  //关闭ALT模态框
  const closeAltModal = () => {
    setShowAltModal(false);
    setCurrentSnapshotId(null);
    setAltText('');
    setIsEditingAlt(false);
  };

  //添加或更新ALT描述
  const handleSaveAlt = async () => {
    if (!currentSnapshotId || !altText.trim()) {
      alert('请输入描述信息');
      return;
    }

    try {
      await window.api.updateSnapshotAlt(currentSnapshotId, altText.trim());
      closeAltModal();
      refetchSnapshots();
      toast.success('描述已保存');
    } catch (error) {
      toast.error('保存描述失败');
    }
  };

  //删除ALT描述
  const handleDeleteAlt = async () => {
    if (!currentSnapshotId) return;

    if (confirm('确定要删除这个描述吗?')) {
      try {
        await window.api.deleteSnapshotAlt(currentSnapshotId);
        closeAltModal();
        refetchSnapshots;
        toast.success('描述已删除');
      } catch (error) {
        toast.error('删除失败');
      }
    }
  };
  // ALT按钮组件
  const OverlayContent: React.FC<{ index: number }> = ({ index }) => {
    if (!snapshotList || !snapshotList[index]) return null;
    return (
      <div className="fixed right-4 bottom-4 z-[1200]">
        <button
          onClick={() => openAltModal(snapshotList[index].id)}
          className="cursor-pointer rounded-md bg-black/60 px-3 py-2 text-white"
          aria-label={`ALT for snapshot ${snapshotList[index].id}`}
        >
          ALT
        </button>
      </div>
    );
  };

  if (!snapshotList) return <div>加载中...</div>;

  return (
    <div className="grid grid-cols-5 gap-4 p-4">
      {/* 第一行：数据展示和交互按钮区域 - 占据全部5列 */}
      <div className="col-span-5 rounded-lg bg-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            {/* 数据展示区域 */}
            <div className="flex flex-row gap-4 text-lg">
              <span>图片总数: {snapshotList.length || 0}</span>
              <span>
                成就完成: {statsData?.completed}/{statsData?.total}
              </span>
              <span>完成率: {statsData?.completionRate.toFixed(1)}%</span>
            </div>
          </div>
          <div className="flex gap-2">
            {/* 保留添加成就按钮在顶部工具区 */}
            <button
              onClick={() => setShowAddModal(true)}
              className="rounded bg-green-500 px-4 py-2 text-white transition hover:bg-green-600"
            >
              <FaPlus className="mr-1 inline" />
              添加成就
            </button>
          </div>
        </div>
      </div>

      {/* 第二行左侧：瀑布流图墙 - 占据3列 */}
      <div className="col-span-3">
        {/* 图集交互区 */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-lg font-medium">图集典藏</p>
          <div className="flex items-center gap-2">
            <button
              onClick={addSnapshot}
              className="flex items-center gap-2 rounded  px-3 py-1 text-sm text-black cursor-pointer "
              aria-label="添加图片"
              title="添加图片"
            >
              <FaImage className="inline text-sm" />
              <span className="hidden sm:inline">添加</span>
            </button>

            {/* 排序按钮（样式一致，点击切换文案） */}
            <button
              onClick={() => {
                setSortNewestFirst((v) => !v)
                console.log(snapshotList)
                console.log(sortNewestFirst)
              }}
              className="flex items-center gap-2 rounded px-3 py-1 text-sm text-black transition cursor-pointer"
              aria-label="切换排序"
              title={sortNewestFirst ? '从新到旧' : '从旧到新'}
            >
              <FaSort className="inline text-sm" />
              <span className="hidden sm:inline">{sortNewestFirst ? '从新到旧' : '从旧到新'}</span>
            </button>

            <button
              onClick={batchDeleteSelected}
              disabled={selectedSnapshots.size === 0 || isBatchDeleting}
              className={`flex items-center gap-2 rounded px-3 py-1 text-sm text-black transition cursor-pointer ${
                selectedSnapshots.size === 0 || isBatchDeleting
                  ? 'cursor-not-allowed '
                  : ''
              }`}
              aria-label="批量删除已选图片"
              title={
                selectedSnapshots.size === 0 || isBatchDeleting
                  ? '无可删除的图片'
                  : `删除 ${selectedSnapshots.size} 张图片`
              }
            >
              <FaTrash className="inline text-sm" />
              <span className="hidden sm:inline">
                {isBatchDeleting
                  ? '删除中...'
                  : `删除${selectedSnapshots.size > 0 ? ` (${selectedSnapshots.size})` : ''}`}
              </span>
            </button>
          </div>
        </div>
        <PhotoProvider overlayRender={({ index }) => <OverlayContent index={index} />}>
          <Masonry columnsCount={2} gutter="15px">
            {snapshotList.map((i) => {
              return (
                <div key={i.id} className="group relative">
                  {/* 右上角复选按钮 - 绝对定位，不会阻止图片打开（阻止事件冒泡） */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelected(i.id);
                    }}
                    className={`absolute top-2 right-2 z-30 transform rounded-full bg-black/60 p-1 text-white transition-all ${
                      selectedSnapshots.has(i.id)
                        ? 'scale-100 opacity-95'
                        : 'scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-95'
                    }`}
                    style={{ width: 32, height: 32 }}
                    aria-pressed={selectedSnapshots.has(i.id)}
                    title={selectedSnapshots.has(i.id) ? '已选中' : '选择'}
                  >
                    <span className="text-sm leading-none">
                      {selectedSnapshots.has(i.id) ? '✓' : '○'}
                    </span>
                  </button>

                  <PhotoView key={i.id} src={`lop://` + i.relative_path.replace(/\\/g, '/')}>
                    <img
                      src={`lop://` + i.relative_path.replace(/\\/g, '/')}
                      alt=""
                      className="w-full"
                    />
                  </PhotoView>
                </div>
              );
            })}
          </Masonry>
        </PhotoProvider>

        {/* 无图时默认展示 */}
        {snapshotList.length === 0 && (
          <>
            <div className="mt-8 text-center text-gray-500">暂无图片</div>
            <div className="mt-8 text-center text-gray-500">快去游戏中记录精彩瞬间吧!</div>
          </>
        )}
      </div>
      {/* 第二行右侧：成就区域 - 封装为组件 */}
      <Achievements />

      {/* 添加成就模态框 */}
      {showAddModal && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="w-96 rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold">添加新成就</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">成就名称</label>
                <input
                  type="text"
                  value={newAchievement.name}
                  onChange={(e) => setNewAchievement({ ...newAchievement, name: e.target.value })}
                  className="w-full rounded border px-3 py-2"
                  placeholder="例如: 完美通关"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">成就类型</label>
                <select
                  value={newAchievement.type}
                  onChange={(e) => setNewAchievement({ ...newAchievement, type: e.target.value })}
                  className="w-full rounded border px-3 py-2"
                >
                  <option value="自定义成就">自定义成就</option>
                  <option value="收集成就">收集成就</option>
                  <option value="剧情成就">剧情成就</option>
                  <option value="挑战成就">挑战成就</option>
                  <option value="隐藏成就">隐藏成就</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">成就描述(可选)</label>
                <textarea
                  value={newAchievement.description}
                  onChange={(e) =>
                    setNewAchievement({ ...newAchievement, description: e.target.value })
                  }
                  className="w-full rounded border px-3 py-2"
                  rows={3}
                  placeholder="描述这个成就..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddAchievement}
                  className="flex-1 rounded bg-green-500 px-4 py-2 text-white transition hover:bg-green-600"
                >
                  添加
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewAchievement({ name: '', type: '自定义成就', description: '' });
                  }}
                  className="flex-1 rounded bg-gray-500 px-4 py-2 text-white transition hover:bg-gray-600"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ALT描述模态框 */}
      {showAltModal && (
        <div
          className="fixed inset-0 z-5000 flex items-center justify-center bg-black/50"
          onClick={closeAltModal}
        >
          <div
            className="w-full max-w-lg rounded-lg bg-white text-black shadow-2xl ring-1 ring-black/10"
            onClick={(e) => e.stopPropagation()}
          >
            {isEditingAlt ? (
              /* 编辑模式 - 白底黑字 */
              <div className="relative">
                {/* 描述文本区域 - 白底黑字，左侧细边 */}
                <div className="border-l-4 border-black/20 bg-white px-8 py-12">
                  <p className="text-center font-serif text-lg leading-relaxed text-black italic">
                    "{altText}"
                  </p>
                </div>

                {/* 底部操作区域 - 简洁黑白按钮 */}
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3">
                  <button
                    onClick={() => {
                      setIsEditingAlt(false);
                    }}
                    className="cursor-pointer text-sm text-gray-600 transition hover:text-black hover:underline"
                  >
                    编辑内容
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteAlt}
                      className="cursor-pointer rounded bg-transparent px-2 py-1 text-sm text-gray-600 transition hover:text-red-600"
                      title="删除描述"
                    >
                      删除
                    </button>
                    <button
                      onClick={closeAltModal}
                      className="cursor-pointer rounded border border-gray-200 px-2 py-1 text-sm text-gray-700 transition hover:bg-gray-50"
                      title="关闭"
                    >
                      关闭
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* 添加/编辑输入模式 */
              <div className="bg-white p-6 text-black">
                <h3 className="mb-4 text-lg font-semibold text-black">
                  编辑描述
                </h3>
                <textarea
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-serif text-black focus:border-black/50 focus:ring-2 focus:ring-black/10 focus:outline-none"
                  rows={4}
                  placeholder="在此输入图片描述..."
                  autoFocus
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={closeAltModal}
                    className="cursor-pointer rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={async () => {
                      await handleSaveAlt();
                      if (altText.trim()) {
                        setIsEditingAlt(true);
                      }
                    }}
                    className="cursor-pointer rounded bg-black px-4 py-2 text-sm text-white transition hover:bg-gray-900"
                  >
                    保存
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
