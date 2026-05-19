'use client'
import { useEffect } from 'react'
import Lottie from 'lottie-react'

import passAnim from '../../public/animations/pass.json'
import reworkAnim from '../../public/animations/rework.json'
import failAnim from '../../public/animations/fail.json'

type Verdict = 'pass' | 'fail' | 'rework'

const ANIMS: Record<Verdict, object> = {
  pass: passAnim,
  rework: reworkAnim,
  fail: failAnim,
}

const COLORS: Record<Verdict, string> = {
  pass: 'var(--green)',
  rework: 'var(--yellow)',
  fail: 'var(--red)',
}

const LABELS: Record<Verdict, string> = {
  pass: 'Зачёт',
  rework: 'Доработать',
  fail: 'Незачёт',
}

const AUTO_CLOSE_MS: Record<Verdict, number> = {
  pass: 1800,
  rework: 1400,
  fail: 1400,
}

interface Props {
  verdict: Verdict
  onDone: () => void
}

export default function VerdictAnim({ verdict, onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, AUTO_CLOSE_MS[verdict])
    return () => clearTimeout(t)
  }, [verdict, onDone])

  return (
    <div
      onClick={onDone}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        cursor: 'pointer',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div style={{ textAlign: 'center', pointerEvents: 'none', userSelect: 'none' }}>
        <div style={{ width: 220, height: 220, margin: '0 auto' }}>
          <Lottie animationData={ANIMS[verdict]} loop={false} />
        </div>
        <div style={{
          fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em',
          color: COLORS[verdict], marginTop: 4,
          textShadow: `0 0 32px ${COLORS[verdict]}88`,
        }}>
          {LABELS[verdict]}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>
          нажмите, чтобы продолжить
        </div>
      </div>
    </div>
  )
}
