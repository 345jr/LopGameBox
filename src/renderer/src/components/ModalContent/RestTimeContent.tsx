import useGameStore from '@renderer/store/GameStore';
import { useRef, useState } from 'react';

import { formatTimeToMinutes } from '@renderer/util/timeFormat';
export function RestTimeContent({ onClose }: { onClose: () => void }) {
  const gameMode = useGameStore((state) => state.gameMode);
  const [restTime, setRestTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  //开始休息
  const startRest = () => {
    // 防止多次点击创建多个定时器
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setRestTime((prev) => prev + 1);
    }, 1000);
  };
  //结束休息清理定时器
  const endRest = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    // 遮罩层
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800/30">
      {/* 模态框主体 */}
      <div
        className="mx-4 w-full max-w-150 rounded-lg bg-white p-6 shadow-xl"
        // 阻止点击内容时关闭
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-1 text-2xl font-semibold text-gray-800">
          休息时间到了!
        </p>
        <p>当前的模式是: {gameMode}</p>
        <p>等会再来玩呦~</p>
        <p>当前休息时长: {formatTimeToMinutes(restTime)}分钟</p>
        <p>当前休息时长:{restTime}</p>
        <div>
          <button
            onClick={() => {
              startRest();
              window.api.setResting(true);
            }}
            className="mt-4 mr-4 rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
          >
            开始休息
          </button>
          <button
            onClick={() => {
              endRest();
              window.api.setResting(false);
              onClose();
            }}
            className="mt-4 rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            结束休息
          </button>
        </div>
      </div>
    </div>
  );
}
