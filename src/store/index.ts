import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "./services/authApi";
import { classApi } from "./services/classApi";
import { classCreationApi } from "./services/classCreationApi";
import { studentApi } from "./services/studentApi";
import { enrollmentApi } from "./services/enrollmentApi";
import { curriculumApi } from "./services/curriculumApi";
import { studentScheduleApi } from "./services/studentScheduleApi";
import { studentRequestApi } from "./services/studentRequestApi";
import { teacherRequestApi } from "./services/teacherRequestApi";
import { attendanceApi } from "./services/attendanceApi";
import { courseApi } from "./services/courseApi";
import { subjectApi } from "./services/subjectApi";
import { studentClassApi } from "./services/studentClassApi";
import { studentProfileApi } from "./services/studentProfileApi";
import { teacherScheduleApi } from "./services/teacherScheduleApi";
import { teacherGradeApi } from "./services/teacherGradeApi";
import { teacherProfileApi } from "./services/teacherProfileApi";
import { notificationApi } from "./services/notificationApi";
import { userApi } from "./services/userApi";
import { policyApi } from "./services/policyApi";
import { subjectAdminApi } from "./services/subjectAdminApi";
import { analyticsApi } from "./services/analyticsApi";
import { centerApi } from "./services/centerApi";
import { branchApi } from "./services/branchApi";
import { enumApi } from "./services/enumApi";
import { uploadApi } from "./services/uploadApi";
import { qaApi } from "./services/qaApi";
import { studentFeedbackApi } from "./services/studentFeedbackApi";
import { resourceApi } from "./services/resourceApi";
import { timeSlotApi } from "./services/timeSlotApi";
import { publicApi } from "./services/publicApi";
import { teacherApi } from "./services/teacherApi";
import { managerStaffApi } from "./services/managerStaffApi";
import { centerHeadApi } from "./services/centerHeadApi";

import authSlice, {
  setCredentials,
  logout,
  selectBranch,
  selectAuth,
  selectIsLoading,
  selectUser,
  selectUserRoles,
  selectHasRole,
  selectHasAnyRole,
  selectHasAllRoles,
  selectSelectedBranchId,
  selectUserBranches,
} from "./slices/authSlice";

import { teacherAvailabilityApi } from "./services/teacherAvailabilityApi";

export const store = configureStore({
  reducer: {
    auth: authSlice,
    [authApi.reducerPath]: authApi.reducer,
    [classApi.reducerPath]: classApi.reducer,
    [classCreationApi.reducerPath]: classCreationApi.reducer,
    [studentApi.reducerPath]: studentApi.reducer,
    [enrollmentApi.reducerPath]: enrollmentApi.reducer,
    [curriculumApi.reducerPath]: curriculumApi.reducer,
    [studentScheduleApi.reducerPath]: studentScheduleApi.reducer,
    [studentRequestApi.reducerPath]: studentRequestApi.reducer,
    [teacherRequestApi.reducerPath]: teacherRequestApi.reducer,
    [attendanceApi.reducerPath]: attendanceApi.reducer,
    [courseApi.reducerPath]: courseApi.reducer,
    [subjectApi.reducerPath]: subjectApi.reducer,
    [studentClassApi.reducerPath]: studentClassApi.reducer,
    [studentProfileApi.reducerPath]: studentProfileApi.reducer,
    [teacherScheduleApi.reducerPath]: teacherScheduleApi.reducer,
    [teacherGradeApi.reducerPath]: teacherGradeApi.reducer,
    [teacherProfileApi.reducerPath]: teacherProfileApi.reducer,
    [teacherAvailabilityApi.reducerPath]: teacherAvailabilityApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [policyApi.reducerPath]: policyApi.reducer,
    [centerApi.reducerPath]: centerApi.reducer,
    [branchApi.reducerPath]: branchApi.reducer,
    [subjectAdminApi.reducerPath]: subjectAdminApi.reducer,
    [analyticsApi.reducerPath]: analyticsApi.reducer,
    [enumApi.reducerPath]: enumApi.reducer,
    [uploadApi.reducerPath]: uploadApi.reducer,
    [qaApi.reducerPath]: qaApi.reducer,
    [studentFeedbackApi.reducerPath]: studentFeedbackApi.reducer,
    [resourceApi.reducerPath]: resourceApi.reducer,
    [timeSlotApi.reducerPath]: timeSlotApi.reducer,
    [publicApi.reducerPath]: publicApi.reducer,
    [teacherApi.reducerPath]: teacherApi.reducer,
    [managerStaffApi.reducerPath]: managerStaffApi.reducer,
    [centerHeadApi.reducerPath]: centerHeadApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          "enrollmentApi/executeQuery/fulfilled",
        ],
        ignoredPaths: ["enrollmentApi"],
      },
    })
      .concat(authApi.middleware)
      .concat(classApi.middleware)
      .concat(classCreationApi.middleware)
      .concat(studentApi.middleware)
      .concat(enrollmentApi.middleware)
      .concat(curriculumApi.middleware)
      .concat(studentScheduleApi.middleware)
      .concat(studentRequestApi.middleware)
      .concat(teacherRequestApi.middleware)
      .concat(attendanceApi.middleware)
      .concat(courseApi.middleware)
      .concat(subjectApi.middleware)
      .concat(studentClassApi.middleware)
      .concat(studentProfileApi.middleware)
      .concat(teacherScheduleApi.middleware)
      .concat(teacherGradeApi.middleware)
      .concat(teacherProfileApi.middleware)
      .concat(teacherAvailabilityApi.middleware)
      .concat(notificationApi.middleware)
      .concat(userApi.middleware)
      .concat(policyApi.middleware)
      .concat(centerApi.middleware)
      .concat(branchApi.middleware)
      .concat(subjectAdminApi.middleware)
      .concat(analyticsApi.middleware)
      .concat(enumApi.middleware)
      .concat(uploadApi.middleware)
      .concat(qaApi.middleware)
      .concat(studentFeedbackApi.middleware)
      .concat(resourceApi.middleware)
      .concat(timeSlotApi.middleware)
      .concat(publicApi.middleware)
      .concat(teacherApi.middleware)
      .concat(managerStaffApi.middleware)
      .concat(centerHeadApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export auth slice actions and selectors
export {
  setCredentials,
  logout,
  selectBranch,
  selectAuth,
  selectIsLoading,
  selectUser,
  selectUserRoles,
  selectHasRole,
  selectHasAnyRole,
  selectHasAllRoles,
  selectSelectedBranchId,
  selectUserBranches,
};
