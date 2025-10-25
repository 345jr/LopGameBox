import { FC } from 'react';
import type { Game } from '@renderer/types/Game';
import gameSizeFormat from '@renderer/util/gameSizeFormat';
import { formatTime, formatTimeCalender, formatRelativeTime } from '@renderer/util/timeFormat';

type Props = {
  game: Game;
};

const GameCardData: FC<Props> = ({ game }) => {
  return (
    <>
      <div className="flex flex-row p-0.5  justify-between">
        <p className="text-white whitespace-nowrap">游戏名称:</p>
        <p
          className={`text-white ${
            game.game_name.length > 7 ? 'text-xs' : 'text-base'
          }   max-w-[140px]`}
          title={game.game_name}
        >
          {game.game_name}
        </p>
      </div>

      <div className="flex flex-row p-0.5 justify-between">
        <p className="text-white">游戏时长:</p>
        <p className="text-white">{formatTime(game.total_play_time)}</p>
      </div>

      <div className="flex flex-row p-0.5 whitespace-nowrap justify-between">
        <p className="text-white">上次启动:</p>
        <p className="text-white text-xs">{formatRelativeTime(game.last_launch_time)}</p>
      </div>

      <div className="flex flex-row p-0.5 whitespace-nowrap justify-between">
        <p className="text-white">添加时间:</p>
        <p className="text-white text-xs">{formatTimeCalender(game.created_at)}</p>
      </div>

      <div className="flex flex-row p-0.5 justify-between">
        <p className="text-white">启动次数:</p>
        <p className="text-white">{game.launch_count}</p>
      </div>

      <div className="flex flex-row mb-4 p-0.5 justify-between">
        <p className="text-white">空间占用大小:</p>
        <p className="text-white">{gameSizeFormat(game.disk_size)}</p>
      </div>

      <div className="m-4 h-0.5 w-40 bg-white"></div>
    </>
  );
};

export default GameCardData;
