import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface User {
  id: number
  email: string
  fullName: string
  roles: string[]
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

// Initialize state from localStorage if available
const getInitialState = (): AuthState => {
  try {
    const storedToken = localStorage.getItem('accessToken')
    const storedRefreshToken = localStorage.getItem('refreshToken')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      // Parse user data
      const user = JSON.parse(storedUser)

      // Basic validation - check if user data looks valid
      if (user && user.email && user.fullName) {
        return {
          ...initialState,
          accessToken: storedToken,
          refreshToken: storedRefreshToken,
          user: user,
          isAuthenticated: true,
        }
      } else {
        // Clear invalid data
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
      }
    }
  } catch {
    // Clear corrupted data
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  }

  return initialState
}

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    setCredentials: (state, action: PayloadAction<{
      accessToken: string
      refreshToken: string
      user: User
    }>) => {
      const { accessToken, refreshToken, user } = action.payload

      state.accessToken = accessToken
      state.refreshToken = refreshToken
      state.user = user
      state.isAuthenticated = true
      state.error = null

      // Store in localStorage for persistence
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(user))
    },

    logout: (state) => {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.error = null

      // Clear localStorage
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    clearError: (state) => {
      state.error = null
    },
  },
})

export const {
  setCredentials,
  logout,
  setLoading,
  setError,
  clearError,
} = authSlice.actions

export default authSlice.reducer

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth
export const selectUser = (state: { auth: AuthState }) => state.auth.user
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated
export const selectUserRoles = (state: { auth: AuthState }) => state.auth.user?.roles || []
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error
export const selectIsLoading = (state: { auth: AuthState }) => state.auth.isLoading

// Role-based utility selectors
export const selectHasRole = (state: { auth: AuthState }, requiredRole: string) => {
  const userRoles = selectUserRoles(state)
  return userRoles.includes(requiredRole)
}

export const selectHasAnyRole = (state: { auth: AuthState }, requiredRoles: string[]) => {
  const userRoles = selectUserRoles(state)
  return requiredRoles.some(role => userRoles.includes(role))
}

export const selectHasAllRoles = (state: { auth: AuthState }, requiredRoles: string[]) => {
  const userRoles = selectUserRoles(state)
  return requiredRoles.every(role => userRoles.includes(role))
}