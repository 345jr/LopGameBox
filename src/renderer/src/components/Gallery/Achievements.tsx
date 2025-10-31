import React from 'react';
import { FaCheck, FaRegCircleXmark, FaPlus } from 'react-icons/fa6';
import {formatTimeCalender} from '../../util/timeFormat';
import { useAchievementList, useGamePlaytime } from '@renderer/api/queries/queries.gallery';
import { useParams } from 'react-router-dom';
import { GameAchievement } from '@renderer/types/Game';
import toast from 'react-hot-toast';

// 时长成就等级配置
const TIME_ACHIEVEMENTS = [
  { level: 1, hours: 2, name: '初次体验', description: '游玩时长达到2小时' },
  { level: 2, hours: 5, name: '', description: '游玩时长达到5小时' },
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

const Achievements: React.FC = () => {
  const { gameId } = useParams();
  const gameIdNum = parseInt(gameId as string);
  const { data: achievementsData, isPending , refetch: refetchAchievements } = useAchievementList(gameIdNum);
  const { data:gameTime } = useGamePlaytime(gameIdNum);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [newAchievement, setNewAchievement] = React.useState({
    name: '',
    type: '自定义成就',
    description: '',
  });

  // 获取已存储（数据库中的）时长成就等级（0 表示未获得）
  const getStoredTimeLevel = () => {
    const timeAchievement = achievementsData?.find((a) => a.achievement_type === '时长成就');
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

  // 根据游玩时长自动同步“时长成就”，仅在需要升级时执行
  React.useEffect(() => {
    if (!gameIdNum || gameTime == null || !achievementsData) return;

    const gameTimeHours = gameTime / 3600;
    // achievedLevel: 已达成的等级数量（0..N）
    const idx = TIME_ACHIEVEMENTS.findIndex((a) => gameTimeHours < a.hours);
    const achievedLevel = idx === -1 ? TIME_ACHIEVEMENTS.length : idx; // 1-based 等级数量

    const storedLevel = getStoredTimeLevel();

    if (achievedLevel > 0 && storedLevel < achievedLevel) {
      (async () => {
        const achievement = TIME_ACHIEVEMENTS[achievedLevel - 1];
        const timeAch = achievementsData.find((a) => a.achievement_type === '时长成就');

        // 简单策略：删除旧记录，创建新等级记录，并标记完成
        if (timeAch) await window.api.deleteAchievement(timeAch.id);

        await window.api.createAchievement(
          gameIdNum,
          achievement.name,
          '时长成就',
          achievement.description,
        );
        const newList = await window.api.getGameAchievements(gameIdNum);
        const newAch = newList.find((a) => a.achievement_type === '时长成就');
        if (newAch) await window.api.toggleAchievementStatus(newAch.id, 1);

        await refetchAchievements();
      })();
    }
  }, [gameIdNum, gameTime, achievementsData, refetchAchievements]);

  //获取当前完成度成就等级
  const getCurrentCompletionLevel = () => {
    const completionAchievement = achievementsData?.find((a) => a.achievement_type === '完成度成就');
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
    
    // 如果已经到达最高等级，直接返回
    if (currentLevel >= COMPLETION_ACHIEVEMENTS.length) {
      toast.success('已达到最高等级!');
      return;
    }

    const nextLevel = currentLevel + 1;
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
        const completionAchievement = achievementsData?.find(
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
      toast.success('完成度成就已完成');
      await refetchAchievements();
    } catch (error) {
      console.error('升级完成度成就失败:', error);
      toast.error('操作失败');
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
      toast.success('成就添加成功');
      // 刷新成就列表
      await refetchAchievements();
    } catch (error) {
      console.error('添加成就失败:', error);
      toast.error('添加成就失败');
    }
  };

  //删除成就
  const handleDeleteAchievement = async (achievementId: number) => {
    if (confirm('确定要删除这个成就吗?')) {
      try {
        await window.api.deleteAchievement(achievementId);
        toast.success('成就已删除');
        await refetchAchievements();
      } catch (error) {
        console.error('删除成就失败:', error);
        toast.error('删除成就失败');
      }
    }
  };

  //切换成就完成状态
  const handleToggleAchievement = async (achievement: GameAchievement) => {
    try {
      const newStatus = achievement.is_completed === 0 ? 1 : 0;
      await window.api.toggleAchievementStatus(achievement.id, newStatus);
      toast.success(newStatus === 1 ? '已标记完成' : '已取消完成');
      await refetchAchievements();
    } catch (error) {
      console.error('切换成就状态失败:', error);
      toast.error('操作失败');
    }
  };

  if (isPending) return <div>加载中...</div>;
  if (!achievementsData) return <div>暂无数据</div>;

  // 渲染前的派生数据
  const storedTimeLevel = getStoredTimeLevel(); // 0..N（与 TIME_ACHIEVEMENTS 的 level 对齐）
  const playHours = Math.floor((gameTime || 0) / 3600);
  const nextTimeIdx = TIME_ACHIEVEMENTS.findIndex((a) => playHours < a.hours); // -1 表示已满级

  const completionLevel = (() => {
    const completionAchievement = achievementsData?.find((a) => a.achievement_type === '完成度成就');
    if (!completionAchievement) return 0;
    const desc = completionAchievement.description || '';
    const match = desc.match(/(\d+)%/);
    if (match) {
      const percent = parseInt(match[1]);
      const level = COMPLETION_ACHIEVEMENTS.find((c) => c.percent === percent);
      return level?.level || 0;
    }
    return 0;
  })();

  return (
    <div className="col-span-2 rounded-lg bg-white">
      <div className="mb-4 flex items-center justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex cursor-pointer items-center gap-2 rounded border border-gray-300 bg-black px-3 py-1 text-sm text-white "
        >
          <FaPlus className="inline text-sm" />
          <span>添加成就</span>
        </button>
      </div>
      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 shadow">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">时长成就</span>
            <span className="font-semibold text-black">
              {TIME_ACHIEVEMENTS[Math.max(storedTimeLevel, 1) - 1]?.name || TIME_ACHIEVEMENTS[0].name}
            </span>
          </div>
          <span className="text-xs text-gray-500">Lv.{storedTimeLevel}/{TIME_ACHIEVEMENTS.length}</span>
        </div>
        <p className="mb-2 text-sm text-gray-700">
          {TIME_ACHIEVEMENTS[Math.max(storedTimeLevel, 1) - 1]?.description || TIME_ACHIEVEMENTS[0].description}
        </p>
        <div className="flex items-center justify-between">
          {nextTimeIdx !== -1 ? (
            <span className="text-xs text-gray-500">还需 {TIME_ACHIEVEMENTS[nextTimeIdx].hours - playHours} 小时即可达成下一阶段</span>
          ) : (
            <span className="text-xs text-gray-500">
              <FaCheck className="mr-1 inline" />
              已完成全部阶段
            </span>
          )}
          {storedTimeLevel > 0 && (
            <span className="text-xs text-gray-500">
              完成于:{' '}
              {formatTimeCalender(
                achievementsData.find((a) => a.achievement_type === '时长成就')?.completed_at ||
                  null,
              )}
            </span>
          )}
        </div>
      </div>

      {/* 完成度成就 */}
      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 shadow">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">完成度成就</span>
            <span className="font-semibold text-black">
              {/* 成就名 */}
              {COMPLETION_ACHIEVEMENTS[Math.max(completionLevel, 1) - 1]?.name}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {/* 成就等级 */}
            Lv.{completionLevel}/{COMPLETION_ACHIEVEMENTS.length}
          </span>
        </div>
        <p className="mb-2 text-sm text-gray-700">
          {/* 成就描述 */}
          {COMPLETION_ACHIEVEMENTS[Math.max(completionLevel, 1) - 1]?.description}
        </p>
        <div className="flex items-center justify-between">
          {getCurrentCompletionLevel() < COMPLETION_ACHIEVEMENTS.length ? (
            <button
              onClick={upgradeCompletionAchievement}
              className="rounded bg-gray-800 px-3 py-1 text-sm text-white transition hover:bg-black"
            >
              完成
            </button>
          ) : (
            <span className="text-xs text-gray-500">
              <FaCheck className="mr-1 inline" />
              已完成全部阶段
            </span>
          )}
          {getCurrentCompletionLevel() > 0 && (
            <span className="text-xs text-gray-500">
              完成于:{' '}
              {formatTimeCalender(
                achievementsData?.find((a) => a.achievement_type === '完成度成就')?.completed_at ||
                  null,
              )}
            </span>
          )}
        </div>
      </div>

      {/* 自定义成就列表 */}
      <div className="max-h-[500px] space-y-2 overflow-y-auto">
        {achievementsData
          ?.filter((a) => a.achievement_type !== '时长成就' && a.achievement_type !== '完成度成就')
          .map((achievement) => (
            <div
              key={achievement.id}
              className={`rounded-lg border bg-white p-3 shadow ${achievement.is_completed ? 'border-l-4 border-gray-400' : 'border-gray-200'}`}
            >
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                    {achievement.achievement_type}
                  </span>
                  <span className="font-semibold text-black">{achievement.achievement_name}</span>
                </div>
                <button
                  onClick={() => handleDeleteAchievement(achievement.id)}
                  className="text-gray-400 transition hover:text-gray-600"
                >
                  <FaRegCircleXmark />
                </button>
              </div>
              {achievement.description && (
                <p className="mb-2 text-sm text-gray-700">{achievement.description}</p>
              )}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleToggleAchievement(achievement)}
                  className={`rounded px-3 py-1 text-sm text-white transition ${
                    achievement.is_completed
                      ? 'bg-gray-400 hover:bg-gray-500'
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                >
                  {achievement.is_completed ? '取消完成' : '标记完成'}
                </button>
                {achievement.is_completed && (
                  <span className="text-xs text-gray-500">
                    完成于: {formatTimeCalender(achievement.completed_at)}
                  </span>
                )}
              </div>
            </div>
          ))}

        {achievementsData?.filter(
          (a) => a.achievement_type !== '时长成就' && a.achievement_type !== '完成度成就',
        ).length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-center text-gray-400">
            暂无自定义成就,点击上方按钮添加
          </div>
        )}
      </div>

      {/* 添加成就模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold text-black">添加成就</h3>
            <input
              type="text"
              placeholder="成就名称"
              value={newAchievement.name}
              onChange={(e) => setNewAchievement({ ...newAchievement, name: e.target.value })}
              className="mb-3 w-full rounded border border-gray-300 px-3 py-2 text-black placeholder-gray-400 focus:ring-2 focus:ring-gray-400 focus:outline-none"
            />
            <select
              value={newAchievement.type}
              onChange={(e) => setNewAchievement({ ...newAchievement, type: e.target.value })}
              className="mb-3 w-full rounded border border-gray-300 px-3 py-2 text-black focus:ring-2 focus:ring-gray-400 focus:outline-none"
            >
              <option value="自定义成就">自定义成就</option>
              <option value="隐藏成就">隐藏成就</option>
              <option value="特殊成就">特殊成就</option>
            </select>
            <textarea
              placeholder="成就描述（可选）"
              value={newAchievement.description}
              onChange={(e) =>
                setNewAchievement({ ...newAchievement, description: e.target.value })
              }
              className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-black placeholder-gray-400 focus:ring-2 focus:ring-gray-400 focus:outline-none"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewAchievement({ name: '', type: '自定义成就', description: '' });
                }}
                className="rounded bg-gray-200 px-4 py-2 text-black transition hover:bg-gray-300"
              >
                取消
              </button>
              <button
                onClick={handleAddAchievement}
                className="rounded bg-gray-800 px-4 py-2 text-white transition hover:bg-black"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Achievements;
