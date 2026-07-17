import { useState } from 'react'

type DeleteGameConfirmProps = {
  gameName: string
  onClose: () => void
  onConfirm: () => Promise<void> | void
}

/** 删除游戏确认框（精简） */
const DeleteGameConfirm = ({ gameName, onClose, onConfirm }: DeleteGameConfirmProps) => {
  const [deleting, setDeleting] = useState(false)

  const handleConfirm = async () => {
    if (deleting) return
    setDeleting(true)
    try {
      await onConfirm()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-game-title"
        onClick={(e) => e.stopPropagation()}
        className="mx-4 w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl"
      >
        <h2 id="delete-game-title" className="text-[15px] font-semibold tracking-tight text-gray-900">
          删除《{gameName}》？
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-gray-400">
          仅移除库内记录，本地文件不受影响
        </p>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="h-9 flex-1 cursor-pointer rounded-xl bg-gray-100 text-sm font-medium text-gray-600 transition hover:bg-gray-200 disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="h-9 flex-1 cursor-pointer rounded-xl bg-red-500 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
          >
            {deleting ? '…' : '删除'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteGameConfirm
