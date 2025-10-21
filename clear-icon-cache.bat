@echo off
echo 正在清除 Windows 图标缓存...
echo.

REM 结束 Windows 资源管理器进程
taskkill /f /im explorer.exe

REM 删除图标缓存文件
del /f /s /q /a "%LocalAppData%\IconCache.db"
del /f /s /q /a "%LocalAppData%\Microsoft\Windows\Explorer\iconcache*"
del /f /s /q /a "%LocalAppData%\Microsoft\Windows\Explorer\thumbcache*"

echo 图标缓存已清除
echo.
echo 正在重启资源管理器...
start explorer.exe

echo.
echo 完成！请重新构建应用程序。
pause
