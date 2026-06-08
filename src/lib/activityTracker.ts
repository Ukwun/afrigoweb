/**
 * Activity Tracking System
 * Tracks all user interactions and stores them for analytics and real-time display
 */

export type ActivityType = 
  | 'auth_signup'
  | 'auth_signin'
  | 'auth_signout'
  | 'role_select'
  | 'action_click'
  | 'task_view'
  | 'task_complete'
  | 'navigation'
  | 'button_click'
  | 'page_view'
  | 'form_submit'

export interface Activity {
  id: string
  type: ActivityType
  userId?: string
  role?: string
  label: string
  detail?: string
  timestamp: number
  metadata?: Record<string, any>
}

class ActivityTracker {
  private activities: Activity[] = []
  private listeners: Set<(activity: Activity) => void> = new Set()
  private maxStoredActivities = 100

  /**
   * Log an activity
   */
  log(type: ActivityType, label: string, detail?: string, metadata?: Record<string, any>) {
    const userId = this.getUserId()
    const role = this.getUserRole()

    const activity: Activity = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      userId,
      role,
      label,
      detail,
      timestamp: Date.now(),
      metadata
    }

    // Store locally
    this.activities.unshift(activity)
    if (this.activities.length > this.maxStoredActivities) {
      this.activities.pop()
    }

    // Persist to localStorage
    this.persistActivity(activity)

    // Notify listeners
    this.listeners.forEach(listener => listener(activity))

    // Send to analytics endpoint (fire and forget)
    this.sendToAnalytics(activity).catch(err => {
      console.debug('Activity analytics error:', err)
    })

    return activity
  }

  /**
   * Subscribe to activity events
   */
  subscribe(listener: (activity: Activity) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Get recent activities
   */
  getRecent(limit: number = 20): Activity[] {
    return this.activities.slice(0, limit)
  }

  /**
   * Get activities by type
   */
  getByType(type: ActivityType, limit: number = 10): Activity[] {
    return this.activities.filter(a => a.type === type).slice(0, limit)
  }

  /**
   * Get activities by user role
   */
  getByRole(role: string, limit: number = 10): Activity[] {
    return this.activities.filter(a => a.role === role).slice(0, limit)
  }

  /**
   * Clear activity history
   */
  clear() {
    this.activities = []
    localStorage.removeItem('afrigo:activity_log')
  }

  /**
   * Get user ID from session
   */
  private getUserId(): string | undefined {
    if (typeof window === 'undefined') return undefined
    return localStorage.getItem('afrigo:user_id') || undefined
  }

  /**
   * Get user role from session
   */
  private getUserRole(): string | undefined {
    if (typeof window === 'undefined') return undefined
    return localStorage.getItem('afrigo:role') || undefined
  }

  /**
   * Persist activity to localStorage for recovery
   */
  private persistActivity(activity: Activity) {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('afrigo:activity_log')
      const activities = stored ? JSON.parse(stored) : []
      activities.unshift(activity)
      // Keep only last 50 activities in localStorage
      if (activities.length > 50) {
        activities.pop()
      }
      localStorage.setItem('afrigo:activity_log', JSON.stringify(activities))
    } catch (err) {
      console.debug('Failed to persist activity:', err)
    }
  }

  /**
   * Send activity to analytics endpoint
   */
  private async sendToAnalytics(activity: Activity) {
    try {
      // First attempt: send to real endpoint if available
      const response = await fetch('/api/analytics/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity)
      })

      if (!response.ok) {
        throw new Error(`Analytics request failed: ${response.status}`)
      }
    } catch (err) {
      console.debug('Analytics error (expected in demo):', err)
    }
  }
}

// Export singleton instance
export const activityTracker = new ActivityTracker()

/**
 * Hook for tracking activities in React components
 */
export function useActivityTracker() {
  return {
    log: activityTracker.log.bind(activityTracker),
    subscribe: activityTracker.subscribe.bind(activityTracker),
    getRecent: activityTracker.getRecent.bind(activityTracker),
    getByType: activityTracker.getByType.bind(activityTracker),
    getByRole: activityTracker.getByRole.bind(activityTracker)
  }
}
