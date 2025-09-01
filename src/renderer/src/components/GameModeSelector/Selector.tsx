import useGameStore from '@renderer/store/GameStore';
import { motion, Variants } from 'framer-motion';
import { FaHourglassEnd, FaGlasses, FaClock, FaFaceLaugh } from 'react-icons/fa6';

const Selector = () => {
  //游戏模式选择器
  const gameModeSelector = useGameStore((state) => state.gameModeSelector);
  //设置游戏模式
  const setGameMode = useGameStore((state) => state.setGameMode);
  //游戏状态
  const gameState = useGameStore((state) => state.gameState);
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
  //选择模式
  const selectMode = (mode: string) => {
    console.log(`要切换的模式是${mode}`);
    setGameMode(mode);
    //如果游戏真正运行 ，则视为热切换
    if (gameState === 'run') window.api.setGameMode(mode);
  };
  //进入休息状态
  const enterRestMode = () => {
    window.api.setResting(true);
  };

  return (
    <>
      {/* 遮罩层防防点击 */}
      {/* {gameModeSelector?null:<div className="absolute top-0 left-0 z-10 h-120 w-20 bg-red-500/50 opacity-0" />} */}
      <motion.div
        className="z-0 flex flex-col"
        variants={container}
        initial="initial"
        animate={gameModeSelector ? 'animate' : 'initial'}
      >
        {/* 普通模式 */}
        <motion.div variants={item}>
          <div className="flex-1 rounded-tr-2xl border border-gray-300 bg-white px-2.5 py-5 shadow-md">
            <button
              onClick={() => selectMode('Normal')}
              className="flex cursor-pointer flex-row items-center justify-center"
            >
              <p className="ml-5">普通模式</p>
              <FaFaceLaugh className="ml-2 text-3xl text-gray-700" />
            </button>
          </div>
        </motion.div>
        {/* 快速模式 */}
        <motion.div variants={item}>
          <div className="flex-1 border border-gray-300 bg-white px-2.5 py-5 shadow-md">
            <button onClick={() => selectMode('Fast')} className="flex cursor-pointer flex-row">
              <p className="ml-5">快速模式</p>
              <FaHourglassEnd className="ml-2 text-3xl text-gray-700" />
            </button>
          </div>
        </motion.div>
        {/* AFK模式 */}
        <motion.div variants={item}>
          <div className="flex-1 border border-gray-300 bg-white px-2.5 py-7 shadow-md">
            <button onClick={() => selectMode('Afk')} className="flex cursor-pointer flex-row">
              <p className="ml-5">挂机模式</p>
              <FaClock className="ml-2 text-3xl text-gray-700" />
            </button>
          </div>
        </motion.div>
        {/* 沉浸模式 */}
        <motion.div variants={item}>
          <div
            className={`flex-1 rounded-br-2xl border border-gray-300 bg-white px-2.5 py-7 shadow-md`}
          >
            <button onClick={() => selectMode('Infinity')} className="flex cursor-pointer flex-row">
              <p className="ml-5">沉浸模式</p>
              <FaGlasses className="ml-2 text-3xl text-gray-700" />
            </button>
          </div>
        </motion.div>
        {/* 主动休息
        {gameState === 'run' && (
          <motion.div variants={item}>
            <div className="flex-1 rounded-b-2xl bg-white px-2.5 py-7 border border-gray-300 shadow-md">
              <button onClick={() => enterRestMode()} className="cursor-pointer">
                <FaPersonWalkingArrowRight className="text-3xl text-gray-700" />
              </button>
            </div>
          </motion.div>
        )} */}
      </motion.div>
    </>
  );
};

export default Selector;
