import { Banners, Game } from '@renderer/types/Game'
import { useEffect, useRef, useState } from 'react'
import GameCardActions from './Action'
import GameCardData from './CardData'
import useGameStore from '@renderer/store/GameStore'
import { createPortal } from 'react-dom'
import Selector from '../GameModeSelector/Selector'
import { RestTimeContent } from '../ModalContent/RestTimeContent'
import { FaArrowUp, FaPersonWalkingArrowRight } from 'react-icons/fa6'
import { FaGithub, FaList, FaTools } from 'react-icons/fa'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { toast } from 'react-hot-toast'
import { VscAdd } from 'react-icons/vsc'

import EmptyBox from '@renderer/assets/emptyBox.png'
import builtinBackground from '@renderer/assets/background.jpg'
import {
  DEFAULT_BANNER_REL,
  PLACEHOLDER_BANNER,
  resolveBannerSrc
} from '@renderer/util/bannerSrc'
import {
  useAppBackgrounds,
  useDefaultBanners
} from '@renderer/api/queries/queries.settings'

import {
  useCategoryGames,
  useGameBanner,
  useGameList,
  useSearchGames
} from '@renderer/api/queries/queries.gameList'

/** 单张游戏卡片：封面入场 + hover 侧栏 stagger（原 motion variants） */
const GameCardItem = ({
  game,
  src,
  onRefresh
}: {
  game: Game
  src: string
  onRefresh: () => void
}) => {
  const imgRef = useRef<HTMLImageElement>(null)
  const layersRef = useRef<(HTMLDivElement | null)[]>([])

  useGSAP(() => {
    if (!imgRef.current) return
    gsap.fromTo(
      imgRef.current,
      { opacity: 0, x: 100 },
      { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out' }
    )
    // 侧栏初始隐藏在右侧
    gsap.set(layersRef.current.filter(Boolean), { x: 100, opacity: 0 })
  }, [])

  const handleEnter = () => {
    gsap.to(layersRef.current.filter(Boolean), {
      x: 0,
      opacity: 1,
      duration: 0.35,
      stagger: 0.1,
      ease: 'power2.out'
    })
  }

  const handleLeave = () => {
    gsap.to(layersRef.current.filter(Boolean), {
      x: 100,
      opacity: 0,
      duration: 0.25,
      stagger: 0.05,
      ease: 'power2.in'
    })
  }

  return (
    <div className="flex-center flex-col p-4">
      <div className="flex flex-row">
        <div
          className="group relative ml-36 h-70 w-120"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          {/* 封面图 */}
          <img
            ref={imgRef}
            src={src}
            alt="banner图"
            className="h-70 w-120 rounded-2xl border-2 border-white object-cover object-center"
            onError={(e) => {
              // 文件缺失时回退到占位图
              if (e.currentTarget.src !== PLACEHOLDER_BANNER) {
                e.currentTarget.src = PLACEHOLDER_BANNER
              }
            }}
          />
          {/* 圆形遮罩层 */}
          <div
            ref={(el) => {
              layersRef.current[0] = el
            }}
            className="pointer-events-none absolute top-0 right-0 h-70 w-64 rounded-l-[20px] rounded-r-2xl bg-stone-600/75 p-5"
          />
          <div
            ref={(el) => {
              layersRef.current[1] = el
            }}
            className="pointer-events-none absolute top-0 right-0 h-70 w-62 rounded-l-[20px] rounded-r-2xl bg-stone-700/75 p-5"
          />
          <div
            ref={(el) => {
              layersRef.current[2] = el
            }}
            className="absolute top-0 right-0 z-20 h-70 w-60 rounded-l-[20px] rounded-r-2xl border-r-2 border-white bg-stone-800/75 p-5"
          >
            <GameCardData game={game} />
            <GameCardActions game={game} onRefresh={onRefresh} />
          </div>
        </div>
        {/* 一个阻挡的块，防止触发隐藏的动画元素 */}
        <div className="z-30 h-70 w-30 bg-amber-300 opacity-0"></div>
      </div>
    </div>
  )
}

const GameCards = () => {
  // #region 状态管理
  // 控制是否显示休息时间弹窗
  const [showRestTimeModal, setShowRestTimeModal] = useState(false)
  //游戏状态
  const gameState = useGameStore((state) => state.gameState)
  // 当前选择的分类 - 从全局状态获取
  const selectedCategory = useGameStore((state) => state.selectedCategory)
  const setSelectedCategory = useGameStore((state) => state.setSelectedCategory)
  // 分类菜单展开状态
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  // 控制分类菜单是否渲染在 DOM 中（收起动画结束后再卸载）
  const [shouldRenderCategories, setShouldRenderCategories] = useState(false)
  const categoryItemsRef = useRef<HTMLButtonElement[]>([])
  const categoryAnimRef = useRef<gsap.core.Tween | null>(null)
  //搜索关键词
  const keyword = useGameStore((state) => state.searchKeyword)
  // #endregion

  // 获取数据
  const { data: bannerListData, refetch: refetchBannerList } = useGameBanner()
  const { data: gameListData, refetch: refetchGameList } = useGameList()
  const { data: searchResults, refetch: refetchSearchResults } = useSearchGames(keyword)
  const { data: categoryResults, refetch: refetchCategoryResults } =
    useCategoryGames(selectedCategory)
  const { data: defaultBannerState } = useDefaultBanners()
  const selectedDefaultRel = defaultBannerState?.selectedRelativePath ?? null
  const { data: appBackgroundState } = useAppBackgrounds()
  const backgroundUrl = appBackgroundState?.selectedRelativePath
    ? `lop://${appBackgroundState.selectedRelativePath.replace(/\\/g, '/')}`
    : builtinBackground

  //搜索结果 > 分类游戏 > 游戏列表
  const List = searchResults ? searchResults : categoryResults ? categoryResults : gameListData

  // 全部刷新
  const refetch = () => {
    refetchGameList()
    refetchBannerList()
    if (keyword) refetchSearchResults()
    if (selectedCategory) refetchCategoryResults()
  }

  useEffect(() => {
    //放置打开休息界面监听器
    window.api.onOpenRestTimeModal(() => {
      setShowRestTimeModal(true)
    })
    //退出主页时移除监听器
    return () => {
      window.api.offOpenRestTimeModal()
    }
  }, [])

  //添加游戏 --
  const handleAddGame = async () => {
    const path = await window.api.openFile()
    if (!path) return
    const defaultName = path.split('\\').pop()?.replace('.exe', '') || '新游戏'
    try {
      const gameInitData = await window.api.addGame({
        gameName: defaultName,
        launchPath: path
      })
      // 默认封面使用应用内资源；DB 只存标记路径，展示时走 resolveBannerSrc
      await window.api.addBanner({
        gameId: gameInitData.id,
        imagePath: 'null',
        relativePath: DEFAULT_BANNER_REL
      })
      toast.success(`${defaultName} 已添加`)
      refetch()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      console.log(message)
      toast.error(`添加游戏失败: ${message}`)
    }
  }

  //进入休息状态
  const enterRestMode = () => {
    window.api.setResting(true)
  }

  // 打开时先挂载分类项，再在下一帧做向左展开动画
  useEffect(() => {
    if (isCategoryOpen) {
      setShouldRenderCategories(true)
    }
  }, [isCategoryOpen])

  useGSAP(() => {
    const items = categoryItemsRef.current.filter(Boolean)
    if (!items.length) return

    categoryAnimRef.current?.kill()

    if (isCategoryOpen && shouldRenderCategories) {
      // 从分类按钮一侧（右）向左依次展开
      categoryAnimRef.current = gsap.fromTo(
        items,
        { opacity: 0, x: 28, scale: 0.88 },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.32,
          stagger: { each: 0.07, from: 'end' },
          ease: 'back.out(1.6)'
        }
      )
    } else if (!isCategoryOpen && shouldRenderCategories) {
      // 从左向右依次收回（靠近按钮的先收）
      categoryAnimRef.current = gsap.to(items, {
        opacity: 0,
        x: 20,
        scale: 0.9,
        duration: 0.2,
        stagger: { each: 0.05, from: 'end' },
        ease: 'power2.in',
        onComplete: () => setShouldRenderCategories(false)
      })
    }
  }, [isCategoryOpen, shouldRenderCategories])

  const toggleCategory = () => {
    setIsCategoryOpen((open) => !open)
  }

  const handleCategoryChange = (category: 'all' | 'playing' | 'archived') => {
    setSelectedCategory(category)
    setIsCategoryOpen(false)
  }
  // 获取封面图路径（默认标记 → 设置中心选中的封面；自定义 → lop://userData）
  const getSrc = (game: Game) => {
    const relativePath = bannerListData?.find((i: Banners) => i.game_id === game.id)?.relative_path
    return resolveBannerSrc(relativePath, selectedDefaultRel)
  }

  const hoverScale = (el: HTMLElement, scale: number) => {
    gsap.to(el, { scale, duration: 0.2, ease: 'power2.out' })
  }

  return (
    // flex-1 撑满滚动视口；pb 预留右下角工具条高度，避免最后一张卡片被挡住
    <div
      className="relative flex min-h-dvh w-full flex-1 flex-col bg-cover bg-fixed bg-center pb-28"
      style={{ backgroundImage: `url("${backgroundUrl}")` }}
    >
      {/* 空列表提示 */}
      {List?.length === 0 && (
        <div className="flex-center mt-32 flex-col items-center justify-center gap-4">
          <div className="rounded-full bg-white/60 p-4 shadow-md">
            <img src={EmptyBox} alt="empty" className="h-32 w-32 object-contain" />
          </div>
          <p className="mt-5 text-2xl text-white">仓库为空 , 快去添加游戏吧！</p>
        </div>
      )}
      {/* 游戏模式选择器 */}
      <div className="fixed top-1/2 left-0 z-40 w-40 -translate-y-1/2">
        <Selector />
      </div>
      {/* 主动休息按钮 */}
      {gameState === 'run' && (
        <div className="fixed top-17 right-0 z-50 rounded-l-2xl border border-gray-300 bg-white px-2 py-2 shadow-md">
          <button
            onClick={() => enterRestMode()}
            className="flex cursor-pointer flex-row items-center"
          >
            <FaPersonWalkingArrowRight className="text-3xl text-gray-700" />
            <p className="ml-2">休息</p>
          </button>
        </div>
      )}
      {/* GitHub 按钮 */}
      <div className="fixed bottom-8 left-4 z-50 rounded-2xl border border-gray-300/50 bg-white px-2 py-2 shadow-md">
        <button
          onClick={() => window.open('https://github.com/345jr/LopGameBox', '_blank')}
          className="flex cursor-pointer flex-row items-center"
          title="打开 GitHub 仓库"
        >
          <FaGithub className="text-xl text-gray-700" />
        </button>
      </div>

      {/* DevTools 调试按钮 */}
      <div className="fixed bottom-20 left-4 z-50 rounded-2xl border border-gray-300/50 bg-white px-2 py-2 shadow-md">
        <button
          onClick={async () => {
            try {
              await window.api.openDevTools()
              toast.success('DevTools 打开成功')
            } catch {
              toast.error('DevTools 打开失败')
            }
          }}
          className="flex cursor-pointer flex-row items-center"
          title="打开开发者工具"
        >
          <FaTools className="text-lg text-gray-700" />
        </button>
      </div>
      {/* 右下角工具条：分类（向左展开） | 添加游戏 | 回到顶部 — 统一高度/圆角/图标 */}
      <div className="fixed right-4 bottom-8 z-50 flex flex-row items-center gap-2">
        {shouldRenderCategories && (
          <div className="flex flex-row items-center gap-2">
            {(
              [
                { key: 'playing', label: '攻略中' },
                { key: 'archived', label: '已归档' },
                { key: 'all', label: '全部' }
              ] as const
            ).map((item, index) => (
              <button
                key={item.key}
                ref={(el) => {
                  if (el) categoryItemsRef.current[index] = el
                }}
                onClick={() => handleCategoryChange(item.key)}
                className={`inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-gray-300/50 px-3.5 text-sm leading-none shadow-md transition-colors ${
                  selectedCategory === item.key
                    ? 'bg-blue-100 text-gray-800 hover:bg-blue-200'
                    : 'bg-white text-gray-700 hover:bg-blue-100'
                }`}
                style={{ opacity: 0 }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={toggleCategory}
          onMouseEnter={(e) => hoverScale(e.currentTarget, 1.05)}
          onMouseLeave={(e) => hoverScale(e.currentTarget, 1)}
          className={`inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-gray-300/50 px-3.5 text-sm leading-none shadow-md transition-colors ${
            isCategoryOpen
              ? 'bg-blue-100 text-gray-800 hover:bg-blue-200'
              : 'bg-white text-gray-700 hover:bg-blue-100'
          }`}
          title="游戏分类"
        >
          <FaList className="size-4 shrink-0" />
          <span>游戏分类</span>
        </button>

        <button
          onClick={handleAddGame}
          onMouseEnter={(e) => hoverScale(e.currentTarget, 1.05)}
          onMouseLeave={(e) => hoverScale(e.currentTarget, 1)}
          className="inline-flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-gray-300/50 bg-white px-3.5 text-sm leading-none text-gray-700 shadow-md transition-colors hover:bg-blue-100"
          title="添加游戏"
        >
          <VscAdd className="size-4 shrink-0" />
          <span>添加游戏</span>
        </button>

        <button
          onClick={() =>
            document.getElementById('app-scroll-root')?.scrollTo({ top: 0, behavior: 'smooth' })
          }
          onMouseEnter={(e) => hoverScale(e.currentTarget, 1.05)}
          onMouseLeave={(e) => hoverScale(e.currentTarget, 1)}
          className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-gray-300/50 bg-white text-gray-700 shadow-md transition-colors hover:bg-blue-100"
          title="回到顶部"
        >
          <FaArrowUp className="size-4" />
        </button>
      </div>
      {/* 休息模态框 */}
      {showRestTimeModal &&
        createPortal(
          <RestTimeContent onClose={() => setShowRestTimeModal(false)} />,
          document.body
        )}
      {/* 游戏卡片 */}
      {List?.map((game) => (
        <GameCardItem key={game.id} game={game} src={getSrc(game)} onRefresh={refetch} />
      ))}
      {/* 底部模糊层 */}
      <div className="pointer-events-none fixed top-9/10 right-0 bottom-0 left-0 z-10 bg-linear-to-b from-transparent to-gray-600/95"></div>
    </div>
  )
}

export default GameCards
