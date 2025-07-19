import { app, shell, BrowserWindow, ipcMain,dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { spawn } from 'child_process'
import type { ChildProcess } from 'child_process'

let mainWindow: BrowserWindow | null = null
let childProcess: ChildProcess | null = null
let timerInterval: NodeJS.Timeout | null = null
let startTime: number | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 850,
    height: 600,
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

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))
  ipcMain.handle('dialog:openFile',async()=>{
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'] // 指定只选择文件
    })
    if (!canceled) {
      return filePaths[0] // 返回用户选择的第一个文件路径
    }
    return null // 如果用户取消了选择，返回 null
  })
  ipcMain.handle('shell:executeFile',async(_event,filePath:string)=>{
    if (childProcess) {
      return { success: false, message: '已有另一个应用在运行中。' }
    }
    try {
      // 使用 spawn 启动进程
      childProcess = spawn(filePath, [], { stdio: 'ignore' })
      startTime = Date.now()

      // 监听进程的 'error' 事件 (例如，文件未找到)
      childProcess.on('error', (err) => {
        console.error(`启动子进程失败: ${err.message}`)
        childProcess = null // 清理
      })

      // 监听进程的 'close' 事件 (当应用关闭时触发)
      childProcess.on('close', (code) => {
        console.log(`子进程已退出，退出码：${code}`)
        if (timerInterval) {
          clearInterval(timerInterval) // 停止计时器
        }
        // 向前端发送进程已停止的信号
        const finalElapsedTime = startTime ? Date.now() - startTime : 0
        mainWindow?.webContents.send('timer:stopped', { code, finalElapsedTime })
        
        // 清理状态
        childProcess = null
        timerInterval = null
        startTime = null
      })

      // 启动成功，现在设置一个每秒更新一次的定时器
      timerInterval = setInterval(() => {
        if (startTime) {
          const elapsedTime = Date.now() - startTime
          // 每秒向前端发送当前经过的时间
          mainWindow?.webContents.send('timer:update', elapsedTime)
        }
      }, 1000)

      return { success: true } // 表示启动成功
    } catch (err: any) {
      console.error(`执行文件时发生异常: ${err.message}`)
      return { success: false, message: err.message }
    }
    // try {
    //   const error = await shell.openPath(filePath);
    //   if (error) {
    //     return {success:false ,message:error}
    //   }
    //   return {success:true,message:'运行成功'}      
    // } catch(e){
    //   return {success:false,message:e}
    // } 
  })

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
