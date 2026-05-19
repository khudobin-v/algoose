'use client'
import { useTheme } from '@/components/ThemeProvider'

interface Props {
  size?: number
  /**
   * 'default' (default): goose that reads on the page background
   *   — white goose on dark theme, black goose on light theme
   * 'box': goose that reads inside a var(--text) box
   *   — black goose on dark theme (box is near-white), white goose on light theme (box is near-black)
   */
  context?: 'default' | 'box'
}

export default function AlgooseLogo({ size = 28, context = 'default' }: Props) {
  const { theme } = useTheme()

  const useBlack =
    context === 'box'
      ? theme === 'dark'   // dark theme → box is white → black goose
      : theme === 'light'  // light theme → page is white → black goose

  return (
    <img
      src={useBlack ? '/goose-black.svg' : '/goose-white.svg'}
      alt="Algoose"
      width={size}
      height={size}
      style={{ display: 'block', objectFit: 'contain' }}
    />
  )
}
