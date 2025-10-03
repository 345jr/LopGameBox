import { GameRepository } from './gameRepository';
import { GalleryRepository } from './galleryRepository';
import { GameLogsRepository } from './gameLogsRepository';
import { BackupService } from './backup';
export class GameService {
  constructor(
    private gameRepo: GameRepository,
    private galleryRepo: GalleryRepository,
    private gameLogsRepo: GameLogsRepository,
    private backupService: BackupService,
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
  public setGameBanner(gameId: number, imagePath: string, relativePath: string) {
    return this.galleryRepo.setGameBanner(gameId, imagePath, relativePath);
  }
  //获取游戏封面图
  public getBanners() {
    return this.galleryRepo.getGameBanner();
  }
  //添加游戏快照图
  public setGameSnapshot(gameId: number, imagePath: string, relativePath: string) {
    return this.galleryRepo.setGameSnapshot(gameId, imagePath, relativePath);
  }
  //获取游戏快照图
  public getGameSnapshot(gameId: number) {
    return this.galleryRepo.getGameSnapshot(gameId);
  }
  //删除游戏快照图
  public delectSnapshot(id: number) {
    return this.galleryRepo.delectSnapshot(id);
  }
  //修改游戏名
  public modifyGameName(id: number, newName: string) {
    return this.gameRepo.modifyGameName(id, newName);
  }
  //更新游戏大小
  public updateGameSize(id: number, disk_size: number) {
    return this.gameRepo.updateGameSize(id, disk_size);
  }
  //更新游戏路径
  public updateGamePath(id: number, newPath: string) {
    return this.gameRepo.updateGamePath(id, newPath);
  }
  //模糊查询搜索
  public searchGames(keyword: string) {
    return this.gameRepo.searchGames(keyword);
  }
  //统计游戏数量
  public countGames() {
    return this.gameRepo.countGames();
  }
  //统计游戏时间
  public countGameTime() {
    return this.gameRepo.countGameTime();
  }
  //统计启动次数
  public countLaunchTimes() {
    return this.gameRepo.countLaunchTimes();
  }
  //记录游戏记录
  public logGame(
    gameId: number,
    launchedAt: number,
    endedAt: number,
    launchState: string,
    gameMode: string = '',
  ) {
    this.gameLogsRepo.insertGameLog(gameId, launchedAt, endedAt, launchState, gameMode);
  }
  //查询今日 ，本周 ，本月的游戏记录
  public getGameLogDayWeekMonth() {
    return this.gameLogsRepo.getGameLogDayWeekMonth();
  }
  //查询4种模式下的游戏时长分布
  public getGameLogByMode() {
    return this.gameLogsRepo.getGameLogByMode();
  }
  //获取本周的时长分布
  public getGameLogByModeThisWeek() {
    return this.gameLogsRepo.getGameLogByModeThisWeek();
  }
  //获取上周的时长分布
  public getGameLogByModeLastWeek() {
    return this.gameLogsRepo.getGameLogByModeLastWeek();
  }
  //备份数据库
  public async backupDatabase(): Promise<string> {
    return this.backupService.backupDatabase();
  }
  // 上传备份文件（转发到 BackupService）
  public async uploadBackup(backupPath: string, uploadUrl: string, token?: string) {
    return this.backupService.uploadBackup(backupPath, uploadUrl, token);
  }
  //更新游戏版本
  public updateGameVersion(
    gameId: number,
    type: 'minor' | 'major',
    summary: string,
    fileSize?: number,
  ) {
    // 获取当前最新版本
    const latest: any = this.gameRepo.getLatestVersion(gameId);

    let baseVersion: string = '1.0';
    if (latest && latest.version) {
      baseVersion = String(latest.version);
    } else {
      // 回退到 games 表中的 game_version 字段
      const game: any = this.gameRepo.getGameById(gameId);
      baseVersion = String(game?.game_version || '1.0');
    }

    // 解析版本号，支持 x 或 x.y 格式
    const parts = baseVersion.split('.').map((p: string) => parseInt(p, 10) || 0);
    let major = parts[0] || 0;
    let minor = parts[1] || 0;

    if (type === 'major') {
      major += 1;
      minor = 0;
    } else {
      // minor 更新：+0.1 -> 等同于 minor + 1
      minor += 1;
    }

    const newVersion = `${major}.${minor}`;

    // 插入版本表并同步更新 games.game_version
    const inserted = this.gameRepo.addGameVersion(gameId, newVersion, summary, fileSize);
    this.gameRepo.updateGameCurrentVersion(gameId, newVersion);
    return inserted;
  }

  // 查询某条版本的概述（按版本 id）
  public getVersionSummary(versionId: number) {
    const v: any = this.gameRepo.getGameVersionById(versionId);
    if (!v) return null;
    return {
      id: v.id,
      game_id: v.game_id,
      version: v.version,
      summary: v.summary,
      created_at: v.created_at,
    };
  }

  // 根据游戏ID查询其所有的版本信息
  public getVersionsByGame(gameId: number) {
    return this.gameRepo.getVersionsByGame(gameId);
  }

  // 更新版本描述
  public updateVersionDescription(versionId: number, newDescription: string) {
    return this.gameRepo.updateVersionDescription(versionId, newDescription);
  }
}
