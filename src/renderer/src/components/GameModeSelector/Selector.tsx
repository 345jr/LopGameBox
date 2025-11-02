import useGameStore from '@renderer/store/GameStore';
import { motion, Variants } from 'framer-motion';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef } from 'react';
import { FaHourglassEnd, FaGlasses, FaClock, FaFaceLaugh } from 'react-icons/fa6';
import toast from 'react-hot-toast';

const Selector = () => {
  //游戏模式选择器
  const gameModeSelector = useGameStore((state) => state.gameModeSelector);
  //设置游戏模式
  const setGameMode = useGameStore((state) => state.setGameMode);
  //游戏状态
  const gameState = useGameStore((state) => state.gameState);
  //当前游戏模式
  const gameMode = useGameStore((state) => state.gameMode);

  // 模式配置
  const modeConfig: { [key: string]: { borderColor: string; bgGradient: string; iconColor: string; textColor: string; icon: any } } = {
    Normal: { borderColor: '#16a34a', bgGradient: 'from-lime-50 to-green-50', iconColor: '#16a34a', textColor: '#22c55e', icon: FaFaceLaugh },
    Fast: { borderColor: '#d97706', bgGradient: 'from-orange-50 to-amber-50', iconColor: '#d97706', textColor: '#f59e0b', icon: FaHourglassEnd },
    Afk: { borderColor: '#06b6d4', bgGradient: 'from-blue-50 to-cyan-50', iconColor: '#06b6d4', textColor: '#0ea5e9', icon: FaClock },
    Infinity: { borderColor: '#ec4899', bgGradient: 'from-rose-50 to-pink-50', iconColor: '#ec4899', textColor: '#f43f5e', icon: FaGlasses },
  };

  //动画
  const container: Variants = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  const item: Variants = {
    initial: { x: -140 },
    animate: { x: 0, transition: { duration: 0.5 } },
  };

  const bgRefs = useRef<(HTMLDivElement | null)[]>([]);
  const borderRefs = useRef<(HTMLDivElement | null)[]>([]);
  const textRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);

  // GSAP 动画控制
  useGSAP(() => {
    modes.forEach((mode, index) => {
      const isSelected = gameMode === mode.key;
      const config = modeConfig[mode.key];
      const bgEl = bgRefs.current[index];
      const borderEl = borderRefs.current[index];
      const textEl = textRefs.current[index];
      const iconEl = iconRefs.current[index];

      if (bgEl && borderEl && textEl && iconEl) {
        if (isSelected) {
          // 选中动画
          gsap.to(bgEl, {
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out',
          });
          gsap.to(borderEl, {
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out',
          });
          gsap.to(textEl, {
            color: config.textColor,
            duration: 0.3,
            ease: 'power2.out',
          });
          gsap.to(iconEl, {
            color: config.iconColor,
            duration: 0.3,
            ease: 'power2.out',
          });
        } else {
          // 未选中动画
          gsap.to(bgEl, {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.out',
          });
          gsap.to(borderEl, {
            opacity: 0,
            duration: 0.3,
            ease: 'power2.out',
          });
          gsap.to(textEl, {
            color: '#374151',
            duration: 0.3,
            ease: 'power2.out',
          });
          gsap.to(iconEl, {
            color: '#374151',
            duration: 0.3,
            ease: 'power2.out',
          });
        }
      }
    });
  }, [gameMode]);

  const modes = [
    { key: 'Normal', label: '普通模式', rounded: 'rounded-tr-2xl' },
    { key: 'Fast', label: '快速模式', rounded: '' },
    { key: 'Afk', label: '挂机模式', rounded: '' },
    { key: 'Infinity', label: '沉浸模式', rounded: 'rounded-br-2xl' },
  ];

  //选择模式
  const selectMode = (mode: string, label: string) => {
    setGameMode(mode);
    toast.success(`模式切换为 ${label}`);
    //如果游戏真正运行 ，则视为热切换
    if (gameState === 'run') window.api.setGameMode(mode);
  };
  
  return (
    <>
      {/* 遮罩层防防点击 */}
      <motion.div
        className="z-0 flex flex-col"
        variants={container}
        initial="initial"
        animate={gameModeSelector ? 'animate' : 'initial'}
      >
        {modes.map((mode, index) => {
          const config = modeConfig[mode.key];

          return (
            <motion.div key={mode.key} variants={item}>
              <div className={`flex-1 border border-gray-300 shadow-md ${mode.rounded} relative overflow-hidden bg-white`}>
                {/* 背景渐变层 */}
                <div
                  ref={(el) => { if (el) bgRefs.current[index] = el; }}
                  className={`absolute inset-0 pointer-events-none bg-gradient-to-r ${config.bgGradient}`}
                  style={{ opacity: 0 }}
                />
                {/* 左边框高亮 */}
                <div
                  ref={(el) => { if (el) borderRefs.current[index] = el; }}
                  className="absolute inset-y-0 left-0 w-1 pointer-events-none"
                  style={{ backgroundColor: config.borderColor, opacity: 0 }}
                />
                <button
                  onClick={() => selectMode(mode.key, mode.label)}
                  className={`flex cursor-pointer flex-row w-full px-2.5 relative z-10 ${
                    mode.key === 'Normal' ? 'py-5' : 'py-7'
                  }`}
                >
                  <p ref={(el) => { if (el) textRefs.current[index] = el; }} className="ml-5 font-medium text-gray-700">
                    {mode.label}
                  </p>
                  <div ref={(el) => { if (el) iconRefs.current[index] = el; }} className="ml-2 text-3xl text-gray-700">
                    {config.icon === FaFaceLaugh && <FaFaceLaugh />}
                    {config.icon === FaHourglassEnd && <FaHourglassEnd />}
                    {config.icon === FaClock && <FaClock />}
                    {config.icon === FaGlasses && <FaGlasses />}
                  </div>
                </button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </>
  );
};

export default Selector;
