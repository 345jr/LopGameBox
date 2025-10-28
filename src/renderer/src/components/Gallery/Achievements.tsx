import React from 'react';
import { FaCheck, FaRegCircleXmark } from 'react-icons/fa6';
import {formatTimeCalender} from '../../util/timeFormat';
import { useAchievementList } from '@renderer/api/queries/queries.gallery';
import { useParams } from 'react-router-dom';

import { GameAchievement } from '@renderer/types/Game';
import toast from 'react-hot-toast';

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

const Achievements: React.FC = () => {
  const { gameId } = useParams();
  const gameIdNum = parseInt(gameId as string);
  const { data: achievementsData, isPending } = useAchievementList(gameIdNum);

  //获取当前时长成就等级
  const getCurrentTimeLevel = () => {
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
        const timeAchievement = achievementsData?.find((a) => a.achievement_type === '时长成就');
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

      // fetchAchievements();
    } catch (error) {
      console.error('升级时长成就失败:', error);
    }
  };

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
    const nextLevel = currentLevel + 1;

    if (nextLevel > COMPLETION_ACHIEVEMENTS.length) {
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

      // fetchAchievements();
    } catch (error) {
      console.error('升级完成度成就失败:', error);
    }
  };

  

  //删除成就
  const handleDeleteAchievement = async (achievementId: number) => {
    if (confirm('确定要删除这个成就吗?')) {
      try {
        await window.api.deleteAchievement(achievementId);
        // fetchAchievements();
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
      // fetchAchievements();
    } catch (error) {
      console.error('切换成就状态失败:', error);
    }
  };

  if (isPending) return <div>加载中...</div>;
  if (!achievementsData) return <div>暂无数据</div>;

  return (
    <div className="col-span-2 rounded-lg bg-gray-100 p-4">
      <h2 className="mb-4 flex justify-center items-center text-xl font-bold">成就书</h2>

      {/* 时长成就 */}
      <div className="mb-4 rounded-lg bg-white p-3 shadow">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-600">时长成就</span>
            <span className="font-semibold">
              {TIME_ACHIEVEMENTS[getCurrentTimeLevel()]?.name || TIME_ACHIEVEMENTS[0].name}
            </span>
          </div>
          <span className="text-xs text-gray-500">Lv.{getCurrentTimeLevel() + 1}/{TIME_ACHIEVEMENTS.length}</span>
        </div>
        <p className="mb-2 text-sm text-gray-600">
          {TIME_ACHIEVEMENTS[getCurrentTimeLevel()]?.description || TIME_ACHIEVEMENTS[0].description}
        </p>
        <div className="flex items-center justify-between">
          {getCurrentTimeLevel() < TIME_ACHIEVEMENTS.length ? (
            <button
              onClick={upgradeTimeAchievement}
              className="rounded bg-purple-500 px-3 py-1 text-sm text-white transition hover:bg-purple-600"
            >
              {getCurrentTimeLevel() === 0 ? '开始' : '升级'}
            </button>
          ) : (
            <span className="flex items-center text-sm text-green-600">
              <FaCheck className="mr-1" />已达到最高等级
            </span>
          )}
          {getCurrentTimeLevel() > 0 && (
            <span className="text-xs text-gray-500">
              完成于: {formatTimeCalender(achievementsData.find((a) => a.achievement_type === '时长成就')?.completed_at || null)}
            </span>
          )}
        </div>
      </div>

      {/* 完成度成就 */}
      <div className="mb-4 rounded-lg bg-white p-3 shadow">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded bg-cyan-100 px-2 py-1 text-xs text-cyan-600">完成度成就</span>
            <span className="font-semibold">
              {COMPLETION_ACHIEVEMENTS[getCurrentCompletionLevel()]?.name || COMPLETION_ACHIEVEMENTS[0].name}
            </span>
          </div>
          <span className="text-xs text-gray-500">Lv.{getCurrentCompletionLevel() + 1}/{COMPLETION_ACHIEVEMENTS.length}</span>
        </div>
        <p className="mb-2 text-sm text-gray-600">
          {COMPLETION_ACHIEVEMENTS[getCurrentCompletionLevel()]?.description || COMPLETION_ACHIEVEMENTS[0].description}
        </p>
        <div className="flex items-center justify-between">
          {getCurrentCompletionLevel() < COMPLETION_ACHIEVEMENTS.length ? (
            <button
              onClick={upgradeCompletionAchievement}
              className="rounded bg-cyan-500 px-3 py-1 text-sm text-white transition hover:bg-cyan-600"
            >
              {getCurrentCompletionLevel() === 0 ? '开始' : '升级'}
            </button>
          ) : (
            <span className="flex items-center text-sm text-green-600">
              <FaCheck className="mr-1" />已达到最高等级
            </span>
          )}
          {getCurrentCompletionLevel() > 0 && (
            <span className="text-xs text-gray-500">
              完成于: {formatTimeCalender(achievementsData?.find((a) => a.achievement_type === '完成度成就')?.completed_at || null)}
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
              className={`rounded-lg bg-white p-3 shadow ${achievement.is_completed ? 'border-l-4 border-green-500' : ''}`}
            >
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-600">{achievement.achievement_type}</span>
                  <span className="font-semibold">{achievement.achievement_name}</span>
                </div>
                <button onClick={() => handleDeleteAchievement(achievement.id)} className="text-red-500 transition hover:text-red-700">
                  <FaRegCircleXmark />
                </button>
              </div>
              {achievement.description && <p className="mb-2 text-sm text-gray-600">{achievement.description}</p>}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleToggleAchievement(achievement)}
                  className={`rounded px-3 py-1 text-sm text-white transition ${
                    achievement.is_completed ? 'bg-gray-400 hover:bg-gray-500' : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {achievement.is_completed ? '取消完成' : '标记完成'}
                </button>
                {achievement.is_completed && <span className="text-xs text-gray-500">完成于: {formatTimeCalender(achievement.completed_at)}</span>}
              </div>
            </div>
          ))}

        {achievementsData?.filter((a) => a.achievement_type !== '时长成就' && a.achievement_type !== '完成度成就').length === 0 && (
          <div className="rounded-lg bg-white p-4 text-center text-gray-400">暂无自定义成就,点击上方按钮添加</div>
        )}
      </div>
    </div>
  );
};

export default Achievements;
