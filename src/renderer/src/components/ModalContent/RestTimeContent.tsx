import useGameStore from '@renderer/store/GameStore';
import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import { formatTimeToMinutes } from '@renderer/util/timeFormat';
export function RestTimeContent({ onClose }: { onClose: () => void }) {
  const gameMode = useGameStore((state) => state.gameMode);
  const [restTime, setRestTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const context = useRef(null);

  //开始休息
  const startRest = () => {
    // 防止多次点击创建多个定时器
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setRestTime((prev) => prev + 1);
    }, 1000);
    window.api.setResting(true);
  };
  //结束休息清理定时器
  const endRest = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    window.api.setResting(false);
    onClose();
  };
  //#region GSAP动画
  useGSAP(
  () => {
    const timeline = gsap.timeline();
    timeline
      .from('.GSAPanimate-p1', {
        opacity: 0,
        x: -100,
        duration: 0.8,
        ease: 'power2.out',
      })
      .from(
        '.GSAPanimate-p2',
        {
          opacity: 0,
          x: 100,
          duration: 0.8,
          ease: 'power2.out',
        },
        '-=0.5'
      )
      .from(
        '.GSAPanimate-p3',
        {
          opacity: 0,
          x: -100,
          duration: 0.8,
          ease: 'power2.out',
        },
        '-=0.5'
      )
      .from(
        '.GSAPanimate-p4',
        {
          opacity: 0,
          x: 100,
          duration: 0.8,
          ease: 'power2.out',
        },
        '-=0.5'
      );
  },
  { scope: context }
);
  //#endregion
  //模式中文映射
  const modeMap: Record<string, string> = {
    Normal: '普通模式',
    Fast: '快速模式',
    Afk: '挂机模式',
    Test: '测试',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800/30">
      {/* 模态框主体 */}
      <div
        className="mx-4 w-full max-w-150 rounded-lg bg-white p-6 shadow-xl"
        // 阻止点击内容时关闭
        onClick={(e) => e.stopPropagation()}
      >
        <div ref={context} className="flex flex-col items-center">
          <p className="GSAPanimate-p1 text-2xl font-semibold text-gray-800">
            休息时间到了!
          </p>
          <p className="GSAPanimate-p2">当前模式: {modeMap[gameMode]}</p>

          <p className="GSAPanimate-p3">等会再来玩呦~</p>
          <p className="GSAPanimate-p4">
            当前休息时长: {formatTimeToMinutes(restTime)}分钟
          </p>
          <div>
            <button
              onClick={startRest}
              onMouseDown={() =>
                gsap.to('.GSAPanimate-btnStartRest', {
                  y: 4,
                  scale: 0.95,
                  duration: 0.1,
                })
              }
              onMouseUp={() =>
                gsap.to('.GSAPanimate-btnStartRest', {
                  y: 0,
                  scale: 1,
                  duration: 0.2,
                })
              }
              onMouseEnter={() =>
                gsap.to('.GSAPanimate-btnStartRest', {
                  backgroundColor: '#16a34a',
                  duration: 0.3,
                })
              }
              onMouseLeave={() =>
                gsap.to('.GSAPanimate-btnStartRest', {
                  backgroundColor: '#22c55e',
                  duration: 0.3,
                })
              }
              className="GSAPanimate-btnStartRest mt-4 mr-4 rounded bg-green-500 px-4 py-2 text-white"
            >
              开始休息
            </button>
            <button
              onClick={endRest}
              onMouseDown={() =>
                gsap.to('.GSAPanimate-btnEndRest', {
                  y: 4,
                  scale: 0.95,
                  duration: 0.1,
                })
              }
              onMouseUp={() =>
                gsap.to('.GSAPanimate-btnEndRest', {
                  y: 0,
                  scale: 1,
                  duration: 0.2,
                })
              }
              onMouseEnter={() =>
                gsap.to('.GSAPanimate-btnEndRest', {
                  backgroundColor: '#dc2626',
                  duration: 0.3,
                })
              }
              onMouseLeave={() =>
                gsap.to('.GSAPanimate-btnEndRest', {
                  backgroundColor: '#ef4444',
                  duration: 0.3,
                })
              }
              className="GSAPanimate-btnEndRest mt-4 rounded bg-red-500 px-4 py-2 text-white"
            >
              结束休息
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
