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
  //获取单个游戏
  public getGameById(id: number) {
    return this.gameRepo.getGameById(id);
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
  public setGameBanner(gameId:number,imagePath:string,relativePath:string) {
    return this.galleryRepo.setGameBanner(gameId,imagePath,relativePath)
  }
  //获取游戏封面图
  public getBanners(){
    return this.galleryRepo.getGameBanner()
  }
  //添加游戏快照图
  public setGameSnapshot(gameId:number,imagePath:string,relativePath:string){
    return this.galleryRepo.setGameSnapshot(gameId,imagePath,relativePath)
  }
  //获取游戏快照图
  public getGameSnapshot(gameId:number){
    return this.galleryRepo.getGameSnapshot(gameId)
  }
  //删除游戏快照图
  public delectSnapshot(id:number){
    return this.galleryRepo.delectSnapshot(id)
  }
  //修改游戏名
  public modifyGameName(id:number,newName:string){
    return this.gameRepo.modifyGameName(id,newName)
  }
  //更新游戏大小
  public updateGameSize(id:number,disk_size:number){
    return this.gameRepo.updateGameSize(id,disk_size)
  }
  //模糊查询搜索
  public searchGames(keyword: string) {
    return this.gameRepo.searchGames(keyword);
  }
}
