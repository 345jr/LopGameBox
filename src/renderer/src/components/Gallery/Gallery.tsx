import { Snapshot, GameAchievement } from '@renderer/types/Game';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { FaRegCircleXmark, FaPlus } from 'react-icons/fa6';
import Masonry from 'react-responsive-masonry';
import Achievements from './Achievements';
import toast from 'react-hot-toast';
import { PhotoProvider, PhotoView } from 'react-photo-view';

// 时长成就等级配置
const TIME_ACHIEVEMENTS = [
  { level: 1, hours: 2, name: '初入游戏', description: '游玩时长达到2小时' },
  { level: 2, hours: 5, name: '渐入佳境', description: '游玩时长达到5小时' },
  { level: 3, hours: 10, name: '深度体验', description: '游玩时长达到10小时' },
  { level: 4, hours: 20, name: '资深玩家', description: '游玩时长达到20小时' },
];

// 完成度成就等级配置
const COMPLETION_ACHIEVEMENTS = [
  { level: 1, percent: 20, name: '略有小成', description: '游戏完成度达到20%' },
  { level: 2, percent: 40, name: '渐入佳境', description: '游戏完成度达到40%' },
  { level: 3, percent: 60, name: '过半完成', description: '游戏完成度达到60%' },
  { level: 4, percent: 80, name: '接近尾声', description: '游戏完成度达到80%' },
  { level: 5, percent: 100, name: '完美达成', description: '游戏完成度达到100%' },
];

