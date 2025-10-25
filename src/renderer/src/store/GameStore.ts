import { Game } from '@renderer/types/Game';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
interface GameStore {
  gameId: number;
  gameTime: number;
  gameState: string;
  searchResults: Game[];
  searchKeyword: string;
  gameModeSelector: boolean;
  gameMode: string;
  selectedCategory: 'all' | 'playing' | 'archived';

  setGameList: (newGameList: number) => void;
  setGameTime: (elapsedTime: number) => void;
  setGameState: (states: string) => void;
  setSearchResults: (results: Game[]) => void;
  setSearchKeyword: (keyword: string) => void;
  setGameModeSelector: () => void;
  setGameMode: (mode: string) => void;
  setSelectedCategory: (category: 'all' | 'playing' | 'archived') => void;
}
//柯里化函数
const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      //状态
      gameId: 0,
      gameTime: 0,
      gameState: 'null',
      searchResults: [],
      searchKeyword: '',
      gameModeSelector: false,
      gameMode: 'Normal',
      selectedCategory: 'all',

      //action
      setGameList: (newGameList) => set({ gameId: newGameList }),
      setGameTime: (elapsedTime) => set({ gameTime: elapsedTime }),
      setGameState: (states) => set({ gameState: states }),
      setSearchResults: (results) => set({ searchResults: results }),
      setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
      setGameModeSelector: () =>
        set((state) => ({
          gameModeSelector: !state.gameModeSelector,
        })),
      setGameMode: (mode) => set({ gameMode: mode }),
      setSelectedCategory: (category) => set({ selectedCategory: category }),
    }),
    //persist的配置项
    {
      name: 'gameMode',
      partialize: (state) => ({ 
        gameMode: state.gameMode,
        selectedCategory: state.selectedCategory,
      }),
    },
  ),
);

export default useGameStore;
