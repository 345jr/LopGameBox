import { GameRepository } from './gameRepository';
import { GalleryRepository } from './galleryRepository';
export class GameService {
  constructor(
    private gameRepo: GameRepository,
    private galleryRepo: GalleryRepository
  ) {}
  //添加游戏
  public addGame(gameName: string, launchPath: string, diskSize: number) {
    return this.gameRepo.addGame(gameName, launchPath, diskSize);
  }
  //获取全部游戏
  public getAllGames() {
    return this.gameRepo.getAllGames();
  }
  //获取游戏路径
  public getGameByPath(path: string) {
    return this.gameRepo.getGameByPath(path);
  }
  //更新游戏数据
  public updateGameOnClose(id: number, elapsed: number) {
    this.gameRepo.updateGameOnClose(id, elapsed);
  }
  //删除游戏
  public deleteGame(id: number) {
    return this.gameRepo.deleteGame(id);
  }
  //添加游戏封面图
  public setGameBanner(gameId:number,imagePath:string) {
    return this.galleryRepo.setGameBanner(gameId,imagePath)
  }
  //获取游戏封面图
  public getBanners(){
    return this.galleryRepo.getGameBanner()
  }
}
