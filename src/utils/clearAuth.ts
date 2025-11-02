// Utility to clear all authentication data from localStorage
export function clearAuthData() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as unknown as Window & { clearAuthData: () => void }).clearAuthData = clearAuthData
}