import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { TextPlugin } from 'gsap/TextPlugin'
import { useEffect, useRef, useState } from 'react'
import { FaSearch } from 'react-icons/fa'
import {
  VscChromeMinimize,
  VscChromeMaximize,
  VscChromeRestore,
  VscChromeClose,
  VscTriangleDown
} from 'react-icons/vsc'
import { Link, useNavigate } from 'react-router-dom'

import useGameStore from '@renderer/store/GameStore'
import { formatTime } from '@renderer/util/timeFormat'
import logo from '../assets/lopgame.png'

const NavHeader = () => {
  //#region 状态管理
  // 搜索输入框的值
  const [inputRef, setInputRef] = useState<string>('')
  // 游戏运行的时间
  const gameTime = useGameStore((state) => state.gameTime)
  // 游戏当前的运行状态（run stop null）
  const gameState = useGameStore((state) => state.gameState)
  // 控制 Logo 动画的激活状态
  const [active, setActive] = useState(false)
  // 开关模式选择器
  const setGameModeSelector = useGameStore((state) => state.setGameModeSelector)
  // 当前游戏模式
  const gameMode = useGameStore((state) => state.gameMode)
  //打字机效果
  const typewriterRef = useRef<HTMLParagraphElement>(null)
  // 窗口是否最大化状态
  const [isMaximized, setIsMaximized] = useState(false)
  // 用于导航回到主页
  const navigate = useNavigate()
  // 搜索keyword
  const setSearchKeyword = useGameStore((state) => state.setSearchKeyword)
  // Logo / 指针
  const logoRef = useRef<HTMLImageElement>(null)
  const pointerRef = useRef<HTMLDivElement>(null)
  //#endregion 状态管理

  //返回到主页
  const handleBackToHome = () => {
    navigate('/')
  }

  //#region 动画配置

  gsap.registerPlugin(TextPlugin)
  //打字机效果
  useGSAP(() => {
    if (typewriterRef.current) {
      gsap.fromTo(
        typewriterRef.current,
        { text: '' },
        { text: '暂无游戏运行', duration: 1, ease: 'none' }
      )
    }
  })
  // 流动渐变文字动画
  useGSAP(() => {
    gsap.to('.GSAPanimate-modeText', {
      backgroundPosition: '200% center',
      duration: 3,
      ease: 'none',
      repeat: -1
    })
  })
  const flipperRef = useRef<HTMLDivElement>(null)
  // 文字翻转效果
  useGSAP(
    () => {
      if (!flipperRef.current) return
      const tl = gsap.timeline({ repeat: -1 })
      // 背面停留10秒,正面停留10秒
      tl.to(flipperRef.current, { rotationY: 180, duration: 1 })
        .to(flipperRef.current, {}, '+=10')
        .to(flipperRef.current, { rotationY: 0, duration: 1 })
        .to(flipperRef.current, {}, '+=10')
      return () => tl.kill()
    },
    { scope: flipperRef, dependencies: [gameState] }
  )

  // Logo 旋转（模式选择器开关）
  useGSAP(
    () => {
      if (!logoRef.current) return
      gsap.to(logoRef.current, {
        rotation: active ? 90 : 0,
        duration: 0.4,
        ease: 'power2.out'
      })
    },
    { dependencies: [active] }
  )
  //#endregion

  // 处理模糊查询
  const handleSearch = async (keyword: string) => {
    setSearchKeyword(keyword)
  }

  // 指针跟随导航项
  const movePointer = (x: number, y: number, rotate: number) => {
    if (!pointerRef.current) return
    gsap.to(pointerRef.current, {
      x,
      y,
      rotation: rotate,
      duration: 0.35,
      ease: 'power2.out'
    })
  }

  const hoverScale = (el: HTMLElement, scale: number) => {
    gsap.to(el, { scale, duration: 0.2, ease: 'power2.out' })
  }

  // 窗口控制函数
  const handleMinimize = () => {
    window.api.minimizeWindow()
  }
  const handleMaximize = async () => {
    await window.api.maximizeWindow()
    const maximized = await window.api.isWindowMaximized()
    setIsMaximized(maximized)
  }
  const handleClose = () => {
    window.api.closeWindow()
  }

  // 初始化窗口最大化状态
  useEffect(() => {
    const checkMaximized = async () => {
      const maximized = await window.api.isWindowMaximized()
      setIsMaximized(maximized)
    }
    checkMaximized()
  }, [])

  //游戏模式名中文映射
  const gameModeMap: { [key: string]: string } = {
    Normal: '普通模式',
    Fast: '快速模式',
    Afk: '挂机模式',
    Test: '测试模式',
    Infinity: '沉浸模式'
  }
  // 游戏模式颜色映射
  const gameModeColorMap: { [key: string]: string } = {
    Normal: 'from-lime-500 via-green-500 to-emerald-500',
    Fast: 'from-orange-500 via-amber-500 to-yellow-400',
    Afk: 'from-blue-500 via-cyan-500 to-sky-400',
    Test: 'from-purple-500 via-violet-500 to-fuchsia-500',
    Infinity: 'from-rose-500 via-pink-500 to-purple-500'
  }

  return (
    <div
      className="relative border-b-2 border-black"
      style={
        {
          display: 'grid',
          gridTemplateColumns: 'auto auto auto auto auto 1fr auto auto',
          WebkitAppRegion: 'drag',
          appRegion: 'drag'
        } as React.CSSProperties
      }
    >
      {/* Logo 图标 - 固定宽度 */}
      <div
        className="flex items-center justify-center px-3"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <img
          ref={logoRef}
          src={logo}
          alt="logo"
          className="w-12 cursor-pointer rounded-2xl"
          onClick={() => {
            setActive(!active)
            setGameModeSelector()
          }}
          onMouseEnter={() => {
            movePointer(-50, 20, 90)
          }}
        />
      </div>

      {/* 添加游戏按钮 - 固定宽度 */}
      <div
        className="relative flex items-center justify-center"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <div ref={pointerRef} className="absolute bottom-9 left-8 z-50">
          <VscTriangleDown />
        </div>
        <button
          onClick={handleBackToHome}
          className="cursor-pointer px-4 text-stone-900 hover:text-stone-600"
          onMouseEnter={(e) => hoverScale(e.currentTarget, 1.1)}
          onMouseLeave={(e) => hoverScale(e.currentTarget, 1)}
          onMouseMove={() => {
            movePointer(10, 0, 0)
          }}
        >
          游戏列表
        </button>
      </div>

      {/* 统计面板 - 固定宽度 */}
      <div
        className="flex items-center justify-center"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        onMouseEnter={(e) => hoverScale(e.currentTarget, 1.1)}
        onMouseLeave={(e) => hoverScale(e.currentTarget, 1)}
      >
        <Link
          to={'/dashboard'}
          className="cursor-pointer px-4 text-stone-900 hover:text-stone-600"
          onMouseMove={() => {
            movePointer(105, 0, 0)
          }}
        >
          统计面板
        </Link>
      </div>

      {/* 设置中心 - 固定宽度 */}
      <div
        className="flex items-center justify-center"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        onMouseEnter={(e) => hoverScale(e.currentTarget, 1.1)}
        onMouseLeave={(e) => hoverScale(e.currentTarget, 1)}
      >
        <Link
          to={'/setting'}
          className="cursor-pointer px-4 text-stone-900 hover:text-stone-600"
          onMouseMove={() => {
            movePointer(200, 0, 0)
          }}
        >
          设置中心
        </Link>
      </div>

      {/* 搜索区域 - 固定宽度 */}
      <div
        className="relative flex items-center justify-center px-3"
        onMouseEnter={() => {
          movePointer(250, 16, -90)
        }}
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <div className="flex h-8 w-40 items-center justify-center rounded-full border border-gray-300 bg-white shadow-sm">
          <input
            type="text"
            className="w-32 bg-transparent text-gray-700 focus:outline-none"
            value={inputRef}
            onChange={(e) => setInputRef(e.target.value)}
          />
        </div>
        <button
          onClick={() => handleSearch(inputRef)}
          className="absolute right-5 cursor-pointer text-stone-900 hover:text-stone-600"
        >
          <FaSearch className="text-xl" />
        </button>
      </div>

      {/* 可拖拽区域 - 自适应宽度 (1fr) */}
      <div className="flex min-w-0 items-center justify-center p-1">
        <div
          className="grow rounded-lg border-2 border-dashed border-gray-400 p-3"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <p className="h-full text-center text-xs whitespace-nowrap text-gray-400 select-none">
            拖拽区域
          </p>
        </div>
      </div>

      {/* 游戏运行状态 - 固定宽度 */}
      <div
        className="flex items-center justify-center border-l-2 border-dashed border-l-black px-3"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <div className="relative py-2">
          {gameState === 'run' ? (
            <>
              {/* 文字翻转效果 */}
              <div ref={flipperRef} className="relative transform-3d">
                {/* 文字正面 */}
                <p className="absolute text-xs whitespace-nowrap backface-hidden">
                  {formatTime(gameTime) && '游戏运行中'}
                </p>
                {/* 文字背面 */}
                <p
                  className={`absolute left-3 rotate-y-180 bg-gradient-to-bl text-sm whitespace-nowrap backface-hidden ${
                    gameModeColorMap[gameMode]
                  } bg-clip-text text-transparent`}
                >
                  {gameModeMap[gameMode] || '...'}
                </p>
              </div>
              <p className="mt-3.5 whitespace-nowrap">{formatTime(gameTime) || '...'}</p>
              {/* 绿色闪烁灯 */}
              <span className="absolute top-1.5 right-1.5 inline-flex h-3 w-3 animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="absolute top-2 right-2 inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </>
          ) : gameState === 'stop' ? (
            <>
              <p className="text-xs whitespace-nowrap">{formatTime(gameTime) && '运行时间'}</p>
              <p className="whitespace-nowrap">
                {formatTime(gameTime) || '...'}
                <span className="absolute top-2 right-2 inline-flex h-2 w-2 rounded-full bg-red-500"></span>
              </p>
            </>
          ) : (
            <>
              <p ref={typewriterRef} className="text-xs whitespace-nowrap">
                暂无游戏运行
              </p>
              <p
                style={{
                  backgroundSize: '200% 100%',
                  backgroundPosition: '0% center'
                }}
                className={`GSAPanimate-modeText bg-gradient-to-bl whitespace-nowrap ${
                  gameModeColorMap[gameMode]
                } bg-clip-text text-transparent`}
              >
                {gameModeMap[gameMode] || '...'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* 窗口控制按钮区域 - 固定宽度 */}
      <div
        className="flex items-center"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* 最小化按钮 */}
        <button
          onClick={handleMinimize}
          className="flex h-full items-center justify-center px-4 transition-colors duration-200 hover:bg-gray-200"
          aria-label="最小化"
        >
          <VscChromeMinimize className="text-lg" />
        </button>
        {/* 最大化/还原按钮 */}
        <button
          onClick={handleMaximize}
          className="flex h-full items-center justify-center px-4 transition-colors duration-200 hover:bg-gray-200"
          aria-label={isMaximized ? '还原' : '最大化'}
        >
          {isMaximized ? (
            <VscChromeRestore className="text-lg" />
          ) : (
            <VscChromeMaximize className="text-lg" />
          )}
        </button>
        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className="flex h-full items-center justify-center px-4 transition-colors duration-200 hover:bg-red-500 hover:text-white"
          aria-label="关闭"
        >
          <VscChromeClose className="text-lg" />
        </button>
      </div>
    </div>
  )
}
export default NavHeader
