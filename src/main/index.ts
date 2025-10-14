import { app, shell, BrowserWindow, ipcMain, dialog, protocol, net, Notification } from 'electron';
import path, { join } from 'path';
import url from 'node:url';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import * as fs from 'fs/promises';

import { GameService } from './services/gameService';
import { GameRepository } from './services/gameRepository';
import { GalleryRepository } from './services/galleryRepository';
import { GameLogsRepository } from './services/gameLogsRepository';
import { BackupService } from './services/backup';
import { getSize, getFolderSize } from './util/diskSize';
import { getDelectPath } from './util/path';

// 变量区
// 主窗口
let mainWindow: BrowserWindow | null = null;
//子进程
let childProcess: ChildProcess | null = null;
//计时器
let timerInterval: NodeJS.Timeout | null = null;
//宽限期计时器
let gracePeriodTimeout: NodeJS.Timeout | null = null;
//开始时间
let startTime: number | null = null;
//游戏模式(当前)
let gameMode: string | undefined = undefined;
//宽限期
let gracePeriod: boolean = false;
//休息期
let isResting: boolean = false;
//玩过的时间
let elapsedTimeSeconds: number = 0;
//模式热切换记录开关
let modeToggleLog: boolean = false;
//需要切换的模式和未切换前的状态
let modeToggle: string[] = new Array(2).fill('');
//是否记录?
let isLoged = false;

//创建 数据库操控实例
const gameService = new GameService(
  new GameRepository(),
  new GalleryRepository(),
  new GameLogsRepository(),
  new BackupService(),
);

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
    frame: false
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'), {});
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

//自定义协议
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'lop',
    privileges: {
      bypassCSP: true,
      standard: true,
      secure: true,
      supportFetchAPI: true,
    },
  },
]);

app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');
  //使用自定义协议
  protocol.handle('lop', (request) => {
    let filePath = request.url.slice('lop://'.length);
    filePath = decodeURIComponent(filePath);
    // console.log(filePath)
    const projectRoot = path.resolve(__dirname, '../../public');
    const absPath = path.join(projectRoot, filePath);
    const cleanPath = absPath.replace(/[\\/]+$/, '');
    return net.fetch(url.pathToFileURL(path.join(cleanPath)).toString());
  });

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC
  //打开文件夹获取路径
  ipcMain.handle('dialog:openFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'], // 指定只选择文件
    });
    if (!canceled) {
      return filePaths[0]; // 返回用户选择的第一个文件路径
    }
    return null; // 如果用户取消了选择，返回 null
  });
  //打开文件夹选择器
  ipcMain.handle('dialog:openFolder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory'], // 指定只选择文件夹
    });
    if (!canceled) {
      return filePaths[0]; // 返回用户选择的文件夹路径
    }
    return null; // 如果用户取消了选择，返回 null
  });
  //运行程序
  ipcMain.handle(
    'shell:executeFile',
    async (_event, game: { id: number; path: string; gameMode: string }) => {
      if (childProcess) {
        return { success: false, message: '已有另一个应用在运行中。' };
      }
      try {
        // 获取exe所在的目录作为工作目录
        const exeDir = path.dirname(game.path);
        // 使用 spawn 启动进程
        childProcess = spawn(game.path, [], { stdio: 'ignore', cwd: exeDir });
        // 设置当前的游戏模式
        gameMode = game.gameMode;
        //获取启动时的时间戳,用于游戏记录
        startTime = Date.now();
        //用于游戏时长记录
        const StartTimeNoLog = Date.now();
        return new Promise((resolve) => {
          // 监听进程的 'error' 事件
          childProcess?.on('error', (err) => {
            console.error(`error : ${err.message}`);
            mainWindow?.webContents.send('timer:stopped', {
              code: -1,
              finalElapsedTime: 0,
              error: err.message,
            });
            // 记录错误游戏日志
            gameService.logGame(game.id, startTime || 0, Date.now(), 'error', gameMode);
            // 清理状态
            childProcess = null;
            timerInterval = null;
            startTime = null;
            // 解析为失败状态
            resolve({
              success: false,
              message: `启动子进程失败: ${err.message}`,
            });
          });

          // 监听进程的 'spawn' 事件，启动成功
          childProcess?.on('spawn', () => {
            //挂机模式记录
            let lastAfkNotifySec = 0;
            //只记录一次和设置一个定时器
            isLoged = false;
            //启动时 ，清空模式热切换的记录数据
            modeToggleLog = false;
            // 启动成功，设置定时器
            timerInterval = setInterval(() => {
              //开始且不在宽限时间且不在休息期
              if (startTime && !gracePeriod && !isResting) {
                //一轮新的周期
                const elapsedTime = Date.now() - startTime;
                elapsedTimeSeconds = Math.round(elapsedTime / 1000);
                mainWindow?.webContents.send('timer:update', elapsedTimeSeconds);
                //模式热切换后记录前一次的数据
                //若为提前休息+跳过休息会记录本条
                //从宽限期到跳过休息则不会重复记录
                if (modeToggleLog && !isLoged) {
                  gameService.logGame(game.id, startTime, Date.now(), 'success', modeToggle[0]);
                  modeToggleLog = false;
                  elapsedTimeSeconds = 0;
                  startTime = Date.now();
                }
                try {
                  switch (gameMode) {
                    case 'Normal':
                      if (elapsedTimeSeconds >= 60 * 40) {
                        new Notification({
                          title: '普通模式提醒',
                          body: '您已经玩了超过 40 分钟！',
                        }).show();
                        gracePeriod = true;
                        mainWindow?.webContents.send('open-rest-time-modal');
                      }
                      break;
                    case 'Fast':
                      if (elapsedTimeSeconds >= 60 * 20) {
                        new Notification({
                          title: '快速模式提醒',
                          body: '您已经玩了超过 20 分钟！',
                        }).show();
                        gracePeriod = true;
                        mainWindow?.webContents.send('open-rest-time-modal');
                      }
                      break;
                    case 'Afk':
                      if (elapsedTimeSeconds - lastAfkNotifySec >= 60 * 60) {
                        new Notification({
                          title: '挂机模式提醒',
                          body: '您已经挂机1小时',
                        }).show();
                        lastAfkNotifySec = elapsedTimeSeconds;
                      }
                      break;
                    case 'Infinity':
                      break;
                    case 'Test':
                      if (elapsedTimeSeconds > 60) {
                        new Notification({
                          title: '测试模式提醒',
                          body: '您已经玩了超过 1 分钟！',
                        }).show();
                        gracePeriod = true;
                        mainWindow?.webContents.send('open-rest-time-modal');
                      }
                      break;
                    default:
                      break;
                  }
                } catch (error) {
                  console.error(`提醒发生错误: ${error}`);
                }
                //宽限期
              } else if (gracePeriod) {
                if (!isLoged) {
                  gameService.logGame(game.id, startTime || 0, Date.now(), 'success', gameMode);
                  isLoged = true;
                  //记录完毕后重置时间
                  startTime = Date.now();
                  // 设置一个定时器
                  gracePeriodTimeout = setTimeout(
                    () => {
                      //脱离宽限期并修改游戏模式为沉浸模式
                      gracePeriod = false;
                      gameMode = 'Infinity';
                    },
                    1000 * 60 * 5,
                  );
                }
                // 休息期
              } else if (isResting) {
                if (gracePeriodTimeout) {
                  clearTimeout(gracePeriodTimeout);
                  gracePeriodTimeout = null;
                }
                //记录一次休息前的游戏记录(主动休息情况)
                //若宽限期记录过这里就不再重复记录
                if (!isLoged) {
                  gameService.logGame(game.id, startTime || 0, Date.now(), 'success', gameMode);
                  //通知前端打开休息期窗口(若被动进入则无效果)
                  mainWindow?.webContents.send('open-rest-time-modal');
                  isLoged = true;
                }
                //重置时间
                startTime = Date.now();
              }
            }, 1000);
            // 解析为成功状态
            resolve({ success: true });
          });

          // 监听进程的 'close' 事件
          childProcess?.on('close', (code) => {
            console.log(`Game exit : ${code}`);
            if (timerInterval) {
              clearInterval(timerInterval);
              if (gracePeriodTimeout) clearTimeout(gracePeriodTimeout);
            }
            const finalElapsedTime = StartTimeNoLog ? Date.now() - StartTimeNoLog : 0;
            const finalElapsedSeconds = Math.round(finalElapsedTime / 1000);
            mainWindow?.webContents.send('timer:stopped', {
              code,
              finalElapsedSeconds,
            });
            //记录游戏时长
            gameService.updateGameOnClose(game.id, finalElapsedSeconds);
            // 记录成功游戏日志
            gameService.logGame(game.id, startTime || 0, Date.now(), 'success', gameMode);
            // 清理状态
            childProcess = null;
            timerInterval = null;
            startTime = null;
          });
        });
      } catch (err: any) {
        console.error(`error : ${err.message}`);
        // 清理状态
        childProcess = null;
        timerInterval = null;
        startTime = null;
        return { success: false, message: err.message };
      }
    },
  );
  //修改游戏模式
  ipcMain.handle('op:setGameMode', (_event, mode: string) => {
    modeToggleLog = true;
    modeToggle[0] = gameMode as string;
    //需要切换的模式
    modeToggle[1] = mode;
    //切换
    gameMode = mode;
  });

  //设置休息状态
  ipcMain.handle('op:setResting', (_event, resting: boolean) => {
    isResting = resting;
    if (resting == false) isLoged = false;
    gracePeriod = false;
    console.log(`this is resting: ${isResting}`);
  });

  //查询全部游戏
  ipcMain.handle('db:getAllGames', () => {
    return gameService.getAllGames();
  });
  //根据分类查询游戏
  ipcMain.handle('db:getGamesByCategory', (_event, category: string) => {
    return gameService.getGamesByCategory(category);
  });
  //查询单个游戏
  ipcMain.handle('db:getGameById', (_event, id: number) => {
    return gameService.getGameById(id);
  });
  //添加游戏
  ipcMain.handle('db:addGame', async (_event, { gameName, launchPath }) => {
    const existingGame = gameService.getGameByPath(launchPath);
    try {
      if (existingGame) {
        throw new Error('这个游戏路径已存在！');
      }
      const gameSize = await getSize(launchPath);
      return gameService.addGame(gameName, launchPath, gameSize);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      } else {
        throw new Error('一个不知道的错误发生了!');
      }
    }
  });
  //获取游戏大小
  ipcMain.handle('db:updateGameSize', async (_event, id, launch_path) => {
    try {
      const disk_size = await getSize(launch_path);
      gameService.updateGameSize(id, disk_size);
      return disk_size;
    } catch (error: any) {
      console.log(`获取游戏大小发生错误:${error.message}`);
      return 0;
    }
  });
  //获取文件夹大小（直接计算文件夹本身）
  ipcMain.handle('util:getFolderSize', async (_event, folderPath: string) => {
    try {
      const folderSize = await getFolderSize(folderPath);
      return folderSize;
    } catch (error: any) {
      console.log(`获取文件夹大小发生错误:${error.message}`);
      return 0;
    }
  });
  //删除游戏
  ipcMain.handle('db:deleteGame', (_event, id: number) => {
    return gameService.deleteGame(id);
  });
  //复制游戏图片到资源目录
  ipcMain.handle('op:copyImages', async (_event, { origin, target, gameName, oldFilePath }) => {
    try {
      const time = new Date().toDateString();
      //构建游戏名
      const gameNameExtension = `${gameName}-${time}.jpg`.replace(/\s/g, '');
      const imageName = path.join(
        app.isPackaged
          ? path.join(path.dirname(app.getPath('exe')), target) // 生产环境
          : path.join(process.cwd(), 'public', target), // 开发环境
        gameNameExtension,
      );
      const filePath = getDelectPath(oldFilePath) as string;
      //如果有旧的封面图 ，先删除旧的封面图
      if (filePath !== 'skip') await fs.unlink(filePath);
      //复制文件到相对路径文件夹
      await fs.copyFile(origin, imageName);
      console.log(`File Copy Success`);
      return { relativePath: path.join(target, gameNameExtension) };
    } catch (error) {
      console.log(`复制错误:${error}`);
      return { relativePath: path.join(target, 'default.jpg') };
    }
  });
  //添加Banner
  ipcMain.handle('db:addBanner', async (_event, { gameId, imagePath, relativePath }) => {
    try {
      return gameService.setGameBanner(gameId, imagePath, relativePath);
    } catch (error: any) {
      console.error(`发生异常: ${error.message}`);
    }
    return null;
  });
  // 查询Banner
  ipcMain.handle('db:getBanners', () => {
    return gameService.getBanners();
  });
  // 查询Snapshot
  ipcMain.handle('db:getSnapshot', async (_event, gameId) => {
    return gameService.getGameSnapshot(gameId);
  });
  // 添加Snapshot
  ipcMain.handle('db:addSnapshot', async (_event, { gameId, imagePath, relativePath }) => {
    try {
      return gameService.setGameSnapshot(gameId, imagePath, relativePath);
    } catch (error: any) {
      console.log(`发生异常: ${error.message}`);
      return null;
    }
  });
  //删除Snapshot
  ipcMain.handle('db:delectSnapshot', async (_event, id) => {
    try {
      return gameService.delectSnapshot(id);
    } catch (error: any) {
      console.log(`删除记录发生错误:${error.message}`);
    }
  });
  //更新快照描述
  ipcMain.handle('db:updateSnapshotAlt', async (_event, id: number, alt: string) => {
    try {
      return gameService.updateSnapshotAlt(id, alt);
    } catch (error: any) {
      console.log(`更新快照描述发生错误:${error.message}`);
    }
  });
  //删除快照描述
  ipcMain.handle('db:deleteSnapshotAlt', async (_event, id: number) => {
    try {
      return gameService.deleteSnapshotAlt(id);
    } catch (error: any) {
      console.log(`删除快照描述发生错误:${error.message}`);
    }
  });
  //获取快照描述
  ipcMain.handle('db:getSnapshotAlt', async (_event, id: number) => {
    try {
      return gameService.getSnapshotAlt(id);
    } catch (error: any) {
      console.log(`获取快照描述发生错误:${error.message}`);
      return null;
    }
  });

  // ==================== 外链管理相关处理器 ====================
  
  //添加游戏外链
  ipcMain.handle('db:addGameLink', async (_event, { gameId, url, title, description, icon }) => {
    try {
      return gameService.addGameLink(gameId, url, title, description, icon);
    } catch (error: any) {
      console.log(`添加游戏外链发生错误:${error.message}`);
      throw error;
    }
  });

  //获取游戏外链列表
  ipcMain.handle('db:getGameLinks', async (_event, gameId: number) => {
    try {
      return gameService.getGameLinks(gameId);
    } catch (error: any) {
      console.log(`获取游戏外链列表发生错误:${error.message}`);
      return [];
    }
  });

  //删除游戏外链
  ipcMain.handle('db:deleteGameLink', async (_event, linkId: number) => {
    try {
      return gameService.deleteGameLink(linkId);
    } catch (error: any) {
      console.log(`删除游戏外链发生错误:${error.message}`);
      throw error;
    }
  });

  //更新游戏外链
  ipcMain.handle('db:updateGameLink', async (_event, { linkId, title, url }) => {
    try {
      return gameService.updateGameLink(linkId, title, url);
    } catch (error: any) {
      console.log(`更新游戏外链发生错误:${error.message}`);
      throw error;
    }
  });

  //删除图片文件
  ipcMain.handle('op:delectImages', async (_event, relative_path) => {
    try {
      const path = getDelectPath(relative_path);
      await fs.unlink(path);
      console.log(`删除成功`);
    } catch (error: any) {
      console.log(`删除文件发生错误:${error.message}`);
    }
  });
  //修改游戏名
  ipcMain.handle('db:modifyGameName', async (_event, id, newName) => {
    try {
      gameService.modifyGameName(id, newName);
    } catch (error) {
      console.log(`修改游戏名发生错误${error}`);
    }
  });
  //打开文件夹
  ipcMain.handle('op:openFolder', (_event, folderPath) => {
    try {
      shell.showItemInFolder(folderPath);
    } catch (error: any) {
      console.log(`打开文件夹发生错误:${error.message}`);
    }
  });
  //模糊搜索
  ipcMain.handle('db:searchGames', async (_event, keyword) => {
    try {
      return gameService.searchGames(keyword);
    } catch (error: any) {
      console.log(`搜索发生错误:${error.message}`);
      return [];
    }
  });
  //统计游戏数量
  ipcMain.handle('db:countGames', () => {
    return gameService.countGames();
  });
  //统计游戏时间
  ipcMain.handle('db:countGameTime', () => {
    return gameService.countGameTime();
  });
  //统计游戏启动次数
  ipcMain.handle('db:countLaunchTimes', () => {
    return gameService.countLaunchTimes();
  });
  //查询今日 ，本周 ，本月游戏情况
  ipcMain.handle('db:getGameLogDayWeekMonth', () => {
    return gameService.getGameLogDayWeekMonth();
  });
  //查询4种模式下的游戏时长分布
  ipcMain.handle('db:getGameLogByMode', () => {
    return gameService.getGameLogByMode();
  });
  //获取本周的时长分布
  ipcMain.handle('db:getGameLogByModeThisWeek', () => {
    return gameService.getGameLogByModeThisWeek();
  });
  //获取上周的时长分布
  ipcMain.handle('db:getGameLogByModeLastWeek', () => {
    return gameService.getGameLogByModeLastWeek();
  });

  // 窗口控制
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize();
  });
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow?.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.handle('window:close', () => {
    mainWindow?.close();
  });
  ipcMain.handle('window:isMaximized', () => {
    return mainWindow?.isMaximized();
  });

  createWindow();
  //备份数据库(本地)
  ipcMain.handle('db:backupDatabase', async () => {
    return gameService.backupDatabase();
  });
  //上传备份数据
  ipcMain.handle('db:backupAndUpload', async (_event, uploadUrl: string, token?: string) => {
    try {
      const backupPath = await gameService.backupDatabase();
      const uploadResult = await gameService.uploadBackup(backupPath, uploadUrl, token);
      return { success: true, path: backupPath, uploadResult };
    } catch (err: any) {
      console.error('备份并上传失败:', err);
      return { success: false, error: err?.message ?? String(err) };
    }
  });
  //更新游戏版本
  ipcMain.handle(
    'db:updateGameVersion',
    async (_event, gameId: number, type: 'minor' | 'major', summary: string, fileSize?: number) => {
      try {
        return gameService.updateGameVersion(gameId, type, summary, fileSize);
      } catch (err: any) {
        console.error('更新游戏版本失败:', err);
        throw err;
      }
    },
  );

  // 根据版本ID查询版本概述
  ipcMain.handle('db:getVersionSummary', (_event, versionId: number) => {
    try {
      return gameService.getVersionSummary(versionId);
    } catch (err: any) {
      console.error('查询版本概述失败:', err);
      return null;
    }
  });
  // 根据游戏ID查询其所有的版本信息
  ipcMain.handle('db:getVersionsByGame', (_event, gameId: number) => {
    try {
      return gameService.getVersionsByGame(gameId);
    } catch (err: any) {
      console.error('查询游戏版本列表失败:', err);
      return [];
    }
  });
  //更新游戏路径
  ipcMain.handle('db:updateGamePath', async (_event, gameId: number, newPath: string) => {
    try {
      // 检查新路径是否已存在（排除当前游戏自己）
      const existingGame: any = gameService.getGameByPath(newPath);
      if (existingGame && existingGame.id !== gameId) {
        throw new Error('该路径已被其他游戏使用！');
      }
      gameService.updateGamePath(gameId, newPath);
      return { success: true, message: '路径更新成功' };
    } catch (err: any) {
      console.error('更新游戏路径失败:', err);
      return { success: false, message: err?.message ?? String(err) };
    }
  });
  //更新游戏分类
  ipcMain.handle('db:updateGameCategory', (_event, gameId: number, category: string) => {
    try {
      gameService.updateGameCategory(gameId, category);
      return { success: true, message: '分类更新成功' };
    } catch (err: any) {
      console.error('更新游戏分类失败:', err);
      return { success: false, message: err?.message ?? String(err) };
    }
  });
  //更新版本描述
  ipcMain.handle('db:updateVersionDescription', async (_event, versionId: number, newDescription: string) => {
    try {
      gameService.updateVersionDescription(versionId, newDescription);
      return { success: true, message: '版本描述更新成功' };
    } catch (err: any) {
      console.error('更新版本描述失败:', err);
      return { success: false, message: err?.message ?? String(err) };
    }
  });

  // ==================== 成就相关 IPC 处理器 ====================
  
  // 创建成就
  ipcMain.handle('db:createAchievement', async (_event, gameId: number, achievementName: string, achievementType: string, description?: string) => {
    try {
      return gameService.createAchievement(gameId, achievementName, achievementType, description);
    } catch (err: any) {
      console.error('创建成就失败:', err);
      throw err;
    }
  });

  // 删除成就
  ipcMain.handle('db:deleteAchievement', async (_event, achievementId: number) => {
    try {
      gameService.deleteAchievement(achievementId);
    } catch (err: any) {
      console.error('删除成就失败:', err);
      throw err;
    }
  });

  // 切换成就状态
  ipcMain.handle('db:toggleAchievementStatus', async (_event, achievementId: number, isCompleted: 0 | 1) => {
    try {
      gameService.toggleAchievementStatus(achievementId, isCompleted);
    } catch (err: any) {
      console.error('切换成就状态失败:', err);
      throw err;
    }
  });

  // 获取游戏所有成就
  ipcMain.handle('db:getGameAchievements', async (_event, gameId: number) => {
    try {
      return gameService.getGameAchievements(gameId);
    } catch (err: any) {
      console.error('获取游戏成就失败:', err);
      return [];
    }
  });

  // 获取已完成的成就
  ipcMain.handle('db:getCompletedAchievements', async (_event, gameId: number) => {
    try {
      return gameService.getCompletedAchievements(gameId);
    } catch (err: any) {
      console.error('获取已完成成就失败:', err);
      return [];
    }
  });

  // 获取未完成的成就
  ipcMain.handle('db:getUncompletedAchievements', async (_event, gameId: number) => {
    try {
      return gameService.getUncompletedAchievements(gameId);
    } catch (err: any) {
      console.error('获取未完成成就失败:', err);
      return [];
    }
  });

  // 获取成就统计
  ipcMain.handle('db:getAchievementStats', async (_event, gameId: number) => {
    try {
      return gameService.getAchievementStats(gameId);
    } catch (err: any) {
      console.error('获取成就统计失败:', err);
      return { total: 0, completed: 0, completionRate: 0 };
    }
  });

  // ==================== 存档管理相关处理器 ====================
  
  // 设置游戏主存档路径
  ipcMain.handle('db:setGameSavePath', async (_event, gameId: number, savePath: string, fileSize: number) => {
    try {
      return gameService.setGameSavePath(gameId, savePath, fileSize);
    } catch (err: any) {
      console.error('设置游戏主存档路径失败:', err);
      throw err;
    }
  });

  // 获取游戏主存档路径
  ipcMain.handle('db:getGameSavePath', async (_event, gameId: number) => {
    try {
      return gameService.getGameSavePath(gameId);
    } catch (err: any) {
      console.error('获取游戏主存档路径失败:', err);
      return null;
    }
  });

  // 更新游戏主存档路径
  ipcMain.handle('db:updateGameSavePath', async (_event, gameId: number, savePath: string) => {
    try {
      gameService.updateGameSavePath(gameId, savePath);
      return { success: true, message: '存档路径更新成功' };
    } catch (err: any) {
      console.error('更新游戏主存档路径失败:', err);
      return { success: false, message: err?.message ?? String(err) };
    }
  });

  // 更新主存档文件夹大小
  ipcMain.handle('db:updateSavePathSize', async (_event, gameId: number, fileSize: number) => {
    try {
      gameService.updateSavePathSize(gameId, fileSize);
      return { success: true, message: '存档大小更新成功' };
    } catch (err: any) {
      console.error('更新主存档文件夹大小失败:', err);
      return { success: false, message: err?.message ?? String(err) };
    }
  });

  // 删除游戏主存档路径
  ipcMain.handle('db:deleteGameSavePath', async (_event, gameId: number) => {
    try {
      gameService.deleteGameSavePath(gameId);
      return { success: true, message: '存档路径删除成功' };
    } catch (err: any) {
      console.error('删除游戏主存档路径失败:', err);
      return { success: false, message: err?.message ?? String(err) };
    }
  });
  
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
