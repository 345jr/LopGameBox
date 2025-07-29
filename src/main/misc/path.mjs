import path from "path";
const filePath = "C:\Galgame\game-box\kakenuke_R18\kakenuke.exe"
const formatPath = filePath.replaceAll('"', '').replaceAll('\\', '/');
console.log(formatPath)
const dirPath = path.dirname(formatPath);
console.log(dirPath);
