import { Dispatch, SetStateAction } from 'react';

type Achievement = {
  name: string;
  type: string;
  description: string;
};

type Props = {
  show: boolean;
  newAchievement: Achievement;
  setNewAchievement: Dispatch<SetStateAction<Achievement>>;
  onAdd: () => Promise<void> | void;
  onClose: () => void;
};

const AddAchievementModal = ({ show, newAchievement, setNewAchievement, onAdd, onClose }: Props) => {
  if (!show) return null;

  return (
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
              onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
              className="w-full rounded border px-3 py-2"
              rows={3}
              placeholder="描述这个成就..."
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={onAdd}
              className="flex-1 rounded bg-green-500 px-4 py-2 text-white transition hover:bg-green-600"
            >
              添加
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded bg-gray-500 px-4 py-2 text-white transition hover:bg-gray-600"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAchievementModal;
