import { useState } from 'react'
import { FaImage, FaTrash, FaSort } from 'react-icons/fa6'
import { VscClose } from 'react-icons/vsc'
import Masonry from 'react-responsive-masonry'
import Achievements from './Achievements'
import AltModal from './AltModal'
import toast from 'react-hot-toast'
import { PhotoProvider, PhotoView } from 'react-photo-view'
import { useGalleryList, useGalleryStats } from '@renderer/api/queries/queries.gallery'

export type GalleryProps = {
  gameId: number
  gameName?: string
  onClose: () => void
}

const Gallery = ({ gameId, gameName, onClose }: GalleryProps) => {
  const [showAltModal, setShowAltModal] = useState(false)
  const [currentSnapshotId, setCurrentSnapshotId] = useState<number | null>(null)
  const [altText, setAltText] = useState('')
  const [isEditingAlt, setIsEditingAlt] = useState(false)
  const [selectedSnapshots, setSelectedSnapshots] = useState<Set<number>>(new Set())
  const [isBatchDeleting, setIsBatchDeleting] = useState(false)
  const [sortNewestFirst, setSortNewestFirst] = useState(true)

  const gameIdNum = gameId
  const { data: statsData } = useGalleryStats(gameIdNum)
  const { data: snapshotList, refetch: refetchSnapshots } = useGalleryList(
    gameIdNum,
    sortNewestFirst
  )

  //添加图
  const addSnapshot = async () => {
    const path = await window.api.openFile()
    const targetPath = 'snapshot/'

    if (!path) return
    try {
      const result = await window.api.copyImages({
        origin: path,
        target: targetPath,
        gameName: `snapshot${Date.now()}`,
        oldFilePath: 'skip'
      })
      await window.api.addGameSnapshot({
        gameId: gameIdNum,
        imagePath: path,
        relativePath: result.relativePath
      })
      refetchSnapshots()
      toast.success('图片添加成功')
    } catch (error) {
      console.error('[Gallery] add images failed:', error)
      toast.error('图片添加失败')
    }
  }
  // 切换选择状态
  const toggleSelected = (id: number) => {
    setSelectedSnapshots((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  // 批量删除已选图片
  const batchDeleteSelected = async () => {
    if (selectedSnapshots.size === 0) return

    if (!confirm(`确定要删除 ${selectedSnapshots.size} 张图片吗？此操作不可恢复`)) return

    setIsBatchDeleting(true)
    try {
      // 把选中的 id 转为数组
      const ids = Array.from(selectedSnapshots)

      // 从 snapshotList 找到对应的 relative_path
      const tasks = ids.map(async (id) => {
        const snap = snapshotList?.find((s) => s.id === id)
        if (!snap) return
        // 删除数据库记录
        await window.api.delectSnapshot(id)
        // 删除对应文件
        await window.api.delectImages(snap.relative_path)
      })

      await Promise.all(tasks)

      toast.success(`已删除 ${ids.length} 张图片`)
      refetchSnapshots()
      setSelectedSnapshots(new Set())
    } catch (error) {
      console.error('[Gallery] batch delete failed:', error)
      toast.error('批量删除失败')
    } finally {
      setIsBatchDeleting(false)
    }
  }
  // ==================== ALT描述相关功能 ====================

  //打开ALT模态框
  const openAltModal = async (snapshotId: number) => {
    setCurrentSnapshotId(snapshotId)
    try {
      const alt = await window.api.getSnapshotAlt(snapshotId)
      if (alt) {
        setAltText(alt)
        setIsEditingAlt(true)
      } else {
        setAltText('')
        setIsEditingAlt(false)
      }
      setShowAltModal(true)
    } catch (error) {
      console.error('[Gallery] get alt failed:', error)
    }
  }

  //关闭ALT描述模态框
  const closeAltModal = () => {
    setShowAltModal(false)
    setCurrentSnapshotId(null)
    setAltText('')
    setIsEditingAlt(false)
  }

  //添加或更新ALT描述
  const handleSaveAlt = async () => {
    if (!currentSnapshotId || !altText.trim()) {
      alert('请输入描述信息')
      return
    }

    try {
      await window.api.updateSnapshotAlt(currentSnapshotId, altText.trim())
      closeAltModal()
      refetchSnapshots()
      toast.success('描述已保存')
    } catch {
      toast.error('保存描述失败')
    }
  }

  //删除ALT描述
  const handleDeleteAlt = async () => {
    if (!currentSnapshotId) return

    if (confirm('确定要删除这个描述吗?')) {
      try {
        await window.api.deleteSnapshotAlt(currentSnapshotId)
        closeAltModal()
        void refetchSnapshots()
        toast.success('描述已删除')
      } catch {
        toast.error('删除失败')
      }
    }
  }
  // ALT按钮组件
  const OverlayContent: React.FC<{ index: number }> = ({ index }) => {
    if (!snapshotList || !snapshotList[index]) return null
    return (
      <div className="fixed right-4 bottom-4 z-1200">
        <button
          onClick={() => openAltModal(snapshotList[index].id)}
          className="cursor-pointer rounded-md bg-black/60 px-3 py-2 text-white"
          aria-label={`ALT for snapshot ${snapshotList[index].id}`}
        >
          ALT
        </button>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-4 flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-xl"
      >
        {/* 标题栏 */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900">图集典藏 · 成就</h2>
            {gameName && (
              <p className="truncate text-sm text-gray-500" title={gameName}>
                {gameName}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            title="关闭"
            aria-label="关闭"
          >
            <VscClose className="text-2xl" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {!snapshotList ? (
            <div className="py-16 text-center text-gray-500">加载中...</div>
          ) : (
            <div className="grid grid-cols-5 gap-4">
              {/* 数据概览 */}
              <div className="col-span-5 rounded-lg bg-gray-100 p-3">
                <div className="flex flex-row flex-wrap gap-4 text-sm text-gray-800 sm:text-base">
                  <span>图片总数: {snapshotList.length || 0}</span>
                  <span>
                    成就完成: {statsData?.completed}/{statsData?.total}
                  </span>
                  <span>完成率: {statsData?.completionRate.toFixed(1)}%</span>
                </div>
              </div>

              {/* 瀑布流图墙 */}
              <div className="col-span-5 md:col-span-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-base font-medium">图集典藏</p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={addSnapshot}
                      className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-sm text-black hover:bg-gray-100"
                      aria-label="添加图片"
                      title="添加图片"
                    >
                      <FaImage className="inline text-sm" />
                      <span className="hidden sm:inline">添加</span>
                    </button>

                    <button
                      onClick={() => {
                        setSortNewestFirst((v) => !v)
                      }}
                      className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-sm text-black transition hover:bg-gray-100"
                      aria-label="切换排序"
                      title={sortNewestFirst ? '从新到旧' : '从旧到新'}
                    >
                      <FaSort className="inline text-sm" />
                      <span className="hidden sm:inline">
                        {sortNewestFirst ? '从新到旧' : '从旧到新'}
                      </span>
                    </button>

                    <button
                      onClick={batchDeleteSelected}
                      disabled={selectedSnapshots.size === 0 || isBatchDeleting}
                      className={`flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-sm text-black transition hover:bg-gray-100 ${
                        selectedSnapshots.size === 0 || isBatchDeleting
                          ? 'cursor-not-allowed opacity-50'
                          : ''
                      }`}
                      aria-label="批量删除已选图片"
                      title={
                        selectedSnapshots.size === 0 || isBatchDeleting
                          ? '无可删除的图片'
                          : `删除 ${selectedSnapshots.size} 张图片`
                      }
                    >
                      <FaTrash className="inline text-sm" />
                      <span className="hidden sm:inline">
                        {isBatchDeleting
                          ? '删除中...'
                          : `删除${selectedSnapshots.size > 0 ? ` (${selectedSnapshots.size})` : ''}`}
                      </span>
                    </button>
                  </div>
                </div>
                <PhotoProvider overlayRender={({ index }) => <OverlayContent index={index} />}>
                  <Masonry columnsCount={2} gutter="12px">
                    {snapshotList.map((i) => {
                      return (
                        <div key={i.id} className="group relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleSelected(i.id)
                            }}
                            className={`absolute top-2 right-2 z-30 transform rounded-full bg-black/60 p-1 text-white transition-all ${
                              selectedSnapshots.has(i.id)
                                ? 'scale-100 opacity-95'
                                : 'scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-95'
                            }`}
                            style={{ width: 32, height: 32 }}
                            aria-pressed={selectedSnapshots.has(i.id)}
                            title={selectedSnapshots.has(i.id) ? '已选中' : '选择'}
                          >
                            <span className="text-sm leading-none">
                              {selectedSnapshots.has(i.id) ? '✓' : '○'}
                            </span>
                          </button>

                          <PhotoView
                            key={i.id}
                            src={`lop://` + i.relative_path.replace(/\\/g, '/')}
                          >
                            <img
                              src={`lop://` + i.relative_path.replace(/\\/g, '/')}
                              alt=""
                              className="w-full cursor-pointer"
                            />
                          </PhotoView>
                        </div>
                      )
                    })}
                  </Masonry>
                </PhotoProvider>

                {snapshotList.length === 0 && (
                  <>
                    <div className="mt-8 text-center text-gray-500">暂无图片</div>
                    <div className="mt-2 text-center text-gray-500">
                      快去游戏中记录精彩瞬间吧!
                    </div>
                  </>
                )}
              </div>

              {/* 成就 */}
              <div className="col-span-5 md:col-span-2">
                <Achievements gameId={gameIdNum} />
              </div>
            </div>
          )}
        </div>

        {/* ALT描述模态框 */}
        <AltModal
          show={showAltModal}
          altText={altText}
          setAltText={setAltText}
          isEditing={isEditingAlt}
          onClose={closeAltModal}
          onSave={handleSaveAlt}
          onDelete={handleDeleteAlt}
          onToggleEdit={() => setIsEditingAlt(false)}
        />
      </div>
    </div>
  )
}

export default Gallery
