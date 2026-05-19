'use client'
import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { pullProgress, pushProgress } from '@/lib/syncProgress'

export default function ProgressSync() {
  const { data: session, status } = useSession()
  const pulled = useRef(false)

  // Pull from DB on first authenticated load
  useEffect(() => {
    if (status !== 'authenticated' || pulled.current) return
    pulled.current = true
    pullProgress()
  }, [status])

  // Push to DB when page hides/closes
  useEffect(() => {
    if (!session) return
    function push() { pushProgress() }
    window.addEventListener('pagehide', push)
    window.addEventListener('beforeunload', push)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') push()
    })
    return () => {
      window.removeEventListener('pagehide', push)
      window.removeEventListener('beforeunload', push)
    }
  }, [session])

  return null
}
