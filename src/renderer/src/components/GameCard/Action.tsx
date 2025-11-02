import { FC, useState } from 'react';
import { motion } from 'motion/react';
import { VscFileMedia, VscFolder, VscPlay, VscTrash, VscAttach } from 'react-icons/vsc';
import { GiAchievement } from 'react-icons/gi';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';

import type { Game } from '@renderer/types/Game';
import Portal from '../Portal';
import useGameStore from '@renderer/store/GameStore';
import LinksContent from '../ModalContent/LinksContent';
import FolderManageContent from '../ModalContent/FolderManageContent';
import { toast } from 'react-hot-toast';

type Props = {
  game: Game;
  onRefresh: () => void;
};

const GameCardActions: FC<Props> = ({ game, onRefresh }) => {
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const setGameTime = useGameStore((state) => state.setGameTime);
  const GameState = useGameStore((state) => state.gameState);
  const setGameState = useGameStore((state) => state.setGameState);

  // 启动游戏
  const handleRunGame = async (game: Game) => {
    window.api.onTimerUpdate(setGameTime);
    window.api.onTimerStopped(() => {
      toast.success(`游戏已关闭。`);
      setGameState('stop');
      onRefresh();
    });
    if (GameState === 'run') {
      toast.error('已经有另一个游戏在运行中');
      return;
    }

    const result = await window.api.executeFile({
      id: game.id,
      path: game.launch_path,
      gameMode: useGameStore.getState().gameMode,
    });

    if (result.success) {
      setGameState('run');
      toast.success(`启动!${game.game_name}`);
    } else {
      setGameState('null');
    }
  };

  // 删除游戏
  const handleDeleteGame = async (game: Game) => {
    if (GameState === 'run') {
      toast.error('不能删除正在运行的游戏！');
      return;
    }
    if (
      confirm(`确定要删除游戏《${game.game_name}》?\n此操作只会删除游戏的记录 ,不会删除游戏本地的文件。`)
    ) {
      await window.api.deleteGame(game.id);
      toast.success(`${game.game_name}已删除。`);
      onRefresh();
    }
  };

  // 添加封面
  const handleAddBanner = async (game: Game) => {
    const targetPath = 'banner/';
    const path = await window.api.openFile();
    let oldFilePath = (await window.api.getBanners())?.find((i: any) => i.game_id === game.id)
      ?.relative_path as string;
    if (!path) return;
    if (oldFilePath == undefined) oldFilePath = 'skip';
    try {
      const result = await window.api.copyImages({
        origin: path,
        target: targetPath,
        gameName: game.game_name,
        oldFilePath: oldFilePath,
      });
      await window.api.addBanner({
        gameId: game.id,
        imagePath: path,
        relativePath: result.relativePath,
      });
      toast.success('封面图替换成功');
      onRefresh();
    } catch (error: any) {
      toast.error('封面图替换失败');
    }
  };
  
  return (
    <>
      <div className="grid grid-cols-7 grid-rows-1 gap-1">
        {/* 开始游戏 */}
        <motion.button
          onClick={() => handleRunGame(game)}
          className="iconBtn-wrapper"
          initial={{ y: 0 }}
          whileHover={{ y: -5 }}
        >
          <VscPlay className="iconBtn" />
        </motion.button>
        {/* 文件管理 */}
        <motion.button
          onClick={() => setShowFolderModal(true)}
          className="iconBtn-wrapper"
          initial={{ y: 0 }}
          whileHover={{ y: -5 }}
        >
          <VscFolder className="iconBtn" />
        </motion.button>
        {/* 换封面 */}
        <motion.button
          onClick={() => handleAddBanner(game)}
          className="iconBtn-wrapper"
          initial={{ y: 0 }}
          whileHover={{ y: -5 }}
        >
          <VscFileMedia className="iconBtn" />
        </motion.button>
        {/* 成就 */}
        <motion.div initial={{ y: 0 }} whileHover={{ y: -5 }} className="iconBtn-wrapper">
          <Link to={`/gallery/${game.id}`}>
            <GiAchievement className="iconBtn" />
          </Link>
        </motion.div>
        {/* 链接管理 */}
        <motion.button
          onClick={() => setShowLinksModal(true)}
          className="iconBtn-wrapper"
          initial={{ y: 0 }}
          whileHover={{ y: -5 }}
        >
          <VscAttach className="iconBtn" />
        </motion.button>
        {/* 删除 */}
        <motion.button
          onClick={() => handleDeleteGame(game)}
          className="iconBtn-wrapper"
          initial={{ y: 0 }}
          whileHover={{ y: -5 }}
        >
          <VscTrash className="iconBtn" />
        </motion.button>
        {/* 配置页面*/}
        <Portal gameId={game.id}  onRefresh={onRefresh} />
      </div>
      {/* 模态框部分 */}
      {/* 外链管理模态框 */}
      {showLinksModal &&
        createPortal(
          <LinksContent 
            gameId={game.id}
            onClose={() => setShowLinksModal(false)} 
          />,
          document.body,
        )}
      {/* 文件管理模态框 */}
      {showFolderModal &&
        createPortal(
          <FolderManageContent 
            gamePath={game.launch_path}
            gameId={game.id}
            onClose={() => setShowFolderModal(false)}
          />,
          document.body,
        )}
    </>
  );
};

export default GameCardActions;
