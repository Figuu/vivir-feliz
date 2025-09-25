export function getAppUrl() {
  // Use environment variable if set, otherwise fallback to window.location.origin
  // This ensures the correct URL is used in both development and production
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  // Fallback for client-side when env var is not set
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  // Fallback for server-side rendering
  return 'http://localhost:3000'
}