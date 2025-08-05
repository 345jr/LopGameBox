import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  dialog,
  protocol,
  net,
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
import { getSize } from './util/diskSize';
import { getDelectPath } from './util/path';

// 变量区
let mainWindow: BrowserWindow | null = null;
let childProcess: ChildProcess | null = null;
let timerInterval: NodeJS.Timeout | null = null;
let startTime: number | null = null;
//创建 数据库操控实例
const gameService = new GameService(
  new GameRepository(),
  new GalleryRepository(),
);
function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 850,
    height: 600,
    minWidth: 850,
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
    const filePath = request.url.slice('lop://'.length);
    const projectRoot = path.resolve(__dirname, '../../public');    
    const absPath = path.join(projectRoot, filePath);
    const cleanPath = absPath.replace(/[\\/]+$/, '');
    return net.fetch(
      url.pathToFileURL(path.join(cleanPath)).toString(),
    );
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
    async (_event, game: { id: number; path: string }) => {
      if (childProcess) {
        return { success: false, message: '已有另一个应用在运行中。' };
      }
      try {
        // 使用 spawn 启动进程
        childProcess = spawn(game.path, [], { stdio: 'ignore' });
        startTime = Date.now();

        // 返回一个 Promise，确保错误和成功都能被正确处理
        return new Promise((resolve) => {
          // 监听进程的 'error' 事件
          childProcess?.on('error', (err) => {
            console.error(`启动子进程失败: ${err.message}`);
            mainWindow?.webContents.send('timer:stopped', {
              code: -1,
              finalElapsedTime: 0,
              error: err.message,
            });

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

          // 监听进程的 'spawn' 事件，确保进程成功启动
          childProcess?.on('spawn', () => {
            // 启动成功，设置定时器
            timerInterval = setInterval(() => {
              if (startTime) {
                const elapsedTime = Date.now() - startTime;
                const elapsedTimeSeconds = Math.round(elapsedTime / 1000);
                mainWindow?.webContents.send(
                  'timer:update',
                  elapsedTimeSeconds,
                );
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
            }
            const finalElapsedTime = startTime ? Date.now() - startTime : 0;
            const finalElapsedSeconds = Math.round(finalElapsedTime / 1000);
            mainWindow?.webContents.send('timer:stopped', {
              code,
              finalElapsedSeconds,
            });
            gameService.updateGameOnClose(game.id, finalElapsedSeconds);

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
  //查询游戏
  ipcMain.handle('db:getAllGames', () => {
    return gameService.getAllGames();
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
  //删除游戏
  ipcMain.handle('db:deleteGame', (_event, id: number) => {
    return gameService.deleteGame(id);
  });
  //复制游戏图片到资源目录
  ipcMain.handle(
    'op:copyImages',
    async (_event, { origin, target, gameName ,oldFilePath }) => {
      try {
        const time = new Date().toDateString();
        //构建游戏名       
        const gameNameExtension = `${gameName}-${time}.jpg`.replace(/\s/g,'');
        const imageName = path.join(
          app.isPackaged
            ? path.join(path.dirname(app.getPath('exe')), target)  // 生产环境
            : path.join(process.cwd(), 'public', target),          // 开发环境
          gameNameExtension
        );
        const filePath = getDelectPath(oldFilePath) as string
        //如果有旧的封面图 ，先删除旧的封面图
        if (filePath !== 'skip') await fs.unlink(filePath)                     
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
  ipcMain.handle('db:getSnapshot',async(_event , gameId) =>{
    return gameService.getGameSnapshot(gameId)
  })
  // 添加Snapshot
  ipcMain.handle('db:addSnapshot',async(_event , {gameId, imagePath, relativePath})=>{
    try {
      return gameService.setGameSnapshot(gameId, imagePath, relativePath)
    } catch (error:any) {
      console.log(`发生异常: ${error.message}`)
      return null
    }
  })
  //删除Snapshot
  ipcMain.handle('db:delectSnapshot',async(_event,id)=>{
    try {
      return gameService.delectSnapshot(id)
    } catch(error:any) {
      console.log(`删除记录发生错误:${error.message}`)
    }
  })
  //删除图片文件
  ipcMain.handle('op:delectImages',async(_event,relative_path)=>{
    try {
      const path = getDelectPath(relative_path)
      await fs.unlink(path)
      console.log(`删除成功`)
    } catch (error:any) {
      console.log(`删除文件发生错误:${error.message}`)
    }
  })

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
