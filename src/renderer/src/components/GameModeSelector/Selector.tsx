import useGameStore from '@renderer/store/GameStore';
import { motion, Variants } from 'framer-motion';
import { useEffect } from 'react';
import {
  FaFaceSmileBeam,
  FaHourglassEnd,
  FaGlasses,
  FaClock,
  FaPersonWalkingArrowRight,
} from 'react-icons/fa6';

const Selector = () => {
  //游戏模式选择器
  const gameModeSelector = useGameStore((state) => state.gameModeSelector);
  //当前游戏模式
  const gameMode = useGameStore((state) => state.gameMode);
  //设置游戏模式
  const setGameMode = useGameStore((state) => state.setGameMode);
  //游戏状态
  const gameState = useGameStore((state) => state.gameState);
  //动画
  const selector: Variants = {
    initial: { opacity: 0, y: -100 },
    animate: { opacity: 1, y: 0, transition: { ease: ['easeInOut'] } },
  };
  //选择模式
  const selectMode = (mode: string) => {
    console.log(`要切换的模式是${mode}`);
    setGameMode(mode);
    //如果游戏真正运行 ，则视为热切换
    if(gameState==='run') window.api.setGameMode(mode);
  };
  //进入休息状态
  const enterRestMode = () => {
    window.api.setResting(true);
  };
  useEffect(() => {
    console.log(`当前的模式是${gameMode}`);
  }, []);
  return (
    <>
      <motion.div
        className="z-0 flex flex-col border-1 border-black"
        variants={selector}
        initial="initial"
        animate={gameModeSelector ? 'animate' : 'disabled'}
      >
        <div className="flex-1 bg-lime-200 px-2.5 py-5">
          <button
            onClick={() => selectMode('Normal')}
            className="cursor-pointer"
          >
            <FaFaceSmileBeam className="text-3xl text-lime-500" />
          </button>
        </div>
        <div className="flex-1 bg-amber-200 px-2.5 py-5">
          <button onClick={() => selectMode('Fast')} className="cursor-pointer">
            <FaHourglassEnd className="text-3xl text-amber-500" />
          </button>
        </div>
        <div className="flex-1 bg-cyan-500 px-2.5 py-7">
          <button onClick={() => selectMode('Afk')} className="cursor-pointer">
            <FaClock className="text-3xl text-cyan-700" />
          </button>
        </div>

        <div
          className={`flex-1${gameState === 'run' ? '' : 'rounded-b-2xl'} bg-stone-500 px-2.5 py-7`}
        >
          <button onClick={() => selectMode('Test')} className="cursor-pointer">
            <FaGlasses className="text-3xl text-black" />
          </button>
        </div>
        {gameState === 'run' && (
          <div className="flex-1 rounded-b-2xl bg-green-500 px-2.5 py-7">
            <button onClick={() => enterRestMode()} className="cursor-pointer">
              <FaPersonWalkingArrowRight className="text-3xl text-black" />
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default Selector;
