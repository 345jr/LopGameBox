import { create } from 'zustand';
interface InfoStore {
    gameId:number
    gameTime:number
    gameState:string
    setGameList:(newGameList:number)=>void
    setGameTime:(elapsedTime:number)=>void
    setGameState:(states:string)=>void
}

const useGameStore = create<InfoStore>((set) => ({
    gameId:0,
    gameTime:0,
    gameState:"null",
    setGameList:(newGameList)=>set({gameId:newGameList}),
    setGameTime:(elapsedTime)=>set({gameTime:elapsedTime}),
    setGameState:(states)=>set({gameState:states})
}));

export default useGameStore;