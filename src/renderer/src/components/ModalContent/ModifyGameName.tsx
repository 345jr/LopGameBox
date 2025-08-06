import { useRef } from 'react';
export default function ModalContent({ onClose , gameId , updata }: { onClose: () => void, gameId: number, updata: React.Dispatch<React.SetStateAction<any>> }) {
  const inputRef = useRef<HTMLInputElement>(null);
    const handleConfirm = async () => {
        const newName = inputRef.current?.value;
        if (newName) {
        // 调用修改游戏名的API
        await window.api.modifyGameName(gameId, newName);
        //重新获取数据
        const gameList = await window.api.getAllGames();
        updata(gameList);
        onClose();
        } else {
        alert('游戏名不能为空');
        }
    };
  return (
    // 遮罩层
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800/30"
      onClick={onClose}
    >
      {/* 模态框主体 */}
      <div
        className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
        // 阻止点击内容时关闭
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-800">修改游戏名</h3>
        <input
          ref={inputRef}
          type="text"
          placeholder="请输入新游戏名"
          className="mb-4 w-full rounded border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded bg-gray-300 px-4 py-2 text-gray-800 transition hover:bg-gray-400"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600"
          >
            确定
          </button>
        </div>

      </div>
    </div>
  );
}
