import { DatabaseManager } from './databaseManager';

export class GalleryRepository {
  private db = DatabaseManager.getInstance();
  // 添加一个新的Banner图
  public setGameBanner(gameId: number, imagePath: string , relativePath:string) {
    // 先删除旧封面
    this.db
      .prepare('DELETE FROM game_gallery WHERE game_id = ? AND image_type = ?')
      .run(gameId, 'banner');
    // 插入新封面
    const stmt = this.db.prepare(
      'INSERT INTO game_gallery (game_id, image_path, image_type , relative_path) VALUES (?,?,?,?)',
    );
    const info = stmt.run(gameId, imagePath, 'banner',relativePath);
    return { id: info.lastInsertRowid, imagePath, type: 'banner',relativePath };
  }
  //  获取全部的Banner图数据
  public getGameBanner(){
    return this.db.prepare('SELECT * FROM game_gallery WHERE image_type = ?').all('banner')
  }
}
