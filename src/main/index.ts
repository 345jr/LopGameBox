import { app, shell, BrowserWindow, ipcMain,dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { spawn } from 'child_process'
import type { ChildProcess } from 'child_process'
import * as db from './db';



let mainWindow: BrowserWindow | null = null
let childProcess: ChildProcess | null = null
let timerInterval: NodeJS.Timeout | null = null
let startTime: number | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 850,
    height: 600,
    minWidth:850,
    minHeight:600,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC 
  //打开文件夹获取路径
  ipcMain.handle('dialog:openFile',async()=>{
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'] // 指定只选择文件
    })
    if (!canceled) {
      return filePaths[0] // 返回用户选择的第一个文件路径
    }
    return null // 如果用户取消了选择，返回 null
  })
  //运行程序
  ipcMain.handle('shell:executeFile',async(_event,game:{id:number;path:string})=>{
    if (childProcess) {
      return { success: false, message: '已有另一个应用在运行中。' }
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
          resolve({ success: false, message: `启动子进程失败: ${err.message}` });
        });
  
        // 监听进程的 'spawn' 事件，确保进程成功启动
        childProcess?.on('spawn', () => {
          // 启动成功，设置定时器
          timerInterval = setInterval(() => {
            if (startTime) {
              const elapsedTime = Date.now() - startTime;
              const elapsedTimeSeconds = Math.round(elapsedTime/1000)
              mainWindow?.webContents.send('timer:update', elapsedTimeSeconds);
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
          mainWindow?.webContents.send('timer:stopped', { code, finalElapsedSeconds });
          db.updateGameOnClose(game.id, finalElapsedSeconds);
  
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
  })
  //查询游戏
  ipcMain.handle('db:getAllGames', () => {
    return db.getAllGames();
  });
  //添加游戏
  ipcMain.handle('db:addGame', (_event, { gameName, launchPath }) => {
    const existingGame = db.getGameByPath(launchPath);
    if (existingGame) {      
      throw new Error('这个游戏已经被添加过了！');
    }
    return db.addGame(gameName, launchPath);
  });
  //删除游戏
  ipcMain.handle('db:deleteGame', (_event, id: number) => {
    return db.deleteGame(id);
  });

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
