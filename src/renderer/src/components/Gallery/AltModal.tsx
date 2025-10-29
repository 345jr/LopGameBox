import { Dispatch, SetStateAction } from 'react';

type AltModalProps = {
  show: boolean;
  altText: string;
  setAltText: Dispatch<SetStateAction<string>>;
  isEditing: boolean;
  onClose: () => void;
  onSave: () => Promise<void> | void;
  onDelete: () => Promise<void> | void;
  onToggleEdit: () => void;
};

const AltModal = ({
  show,
  altText,
  setAltText,
  isEditing,
  onClose,
  onSave,
  onDelete,
  onToggleEdit,
}: AltModalProps) => {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-5000 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg bg-white text-black shadow-2xl ring-1 ring-black/10"
        onClick={(e) => e.stopPropagation()}
      >
        {isEditing ? (
          <div className="relative">
            <div className="border-l-4 border-black/20 bg-white px-8 py-12">
              <p className="text-center font-serif text-lg leading-relaxed text-black italic">
                "{altText}"
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3">
              <button
                onClick={onToggleEdit}
                className="cursor-pointer text-sm text-gray-600 transition hover:text-black hover:underline"
              >
                编辑内容
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onDelete}
                  className="cursor-pointer rounded bg-transparent px-2 py-1 text-sm text-gray-600 transition hover:text-red-600"
                  title="删除描述"
                >
                  删除
                </button>
                <button
                  onClick={onClose}
                  className="cursor-pointer rounded border border-gray-200 px-2 py-1 text-sm text-gray-700 transition hover:bg-gray-50"
                  title="关闭"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 text-black">
            <h3 className="mb-4 text-lg font-semibold text-black">编辑描述</h3>
            <textarea
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-serif text-black focus:border-black/50 focus:ring-2 focus:ring-black/10 focus:outline-none"
              rows={4}
              placeholder="在此输入图片描述..."
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="cursor-pointer rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  await onSave();
                }}
                className="cursor-pointer rounded bg-black px-4 py-2 text-sm text-white transition hover:bg-gray-900"
              >
                保存
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AltModal;
