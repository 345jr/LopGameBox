import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  dialog,
  protocol,
  net,
  Notification,
} from 'electron';
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
import { getSize } from './util/diskSize';
import { getDelectPath } from './util/path';

// 变量区
let mainWindow: BrowserWindow | null = null;
let childProcess: ChildProcess | null = null;
let timerInterval: NodeJS.Timeout | null = null;
let gracePeriodTimeout:NodeJS.Timeout | null = null;
let startTime: number | null = null;
let gameMode: string | undefined = undefined;
let gracePeriod: boolean = false;
let isResting: boolean = false;
let elapsedTimeSeconds: number = 0;
//创建 数据库操控实例
const gameService = new GameService(
  new GameRepository(),
  new GalleryRepository(),
  new GameLogsRepository(),
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
  //运行程序
  ipcMain.handle(
    'shell:executeFile',
    async (_event, game: { id: number; path: string; gameMode: string }) => {
      if (childProcess) {
        return { success: false, message: '已有另一个应用在运行中。' };
      }
      try {
        // 使用 spawn 启动进程
        childProcess = spawn(game.path, [], { stdio: 'ignore' });
        // 设置当前的游戏模式
        gameMode = game.gameMode;
        //获取启动时的时间戳
        startTime = Date.now();        
        return new Promise((resolve) => {
          // 监听进程的 'error' 事件
          childProcess?.on('error', (err) => {
            console.error(`启动子进程失败: ${err.message}`);
            mainWindow?.webContents.send('timer:stopped', {
              code: -1,
              finalElapsedTime: 0,
              error: err.message,
            });
            // 记录错误游戏日志
            gameService.logGame(
              game.id,
              startTime || 0,
              Date.now(),
              'error',
              gameMode,
            );
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
            //不同模式下的提醒
            let normalNotified = false;
            let fastNotified = false;
            let lastAfkNotifySec = 0;
            let testNotified = false;
            //只记录一次和设置一个定时器
            let isLoged = false;
            // 启动成功，设置定时器
            timerInterval = setInterval(() => {
              //开始且不在宽限时间且不在休息期
              if (startTime && !gracePeriod && !isResting) {
                const elapsedTime = Date.now() - startTime;
                elapsedTimeSeconds = Math.round(elapsedTime / 1000);
                mainWindow?.webContents.send(
                  'timer:update',
                  elapsedTimeSeconds,
                );

                try {
                  switch (gameMode) {
                    case 'Normal':
                      if (!normalNotified && elapsedTimeSeconds >= 60 * 40) {
                        new Notification({
                          title: '普通模式提醒',
                          body: '您已经玩了超过 40 分钟！',
                        }).show();
                        normalNotified = true;
                        gracePeriod = true;
                        mainWindow?.webContents.send('open-rest-time-modal');
                      }
                      break;
                    case 'Fast':
                      if (!fastNotified && elapsedTimeSeconds >= 60 * 20) {
                        new Notification({
                          title: '快速模式提醒',
                          body: '您已经玩了超过 20 分钟！',
                        }).show();
                        fastNotified = true;
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
                      if (!testNotified && elapsedTimeSeconds > 60) {
                        new Notification({
                          title: '测试模式提醒',
                          body: '您已经玩了超过 1 分钟！',
                        }).show();
                        testNotified = true;
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
                  gameService.logGame(
                    game.id,
                    startTime || 0,
                    Date.now(),
                    'success',
                    gameMode,
                  );
                  isLoged = true;
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
              } else if(isResting){
                if (gracePeriodTimeout) {
                  clearTimeout(gracePeriodTimeout);
                  gracePeriodTimeout = null;
                }
                //记录一次休息前的游戏记录(主动休息情况)
                //被动触发休息时
                if (!isLoged) {
                  gameService.logGame(
                    game.id,
                    startTime || 0,
                    Date.now(),
                    'success',
                    gameMode,
                  );
                  isLoged = true;
                }
                //重置时间
                elapsedTimeSeconds = 0;
                startTime = Date.now();
              }
            }, 1000);
            // 解析为成功状态
            resolve({ success: true });
          });

          // 监听进程的 'close' 事件
          childProcess?.on('close', (code) => {
            console.log(`子进程已退出，退出码：${code}`);
            if (timerInterval) {
              clearInterval(timerInterval);
              if (gracePeriodTimeout) clearTimeout(gracePeriodTimeout);
            }
            const finalElapsedTime = startTime ? Date.now() - startTime : 0;
            const finalElapsedSeconds = Math.round(finalElapsedTime / 1000);
            mainWindow?.webContents.send('timer:stopped', {
              code,
              finalElapsedSeconds,
            });
            gameService.updateGameOnClose(game.id, finalElapsedSeconds);
            // 记录成功游戏日志
            gameService.logGame(
              game.id,
              startTime || 0,
              Date.now(),
              'success',
              game.gameMode,
            );
            // 清理状态
            childProcess = null;
            timerInterval = null;
            startTime = null;
          });
        });
      } catch (err: any) {
        console.error(`发生异常: ${err.message}`);
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
    //模式对应时间的映射
    //对比目前玩的时间是否大于映射的时间
    //若大于将其清零
    gameMode = mode;
  });
  //设置休息状态
  ipcMain.handle('op:setResting', (_event, resting: boolean) => {
    isResting = resting;
    gracePeriod = false;
  });

  //查询全部游戏
  ipcMain.handle('db:getAllGames', () => {
    return gameService.getAllGames();
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
  //删除游戏
  ipcMain.handle('db:deleteGame', (_event, id: number) => {
    return gameService.deleteGame(id);
  });
  //复制游戏图片到资源目录
  ipcMain.handle(
    'op:copyImages',
    async (_event, { origin, target, gameName, oldFilePath }) => {
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
    },
  );
  //添加Banner
  ipcMain.handle(
    'db:addBanner',
    async (_event, { gameId, imagePath, relativePath }) => {
      try {
        return gameService.setGameBanner(gameId, imagePath, relativePath);
      } catch (error: any) {
        console.error(`发生异常: ${error.message}`);
      }
      return null;
    },
  );
  // 查询Banner
  ipcMain.handle('db:getBanners', () => {
    return gameService.getBanners();
  });
  // 查询Snapshot
  ipcMain.handle('db:getSnapshot', async (_event, gameId) => {
    return gameService.getGameSnapshot(gameId);
  });
  // 添加Snapshot
  ipcMain.handle(
    'db:addSnapshot',
    async (_event, { gameId, imagePath, relativePath }) => {
      try {
        return gameService.setGameSnapshot(gameId, imagePath, relativePath);
      } catch (error: any) {
        console.log(`发生异常: ${error.message}`);
        return null;
      }
    },
  );
  //删除Snapshot
  ipcMain.handle('db:delectSnapshot', async (_event, id) => {
    try {
      return gameService.delectSnapshot(id);
    } catch (error: any) {
      console.log(`删除记录发生错误:${error.message}`);
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
  //消息通知模拟
  ipcMain.handle(
    'op:sendNotification',
    (_event, title: string, body: string) => {
      new Notification({ title: title, body: body }).show();
    },
  );

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
