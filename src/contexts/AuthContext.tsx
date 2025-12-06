import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useLoginMutation, useLogoutMutation } from '@/store/services/authApi'
import { setCredentials, logout as logoutAction, selectAuth, selectBranch as selectBranchAction, selectSelectedBranchId, selectNeedsBranchOnboarding } from '@/store'
import { useAuthVerification } from '@/hooks/useAuthVerification'
import type { User, BranchInfo } from '@/store/slices/authSlice'
import type { RootState } from '@/store'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>
  logout: () => void
  selectBranch: (branchId: number) => void
  selectedBranchId: number | null
  needsBranchOnboarding: boolean
  branches: BranchInfo[]
  isLoading: boolean
  error: string | null
  clearError: () => void
}

/* eslint-disable react-refresh/only-export-components */
export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch()
  const auth = useSelector((state: RootState) => selectAuth(state))
  const selectedBranchId = useSelector((state: RootState) => selectSelectedBranchId(state))
  const needsBranchOnboarding = useSelector((state: RootState) => selectNeedsBranchOnboarding(state))
  const { isLoading: isVerifying } = useAuthVerification()
  const [loginMutation, { isLoading: isLoginLoading }] = useLoginMutation()
  const [logoutMutation] = useLogoutMutation()

  const selectBranch = (branchId: number) => {
    dispatch(selectBranchAction(branchId))
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const result = await loginMutation({ email, password }).unwrap()

      // Backend returns response with wrapper: {success, message, data}
      if (result?.success && result?.data) {
        const user: User = {
          id: result.data.userId,
          email: result.data.email,
          fullName: result.data.fullName,
          avatarUrl: result.data.avatarUrl,
          roles: result.data.roles,
          branchId: result.data.branchId,
          branches: result.data.branches || [],
        }
        dispatch(setCredentials({
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
          user,
        }))
        return { success: true, user }
      }

      return { success: false, error: result?.message || 'Phản hồi không hợp lệ từ máy chủ' }
    } catch (error: unknown) {
      let errorMessage = 'Đăng nhập thất bại'
      if (error && typeof error === 'object' && 'data' in error) {
        const errorData = (error as { data?: { message?: string; error?: string } }).data
        errorMessage = errorData?.message || errorData?.error || 'Đăng nhập thất bại'
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as { message?: string }).message || 'Đăng nhập thất bại'
      }

      return { success: false, error: errorMessage }
    }
  }

  const logout = async () => {
    try {
      await logoutMutation().unwrap()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      dispatch(logoutAction())
    }
  }

  const clearError = () => {
    dispatch({ type: 'auth/clearError' })
  }

  const value: AuthContextType = {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    login,
    logout,
    selectBranch,
    selectedBranchId,
    needsBranchOnboarding,
    branches: auth.user?.branches || [],
    isLoading: isLoginLoading || auth.isLoading || isVerifying,
    error: auth.error,
    clearError,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
