import { configureStore } from '@reduxjs/toolkit'
import { authApi } from './services/authApi'
import { classApi } from './services/classApi'
import { studentApi } from './services/studentApi'
import { enrollmentApi } from './services/enrollmentApi'
import { curriculumApi } from './services/curriculumApi'
import { studentScheduleApi } from './services/studentScheduleApi'
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
    [classApi.reducerPath]: classApi.reducer,
    [studentApi.reducerPath]: studentApi.reducer,
    [enrollmentApi.reducerPath]: enrollmentApi.reducer,
    [curriculumApi.reducerPath]: curriculumApi.reducer,
    [studentScheduleApi.reducerPath]: studentScheduleApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    })
    .concat(authApi.middleware)
    .concat(classApi.middleware)
    .concat(studentApi.middleware)
    .concat(enrollmentApi.middleware)
    .concat(curriculumApi.middleware)
    .concat(studentScheduleApi.middleware),
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
