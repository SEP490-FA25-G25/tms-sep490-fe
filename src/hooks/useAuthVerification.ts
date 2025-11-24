import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRefreshTokenMutation } from '@/store/services/authApi'
import { logout } from '@/store'
import type { RootState } from '@/store'

export function useAuthVerification() {
  const dispatch = useDispatch()
  const { accessToken, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [refreshTokenMutation, { isLoading }] = useRefreshTokenMutation()

  useEffect(() => {
    const verifyToken = async () => {
      // If we have a token, try to verify it by refreshing
      if (accessToken && isAuthenticated) {
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
                roles: refreshResult.data.roles,
              },
            },
          })
        } catch {
          // Token is invalid, clear auth state
          dispatch(logout())
        }
      }
    }

    verifyToken()
  }, [accessToken, isAuthenticated, dispatch, refreshTokenMutation])

  return { isLoading }
}
