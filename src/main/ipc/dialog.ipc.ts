import { dialog, ipcMain } from 'electron'

export function registerDialogIpc(): void {
  ipcMain.handle('dialog:openFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile']
    })
    if (!canceled) return filePaths[0]
    return null
  })

  ipcMain.handle('dialog:openFolder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (!canceled) return filePaths[0]
    return null
  })
}
