import { FC } from 'react';
import { motion } from 'motion/react';
import type { Dispatch, SetStateAction } from 'react';
import { VscFileMedia, VscFolder, VscPlay, VscTrash, VscAttach } from 'react-icons/vsc';
import { GiAchievement } from 'react-icons/gi';
import { Link } from 'react-router-dom';

import type { Game } from '@renderer/types/Game';
import Portal from '../Portal';

type Props = {
  game: Game;
  onRun: (game: Game) => Promise<void> | void;
  onOpenFolderModal: (folderPath: string, gameId: number) => void;
  onAddBanner: (game: Game) => Promise<void> | void;
  onDelete: (game: Game) => Promise<void> | void;
  onOpenLinks: (gameId: number) => void;
  onUpdateGames: Dispatch<SetStateAction<Game[]>>;
};

const GameCardActions: FC<Props> = ({
  game,
  onRun,
  onOpenFolderModal,
  onAddBanner,
  onDelete,
  onOpenLinks,
  onUpdateGames,
}) => {
  return (
    <>
      <div className="grid grid-cols-7 grid-rows-1 gap-1">
        {/* 开始游戏 */}
        <motion.button
          onClick={() => onRun(game)}
          className="iconBtn-wrapper"
          initial={{ y: 0 }}
          whileHover={{ y: -5 }}
        >
          <VscPlay className="iconBtn" />
        </motion.button>
        {/* 文件管理 */}
        <motion.button
          onClick={() => onOpenFolderModal(game.launch_path, game.id)}
          className="iconBtn-wrapper"
          initial={{ y: 0 }}
          whileHover={{ y: -5 }}
        >
          <VscFolder className="iconBtn" />
        </motion.button>
        {/* 换封面 */}
        <motion.button
          onClick={() => onAddBanner(game)}
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
          onClick={() => onOpenLinks(game.id)}
          className="iconBtn-wrapper"
          initial={{ y: 0 }}
          whileHover={{ y: -5 }}
        >
          <VscAttach className="iconBtn" />
        </motion.button>
        {/* 删除 */}
        <motion.button
          onClick={() => onDelete(game)}
          className="iconBtn-wrapper"
          initial={{ y: 0 }}
          whileHover={{ y: -5 }}
        >
          <VscTrash className="iconBtn" />
        </motion.button>
        {/* 配置页面*/}
        <Portal gameId={game.id} updata={onUpdateGames} />
      </div>
    </>
  );
};

export default GameCardActions;
