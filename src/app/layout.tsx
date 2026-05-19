import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import GlobalNavbar from '@/components/GlobalNavbar'
import { NavbarSlotProvider } from '@/components/NavbarSlot'
import AuthProvider from '@/components/AuthProvider'
import ProgressSync from '@/components/ProgressSync'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-sans', display: 'swap' })

export const metadata: Metadata = {
  title: 'Algoose',
  description: 'Тренировка алгоритмов для собеса',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Anti-flash: set saved theme before first paint */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('algoose_theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}` }} />
      </head>
      <body>
        <AuthProvider>
          <ThemeProvider>
            <NavbarSlotProvider>
              <ProgressSync />
              <GlobalNavbar />
              {children}
            </NavbarSlotProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
