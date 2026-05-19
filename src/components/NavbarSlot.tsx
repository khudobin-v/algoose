'use client'
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface NavbarSlotCtx {
  slot: ReactNode
  setSlot: (node: ReactNode) => void
  clearSlot: () => void
}

const Ctx = createContext<NavbarSlotCtx>({
  slot: null,
  setSlot: () => {},
  clearSlot: () => {},
})

export function NavbarSlotProvider({ children }: { children: ReactNode }) {
  const [slot, setSlotState] = useState<ReactNode>(null)
  const setSlot = useCallback((node: ReactNode) => setSlotState(node), [])
  const clearSlot = useCallback(() => setSlotState(null), [])
  return <Ctx.Provider value={{ slot, setSlot, clearSlot }}>{children}</Ctx.Provider>
}

export function useNavbarSlot() {
  return useContext(Ctx)
}

export function NavbarSlotRenderer() {
  const { slot } = useContext(Ctx)
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
      {slot}
    </div>
  )
}
