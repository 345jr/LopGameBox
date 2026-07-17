import { useCallback, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

/**
 * 模态框入场 / 出场动画（遮罩淡入 + 面板上浮缩放）。
 * 关闭时先播完出场动画再调用 onClose，避免父级立刻卸载。
 */
export function useModalMotion(onClose: () => void) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closingRef = useRef(false)

  useGSAP(() => {
    const overlay = overlayRef.current
    const panel = panelRef.current
    if (!overlay || !panel) return

    gsap.set(overlay, { opacity: 0 })
    gsap.set(panel, { opacity: 0, y: 16, scale: 0.96 })
    gsap.to(overlay, { opacity: 1, duration: 0.2, ease: 'power2.out' })
    gsap.to(panel, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.28,
      ease: 'power2.out'
    })

    return () => {
      gsap.killTweensOf([overlay, panel])
    }
  }, [])

  const requestClose = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true

    const overlay = overlayRef.current
    const panel = panelRef.current
    if (!overlay || !panel) {
      onClose()
      return
    }

    gsap.killTweensOf([overlay, panel])
    gsap.to(overlay, { opacity: 0, duration: 0.15, ease: 'power2.in' })
    gsap.to(panel, {
      opacity: 0,
      y: 10,
      scale: 0.97,
      duration: 0.15,
      ease: 'power2.in',
      onComplete: () => onClose()
    })
  }, [onClose])

  return { overlayRef, panelRef, requestClose }
}
