import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import type { RefObject } from 'react'

gsap.registerPlugin(useGSAP)

const CARD_SELECTOR = '[data-service-card]'

/**
 * Animazione ingresso a scaglioni + tilt al puntatore su elementi `data-service-card`
 * dentro il contenitore (stessa logica di LandingServiceProposals).
 */
export function useServiceCardTilt(containerRef: RefObject<HTMLElement | null>) {
  useGSAP(() => {
    const list = containerRef.current
    if (!list) return

    const cards = [...list.querySelectorAll<HTMLElement>(CARD_SELECTOR)]
    if (cards.length === 0) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const finePointer = window.matchMedia('(pointer: fine)').matches

    if (!reduceMotion) {
      gsap.from(cards, {
        opacity: 0,
        y: 32,
        duration: 0.58,
        stagger: 0.12,
        ease: 'power2.out',
      })
    }

    if (reduceMotion || !finePointer) return

    let active = true
    const cleanups: Array<() => void> = []

    for (const el of cards) {
      const rotX = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3.out' })
      const rotY = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3.out' })
      const xTo = gsap.quickTo(el, 'x', { duration: 0.42, ease: 'power3.out' })
      const yTo = gsap.quickTo(el, 'y', { duration: 0.42, ease: 'power3.out' })

      const onMove = (e: PointerEvent) => {
        if (!active) return
        const r = el.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width - 0.5
        const py = (e.clientY - r.top) / r.height - 0.5
        rotY(px * 11)
        rotX(-py * 9)
        xTo(px * 7)
        yTo(py * 7)
      }

      const onLeave = () => {
        if (!active) return
        rotX(0)
        rotY(0)
        xTo(0)
        yTo(0)
      }

      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerleave', onLeave)
      cleanups.push(() => {
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerleave', onLeave)
      })
    }

    return () => {
      active = false
      for (const fn of cleanups) fn()
      gsap.killTweensOf(cards)
    }
  }, { scope: containerRef })
}
