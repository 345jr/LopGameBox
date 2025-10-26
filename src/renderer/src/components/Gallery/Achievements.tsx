import React from 'react';
import { FaCheck, FaRegCircleXmark } from 'react-icons/fa6';
import {formatTimeCalender} from '../../util/timeFormat';

type Achievement = any;

type Props = {
  achievements: Achievement[];
  getCurrentTimeLevel: () => number;
  getCurrentCompletionLevel: () => number;
  upgradeTimeAchievement: () => Promise<void> | void;
  upgradeCompletionAchievement: () => Promise<void> | void;
  handleDeleteAchievement: (id: number) => Promise<void> | void;
  handleToggleAchievement: (achievement: Achievement) => Promise<void> | void;
};

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

const Achievements: React.FC<Props> = ({
  achievements,
  getCurrentTimeLevel,
  getCurrentCompletionLevel,
  upgradeTimeAchievement,
  upgradeCompletionAchievement,
  handleDeleteAchievement,
  handleToggleAchievement,
}) => {
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
              完成于: {formatTimeCalender(achievements.find((a) => a.achievement_type === '时长成就')?.completed_at || null)}
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
              完成于: {formatTimeCalender(achievements.find((a) => a.achievement_type === '完成度成就')?.completed_at || null)}
            </span>
          )}
        </div>
      </div>

      {/* 自定义成就列表 */}
      <div className="max-h-[500px] space-y-2 overflow-y-auto">
        {achievements
          .filter((a) => a.achievement_type !== '时长成就' && a.achievement_type !== '完成度成就')
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

        {achievements.filter((a) => a.achievement_type !== '时长成就' && a.achievement_type !== '完成度成就').length === 0 && (
          <div className="rounded-lg bg-white p-4 text-center text-gray-400">暂无自定义成就,点击上方按钮添加</div>
        )}
      </div>
    </div>
  );
};

export default Achievements;
