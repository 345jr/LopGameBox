
import { useEffect, useState } from 'react';
function formatTime(milliseconds: number): string {
  if (milliseconds < 0) milliseconds = 0
  const totalSeconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  const pad = (num: number) => num.toString().padStart(2, '0')
  
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

function App(): React.JSX.Element {
  const [filePath, setFilePath] = useState<string | null>(null);
  const [execResult, setExecResult] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [message, setMessage] = useState<string>('');

  const dianji = async () => {
    const path = await window.api.openFile();
    setFilePath(path);
  };
  const runFile = async (): Promise<void> => {
    if (!filePath) {
      alert('请先选择一个文件！');
      return;
    }
    const result = await window.api.executeFile(filePath);
    if (result.success) {
      setExecResult('✅ 文件已成功启动！');
      setIsRunning(true);
      setMessage('✅ 应用正在运行中...')
      setElapsedTime(0); // 重置计时器显示
    } else {
      setIsRunning(false);
      setExecResult(`❌ 启动失败: ${result.message}`);
    }
  };
  useEffect(() => {
    // 监听计时器更新
    window.api.onTimerUpdate((time) => {
      setElapsedTime(time);
    });

    // 监听进程停止
    window.api.onTimerStopped((result) => {
      setIsRunning(false);
      setMessage(
        `应用已关闭。总运行时间: ${formatTime(result.finalElapsedTime)} (退出码: ${result.code})`,
      );
    });
  }, []);
  return (
    <>
      <button onClick={dianji} disabled={isRunning} className="text-amber-500">
        选择文件
      </button>
      <div>
        {filePath && (
          <div>
            <p>已选择的文件:</p>
            <p>{filePath}</p>
          </div>
        )}
        {filePath?.toLowerCase().endsWith('.exe') && (
          <button
            onClick={runFile}
            disabled={isRunning}
            className="text-green-500"
          >
            {isRunning ? '运行中' : '运行此文件'}
          </button>
        )}
        {execResult && <p>{execResult}</p>}
        <div>
          {isRunning && <h2>运行时间: {formatTime(elapsedTime)}</h2>}
          {message && <p>{message}</p>}
        </div>
      </div>
    </>
  );
}
export default App
