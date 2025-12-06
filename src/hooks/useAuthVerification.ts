import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRefreshTokenMutation } from '@/store/services/authApi'
import { logout } from '@/store'
import type { RootState } from '@/store'

export function useAuthVerification() {
  const dispatch = useDispatch()
  const { accessToken, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [refreshTokenMutation, { isLoading }] = useRefreshTokenMutation()
  
  // Track if we've already verified this session
  // This prevents re-verification after fresh login
  const hasVerified = useRef(false)
  const initialToken = useRef(accessToken)

  useEffect(() => {
    const verifyToken = async () => {
      // Only verify on initial page load when we have a token from localStorage
      // Skip if:
      // 1. We've already verified in this session
      // 2. Token changed (means fresh login just happened)
      // 3. No token/not authenticated
      if (hasVerified.current) {
        return
      }
      
      // If token changed from initial (fresh login), don't verify
      if (accessToken !== initialToken.current) {
        hasVerified.current = true
        return
      }

      if (!accessToken || !isAuthenticated) {
        return
      }

      hasVerified.current = true

      try {
        // Try to use refresh token to verify current session
        const refreshResult = await refreshTokenMutation({
          refreshToken: localStorage.getItem('refreshToken') || ''
        }).unwrap()

        if (!refreshResult?.success || !refreshResult?.data) {
          // Refresh token invalid or expired -> clear auth state
          dispatch(logout())
          return
        }

        // Update auth state with fresh tokens
        dispatch({
          type: 'auth/setCredentials',
          payload: {
            accessToken: refreshResult.data.accessToken,
            refreshToken: refreshResult.data.refreshToken,
            user: {
              id: refreshResult.data.userId,
              email: refreshResult.data.email,
              fullName: refreshResult.data.fullName,
              avatarUrl: refreshResult.data.avatarUrl,
              roles: refreshResult.data.roles,
              branchId: refreshResult.data.branchId,
              branches: refreshResult.data.branches || [],
            },
          },
        })
      } catch {
        // Token is invalid, clear auth state
        dispatch(logout())
      }
    }

    verifyToken()
  }, [accessToken, isAuthenticated, dispatch, refreshTokenMutation])

  return { isLoading }
}
