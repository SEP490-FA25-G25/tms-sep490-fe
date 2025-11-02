import { configureStore } from '@reduxjs/toolkit'
import { authApi } from './services/authApi'
import authSlice, {
  setCredentials,
  logout,
  selectAuth,
  selectIsLoading,
  selectUser,
  selectUserRoles,
  selectHasRole,
  selectHasAnyRole,
  selectHasAllRoles,
} from './slices/authSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    [authApi.reducerPath]: authApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    })
    .concat(authApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Export auth slice actions and selectors
export {
  setCredentials,
  logout,
  selectAuth,
  selectIsLoading,
  selectUser,
  selectUserRoles,
  selectHasRole,
  selectHasAnyRole,
  selectHasAllRoles,
}