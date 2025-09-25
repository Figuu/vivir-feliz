// Client-side session utilities
export async function createSession(loginMethod: string = 'email'): Promise<void> {
  try {
    const response = await fetch('/api/sessions/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ loginMethod }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.warn('Failed to create session:', errorData.error)
      return // Don't throw to prevent login interruption
    }

    const result = await response.json()
    console.log('Session created successfully:', result.sessionId)
  } catch (error) {
    console.error('Failed to create session (network error):', error)
    // Don't throw error to prevent login interruption
  }
}

export async function updateSessionActivity(): Promise<void> {
  // This could be called periodically to update last activity
  // For now, we'll skip implementation as sessions are updated on API calls
}