const Gallery = () => {
  const { gameId } = useParams();
  const [snapshotList, setSnapshotList] = useState<Snapshot[]>();
  const [achievements, setAchievements] = useState<GameAchievement[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, completionRate: 0 });
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

  //获取图集列表
  const fetchSnapshotList = async () => {
    if (gameId) {
      const snapshotList = await window.api.getGameSnapshot(parseInt(gameId));
      setSnapshotList(snapshotList);
    }
  };

  //获取成就列表
  const fetchAchievements = async () => {
    if (gameId) {
      const data = await window.api.getGameAchievements(parseInt(gameId));
      setAchievements(data);

      const statsData = await window.api.getAchievementStats(parseInt(gameId));
      setStats(statsData);
    }
  };

  useEffect(() => {
    fetchSnapshotList();
    fetchAchievements();
  }, [gameId]);

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

  // ==================== 成就相关功能 ====================

  //获取当前时长成就等级
  const getCurrentTimeLevel = () => {
    const timeAchievement = achievements.find((a) => a.achievement_type === '时长成就');
    if (!timeAchievement) return 0;

    const desc = timeAchievement.description || '';
    const match = desc.match(/(\d+)小时/);
    if (match) {
      const hours = parseInt(match[1]);
      const level = TIME_ACHIEVEMENTS.find((t) => t.hours === hours);
      return level?.level || 0;
    }
    return 0;
  };

  //升级时长成就
  const upgradeTimeAchievement = async () => {
    if (!gameId) return;

    const currentLevel = getCurrentTimeLevel();
    const nextLevel = currentLevel + 1;

    if (nextLevel > TIME_ACHIEVEMENTS.length) {
      alert('已达到最高等级!');
      return;
    }

    const nextAchievement = TIME_ACHIEVEMENTS[nextLevel - 1];

    try {
      // 如果是第一次,创建新成就
      if (currentLevel === 0) {
        await window.api.createAchievement(
          parseInt(gameId),
          nextAchievement.name,
          '时长成就',
          nextAchievement.description,
        );
      } else {
        // 否则更新现有成就
        const timeAchievement = achievements.find((a) => a.achievement_type === '时长成就');
        if (timeAchievement) {
          // 删除旧的
          await window.api.deleteAchievement(timeAchievement.id);
          // 创建新的
          await window.api.createAchievement(
            parseInt(gameId),
            nextAchievement.name,
            '时长成就',
            nextAchievement.description,
          );
        }
      }

      // 标记为完成
      const newList = await window.api.getGameAchievements(parseInt(gameId));
      const newTimeAchievement = newList.find((a) => a.achievement_type === '时长成就');
      if (newTimeAchievement) {
        await window.api.toggleAchievementStatus(newTimeAchievement.id, 1);
      }

      fetchAchievements();
    } catch (error) {
      console.error('升级时长成就失败:', error);
    }
  };

  //获取当前完成度成就等级
  const getCurrentCompletionLevel = () => {
    const completionAchievement = achievements.find((a) => a.achievement_type === '完成度成就');
    if (!completionAchievement) return 0;

    const desc = completionAchievement.description || '';
    const match = desc.match(/(\d+)%/);
    if (match) {
      const percent = parseInt(match[1]);
      const level = COMPLETION_ACHIEVEMENTS.find((c) => c.percent === percent);
      return level?.level || 0;
    }
    return 0;
  };

  //升级完成度成就
  const upgradeCompletionAchievement = async () => {
    if (!gameId) return;

    const currentLevel = getCurrentCompletionLevel();
    const nextLevel = currentLevel + 1;

    if (nextLevel > COMPLETION_ACHIEVEMENTS.length) {
      // alert('已达到最高等级!');
      toast.success('已达到最高等级!');
      return;
    }

    const nextAchievement = COMPLETION_ACHIEVEMENTS[nextLevel - 1];

    try {
      // 如果是第一次,创建新成就
      if (currentLevel === 0) {
        await window.api.createAchievement(
          parseInt(gameId),
          nextAchievement.name,
          '完成度成就',
          nextAchievement.description,
        );
      } else {
        // 否则更新现有成就
        const completionAchievement = achievements.find(
          (a) => a.achievement_type === '完成度成就',
        );
        if (completionAchievement) {
          // 删除旧的
          await window.api.deleteAchievement(completionAchievement.id);
          // 创建新的
          await window.api.createAchievement(
            parseInt(gameId),
            nextAchievement.name,
            '完成度成就',
            nextAchievement.description,
          );
        }
      }

      // 标记为完成
      const newList = await window.api.getGameAchievements(parseInt(gameId));
      const newCompletionAchievement = newList.find((a) => a.achievement_type === '完成度成就');
      if (newCompletionAchievement) {
        await window.api.toggleAchievementStatus(newCompletionAchievement.id, 1);
      }

      fetchAchievements();
    } catch (error) {
      console.error('升级完成度成就失败:', error);
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
      fetchAchievements();
    } catch (error) {
      console.error('添加成就失败:', error);
    }
  };

  //删除成就
  const handleDeleteAchievement = async (achievementId: number) => {
    if (confirm('确定要删除这个成就吗?')) {
      try {
        await window.api.deleteAchievement(achievementId);
        fetchAchievements();
      } catch (error) {
        console.error('删除成就失败:', error);
      }
    }
  };

  //切换成就完成状态
  const handleToggleAchievement = async (achievement: GameAchievement) => {
    try {
      const newStatus = achievement.is_completed === 0 ? 1 : 0;
      await window.api.toggleAchievementStatus(achievement.id, newStatus);
      fetchAchievements();
    } catch (error) {
      console.error('切换成就状态失败:', error);
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
      fetchSnapshotList();
    } catch (error) {
      console.error('保存ALT描述失败:', error);
      alert('保存失败');
    }
  };

  //删除ALT描述
  const handleDeleteAlt = async () => {
    if (!currentSnapshotId) return;

    if (confirm('确定要删除这个描述吗?')) {
      try {
        await window.api.deleteSnapshotAlt(currentSnapshotId);
        closeAltModal();
        fetchSnapshotList();
      } catch (error) {
        console.error('删除ALT描述失败:', error);
        alert('删除失败');
      }
    }
  };

  return (
    <div className="grid grid-cols-5 gap-4 p-4">
      {/* 第一行：数据展示和交互按钮区域 - 占据全部5列 */}
      <div className="col-span-5 rounded-lg bg-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            {/* 数据展示区域 */}
            <div className="flex flex-row gap-4 text-lg">
              <span>图片总数: {snapshotList?.length || 0}</span>
              <span>
                成就完成: {stats.completed}/{stats.total}
              </span>
              <span>完成率: {stats.completionRate.toFixed(1)}%</span>
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
            <button
              onClick={() => setShowAddModal(true)}
              className="rounded bg-green-500 px-4 py-2 text-white transition hover:bg-green-600"
            >
              <FaPlus className="mr-1 inline" />
              添加成就
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
        <PhotoProvider>
          <Masonry columnsCount={2} gutter="10px">
            {snapshotList?.map((i) => {
              return (
                <PhotoView key={i.id} src={`lop://` + i.relative_path.replace(/\\/g, '/')}>
                  <img src={`lop://` + i.relative_path.replace(/\\/g, '/')} alt="" className="" />
                </PhotoView>
              );
            })}
          </Masonry>
        </PhotoProvider>

        {/* 无图时默认展示 */}
        {snapshotList?.length === 0 && (
          <>
            <div className="mt-8 text-center text-gray-500">暂无图片</div>
            <div className="mt-8 text-center text-gray-500">快去游戏中记录精彩瞬间吧!</div>
          </>
        )}
      </div>
      {/* 第二行右侧：成就区域 - 封装为组件 */}
      <Achievements
        achievements={achievements}
        getCurrentTimeLevel={getCurrentTimeLevel}
        getCurrentCompletionLevel={getCurrentCompletionLevel}
        upgradeTimeAchievement={upgradeTimeAchievement}
        upgradeCompletionAchievement={upgradeCompletionAchievement}
        handleDeleteAchievement={handleDeleteAchievement}
        handleToggleAchievement={handleToggleAchievement}
      />

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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={closeAltModal}
        >
          <div
            className="w-full max-w-lg rounded-lg bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {isEditingAlt ? (
              /* 编辑模式 - 箴言展示风格 */
              <div className="relative">
                {/* 描述文本区域 - 箴言样式 */}
                <div className="border-l-4 border-amber-400 bg-gradient-to-r from-amber-50 to-white px-8 py-12">
                  <p className="text-center font-serif text-lg leading-relaxed text-gray-700 italic">
                    "{altText}"
                  </p>
                </div>

                {/* 底部操作区域 - 低调的图标按钮 */}
                <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-3">
                  <button
                    onClick={() => {
                      setIsEditingAlt(false);
                    }}
                    className="cursor-pointer text-sm text-gray-600 transition hover:text-blue-600 hover:underline"
                  >
                    编辑内容
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteAlt}
                      className="cursor-pointer text-sm text-gray-500 transition hover:text-red-600"
                      title="删除描述"
                    >
                      删除
                    </button>
                    <button
                      onClick={closeAltModal}
                      className="cursor-pointer text-sm text-gray-500 transition hover:text-gray-700"
                      title="关闭"
                    >
                      关闭
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* 添加/编辑输入模式 */
              <div className="p-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                  {altText ? '编辑描述' : '添加描述'}
                </h3>
                <textarea
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 font-serif focus:border-amber-400 focus:ring-2 focus:ring-amber-200 focus:outline-none"
                  rows={4}
                  placeholder="在此输入图片描述..."
                  autoFocus
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={closeAltModal}
                    className="cursor-pointer rounded px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-100"
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
                    className="cursor-pointer rounded bg-amber-500 px-4 py-2 text-sm text-white transition hover:bg-amber-600"
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
