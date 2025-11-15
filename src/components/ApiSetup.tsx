import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useDispatch } from 'react-redux'
import { setupListeners } from '@reduxjs/toolkit/query'

export function ApiSetup({ children }: { children: ReactNode }) {
  const dispatch = useDispatch()

  useEffect(() => {
    // Setup listeners for RTK Query
    const unsubscribe = setupListeners(dispatch)
    return unsubscribe
  }, [dispatch])

  return <>{children}</>
}