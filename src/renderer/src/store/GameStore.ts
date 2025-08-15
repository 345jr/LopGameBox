import { Game } from '@renderer/types/Game';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
interface InfoStore {
  gameId: number;
  gameTime: number;
  gameState: string;
  searchResults: Game[];
  gameModeSelector: boolean;
  gameMode: string;
  setGameList: (newGameList: number) => void;
  setGameTime: (elapsedTime: number) => void;
  setGameState: (states: string) => void;
  setSearchResults: (results: Game[]) => void;
  setGameModeSelector: () => void;
  setGameMode: (mode: string) => void;
}
//柯里化函数
const useGameStore = create<InfoStore>()(
  persist(
    (set) => ({
      //状态
      gameId: 0,
      gameTime: 0,
      gameState: 'null',
      searchResults: [],
      gameModeSelector: false,
      gameMode: 'Normal',

      //action
      setGameList: (newGameList) => set({ gameId: newGameList }),
      setGameTime: (elapsedTime) => set({ gameTime: elapsedTime }),
      setGameState: (states) => set({ gameState: states }),
      setSearchResults: (results) => set({ searchResults: results }),
      setGameModeSelector: () =>
        set((state) => ({
          gameModeSelector: !state.gameModeSelector,
        })),
      setGameMode: (mode) => set({ gameMode: mode }),
    }),
    //persist的配置项
    {
      name: 'gameMode',
      partialize: (state) => ({ gameMode: state.gameMode }),
    },
  ),
);

export default useGameStore;
