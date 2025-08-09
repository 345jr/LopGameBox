import { create } from 'zustand';
interface InfoStore {
    gameId:number
    setGameList:(newGameList:number)=>void
}

const useGameStore = create<InfoStore>((set) => ({
    gameId:0,
    setGameList:(newGameList)=>set({gameId:newGameList})
}));

export default useGameStore;