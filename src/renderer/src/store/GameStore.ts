import { Game } from '@renderer/types/Game';
import { create } from 'zustand';
interface InfoStore {
    gameId:number
    gameTime:number
    gameState:string
    searchResults: Game[]
    setGameList:(newGameList:number)=>void
    setGameTime:(elapsedTime:number)=>void
    setGameState:(states:string)=>void
    setSearchResults:(results:Game[])=>void
}

const useGameStore = create<InfoStore>((set) => ({
    gameId:0,
    gameTime:0,
    gameState:"null",
    searchResults: [],

    setGameList:(newGameList)=>set({gameId:newGameList}),
    setGameTime:(elapsedTime)=>set({gameTime:elapsedTime}),
    setGameState:(states)=>set({gameState:states}),
    setSearchResults:(results)=>set({searchResults:results})
}));

export default useGameStore;