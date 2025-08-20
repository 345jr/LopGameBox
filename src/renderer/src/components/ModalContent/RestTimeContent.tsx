import useGameStore from '@renderer/store/GameStore';
import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import { formatTimeToMinutes } from '@renderer/util/timeFormat';
export function RestTimeContent({ onClose }: { onClose: () => void }) {
  //#region 状态管理
  const gameMode = useGameStore((state) => state.gameMode);
  const [restTime, setRestTime] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  //文本动画
  const context = useRef(null);
  //按钮动画
  const btn = useRef(null);
  //设置游戏模式
  const setGameMode = useGameStore((state) => state.setGameMode);
  //#endregion
  //开始休息
  const startRest = () => {
    // 防止多次点击创建多个定时器
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setRestTime((prev) => prev + 1);
    }, 1000);
    setIsResting(true); // 设置为休息状态
    window.api.setResting(true);
  };
  //结束休息清理定时器
  const endRest = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsResting(false); // 重置休息状态
    window.api.setResting(false);
    onClose();
  };
  //不休息，进入沉浸模式
  const skipRest = async () => {
    //切换模式+关闭窗口+脱离休息期
    await window.api.setResting(false);
    await window.api.setGameMode('Infinity'); 
    setGameMode('Infinity');       
    onClose();
  }
  //#region GSAP动画
  //4段小文本
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
          '-=0.5',
        )
        .from(
          '.GSAPanimate-p3',
          {
            opacity: 0,
            x: -100,
            duration: 0.8,
            ease: 'power2.out',
          },
          '-=0.5',
        )
        .from(
          '.GSAPanimate-p4',
          {
            opacity: 0,
            x: 100,
            duration: 0.8,
            ease: 'power2.out',
          },
          '-=0.5',
        );
    },
    { scope: context },
  );
  //按钮入场动画
  useGSAP(
    () => {
      //由gsap接管背景色
      const startRestBtn = document.querySelector('.GSAPanimate-btnStartRest');
      const endRestBtn = document.querySelector('.GSAPanimate-btnEndRest');
      const skipRestBtn = document.querySelector('.GSAPanimate-btnSkipRest');
      
      if (startRestBtn) gsap.set('.GSAPanimate-btnStartRest', { backgroundColor: '#22c55e' });
      if (endRestBtn) gsap.set('.GSAPanimate-btnEndRest', { backgroundColor: '#ef4444' });
      if (skipRestBtn) gsap.set('.GSAPanimate-btnSkipRest', { backgroundColor: '#a855f7' });
      
      const timeline = gsap.timeline();
      
      if (startRestBtn) {
        timeline.from('.GSAPanimate-btnStartRest', {
          opacity: 0,
          y: 20,
          duration: 0.8,
          ease: 'power2.out',
        });
      }
      
      if (endRestBtn) {
        timeline.from(
          '.GSAPanimate-btnEndRest',
          {
            opacity: 0,
            y: 20,
            duration: 0.8,
            ease: 'power2.out',
          },
          '-=0.5',
        );
      }
      
      if (skipRestBtn) {
        timeline.from(
          '.GSAPanimate-btnSkipRest',
          {
            opacity: 0,
            y: 20,
            duration: 0.8,
            ease: 'power2.out',
          },
          '-=0.5',
        );
      }
    },
    { scope: btn, dependencies: [isResting] }
  );
  const handleOnMouseDown = (btnClassName: string) => {
    gsap.to(`.${btnClassName}`, {
      y: 4,
      duration: 0.1,
    });
  };
  const handleOnMouseUp = (btnClassName: string) => {
    gsap.to(`.${btnClassName}`, {
      y: 0,
      duration: 0.2,
    });
  };
  const handleOnMouseEnter = (btnClassName: string, color: string) => {
    gsap.to(`.${btnClassName}`, {
      backgroundColor: color,
      duration: 0.3,
    });
  };
  const handleOnMouseLeave = (btnClassName: string, color: string) => {
    gsap.to(`.${btnClassName}`, {
      backgroundColor: color,
      duration: 0.3,
    });
  };
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
          <p className="GSAPanimate-p1 text-2xl font-semibold text-gray-800">休息时间到了!</p>
          <p className="GSAPanimate-p2">当前模式: {modeMap[gameMode]}</p>

          <p className="GSAPanimate-p3">等会再来玩呦~</p>
          <p className="GSAPanimate-p4">当前休息时长: {formatTimeToMinutes(restTime)}分钟</p>
          <div ref={btn}>
            {!isResting && (
              <button
                onClick={startRest}
                onMouseDown={() => handleOnMouseDown('GSAPanimate-btnStartRest')}
                onMouseUp={() => handleOnMouseUp('GSAPanimate-btnStartRest')}
                onMouseEnter={() => handleOnMouseEnter('GSAPanimate-btnStartRest', '#16a34a')}
                onMouseLeave={() => handleOnMouseLeave('GSAPanimate-btnStartRest', '#22c55e')}
                className="GSAPanimate-btnStartRest mt-4 mr-4 rounded px-4 py-2 text-white"
              >
                开始休息
              </button>
            )}
            {/* 只有在开始休息后才显示结束休息按钮 */}
            {isResting && (
              <button
                onClick={endRest}
                onMouseDown={() => handleOnMouseDown('GSAPanimate-btnEndRest')}
                onMouseUp={() => handleOnMouseUp('GSAPanimate-btnEndRest')}
                onMouseEnter={() => handleOnMouseEnter('GSAPanimate-btnEndRest', '#dc2626')}
                onMouseLeave={() => handleOnMouseLeave('GSAPanimate-btnEndRest', '#ef4444')}
                className="GSAPanimate-btnEndRest mt-4 mr-4 rounded px-4 py-2 text-white"
              >
                结束休息
              </button>
            )}
            {/* 只有在未开始休息时才显示跳过休息按钮 */}
            {!isResting && (
              <button
                onClick={skipRest}
                onMouseDown={() => handleOnMouseDown('GSAPanimate-btnSkipRest')}
                onMouseUp={() => handleOnMouseUp('GSAPanimate-btnSkipRest')}
                onMouseEnter={() => handleOnMouseEnter('GSAPanimate-btnSkipRest', '#9333ea')}
                onMouseLeave={() => handleOnMouseLeave('GSAPanimate-btnSkipRest', '#a855f7')}
                className="GSAPanimate-btnSkipRest mt-4 rounded px-4 py-2 text-white"
              >
                跳过休息
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
