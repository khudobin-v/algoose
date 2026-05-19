'use client'
import dynamic from 'next/dynamic'
import emptyAnimData from '../../public/animations/empty.json'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

interface Props {
  label?: string
}

export default function EmptyAnim({ label = 'Ничего не найдено' }: Props) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '50px 20px', gap: 8,
    }}>
      <div style={{ width: 140, height: 140, opacity: 0.7 }}>
        <Lottie animationData={emptyAnimData} loop />
      </div>
      <span style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
        {label}
      </span>
    </div>
  )
}
