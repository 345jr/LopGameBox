import { create } from 'zustand';
interface InfoStore {
    gameId:number
    gameTime:number
    setGameList:(newGameList:number)=>void
    setGameTime:(elapsedTime:number)=>void
}

const useGameStore = create<InfoStore>((set) => ({
    gameId:0,
    gameTime:0,
    setGameList:(newGameList)=>set({gameId:newGameList}),
    setGameTime:(elapsedTime)=>set({gameTime:elapsedTime})
}));

export default useGameStore;