'use client'
import dynamic from 'next/dynamic'
import loadingAnimData from '../../public/animations/loading.json'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

interface Props {
  size?: number
  label?: string
}

export default function LoadingDots({ size = 80, label = 'Анализирую...' }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '8px 0' }}>
      <div style={{ width: size, height: size }}>
        <Lottie animationData={loadingAnimData} loop />
      </div>
      {label && (
        <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic' }}>
          {label}
        </span>
      )}
    </div>
  )
}
